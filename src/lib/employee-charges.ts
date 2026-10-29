"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createOrderAdminClient } from "./order-admin-client";

// =============================================================================
// Types
// =============================================================================

export type Employee = {
  id: string;
  employee_code: string | null;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type EmployeeChargeStatus =
  | "outstanding"
  | "paid"
  | "waived"
  | "deducted";

export type EmployeeCharge = {
  id: string;
  employee_id: string;
  order_id: string | null;
  amount: number;
  status: EmployeeChargeStatus;
  charged_by: string | null;
  charged_at: string;
  notes: string | null;
  employee?: Employee | null;
};

export type EmployeeCreditAccount = {
  id: string;
  employee_id: string;
  credit_limit: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  employee?: Employee | null;
};

export type EmployeeSalaryDeduction = {
  id: string;
  employee_id: string;
  amount: number;
  payroll_reference: string | null;
  payroll_period_start: string | null;
  payroll_period_end: string | null;
  recorded_by: string | null;
  recorded_at: string;
  notes: string | null;
  employee?: Employee | null;
};

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// =============================================================================
// Supabase client and authorization
// =============================================================================

async function createEmployeeCreditAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // In Server Actions / Server Components we may not be able to set cookies.
          // Swallow the error the same way the official Next.js + Supabase example does.
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Expected when called from a Server Component / some Server Action contexts.
          }
        },
      },
    },
  );
}

async function requireEmployeeCreditStaff(): Promise<
  { authorized: true } | { authorized: false; error: string }
> {
  const authClient = await createEmployeeCreditAuthClient();

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return { authorized: false, error: "Unauthorized" };
  }

  const supabase = createOrderAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Employee credit staff verification failed:", profileError);
    return { authorized: false, error: "Staff verification failed" };
  }

  if (!profile) {
    return { authorized: false, error: "Unauthorized: staff account required" };
  }

  return { authorized: true };
}

// =============================================================================
// Helpers
// =============================================================================

function zodErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || "Validation failed";
  }
  return error instanceof Error
    ? error.message
    : "An unexpected error occurred";
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function revalidateEmployeeCredit() {
  revalidatePath("/admin/employee-credit");
}

// =============================================================================
// Schemas
// =============================================================================

const uuidSchema = z.string().uuid("Invalid ID");

const chargeStatusSchema = z.enum([
  "outstanding",
  "paid",
  "waived",
  "deducted",
]);

