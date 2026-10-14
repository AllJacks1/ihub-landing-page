"use server";

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { z } from "zod";

// ==================== Types ====================

export type Department = "bar" | "kitchen";

export type InventoryItem = {
  id: string;
  product_id: string;
  branch_id: string;
  branch_name: string | null;
  name: string;
  sku: string | null;
  category: string;
  category_id: string | null;
  quantity: number;
  min_stock: number;
  is_active: boolean;
  updated_at: string;
};

export type InventoryCategory = {
  id: string;
  name: string;
};

export type InventoryBranch = {
  id: string;
  name: string;
};

export type StockAction =
  | "stock_in"
  | "stock_out"
  | "adjust_increase"
  | "adjust_decrease";

export type InventoryStockMovement = {
  id: string;
  branch_id: string;
  product_id: string;
  action: StockAction;
  quantity: number;
  notes: string | null;
  created_at: string;
};

export type EquipmentCondition = "good" | "damaged" | "under_maintenance";

export type InventoryEquipment = {
  id: string;
  name: string;
  category: string;
  department: Department;
  total_quantity: number;
  available_quantity: number;
  condition: EquipmentCondition;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryEquipmentHistory = {
  id: string;
  equipment_id: string;
  event: string;
  details: string | null;
  staff_user_id: string | null;
  staff_name: string | null;
  created_at: string;
};

// ==================== Supabase clients ====================

async function createInventorySupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server action does not need to modify cookies here.
        },
      },
    },
  );
}

// Server-only privileged client. Every query runs as the service
// role (the inventory tables have RLS enabled with no policies),
// so this client must never run in the browser and must only be
// used after the requester passed staff authorization (see
// requireInventoryStaff). Auth persistence and refresh are
// disabled so queries execute with the service key itself, never
// with a signed-in user's JWT. The service-role key is a
// server-side secret and is never sent to the browser.
let inventoryAdminClient: SupabaseClient | null = null;

function createInventoryAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }

  if (!serviceRoleKey || serviceRoleKey.trim() === "") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured; inventory management is disabled",
    );
  }

  if (!inventoryAdminClient) {
    inventoryAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return inventoryAdminClient;
}

// Trusted staff authorization for inventory operations. Mirrors
// the project's existing admin mechanism (createPost() and
// getCurrentUser() in src/lib/actions.ts):
//   1. identify the requester from their Supabase Auth session, and
//   2. verify the account exists in the profiles staff directory.
//
// auth.getUser() alone is NOT treated as sufficient — any
// authenticated Supabase account passes it — so the profiles
// directory check restricts these operations to known staff
// accounts. The adminId cookie gate in src/app/admin/layout.tsx
// is a route convenience, not a security boundary, and is not
// relied on here. The staff id used for audit rows always comes
// from this verified session — never from the client.
type InventoryStaffUser = {
  id: string;
  email: string | null;
};

export async function requireInventoryStaff(): Promise<
  | { authorized: true; user: InventoryStaffUser }
  | { authorized: false; error: string }
> {
  const authClient = await createInventorySupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return { authorized: false, error: "Unauthorized" };
  }

  const adminClient = createInventoryAdminClient();

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

// ==================== Shared helpers ====================

// pos_inventory rows joined with the product, category, and
// branch they reference. PostgREST resolves the foreign keys
// (pos_inventory.product_id -> pos_products.id,
// pos_products.category_id -> pos_categories.id,
// pos_inventory.branch_id -> pos_branches.id) into single
// embedded objects.
const INVENTORY_SELECT =
  "id, branch_id, product_id, stock_quantity, reorder_level, updated_at, pos_products(id, name, sku, category_id, is_active, pos_categories(name)), pos_branches(name)";

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapItemRow(row: Record<string, unknown>): InventoryItem {
  const product = (row.pos_products ?? {}) as Record<string, unknown>;
  const category = (product.pos_categories ?? {}) as Record<string, unknown>;
  const branch = (row.pos_branches ?? {}) as Record<string, unknown>;

  return {
    id: String(row.id),
    product_id: String(product.id ?? row.product_id ?? ""),
    branch_id: String(row.branch_id ?? ""),
    branch_name: branch.name ? String(branch.name) : null,
    name: String(product.name ?? ""),
    sku: product.sku ? String(product.sku) : null,
    category: category.name ? String(category.name) : "",
    category_id: product.category_id ? String(product.category_id) : null,
    quantity: toNumber(row.stock_quantity),
    min_stock: toNumber(row.reorder_level),
    is_active: Boolean(product.is_active),
    updated_at: String(row.updated_at),
  };
}

