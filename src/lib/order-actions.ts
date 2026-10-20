"use server";

import { createServerClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { z } from "zod";
import { createOrderAdminClient } from "./order-admin-client";
import { randomBytes } from "crypto";

// =============================================================================
// Types
// =============================================================================

export type OrderStatus =
  | "open"
  | "in_progress"
  | "ready"
  | "completed"
  | "cancelled";

export type OrderSource = "pos" | "qr" | "manual";

export type OrderType =
  | "walk_in"
  | "dine_in"
  | "takeaway"
  | "delivery"
  | "reservation";

export type SessionOrder = {
  id: string;
  order_number?: string;
  status: string;
  total_amount: number;
  created_at: string;
  item_count?: number;
  items?: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    area_code?: string | null;
  }[];
  payment_method?: string | null;
};

export type PosOrder = {
  id: string;
  order_number: string;
  branch_id: string | null;
  terminal_id: string | null;
  shift_id: string | null;
  session_id: string | null;
  cashier_user_id: string | null;
  client_id: string | null;
  reservation_id: string | null;
  order_type: OrderType;
  order_source: OrderSource;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  service_charge_amount: number;
  notes: string | null;
  primary_area_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type PosOrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
  area_id: string | null;
  area_code: string | null;
  created_at: string;
};

export type PosPayment = {
  id: string;
  order_id: string;
  payment_method: string;
  amount: number;
  received_amount: number | null;
  change_amount: number;
  reference_number: string | null;
  status: string;
  paid_at: string;
};

// =============================================================================
// Supabase clients
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

// Server-only privileged client moved to ./order-admin-client

// =============================================================================
// Auth
// =============================================================================

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

/**
 * Resolves a branch_id for QR orders.
 * pos_orders.branch_id is NOT NULL, so we must always supply one.
 *
 * Order of preference:
 * 1. Explicit value passed in
 * 2. First active row in pos_branches
 */
async function resolveBranchId(
  supabase: SupabaseClient,
  preferred?: string | null,
): Promise<{ branchId: string | null; error?: string }> {
  if (preferred) {
    return { branchId: preferred };
  }

  // Try common branch table names / shapes
  const { data: branches, error } = await supabase
    .from("pos_branches")
    .select("id")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1);

  if (!error && branches && branches.length > 0) {
    return { branchId: branches[0].id };
  }

  // Fallback: any branch (ignore is_active)
  const { data: anyBranch, error: anyError } = await supabase
    .from("pos_branches")
    .select("id")
    .limit(1);

  if (!anyError && anyBranch && anyBranch.length > 0) {
    return { branchId: anyBranch[0].id };
  }

  console.error("resolveBranchId failed:", error ?? anyError);
  return {
    branchId: null,
    error:
      "No branch configured. Add at least one branch in pos_branches before taking QR orders.",
  };
}

/**
 * Validates a QR session token (no staff account required).
 * Used by the public customer menu.
 */
async function requireValidQrSession(sessionToken: string): Promise<
  | {
      valid: true;
      session: {
        id: string;
        is_active: boolean;
        expires_at: string;
        branch_id: string | null;
      };
    }
  | { valid: false; error: string }
> {
  if (!sessionToken?.trim()) {
    return { valid: false, error: "Missing session token" };
  }

  const supabase = createOrderAdminClient();

  // Prefer reading branch_id (set when the QR session was created).
  // Fall back if the column doesn't exist yet.
  let session: {
    id: string;
    is_active: boolean;
    expires_at: string;
    branch_id?: string | null;
  } | null = null;

  const withBranch = await supabase
    .from("pos_sessions")
    .select("id, is_active, expires_at, branch_id")
    .eq("qr_token", sessionToken.trim())
    .maybeSingle();

  if (withBranch.error) {
    const withoutBranch = await supabase
      .from("pos_sessions")
      .select("id, is_active, expires_at")
      .eq("qr_token", sessionToken.trim())
      .maybeSingle();

    if (withoutBranch.error) {
      console.error(
        "requireValidQrSession supabase error:",
        withoutBranch.error,
      );
      return {
        valid: false,
        error: `Failed to validate session: ${withoutBranch.error.message}`,
      };
    }
    session = withoutBranch.data;
  } else {
    session = withBranch.data;
  }

  if (!session) {
    return { valid: false, error: "Invalid QR session" };
  }
  if (!session.is_active) {
    return { valid: false, error: "QR session is inactive" };
  }
  if (new Date(session.expires_at) <= new Date()) {
    return { valid: false, error: "QR session has expired" };
  }

  return {
    valid: true,
    session: {
      id: session.id,
      is_active: session.is_active,
      expires_at: session.expires_at,
      branch_id: session.branch_id ?? null,
    },
  };
}

