"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  RefreshCw,
  TrendingUp,
  Receipt,
  RotateCcw,
  Package,
  Users,
  Store,
  Target,
  ChevronLeft,
  ChevronRight,
  Banknote,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CashExpense } from "@/lib/expense-actions";
import {
  getMonitoringReports,
  type CashierReportRow,
  type DailyReportRow,
  type ReturnReportRow,
  type ProductReportRow,
  type ReceiptReportRow,
  type PerformanceReportRow,
  type MonitoringReportsPayload,
  type PaymentBreakdown,
} from "@/lib/report-actions";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types ───────────────────────────────────────────────────────────────────

type ReportTab =
  | "cashier"
  | "daily"
  | "returns"
  | "product"
  | "receipts"
  | "performance"
  | "expenses";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (v: number | null | undefined) =>
  v == null
    ? "—"
    : new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(v);

const formatNumber = (v: number) => new Intl.NumberFormat("en-PH").format(v);

const emptyPayments = (): PaymentBreakdown => ({
  cash: 0,
  card: 0,
  gcash: 0,
  maya: 0,
  bankTransfer: 0,
  credit: 0,
  other: 0,
});

const emptyPayload = (): MonitoringReportsPayload => ({
  summary: {
    totalSales: 0,
    totalItems: 0,
    totalTransactions: 0,
    totalDiscounts: 0,
    totalVat: 0,
    totalCharges: 0,
    payments: emptyPayments(),
  },
  cashiers: [],
  daily: [],
  returns: [],
  products: [],
  receipts: [],
  performance: [],
});

function escapeCsv(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function rowsToCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((r) => r.map(escapeCsv).join(",")),
  ];
  // BOM so Excel opens UTF-8 correctly
  return "\uFEFF" + lines.join("\r\n");
}

