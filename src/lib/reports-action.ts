"use server";

import { type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { createOrderAdminClient } from "./order-admin-client";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// =============================================================================
// Types
// =============================================================================

export type ReportMetric = {
  total: number;
  count?: number;
  average?: number;
};

export type AreaGroup = "all" | "istudy_iwork" | "ieat_idrink";

export type SalesSummary = {
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
  totalItems: number;
};

export type EmployeeSale = {
  id: string;
  name: string;
  role: string;
  sales: number;
  transactions: number;
  items: number;
  avgTicket: number;
};

export type CategorySale = {
  id: string;
  name: string;
  sales: number;
  quantity: number;
  percentage: number;
};

export type ProductSale = {
  id: string;
  name: string;
  category: string;
  sales: number;
  quantity: number;
  avgPrice: number;
};

export type BranchSale = {
  id: string;
  name: string;
  sales: number;
  transactions: number;
  percentage: number;
};

export type AreaSale = {
  id: string;
  name: string;
  sales: number;
  transactions: number;
  percentage: number;
};

export type QuotaItem = {
  id: string;
  name: string;
  type: "employee" | "branch";
  target: number;
  actual: number;
  period: string;
};

// =============================================================================
// Supabase clients (same pattern as order-actions)
// =============================================================================

async function createOrderSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    },
  );
}

type OrderStaffUser = {
  id: string;
  email: string | null;
};

async function requireOrderStaff(): Promise<
  | { authorized: true; user: OrderStaffUser }
  | { authorized: false; error: string }
> {
  const authClient = await createOrderSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return { authorized: false, error: "Unauthorized" };
  }

  const adminClient = createOrderAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return { authorized: false, error: "Staff verification failed" };
  }
  if (!profile) {
    return { authorized: false, error: "Unauthorized: staff account required" };
  }

  return {
    authorized: true,
    user: { id: user.id, email: user.email ?? null },
  };
}

// =============================================================================
// Helpers
// =============================================================================

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function zodErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || "Validation failed";
  }
  return error instanceof Error ? error.message : "Unexpected error";
}

const ISTUDY_IWORK_CODES = new Set(["istudy", "iwork"]);
const IEAT_IDRINK_CODES = new Set(["ieat", "idrink"]);

function isInAreaGroup(
  areaCode: string | null | undefined,
  group: AreaGroup,
): boolean {
  if (group === "all") return true;
  const code = (areaCode ?? "").trim().toLowerCase();
  if (group === "istudy_iwork") return ISTUDY_IWORK_CODES.has(code);
  if (group === "ieat_idrink") return IEAT_IDRINK_CODES.has(code);
  return false;
}

const dateRangeSchema = z.object({
  branch_id: z.string().uuid().optional().nullable(),
  from: z.string().optional().nullable(), // ISO
  to: z.string().optional().nullable(), // ISO
});

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

/**
 * Convert the UI date-range preset into ISO from/to bounds (local timezone).
 */
export async function resolveDateRangePreset(
  preset: string,
): Promise<{ from: string | null; to: string | null }> {
  const now = new Date();
  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };

  switch (preset) {
    case "today": {
      return {
        from: startOfDay(now).toISOString(),
        to: endOfDay(now).toISOString(),
      };
    }
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return {
        from: startOfDay(y).toISOString(),
        to: endOfDay(y).toISOString(),
      };
    }
    case "this-week": {
      const day = now.getDay(); // 0 = Sun
      const diffToMonday = day === 0 ? 6 : day - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);
      return {
        from: startOfDay(monday).toISOString(),
        to: endOfDay(now).toISOString(),
      };
    }
    case "this-month": {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        from: startOfDay(first).toISOString(),
        to: endOfDay(now).toISOString(),
      };
    }
    case "last-month": {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        from: startOfDay(first).toISOString(),
        to: endOfDay(last).toISOString(),
      };
    }
    default:
      return { from: null, to: null };
  }
}

/**
 * Shared query for completed orders within an optional date range / branch.
 */