// =============================================================================
// Helpers
// =============================================================================

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function generateOrderNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
}

function mapPosOrder(row: Record<string, unknown>): PosOrder {
  return {
    ...(row as unknown as PosOrder),
    subtotal: toNumber(row.subtotal),
    discount_amount: toNumber(row.discount_amount),
    tax_amount: toNumber(row.tax_amount),
    total_amount: toNumber(row.total_amount),
    service_charge_amount: toNumber(row.service_charge_amount ?? 0),
  };
}

function mapPosOrderItem(row: Record<string, unknown>): PosOrderItem {
  return {
    ...(row as unknown as PosOrderItem),
    quantity: toNumber(row.quantity),
    unit_price: toNumber(row.unit_price),
    discount_amount: toNumber(row.discount_amount),
    line_total: toNumber(row.line_total),
  };
}

function mapPosPayment(row: Record<string, unknown>): PosPayment {
  return {
    ...(row as unknown as PosPayment),
    amount: toNumber(row.amount),
    received_amount:
      row.received_amount != null ? toNumber(row.received_amount) : null,
    change_amount: toNumber(row.change_amount),
  };
}

async function recalculateOrderTotals(
  supabase: SupabaseClient,
  orderId: string,
): Promise<{
  success: boolean;
  subtotal: number;
  total: number;
  error?: string;
}> {
  // 1. Fetch order and branch
  const { data: order, error: orderErr } = await supabase
    .from("pos_orders")
    .select("branch_id")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return {
      success: false,
      subtotal: 0,
      total: 0,
      error: "Order not found",
    };
  }

  // 2. Fetch billing settings
  let vatEnabled = true;
  let vatRate = 12;
  let scEnabled = true;
  let scRate = 5;
  let priceMode = "exclusive";

  if (order.branch_id) {
    const { data: settings } = await supabase
      .from("pos_billing_settings")
      .select("*")
      .eq("branch_id", order.branch_id)
      .maybeSingle();

    if (settings) {
      vatEnabled = Boolean(settings.vat_enabled);
      vatRate = Number(settings.vat_rate ?? 12);
      scEnabled = Boolean(settings.service_charge_enabled);
      scRate = Number(settings.service_charge_rate ?? 5);
      priceMode =
        settings.price_mode === "inclusive" ? "inclusive" : "exclusive";
    }
  }

  // 3. Fetch order items
  const { data: items, error: itemsErr } = await supabase
    .from("pos_order_items")
    .select(
      "id, quantity, unit_price, discount_amount, area_id, area_code, is_vat_exempt",
    )
    .eq("order_id", orderId);

  if (itemsErr) {
    return {
      success: false,
      subtotal: 0,
      total: 0,
      error: "Failed to fetch order items",
    };
  }

  const orderItems = items ?? [];

  let orderSubtotal = 0;
  let orderDiscount = 0;
  let orderTax = 0;
  let orderServiceCharge = 0;

  // Only these area codes qualify for service charge.
  const SERVICE_CHARGE_CODES = new Set(["ieat", "idrink"]);

  const isServiceChargeable = (areaCode: string | null) =>
    SERVICE_CHARGE_CODES.has((areaCode ?? "").trim().toLowerCase());

  // 4. Group items by area.
  // subtotal includes ALL items after discounts.
  // serviceChargeSubtotal includes ONLY ieat and idrink items.
  const areaMap = new Map<
    string,
    {
      area_id: string | null;
      area_code: string | null;
      items: typeof orderItems;
      subtotal: number;
      serviceChargeSubtotal: number;
    }
  >();

  for (const item of orderItems) {
    const qty = toNumber(item.quantity);
    const unitPrice = toNumber(item.unit_price);
    const discount = Math.round(toNumber(item.discount_amount));

    const lineGross = qty * unitPrice;
    const lineNet = Math.max(0, lineGross - discount);

    orderSubtotal += lineGross;
    orderDiscount += discount;

    // VAT applies independently of service-charge eligibility.
    let itemVat = 0;

    if (vatEnabled && !item.is_vat_exempt) {
      itemVat =
        priceMode === "inclusive"
          ? (lineNet * vatRate) / (100 + vatRate)
          : lineNet * (vatRate / 100);
    }

    orderTax += itemVat;

    const areaKey = item.area_id ?? item.area_code ?? "general";

    if (!areaMap.has(areaKey)) {
      areaMap.set(areaKey, {
        area_id: item.area_id ?? null,
        area_code: item.area_code ?? null,
        items: [],
        subtotal: 0,
        serviceChargeSubtotal: 0,
      });
    }

    const group = areaMap.get(areaKey)!;

    group.items.push(item);
    group.subtotal += lineNet;

    // Only eligible items contribute to the service-charge base.
    if (scEnabled && isServiceChargeable(item.area_code)) {
      group.serviceChargeSubtotal += lineNet;
    }
  }

  const areaChargesRows = [];

  // 5. Calculate service charge per area and allocate it
  // only to eligible items.
  for (const [, group] of areaMap.entries()) {
    const areaSc =
      scEnabled && group.serviceChargeSubtotal > 0
        ? Math.round(group.serviceChargeSubtotal * (scRate / 100))
        : 0;

    orderServiceCharge += areaSc;

    type Allocation = {
      id: string;
      net: number;
      allocated: number;
      remainder: number;
    };

    const allocations: Allocation[] = [];

    for (const item of group.items) {
      const eligible = scEnabled && isServiceChargeable(item.area_code);

      const itemNet = Math.max(
        0,
        toNumber(item.quantity) * toNumber(item.unit_price) -
          Math.round(toNumber(item.discount_amount)),
      );

      allocations.push({
        id: item.id,
        // Ineligible items have no share of the charge.
        net: eligible ? itemNet : 0,
        allocated: 0,
        remainder: 0,
      });
    }

    const eligibleSubtotal = allocations.reduce(
      (sum, allocation) => sum + allocation.net,
      0,
    );

    // Allocate whole pesos proportionally to eligible items.
    if (eligibleSubtotal > 0 && areaSc > 0) {
      let allocatedSum = 0;

      for (const allocation of allocations) {
        if (allocation.net <= 0) continue;

        const exactShare = (allocation.net / eligibleSubtotal) * areaSc;

        allocation.allocated = Math.floor(exactShare);
        allocation.remainder = exactShare - allocation.allocated;

        allocatedSum += allocation.allocated;
      }

      // Distribute remaining pesos using largest remainders.
      const remainderPesos = areaSc - allocatedSum;

      const ranked = allocations
        .filter((allocation) => allocation.net > 0)
        .sort((a, b) => {
          if (b.remainder !== a.remainder) {
            return b.remainder - a.remainder;
          }

          return a.id.localeCompare(b.id);
        });

      for (let i = 0; i < remainderPesos && i < ranked.length; i++) {
        ranked[i].allocated += 1;
      }
    }

    const allocationMap = new Map(
      allocations.map((allocation) => [allocation.id, allocation.allocated]),
    );

    let areaVat = 0;

    // Update each item's service charge and VAT.
    for (const item of group.items) {
      const itemSc = allocationMap.get(item.id) ?? 0;

      const itemNet = Math.max(
        0,
        toNumber(item.quantity) * toNumber(item.unit_price) -
          Math.round(toNumber(item.discount_amount)),
      );

      const vatFactor =
        vatEnabled && !item.is_vat_exempt
          ? priceMode === "inclusive"
            ? vatRate / (100 + vatRate)
            : vatRate / 100
          : 0;

      const itemVat = itemNet * vatFactor;

      areaVat += itemVat;

      const { error: updateItemErr } = await supabase
        .from("pos_order_items")
        .update({
          service_charge: itemSc,
          vat_amount: Number(itemVat.toFixed(2)),
          vat_rate: vatEnabled && !item.is_vat_exempt ? vatRate : 0,
        })
        .eq("id", item.id);

      if (updateItemErr) {
        return {
          success: false,
          subtotal: orderSubtotal,
          total: 0,
          error: `Failed to update item ${item.id}`,
        };
      }
    }

    // Area subtotal includes all items, not just eligible ones.
    const areaTotal =
      group.subtotal + (priceMode === "exclusive" ? areaVat : 0) + areaSc;

    areaChargesRows.push({
      order_id: orderId,
      area_id: group.area_id,
      area_code: group.area_code,
      subtotal: group.subtotal,
      discount_amount: 0,
      taxable_amount: group.subtotal,
      tax_amount: Number(areaVat.toFixed(2)),
      service_charge_rate: scRate,
      service_charge_amount: areaSc,
      total_amount: Number(areaTotal.toFixed(2)),
    });
  }

  // 6. Upsert area charge summaries
  if (areaChargesRows.length > 0) {
    const { error: areaErr } = await supabase
      .from("pos_order_area_charges")
      .upsert(areaChargesRows, {
        onConflict: "order_id,area_id",
      });

    if (areaErr) {
      return {
        success: false,
        subtotal: orderSubtotal,
        total: 0,
        error: "Failed to update area charge summaries",
      };
    }
  }

  // 7. Calculate final order total
  const netSelling = orderSubtotal - orderDiscount;

  const totalAmount = Number(
    (
      netSelling +
      (priceMode === "exclusive" ? orderTax : 0) +
      orderServiceCharge
    ).toFixed(2),
  );

  // 8. Update order summary
  const { error: updateOrderErr } = await supabase
    .from("pos_orders")
    .update({
      subtotal: orderSubtotal,
      discount_amount: Math.round(orderDiscount),
      tax_amount: Number(orderTax.toFixed(2)),
      service_charge_amount: orderServiceCharge,
      total_amount: totalAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateOrderErr) {
    return {
      success: false,
      subtotal: orderSubtotal,
      total: 0,
      error: "Failed to update order totals",
    };
  }

  return {
    success: true,
    subtotal: orderSubtotal,
    total: totalAmount,
  };
}

