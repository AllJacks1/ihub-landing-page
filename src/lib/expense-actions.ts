"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import z from "zod/v3";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CashExpenseCategory = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

export type CashExpense = {
  id: string;
  branch_id: string;
  shift_id: string;
  terminal_id: string | null;
  category_id: string | null;
  category_name?: string | null;
  recorded_by: string;
  recorded_by_name?: string | null;
  amount: number;
  payment_method: string;
  description: string;
  notes: string | null;
  reference_number: string | null;
  status: string;
  occurred_at: string;
  created_at: string;
  updated_at: string;
  voided_at: string | null;
  voided_by: string | null;
  void_reason: string | null;
  shift_number?: string | null;
};

// ---------------------------------------------------------------------------
// Auth helpers (same pattern as pos-actions)
// ---------------------------------------------------------------------------

async function createPosSupabaseClient() {
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

let posAdminClient: SupabaseClient | null = null;

function createPosAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  if (!serviceRoleKey || serviceRoleKey.trim() === "") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured; staff-side POS operations are disabled",
    );
  }
  if (!posAdminClient) {
    posAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return posAdminClient;
}

type PosStaffUser = { id: string; email: string | null };

async function requirePosStaff(): Promise<
  | { authorized: true; user: PosStaffUser }
  | { authorized: false; error: string }
> {
  const authClient = await createPosSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();
  if (authError || !user) return { authorized: false, error: "Unauthorized" };

  const adminClient = createPosAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError) return { authorized: false, error: "Staff verification failed" };
  if (!profile) return { authorized: false, error: "Unauthorized: staff account required" };

  return { authorized: true, user: { id: user.id, email: user.email ?? null } };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getExpenseCategories(): Promise<{
  success: boolean;
  data: CashExpenseCategory[];
  error?: string;
}> {
  try {
    const staff = await requirePosStaff();
    if (!staff.authorized) return { success: false, data: [], error: staff.error };

    const supabase = createPosAdminClient();
    const { data, error } = await supabase
      .from("cash_expense_categories")
      .select("id, name, description, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) return { success: false, data: [], error: error.message };
    return { success: true, data: (data ?? []) as CashExpenseCategory[] };
  } catch (e) {
    return {
      success: false,
      data: [],
      error: e instanceof Error ? e.message : "Failed to load categories",
    };
  }
}

// ---------------------------------------------------------------------------
// Create expense (must be on an open shift owned by the cashier)
// ---------------------------------------------------------------------------

const createExpenseSchema = z.object({
  branch_id: z.string().uuid(),
  shift_id: z.string().uuid(),
  terminal_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  payment_method: z
    .enum(["cash", "card", "gcash", "maya", "other"])
    .default("cash"),
  description: z.string().min(1, "Description is required").max(500),
  notes: z.string().max(1000).optional().nullable(),
  reference_number: z.string().max(100).optional().nullable(),
  occurred_at: z.string().datetime().optional().nullable(),
});

export async function createCashExpense(
  input: z.infer<typeof createExpenseSchema>,
): Promise<{ success: boolean; data?: CashExpense; error?: string }> {
  try {
    const validated = createExpenseSchema.parse(input);
    const staff = await requirePosStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createPosAdminClient();

    // Shift must be open and belong to this cashier
    const { data: shift, error: shiftErr } = await supabase
      .from("pos_shifts")
      .select("id, branch_id, terminal_id, cashier_user_id, status, shift_number")
      .eq("id", validated.shift_id)
      .maybeSingle();

    if (shiftErr) return { success: false, error: shiftErr.message };
    if (!shift) return { success: false, error: "Shift not found" };
    if (shift.status !== "open") {
      return { success: false, error: "Expenses can only be recorded on an open shift" };
    }
    if (shift.cashier_user_id !== staff.user.id) {
      return { success: false, error: "You can only record expenses on your own shift" };
    }
    if (shift.branch_id !== validated.branch_id) {
      return { success: false, error: "Branch does not match the shift" };
    }

    const occurredAt = validated.occurred_at ?? new Date().toISOString();

    const { data: row, error } = await supabase
      .from("cash_expenses")
      .insert({
        branch_id: validated.branch_id,
        shift_id: validated.shift_id,
        terminal_id: validated.terminal_id ?? shift.terminal_id,
        category_id: validated.category_id ?? null,
        recorded_by: staff.user.id,
        amount: validated.amount,
        payment_method: validated.payment_method,
        description: validated.description.trim(),
        notes: validated.notes?.trim() || null,
        reference_number: validated.reference_number?.trim() || null,
        status: "paid",
        occurred_at: occurredAt,
      })
      .select("*")
      .single();

    if (error) return { success: false, error: error.message };

    // Audit ledger entry for cash movements only
    if (validated.payment_method === "cash") {
      await supabase.from("cash_ledger").upsert(
        {
          branch_id: validated.branch_id,
          drawer_id: null,
          shift_id: validated.shift_id,
          movement_type: "expense_out",
          amount: validated.amount,
          source_type: "cash_expense",
          source_id: row.id,
          idempotency_key: `expense-${row.id}`,
          recorded_by: staff.user.id,
          occurred_at: occurredAt,
          notes: validated.description.trim(),
        },
        { onConflict: "idempotency_key", ignoreDuplicates: true },
      );
    }

    return {
      success: true,
      data: {
        id: row.id,
        branch_id: row.branch_id,
        shift_id: row.shift_id,
        terminal_id: row.terminal_id,
        category_id: row.category_id,
        recorded_by: row.recorded_by,
        amount: Number(row.amount),
        payment_method: row.payment_method,
        description: row.description,
        notes: row.notes,
        reference_number: row.reference_number,
        status: row.status,
        occurred_at: row.occurred_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        voided_at: row.voided_at,
        voided_by: row.voided_by,
        void_reason: row.void_reason,
        shift_number: shift.shift_number,
      },
    };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { success: false, error: e.issues[0]?.message || "Validation failed" };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to create expense",
    };
  }
}