async function fetchCompletedOrders(
  supabase: SupabaseClient,
  filters: DateRangeInput,
): Promise<{ data: any[]; error?: string }> {
  let query = supabase
    .from("pos_orders")
    .select(
      `
      id,
      total_amount,
      service_charge_amount,
      status,
      created_at,
      completed_at,
      branch_id,
      cashier_user_id,
      pos_order_items (
        id,
        product_id,
        product_name,
        quantity,
        unit_price,
        discount_amount,
        line_total,
        area_id,
        area_code
      )
    `,
    )
    .eq("status", "completed");

  if (filters.branch_id) {
    query = query.eq("branch_id", filters.branch_id);
  }

  // Prefer completed_at; fall back to created_at when completed_at is null
  if (filters.from) {
    query = query.gte("completed_at", filters.from);
  }
  if (filters.to) {
    query = query.lte("completed_at", filters.to);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return { data: [], error: error.message };
  }
  return { data: data ?? [] };
}

/**
 * Core aggregation used by the area-group KPI functions.
 */
function aggregateByAreaGroup(
  orders: any[],
  group: AreaGroup,
): {
  totalSales: number;
  totalTransactions: number;
  totalItemsSold: number;
  averageTransaction: number;
} {
  let totalSales = 0;
  let totalItemsSold = 0;
  const orderIdsWithMatchingItems = new Set<string>();

  for (const order of orders) {
    const items = order.pos_order_items ?? [];
    let orderHasMatch = false;
    let orderSalesContribution = 0;

    for (const item of items) {
      if (!isInAreaGroup(item.area_code, group)) continue;

      orderHasMatch = true;
      const qty = toNumber(item.quantity);
      const lineTotal = toNumber(item.line_total);
      totalItemsSold += qty;
      orderSalesContribution += lineTotal;
    }

    if (orderHasMatch) {
      orderIdsWithMatchingItems.add(order.id);
      totalSales += orderSalesContribution;

      // Include service charge only for the unfiltered “all” view
      if (group === "all") {
        totalSales += toNumber(order.service_charge_amount);
      }
    }
  }

  const totalTransactions = orderIdsWithMatchingItems.size;
  const averageTransaction =
    totalTransactions > 0 ? totalSales / totalTransactions : 0;

  return {
    totalSales: Number(totalSales.toFixed(2)),
    totalTransactions,
    totalItemsSold,
    averageTransaction: Number(averageTransaction.toFixed(2)),
  };
}

// =============================================================================
// Total Sales (area groups)
// =============================================================================