async function deductInventory(
  supabase: SupabaseClient,
  branchId: string,
  productId: string,
  quantity: number,
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  const { data: stockRow, error: stockError } = await supabase
    .from("pos_inventory")
    .select("id, stock_quantity")
    .eq("branch_id", branchId)
    .eq("product_id", productId)
    .maybeSingle();

  if (stockError) {
    return { success: false, error: stockError.message };
  }

  // Untracked products are allowed to sell
  if (!stockRow) {
    return { success: true };
  }

  const current = toNumber(stockRow.stock_quantity);
  const newBalance = current - quantity;

  if (newBalance < 0) {
    return {
      success: false,
      error: `Insufficient stock. Available: ${current}`,
    };
  }

  const { error: updateError } = await supabase
    .from("pos_inventory")
    .update({
      stock_quantity: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stockRow.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  await supabase.from("pos_inventory_movements").insert({
    branch_id: branchId,
    product_id: productId,
    movement_type: "sale",
    quantity: -quantity,
    reference_id: orderId,
    notes: "Order sale",
  });

  return { success: true };
}

/**
 * Shared item-insert logic (area snapshot).
 * No auth — callers are responsible for authorization.
 */
async function addOrderItemsInternal(
  supabase: SupabaseClient,
  orderId: string,
  items: { product_id: string; quantity: number; discount_amount?: number }[],
): Promise<{ success: boolean; data?: PosOrderItem[]; error?: string }> {
  // 1. Order must still be open
  const { data: order, error: orderError } = await supabase
    .from("pos_orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: "Order not found" };
  }

  if (order.status === "completed" || order.status === "cancelled") {
    return {
      success: false,
      error: `Cannot add items to a ${order.status} order`,
    };
  }

  // 2. Fetch products + area
  const productIds = items.map((i) => i.product_id);

  // 3. Fetch products with the related pos_areas table joined
  const { data: products, error: productsError } = await supabase
    .from("pos_products")
    .select(
      `
    id, 
    name, 
    price, 
    area_id, 
    is_active, 
    pos_areas (
      code
    )
  `,
    )
    .in("id", productIds);

  if (productsError) {
    return { success: false, error: productsError.message };
  }

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));

  // 4. Build rows with area snapshot
  const rowsToInsert = [];
  for (const item of items) {
    const product = productMap.get(item.product_id);
    if (!product) {
      return { success: false, error: `Product ${item.product_id} not found` };
    }
    if (!product.is_active) {
      return {
        success: false,
        error: `Product "${product.name}" is inactive`,
      };
    }

    const unitPrice = toNumber(product.price);
    const discount = Math.round(toNumber(item.discount_amount));
    const lineTotal = Math.max(0, unitPrice * item.quantity - discount);

    // 5. Cast pos_areas to avoid the 'never' type error
    const posArea = product.pos_areas as
      | { code?: string }
      | { code?: string }[]
      | null;
    const areaCode = Array.isArray(posArea)
      ? (posArea[0]?.code ?? null)
      : (posArea?.code ?? null);

    rowsToInsert.push({
      order_id: orderId,
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price: unitPrice,
      discount_amount: discount,
      line_total: lineTotal,
      area_id: product.area_id ?? null,
      area_code: areaCode,
    });
  }

  // 6. Insert
  const { data: inserted, error: insertError } = await supabase
    .from("pos_order_items")
    .insert(rowsToInsert)
    .select("*");

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // 7. Recalculate totals
  await recalculateOrderTotals(supabase, orderId);

  return {
    success: true,
    data: (inserted ?? []).map(mapPosOrderItem),
  };
}

function zodErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || "Validation failed";
  }
  return error instanceof Error ? error.message : "Unexpected error";
}

// =============================================================================
// Schemas
// =============================================================================

const createOrderSchema = z.object({
  branch_id: z.string().uuid().optional().nullable(),
  terminal_id: z.string().uuid().optional().nullable(),
  shift_id: z.string().uuid().optional().nullable(),
  session_id: z.string().uuid().optional().nullable(),
  order_type: z
    .enum(["walk_in", "dine_in", "takeaway", "delivery"])
    .default("walk_in"),
  order_source: z.enum(["pos", "qr", "manual"]).default("pos"),
  client_id: z.string().optional().nullable(),
  reservation_id: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

const addItemsSchema = z.object({
  order_id: z.string().uuid(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.coerce.number().positive().max(999),
        discount_amount: z.coerce
          .number()
          .min(0)
          .int() // whole pesos only
          .optional()
          .default(0),
      }),
    )
    .min(1),
});

const updateItemSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.coerce.number().positive().max(999).optional(),
  discount_amount: z.coerce.number().min(0).int().optional(),
});

const paymentSchema = z.object({
  order_id: z.string().uuid(),
  payment_method: z.enum([
    "cash",
    "card",
    "gcash",
    "maya",
    "bank_transfer",
    "other",
  ]),
  amount: z.coerce.number().positive(),
  received_amount: z.coerce.number().min(0).optional().nullable(),
  reference_number: z.string().max(100).optional().nullable(),
});