function mapMovementRow(
  row: Record<string, unknown>,
): InventoryStockMovement {
  return {
    id: String(row.id),
    branch_id: String(row.branch_id ?? ""),
    product_id: String(row.product_id ?? ""),
    action: String(row.movement_type) as StockAction,
    quantity: toNumber(row.quantity),
    notes: row.notes ? String(row.notes) : null,
    created_at: String(row.created_at),
  };
}

// ==================== Products (consumables) ====================

const createItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  category_id: z.string().uuid("Select an existing category"),
  branch_id: z.string().uuid("Select a branch"),
  quantity: z.coerce
    .number({ error: "Quantity must be a number" })
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative")
    .max(1_000_000, "Quantity is too large"),
  min_stock: z.coerce
    .number({ error: "Minimum stock must be a number" })
    .int("Minimum stock must be a whole number")
    .min(0, "Minimum stock cannot be negative")
    .max(1_000_000, "Minimum stock is too large"),
});

export async function getInventoryItems(): Promise<{
  success: boolean;
  data: InventoryItem[];
  error?: string;
}> {
  try {
    const staff = await requireInventoryStaff();
    if (!staff.authorized) {
      return { success: false, data: [], error: staff.error };
    }

    const supabase = createInventoryAdminClient();

    const { data, error } = await supabase
      .from("pos_inventory")
      .select(INVENTORY_SELECT)
      .order("updated_at", { ascending: false });

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: (data ?? []).map(mapItemRow) };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Failed to load inventory",
    };
  }
}

export async function getInventoryCategories(): Promise<{
  success: boolean;
  data: InventoryCategory[];
  error?: string;
}> {
  try {
    const staff = await requireInventoryStaff();
    if (!staff.authorized) {
      return { success: false, data: [], error: staff.error };
    }

    const supabase = createInventoryAdminClient();

    const { data, error } = await supabase
      .from("pos_categories")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    return {
      success: true,
      data: (data ?? []).map((row) => ({
        id: String(row.id),
        name: String(row.name),
      })),
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error ? error.message : "Failed to load categories",
    };
  }
}

export async function getInventoryBranches(): Promise<{
  success: boolean;
  data: InventoryBranch[];
  error?: string;
}> {
  try {
    const staff = await requireInventoryStaff();
    if (!staff.authorized) {
      return { success: false, data: [], error: staff.error };
    }

    const supabase = createInventoryAdminClient();

    const { data, error } = await supabase
      .from("pos_branches")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    return {
      success: true,
      data: (data ?? []).map((row) => ({
        id: String(row.id),
        name: String(row.name),
      })),
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error ? error.message : "Failed to load branches",
    };
  }
}

export async function createInventoryItem(input: {
  name: string;
  category_id: string;
  branch_id: string;
  quantity: number | string;
  min_stock: number | string;
}): Promise<{
  success: boolean;
  data?: InventoryItem;
  error?: string;
}> {
  try {
    const validated = createItemSchema.parse(input);

    const staff = await requireInventoryStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createInventoryAdminClient();

    // Stock is tracked per branch, so a product is created first
    // and then linked to the selected branch with its opening
    // quantity and reorder level.
    const { data: product, error: productError } = await supabase
      .from("pos_products")
      .insert({
        name: validated.name,
        category_id: validated.category_id,
        is_active: true,
      })
      .select("id")
      .single();

    if (productError) {
      return { success: false, error: productError.message };
    }

    const { data, error } = await supabase
      .from("pos_inventory")
      .insert({
        branch_id: validated.branch_id,
        product_id: product.id,
        stock_quantity: validated.quantity,
        reorder_level: validated.min_stock,
      })
      .select(INVENTORY_SELECT)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: mapItemRow(data as Record<string, unknown>) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create item",
    };
  }
}

