"use server";

import { createServerClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { z } from "zod";
import { createInventoryAdminClient } from "./inventory-admin-client";

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

// Server-only privileged client moved to ./inventory-admin-client

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

function mapMovementRow(row: Record<string, unknown>): InventoryStockMovement {
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
  area_id: z.string().uuid("Select an area"),
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
      error:
        error instanceof Error ? error.message : "Failed to load inventory",
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
      error: error instanceof Error ? error.message : "Failed to load branches",
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
        area_id: validated.area_id,
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
  action: z.enum([
    "stock_in",
    "stock_out",
    "adjust_increase",
    "adjust_decrease",
  ]),
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
    let movementType: "purchase" | "sale" | "adjustment";

    let signedQuantity: number;

    switch (validated.action) {
      case "stock_in":
        movementType = "purchase";
        signedQuantity = validated.quantity;
        break;

      case "stock_out":
        movementType = "sale";
        signedQuantity = -validated.quantity;
        break;

      case "adjust_increase":
        movementType = "adjustment";
        signedQuantity = validated.quantity;
        break;

      case "adjust_decrease":
        movementType = "adjustment";
        signedQuantity = -validated.quantity;
        break;
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
      .select(
        "id, branch_id, product_id, movement_type, quantity, notes, created_at",
      )
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

const EQUIPMENT_SELECT =
  "id, name, category, department, total_quantity, available_quantity, condition, notes, created_at, updated_at";

function mapEquipmentRow(row: Record<string, unknown>): InventoryEquipment {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    category: String(row.category ?? ""),
    department: String(row.department) as Department,
    total_quantity: toNumber(row.total_quantity),
    available_quantity: toNumber(row.available_quantity),
    condition: String(row.condition) as EquipmentCondition,
    notes: row.notes ? String(row.notes) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapEquipmentHistoryRow(
  row: Record<string, unknown>,
): InventoryEquipmentHistory {
  return {
    id: String(row.id),
    equipment_id: String(row.equipment_id),
    event: String(row.event ?? ""),
    details: row.details ? String(row.details) : null,
    staff_user_id: row.staff_user_id ? String(row.staff_user_id) : null,
    staff_name: row.staff_name ? String(row.staff_name) : null,
    created_at: String(row.created_at),
  };
}

const createEquipmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  category: z.string().trim().min(1, "Category is required").max(80),
  department: z.enum(["bar", "kitchen"]),
  total_quantity: z.coerce
    .number({ error: "Total quantity must be a number" })
    .int("Total quantity must be a whole number")
    .min(0, "Total quantity cannot be negative")
    .max(1_000_000, "Total quantity is too large"),
  available_quantity: z.coerce
    .number({ error: "Available quantity must be a number" })
    .int("Available quantity must be a whole number")
    .min(0, "Available quantity cannot be negative")
    .max(1_000_000, "Available quantity is too large"),
  condition: z.enum(["good", "damaged", "under_maintenance"]).default("good"),
  notes: z
    .string()
    .trim()
    .max(500, "Notes are too long")
    .optional()
    .or(z.literal("")),
});

const updateEquipmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(100),
  category: z.string().trim().min(1, "Category is required").max(80),
  department: z.enum(["bar", "kitchen"]),
  total_quantity: z.coerce
    .number({ error: "Total quantity must be a number" })
    .int("Total quantity must be a whole number")
    .min(0, "Total quantity cannot be negative")
    .max(1_000_000, "Total quantity is too large"),
  available_quantity: z.coerce
    .number({ error: "Available quantity must be a number" })
    .int("Available quantity must be a whole number")
    .min(0, "Available quantity cannot be negative")
    .max(1_000_000, "Available quantity is too large"),
  condition: z.enum(["good", "damaged", "under_maintenance"]),
  notes: z
    .string()
    .trim()
    .max(500, "Notes are too long")
    .optional()
    .or(z.literal("")),
});