const createQrOrderSchema = z.object({
  session_token: z.string().min(1),
  order_type: z
    .enum(["walk_in", "dine_in", "takeaway", "delivery"])
    .default("dine_in"),
  notes: z.string().max(1000).optional().nullable(),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.coerce.number().positive().max(999),
        discount_amount: z.coerce.number().min(0).int().optional().default(0),
      }),
    )
    .min(1),
});

// =============================================================================
// Create Order (staff / POS)
// =============================================================================

export async function createPosOrder(
  input: z.infer<typeof createOrderSchema>,
): Promise<{
  success: boolean;
  data?: PosOrder;
  error?: string;
}> {
  try {
    const validated = createOrderSchema.parse(input);
    const staff = await requireOrderStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createOrderAdminClient();
    const orderNumber = generateOrderNumber();

    const { data, error } = await supabase
      .from("pos_orders")
      .insert({
        order_number: orderNumber,
        branch_id: validated.branch_id ?? null,
        terminal_id: validated.terminal_id ?? null,
        shift_id: validated.shift_id ?? null,
        session_id: validated.session_id ?? null,
        cashier_user_id: staff.user.id,
        client_id: validated.client_id ?? null,
        reservation_id: validated.reservation_id ?? null,
        order_type: validated.order_type,
        order_source: validated.order_source,
        status: "open",
        subtotal: 0,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: 0,
        service_charge_amount: 0,
        notes: validated.notes ?? null,
      })
      .select("*")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: mapPosOrder(data) };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

// =============================================================================
// Create Order (QR / customer — no staff account)
// =============================================================================

/**
 * Public entry point for the customer QR menu.
 * Auth is the QR session token only — customers do not need accounts.
 */
export async function createQrOrder(
  input: z.input<typeof createQrOrderSchema>,
): Promise<{
  success: boolean;
  data?: PosOrder;
  error?: string;
  /** true when items were added to an existing open order */
  updatedExisting?: boolean;
}> {
  try {
    const validated = createQrOrderSchema.parse(input);

    const sessionCheck = await requireValidQrSession(validated.session_token);
    if (!sessionCheck.valid) {
      return { success: false, error: sessionCheck.error };
    }

    const supabase = createOrderAdminClient();
    const sessionId = sessionCheck.session.id;

    // ── Reuse open order for this seating (one tab per session) ───────────
    const { data: existingOrder, error: existingError } = await supabase
      .from("pos_orders")
      .select("*")
      .eq("session_id", sessionId)
      .in("status", ["open", "in_progress", "ready"]) // still unpaid / not closed
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      return { success: false, error: existingError.message };
    }

    if (existingOrder) {
      const addResult = await addOrderItemsInternal(
        supabase,
        existingOrder.id,
        validated.items,
      );

      if (!addResult.success) {
        return { success: false, error: addResult.error };
      }

      // Optional: append notes
      if (validated.notes?.trim()) {
        const prev = existingOrder.notes?.trim() ?? "";
        const next = validated.notes.trim();
        const merged = prev ? `${prev}\n${next}` : next;
        await supabase
          .from("pos_orders")
          .update({
            notes: merged,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingOrder.id);
      }

      const { data: fresh } = await supabase
        .from("pos_orders")
        .select("*")
        .eq("id", existingOrder.id)
        .single();

      return {
        success: true,
        data: mapPosOrder(fresh ?? existingOrder),
        updatedExisting: true,
      };
    }

    // ── No open order → create one ────────────────────────────────────────
    const { branchId, error: branchError } = await resolveBranchId(
      supabase,
      sessionCheck.session.branch_id,
    );
    if (!branchId) {
      return {
        success: false,
        error: branchError ?? "No branch available for this order",
      };
    }

    const orderNumber = generateOrderNumber();

    const { data: order, error: orderError } = await supabase
      .from("pos_orders")
      .insert({
        order_number: orderNumber,
        branch_id: branchId,
        session_id: sessionId,
        cashier_user_id: null,
        order_type: validated.order_type,
        order_source: "qr",
        status: "open",
        subtotal: 0,
        discount_amount: 0,
        tax_amount: 0,
        total_amount: 0,
        service_charge_amount: 0,
        notes: validated.notes ?? null,
      })
      .select("*")
      .single();

    if (orderError || !order) {
      return {
        success: false,
        error: orderError?.message ?? "Failed to create order",
      };
    }

    const addResult = await addOrderItemsInternal(
      supabase,
      order.id,
      validated.items,
    );

    if (!addResult.success) {
      await supabase.from("pos_orders").delete().eq("id", order.id);
      return { success: false, error: addResult.error };
    }

    const { data: fresh } = await supabase
      .from("pos_orders")
      .select("*")
      .eq("id", order.id)
      .single();

    return {
      success: true,
      data: mapPosOrder(fresh ?? order),
      updatedExisting: false,
    };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

// =============================================================================
// Add Items (staff)
// =============================================================================

export async function addOrderItems(
  input: z.input<typeof addItemsSchema>,
): Promise<{
  success: boolean;
  data?: PosOrderItem[];
  error?: string;
}> {
  try {
    const validated = addItemsSchema.parse(input);
    const staff = await requireOrderStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createOrderAdminClient();
    return addOrderItemsInternal(supabase, validated.order_id, validated.items);
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

// =============================================================================
// Update / Remove Item (staff)
// =============================================================================

export async function updateOrderItem(
  input: z.infer<typeof updateItemSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = updateItemSchema.parse(input);
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from("pos_order_items")
      .select("id, order_id, unit_price, quantity, discount_amount")
      .eq("id", validated.item_id)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: "Order item not found" };
    }

    // Guard: don't edit completed/cancelled orders
    const { data: order } = await supabase
      .from("pos_orders")
      .select("status")
      .eq("id", existing.order_id)
      .single();

    if (
      order &&
      (order.status === "completed" || order.status === "cancelled")
    ) {
      return {
        success: false,
        error: `Cannot edit items on a ${order.status} order`,
      };
    }

    const quantity = validated.quantity ?? toNumber(existing.quantity);
    const discount = Math.round(
      validated.discount_amount ?? toNumber(existing.discount_amount),
    );
    const unitPrice = toNumber(existing.unit_price);
    const lineTotal = Math.max(0, unitPrice * quantity - discount);

    const { error } = await supabase
      .from("pos_order_items")
      .update({
        quantity,
        discount_amount: discount,
        line_total: lineTotal,
      })
      .eq("id", validated.item_id);

    if (error) return { success: false, error: error.message };

    await recalculateOrderTotals(supabase, existing.order_id);
    return { success: true };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

export async function removeOrderItem(itemId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from("pos_order_items")
      .select("order_id")
      .eq("id", itemId)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: "Order item not found" };
    }

    const { data: order } = await supabase
      .from("pos_orders")
      .select("status")
      .eq("id", existing.order_id)
      .single();

    if (
      order &&
      (order.status === "completed" || order.status === "cancelled")
    ) {
      return {
        success: false,
        error: `Cannot remove items from a ${order.status} order`,
      };
    }

    const { error } = await supabase
      .from("pos_order_items")
      .delete()
      .eq("id", itemId);

    if (error) return { success: false, error: error.message };

    await recalculateOrderTotals(supabase, existing.order_id);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove item",
    };
  }
}