// Quantity is intentionally NOT editable here — quantities only
// change through recorded stock movements so the audit log stays
// complete and stock can never silently go negative.
const updateItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(100),
  category_id: z.string().uuid("Select an existing category"),
  min_stock: z.coerce
    .number({ error: "Minimum stock must be a number" })
    .int("Minimum stock must be a whole number")
    .min(0, "Minimum stock cannot be negative")
    .max(1_000_000, "Minimum stock is too large"),
});

export async function updateInventoryItem(input: {
  id: string;
  name: string;
  category_id: string;
  min_stock: number | string;
}): Promise<{
  success: boolean;
  data?: InventoryItem;
  error?: string;
}> {
  try {
    const validated = updateItemSchema.parse(input);

    const staff = await requireInventoryStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createInventoryAdminClient();

    // The inventory row identifies the branch/product pair; the
    // editable product details live on pos_products.
    const { data: stockRow, error: stockError } = await supabase
      .from("pos_inventory")
      .select("product_id")
      .eq("id", validated.id)
      .single();

    if (stockError || !stockRow) {
      return {
        success: false,
        error: stockError?.message ?? "Item not found",
      };
    }

    const { error: productError } = await supabase
      .from("pos_products")
      .update({
        name: validated.name,
        category_id: validated.category_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stockRow.product_id);

    if (productError) {
      return { success: false, error: productError.message };
    }

    const { data, error } = await supabase
      .from("pos_inventory")
      .update({
        reorder_level: validated.min_stock,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.id)
      .select(INVENTORY_SELECT)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: mapItemRow(data as Record<string, unknown>) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update item",
    };
  }
}

const movementSchema = z.object({
  itemId: z.string().uuid(),
  action: z.enum(["stock_in", "stock_out", "adjust_increase", "adjust_decrease"]),
  quantity: z.coerce
    .number({ error: "Quantity must be a number" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(1_000_000, "Quantity is too large"),
  reason: z
    .string()
    .trim()
    .max(500, "Reason is too long")
    .optional()
    .or(z.literal("")),
});

export async function recordStockMovement(input: {
  itemId: string;
  action: "stock_in" | "stock_out" | "adjust_increase" | "adjust_decrease";
  quantity: number | string;
  reason?: string | null;
}): Promise<{
  success: boolean;
  newBalance?: number;
  error?: string;
}> {
  try {
    const validated = movementSchema.parse(input);

    const staff = await requireInventoryStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    // The client never supplies a signed delta: the action
    // determines the sign stored in pos_inventory_movements.
    let movementType: StockAction;
    let signedQuantity: number;

    switch (validated.action) {
      case "stock_in":
        movementType = "stock_in";
        signedQuantity = validated.quantity;
        break;
      case "stock_out":
        movementType = "stock_out";
        signedQuantity = -validated.quantity;
        break;
      case "adjust_increase":
        movementType = "adjust_increase";
        signedQuantity = validated.quantity;
        break;
      default:
        movementType = "adjust_decrease";
        signedQuantity = -validated.quantity;
        break;
    }

    if (
      (movementType === "adjust_increase" ||
        movementType === "adjust_decrease") &&
      !validated.reason
    ) {
      return {
        success: false,
        error: "A reason is required for stock adjustments",
      };
    }

    const supabase = createInventoryAdminClient();

    const { data: stockRow, error: stockError } = await supabase
      .from("pos_inventory")
      .select("branch_id, product_id, stock_quantity")
      .eq("id", validated.itemId)
      .single();

    if (stockError || !stockRow) {
      return {
        success: false,
        error: stockError?.message ?? "Item not found",
      };
    }

    const currentStock = toNumber(stockRow.stock_quantity);
    const newBalance = currentStock + signedQuantity;

    if (newBalance < 0) {
      return {
        success: false,
        error: `Insufficient stock: only ${currentStock} on hand`,
      };
    }

    // No record_inventory_stock_movement RPC exists in the
    // database, so the balance is validated against the freshly
    // read row and the update plus audit insert run as two
    // statements in this server action.
    const { error: updateError } = await supabase
      .from("pos_inventory")
      .update({
        stock_quantity: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.itemId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    const { error: movementError } = await supabase
      .from("pos_inventory_movements")
      .insert({
        branch_id: stockRow.branch_id,
        product_id: stockRow.product_id,
        movement_type: movementType,
        quantity: signedQuantity,
        notes: validated.reason || null,
      });

    if (movementError) {
      return { success: false, error: movementError.message };
    }

    return { success: true, newBalance };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to record movement",
    };
  }
}

export async function getStockHistory(itemId: string): Promise<{
  success: boolean;
  data: InventoryStockMovement[];
  error?: string;
}> {
  try {
    const staff = await requireInventoryStaff();
    if (!staff.authorized) {
      return { success: false, data: [], error: staff.error };
    }

    const adminClient = createInventoryAdminClient();

    // Scope history to the exact branch/product pair the stock
    // row represents.
    const { data: stockRow, error: stockError } = await adminClient
      .from("pos_inventory")
      .select("branch_id, product_id")
      .eq("id", itemId)
      .single();

    if (stockError || !stockRow) {
      return {
        success: false,
        data: [],
        error: stockError?.message ?? "Item not found",
      };
    }

    const { data, error } = await adminClient
      .from("pos_inventory_movements")
      .select("id, branch_id, product_id, movement_type, quantity, notes, created_at")
      .eq("product_id", stockRow.product_id)
      .eq("branch_id", stockRow.branch_id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    return {
      success: true,
      data: (data ?? []).map(mapMovementRow),
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error ? error.message : "Failed to load stock history",
    };
  }
}

// ==================== Equipment (reusable) ====================

// The database has no equipment table (pos_inventory tracks
// consumable stock per branch/product only). Equipment actions
// stay authorized but report that tracking is unavailable until
// a dedicated table is provisioned.
const EQUIPMENT_UNAVAILABLE_ERROR =
  "Equipment tracking is unavailable: the database has no equipment table. Contact your database administrator to provision one.";

export async function getInventoryEquipment(): Promise<{
  success: boolean;
  data: InventoryEquipment[];
  error?: string;
}> {
  const staff = await requireInventoryStaff();
  if (!staff.authorized) {
    return { success: false, data: [], error: staff.error };
  }

  return { success: false, data: [], error: EQUIPMENT_UNAVAILABLE_ERROR };
}

export async function createInventoryEquipment(_input?: Record<
  string,
  unknown
>): Promise<{
  success: boolean;
  error?: string;
}> {
  void _input;
  const staff = await requireInventoryStaff();
  if (!staff.authorized) {
    return { success: false, error: staff.error };
  }

  return { success: false, error: EQUIPMENT_UNAVAILABLE_ERROR };
}

export async function updateInventoryEquipment(_input?: Record<
  string,
  unknown
>): Promise<{
  success: boolean;
  error?: string;
}> {
  void _input;
  const staff = await requireInventoryStaff();
  if (!staff.authorized) {
    return { success: false, error: staff.error };
  }

  return { success: false, error: EQUIPMENT_UNAVAILABLE_ERROR };
}

export async function getEquipmentHistory(_itemId?: string): Promise<{
  success: boolean;
  data: InventoryEquipmentHistory[];
  error?: string;
}> {
  void _itemId;
  const staff = await requireInventoryStaff();
  if (!staff.authorized) {
    return { success: false, data: [], error: staff.error };
  }

  return { success: false, data: [], error: EQUIPMENT_UNAVAILABLE_ERROR };
}