export async function getInventoryEquipment(): Promise<{
  success: boolean;
  data: InventoryEquipment[];
  error?: string;
}> {
  try {
    const staff = await requireInventoryStaff();
    if (!staff.authorized) {
      return { success: false, data: [], error: staff.error };
    }

    const supabase = createInventoryAdminClient();

    const { data, error } = await supabase
      .from("pos_equipment")
      .select(EQUIPMENT_SELECT)
      .order("updated_at", { ascending: false });

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    return {
      success: true,
      data: (data ?? []).map((row) =>
        mapEquipmentRow(row as Record<string, unknown>),
      ),
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error ? error.message : "Failed to load equipment",
    };
  }
}

export async function createInventoryEquipment(input: {
  name: string;
  category: string;
  department: Department;
  total_quantity: number | string;
  available_quantity: number | string;
  condition?: EquipmentCondition;
  notes?: string | null;
}): Promise<{
  success: boolean;
  data?: InventoryEquipment;
  error?: string;
}> {
  try {
    const validated = createEquipmentSchema.parse(input);

    // available cannot exceed total
    if (validated.available_quantity > validated.total_quantity) {
      return {
        success: false,
        error: "Available quantity cannot exceed total quantity",
      };
    }

    const staff = await requireInventoryStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createInventoryAdminClient();

    const { data, error } = await supabase
      .from("pos_equipment")
      .insert({
        name: validated.name,
        category: validated.category,
        department: validated.department,
        total_quantity: validated.total_quantity,
        available_quantity: validated.available_quantity,
        condition: validated.condition,
        notes: validated.notes || null,
      })
      .select(EQUIPMENT_SELECT)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Audit entry
    await supabase.from("pos_equipment_history").insert({
      equipment_id: data.id,
      event: "created",
      details: `Created with total=${validated.total_quantity}, available=${validated.available_quantity}, condition=${validated.condition}`,
      staff_user_id: staff.user.id,
      staff_name: staff.user.email,
    });

    return {
      success: true,
      data: mapEquipmentRow(data as Record<string, unknown>),
    };
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
        error instanceof Error ? error.message : "Failed to create equipment",
    };
  }
}

export async function updateInventoryEquipment(input: {
  id: string;
  name: string;
  category: string;
  department: Department;
  total_quantity: number | string;
  available_quantity: number | string;
  condition: EquipmentCondition;
  notes?: string | null;
}): Promise<{
  success: boolean;
  data?: InventoryEquipment;
  error?: string;
}> {
  try {
    const validated = updateEquipmentSchema.parse(input);

    if (validated.available_quantity > validated.total_quantity) {
      return {
        success: false,
        error: "Available quantity cannot exceed total quantity",
      };
    }

    const staff = await requireInventoryStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createInventoryAdminClient();

    // Fetch current row for history diff
    const { data: current, error: currentError } = await supabase
      .from("pos_equipment")
      .select(EQUIPMENT_SELECT)
      .eq("id", validated.id)
      .single();

    if (currentError || !current) {
      return {
        success: false,
        error: currentError?.message ?? "Equipment not found",
      };
    }

    const { data, error } = await supabase
      .from("pos_equipment")
      .update({
        name: validated.name,
        category: validated.category,
        department: validated.department,
        total_quantity: validated.total_quantity,
        available_quantity: validated.available_quantity,
        condition: validated.condition,
        notes: validated.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.id)
      .select(EQUIPMENT_SELECT)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Build a short human-readable change summary
    const changes: string[] = [];
    if (current.name !== validated.name)
      changes.push(`name → ${validated.name}`);
    if (current.category !== validated.category)
      changes.push(`category → ${validated.category}`);
    if (current.department !== validated.department)
      changes.push(`department → ${validated.department}`);
    if (Number(current.total_quantity) !== validated.total_quantity)
      changes.push(`total → ${validated.total_quantity}`);
    if (Number(current.available_quantity) !== validated.available_quantity)
      changes.push(`available → ${validated.available_quantity}`);
    if (current.condition !== validated.condition)
      changes.push(`condition → ${validated.condition}`);

    await supabase.from("pos_equipment_history").insert({
      equipment_id: validated.id,
      event: "updated",
      details: changes.length > 0 ? changes.join("; ") : "No material changes",
      staff_user_id: staff.user.id,
      staff_name: staff.user.email,
    });

    return {
      success: true,
      data: mapEquipmentRow(data as Record<string, unknown>),
    };
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
        error instanceof Error ? error.message : "Failed to update equipment",
    };
  }
}