// =============================================================================
// Get Orders (staff)
// =============================================================================

export async function getPosOrder(orderId: string): Promise<{
  success: boolean;
  data?: PosOrder & { items: PosOrderItem[]; payments: PosPayment[] };
  error?: string;
}> {
  try {
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();

    const { data: order, error: orderError } = await supabase
      .from("pos_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return { success: false, error: "Order not found" };
    }

    const [{ data: items }, { data: payments }] = await Promise.all([
      supabase
        .from("pos_order_items")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true }),
      supabase
        .from("pos_payments")
        .select("*")
        .eq("order_id", orderId)
        .order("paid_at", { ascending: true }),
    ]);

    return {
      success: true,
      data: {
        ...mapPosOrder(order),
        items: (items ?? []).map(mapPosOrderItem),
        payments: (payments ?? []).map(mapPosPayment),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load order",
    };
  }
}

export async function getOpenOrders(branchId?: string): Promise<{
  success: boolean;
  data: PosOrder[];
  error?: string;
}> {
  try {
    const staff = await requireOrderStaff();
    if (!staff.authorized) {
      return { success: false, data: [], error: staff.error };
    }

    const supabase = createOrderAdminClient();

    let query = supabase
      .from("pos_orders")
      .select("*")
      .in("status", ["open", "in_progress", "ready"])
      .order("created_at", { ascending: false })
      .limit(100);

    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    const { data, error } = await query;
    if (error) return { success: false, data: [], error: error.message };

    return {
      success: true,
      data: (data ?? []).map(mapPosOrder),
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Failed to load orders",
    };
  }
}

