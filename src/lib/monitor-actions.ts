"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { StockItem, MonitorData, MonitorItem, PreparationStatus } from "./monitor-types";
import { createOrderAdminClient } from "./order-admin-client";
import { requireRole } from "./actions";

const monitorItemSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  product_id: z.string(),
  product_name: z.string(),
  quantity: z.number(),
  unit_price: z.number(),
  discount_amount: z.number(),
  line_total: z.number(),
  area_id: z.string().nullable(),
  area_code: z.string().nullable(),
  created_at: z.string(),
  order_number: z.string().optional(),
  preparation_status: z.string().optional(),
  special_instructions: z.string().nullable().optional(),
  order_source: z.string().optional(),
});

async function currentSupabaseAdmin() {
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
    }
  );
}

function elapsedSecondsSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 1000));
}

function mapPreparationStatus(status: string | null | undefined): {
  value: PreparationStatus;
  label: string;
} {
  switch (status) {
    case "preparing":
      return { value: "preparing", label: "Preparing" };
    case "ready":
      return { value: "ready", label: "Ready" };
    case "completed":
      return { value: "completed", label: "Completed" };
    case "cancelled":
      return { value: "cancelled", label: "Cancelled" };
    default:
      return { value: "new", label: "New" };
  }
}

function classifyItemForStation(
  areaId: string | null | undefined,
  areaIdToCode: Map<string, string>,
  station: "kitchen" | "bar"
): { eligible: boolean; areaCode: string | null; areaName: string | null } {
  if (!areaId) {
    return { eligible: false, areaCode: null, areaName: null };
  }
  const areaCode = areaIdToCode.get(areaId);
  if (!areaCode) {
    return { eligible: false, areaCode: null, areaName: null };
  }
  if (station === "kitchen") {
    if (areaCode === "ieat") {
      return { eligible: true, areaCode: "ieat", areaName: "iEat" };
    }
    return { eligible: false, areaCode, areaName: null };
  }
  if (station === "bar") {
    if (areaCode === "idrink") {
      return { eligible: true, areaCode: "idrink", areaName: "iDrink" };
    }
    return { eligible: false, areaCode, areaName: null };
  }
  return { eligible: false, areaCode: null, areaName: null };
}

export async function getMonitorData(
  station: "kitchen" | "bar"
): Promise<{ success: boolean; data?: MonitorData; error?: string }> {
  try {
    const user = await requireRole(
      station === "kitchen" ? ["management", "partner"] : ["management", "crew"]
    );
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }
    if (user.role === "cashier") {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await currentSupabaseAdmin();

    const { data: orders, error: ordersError } = await supabase
      .from("pos_orders")
      .select(
        `
        id,
        order_number,
        status,
        created_at,
        order_source,
        pos_order_items (
          id,
          order_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          discount_amount,
          line_total,
          area_id,
          area_code,
          created_at,
          order_number,
          special_instructions,
          preparation_status,
          preparation_updated_at
        )
      `
      )
      .in("status", ["open", "in_progress", "ready"])
      .in("order_source", ["pos", "qr", "manual"])
      .order("created_at", { ascending: true });

    if (ordersError) {
      return { success: false, error: ordersError.message };
    }

    const { data: areas } = await supabase.from("pos_areas").select("id, code");
    const areaIdToCode = new Map<string, string>();
    (areas || []).forEach((a: any) => {
      if (a?.id && typeof a?.code === "string") {
        areaIdToCode.set(a.id, a.code);
      }
    });

    const orderCards: any[] = [];

    for (const o of orders || []) {
      const itemsRaw = (o as any).pos_order_items || [];
      for (const it of itemsRaw) {
        const classification = classifyItemForStation(it.area_id, areaIdToCode, station);
        if (!classification.eligible) continue;

        const mappedStatus = mapPreparationStatus(it.preparation_status);
        const elapsed = it.created_at ? elapsedSecondsSince(it.created_at) : 0;
        const monitorItem: MonitorItem = {
          itemId: it.id,
          orderId: (o as any).id,
          orderNumber: (o as any).order_number ?? it.order_number ?? "",
          orderTime: it.created_at || (o as any).created_at,
          orderSource: (o as any).order_source ?? "pos",
          productName: it.product_name,
          quantity: it.quantity,
          unitPrice: it.unit_price,
          lineTotal: it.line_total,
          areaCode: classification.areaCode,
          areaName: classification.areaName,
          preparationStatus: mappedStatus.value,
          preparationLabel: mappedStatus.label,
          specialInstructions: it.special_instructions ?? null,
          elapsedSeconds: elapsed,
          isNew: elapsed < 60,
        };

        orderCards.push({
          item: monitorItem,
          orderId: (o as any).id,
          orderNumber: (o as any).order_number ?? it.order_number ?? "",
          orderTime: it.created_at || (o as any).created_at,
          canShowOnMonitor: true,
        });
      }
    }

    orderCards.sort((a, b) => {
      const ae = a.item?.elapsedSeconds ?? 0;
      const be = b.item?.elapsedSeconds ?? 0;
      if (ae !== be) return ae - be;
      const an = a.orderTime || "";
      const bn = b.orderTime || "";
      return an.localeCompare(bn);
    });

    const { data: inventoryRows, error: inventoryError } = await supabase
      .from("pos_inventory")
      .select(
        "id, branch_id, product_id, stock_quantity, reorder_level, updated_at, pos_products(id, name, category_id, is_active, pos_categories(name)), pos_branches(name)"
      );

    const stockItems: StockItem[] = [];
    if (!inventoryError && inventoryRows) {
      for (const row of inventoryRows as any[]) {
        const product = (row as any).pos_products as any | null;
        const category = (product?.pos_categories as any)?.name ?? "";
        stockItems.push({
          id: row.id,
          product_id: row.product_id,
          name: product?.name ?? "",
          category,
          quantity: row.stock_quantity,
          min_stock: row.reorder_level,
          is_active: Boolean(product?.is_active),
          updated_at: row.updated_at,
        });
      }
    }

    const lowStock: StockItem[] = [];
    const outOfStock: StockItem[] = [];
    for (const item of stockItems) {
      if (item.quantity <= 0) outOfStock.push(item);
      else if (item.min_stock > 0 && item.quantity <= item.min_stock) lowStock.push(item);
    }

    const data: MonitorData = {
      orders: orderCards,
      stockItems: lowStock,
      outOfStockItems: outOfStock,
      stockViewItems: [...lowStock, ...outOfStock].sort((a, b) => a.quantity - b.quantity),
      elapsedBuckets: [5, 30, 60, 120, 300, 600, 1800, 3600],
    };

    return { success: true, data };
  } catch (err) {
    console.error("getMonitorData error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load monitor data",
    };
  }
}