export async function getEquipmentHistory(equipmentId: string): Promise<{
  success: boolean;
  data: InventoryEquipmentHistory[];
  error?: string;
}> {
  try {
    const staff = await requireInventoryStaff();
    if (!staff.authorized) {
      return { success: false, data: [], error: staff.error };
    }

    if (!z.string().uuid().safeParse(equipmentId).success) {
      return { success: false, data: [], error: "Invalid equipment id" };
    }

    const supabase = createInventoryAdminClient();

    const { data, error } = await supabase
      .from("pos_equipment_history")
      .select(
        "id, equipment_id, event, details, staff_user_id, staff_name, created_at",
      )
      .eq("equipment_id", equipmentId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    return {
      success: true,
      data: (data ?? []).map((row) =>
        mapEquipmentHistoryRow(row as Record<string, unknown>),
      ),
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to load equipment history",
    };
  }
}

/**
 * Optional helper for check-out / check-in / damage events.
 * You can call this from a UI action that only changes available qty
 * or condition without rewriting the whole equipment record.
 */
export async function recordEquipmentEvent(input: {
  equipmentId: string;
  event:
    | "checked_out"
    | "checked_in"
    | "damaged"
    | "repaired"
    | "maintenance_start"
    | "maintenance_end"
    | "note";
  quantity?: number; // how many units affected (for check-out/in)
  details?: string | null;
}): Promise<{
  success: boolean;
  data?: InventoryEquipment;
  error?: string;
}> {
  try {
    const staff = await requireInventoryStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createInventoryAdminClient();

    const { data: current, error: currentError } = await supabase
      .from("pos_equipment")
      .select(EQUIPMENT_SELECT)
      .eq("id", input.equipmentId)
      .single();

    if (currentError || !current) {
      return {
        success: false,
        error: currentError?.message ?? "Equipment not found",
      };
    }

    let newAvailable = Number(current.available_quantity);
    let newCondition = current.condition as EquipmentCondition;
    const qty = Math.max(0, Math.floor(Number(input.quantity ?? 1)));

    switch (input.event) {
      case "checked_out":
        if (newAvailable < qty) {
          return {
            success: false,
            error: `Only ${newAvailable} available`,
          };
        }
        newAvailable -= qty;
        break;
      case "checked_in":
        newAvailable = Math.min(
          Number(current.total_quantity),
          newAvailable + qty,
        );
        break;
      case "damaged":
        newCondition = "damaged";
        break;
      case "repaired":
      case "maintenance_end":
        newCondition = "good";
        break;
      case "maintenance_start":
        newCondition = "under_maintenance";
        break;
      case "note":
        // no quantity/condition change
        break;
    }

    const { data, error } = await supabase
      .from("pos_equipment")
      .update({
        available_quantity: newAvailable,
        condition: newCondition,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.equipmentId)
      .select(EQUIPMENT_SELECT)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await supabase.from("pos_equipment_history").insert({
      equipment_id: input.equipmentId,
      event: input.event,
      details:
        input.details ||
        `qty=${qty}; available now=${newAvailable}; condition=${newCondition}`,
      staff_user_id: staff.user.id,
      staff_name: staff.user.email,
    });

    return {
      success: true,
      data: mapEquipmentRow(data as Record<string, unknown>),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to record equipment event",
    };
  }
}