/**
 * Admin view: all orders placed under a specific QR session.
 */
export async function getOrdersBySessionId(sessionId: string): Promise<{
  success: boolean;
  data: SessionOrder[];
  error?: string;
}> {
  try {
    const staff = await requireOrderStaff();
    if (!staff.authorized) {
      return { success: false, data: [], error: staff.error };
    }

    const supabase = createOrderAdminClient();

    const { data: orders, error } = await supabase
      .from("pos_orders")
      .select(
        `
    id,
    order_number,
    status,
    subtotal,
    discount_amount,
    tax_amount,
    service_charge_amount,
    total_amount,
    created_at,
    pos_order_items (
      id,
      product_name,
      quantity,
      unit_price,
      line_total,
      area_code,
      service_charge,
      vat_amount
    ),
    pos_payments (
      payment_method,
      amount,
      paid_at
    )
  `,
      )
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    const mapped: SessionOrder[] = (orders ?? []).map((o: any) => {
      const payments = o.pos_payments ?? [];
      const primaryPayment =
        payments.length > 0
          ? [...payments].sort(
              (a: any, b: any) =>
                new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime(),
            )[0]
          : null;

      return {
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        subtotal: toNumber(o.subtotal),
        discount_amount: toNumber(o.discount_amount),
        tax_amount: toNumber(o.tax_amount),
        service_charge_amount: toNumber(o.service_charge_amount),
        total_amount: toNumber(o.total_amount),
        created_at: o.created_at,
        payment_method: primaryPayment?.payment_method ?? null,
        item_count: o.pos_order_items?.length ?? 0,
        items: (o.pos_order_items ?? []).map((item: any) => ({
          id: item.id,
          product_name: item.product_name,
          quantity: toNumber(item.quantity),
          unit_price: toNumber(item.unit_price),
          line_total: toNumber(item.line_total),
          area_code: item.area_code ?? null,
          service_charge: toNumber(item.service_charge ?? 0),
          vat_amount: toNumber(item.vat_amount ?? 0),
        })),
      };
    });

    return { success: true, data: mapped };
  } catch (err) {
    console.error("getOrdersBySessionId error:", err);
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Failed to load orders",
    };
  }
}

// =============================================================================
// Complete / Cancel (staff)
// =============================================================================

export async function completeOrder(orderId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();

    const { data: order, error: orderError } = await supabase
      .from("pos_orders")
      .select("id, status, branch_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return { success: false, error: "Order not found" };
    }
    if (order.status === "completed") {
      return { success: false, error: "Order is already completed" };
    }
    if (order.status === "cancelled") {
      return { success: false, error: "Cannot complete a cancelled order" };
    }

    const { data: items } = await supabase
      .from("pos_order_items")
      .select("product_id, quantity")
      .eq("order_id", orderId);

    if (order.branch_id && items && items.length > 0) {
      for (const item of items) {
        const result = await deductInventory(
          supabase,
          order.branch_id,
          item.product_id,
          toNumber(item.quantity),
          orderId,
        );
        if (!result.success) {
          return { success: false, error: result.error };
        }
      }
    }

    const { error } = await supabase
      .from("pos_orders")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to complete order",
    };
  }
}

