"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createOrderAdminClient } from "./order-admin-client";
import { getCurrentUser } from "./actions";

export type ReportDepartment = "kitchen" | "bar";

export type ReportsData = {
  departments: ReportDepartment[];
  totalSales: number;
  totalItems: number;
  byDepartment: Record<ReportDepartment, { sales: number; items: number }>;
};

function allowedDepartments(role: string | null): ReportDepartment[] | null {
  if (role === "management") return ["kitchen", "bar"];
  if (role === "partner") return ["kitchen"];
  if (role === "crew") return ["bar"];
  return null;
}

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

    const orderIds = (orders ?? []).map((o: any) => o.id);
    if (orderIds.length === 0) {
      return {
        success: true,
        data: {
          departments,
          totalSales: 0,
          totalItems: 0,
          byDepartment: { kitchen: { sales: 0, items: 0 }, bar: { sales: 0, items: 0 } },
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
      const id = (p as any).order_id;
      paidByOrder.set(id, (paidByOrder.get(id) ?? 0) + Number((p as any).amount ?? 0));
    }

    const totalByOrder = new Map<string, number>();
    for (const o of orders ?? []) {
      totalByOrder.set((o as any).id, Number((o as any).total_amount ?? 0));
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
          byDepartment: { kitchen: { sales: 0, items: 0 }, bar: { sales: 0, items: 0 } },
        },
      };
    }

    const { data: items, error } = await supabase
      .from("pos_order_items")
      .select("line_total, quantity, area_code, created_at, order_id")
      .in("order_id", eligibleOrderIds)
      .in("area_code", allowedAreaCodes);

    const byDepartment: ReportsData["byDepartment"] = {
      kitchen: { sales: 0, items: 0 },
      bar: { sales: 0, items: 0 },
    };

    let totalSales = 0;
    let totalItems = 0;

    for (const row of items ?? []) {
      const code = (row as any).area_code;
      const dept = code === "ieat" ? "kitchen" : "bar";
      if (!departments.includes(dept)) continue;
      const lineTotal = Number((row as any).line_total ?? 0);
      const qty = Number((row as any).quantity ?? 0);
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