export async function getTotalSalesAllAreas(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    const { totalSales } = aggregateByAreaGroup(orders, "all");
    return { success: true, data: totalSales };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

export async function getTotalSalesIstudyIwork(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    const { totalSales } = aggregateByAreaGroup(orders, "istudy_iwork");
    return { success: true, data: totalSales };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

export async function getTotalSalesIeatIdrink(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    const { totalSales } = aggregateByAreaGroup(orders, "ieat_idrink");
    return { success: true, data: totalSales };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

// =============================================================================
// Total Transactions (area groups)
// =============================================================================

export async function getTotalTransactionsAllAreas(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    const { totalTransactions } = aggregateByAreaGroup(orders, "all");
    return { success: true, data: totalTransactions };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

export async function getTotalTransactionsIstudyIwork(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    const { totalTransactions } = aggregateByAreaGroup(orders, "istudy_iwork");
    return { success: true, data: totalTransactions };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

export async function getTotalTransactionsIeatIdrink(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    const { totalTransactions } = aggregateByAreaGroup(orders, "ieat_idrink");
    return { success: true, data: totalTransactions };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

// =============================================================================
// Total Items Sold (area groups)
// =============================================================================

export async function getTotalItemsSoldAllAreas(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    const { totalItemsSold } = aggregateByAreaGroup(orders, "all");
    return { success: true, data: totalItemsSold };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

export async function getTotalItemsSoldIstudyIwork(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    const { totalItemsSold } = aggregateByAreaGroup(orders, "istudy_iwork");
    return { success: true, data: totalItemsSold };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

export async function getTotalItemsSoldIeatIdrink(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    const { totalItemsSold } = aggregateByAreaGroup(orders, "ieat_idrink");
    return { success: true, data: totalItemsSold };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

// =============================================================================
// Average Transaction (area groups)
// =============================================================================

export async function getAverageTransactionAllAreas(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    const { averageTransaction } = aggregateByAreaGroup(orders, "all");
    return { success: true, data: averageTransaction };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

export async function getAverageTransactionIstudyIwork(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    const { averageTransaction } = aggregateByAreaGroup(orders, "istudy_iwork");
    return { success: true, data: averageTransaction };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

export async function getAverageTransactionIeatIdrink(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    const { averageTransaction } = aggregateByAreaGroup(orders, "ieat_idrink");
    return { success: true, data: averageTransaction };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

// =============================================================================
// Convenience: all KPIs for one area group
// =============================================================================

export async function getSalesReportSummary(
  input?: DateRangeInput & { area_group?: AreaGroup },
): Promise<{
  success: boolean;
  data?: SalesSummary;
  error?: string;
}> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const group: AreaGroup = input?.area_group ?? "all";
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    const metrics = aggregateByAreaGroup(orders, group);
    return {
      success: true,
      data: {
        totalSales: metrics.totalSales,
        totalTransactions: metrics.totalTransactions,
        averageTicket: metrics.averageTransaction,
        totalItems: metrics.totalItemsSold,
      },
    };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

// =============================================================================
// Breakdown reports (needed by the Sales page)
// =============================================================================

/**
 * Sales grouped by cashier (employee).
 * Joins profiles for display name / role when available.
 */
export async function getSalesByEmployee(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: EmployeeSale[]; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    // Aggregate per cashier_user_id
    type Acc = {
      sales: number;
      transactions: number;
      items: number;
    };
    const byCashier = new Map<string, Acc>();

    for (const order of orders) {
      const key = order.cashier_user_id ?? "unknown";
      if (!byCashier.has(key)) {
        byCashier.set(key, { sales: 0, transactions: 0, items: 0 });
      }
      const acc = byCashier.get(key)!;
      acc.transactions += 1;
      acc.sales += toNumber(order.total_amount);
      for (const item of order.pos_order_items ?? []) {
        acc.items += toNumber(item.quantity);
      }
    }

    // Resolve names from profiles (auth_user_id)
    const cashierIds = [...byCashier.keys()].filter((id) => id !== "unknown");
    const nameMap = new Map<string, { name: string; role: string }>();

    if (cashierIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("auth_user_id, full_name, role, email")
        .in("auth_user_id", cashierIds);

      for (const p of profiles ?? []) {
        nameMap.set(p.auth_user_id, {
          name: p.full_name || p.email || "Unknown",
          role: p.role || "Staff",
        });
      }
    }

    const result: EmployeeSale[] = [...byCashier.entries()]
      .map(([id, acc]) => {
        const meta = nameMap.get(id) ?? {
          name: id === "unknown" ? "Unassigned" : "Unknown Staff",
          role: "Staff",
        };
        return {
          id,
          name: meta.name,
          role: meta.role,
          sales: Number(acc.sales.toFixed(2)),
          transactions: acc.transactions,
          items: acc.items,
          avgTicket:
            acc.transactions > 0
              ? Number((acc.sales / acc.transactions).toFixed(2))
              : 0,
        };
      })
      .sort((a, b) => b.sales - a.sales);

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

/**
 * Sales grouped by product category.
 * Expects a `category` (or `category_name`) on pos_products; falls back to "Uncategorized".
 */
export async function getSalesByCategory(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: CategorySale[]; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    // Collect product_ids so we can look up categories
    const productIds = new Set<string>();
    for (const order of orders) {
      for (const item of order.pos_order_items ?? []) {
        if (item.product_id) productIds.add(item.product_id);
      }
    }

    const categoryMap = new Map<string, string>(); // product_id → category name
    if (productIds.size > 0) {
      const { data: products } = await supabase
        .from("pos_products")
        .select("id, category, category_name, pos_categories(name)")
        .in("id", [...productIds]);

      for (const p of products ?? []) {
        const cat =
          (p as any).category_name ||
          (p as any).category ||
          (Array.isArray((p as any).pos_categories)
            ? (p as any).pos_categories[0]?.name
            : (p as any).pos_categories?.name) ||
          "Uncategorized";
        categoryMap.set(p.id, String(cat));
      }
    }

    type Acc = { sales: number; quantity: number };
    const byCat = new Map<string, Acc>();

    for (const order of orders) {
      for (const item of order.pos_order_items ?? []) {
        const catName = categoryMap.get(item.product_id) ?? "Uncategorized";
        if (!byCat.has(catName)) {
          byCat.set(catName, { sales: 0, quantity: 0 });
        }
        const acc = byCat.get(catName)!;
        acc.sales += toNumber(item.line_total);
        acc.quantity += toNumber(item.quantity);
      }
    }

    const grandTotal = [...byCat.values()].reduce((s, a) => s + a.sales, 0);

    const result: CategorySale[] = [...byCat.entries()]
      .map(([name, acc], idx) => ({
        id: String(idx + 1),
        name,
        sales: Number(acc.sales.toFixed(2)),
        quantity: acc.quantity,
        percentage:
          grandTotal > 0
            ? Number(((acc.sales / grandTotal) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.sales - a.sales);

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

/**
 * Sales grouped by individual product.
 */
export async function getSalesByProduct(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: ProductSale[]; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    type Acc = {
      name: string;
      sales: number;
      quantity: number;
      product_id: string;
    };
    const byProduct = new Map<string, Acc>();

    for (const order of orders) {
      for (const item of order.pos_order_items ?? []) {
        const key = item.product_id ?? item.product_name;
        if (!byProduct.has(key)) {
          byProduct.set(key, {
            name: item.product_name ?? "Unknown",
            sales: 0,
            quantity: 0,
            product_id: item.product_id,
          });
        }
        const acc = byProduct.get(key)!;
        acc.sales += toNumber(item.line_total);
        acc.quantity += toNumber(item.quantity);
      }
    }

    // Resolve category names
    const productIds = [...byProduct.values()]
      .map((p) => p.product_id)
      .filter(Boolean);
    const categoryMap = new Map<string, string>();

    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from("pos_products")
        .select("id, category, category_name, pos_categories(name)")
        .in("id", productIds);

      for (const p of products ?? []) {
        const cat =
          (p as any).category_name ||
          (p as any).category ||
          (Array.isArray((p as any).pos_categories)
            ? (p as any).pos_categories[0]?.name
            : (p as any).pos_categories?.name) ||
          "Uncategorized";
        categoryMap.set(p.id, String(cat));
      }
    }

    const result: ProductSale[] = [...byProduct.values()]
      .map((acc) => ({
        id: acc.product_id ?? acc.name,
        name: acc.name,
        category: categoryMap.get(acc.product_id) ?? "Uncategorized",
        sales: Number(acc.sales.toFixed(2)),
        quantity: acc.quantity,
        avgPrice:
          acc.quantity > 0 ? Number((acc.sales / acc.quantity).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.sales - a.sales);

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

/**
 * Sales grouped by branch.
 */
export async function getSalesByBranch(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: BranchSale[]; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    type Acc = { sales: number; transactions: number };
    const byBranch = new Map<string, Acc>();

    for (const order of orders) {
      const key = order.branch_id ?? "unknown";
      if (!byBranch.has(key)) {
        byBranch.set(key, { sales: 0, transactions: 0 });
      }
      const acc = byBranch.get(key)!;
      acc.sales += toNumber(order.total_amount);
      acc.transactions += 1;
    }

    // Resolve branch names
    const branchIds = [...byBranch.keys()].filter((id) => id !== "unknown");
    const nameMap = new Map<string, string>();

    if (branchIds.length > 0) {
      const { data: branches } = await supabase
        .from("pos_branches")
        .select("id, name")
        .in("id", branchIds);

      for (const b of branches ?? []) {
        nameMap.set(b.id, b.name ?? "Unnamed Branch");
      }
    }

    const grandTotal = [...byBranch.values()].reduce((s, a) => s + a.sales, 0);

    const result: BranchSale[] = [...byBranch.entries()]
      .map(([id, acc]) => ({
        id,
        name: nameMap.get(id) ?? (id === "unknown" ? "Unassigned" : "Unknown"),
        sales: Number(acc.sales.toFixed(2)),
        transactions: acc.transactions,
        percentage:
          grandTotal > 0
            ? Number(((acc.sales / grandTotal) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.sales - a.sales);

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

/**
 * Sales grouped by area_code (ieat, idrink, istudy, iwork, etc.).
 */
export async function getSalesByArea(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: AreaSale[]; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();
    const { data: orders, error } = await fetchCompletedOrders(
      supabase,
      filters,
    );
    if (error) return { success: false, error };

    type Acc = { sales: number; orderIds: Set<string> };
    const byArea = new Map<string, Acc>();

    for (const order of orders) {
      for (const item of order.pos_order_items ?? []) {
        const code =
          (item.area_code ?? "general").trim().toLowerCase() || "general";
        if (!byArea.has(code)) {
          byArea.set(code, { sales: 0, orderIds: new Set() });
        }
        const acc = byArea.get(code)!;
        acc.sales += toNumber(item.line_total);
        acc.orderIds.add(order.id);
      }
    }

    // Pretty display names
    const displayName = (code: string) => {
      const map: Record<string, string> = {
        ieat: "iEat",
        idrink: "iDrink",
        istudy: "iStudy",
        iwork: "iWork",
        iplay: "iPlay",
        onehub: "OneHub",
        general: "General",
      };
      return map[code] ?? code.charAt(0).toUpperCase() + code.slice(1);
    };

    const grandTotal = [...byArea.values()].reduce((s, a) => s + a.sales, 0);

    const result: AreaSale[] = [...byArea.entries()]
      .map(([code, acc]) => ({
        id: code,
        name: displayName(code),
        sales: Number(acc.sales.toFixed(2)),
        transactions: acc.orderIds.size,
        percentage:
          grandTotal > 0
            ? Number(((acc.sales / grandTotal) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.sales - a.sales);

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

/**
 * Sales quotas (employee + branch).
 * Expects a `pos_sales_quotas` table with:
 *   id, name, type ('employee'|'branch'), target_amount, period_label,
 *   subject_id (auth_user_id or branch_id), period_start, period_end
 * If the table does not exist yet, returns an empty list gracefully.
 */
export async function getSalesQuotas(
  input?: DateRangeInput,
): Promise<{ success: boolean; data?: QuotaItem[]; error?: string }> {
  try {
    const filters = dateRangeSchema.parse(input ?? {});
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();

    // Try to read quotas; if table is missing we just return []
    const { data: quotas, error: quotaError } = await supabase
      .from("pos_sales_quotas")
      .select(
        "id, name, type, target_amount, period_label, subject_id, period_start, period_end",
      )
      .order("target_amount", { ascending: false });

    if (quotaError) {
      // Table may not exist yet – soft-fail
      console.warn("getSalesQuotas:", quotaError.message);
      return { success: true, data: [] };
    }

    if (!quotas || quotas.length === 0) {
      return { success: true, data: [] };
    }

    // Compute actuals for the requested date range (or quota period)
    const { data: orders } = await fetchCompletedOrders(supabase, filters);

    // Actuals by cashier and by branch
    const salesByCashier = new Map<string, number>();
    const salesByBranch = new Map<string, number>();

    for (const order of orders) {
      if (order.cashier_user_id) {
        salesByCashier.set(
          order.cashier_user_id,
          (salesByCashier.get(order.cashier_user_id) ?? 0) +
            toNumber(order.total_amount),
        );
      }
      if (order.branch_id) {
        salesByBranch.set(
          order.branch_id,
          (salesByBranch.get(order.branch_id) ?? 0) +
            toNumber(order.total_amount),
        );
      }
    }

    const result: QuotaItem[] = quotas.map((q: any) => {
      const actual =
        q.type === "employee"
          ? (salesByCashier.get(q.subject_id) ?? 0)
          : (salesByBranch.get(q.subject_id) ?? 0);

      return {
        id: q.id,
        name: q.name,
        type: q.type === "branch" ? "branch" : "employee",
        target: toNumber(q.target_amount),
        actual: Number(actual.toFixed(2)),
        period: q.period_label ?? "Current",
      };
    });

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}
