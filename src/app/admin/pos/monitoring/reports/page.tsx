"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Download,
  RefreshCw,
  TrendingUp,
  Receipt,
  RotateCcw,
  Package,
  BarChart3,
  Users,
  Store,
  Target,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// ─── Types ───────────────────────────────────────────────────────────────────

type PaymentBreakdown = {
  cash?: number;
  card?: number;
  gcash?: number;
  maya?: number;
  credit?: number;
  bankTransfer?: number;
  other?: number;
};

type ReportTab =
  | "cashier"
  | "daily"
  | "returns"
  | "product"
  | "receipts"
  | "performance";

type CashierRow = {
  id: string;
  name: string;
  branch: string;

  // Core volume
  transactions: number;
  items: number;
  refundsCount: number;
  refundsAmount: number;

  // Sales composition
  grossSales: number; // before any discount / charge
  vatableSales: number; // sales subject to 12% VAT
  vatExemptSales: number; // zero-rated / exempt
  discounts: number; // total discounts given
  charges: number; // service charge, delivery, etc.
  vatAmount: number; // 12% of vatableSales
  netSales: number; // final amount after discount + charges + VAT

  // Payment methods (dynamic – users can enable/disable)
  payments: PaymentBreakdown;

  // Convenience
  avgTicket: number;
};

const AVAILABLE_PAYMENT_METHODS = [
  { key: "cash", label: "Cash" },
  { key: "card", label: "Card" },
  { key: "gcash", label: "GCash" },
  { key: "maya", label: "Maya" },
  { key: "other", label: "Other" },
  // users can add more later
] as const;

type DailyRow = {
  id: string;
  date: string;
  receiptBegin: string; // first receipt no. of the day
  receiptEnd: string; // last receipt no. of the day
  salesBegin: number; // opening cumulative sales counter
  salesEnd: number; // closing cumulative sales counter
  transactions: number;
  items: number;
  vatableSales: number;
  payments: PaymentBreakdown;
  discounts: number;
  net: number;
};

type ReturnRow = {
  id: string;
  receiptNo: string;
  product: string;
  cashier: string;
  qty: number;
  amount: number;
  reason: string;
  status: "refunded" | "replaced" | "pending";
  date: string;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  sold: number;
  returned: number;
  netQty: number;
  revenue: number;
  avgPrice: number;
};

type ReceiptRow = {
  id: string;
  receiptNo: string;
  cashier: string;
  branch: string;
  items: number;
  total: number;
  payment: "cash" | "card" | "gcash" | "maya" | "other";
  date: string;
};

