"use server";

import { createOrderAdminClient } from "./order-admin-client";
import { getCurrentUser } from "./actions";

export type ReportDepartment = "kitchen" | "bar";

export type ReportsData = {
  departments: ReportDepartment[];
  totalSales: number;
  totalItems: number;
  byDepartment: Record<ReportDepartment, { sales: number; items: number }>;
};

export type PaymentBreakdown = {
  cash: number;
  card: number;
  gcash: number;
  maya: number;
  bankTransfer: number;
  credit: number;
  other: number;
};

export type CashierReportRow = {
  id: string;
  name: string;
  branch: string;
  transactions: number;
  items: number;
  refundsCount: number;
  refundsAmount: number;
  grossSales: number;
  vatableSales: number;
  vatExemptSales: number;
  discounts: number;
  charges: number;
  vatAmount: number;
  netSales: number;
  payments: PaymentBreakdown;
  avgTicket: number;
};

export type DailyReportRow = {
  id: string;
  date: string;
  dateKey: string;
  receiptBegin: string;
  receiptEnd: string;
  salesBegin: number;
  salesEnd: number;
  transactions: number;
  items: number;
  vatableSales: number;
  payments: PaymentBreakdown;
  discounts: number;
  net: number;
};

export type ReturnReportRow = {
  id: string;
  receiptNo: string;
  product: string;
  cashier: string;
  qty: number;
  amount: number;
  reason: string;
  status: "refunded" | "replaced" | "pending" | "voided";
  date: string;
};

export type ProductReportRow = {
  id: string;
  name: string;
  category: string;
  sold: number;
  returned: number;
  netQty: number;
  revenue: number;
  avgPrice: number;
};

export type ReceiptReportRow = {
  id: string;
  receiptNo: string;
  cashier: string;
  branch: string;
  items: number;
  total: number;
  payment: "cash" | "card" | "gcash" | "maya" | "other";
  date: string;
  dateRaw: string;
  customer: string;
  payments: PaymentBreakdown;
  discounts: number;
  vatAmount: number;
  netSales: number;
};

export type PerformanceReportRow = {
  id: string;
  name: string;
  type: "cashier" | "branch";
  target: number;
  actual: number;
  returns: number;
  period: string;
};

export type MonitoringReportsPayload = {
  summary: {
    totalSales: number;
    totalItems: number;
    totalTransactions: number;
    totalDiscounts: number;
    totalVat: number;
    totalCharges: number;
    payments: PaymentBreakdown;
  };
  cashiers: CashierReportRow[];
  daily: DailyReportRow[];
  returns: ReturnReportRow[];
  products: ProductReportRow[];
  receipts: ReceiptReportRow[];
  performance: PerformanceReportRow[];
};

function allowedDepartments(role: string | null): ReportDepartment[] | null {
  if (role === "management") return ["kitchen", "bar"];
  if (role === "partner") return ["kitchen"];
  if (role === "crew") return ["bar"];
  return null;
}

function emptyPayments(): PaymentBreakdown {
  return {
    cash: 0,
    card: 0,
    gcash: 0,
    maya: 0,
    bankTransfer: 0,
    credit: 0,
    other: 0,
  };
}

function addPayment(
  target: PaymentBreakdown,
  method: string | null | undefined,
  amount: number,
) {
  const m = (method ?? "other").toLowerCase();
  if (m === "cash") target.cash += amount;
  else if (m === "card") target.card += amount;
  else if (m === "gcash") target.gcash += amount;
  else if (m === "maya") target.maya += amount;
  else if (m === "bank_transfer" || m === "banktransfer")
    target.bankTransfer += amount;
  else if (m === "employee_charge" || m === "credit") target.credit += amount;
  else target.other += amount;
}

function primaryPaymentMethod(
  payments: { method: string; amount: number }[],
): ReceiptReportRow["payment"] {
  if (!payments.length) return "other";
  const totals = emptyPayments();
  for (const p of payments) addPayment(totals, p.method, p.amount);
  const ranked: [ReceiptReportRow["payment"], number][] = [
    ["cash", totals.cash],
    ["card", totals.card],
    ["gcash", totals.gcash],
    ["maya", totals.maya],
    ["other", totals.other + totals.bankTransfer + totals.credit],
  ];
  ranked.sort((a, b) => b[1] - a[1]);
  return ranked[0][0];
}

function toNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatReceiptNo(id: string, createdAt?: string | null): string {
  const short =
    (id || "").replace(/-/g, "").slice(0, 6).toUpperCase() || "000000";
  const d = createdAt ? new Date(createdAt) : new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `R-${y}${m}${day}-${short}`;
}

function localDateKey(iso: string | null | undefined): string {
  if (!iso) return "unknown";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDisplayDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Legacy department-scoped summary (kitchen/bar by role). */
export async function getReportsData(input?: {
  startDate?: string;
  endDate?: string;
  branchId?: string | null;
}): Promise<{ success: boolean; data?: ReportsData; error?: string }> {
  try {
    const user = await getCurrentUser();
    const startDate = input?.startDate ?? "2000-01-01";
    const endDate = input?.endDate ?? new Date().toISOString().slice(0, 10);
    if (!user) return { success: false, error: "Unauthorized" };

    const departments = allowedDepartments(user.role);
    if (!departments) return { success: false, error: "Unauthorized" };

    const allowedAreaCodes = departments.map((d) =>
      d === "kitchen" ? "ieat" : "idrink",
    );

    const supabase = createOrderAdminClient();

    let ordersQuery = supabase
      .from("pos_orders")
      .select("id, total_amount, status, branch_id")
      .eq("status", "completed")
      .gte("created_at", `${startDate}T00:00:00`)
      .lte("created_at", `${endDate}T23:59:59`);

    if (input?.branchId) {
      ordersQuery = ordersQuery.eq("branch_id", input.branchId);
    }

    const { data: orders, error: ordersError } = await ordersQuery;
    if (ordersError) return { success: false, error: ordersError.message };

    const orderIds = (orders ?? []).map((o: { id: string }) => o.id);
    if (orderIds.length === 0) {
      return {
        success: true,
        data: {
          departments,
          totalSales: 0,
          totalItems: 0,
          byDepartment: {
            kitchen: { sales: 0, items: 0 },
            bar: { sales: 0, items: 0 },
          },
        },
      };
    }

    const { data: payments, error: paymentsError } = await supabase
      .from("pos_payments")
      .select("order_id, amount, status")
      .in("order_id", orderIds)
      .eq("status", "completed");

    if (paymentsError) return { success: false, error: paymentsError.message };

    const paidByOrder = new Map<string, number>();
    for (const p of payments ?? []) {
      const id = (p as { order_id: string }).order_id;
      paidByOrder.set(
        id,
        (paidByOrder.get(id) ?? 0) + toNumber((p as { amount: number }).amount),
      );
    }

    const totalByOrder = new Map<string, number>();
    for (const o of orders ?? []) {
      totalByOrder.set(
        (o as { id: string }).id,
        toNumber((o as { total_amount: number }).total_amount),
      );
    }

    const eligibleOrderIds = orderIds.filter((id: string) => {
      const paid = Math.round((paidByOrder.get(id) ?? 0) * 100);
      const total = Math.round((totalByOrder.get(id) ?? 0) * 100);
      return paid >= total && total > 0;
    });

    if (eligibleOrderIds.length === 0) {
      return {
        success: true,
        data: {
          departments,
          totalSales: 0,
          totalItems: 0,
          byDepartment: {
            kitchen: { sales: 0, items: 0 },
            bar: { sales: 0, items: 0 },
          },
        },
      };
    }

    const { data: items, error } = await supabase
      .from("pos_order_items")
      .select("line_total, quantity, area_code, created_at, order_id")
      .in("order_id", eligibleOrderIds)
      .in("area_code", allowedAreaCodes);

    if (error) return { success: false, error: error.message };

    const byDepartment: ReportsData["byDepartment"] = {
      kitchen: { sales: 0, items: 0 },
      bar: { sales: 0, items: 0 },
    };

    let totalSales = 0;
    let totalItems = 0;

    for (const row of items ?? []) {
      const code = (row as { area_code: string }).area_code;
      const dept = code === "ieat" ? "kitchen" : "bar";
      if (!departments.includes(dept)) continue;
      const lineTotal = toNumber((row as { line_total: number }).line_total);
      const qty = toNumber((row as { quantity: number }).quantity);
      byDepartment[dept].sales += lineTotal;
      byDepartment[dept].items += qty;
      totalSales += lineTotal;
      totalItems += qty;
    }

    return {
      success: true,
      data: { departments, totalSales, totalItems, byDepartment },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load reports",
    };
  }
}

/**
 * Full monitoring reports payload for the POS Reports page.
 * Powers Cashier / Daily / Returns / Product / Receipts / Performance tabs.
 */
export async function getMonitoringReports(input?: {
  startDate?: string;
  endDate?: string;
  branchId?: string | null;
}): Promise<{
  success: boolean;
  data?: MonitoringReportsPayload;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const role = user.role ?? null;
    if (!role || !["management", "partner", "crew", "admin"].includes(role)) {
      return { success: false, error: "Unauthorized" };
    }

    const startDate =
      input?.startDate ??
      (() => {
        const d = new Date();
        d.setDate(d.getDate() - 14);
        return d.toISOString().slice(0, 10);
      })();
    const endDate = input?.endDate ?? new Date().toISOString().slice(0, 10);
    const fromIso = `${startDate}T00:00:00`;
    const toIso = `${endDate}T23:59:59`;

    const supabase = createOrderAdminClient();

    // ── Completed orders only ──────────────────────────────────────────────
    let ordersQuery = supabase
      .from("pos_orders")
      .select(
        `
        id,
        order_number,
        total_amount,
        service_charge_amount,
        discount_amount,
        status,
        created_at,
        completed_at,
        branch_id,
        cashier_user_id
      `,
      )
      .eq("status", "completed")
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .order("created_at", { ascending: true });

    if (input?.branchId) {
      ordersQuery = ordersQuery.eq("branch_id", input.branchId);
    }

    // ── Voids from the dedicated table ─────────────────────────────────────
    let voidsQuery = supabase
      .from("pos_order_voids")
      .select(
        `
        id,
        order_id,
        order_number,
        original_status,
        original_total,
        reason,
        voided_by_auth_id,
        cashier_user_id,
        branch_id,
        voided_at
      `,
      )
      .gte("voided_at", fromIso)
      .lte("voided_at", toIso)
      .order("voided_at", { ascending: true });

    if (input?.branchId) {
      voidsQuery = voidsQuery.eq("branch_id", input.branchId);
    }

    const [
      { data: ordersRaw, error: ordersError },
      { data: voidsRaw, error: voidsError },
    ] = await Promise.all([ordersQuery, voidsQuery]);

    if (ordersError) return { success: false, error: ordersError.message };
    if (voidsError) return { success: false, error: voidsError.message };

    const orders = ordersRaw ?? [];
    const voids = voidsRaw ?? [];

    const orderIds = orders.map((o: { id: string }) => o.id);
    const voidOrderIds = voids
      .map((v: { order_id: string | null }) => v.order_id)
      .filter(Boolean) as string[];

    // Union so we can load items for both completed and voided orders
    const allOrderIds = [...new Set([...orderIds, ...voidOrderIds])];

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

    if (allOrderIds.length === 0) {
      return { success: true, data: emptyPayload() };
    }

    const [
      { data: itemsRaw, error: itemsError },
      { data: paymentsRaw, error: paymentsError },
      { data: branchesRaw },
      { data: profilesRaw },
      { data: quotasRaw },
    ] = await Promise.all([
      supabase
        .from("pos_order_items")
        .select(
          "id, order_id, product_id, product_name, quantity, unit_price, discount_amount, line_total, area_code",
        )
        .in("order_id", allOrderIds),
      supabase
        .from("pos_payments")
        .select("order_id, amount, payment_method, status")
        .in("order_id", orderIds), // payments only needed for completed sales
      supabase.from("pos_branches").select("id, name"),
      supabase.from("profiles").select("auth_user_id, full_name, email, role"),
      supabase
        .from("pos_sales_quotas")
        .select(
          "id, name, type, target_amount, period_label, subject_id, period_start, period_end",
        )
        .limit(50),
    ]);

    if (itemsError)
      return { success: false, error: `items: ${itemsError.message}` };
    if (paymentsError)
      return { success: false, error: `payments: ${paymentsError.message}` };

    const branchName = new Map<string, string>();
    for (const b of branchesRaw ?? []) {
      branchName.set(
        (b as { id: string }).id,
        (b as { name: string }).name || "Branch",
      );
    }

    const profileName = new Map<string, string>();
    for (const p of profilesRaw ?? []) {
      const id = (p as { auth_user_id: string }).auth_user_id;
      profileName.set(
        id,
        (p as { full_name?: string }).full_name ||
          (p as { email?: string }).email ||
          "Staff",
      );
    }

    const itemsByOrder = new Map<string, any[]>();
    for (const item of itemsRaw ?? []) {
      const oid = (item as { order_id: string }).order_id;
      if (!itemsByOrder.has(oid)) itemsByOrder.set(oid, []);
      itemsByOrder.get(oid)!.push(item);
    }

    const paymentsByOrder = new Map<
      string,
      { method: string; amount: number; status: string }[]
    >();
    for (const p of paymentsRaw ?? []) {
      const oid = (p as { order_id: string }).order_id;
      if (!paymentsByOrder.has(oid)) paymentsByOrder.set(oid, []);
      paymentsByOrder.get(oid)!.push({
        method: String(
          (p as { payment_method?: string }).payment_method ?? "other",
        ),
        amount: toNumber((p as { amount: number }).amount),
        status: String((p as { status?: string }).status ?? "completed"),
      });
    }

    // Product category lookup (best-effort)
    const productIds = new Set<string>();
    for (const item of itemsRaw ?? []) {
      if ((item as { product_id?: string }).product_id) {
        productIds.add((item as { product_id: string }).product_id);
      }
    }
    const categoryByProduct = new Map<string, string>();
    if (productIds.size > 0) {
      const { data: products } = await supabase
        .from("pos_products")
        .select("id, category, category_name, name")
        .in("id", [...productIds]);
      for (const prod of products ?? []) {
        const cat =
          (prod as { category_name?: string }).category_name ||
          (prod as { category?: string }).category ||
          "Uncategorized";
        categoryByProduct.set((prod as { id: string }).id, String(cat));
      }
    }

    type CashierAcc = {
      name: string;
      branch: string;
      transactions: number;
      items: number;
      refundsCount: number;
      refundsAmount: number;
      grossSales: number;
      discounts: number;
      charges: number;
      payments: PaymentBreakdown;
    };

    const cashierMap = new Map<string, CashierAcc>();
    type DailyAcc = {
      dateKey: string;
      date: string;
      receiptNos: string[];
      transactions: number;
      items: number;
      grossSales: number;
      discounts: number;
      payments: PaymentBreakdown;
      runningEnd: number;
    };
    const dailyMap = new Map<string, DailyAcc>();
    const productMap = new Map<
      string,
      {
        name: string;
        category: string;
        sold: number;
        returned: number;
        revenue: number;
      }
    >();
    const returns: ReturnReportRow[] = [];
    const receipts: ReceiptReportRow[] = [];

    let totalSales = 0;
    let totalItems = 0;
    let totalTransactions = 0;
    let totalDiscounts = 0;
    let totalCharges = 0;
    const summaryPayments = emptyPayments();

    // ── Process completed orders (sales) ───────────────────────────────────
    for (const order of orders) {
      const oid = (order as { id: string }).id;
      const items = itemsByOrder.get(oid) ?? [];
      const pays = (paymentsByOrder.get(oid) ?? []).filter(
        (p) => p.status === "completed" || p.status === "paid" || !p.status,
      );

      const orderTotal = toNumber(
        (order as { total_amount: number }).total_amount,
      );
      const orderDiscount = toNumber(
        (order as { discount_amount?: number }).discount_amount,
      );
      const orderCharges = toNumber(
        (order as { service_charge_amount?: number }).service_charge_amount,
      );

      let itemQty = 0;
      let itemDiscount = 0;
      for (const it of items) {
        itemQty += toNumber(it.quantity);
        itemDiscount += toNumber(it.discount_amount);
        const pid = it.product_id || it.product_name || "unknown";
        const pname = it.product_name || "Item";
        if (!productMap.has(pid)) {
          productMap.set(pid, {
            name: pname,
            category: categoryByProduct.get(it.product_id) || "Uncategorized",
            sold: 0,
            returned: 0,
            revenue: 0,
          });
        }
        const prod = productMap.get(pid)!;
        prod.sold += toNumber(it.quantity);
        prod.revenue += toNumber(it.line_total);
      }

      const discounts = orderDiscount || itemDiscount;
      const cashierId =
        (order as { cashier_user_id?: string }).cashier_user_id || "unknown";
      const branchId = (order as { branch_id?: string }).branch_id || "";
      const cashierLabel =
        profileName.get(cashierId) ||
        (cashierId === "unknown" ? "Unassigned" : "Staff");
      const branchLabel = branchName.get(branchId) || "—";

      if (!cashierMap.has(cashierId)) {
        cashierMap.set(cashierId, {
          name: cashierLabel,
          branch: branchLabel,
          transactions: 0,
          items: 0,
          refundsCount: 0,
          refundsAmount: 0,
          grossSales: 0,
          discounts: 0,
          charges: 0,
          payments: emptyPayments(),
        });
      }
      const cAcc = cashierMap.get(cashierId)!;
      cAcc.transactions += 1;
      cAcc.items += itemQty;
      cAcc.grossSales += orderTotal;
      cAcc.discounts += discounts;
      cAcc.charges += orderCharges;
      for (const p of pays) addPayment(cAcc.payments, p.method, p.amount);

      const when =
        (order as { completed_at?: string }).completed_at ||
        (order as { created_at: string }).created_at;
      const dk = localDateKey(when);
      if (!dailyMap.has(dk)) {
        dailyMap.set(dk, {
          dateKey: dk,
          date: formatDisplayDate(when),
          receiptNos: [],
          transactions: 0,
          items: 0,
          grossSales: 0,
          discounts: 0,
          payments: emptyPayments(),
          runningEnd: 0,
        });
      }
      const dAcc = dailyMap.get(dk)!;
      const receiptNo =
        (order as { order_number?: string }).order_number ||
        formatReceiptNo(oid, when);
      dAcc.receiptNos.push(receiptNo);
      dAcc.transactions += 1;
      dAcc.items += itemQty;
      dAcc.grossSales += orderTotal;
      dAcc.discounts += discounts;
      for (const p of pays) addPayment(dAcc.payments, p.method, p.amount);

      const orderPayments = emptyPayments();
      for (const p of pays) addPayment(orderPayments, p.method, p.amount);

      const netSales = Math.max(0, orderTotal - discounts);
      const vatAmount = Number((netSales - netSales / 1.12).toFixed(2));

      const customerName = String(
        (order as { customer_name?: string }).customer_name ??
          (order as { customer?: string }).customer ??
          "",
      ).trim();

      receipts.push({
        id: oid,
        receiptNo,
        cashier: cashierLabel,
        branch: branchLabel,
        items: itemQty,
        total: orderTotal,
        payment: primaryPaymentMethod(pays),
        date: formatDisplayDateTime(when),
        dateRaw: localDateKey(when),
        customer: customerName,
        payments: {
          cash: Number(orderPayments.cash.toFixed(2)),
          card: Number(orderPayments.card.toFixed(2)),
          gcash: Number(orderPayments.gcash.toFixed(2)),
          maya: Number(orderPayments.maya.toFixed(2)),
          bankTransfer: Number(orderPayments.bankTransfer.toFixed(2)),
          credit: Number(orderPayments.credit.toFixed(2)),
          other: Number(orderPayments.other.toFixed(2)),
        },
        discounts: Number(discounts.toFixed(2)),
        vatAmount,
        netSales: Number(netSales.toFixed(2)),
      });

      totalSales += orderTotal;
      totalItems += itemQty;
      totalTransactions += 1;
      totalDiscounts += discounts;
      totalCharges += orderCharges;
      for (const p of pays) addPayment(summaryPayments, p.method, p.amount);
    }

    // Running sales begin/end for daily rows (chronological)
    const dailySorted = [...dailyMap.values()].sort((a, b) =>
      a.dateKey.localeCompare(b.dateKey),
    );
    let running = 0;
    const daily: DailyReportRow[] = dailySorted
      .map((d) => {
        const salesBegin = running;
        running += d.grossSales;
        const nos = d.receiptNos;
        const net = Math.max(0, d.grossSales - d.discounts);
        const vatableSales = Number((net / 1.12).toFixed(2));
        return {
          id: d.dateKey,
          date: d.date,
          dateKey: d.dateKey,
          receiptBegin: nos[0] || "—",
          receiptEnd: nos[nos.length - 1] || "—",
          salesBegin: Number(salesBegin.toFixed(2)),
          salesEnd: Number(running.toFixed(2)),
          transactions: d.transactions,
          items: d.items,
          vatableSales,
          payments: d.payments,
          discounts: Number(d.discounts.toFixed(2)),
          net: Number(net.toFixed(2)),
        };
      })
      .reverse(); // newest first

    // ── Process voids → returns ────────────────────────────────────────────
    for (const voidRow of voids) {
      const oid = (voidRow as { order_id?: string }).order_id;
      const items = oid ? (itemsByOrder.get(oid) ?? []) : [];
      const cashierId =
        (voidRow as { cashier_user_id?: string }).cashier_user_id ||
        (voidRow as { voided_by_auth_id?: string }).voided_by_auth_id ||
        "unknown";
      const cashierLabel =
        profileName.get(cashierId) ||
        (cashierId === "unknown" ? "Unassigned" : "Staff");
      const when =
        (voidRow as { voided_at?: string }).voided_at ||
        new Date().toISOString();
      const receiptNo =
        (voidRow as { order_number?: string }).order_number ||
        (oid ? formatReceiptNo(oid, when) : "—");
      const reason = (voidRow as { reason?: string }).reason || "Voided order";
      const voidAmount = toNumber(
        (voidRow as { original_total?: number }).original_total,
      );

      if (items.length === 0) {
        returns.push({
          id: (voidRow as { id: string }).id,
          receiptNo,
          product: "—",
          cashier: cashierLabel,
          qty: 0,
          amount: voidAmount,
          reason,
          status: "voided",
          date: formatDisplayDate(when),
        });
      } else {
        for (const it of items) {
          returns.push({
            id: `${(voidRow as { id: string }).id}-${it.id || it.product_id}`,
            receiptNo,
            product: it.product_name || "Item",
            cashier: cashierLabel,
            qty: toNumber(it.quantity),
            amount: toNumber(it.line_total),
            reason,
            status: "voided",
            date: formatDisplayDate(when),
          });
          const pid = it.product_id || it.product_name || "unknown";
          if (!productMap.has(pid)) {
            productMap.set(pid, {
              name: it.product_name || "Item",
              category: categoryByProduct.get(it.product_id) || "Uncategorized",
              sold: 0,
              returned: 0,
              revenue: 0,
            });
          }
          productMap.get(pid)!.returned += toNumber(it.quantity);
        }
      }

      // Attribute refunds to cashier totals
      if (cashierMap.has(cashierId)) {
        const c = cashierMap.get(cashierId)!;
        c.refundsCount += 1;
        c.refundsAmount += voidAmount;
      } else {
        // Cashier may only appear via voids (no completed sales in range)
        const branchId = (voidRow as { branch_id?: string }).branch_id || "";
        cashierMap.set(cashierId, {
          name: cashierLabel,
          branch: branchName.get(branchId) || "—",
          transactions: 0,
          items: 0,
          refundsCount: 1,
          refundsAmount: voidAmount,
          grossSales: 0,
          discounts: 0,
          charges: 0,
          payments: emptyPayments(),
        });
      }
    }

    const VAT_RATE = 0.12;
    const cashiers: CashierReportRow[] = [...cashierMap.entries()]
      .map(([id, acc]) => {
        const netSales = Math.max(0, acc.grossSales - acc.discounts);
        const vatableSales = Number((netSales / (1 + VAT_RATE)).toFixed(2));
        const vatAmount = Number((netSales - vatableSales).toFixed(2));
        return {
          id,
          name: acc.name,
          branch: acc.branch,
          transactions: acc.transactions,
          items: acc.items,
          refundsCount: acc.refundsCount,
          refundsAmount: Number(acc.refundsAmount.toFixed(2)),
          grossSales: Number(acc.grossSales.toFixed(2)),
          vatableSales,
          vatExemptSales: 0,
          discounts: Number(acc.discounts.toFixed(2)),
          charges: Number(acc.charges.toFixed(2)),
          vatAmount,
          netSales: Number(netSales.toFixed(2)),
          payments: {
            cash: Number(acc.payments.cash.toFixed(2)),
            card: Number(acc.payments.card.toFixed(2)),
            gcash: Number(acc.payments.gcash.toFixed(2)),
            maya: Number(acc.payments.maya.toFixed(2)),
            bankTransfer: Number(acc.payments.bankTransfer.toFixed(2)),
            credit: Number(acc.payments.credit.toFixed(2)),
            other: Number(acc.payments.other.toFixed(2)),
          },
          avgTicket:
            acc.transactions > 0
              ? Number((acc.grossSales / acc.transactions).toFixed(2))
              : 0,
        };
      })
      .sort((a, b) => b.grossSales - a.grossSales);

    const products: ProductReportRow[] = [...productMap.entries()]
      .map(([id, p]) => ({
        id,
        name: p.name,
        category: p.category,
        sold: p.sold,
        returned: p.returned,
        netQty: p.sold - p.returned,
        revenue: Number(p.revenue.toFixed(2)),
        avgPrice: p.sold > 0 ? Number((p.revenue / p.sold).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Performance from quotas table (if present) else derive from cashiers
    let performance: PerformanceReportRow[] = [];
    if (quotasRaw && quotasRaw.length > 0) {
      performance = (quotasRaw as any[]).map((q) => {
        const subjectId = q.subject_id as string | null;
        const actualFromCashier =
          subjectId && cashierMap.has(subjectId)
            ? cashierMap.get(subjectId)!.grossSales
            : (cashiers.find((c) => c.name === q.name)?.grossSales ?? 0);
        return {
          id: String(q.id),
          name: String(q.name || "—"),
          type: q.type === "branch" ? "branch" : "cashier",
          target: toNumber(q.target_amount),
          actual: Number(actualFromCashier.toFixed(2)),
          returns: 0,
          period: String(q.period_label || "Current"),
        };
      });
    } else {
      performance = cashiers.slice(0, 10).map((c) => ({
        id: c.id,
        name: c.name,
        type: "cashier" as const,
        target: 0,
        actual: c.netSales,
        returns: c.refundsAmount,
        period: `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`,
      }));
    }

    const netAll = Math.max(0, totalSales - totalDiscounts);
    const totalVat = Number((netAll - netAll / 1.12).toFixed(2));

    // Newest receipts first
    receipts.reverse();

    return {
      success: true,
      data: {
        summary: {
          totalSales: Number(totalSales.toFixed(2)),
          totalItems,
          totalTransactions,
          totalDiscounts: Number(totalDiscounts.toFixed(2)),
          totalVat,
          totalCharges: Number(totalCharges.toFixed(2)),
          payments: {
            cash: Number(summaryPayments.cash.toFixed(2)),
            card: Number(summaryPayments.card.toFixed(2)),
            gcash: Number(summaryPayments.gcash.toFixed(2)),
            maya: Number(summaryPayments.maya.toFixed(2)),
            bankTransfer: Number(summaryPayments.bankTransfer.toFixed(2)),
            credit: Number(summaryPayments.credit.toFixed(2)),
            other: Number(summaryPayments.other.toFixed(2)),
          },
        },
        cashiers,
        daily,
        returns,
        products,
        receipts,
        performance,
      },
    };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to load monitoring reports",
    };
  }
}
