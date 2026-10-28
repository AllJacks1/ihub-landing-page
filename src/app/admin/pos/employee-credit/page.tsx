"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  Employee,
  EmployeeCreditAccount,
  EmployeeCharge,
  EmployeeSalaryDeduction,
  EmployeeChargeStatus,
  getEmployees,
  getEmployeeCreditAccounts,
  getEmployeeCharges,
  getEmployeeSalaryDeductions,
  createEmployeeCharge,
  updateEmployeeCharge,
  deleteEmployeeCharge,
  saveEmployee,
  saveEmployeeCreditAccount,
} from "@/lib/employee-charges";

// ─── helpers ────────────────────────────────────────────────────────────────
function formatMoney(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(v);
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function employeeName(e?: Employee | null) {
  if (!e) return "—";
  const name = [e.first_name, e.last_name].filter(Boolean).join(" ");
  if (name) return name;
  if (e.employee_code) return e.employee_code;
  return e.id ? e.id.slice(0, 8) : "—";
}

type Tab = "employees" | "accounts" | "charges" | "deductions";

const TABS: { id: Tab; label: string }[] = [
  { id: "employees", label: "Employees" },
  { id: "accounts", label: "Credit Accounts" },
  { id: "charges", label: "Charges" },
  { id: "deductions", label: "Salary Deductions" },
];

const TAB_SUBTITLES: Record<Tab, string> = {
  employees: "Manage staff records and their active status.",
  accounts: "Manage employee credit limits and account status.",
  charges: "Track outstanding, paid, waived, and deducted charges.",
  deductions: "Track salary deductions by payroll period.",
};

function statusBadge(tone: "default" | "green" | "amber" | "red" | "blue") {
  const tones: Record<string, string> = {
    default: "border-stone-200 bg-stone-50 text-stone-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };
  return tones[tone] ?? tones.default;
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function EmployeeCreditPage() {
  const [tab, setTab] = useState<Tab>("employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [accounts, setAccounts] = useState<EmployeeCreditAccount[]>([]);
  const [charges, setCharges] = useState<EmployeeCharge[]>([]);
  const [deductions, setDeductions] = useState<EmployeeSalaryDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // filters
  const [chargeStatus, setChargeStatus] = useState<
    "all" | EmployeeChargeStatus
  >("all");
  const [search, setSearch] = useState("");

  type ModalType = "employee" | "account" | "charge" | "deduction" | null;

  const [modal, setModal] = useState<ModalType>(null);
  const [editing, setEditing] = useState<
    | Employee
    | EmployeeCreditAccount
    | EmployeeCharge
    | EmployeeSalaryDeduction
    | null
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [empRes, accRes, chRes, dedRes] = await Promise.all([
        getEmployees(),
        getEmployeeCreditAccounts(),
        getEmployeeCharges(),
        getEmployeeSalaryDeductions(),
      ]);

      if (!empRes.success) {
        throw new Error(empRes.error || "Failed to load employees");
      }

      if (!accRes.success) {
        throw new Error(
          accRes.error || "Failed to load employee credit accounts",
        );
      }

      if (!chRes.success) {
        throw new Error(chRes.error || "Failed to load charges");
      }

      if (!dedRes.success) {
        throw new Error(dedRes.error || "Failed to load salary deductions");
      }

      setEmployees(empRes.data);
      setAccounts(accRes.data);
      setCharges(chRes.data);
      setDeductions(dedRes.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = (type: typeof modal) => {
    setEditing(null);
    setModal(type);
  };
  const openEdit = (
    type: ModalType,
    row:
      | Employee
      | EmployeeCreditAccount
      | EmployeeCharge
      | EmployeeSalaryDeduction,
  ) => {
    setEditing(row);
    setModal(type);
  };

  // ─── filtered lists ───────────────────────────────────────────────────────
  const filteredEmployees = employees.filter((e) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      e.employee_code?.toLowerCase().includes(q) ||
      e.first_name?.toLowerCase().includes(q) ||
      e.last_name?.toLowerCase().includes(q)
    );
  });

  const filteredCharges = charges.filter((c) => {
    if (chargeStatus !== "all" && c.status !== chargeStatus) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    const name = employeeName(c.employee).toLowerCase();
    return (
      name.includes(q) ||
      c.notes?.toLowerCase().includes(q) ||
      c.order_id?.includes(q)
    );
  });

  const filteredAccounts = accounts.filter((a) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return employeeName(a.employee).toLowerCase().includes(q);
  });

  const filteredDeductions = deductions.filter((d) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      employeeName(d.employee).toLowerCase().includes(q) ||
      d.payroll_reference?.toLowerCase().includes(q) ||
      d.notes?.toLowerCase().includes(q)
    );
  });

  // ─── delete charge ────────────────────────────────────────────────────────
  const handleDeleteCharge = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this charge?")) return;

    startTransition(async () => {
      const result = await deleteEmployeeCharge({ id });
      if (!result.success) {
        alert(result.error);
        return;
      }
      setCharges((prev) => prev.filter((c) => c.id !== id));
    });
  };

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen w-full min-w-0 bg-stone-50">
      {/* Page header */}
      <div className="mb-8 border-b border-stone-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F36509]">
              Employee Credit
            </p>
            <h1 className="font-serif text-xl font-semibold text-stone-900 sm:text-2xl">
              Credit & Charges
            </h1>
            <p className="mt-1 text-sm text-stone-500">{TAB_SUBTITLES[tab]}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading || isPending}
              className="border-stone-200 text-stone-600 hover:text-stone-900"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {tab === "employees" && (
              <Button
                type="button"
                size="sm"
                onClick={() => openCreate("employee")}
                className="bg-[#F36509] text-white hover:bg-[#d95a08]"
              >
                <Plus className="mr-2 h-4 w-4" /> Employee
              </Button>
            )}
            {tab === "accounts" && (
              <Button
                type="button"
                size="sm"
                onClick={() => openCreate("account")}
                className="bg-[#F36509] text-white hover:bg-[#d95a08]"
              >
                <Plus className="mr-2 h-4 w-4" /> Credit Account
              </Button>
            )}
            {tab === "charges" && (
              <Button
                type="button"
                size="sm"
                onClick={() => openCreate("charge")}
                className="bg-[#F36509] text-white hover:bg-[#d95a08]"
              >
                <Plus className="mr-2 h-4 w-4" /> Charge
              </Button>
            )}
            {tab === "deductions" && (
              <Button
                type="button"
                size="sm"
                onClick={() => openCreate("deduction")}
                className="bg-[#F36509] text-white hover:bg-[#d95a08]"
              >
                <Plus className="mr-2 h-4 w-4" /> Deduction
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-4 mb-6 flex gap-1 rounded-xl bg-stone-100 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-[#F36509] text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-50 hover:text-stone-900",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mx-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-xl pl-10 pr-4 border-stone-200 bg-white max-w-xs"
          />
        </div>
        {tab === "charges" && (
          <Select
            value={chargeStatus}
            onValueChange={(v) =>
              setChargeStatus(v as "all" | EmployeeChargeStatus)
            }
          >
            <SelectTrigger className="h-9 rounded-xl border-stone-200 bg-white max-w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="outstanding">Outstanding</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="waived">Waived</SelectItem>
              <SelectItem value="deducted">Deducted</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Card className="mx-4">
          <div className="mx-4 flex h-64 items-center justify-center text-stone-400">
            <RefreshCw className="mr-2 h-5 w-5 animate-spin text-[#F36509]" />
            Loading…
          </div>
        </Card>
      ) : (
        <>
          {/* ── Employees ─────────────────────────────────────────────── */}
          {tab === "employees" && (
            <Card className="mx-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredEmployees.map((e) => (
                      <tr key={e.id} className="hover:bg-stone-50">
                        <td className="px-4 py-3 font-mono text-xs">
                          {e.employee_code || "—"}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {employeeName(e)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={statusBadge(
                              e.is_active ? "green" : "default",
                            )}
                          >
                            {e.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-stone-500">
                          {formatDate(e.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit("employee", e)}
                            className="text-stone-500 hover:text-stone-900"
                          >
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-12 text-center text-stone-400"
                        >
                          No employees found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── Credit Accounts ───────────────────────────────────────── */}
          {tab === "accounts" && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Credit Limit</th>
                      <th className="px-4 py-3">Enabled</th>
                      <th className="px-4 py-3">Updated</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredAccounts.map((a) => (
                      <tr key={a.id} className="hover:bg-stone-50">
                        <td className="px-4 py-3 font-medium">
                          {employeeName(a.employee)}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {formatMoney(a.credit_limit)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={statusBadge(
                              a.is_enabled ? "green" : "red",
                            )}
                          >
                            {a.is_enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-stone-500">
                          {formatDateTime(a.updated_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit("account", a)}
                            className="text-stone-500 hover:text-stone-900"
                          >
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {accounts.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-12 text-center text-stone-400"
                        >
                          No credit accounts
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── Charges ───────────────────────────────────────────────── */}
          {tab === "charges" && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Charged</th>
                      <th className="px-4 py-3">Notes</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredCharges.map((c) => (
                      <tr key={c.id} className="hover:bg-stone-50">
                        <td className="px-4 py-3 font-medium">
                          {employeeName(c.employee)}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium">
                          {formatMoney(c.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={statusBadge(
                              c.status === "outstanding"
                                ? "amber"
                                : c.status === "paid" || c.status === "deducted"
                                  ? "green"
                                  : c.status === "waived"
                                    ? "blue"
                                    : "default",
                            )}
                          >
                            {c.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-stone-500">
                          {c.order_id ? c.order_id.slice(0, 8) + "…" : "—"}
                        </td>
                        <td className="px-4 py-3 text-stone-500">
                          {formatDateTime(c.charged_at)}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-stone-500">
                          {c.notes || "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEdit("charge", c)}
                              disabled={isPending}
                              className="text-stone-500 hover:text-stone-900"
                            >
                              <Pencil className="mr-1.5 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleDeleteCharge(c.id)}
                              disabled={isPending}
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCharges.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-12 text-center text-stone-400"
                        >
                          No charges found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── Deductions ────────────────────────────────────────────── */}
          {tab === "deductions" && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
                    <tr>
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Payroll Ref</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Recorded</th>
                      <th className="px-4 py-3">Notes</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredDeductions.map((d) => (
                      <tr key={d.id} className="hover:bg-stone-50">
                        <td className="px-4 py-3 font-medium">
                          {employeeName(d.employee)}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium">
                          {formatMoney(d.amount)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {d.payroll_reference || "—"}
                        </td>
                        <td className="px-4 py-3 text-stone-500">
                          {d.payroll_period_start || d.payroll_period_end
                            ? `${formatDate(d.payroll_period_start)} → ${formatDate(d.payroll_period_end)}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-stone-500">
                          {formatDateTime(d.recorded_at)}
                        </td>
                        <td className="max-w-[180px] truncate px-4 py-3 text-stone-500">
                          {d.notes || "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit("deduction", d)}
                            className="text-stone-500 hover:text-stone-900"
                          >
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {deductions.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-12 text-center text-stone-400"
                        >
                          No salary deductions
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <EmployeeFormModal
        key={editing && modal === "employee" ? editing.id : "new-employee"}
        open={modal === "employee"}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
        initial={modal === "employee" ? (editing as Employee | null) : null}
        onSaved={load}
      />
      <AccountFormModal
        key={editing && modal === "account" ? editing.id : "new-account"}
        open={modal === "account"}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
        initial={
          modal === "account" ? (editing as EmployeeCreditAccount | null) : null
        }
        employees={employees}
        onSaved={load}
      />
      <ChargeFormModal
        key={editing && modal === "charge" ? editing.id : "new-charge"}
        open={modal === "charge"}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
        initial={modal === "charge" ? (editing as EmployeeCharge | null) : null}
        employees={employees}
        onSaved={load}
      />
      <DeductionFormModal
        key={editing && modal === "deduction" ? editing.id : "new-deduction"}
        open={modal === "deduction"}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
        initial={
          modal === "deduction"
            ? (editing as EmployeeSalaryDeduction | null)
            : null
        }
        employees={employees}
        onSaved={load}
      />
    </main>
  );
}

// ─── Form Modals ────────────────────────────────────────────────────────────

function EmployeeFormModal({
  open,
  onOpenChange,
  initial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Employee | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    employee_code: initial?.employee_code || "",
    first_name: initial?.first_name || "",
    last_name: initial?.last_name || "",
    is_active: initial?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await saveEmployee({
        ...(initial ? { id: initial.id } : {}),
        first_name: form.first_name,
        last_name: form.last_name,
        is_active: form.is_active,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to save employee");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {initial ? "Edit Employee" : "New Employee"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              required
              className="h-10 rounded-lg border-stone-200"
              placeholder="Enter first name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              required
              className="h-10 rounded-lg border-stone-200"
              placeholder="Enter last name"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
              className="h-4 w-4 rounded border-stone-300 text-[#F36509] focus:ring-[#F36509]"
            />
            <Label htmlFor="is_active" className="ml-0 text-sm text-stone-700">
              Active
            </Label>
          </div>

          <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#F36509] text-white hover:bg-[#d95a08]"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AccountFormModal({
  open,
  onOpenChange,
  initial,
  employees,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: EmployeeCreditAccount | null;
  employees: Employee[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    employee_id: initial?.employee_id || "",
    credit_limit: initial ? String(initial.credit_limit) : "0",
    is_enabled: initial?.is_enabled ?? true,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await saveEmployeeCreditAccount({
        ...(initial ? { id: initial.id } : {}),
        ...form,
        credit_limit: Number(form.credit_limit),
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      onSaved();
      onOpenChange(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save credit account",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {initial ? "Edit Credit Account" : "New Credit Account"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select
              value={form.employee_id}
              onValueChange={(v) => setForm({ ...form, employee_id: v ?? "" })}
              required
              disabled={!!initial}
            >
              <SelectTrigger className="h-9 rounded-lg border-stone-200 bg-white">
                <SelectValue placeholder="Select employee…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select employee…</SelectItem>
                {employees
                  .filter((e) => e.is_active)
                  .map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {employeeName(e)}{" "}
                      {e.employee_code ? `(${e.employee_code})` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Credit Limit</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.credit_limit}
              onChange={(e) =>
                setForm({ ...form, credit_limit: e.target.value })
              }
              required
              className="h-9 rounded-lg border-stone-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_enabled"
              checked={form.is_enabled}
              onChange={(e) =>
                setForm({ ...form, is_enabled: e.target.checked })
              }
              className="h-4 w-4 rounded border-stone-300 text-[#F36509] focus:ring-[#F36509]"
            />
            <Label htmlFor="is_enabled" className="text-sm text-stone-700 ml-0">
              Account enabled
            </Label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#F36509] text-white hover:bg-[#d95a08]"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChargeFormModal({
  open,
  onOpenChange,
  initial,
  employees,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: EmployeeCharge | null;
  employees: Employee[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState<{
    employee_id: string;
    order_id: string;
    amount: string;
    status: EmployeeChargeStatus;
    notes: string;
  }>({
    employee_id: initial?.employee_id || "",
    order_id: initial?.order_id || "",
    amount: initial ? String(initial.amount) : "",
    status: initial?.status ?? "outstanding",
    notes: initial?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (initial) {
        const result = await updateEmployeeCharge({
          id: initial.id,
          employee_id: form.employee_id || undefined,
          order_id: form.order_id || null,
          amount: form.amount ? Number(form.amount) : undefined,
          status: form.status,
          notes: form.notes || null,
        });

        if (!result.success) {
          setError(result.error);
          return;
        }
      } else {
        const result = await createEmployeeCharge({
          employee_id: form.employee_id,
          order_id: form.order_id || null,
          amount: Number(form.amount),
          status: form.status,
          notes: form.notes || null,
        });

        if (!result.success) {
          setError(result.error);
          return;
        }
      }

      onSaved();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save charge");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {initial ? "Edit Charge" : "New Charge"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select
              value={form.employee_id}
              onValueChange={(v) => setForm({ ...form, employee_id: v ?? "" })}
              required
              disabled={!!initial}
            >
              <SelectTrigger className="h-9 rounded-lg border-stone-200 bg-white">
                <SelectValue placeholder="Select employee…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select employee…</SelectItem>
                {employees
                  .filter((e) => e.is_active)
                  .map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {employeeName(e)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                className="h-9 rounded-lg border-stone-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    status: v as EmployeeChargeStatus,
                  })
                }
              >
                <SelectTrigger className="h-9 rounded-lg border-stone-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outstanding">Outstanding</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="waived">Waived</SelectItem>
                  <SelectItem value="deducted">Deducted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Order ID (optional)</Label>
            <Input
              value={form.order_id}
              onChange={(e) => setForm({ ...form, order_id: e.target.value })}
              placeholder="UUID of related order"
              className="h-9 rounded-lg border-stone-200"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Reason for charge…"
              className="rounded-lg border-stone-200"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#F36509] text-white hover:bg-[#d95a08]"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeductionFormModal({
  open,
  onOpenChange,
  initial,
  employees,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: EmployeeSalaryDeduction | null;
  employees: Employee[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    employee_id: initial?.employee_id || "",
    amount: initial ? String(initial.amount) : "",
    payroll_reference: initial?.payroll_reference || "",
    payroll_period_start: initial?.payroll_period_start || "",
    payroll_period_end: initial?.payroll_period_end || "",
    notes: initial?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        payroll_reference: form.payroll_reference || null,
        payroll_period_start: form.payroll_period_start || null,
        payroll_period_end: form.payroll_period_end || null,
        notes: form.notes || null,
      };
      const url = initial
        ? `/api/employee-salary-deductions/${initial.id}`
        : "/api/employee-salary-deductions";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      onSaved();
      onOpenChange(false);
    } catch {
      alert("Failed to save deduction");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {initial ? "Edit Deduction" : "New Salary Deduction"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select
              value={form.employee_id}
              onValueChange={(v) => setForm({ ...form, employee_id: v ?? "" })}
              required
              disabled={!!initial}
            >
              <SelectTrigger className="h-9 rounded-lg border-stone-200 bg-white">
                <SelectValue placeholder="Select employee…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Select employee…</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {employeeName(e)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              className="h-9 rounded-lg border-stone-200"
            />
          </div>
          <div className="space-y-2">
            <Label>Payroll Reference</Label>
            <Input
              value={form.payroll_reference}
              onChange={(e) =>
                setForm({ ...form, payroll_reference: e.target.value })
              }
              placeholder="PAY-2025-10"
              className="h-9 rounded-lg border-stone-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Period Start</Label>
              <Input
                type="date"
                value={form.payroll_period_start}
                onChange={(e) =>
                  setForm({ ...form, payroll_period_start: e.target.value })
                }
                className="h-9 rounded-lg border-stone-200"
              />
            </div>
            <div className="space-y-2">
              <Label>Period End</Label>
              <Input
                type="date"
                value={form.payroll_period_end}
                onChange={(e) =>
                  setForm({ ...form, payroll_period_end: e.target.value })
                }
                className="h-9 rounded-lg border-stone-200"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="rounded-lg border-stone-200"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#F36509] text-white hover:bg-[#d95a08]"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