type PerformanceRow = {
  id: string;
  name: string;
  type: "cashier" | "branch";
  target: number;
  actual: number;
  returns: number;
  period: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (v: number | null | undefined) =>
  v == null
    ? ""
    : new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(v);

const formatNumber = (v: number) => new Intl.NumberFormat("en-PH").format(v);

// ─── Mock data (replace with fetchReportsData(dateRange)) ────────────────────

const MOCK_CASHIERS: CashierRow[] = [
  {
    id: "1",
    name: "Maria Santos",
    branch: "Main Branch",
    transactions: 54,
    items: 128,
    refundsCount: 2,
    refundsAmount: 400,
    grossSales: 72_500,
    vatableSales: 68_200,
    vatExemptSales: 1_800,
    discounts: 2_400,
    charges: 850,
    vatAmount: 8184, // 68200 * 0.12
    netSales: 68_200, // example – adjust to your exact formula
    payments: {
      cash: 28_400,
      card: 12_100,
      gcash: 0,
      maya: 3_500,
      other: 1_400,
    },
    avgTicket: 1_262.96,
  },
  {
    id: "2",
    name: "Juan Dela Cruz",
    branch: "Main Branch",
    transactions: 47,
    items: 105,
    refundsCount: 1,
    refundsAmount: 0,
    grossSales: 63_400,
    vatableSales: 59_450,
    vatExemptSales: 0,
    discounts: 1_800,
    charges: 500,
    vatAmount: 7_134,
    netSales: 59_450,
    payments: {
      cash: 24_000,
      card: 10_450,
      gcash: 20_000,
      maya: 4_000,
      other: 1_000,
    },
    avgTicket: 1_264.89,
  },
];

const MOCK_DAILY: DailyRow[] = [
  {
    id: "5",
    date: "Oct 12, 2026",
    receiptBegin: "R-10339",
    receiptEnd: "R-10402",
    salesBegin: 305_300,
    salesEnd: 391_700,
    transactions: 64,
    items: 141,
    vatableSales: 83_500,
    payments: {
      cash: 34_000,
      card: 12_000,
      gcash: 26_000,
      maya: 6_000,
      credit: 4_000,
      bankTransfer: 2_000,
      other: 0,
    },
    discounts: 2_400,
    net: 84_000,
  },
  {
    id: "4",
    date: "Oct 11, 2026",
    receiptBegin: "R-10281",
    receiptEnd: "R-10338",
    salesBegin: 227_500,
    salesEnd: 305_300,
    transactions: 58,
    items: 122,
    vatableSales: 75_800,
    payments: {
      cash: 30_000,
      card: 11_000,
      gcash: 22_000,
      maya: 5_000,
      credit: 5_000,
      bankTransfer: 3_000,
      other: 0,
    },
    discounts: 1_800,
    net: 76_000,
  },
  {
    id: "3",
    date: "Oct 10, 2026",
    receiptBegin: "R-10210",
    receiptEnd: "R-10280",
    salesBegin: 133_400,
    salesEnd: 227_500,
    transactions: 71,
    items: 156,
    vatableSales: 90_600,
    payments: {
      cash: 36_000,
      card: 13_000,
      gcash: 27_000,
      maya: 7_000,
      credit: 5_000,
      bankTransfer: 3_000,
      other: 0,
    },
    discounts: 3_100,
    net: 91_000,
  },
  {
    id: "2",
    date: "Oct 9, 2026",
    receiptBegin: "R-10158",
    receiptEnd: "R-10209",
    salesBegin: 63_100,
    salesEnd: 133_400,
    transactions: 52,
    items: 109,
    vatableSales: 68_200,
    payments: {
      cash: 27_000,
      card: 10_000,
      gcash: 20_000,
      maya: 5_000,
      credit: 4_000,
      bankTransfer: 2_800,
      other: 0,
    },
    discounts: 1_500,
    net: 68_800,
  },
  {
    id: "1",
    date: "Oct 8, 2026",
    receiptBegin: "R-10111",
    receiptEnd: "R-10157",
    salesBegin: 0,
    salesEnd: 63_100,
    transactions: 47,
    items: 98,
    vatableSales: 61_400,
    payments: {
      cash: 25_000,
      card: 9_000,
      gcash: 18_000,
      maya: 4_000,
      credit: 3_900,
      bankTransfer: 2_000,
      other: 0,
    },
    discounts: 1_200,
    net: 61_900,
  },
];

const MOCK_RETURNS: ReturnRow[] = [
  {
    id: "1",
    receiptNo: "R-10234",
    product: "Iced Coffee",
    cashier: "Maria Santos",
    qty: 1,
    amount: 200,
    reason: "Wrong order",
    status: "refunded",
    date: "Oct 12, 2026",
  },
  {
    id: "2",
    receiptNo: "R-10229",
    product: "Burger Combo",
    cashier: "Carlos Mendoza",
    qty: 1,
    amount: 1475,
    reason: "Spoiled",
    status: "refunded",
    date: "Oct 12, 2026",
  },
  {
    id: "3",
    receiptNo: "R-10215",
    product: "Chocolate Cake Slice",
    cashier: "Juan Dela Cruz",
    qty: 2,
    amount: 800,
    reason: "Changed mind",
    status: "replaced",
    date: "Oct 11, 2026",
  },
  {
    id: "4",
    receiptNo: "R-10202",
    product: "Chicken Rice Meal",
    cashier: "Carlos Mendoza",
    qty: 1,
    amount: 1200,
    reason: "Foreign object",
    status: "pending",
    date: "Oct 10, 2026",
  },
];

const MOCK_PRODUCTS: ProductRow[] = [
  {
    id: "1",
    name: "Iced Coffee",
    category: "Beverages",
    sold: 142,
    returned: 3,
    netQty: 139,
    revenue: 27800,
    avgPrice: 200,
  },
  {
    id: "2",
    name: "Chicken Rice Meal",
    category: "Meals",
    sold: 19,
    returned: 0,
    netQty: 19,
    revenue: 22800,
    avgPrice: 1200,
  },
  {
    id: "3",
    name: "French Fries",
    category: "Snacks",
    sold: 93,
    returned: 1,
    netQty: 92,
    revenue: 18400,
    avgPrice: 200,
  },
  {
    id: "4",
    name: "Chocolate Cake Slice",
    category: "Dessert",
    sold: 38,
    returned: 2,
    netQty: 36,
    revenue: 14400,
    avgPrice: 400,
  },
  {
    id: "5",
    name: "Bottled Water",
    category: "Beverages",
    sold: 124,
    returned: 0,
    netQty: 124,
    revenue: 12400,
    avgPrice: 100,
  },
];

const MOCK_RECEIPTS: ReceiptRow[] = [
  {
    id: "1",
    receiptNo: "R-10241",
    cashier: "Maria Santos",
    branch: "Main Branch",
    items: 4,
    total: 890,
    payment: "gcash",
    date: "Oct 12, 2026 · 14:32",
  },
  {
    id: "2",
    receiptNo: "R-10240",
    cashier: "Juan Dela Cruz",
    branch: "Main Branch",
    items: 2,
    total: 1400,
    payment: "cash",
    date: "Oct 12, 2026 · 14:18",
  },
  {
    id: "3",
    receiptNo: "R-10239",
    cashier: "Ana Reyes",
    branch: "SM Mall Branch",
    items: 6,
    total: 2350,
    payment: "card",
    date: "Oct 12, 2026 · 13:57",
  },
  {
    id: "4",
    receiptNo: "R-10238",
    cashier: "Carlos Mendoza",
    branch: "Airport Kiosk",
    items: 1,
    total: 200,
    payment: "cash",
    date: "Oct 12, 2026 · 13:41",
  },
  {
    id: "5",
    receiptNo: "R-10237",
    cashier: "Maria Santos",
    branch: "Main Branch",
    items: 3,
    total: 1075,
    payment: "gcash",
    date: "Oct 12, 2026 · 13:22",
  },
];

const MOCK_PERFORMANCE: PerformanceRow[] = [
  {
    id: "1",
    name: "Maria Santos",
    type: "cashier",
    target: 80000,
    actual: 68200,
    returns: 400,
    period: "October 2026",
  },
  {
    id: "2",
    name: "Juan Dela Cruz",
    type: "cashier",
    target: 70000,
    actual: 59450,
    returns: 0,
    period: "October 2026",
  },
  {
    id: "3",
    name: "Main Branch",
    type: "branch",
    target: 200000,
    actual: 142300,
    returns: 2675,
    period: "October 2026",
  },
  {
    id: "4",
    name: "SM Mall Branch",
    type: "branch",
    target: 90000,
    actual: 68400,
    returns: 800,
    period: "October 2026",
  },
];

// ─── Shared bits ─────────────────────────────────────────────────────────────

const headCls = "px-5 py-3.5 text-right font-medium text-stone-500";
const cellRight = "px-5 py-4 text-right tabular-nums";
const PAYMENT_STYLES: Record<ReceiptRow["payment"], string> = {
  cash: "border-stone-200 bg-stone-50 text-stone-600",
  card: "border-sky-200 bg-sky-50 text-sky-700",
  gcash: "border-blue-200 bg-blue-50 text-blue-700",
  maya: "border-violet-200 bg-violet-50 text-violet-700",
  other: "border-stone-200 bg-stone-50 text-stone-600",
};
const RETURN_STYLES: Record<ReturnRow["status"], string> = {
  refunded: "border-emerald-200 bg-emerald-50 text-emerald-700",
  replaced: "border-sky-200 bg-sky-50 text-sky-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
};

const TABS: { id: ReportTab; label: string; icon: typeof Users }[] = [
  { id: "cashier", label: "Cashier Sales", icon: Users },
  { id: "daily", label: "Daily Sales", icon: Calendar },
  { id: "returns", label: "Customer Returns", icon: RotateCcw },
  { id: "product", label: "Product Sales", icon: Package },
  { id: "receipts", label: "Receipt Details", icon: Receipt },
  { id: "performance", label: "Performance", icon: Target },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("cashier");
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14); // 15 days total
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [isEditingRange, setIsEditingRange] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(t);
  }, [startDate, endDate]);

  const shiftRange = (days: number) => {
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    start.setDate(start.getDate() + days);
    end.setDate(end.getDate() + days);

    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
    setIsLoading(true);
  };

  const totalNet = MOCK_CASHIERS.reduce((s, c) => s + c.netSales, 0);
  const totalVat = MOCK_CASHIERS.reduce((s, c) => s + c.vatAmount, 0);
  const totalDisc = MOCK_CASHIERS.reduce((s, c) => s + c.discounts, 0);
  const totalCash =
    MOCK_CASHIERS?.reduce((s, c) => s + (c?.payments?.cash ?? 0), 0) ?? 0;

  const kpis = useMemo(() => {
    switch (activeTab) {
      case "cashier":
        return [
          {
            label: "Net Sales",
            value: formatCurrency(totalNet),
            sub: "All cashiers",
            icon: TrendingUp,
            iconCls: "bg-orange-50 text-[#F36509]",
          },
          {
            label: "VAT Amount",
            value: formatCurrency(totalVat),
            sub: "12% Output VAT",
            icon: Receipt,
            iconCls: "bg-amber-50 text-amber-600",
          },
          {
            label: "Discounts",
            value: formatCurrency(totalDisc),
            sub: "Total given",
            icon: RotateCcw,
            iconCls: "bg-red-50 text-red-600",
          },
          {
            label: "Cash Collected",
            value: formatCurrency(totalCash),
            sub: "Physical cash",
            icon: Store,
            iconCls: "bg-emerald-50 text-emerald-600",
          },
        ];
      case "daily":
        return [
          {
            label: "Gross Sales",
            value: formatCurrency(391700),
            sub: "5 days shown",
            icon: TrendingUp,
            iconCls: "bg-orange-50 text-[#F36509]",
          },
          {
            label: "Net Sales",
            value: formatCurrency(381700),
            sub: "After discounts",
            icon: Store,
            iconCls: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Transactions",
            value: formatNumber(292),
            sub: "Avg 58/day",
            icon: BarChart3,
            iconCls: "bg-stone-100 text-stone-500",
          },
          {
            label: "Discounts",
            value: formatCurrency(10000),
            sub: "2.6% of gross",
            icon: Receipt,
            iconCls: "bg-amber-50 text-amber-600",
          },
        ];
      case "returns":
        return [
          {
            label: "Total Returns",
            value: "5",
            sub: "This period",
            icon: RotateCcw,
            iconCls: "bg-red-50 text-red-600",
          },
          {
            label: "Refund Value",
            value: formatCurrency(3875),
            sub: "Cash returned",
            icon: TrendingUp,
            iconCls: "bg-orange-50 text-[#F36509]",
          },
          {
            label: "Replaced",
            value: "1",
            sub: formatCurrency(800),
            icon: Package,
            iconCls: "bg-sky-50 text-sky-600",
          },
          {
            label: "Pending",
            value: "1",
            sub: "Awaiting review",
            icon: Receipt,
            iconCls: "bg-amber-50 text-amber-600",
          },
        ];
      case "product":
        return [
          {
            label: "Units Sold",
            value: formatNumber(416),
            sub: "Gross",
            icon: Package,
            iconCls: "bg-orange-50 text-[#F36509]",
          },
          {
            label: "Units Returned",
            value: "6",
            sub: "1.4% rate",
            icon: RotateCcw,
            iconCls: "bg-red-50 text-red-600",
          },
          {
            label: "Net Revenue",
            value: formatCurrency(95800),
            sub: "After returns",
            icon: TrendingUp,
            iconCls: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Top Product",
            value: "Iced Coffee",
            sub: "139 net units",
            icon: BarChart3,
            iconCls: "bg-stone-100 text-stone-500",
          },
        ];
      case "receipts":
        return [
          {
            label: "Receipts",
            value: formatNumber(186),
            sub: "This period",
            icon: Receipt,
            iconCls: "bg-orange-50 text-[#F36509]",
          },
          {
            label: "Avg Items / Receipt",
            value: "2.2",
            sub: "Per transaction",
            icon: Package,
            iconCls: "bg-stone-100 text-stone-500",
          },
          {
            label: "Avg Receipt Value",
            value: formatCurrency(1337),
            sub: "Per transaction",
            icon: TrendingUp,
            iconCls: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "GCash Share",
            value: "38%",
            sub: "Payment method",
            icon: Store,
            iconCls: "bg-blue-50 text-blue-700",
          },
        ];
      case "performance":
        return [
          {
            label: "Avg Attainment",
            value: "82%",
            sub: "Across targets",
            icon: Target,
            iconCls: "bg-orange-50 text-[#F36509]",
          },
          {
            label: "On Track",
            value: "3 / 4",
            sub: "≥75% of target",
            icon: TrendingUp,
            iconCls: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Total Returns",
            value: formatCurrency(3875),
            sub: "Deducted",
            icon: RotateCcw,
            iconCls: "bg-red-50 text-red-600",
          },
          {
            label: "Net Attainment",
            value: "80%",
            sub: "After returns",
            icon: BarChart3,
            iconCls: "bg-stone-100 text-stone-500",
          },
        ];
    }
  }, [activeTab]);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col bg-stone-50">
      {/* Header — matches Sales / Inventory pages */}
      <div className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F36509]">
              Analytics / Reports
            </p>
            <h1 className="mt-1 font-serif text-xl font-semibold text-stone-900 sm:text-2xl">
              Reports
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Cashier, daily, returns, product, receipt &amp; performance
              reports
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            {/* Date range control */}
            <div className="flex h-11 overflow-hidden rounded-xl border border-stone-200 bg-white focus-within:border-[#F36509]/50 focus-within:ring-2 focus-within:ring-[#F36509]/20">
              {/* Previous – flushed left + accent */}
              <button
                type="button"
                onClick={() => shiftRange(-15)}
                title="Previous 15 days"
                className="flex w-11 shrink-0 items-center justify-center bg-[#F36509]/10 text-[#F36509] transition-colors hover:bg-[#F36509]/20"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Center */}
              <div className="flex flex-1 items-center justify-center">
                {isEditingRange ? (
                  // ── Edit mode ──────────────────────────────────────────────
                  <div
                    className="flex items-center gap-1.5 px-2"
                    onBlur={(e) => {
                      // Only exit when focus leaves the whole edit area
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setIsEditingRange(false);
                      }
                    }}
                  >
                    <input
                      type="date"
                      value={startDate}
                      max={endDate}
                      autoFocus
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setIsLoading(true);
                      }}
                      className="h-8 w-[130px] rounded-md border border-stone-200 bg-white px-2 text-sm font-medium text-stone-800 outline-none focus:border-[#F36509]"
                    />
                    <span className="text-stone-400">–</span>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setIsLoading(true);
                      }}
                      className="h-8 w-[130px] rounded-md border border-stone-200 bg-white px-2 text-sm font-medium text-stone-800 outline-none focus:border-[#F36509]"
                    />
                  </div>
                ) : (
                  // ── Display mode (month names) ─────────────────────────────
                  <button
                    type="button"
                    onClick={() => setIsEditingRange(true)}
                    className="flex h-full w-full items-center justify-center gap-1.5 px-3 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-50"
                    title="Click to edit dates"
                  >
                    <span>
                      {new Date(startDate + "T00:00:00").toLocaleDateString(
                        "en-PH",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </span>
                    <span className="text-stone-400">–</span>
                    <span>
                      {new Date(endDate + "T00:00:00").toLocaleDateString(
                        "en-PH",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </button>
                )}
              </div>

              {/* Next – flushed right + accent */}
              <button
                type="button"
                onClick={() => shiftRange(15)}
                title="Next 15 days"
                className="flex w-11 shrink-0 items-center justify-center bg-[#F36509]/10 text-[#F36509] transition-colors hover:bg-[#F36509]/20"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Export & Refresh */}
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-stone-200"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-stone-200"
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 500);
              }}
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
        {/* KPI cards — per tab */}
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

        {/* Tab bar */}
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

        {/* Report table */}
        <Card className="border-stone-200 bg-white">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="h-6 w-6 animate-spin text-[#F36509]" />
                <p className="mt-4 text-sm font-medium text-stone-900">
                  Loading report...
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
                            Receipt No.
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
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab === "cashier" &&
                      MOCK_CASHIERS.map((r) => (
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
                            {formatCurrency(r.payments.other)}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {r.transactions}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {r.items}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {r.refundsCount}
                            {r.refundsAmount > 0 && (
                              <span className="ml-1 text-xs text-red-500">
                                ({formatCurrency(r.refundsAmount)})
                              </span>
                            )}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.avgTicket)}
                          </td>
                        </tr>
                      ))}

                    {/* Daily sales */}
                    {activeTab === "daily" &&
                      MOCK_DAILY.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                        >
                          <td className="px-5 py-4 font-medium text-stone-900">
                            {r.date}
                          </td>
                          <td className={`${cellRight} text-stone-500`}>
                            {r.receiptBegin}
                          </td>
                          <td className={`${cellRight} text-stone-500`}>
                            {r.receiptEnd}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {formatCurrency(r.salesBegin)}
                          </td>
                          <td
                            className={`${cellRight} font-semibold text-stone-900`}
                          >
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
                          <td className={`${cellRight} text-amber-700`}>
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

                    {/* Customer returns */}
                    {activeTab === "returns" &&
                      MOCK_RETURNS.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                        >
                          <td className="px-5 py-4 font-medium text-stone-900">
                            {r.receiptNo}
                          </td>
                          <td className="px-5 py-4 text-stone-600">
                            {r.product}
                          </td>
                          <td className="px-5 py-4 text-stone-500">
                            {r.cashier}
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {r.qty}
                          </td>
                          <td
                            className={`${cellRight} font-semibold text-stone-900`}
                          >
                            {formatCurrency(r.amount)}
                          </td>
                          <td className="px-5 py-4 text-stone-500">
                            {r.reason}
                          </td>
                          <td className="px-5 py-4">
                            <Badge
                              variant="outline"
                              className={RETURN_STYLES[r.status]}
                            >
                              {r.status}
                            </Badge>
                          </td>
                          <td className={`${cellRight} text-stone-500`}>
                            {r.date}
                          </td>
                        </tr>
                      ))}

                    {/* Product sales */}
                    {activeTab === "product" &&
                      MOCK_PRODUCTS.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                        >
                          <td className="px-5 py-4 font-medium text-stone-900">
                            {r.name}
                          </td>
                          <td className="px-5 py-4">
                            <Badge
                              variant="outline"
                              className="border-stone-200 bg-stone-50 text-stone-600"
                            >
                              {r.category}
                            </Badge>
                          </td>
                          <td className={`${cellRight} text-stone-600`}>
                            {r.sold}
                          </td>
                          <td
                            className={`${cellRight} ${r.returned > 0 ? "text-red-600" : "text-stone-400"}`}
                          >
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

                    {/* Receipt details */}
                    {activeTab === "receipts" &&
                      MOCK_RECEIPTS.map((r) => (
                        <tr
                          key={r.id}
                          className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                        >
                          <td className="px-5 py-4 font-medium text-[#F36509]">
                            {r.receiptNo}
                          </td>
                          <td className="px-5 py-4 text-stone-600">
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
                              className={PAYMENT_STYLES[r.payment]}
                            >
                              {r.payment}
                            </Badge>
                          </td>
                          <td className={`${cellRight} text-stone-500`}>
                            {r.date}
                          </td>
                        </tr>
                      ))}

                    {/* Performance */}
                    {activeTab === "performance" &&
                      MOCK_PERFORMANCE.map((r) => {
                        const net = r.actual - r.returns;
                        const progress = Math.min(
                          100,
                          Math.round((net / r.target) * 100),
                        );
                        return (
                          <tr
                            key={r.id}
                            className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                          >
                            <td className="px-5 py-4 font-medium text-stone-900">
                              {r.name}
                            </td>
                            <td className="px-5 py-4">
                              <Badge
                                variant="outline"
                                className={
                                  r.type === "cashier"
                                    ? "border-blue-200 bg-blue-50 text-blue-700"
                                    : "border-purple-200 bg-purple-50 text-purple-700"
                                }
                              >
                                {r.type}
                              </Badge>
                            </td>
                            <td className={`${cellRight} text-stone-600`}>
                              {formatCurrency(r.target)}
                            </td>
                            <td
                              className={`${cellRight} font-semibold text-stone-900`}
                            >
                              {formatCurrency(r.actual)}
                            </td>
                            <td className={`${cellRight} text-red-600`}>
                              -{formatCurrency(r.returns)}
                            </td>
                            <td className={`${cellRight} text-stone-600`}>
                              {formatCurrency(net)}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                                  <div
                                    className={`h-full rounded-full ${
                                      progress >= 100
                                        ? "bg-emerald-500"
                                        : progress >= 75
                                          ? "bg-[#F36509]"
                                          : progress >= 50
                                            ? "bg-amber-500"
                                            : "bg-stone-300"
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span
                                  className={`w-12 text-right text-xs tabular-nums ${progress >= 100 ? "font-semibold text-emerald-600" : "text-stone-500"}`}
                                >
                                  {progress}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