// ---------------------------------------------------------------------------
// List expenses for a shift (or branch)
// ---------------------------------------------------------------------------

export async function getShiftExpenses(shiftId: string): Promise<{
  success: boolean;
  data: CashExpense[];
  totalCash: number;
  error?: string;
}> {
  try {
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, data: [], totalCash: 0, error: staff.error };
    }

    const supabase = createPosAdminClient();
    const { data, error } = await supabase
      .from("cash_expenses")
      .select(
        `
        id, branch_id, shift_id, terminal_id, category_id, recorded_by,
        amount, payment_method, description, notes, reference_number, status,
        occurred_at, created_at, updated_at, voided_at, voided_by, void_reason,
        cash_expense_categories:category_id ( name )
      `,
      )
      .eq("shift_id", shiftId)
      .order("occurred_at", { ascending: false });

    if (error) {
      return { success: false, data: [], totalCash: 0, error: error.message };
    }

    const rows: CashExpense[] = (data ?? []).map((r: Record<string, unknown>) => {
      const cat = r.cash_expense_categories as
        | { name: string }
        | { name: string }[]
        | null;
      const catName = Array.isArray(cat) ? cat[0]?.name : cat?.name;
      return {
        id: r.id as string,
        branch_id: r.branch_id as string,
        shift_id: r.shift_id as string,
        terminal_id: (r.terminal_id as string) ?? null,
        category_id: (r.category_id as string) ?? null,
        category_name: catName ?? null,
        recorded_by: r.recorded_by as string,
        amount: Number(r.amount ?? 0),
        payment_method: r.payment_method as string,
        description: r.description as string,
        notes: (r.notes as string) ?? null,
        reference_number: (r.reference_number as string) ?? null,
        status: r.status as string,
        occurred_at: r.occurred_at as string,
        created_at: r.created_at as string,
        updated_at: r.updated_at as string,
        voided_at: (r.voided_at as string) ?? null,
        voided_by: (r.voided_by as string) ?? null,
        void_reason: (r.void_reason as string) ?? null,
      };
    });

    const totalCash = rows
      .filter(
        (e) =>
          e.payment_method === "cash" &&
          ["paid", "approved", "completed"].includes(e.status),
      )
      .reduce((sum, e) => sum + e.amount, 0);

    return { success: true, data: rows, totalCash: Number(totalCash.toFixed(2)) };
  } catch (e) {
    return {
      success: false,
      data: [],
      totalCash: 0,
      error: e instanceof Error ? e.message : "Failed to load expenses",
    };
  }
}