function exportExcel(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const csv = rowsToCsv(headers, rows);
  downloadBlob(
    filename.endsWith(".csv") ? filename : `${filename}.csv`,
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
}

const BRAND = { r: 243, g: 101, b: 9 }; // #F36509
const INK = { r: 28, g: 25, b: 23 };
const MUTED = { r: 120, g: 113, b: 108 };
const STONE = { r: 250, g: 250, b: 249 };
const BORDER = { r: 231, g: 229, b: 228 };
const PAGE_MARGIN = 14;
const HEADER_Y = 32;

function exportPdf(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const generatedAt = new Date().toLocaleString();

  // ── Header ──────────────────────────────────────────────
  doc.setFontSize(9);
  doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
  doc.text("iHub POS · Reports", PAGE_MARGIN, 11);

  doc.setFontSize(15);
  doc.setTextColor(INK.r, INK.g, INK.b);
  doc.text(title, PAGE_MARGIN, 18);

  doc.setFontSize(9);
  doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
  doc.text(subtitle, PAGE_MARGIN, 24);
  doc.text(`Generated ${generatedAt}`, pageWidth - PAGE_MARGIN, 24, {
    align: "right",
  });

  doc.setDrawColor(BORDER.r, BORDER.g, BORDER.b);
  doc.setLineWidth(0.3);
  doc.line(PAGE_MARGIN, 27, pageWidth - PAGE_MARGIN, 27);

  // ── Table ───────────────────────────────────────────────
  autoTable(doc, {
    startY: HEADER_Y,
    head: [headers],
    body: rows.map((r) => r.map((c) => String(c ?? ""))),
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: 20 },
    styles: {
      fontSize: 6.5, // was 8
      cellPadding: 1.5, // was 2.5
      textColor: [INK.r, INK.g, INK.b],
      lineColor: [BORDER.r, BORDER.g, BORDER.b],
      lineWidth: 0.1,
      valign: "middle",
      overflow: "linebreak", // explicit
    },
    headStyles: {
      fillColor: [STONE.r, STONE.g, STONE.b],
      textColor: [MUTED.r, MUTED.g, MUTED.b],
      fontStyle: "bold",
      fontSize: 6.5,
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    // Right-align purely-numeric columns so amounts line up
    columnStyles: Object.fromEntries(
      headers.map((_, i) => {
        const isNumeric = rows.every(
          (r) => typeof r[i] === "number" || r[i] == null,
        );
        return [
          i,
          isNumeric
            ? { halign: "right" as const, cellWidth: "wrap", minCellWidth: 12 }
            : { cellWidth: "auto" },
        ];
      }),
    ),
    // Repeat the header row + draw footer on every page
    didDrawPage: () => {
      const pageCount = doc.getNumberOfPages();
      const pageH = doc.internal.pageSize.getHeight();

      doc.setFontSize(7.5);
      doc.setTextColor(MUTED.r, MUTED.g, MUTED.b);
      doc.text("iHub POS · Confidential", PAGE_MARGIN, pageH - 8);
      doc.text(
        `Page ${doc.getCurrentPageInfo().pageNumber} of ${pageCount}`,
        pageWidth - PAGE_MARGIN,
        pageH - 8,
        {
          align: "right",
        },
      );
    },
  });

  // ── Open / download ─────────────────────────────────────
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank", "noopener");

  if (!w) {
    toast.error("Pop-up blocked — PDF downloaded instead.");
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const headCls = "px-5 py-3.5 text-right font-medium text-stone-500";
const cellRight = "px-5 py-4 text-right tabular-nums";

const RETURN_STYLES: Record<string, string> = {
  refunded: "border-emerald-200 bg-emerald-50 text-emerald-700",
  replaced: "border-sky-200 bg-sky-50 text-sky-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  voided: "border-red-200 bg-red-50 text-red-700",
};

const EXPENSE_STATUS_STYLES: Record<string, string> = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  draft: "border-stone-200 bg-stone-50 text-stone-600",
  void: "border-red-200 bg-red-50 text-red-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

const PAYMENT_STYLES: Record<string, string> = {
  cash: "border-stone-200 bg-stone-50 text-stone-600",
  card: "border-sky-200 bg-sky-50 text-sky-700",
  gcash: "border-blue-200 bg-blue-50 text-blue-700",
  maya: "border-violet-200 bg-violet-50 text-violet-700",
  other: "border-stone-200 bg-stone-50 text-stone-600",
};

const TABS: { id: ReportTab; label: string; icon: typeof Users }[] = [
  { id: "cashier", label: "Cashier Sales", icon: Users },
  { id: "daily", label: "Daily Sales", icon: Calendar },
  { id: "returns", label: "Customer Returns", icon: RotateCcw },
  { id: "product", label: "Product Sales", icon: Package },
  { id: "receipts", label: "Receipt Details", icon: Receipt },
  { id: "performance", label: "Performance", icon: Target },
  { id: "expenses", label: "Expenses", icon: Banknote },
];

// ─── Page ────────────────────────────────────────────────────────────────────

type Props = {
  expenses?: CashExpense[];
};

export default function ReportsClient({ expenses = [] }: Props) {
  const [activeTab, setActiveTab] = useState<ReportTab>("cashier");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MonitoringReportsPayload>(emptyPayload);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [isEditingRange, setIsEditingRange] = useState(false);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMonitoringReports({ startDate, endDate });
      if (!result.success || !result.data) {
        setError(result.error || "Failed to load reports");
        setData(emptyPayload());
        toast.error(result.error || "Failed to load reports");
      } else {
        setData(result.data);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load reports";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const shiftRange = (days: number) => {
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    start.setDate(start.getDate() + days);
    end.setDate(end.getDate() + days);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  const filteredExpenses = useMemo(() => {
    const from = new Date(startDate + "T00:00:00").getTime();
    const to = new Date(endDate + "T23:59:59").getTime();
    return expenses.filter((e) => {
      const t = new Date(e.occurred_at).getTime();
      return t >= from && t <= to;
    });
  }, [expenses, startDate, endDate]);

  const expenseStats = useMemo(() => {
    const active = filteredExpenses.filter(
      (e) => !["void", "cancelled"].includes(e.status),
    );
    const cashTotal = active
      .filter((e) => e.payment_method === "cash")
      .reduce((s, e) => s + e.amount, 0);
    const allTotal = active.reduce((s, e) => s + e.amount, 0);
    const voided = filteredExpenses.filter((e) =>
      ["void", "cancelled"].includes(e.status),
    ).length;
    return { count: active.length, cashTotal, allTotal, voided };
  }, [filteredExpenses]);

  const rangeLabel = useMemo(() => {
    const fmt = (d: string) =>
      new Date(d + "T00:00:00").toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    return `${fmt(startDate)} – ${fmt(endDate)}`;
  }, [startDate, endDate]);

  const kpis = useMemo(() => {
    const s = data.summary;
    switch (activeTab) {
      case "cashier":
        return [
          {
            label: "Net Sales",
            value: formatCurrency(s.totalSales - s.totalDiscounts),
            sub: "All cashiers",
            icon: TrendingUp,
            iconCls: "bg-orange-50 text-[#F36509]",
          },
          {
            label: "VAT Amount",
            value: formatCurrency(s.totalVat),
            sub: "12% Output VAT (est.)",
            icon: Receipt,
            iconCls: "bg-amber-50 text-amber-600",
          },
          {
            label: "Discounts",
            value: formatCurrency(s.totalDiscounts),
            sub: "Total given",
            icon: RotateCcw,
            iconCls: "bg-red-50 text-red-600",
          },
          {
            label: "Cash Collected",
            value: formatCurrency(s.payments.cash),
            sub: "Physical cash",
            icon: Store,
            iconCls: "bg-emerald-50 text-emerald-600",
          },
        ];
      case "daily":
        return [
          {
            label: "Gross Sales",
            value: formatCurrency(s.totalSales),
            sub: "Period shown",
            icon: TrendingUp,
            iconCls: "bg-orange-50 text-[#F36509]",
          },
          {
            label: "Net Sales",
            value: formatCurrency(s.totalSales - s.totalDiscounts),
            sub: "After discounts",
            icon: Store,
            iconCls: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Transactions",
            value: formatNumber(s.totalTransactions),
            sub: "Completed orders",
            icon: Receipt,
            iconCls: "bg-sky-50 text-sky-600",
          },
          {
            label: "Items Sold",
            value: formatNumber(s.totalItems),
            sub: "Line quantities",
            icon: Package,
            iconCls: "bg-violet-50 text-violet-600",
          },
        ];
      case "returns":
        return [
          {
            label: "Returns / Voids",
            value: formatNumber(data.returns.length),
            sub: "Line items",
            icon: RotateCcw,
            iconCls: "bg-red-50 text-red-600",
          },
          {
            label: "Amount",
            value: formatCurrency(
              data.returns.reduce((sum, r) => sum + r.amount, 0),
            ),
            sub: "Voided total",
            icon: Banknote,
            iconCls: "bg-amber-50 text-amber-600",
          },
          {
            label: "Gross Sales",
            value: formatCurrency(s.totalSales),
            sub: "For comparison",
            icon: TrendingUp,
            iconCls: "bg-orange-50 text-[#F36509]",
          },
          {
            label: "Net after voids*",
            value: formatCurrency(
              s.totalSales - data.returns.reduce((sum, r) => sum + r.amount, 0),
            ),
            sub: "*Indicative",
            icon: Store,
            iconCls: "bg-emerald-50 text-emerald-600",
          },
        ];
      case "product":
        return [
          {
            label: "Products",
            value: formatNumber(data.products.length),
            sub: "SKUs in range",
            icon: Package,
            iconCls: "bg-violet-50 text-violet-600",
          },
          {
            label: "Units sold",
            value: formatNumber(data.products.reduce((a, p) => a + p.sold, 0)),
            sub: "Gross qty",
            icon: TrendingUp,
            iconCls: "bg-orange-50 text-[#F36509]",
          },
          {
            label: "Revenue",
            value: formatCurrency(
              data.products.reduce((a, p) => a + p.revenue, 0),
            ),
            sub: "Line totals",
            icon: Banknote,
            iconCls: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Returned qty",
            value: formatNumber(
              data.products.reduce((a, p) => a + p.returned, 0),
            ),
            sub: "From voids",
            icon: RotateCcw,
            iconCls: "bg-red-50 text-red-600",
          },
        ];
      case "receipts":
        return [
          {
            label: "Receipts",
            value: formatNumber(data.receipts.length),
            sub: "Completed",
            icon: Receipt,
            iconCls: "bg-sky-50 text-sky-600",
          },
          {
            label: "Gross Sales",
            value: formatCurrency(s.totalSales),
            sub: rangeLabel,
            icon: TrendingUp,
            iconCls: "bg-orange-50 text-[#F36509]",
          },
          {
            label: "Avg Ticket",
            value: formatCurrency(
              s.totalTransactions > 0 ? s.totalSales / s.totalTransactions : 0,
            ),
            sub: "Per receipt",
            icon: Target,
            iconCls: "bg-amber-50 text-amber-600",
          },
          {
            label: "Items",
            value: formatNumber(s.totalItems),
            sub: "All receipts",
            icon: Package,
            iconCls: "bg-violet-50 text-violet-600",
          },
        ];
      case "performance":
        return [
          {
            label: "Tracked",
            value: formatNumber(data.performance.length),
            sub: "Cashiers / branches",
            icon: Target,
            iconCls: "bg-amber-50 text-amber-600",
          },
          {
            label: "Actual Sales",
            value: formatCurrency(
              data.performance.reduce((a, p) => a + p.actual, 0),
            ),
            sub: "Sum of actuals",
            icon: TrendingUp,
            iconCls: "bg-orange-50 text-[#F36509]",
          },
          {
            label: "Targets",
            value: formatCurrency(
              data.performance.reduce((a, p) => a + p.target, 0),
            ),
            sub: "Configured quotas",
            icon: Store,
            iconCls: "bg-sky-50 text-sky-600",
          },
          {
            label: "Returns",
            value: formatCurrency(
              data.performance.reduce((a, p) => a + p.returns, 0),
            ),
            sub: "Attributed",
            icon: RotateCcw,
            iconCls: "bg-red-50 text-red-600",
          },
        ];
      case "expenses":
        return [
          {
            label: "Expense count",
            value: formatNumber(expenseStats.count),
            sub: "Active in range",
            icon: Banknote,
            iconCls: "bg-amber-50 text-amber-600",
          },
          {
            label: "Total amount",
            value: formatCurrency(expenseStats.allTotal),
            sub: "All methods",
            icon: TrendingUp,
            iconCls: "bg-orange-50 text-[#F36509]",
          },
          {
            label: "Cash expenses",
            value: formatCurrency(expenseStats.cashTotal),
            sub: "Cash drawer impact",
            icon: Store,
            iconCls: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Voided",
            value: formatNumber(expenseStats.voided),
            sub: "Excluded from totals",
            icon: RotateCcw,
            iconCls: "bg-red-50 text-red-600",
          },
        ];
      default:
        return [];
    }
  }, [activeTab, data, expenseStats, rangeLabel]);

  // ─── Export builders ───────────────────────────────────────────────────────

  const buildExport = useCallback((): {
    title: string;
    headers: string[];
    rows: (string | number)[][];
  } => {
    switch (activeTab) {
      case "cashier":
        return {
          title: "Cashier Sales Report",
          headers: [
            "Cashier",
            "Branch",
            "Gross Sales",
            "Vatable Sales",
            "Discounts",
            "Charges",
            "VAT Amount",
            "Net Sales",
            "Cash",
            "Card",
            "GCash",
            "Maya",
            "Other",
            "Txns",
            "Items",
            "Refunds",
            "Avg Ticket",
          ],
          rows: data.cashiers.map((r: CashierReportRow) => [
            r.name,
            r.branch,
            r.grossSales,
            r.vatableSales,
            r.discounts,
            r.charges,
            r.vatAmount,
            r.netSales,
            r.payments.cash,
            r.payments.card,
            r.payments.gcash,
            r.payments.maya,
            r.payments.other + r.payments.bankTransfer + r.payments.credit,
            r.transactions,
            r.items,
            r.refundsAmount,
            r.avgTicket,
          ]),
        };
      case "daily":
        return {
          title: "Daily Sales Report",
          headers: [
            "Date",
            "Receipt Begin",
            "Receipt End",
            "Sales Begin",
            "Sales End",
            "Vatable Sales",
            "Cash",
            "Card",
            "GCash",
            "PayMaya",
            "Credit",
            "Bank Transfer",
            "Discount",
            "Net",
            "Txns",
            "Items",
          ],
          rows: data.daily.map((r: DailyReportRow) => [
            r.date,
            r.receiptBegin,
            r.receiptEnd,
            r.salesBegin,
            r.salesEnd,
            r.vatableSales,
            r.payments.cash,
            r.payments.card,
            r.payments.gcash,
            r.payments.maya,
            r.payments.credit,
            r.payments.bankTransfer,
            r.discounts,
            r.net,
            r.transactions,
            r.items,
          ]),
        };
      case "returns":
        return {
          title: "Customer Returns / Voids Report",
          headers: [
            "Receipt",
            "Product",
            "Cashier",
            "Qty",
            "Amount",
            "Reason",
            "Status",
            "Date",
          ],
          rows: data.returns.map((r: ReturnReportRow) => [
            r.receiptNo,
            r.product,
            r.cashier,
            r.qty,
            r.amount,
            r.reason,
            r.status,
            r.date,
          ]),
        };
      case "product":
        return {
          title: "Product Sales Report",
          headers: [
            "Product",
            "Category",
            "Sold",
            "Returned",
            "Net Qty",
            "Revenue",
            "Avg Price",
          ],
          rows: data.products.map((r: ProductReportRow) => [
            r.name,
            r.category,
            r.sold,
            r.returned,
            r.netQty,
            r.revenue,
            r.avgPrice,
          ]),
        };
      case "receipts":
        return {
          title: "Receipt Details Report",
          headers: [
            "Receipt",
            "Cashier",
            "Branch",
            "Items",
            "Total",
            "Payment",
            "Date",
          ],
          rows: data.receipts.map((r: ReceiptReportRow) => [
            r.receiptNo,
            r.cashier,
            r.branch,
            r.items,
            r.total,
            r.payment,
            r.date,
          ]),
        };
      case "performance":
        return {
          title: "Performance Report",
          headers: [
            "Name",
            "Type",
            "Target",
            "Actual",
            "Returns",
            "Net",
            "Progress %",
            "Period",
          ],
          rows: data.performance.map((r: PerformanceReportRow) => {
            const net = r.actual - r.returns;
            const progress =
              r.target > 0
                ? Number(((r.actual / r.target) * 100).toFixed(1))
                : 0;
            return [
              r.name,
              r.type,
              r.target,
              r.actual,
              r.returns,
              net,
              progress,
              r.period,
            ];
          }),
        };
      case "expenses":
        return {
          title: "Expenses Report",
          headers: [
            "When",
            "Description",
            "Category",
            "Shift",
            "Method",
            "Reference",
            "Status",
            "Amount",
          ],
          rows: filteredExpenses.map((e) => [
            new Date(e.occurred_at).toLocaleString("en-PH"),
            e.description,
            e.category_name || "—",
            e.shift_number || e.shift_id?.slice(0, 8) || "—",
            e.payment_method,
            e.reference_number || "—",
            e.status,
            e.amount,
          ]),
        };
      default:
        return { title: "Report", headers: [], rows: [] };
    }
  }, [activeTab, data, filteredExpenses]);

  const handleExportExcel = () => {
    const { title, headers, rows } = buildExport();
    if (!headers.length) {
      toast.error("Nothing to export");
      return;
    }
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    exportExcel(`ihub-${slug}-${startDate}_to_${endDate}`, headers, rows);
    toast.success("Excel (CSV) download started");
  };

  const handleExportPdf = () => {
    const { title, headers, rows } = buildExport();
    if (!headers.length) {
      toast.error("Nothing to export");
      return;
    }
    // Format numbers for readable PDF
    const pretty = rows.map((r) =>
      r.map((c) =>
        typeof c === "number"
          ? Number.isInteger(c)
            ? formatNumber(c)
            : formatCurrency(c)
          : c,
      ),
    );
    exportPdf(title, rangeLabel, headers, pretty);
    toast.success("PDF print dialog opened");
  };

  const isEmpty =
    !isLoading &&
    ((activeTab === "cashier" && data.cashiers.length === 0) ||
      (activeTab === "daily" && data.daily.length === 0) ||
      (activeTab === "returns" && data.returns.length === 0) ||
      (activeTab === "product" && data.products.length === 0) ||
      (activeTab === "receipts" && data.receipts.length === 0) ||
      (activeTab === "performance" && data.performance.length === 0) ||
      (activeTab === "expenses" && filteredExpenses.length === 0));

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">
              POS Reports
            </h1>
            <p className="mt-0.5 text-sm text-stone-500">
              Sales, returns, products, receipts, performance, and expenses
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-11 overflow-hidden rounded-xl border border-stone-200 bg-white">
              <button
                type="button"
                onClick={() => shiftRange(-15)}
                title="Previous 15 days"
                className="flex w-11 shrink-0 items-center justify-center bg-[#F36509]/10 text-[#F36509] transition-colors hover:bg-[#F36509]/20"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex min-w-0 flex-1 items-center">
                {isEditingRange ? (
                  <div className="flex items-center gap-1 px-2">
                    <input
                      type="date"
                      value={startDate}
                      max={endDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-8 w-[130px] rounded-md border border-stone-200 bg-white px-2 text-sm font-medium text-stone-800 outline-none focus:border-[#F36509]"
                    />
                    <span className="text-stone-400">–</span>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-8 w-[130px] rounded-md border border-stone-200 bg-white px-2 text-sm font-medium text-stone-800 outline-none focus:border-[#F36509]"
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 bg-[#F36509] hover:bg-[#d95a08]"
                      onClick={() => setIsEditingRange(false)}
                    >
                      Apply
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingRange(true)}
                    className="flex h-full w-full items-center justify-center gap-1.5 px-3 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-50"
                    title="Click to edit dates"
                  >
                    <span>
                      {new Date(startDate + "T00:00:00").toLocaleDateString(
                        "en-PH",
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                    </span>
                    <span className="text-stone-400">–</span>
                    <span>
                      {new Date(endDate + "T00:00:00").toLocaleDateString(
                        "en-PH",
                        { month: "short", day: "numeric", year: "numeric" },
                      )}
                    </span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => shiftRange(15)}
                title="Next 15 days"
                className="flex w-11 shrink-0 items-center justify-center bg-[#F36509]/10 text-[#F36509] transition-colors hover:bg-[#F36509]/20"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-stone-200"
              onClick={handleExportExcel}
              title="Download current report as Excel-compatible CSV"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-stone-200"
              onClick={handleExportPdf}
              title="Open printable PDF for current report"
            >
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-stone-200"
              onClick={() => void loadReports()}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6">
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map(({ label, value, sub, icon: Icon, iconCls }) => (
            <Card key={label} className="border-stone-200 bg-white">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium uppercase tracking-wider text-stone-400">
                    {label}
                  </p>
                  <div className={`shrink-0 rounded-lg p-2 ${iconCls}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-3 truncate text-xl font-bold text-stone-900 sm:text-2xl">
                  {isLoading ? "—" : value}
                </p>
                <p className="mt-1 truncate text-xs text-stone-500">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                activeTab === id
                  ? "bg-[#F36509] text-white"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="h-6 w-6 animate-spin text-[#F36509]" />
                <p className="mt-4 text-sm font-medium text-stone-900">
                  Loading report...
                </p>
              </div>
            ) : isEmpty ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm font-medium text-stone-900">
                  No data for this period
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Try a different date range or refresh after new sales.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50/80">
                      {activeTab === "cashier" && (
                        <>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Cashier
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Branch
                          </th>
                          <th className={headCls}>Gross Sales</th>
                          <th className={headCls}>Vatable Sales</th>
                          <th className={headCls}>Discounts</th>
                          <th className={headCls}>Charges</th>
                          <th className={headCls}>VAT Amount</th>
                          <th className={headCls}>Net Sales</th>
                          <th className={headCls}>Cash</th>
                          <th className={headCls}>Card</th>
                          <th className={headCls}>GCash</th>
                          <th className={headCls}>Maya</th>
                          <th className={headCls}>Other</th>
                          <th className={headCls}>Txns</th>
                          <th className={headCls}>Items</th>
                          <th className={headCls}>Refunds</th>
                          <th className={headCls}>Avg Ticket</th>
                        </>
                      )}
                      {activeTab === "daily" && (
                        <>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Date
                          </th>
                          <th className={headCls}>Receipt Begin</th>
                          <th className={headCls}>Receipt End</th>
                          <th className={headCls}>Sales Begin</th>
                          <th className={headCls}>Sales End</th>
                          <th className={headCls}>Vatable Sales</th>
                          <th className={headCls}>Cash</th>
                          <th className={headCls}>Card</th>
                          <th className={headCls}>GCash</th>
                          <th className={headCls}>PayMaya</th>
                          <th className={headCls}>Credit</th>
                          <th className={headCls}>Bank Transfer</th>
                          <th className={headCls}>Discount</th>
                        </>
                      )}
                      {activeTab === "returns" && (
                        <>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Receipt
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Product
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Cashier
                          </th>
                          <th className={headCls}>Qty</th>
                          <th className={headCls}>Amount</th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Reason
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Status
                          </th>
                          <th className={headCls}>Date</th>
                        </>
                      )}
                      {activeTab === "product" && (
                        <>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Product
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Category
                          </th>
                          <th className={headCls}>Sold</th>
                          <th className={headCls}>Returned</th>
                          <th className={headCls}>Net Qty</th>
                          <th className={headCls}>Revenue</th>
                          <th className={headCls}>Avg Price</th>
                        </>
                      )}
                      {activeTab === "receipts" && (
                        <>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Receipt
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Cashier
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Branch
                          </th>
                          <th className={headCls}>Items</th>
                          <th className={headCls}>Total</th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Payment
                          </th>
                          <th className={headCls}>Date</th>
                        </>
                      )}
                      {activeTab === "performance" && (
                        <>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Name
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Type
                          </th>
                          <th className={headCls}>Target</th>
                          <th className={headCls}>Actual</th>
                          <th className={headCls}>Returns</th>
                          <th className={headCls}>Net</th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Progress
                          </th>
                        </>
                      )}
                      {activeTab === "expenses" && (
                        <>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            When
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Description
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Category
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Shift
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Method
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Reference
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Status
                          </th>
                          <th className={headCls}>Amount</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab === "cashier" &&
                      data.cashiers.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                        >
                          <td className="px-5 py-4 font-medium text-stone-900">
                            {r.name}
                          </td>
                          <td className="px-5 py-4 text-stone-500">
                            {r.branch}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.grossSales)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.vatableSales)}
                          </td>
                          <td className={`${cellRight} text-amber-600`}>
                            -{formatCurrency(r.discounts)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.charges)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.vatAmount)}
                          </td>
                          <td
                            className={`${cellRight} font-semibold text-stone-900`}
                          >
                            {formatCurrency(r.netSales)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.payments.cash)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.payments.card)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.payments.gcash)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.payments.maya)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(
                              r.payments.other +
                                r.payments.bankTransfer +
                                r.payments.credit,
                            )}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {r.transactions}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {r.items}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.refundsAmount)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.avgTicket)}
                          </td>
                        </tr>
                      ))}

                    {activeTab === "daily" &&
                      data.daily.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                        >
                          <td className="px-5 py-4 font-medium text-stone-900">
                            {r.date}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {r.receiptBegin}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {r.receiptEnd}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.salesBegin)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.salesEnd)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.vatableSales)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.payments.cash)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.payments.card)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.payments.gcash)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.payments.maya)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.payments.credit)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.payments.bankTransfer)}
                          </td>
                          <td className={`${cellRight} text-amber-600`}>
                            -{formatCurrency(r.discounts)}
                          </td>
                        </tr>
                      ))}

                    {activeTab === "returns" &&
                      data.returns.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                        >
                          <td className="px-5 py-4 font-medium text-stone-900">
                            {r.receiptNo}
                          </td>
                          <td className="px-5 py-4 text-stone-700">
                            {r.product}
                          </td>
                          <td className="px-5 py-4 text-stone-500">
                            {r.cashier}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {r.qty}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.amount)}
                          </td>
                          <td className="px-5 py-4 text-stone-500">
                            {r.reason}
                          </td>
                          <td className="px-5 py-4">
                            <Badge
                              variant="outline"
                              className={
                                RETURN_STYLES[r.status] || RETURN_STYLES.voided
                              }
                            >
                              {r.status}
                            </Badge>
                          </td>
                          <td className={`${cellRight} text-stone-500`}>
                            {r.date}
                          </td>
                        </tr>
                      ))}

                    {activeTab === "product" &&
                      data.products.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                        >
                          <td className="px-5 py-4 font-medium text-stone-900">
                            {r.name}
                          </td>
                          <td className="px-5 py-4 text-stone-500">
                            {r.category}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {r.sold}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {r.returned}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {r.netQty}
                          </td>
                          <td
                            className={`${cellRight} font-semibold text-stone-900`}
                          >
                            {formatCurrency(r.revenue)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.avgPrice)}
                          </td>
                        </tr>
                      ))}

                    {activeTab === "receipts" &&
                      data.receipts.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                        >
                          <td className="px-5 py-4 font-medium text-stone-900">
                            {r.receiptNo}
                          </td>
                          <td className="px-5 py-4 text-stone-700">
                            {r.cashier}
                          </td>
                          <td className="px-5 py-4 text-stone-500">
                            {r.branch}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {r.items}
                          </td>
                          <td
                            className={`${cellRight} font-semibold text-stone-900`}
                          >
                            {formatCurrency(r.total)}
                          </td>
                          <td className="px-5 py-4">
                            <Badge
                              variant="outline"
                              className={
                                PAYMENT_STYLES[r.payment] ||
                                PAYMENT_STYLES.other
                              }
                            >
                              {r.payment}
                            </Badge>
                          </td>
                          <td className={`${cellRight} text-stone-500`}>
                            {r.date}
                          </td>
                        </tr>
                      ))}

                    {activeTab === "performance" &&
                      data.performance.map((r) => {
                        const net = r.actual - r.returns;
                        const pct =
                          r.target > 0
                            ? Math.min(100, (r.actual / r.target) * 100)
                            : 0;
                        return (
                          <tr
                            key={r.id}
                            className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                          >
                            <td className="px-5 py-4 font-medium text-stone-900">
                              {r.name}
                            </td>
                            <td className="px-5 py-4 capitalize text-stone-500">
                              {r.type}
                            </td>
                            <td className={`${cellRight} text-stone-600`}>
                              {r.target > 0 ? formatCurrency(r.target) : "—"}
                            </td>
                            <td className={`${cellRight} text-stone-600`}>
                              {formatCurrency(r.actual)}
                            </td>
                            <td className={`${cellRight} text-stone-600`}>
                              {formatCurrency(r.returns)}
                            </td>
                            <td
                              className={`${cellRight} font-semibold text-stone-900`}
                            >
                              {formatCurrency(net)}
                            </td>
                            <td className="px-5 py-4">
                              {r.target > 0 ? (
                                <div className="flex min-w-[120px] items-center gap-2">
                                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                                    <div
                                      className="h-full rounded-full bg-[#F36509]"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs tabular-nums text-stone-500">
                                    {pct.toFixed(0)}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-stone-400">
                                  No target
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                    {activeTab === "expenses" &&
                      filteredExpenses.map((e) => (
                        <tr
                          key={e.id}
                          className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                        >
                          <td className="px-5 py-4 text-stone-600">
                            {new Date(e.occurred_at).toLocaleString("en-PH", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="px-5 py-4 font-medium text-stone-900">
                            {e.description}
                          </td>
                          <td className="px-5 py-4 text-stone-500">
                            {e.category_name || "—"}
                          </td>
                          <td className="px-5 py-4 text-stone-500">
                            {e.shift_number || "—"}
                          </td>
                          <td className="px-5 py-4 capitalize text-stone-500">
                            {e.payment_method}
                          </td>
                          <td className="px-5 py-4 text-stone-500">
                            {e.reference_number || "—"}
                          </td>
                          <td className="px-5 py-4">
                            <Badge
                              variant="outline"
                              className={
                                EXPENSE_STATUS_STYLES[e.status] ||
                                "border-stone-200 bg-stone-50 text-stone-600"
                              }
                            >
                              {e.status}
                            </Badge>
                          </td>
                          <td
                            className={`${cellRight} font-semibold text-stone-900`}
                          >
                            {formatCurrency(e.amount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
