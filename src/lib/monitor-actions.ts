"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { StockItem, MonitorData, MonitorItem, PreparationStatus, DepartmentStatus } from "./monitor-types";
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

function extractLocationFromSession(session: any): string | null {
  if (!session) return null;

  const normalize = (val: any): any => {
    if (Array.isArray(val)) {
      return val.length > 0 ? val[0] : null;
    }
    return val ?? null;
  };

  const tables = normalize(session.tables); 
  const rooms = normalize(session.rooms);
  const cubicles = normalize(session.cubicles);

  // Check nested tables first (object or array)
  const tableNumber = tables?.table_number ?? tables?.number ?? tables?.name ?? session.table_number ?? session.tableNumber;
  if (tableNumber !== undefined && tableNumber !== null && tableNumber !== "") {
    const tableStr = String(tableNumber).trim();
    if (tableStr !== "") {
      // Format clearly as Table N if it looks like a number
      if (/^\d+$/.test(tableStr)) {
        return `Table ${tableStr}`;
      }
      // If it doesn't start with "Table", add prefix if it's numeric-like or just return as-is
      if (!/^table\s+/i.test(tableStr)) {
        // Try to detect if it's just a number
        if (/^\d+$/.test(tableStr.replace(/\s+/g, ""))) {
          return `Table ${tableStr.replace(/\s+/g, "")}`;
        }
      }
      return tableStr;
    }
  }

  const roomName = rooms?.name ?? rooms?.room_name ?? session.room_name ?? session.rooms?.name;
  if (roomName !== undefined && roomName !== null && roomName !== "") {
    const roomStr = String(roomName).trim();
    if (roomStr !== "") return roomStr;
  }

  const cubicleName = cubicles?.name ?? cubicles?.cubicle_name ?? session.cubicle_name ?? session.cubicles?.name;
  if (cubicleName !== undefined && cubicleName !== null && cubicleName !== "") {
    const cubicleStr = String(cubicleName).trim();
    if (cubicleStr !== "") return cubicleStr;
  }

  return null;
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
        kitchen_status,
        bar_status,
        session_id,
        pos_sessions (
          id,
          is_active,
          table_id,
          room_id,
          cubicle_id,
          tables:table_id ( table_number ),
          rooms:room_id ( name ),
          cubicles:cubicle_id ( name )
        ),
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
          created_at
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
    const orderItemMap = new Map();
    const unassignedItems: MonitorItem[] = [];

    for (const o of orders || []) {
      const rawSession = (o as any).pos_sessions;
      let session = Array.isArray(rawSession) ? rawSession[0] ?? null : rawSession;
      const deptStatus = (o as any)[station === "kitchen" ? "kitchen_status" : "bar_status"];
      const source = (o as any).order_source ?? "pos";
      // Fallback: fetch session by id if not embedded.
      if (source === "qr" && !session && (o as any).session_id) {
        const { data: fetched } = await supabase
          .from("pos_sessions")
          .select("id, is_active, expires_at, table_id, room_id, cubicle_id, tables:table_id ( table_number ), rooms:room_id ( name ), cubicles:cubicle_id ( name )")
          .eq("id", (o as any).session_id)
          .maybeSingle();
        if (fetched) session = fetched;
      }
      // Hide QR orders whose session is expired or manually deactivated.
      if (source === "qr" && session) {
        const isExpired = session.expires_at && new Date(session.expires_at) <= new Date();
        const isDeactivated = session.is_active === false;
        if (isExpired || isDeactivated) continue;
      }
      // Hide QR orders with no resolvable session only if the order is at least 24 hours old.
      if (source === "qr" && !session) {
        const ageMs = Date.now() - new Date((o as any).created_at).getTime();
        if (Number.isNaN(ageMs) || ageMs >= 24 * 60 * 60 * 1000) continue;
      }
      // Preserve served-order filtering.
      if (deptStatus === "served") continue;
      const itemsRaw = (o as any).pos_order_items || [];
      for (const it of itemsRaw) {
        const classification = classifyItemForStation(it.area_id, areaIdToCode, station);
        if (!classification.eligible) {
          const isRecognizedArea =
            classification.areaCode === "ieat" ||
            classification.areaCode === "idrink" ||
            classification.areaCode === "istudy";
          if (isRecognizedArea) continue;
          const mappedStatus = mapPreparationStatus(undefined);
          const elapsed = it.created_at ? elapsedSecondsSince(it.created_at) : 0;
          unassignedItems.push({
            itemId: it.id,
            orderId: (o as any).id,
            orderNumber: (o as any).order_number ?? "",
            orderTime: it.created_at || (o as any).created_at,
            orderSource: (o as any).order_source ?? "pos",
            location: session ? extractLocationFromSession(session) : ((o as any).order_source === "pos" ? "Walk-in" : "Unavailable"),
            productName: it.product_name,
            quantity: it.quantity,
            unitPrice: it.unit_price,
            lineTotal: it.line_total,
            areaCode: classification.areaCode,
            areaName: classification.areaName,
            preparationStatus: mappedStatus.value,
            preparationLabel: mappedStatus.label,
            departmentStatus: ((o as any)[station === "kitchen" ? "kitchen_status" : "bar_status"] ?? null) as DepartmentStatus | null,
            specialInstructions: null,
            elapsedSeconds: elapsed,
            isNew: elapsed < 60,
          });
          continue;
        }
     
        const mappedStatus = mapPreparationStatus(undefined);
        const elapsed = it.created_at ? elapsedSecondsSince(it.created_at) : 0;
        const monitorItem: MonitorItem = {
          itemId: it.id,
          orderId: (o as any).id,
          orderNumber: (o as any).order_number ?? "",
          orderTime: it.created_at || (o as any).created_at,
          orderSource: (o as any).order_source ?? "pos",
          location: session ? extractLocationFromSession(session) : ((o as any).order_source === "pos" ? "Walk-in" : "Unavailable"),
          productName: it.product_name,
          quantity: it.quantity,
          unitPrice: it.unit_price,
          lineTotal: it.line_total,
          areaCode: classification.areaCode,
          areaName: classification.areaName,
          preparationStatus: mappedStatus.value,
          preparationLabel: mappedStatus.label,
            departmentStatus: ((o as any)[station === "kitchen" ? "kitchen_status" : "bar_status"] ?? null) as DepartmentStatus | null,
          specialInstructions: null,
          elapsedSeconds: elapsed,
          isNew: elapsed < 60,
        };

        if (!orderItemMap.has((o as any).id)) {
          orderItemMap.set((o as any).id, {
            orderId: (o as any).id,
            orderNumber: (o as any).order_number ?? "",
            orderTime: it.created_at || (o as any).created_at,
            orderSource: (o as any).order_source ?? "pos",
            location: session ? extractLocationFromSession(session) : ((o as any).order_source === "pos" ? "Walk-in" : "Unavailable"),
            status: (o as any).status ?? "open",
            items: [],
          });
        }
        orderItemMap.get((o as any).id).items.push(monitorItem);
      }
    }

    for (const card of orderItemMap.values()) {
      orderCards.push(card);
    }
    orderCards.sort((a, b) => {
      const ae = a.items?.[0]?.elapsedSeconds ?? 0;
      const be = b.items?.[0]?.elapsedSeconds ?? 0;
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
      unassignedItems,
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
      .select("id, order_id")
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

    return { success: false, error: "Preparation status persistence is not supported by the current schema" };
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

export async function updateDepartmentStatus(input: { orderId: string; station: "kitchen" | "bar"; newStatus: DepartmentStatus }) {
  try {
    const user = await requireRole(input.station === "kitchen" ? ["management", "partner"] : ["management", "crew"]);
    if (!user) return { success: false, error: "Unauthorized" };
    const supabase = await currentSupabaseAdmin();
    if (process.env.NODE_ENV === "development") {
      console.log("[monitor] RPC call", { orderId: input.orderId, department: input.station, newStatus: input.newStatus });
    }
    const { data, error } = await supabase.rpc("update_order_department_status", {
      p_order_id: input.orderId,
      p_department: input.station,
      p_new_status: input.newStatus,
    });
    if (error) {
      if (/invalid transition/i.test(error.message)) {
        const { data: current } = await supabase
          .from("pos_orders")
          .select(input.station === "kitchen" ? "kitchen_status" : "bar_status")
          .eq("id", input.orderId)
          .single();
        const currentStatus = current ? (current as any)[input.station === "kitchen" ? "kitchen_status" : "bar_status"] : null;
        if (currentStatus === input.newStatus) {
          return { success: true, data: current };
        }
      }
      if (process.env.NODE_ENV === "development") {
        console.log("[monitor] RPC error", { orderId: input.orderId, department: input.station, newStatus: input.newStatus, error: error.message });
      }
      return { success: false, error: error.message };
    }
    if (process.env.NODE_ENV === "development") {
      console.log("[monitor] RPC success", { orderId: input.orderId, department: input.station, newStatus: input.newStatus });
    }
    return { success: true, data };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.log("[monitor] RPC exception", { orderId: input.orderId, department: input.station, newStatus: input.newStatus, err: err instanceof Error ? err.message : err });
    }
    return { success: false, error: err instanceof Error ? err.message : "Failed" };
  }
}