export async function getBranchExpenses(params?: {
  branchId?: string;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  data: CashExpense[];
  error?: string;
}> {
  try {
    const staff = await requirePosStaff();
    if (!staff.authorized) return { success: false, data: [], error: staff.error };

    const supabase = createPosAdminClient();
    const limit = Math.min(params?.limit ?? 50, 200);

    let query = supabase
      .from("cash_expenses")
      .select(
        `
        id, branch_id, shift_id, terminal_id, category_id, recorded_by,
        amount, payment_method, description, notes, reference_number, status,
        occurred_at, created_at, updated_at, voided_at, voided_by, void_reason,
        cash_expense_categories:category_id ( name ),
        pos_shifts:shift_id ( shift_number )
      `,
      )
      .order("occurred_at", { ascending: false })
      .limit(limit);

    if (params?.branchId) query = query.eq("branch_id", params.branchId);
    if (params?.from) query = query.gte("occurred_at", params.from);
    if (params?.to) query = query.lte("occurred_at", params.to);

    const { data, error } = await query;
    if (error) return { success: false, data: [], error: error.message };

    const rows: CashExpense[] = (data ?? []).map((r: Record<string, unknown>) => {
      const cat = r.cash_expense_categories as
        | { name: string }
        | { name: string }[]
        | null;
      const catName = Array.isArray(cat) ? cat[0]?.name : cat?.name;
      const shift = r.pos_shifts as
        | { shift_number: string | null }
        | { shift_number: string | null }[]
        | null;
      const shiftNum = Array.isArray(shift)
        ? shift[0]?.shift_number
        : shift?.shift_number;
      return {
        id: r.id as string,
        branch_id: r.branch_id as string,
        shift_id: r.shift_id as string,
        terminal_id: (r.terminal_id as string) ?? null,
        category_id: (r.category_id as string) ?? null,
        category_name: catName ?? null,
        recorded_by: r.recorded_by as string,
        amount: Number(r.amount ?? 0),
        payment_method: r.payment_method as string,
        description: r.description as string,
        notes: (r.notes as string) ?? null,
        reference_number: (r.reference_number as string) ?? null,
        status: r.status as string,
        occurred_at: r.occurred_at as string,
        created_at: r.created_at as string,
        updated_at: r.updated_at as string,
        voided_at: (r.voided_at as string) ?? null,
        voided_by: (r.voided_by as string) ?? null,
        void_reason: (r.void_reason as string) ?? null,
        shift_number: shiftNum ?? null,
      };
    });

    return { success: true, data: rows };
  } catch (e) {
    return {
      success: false,
      data: [],
      error: e instanceof Error ? e.message : "Failed to load expenses",
    };
  }
}

// ---------------------------------------------------------------------------
// Void expense (only on open shift, by the same cashier or with staff auth)
// ---------------------------------------------------------------------------

const voidExpenseSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, "Reason is required").max(500),
});

export async function voidCashExpense(
  input: z.infer<typeof voidExpenseSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = voidExpenseSchema.parse(input);
    const staff = await requirePosStaff();
    if (!staff.authorized) return { success: false, error: staff.error };

    const supabase = createPosAdminClient();

    const { data: exp, error: loadErr } = await supabase
      .from("cash_expenses")
      .select("id, shift_id, status, payment_method, amount, recorded_by")
      .eq("id", validated.id)
      .maybeSingle();

    if (loadErr) return { success: false, error: loadErr.message };
    if (!exp) return { success: false, error: "Expense not found" };
    if (["void", "cancelled"].includes(exp.status)) {
      return { success: false, error: "Expense is already voided" };
    }

    // Only allow void while the shift is still open
    const { data: shift } = await supabase
      .from("pos_shifts")
      .select("id, status, cashier_user_id")
      .eq("id", exp.shift_id)
      .maybeSingle();

    if (!shift || shift.status !== "open") {
      return {
        success: false,
        error: "Can only void expenses while the related shift is still open",
      };
    }
    if (shift.cashier_user_id !== staff.user.id) {
      return { success: false, error: "You can only void expenses on your own shift" };
    }

    const voidedAt = new Date().toISOString();
    const { error: updErr } = await supabase
      .from("cash_expenses")
      .update({
        status: "void",
        voided_at: voidedAt,
        voided_by: staff.user.id,
        void_reason: validated.reason.trim(),
        updated_at: voidedAt,
      })
      .eq("id", validated.id)
      .neq("status", "void");

    if (updErr) return { success: false, error: updErr.message };

    // Reverse ledger for cash expenses
    if (exp.payment_method === "cash") {
      const { data: shiftRow } = await supabase
        .from("pos_shifts")
        .select("branch_id")
        .eq("id", exp.shift_id)
        .maybeSingle();

      await supabase.from("cash_ledger").upsert(
        {
          branch_id: shiftRow?.branch_id ?? null,
          drawer_id: null,
          shift_id: exp.shift_id,
          movement_type: "expense_void",
          amount: Number(exp.amount),
          source_type: "cash_expense",
          source_id: exp.id,
          idempotency_key: `expense-void-${exp.id}`,
          recorded_by: staff.user.id,
          occurred_at: voidedAt,
          notes: validated.reason.trim(),
        },
        { onConflict: "idempotency_key", ignoreDuplicates: true },
      );
    }

    return { success: true };
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { success: false, error: e.issues[0]?.message || "Validation failed" };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to void expense",
    };
  }
}