export async function cancelOrder(
  orderId: string,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();

    const { data: order } = await supabase
      .from("pos_orders")
      .select("status")
      .eq("id", orderId)
      .single();

    if (!order) return { success: false, error: "Order not found" };
    if (order.status === "completed") {
      return { success: false, error: "Cannot cancel a completed order" };
    }

    const { error } = await supabase
      .from("pos_orders")
      .update({
        status: "cancelled",
        notes: reason ? `Cancelled: ${reason}` : "Cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel order",
    };
  }
}

// =============================================================================
// Payments (staff)
// =============================================================================

export async function recordPayment(
  input: z.infer<typeof paymentSchema>,
): Promise<{
  success: boolean;
  data?: PosPayment;
  error?: string;
}> {
  try {
    const validated = paymentSchema.parse(input);
    const staff = await requireOrderStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createOrderAdminClient();

    const { data: order } = await supabase
      .from("pos_orders")
      .select("id, status")
      .eq("id", validated.order_id)
      .single();

    if (!order) return { success: false, error: "Order not found" };
    if (order.status === "cancelled") {
      return {
        success: false,
        error: "Cannot take payment on a cancelled order",
      };
    }

    const received = validated.received_amount ?? validated.amount;
    const change = Math.max(0, received - validated.amount);

    const { data, error } = await supabase
      .from("pos_payments")
      .insert({
        order_id: validated.order_id,
        payment_method: validated.payment_method,
        amount: validated.amount,
        received_amount: received,
        change_amount: change,
        reference_number: validated.reference_number ?? null,
        status: "completed",
      })
      .select("*")
      .single();

    if (error) return { success: false, error: error.message };

    return { success: true, data: mapPosPayment(data) };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

export async function payAndCompleteOrder(
  input: z.infer<typeof paymentSchema>,
): Promise<{ success: boolean; data?: PosPayment; error?: string }> {
  const pay = await recordPayment(input);
  if (!pay.success) return pay;

  const done = await completeOrder(input.order_id);
  if (!done.success) {
    return {
      success: false,
      error: done.error ?? "Payment recorded but failed to complete order",
    };
  }

  return pay;
}

export async function getOrdersBySessionToken(sessionToken: string): Promise<{
  success: boolean;
  data: SessionOrder[];
  error?: string;
}> {
  try {
    if (!sessionToken?.trim()) {
      return { success: false, data: [], error: "Missing session token" };
    }

    const sessionCheck = await requireValidQrSession(sessionToken.trim());
    if (!sessionCheck.valid) {
      return { success: false, data: [], error: sessionCheck.error };
    }

    const supabase = createOrderAdminClient();
    const sessionId = sessionCheck.session.id;

    const { data: orders, error } = await supabase
      .from("pos_orders")
      .select(
        `
        id,
        order_number,
        status,
        total_amount,
        created_at,
        pos_order_items (
          id,
          product_name,
          quantity,
          unit_price,
          line_total,
          area_code
        ),
        pos_payments (
          payment_method,
          amount,
          paid_at
        )
      `,
      )
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    const mapped: SessionOrder[] = (orders ?? []).map((o: any) => {
      const payments = o.pos_payments ?? [];
      const primaryPayment =
        payments.length > 0
          ? [...payments].sort(
              (a: any, b: any) =>
                new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime(),
            )[0]
          : null;

      return {
        id: o.id,
        status: o.status,
        total_amount: toNumber(o.total_amount),
        created_at: o.created_at,
        payment_method: primaryPayment?.payment_method ?? null,
        item_count: o.pos_order_items?.length ?? 0,
        items: (o.pos_order_items ?? []).map((item: any) => ({
          id: item.id,
          product_name: item.product_name,
          quantity: toNumber(item.quantity),
          unit_price: toNumber(item.unit_price),
          line_total: toNumber(item.line_total),
          area_code: item.area_code ?? null,
        })),
        order_number: o.order_number,
      };
    });

    return { success: true, data: mapped };
  } catch (err) {
    console.error("getOrdersBySessionToken error:", err);
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : "Failed to load orders",
    };
  }
}