const updatePrepStatusSchema = z.object({
  orderId: z.string().uuid(),
  itemId: z.string().uuid(),
  preparationStatus: z.enum(["new", "preparing", "ready", "completed", "cancelled"]),
  station: z.enum(["kitchen", "bar"]),
});

function utcNow(): string {
  return new Date().toISOString();
}

export async function updateMonitorPrepStatus(
  input: z.infer<typeof updatePrepStatusSchema>
): Promise<{ success: boolean; error?: string; stale?: boolean }> {
  try {
    const validated = updatePrepStatusSchema.parse(input);

    const user = await requireRole(
      validated.station === "kitchen" ? ["management", "partner"] : ["management", "crew"]
    );
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }
    if (user.role === "cashier") {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = createOrderAdminClient();
    const { data: itemRow, error: fetchError } = await supabase
      .from("pos_order_items")
      .select("id, order_id, preparation_status, preparation_updated_at")
      .eq("id", validated.itemId)
      .single();

    if (fetchError || !itemRow) {
      return { success: false, error: "Order item not found" };
    }

    const { data: orderRow, error: orderError } = await supabase
      .from("pos_orders")
      .select("id, status")
      .eq("id", itemRow.order_id)
      .single();

    if (orderError || !orderRow) {
      return { success: false, error: "Order not found" };
    }

    if (orderRow.status === "cancelled" || orderRow.status === "completed") {
      return {
        success: false,
        error: `Cannot update prep status on a ${orderRow.status} order`,
      };
    }

    const currentStatus = itemRow.preparation_status ?? "new";
    if (currentStatus === validated.preparationStatus) {
      return { success: true, stale: true };
    }

    const { error: updateError } = await supabase
      .from("pos_order_items")
      .update({
        preparation_status: validated.preparationStatus,
        preparation_updated_at: utcNow(),
        last_status_ack: validated.preparationStatus,
      })
      .eq("id", validated.itemId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    await supabase.from("pos_orders").update({ updated_at: utcNow() }).eq("id", itemRow.order_id);

    return { success: true };
  } catch (err) {
    console.error("updateMonitorPrepStatus error:", err);
    return {
      success: false,
      error:
        err instanceof z.ZodError
          ? err.issues[0]?.message ?? "Invalid input"
          : err instanceof Error
          ? err.message
          : "Failed to update preparation status",
    };
  }
}