const createEmployeeChargeSchema = z.object({
  employee_id: uuidSchema.optional().nullable(),
  order_id: uuidSchema.optional().nullable(),
  amount: z.coerce.number().finite().positive("Amount must be greater than 0"),
  status: chargeStatusSchema.optional().default("outstanding"),
  charged_by: uuidSchema.optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

const updateEmployeeChargeSchema = z.object({
  id: uuidSchema,
  employee_id: uuidSchema.optional(),
  order_id: uuidSchema.optional().nullable(),
  amount: z.coerce.number().finite().positive().optional(),
  status: chargeStatusSchema.optional(),
  charged_by: uuidSchema.optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

const deleteEmployeeChargeSchema = z.object({
  id: uuidSchema,
});

// =============================================================================
// Get Employee Charges
// =============================================================================

export async function getEmployeeCharges(): Promise<
  ActionResult<EmployeeCharge[]>
> {
  try {
    const staff = await requireEmployeeCreditStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createOrderAdminClient();

    const { data, error } = await supabase
      .from("employee_charges")
      .select(
        `
        id,
        employee_id,
        order_id,
        amount,
        status,
        charged_by,
        charged_at,
        notes,
        employee:employees (
          id,
          employee_code,
          first_name,
          last_name,
          is_active,
          created_at,
          updated_at
        )
      `,
      )
      .order("charged_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch employee charges:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: (data ?? []).map((row) => ({
        ...row,
        amount: toNumber(row.amount),
        employee: Array.isArray(row.employee)
          ? (row.employee[0] ?? null)
          : row.employee,
      })) as EmployeeCharge[],
    };
  } catch (error) {
    console.error("getEmployeeCharges error:", error);
    return { success: false, error: zodErrorMessage(error) };
  }
}

// =============================================================================
// Create Employee Charge
// =============================================================================

export async function createEmployeeCharge(
  input: z.input<typeof createEmployeeChargeSchema>,
): Promise<ActionResult<EmployeeCharge>> {
  try {
    const validated = createEmployeeChargeSchema.parse(input);

    const staff = await requireEmployeeCreditStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createOrderAdminClient();

    const { data, error } = await supabase
      .from("employee_charges")
      .insert({
        employee_id: validated.employee_id,
        order_id: validated.order_id ?? null,
        amount: validated.amount,
        status: validated.status,
        charged_by: validated.charged_by ?? null,
        notes: validated.notes ?? null,
      })
      .select(
        `
        id,
        employee_id,
        order_id,
        amount,
        status,
        charged_by,
        charged_at,
        notes,
        employee:employees (
          id,
          employee_code,
          first_name,
          last_name,
          is_active,
          created_at,
          updated_at
        )
      `,
      )
      .single();

    if (error) {
      console.error("Failed to create employee charge:", error);
      return { success: false, error: error.message };
    }

    revalidateEmployeeCredit();

    return {
      success: true,
      data: {
        ...data,
        amount: toNumber(data.amount),
        employee: Array.isArray(data.employee)
          ? (data.employee[0] ?? null)
          : data.employee,
      } as EmployeeCharge,
    };
  } catch (error) {
    console.error("createEmployeeCharge error:", error);
    return { success: false, error: zodErrorMessage(error) };
  }
}

// =============================================================================
// Update Employee Charge
// =============================================================================

export async function updateEmployeeCharge(
  input: z.input<typeof updateEmployeeChargeSchema>,
): Promise<ActionResult<EmployeeCharge>> {
  try {
    const validated = updateEmployeeChargeSchema.parse(input);

    const staff = await requireEmployeeCreditStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createOrderAdminClient();
    const { id, ...fields } = validated;

    const patch: Record<string, unknown> = {};
    if (fields.employee_id !== undefined)
      patch.employee_id = fields.employee_id;
    if (fields.order_id !== undefined) patch.order_id = fields.order_id;
    if (fields.amount !== undefined) patch.amount = fields.amount;
    if (fields.status !== undefined) patch.status = fields.status;
    if (fields.charged_by !== undefined) patch.charged_by = fields.charged_by;
    if (fields.notes !== undefined) patch.notes = fields.notes;

    if (Object.keys(patch).length === 0) {
      return { success: false, error: "No fields provided to update" };
    }

    const { data, error } = await supabase
      .from("employee_charges")
      .update(patch)
      .eq("id", id)
      .select(
        `
        id,
        employee_id,
        order_id,
        amount,
        status,
        charged_by,
        charged_at,
        notes,
        employee:employees (
          id,
          employee_code,
          first_name,
          last_name,
          is_active,
          created_at,
          updated_at
        )
      `,
      )
      .maybeSingle();

    if (error) {
      console.error("Failed to update employee charge:", error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Employee charge not found" };
    }

    revalidateEmployeeCredit();

    return {
      success: true,
      data: {
        ...data,
        amount: toNumber(data.amount),
        employee: Array.isArray(data.employee)
          ? (data.employee[0] ?? null)
          : data.employee,
      } as EmployeeCharge,
    };
  } catch (error) {
    console.error("updateEmployeeCharge error:", error);
    return { success: false, error: zodErrorMessage(error) };
  }
}

// =============================================================================
// Delete Employee Charge
// =============================================================================

export async function deleteEmployeeCharge(
  input: z.input<typeof deleteEmployeeChargeSchema>,
): Promise<ActionResult<null>> {
  try {
    const validated = deleteEmployeeChargeSchema.parse(input);

    const staff = await requireEmployeeCreditStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createOrderAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from("employee_charges")
      .select("id")
      .eq("id", validated.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Failed to find employee charge:", fetchError);
      return { success: false, error: fetchError.message };
    }

    if (!existing) {
      return { success: false, error: "Employee charge not found" };
    }

    const { error } = await supabase
      .from("employee_charges")
      .delete()
      .eq("id", validated.id);

    if (error) {
      console.error("Failed to delete employee charge:", error);
      return { success: false, error: error.message };
    }

    revalidateEmployeeCredit();

    return { success: true, data: null };
  } catch (error) {
    console.error("deleteEmployeeCharge error:", error);
    return { success: false, error: zodErrorMessage(error) };
  }
}

// =============================================================================
// Get Employees
// =============================================================================

export async function getEmployees(): Promise<ActionResult<Employee[]>> {
  try {
    const staff = await requireEmployeeCreditStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createOrderAdminClient();

    const { data, error } = await supabase
      .from("employees")
      .select(
        "id, employee_code, first_name, last_name, is_active, created_at, updated_at",
      )
      .order("first_name", { ascending: true });

    if (error) {
      console.error("Failed to fetch employees:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (data ?? []) as Employee[] };
  } catch (error) {
    console.error("getEmployees error:", error);
    return { success: false, error: zodErrorMessage(error) };
  }
}

// =============================================================================
// Get Employee Credit Accounts
// =============================================================================

export async function getEmployeeCreditAccounts(): Promise<
  ActionResult<EmployeeCreditAccount[]>
> {
  try {
    const staff = await requireEmployeeCreditStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createOrderAdminClient();

    const { data, error } = await supabase
      .from("employee_credit_accounts")
      .select(
        `
        id,
        employee_id,
        credit_limit,
        is_enabled,
        created_at,
        updated_at,
        employee:employees (
          id,
          employee_code,
          first_name,
          last_name,
          is_active,
          created_at,
          updated_at
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch employee credit accounts:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: (data ?? []).map((row) => ({
        ...row,
        credit_limit: toNumber(row.credit_limit),
        employee: Array.isArray(row.employee)
          ? (row.employee[0] ?? null)
          : row.employee,
      })) as EmployeeCreditAccount[],
    };
  } catch (error) {
    console.error("getEmployeeCreditAccounts error:", error);
    return { success: false, error: zodErrorMessage(error) };
  }
}

// =============================================================================
// Get Employee Salary Deductions
// =============================================================================

export async function getEmployeeSalaryDeductions(): Promise<
  ActionResult<EmployeeSalaryDeduction[]>
> {
  try {
    const staff = await requireEmployeeCreditStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createOrderAdminClient();

    const { data, error } = await supabase
      .from("employee_salary_deductions")
      .select(
        `
        id,
        employee_id,
        amount,
        payroll_reference,
        payroll_period_start,
        payroll_period_end,
        recorded_by,
        recorded_at,
        notes,
        employee:employees (
          id,
          employee_code,
          first_name,
          last_name,
          is_active,
          created_at,
          updated_at
        )
      `,
      )
      .order("recorded_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch employee salary deductions:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: (data ?? []).map((row) => ({
        ...row,
        amount: toNumber(row.amount),
        employee: Array.isArray(row.employee)
          ? (row.employee[0] ?? null)
          : row.employee,
      })) as EmployeeSalaryDeduction[],
    };
  } catch (error) {
    console.error("getEmployeeSalaryDeductions error:", error);
    return { success: false, error: zodErrorMessage(error) };
  }
}

// =============================================================================
// Create / Update Employee
// =============================================================================

const saveEmployeeSchema = z.object({
  id: uuidSchema.optional(),
  first_name: z.string().trim().min(1, "First name is required"),
  last_name: z.string().trim().min(1, "Last name is required"),
  is_active: z.boolean(),
});

type SaveEmployeeInput = z.input<typeof saveEmployeeSchema>;

export async function saveEmployee(
  input: SaveEmployeeInput,
): Promise<ActionResult<Employee>> {
  try {
    const validated = saveEmployeeSchema.parse(input);

    const staff = await requireEmployeeCreditStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createOrderAdminClient();

    if (validated.id) {
      // Preserve the existing employee code during updates.
      const { data, error } = await supabase
        .from("employees")
        .update({
          first_name: validated.first_name,
          last_name: validated.last_name,
          is_active: validated.is_active,
        })
        .eq("id", validated.id)
        .select(
          "id, employee_code, first_name, last_name, is_active, created_at, updated_at",
        )
        .maybeSingle();

      if (error) {
        console.error("Failed to update employee:", error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: "Employee not found" };
      }

      revalidateEmployeeCredit();

      return { success: true, data: data as Employee };
    }

    // Generate a code only when creating a new employee.
    const employeeCode = await generateEmployeeCode();

    const { data, error } = await supabase
      .from("employees")
      .insert({
        employee_code: employeeCode,
        first_name: validated.first_name,
        last_name: validated.last_name,
        is_active: validated.is_active,
      })
      .select(
        "id, employee_code, first_name, last_name, is_active, created_at, updated_at",
      )
      .single();

    if (error) {
      console.error("Failed to create employee:", error);
      return { success: false, error: error.message };
    }

    revalidateEmployeeCredit();

    return { success: true, data: data as Employee };
  } catch (error) {
    console.error("saveEmployee error:", error);
    return { success: false, error: zodErrorMessage(error) };
  }
}

async function generateEmployeeCode(): Promise<string> {
  const supabase = createOrderAdminClient();

  const { data, error } = await supabase
    .from("employees")
    .select("employee_code")
    .like("employee_code", "EMP%")
    .order("employee_code", { ascending: false });

  if (error) {
    console.error("Failed to check existing employee codes:", error);
    throw new Error("Failed to generate employee code");
  }

  const highestNumber = (data ?? []).reduce((highest, employee) => {
    const match = employee.employee_code?.match(/^EMP(\d+)$/i);

    if (!match) return highest;

    return Math.max(highest, Number(match[1]));
  }, 0);

  return `EMP${String(highestNumber + 1).padStart(3, "0")}`;
}

const saveEmployeeCreditAccountSchema = z.object({
  id: uuidSchema.optional(),
  employee_id: uuidSchema,
  credit_limit: z.coerce
    .number()
    .finite("Credit limit must be a valid number")
    .min(0, "Credit limit cannot be negative"),
  is_enabled: z.boolean(),
});

type SaveEmployeeCreditAccountInput = z.input<
  typeof saveEmployeeCreditAccountSchema
>;

export async function saveEmployeeCreditAccount(
  input: SaveEmployeeCreditAccountInput,
): Promise<ActionResult<EmployeeCreditAccount>> {
  try {
    const validated = saveEmployeeCreditAccountSchema.parse(input);

    const staff = await requireEmployeeCreditStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createOrderAdminClient();

    const payload = {
      employee_id: validated.employee_id,
      credit_limit: validated.credit_limit,
      is_enabled: validated.is_enabled,
    };

    const query = validated.id
      ? supabase
          .from("employee_credit_accounts")
          .update(payload)
          .eq("id", validated.id)
      : supabase.from("employee_credit_accounts").insert(payload);

    const { data, error } = await query
      .select(
        `
        id,
        employee_id,
        credit_limit,
        is_enabled,
        created_at,
        updated_at,
        employee:employees (
          id,
          employee_code,
          first_name,
          last_name,
          is_active,
          created_at,
          updated_at
        )
      `,
      )
      .maybeSingle();

    if (error) {
      console.error("Failed to save employee credit account:", error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return {
        success: false,
        error: validated.id
          ? "Employee credit account not found"
          : "Failed to create employee credit account",
      };
    }

    revalidateEmployeeCredit();

    return {
      success: true,
      data: {
        ...data,
        credit_limit: toNumber(data.credit_limit),
        employee: Array.isArray(data.employee)
          ? (data.employee[0] ?? null)
          : data.employee,
      } as EmployeeCreditAccount,
    };
  } catch (error) {
    console.error("saveEmployeeCreditAccount error:", error);
    return { success: false, error: zodErrorMessage(error) };
  }
}

// =============================================================================
// Mark Charge as Paid
// =============================================================================

const markChargeAsPaidSchema = z.object({
  id: uuidSchema,
});

export async function markChargeAsPaid(
  input: z.input<typeof markChargeAsPaidSchema>,
): Promise<ActionResult<EmployeeCharge>> {
  try {
    const validated = markChargeAsPaidSchema.parse(input);

    const staff = await requireEmployeeCreditStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createOrderAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from("employee_charges")
      .select("id, status")
      .eq("id", validated.id)
      .maybeSingle();

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }
    if (!existing) {
      return { success: false, error: "Charge not found" };
    }
    if (existing.status !== "outstanding") {
      return {
        success: false,
        error: `Charge is already ${existing.status}`,
      };
    }

    const { data, error } = await supabase
      .from("employee_charges")
      .update({ status: "paid" })
      .eq("id", validated.id)
      .select(
        `
        id,
        employee_id,
        order_id,
        amount,
        status,
        charged_by,
        charged_at,
        notes,
        employee:employees (
          id,
          employee_code,
          first_name,
          last_name,
          is_active,
          created_at,
          updated_at
        )
      `,
      )
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }
    if (!data) {
      return { success: false, error: "Charge not found" };
    }

    revalidateEmployeeCredit();

    return {
      success: true,
      data: {
        ...data,
        amount: toNumber(data.amount),
        employee: Array.isArray(data.employee)
          ? (data.employee[0] ?? null)
          : data.employee,
      } as EmployeeCharge,
    };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}

// =============================================================================
// Deduct Charge from Payroll (updates charge + creates deduction)
// =============================================================================

const deductChargeFromPayrollSchema = z.object({
  id: uuidSchema,
  payroll_reference: z.string().max(100).optional().nullable(),
  payroll_period_start: z.string().optional().nullable(),
  payroll_period_end: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export async function deductChargeFromPayroll(
  input: z.input<typeof deductChargeFromPayrollSchema>,
): Promise<ActionResult<{ charge: EmployeeCharge; deduction: EmployeeSalaryDeduction }>> {
  try {
    const validated = deductChargeFromPayrollSchema.parse(input);

    const staff = await requireEmployeeCreditStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createOrderAdminClient();

    // 1. Load the charge
    const { data: charge, error: chargeError } = await supabase
      .from("employee_charges")
      .select(
        `
        id,
        employee_id,
        order_id,
        amount,
        status,
        charged_by,
        charged_at,
        notes,
        employee:employees (
          id,
          employee_code,
          first_name,
          last_name,
          is_active,
          created_at,
          updated_at
        )
      `,
      )
      .eq("id", validated.id)
      .maybeSingle();

    if (chargeError) {
      return { success: false, error: chargeError.message };
    }
    if (!charge) {
      return { success: false, error: "Charge not found" };
    }
    if (charge.status !== "outstanding") {
      return {
        success: false,
        error: `Charge is already ${charge.status}`,
      };
    }

    // 2. Update charge status → deducted
    const { data: updatedCharge, error: updateError } = await supabase
      .from("employee_charges")
      .update({ status: "deducted" })
      .eq("id", validated.id)
      .select(
        `
        id,
        employee_id,
        order_id,
        amount,
        status,
        charged_by,
        charged_at,
        notes,
        employee:employees (
          id,
          employee_code,
          first_name,
          last_name,
          is_active,
          created_at,
          updated_at
        )
      `,
      )
      .maybeSingle();

    if (updateError) {
      return { success: false, error: updateError.message };
    }
    if (!updatedCharge) {
      return { success: false, error: "Failed to update charge" };
    }

    // 3. Create the salary deduction
    const deductionNotes =
      validated.notes?.trim() ||
      `Auto-created from charge ${charge.id.slice(0, 8)}…`;

    const { data: deduction, error: dedError } = await supabase
      .from("employee_salary_deductions")
      .insert({
        employee_id: charge.employee_id,
        amount: charge.amount,
        payroll_reference: validated.payroll_reference ?? null,
        payroll_period_start: validated.payroll_period_start ?? null,
        payroll_period_end: validated.payroll_period_end ?? null,
        notes: deductionNotes,
      })
      .select(
        `
        id,
        employee_id,
        amount,
        payroll_reference,
        payroll_period_start,
        payroll_period_end,
        recorded_by,
        recorded_at,
        notes,
        employee:employees (
          id,
          employee_code,
          first_name,
          last_name,
          is_active,
          created_at,
          updated_at
        )
      `,
      )
      .single();

    if (dedError) {
      // Best-effort rollback of the charge status
      await supabase
        .from("employee_charges")
        .update({ status: "outstanding" })
        .eq("id", validated.id);

      return { success: false, error: dedError.message };
    }

    revalidateEmployeeCredit();

    return {
      success: true,
      data: {
        charge: {
          ...updatedCharge,
          amount: toNumber(updatedCharge.amount),
          employee: Array.isArray(updatedCharge.employee)
            ? (updatedCharge.employee[0] ?? null)
            : updatedCharge.employee,
        } as EmployeeCharge,
        deduction: {
          ...deduction,
          amount: toNumber(deduction.amount),
          employee: Array.isArray(deduction.employee)
            ? (deduction.employee[0] ?? null)
            : deduction.employee,
        } as EmployeeSalaryDeduction,
      },
    };
  } catch (error) {
    return { success: false, error: zodErrorMessage(error) };
  }
}