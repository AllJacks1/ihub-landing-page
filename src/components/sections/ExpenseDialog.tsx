"use client";

import { useEffect, useMemo, useState } from "react";
import { Banknote, Plus, RefreshCw, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createCashExpense,
  getExpenseCategories,
  getShiftExpenses,
  voidCashExpense,
  type CashExpense,
  type CashExpenseCategory,
} from "@/lib/expense-actions";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  shiftId: string;
  terminalId?: string | null;
  /** Called after create/void so parent can refresh shift summary if needed */
  onChanged?: () => void;
};

export function ExpenseDialog({
  open,
  onOpenChange,
  branchId,
  shiftId,
  terminalId,
  onChanged,
}: Props) {
  const [categories, setCategories] = useState<CashExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<CashExpense[]>([]);
  const [totalCash, setTotalCash] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    amount: "",
    category_id: "",
    description: "",
    notes: "",
    reference_number: "",
    payment_method: "cash" as "cash" | "card" | "gcash" | "maya" | "other",
  });

  async function load() {
    if (!shiftId) return;
    setIsLoading(true);
    try {
      const [catRes, expRes] = await Promise.all([
        getExpenseCategories(),
        getShiftExpenses(shiftId),
      ]);
      if (catRes.success) setCategories(catRes.data);
      if (expRes.success) {
        setExpenses(expRes.data);
        setTotalCash(expRes.totalCash);
      } else {
        toast.error(expRes.error ?? "Failed to load expenses");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (open && shiftId) {
      setForm({
        amount: "",
        category_id: "",
        description: "",
        notes: "",
        reference_number: "",
        payment_method: "cash",
      });
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shiftId]);

  const canSubmit = useMemo(() => {
    const amt = parseFloat(form.amount);
    return (
      Number.isFinite(amt) &&
      amt > 0 &&
      form.description.trim().length > 0 &&
      !isSaving
    );
  }, [form.amount, form.description, isSaving]);

  async function handleCreate() {
    if (!canSubmit) return;
    const amount = parseFloat(form.amount);
    setIsSaving(true);
    try {
      const result = await createCashExpense({
        branch_id: branchId,
        shift_id: shiftId,
        terminal_id: terminalId ?? null,
        category_id: form.category_id || null,
        amount,
        payment_method: form.payment_method,
        description: form.description.trim(),
        notes: form.notes.trim() || null,
        reference_number: form.reference_number.trim() || null,
      });
      if (!result.success) {
        toast.error(result.error ?? "Failed to record expense");
        return;
      }
      toast.success(
        `Expense recorded · ${formatCurrency(amount)}` +
          (form.payment_method === "cash" ? " (reduces expected cash)" : ""),
      );
      setForm({
        amount: "",
        category_id: form.category_id,
        description: "",
        notes: "",
        reference_number: "",
        payment_method: "cash",
      });
      await load();
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record expense");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleVoid(id: string) {
    const reason = window.prompt("Reason for voiding this expense?");
    if (!reason || !reason.trim()) return;
    setVoidingId(id);
    try {
      const result = await voidCashExpense({ id, reason: reason.trim() });
      if (!result.success) {
        toast.error(result.error ?? "Failed to void expense");
        return;
      }
      toast.success("Expense voided");
      await load();
      onChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to void expense");
    } finally {
      setVoidingId(null);
    }
  }

  const activeExpenses = expenses.filter(
    (e) => !["void", "cancelled"].includes(e.status),
  );
  const voidedExpenses = expenses.filter((e) =>
    ["void", "cancelled"].includes(e.status),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Cash expenses
          </DialogTitle>
          <DialogDescription>
            Record money taken from the till during this shift. Cash expenses
            reduce expected cash at end of shift.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Summary */}
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500">Cash taken this shift</span>
              <span className="font-semibold tabular-nums text-[#F36509]">
                {formatCurrency(totalCash)}
              </span>
            </div>
          </div>

          {/* New expense form */}
          <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-3">
            <p className="text-sm font-medium text-stone-700">New expense</p>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="exp_amount">Amount</Label>
                <Input
                  id="exp_amount"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                  placeholder="0.00"
                  className="h-10 rounded-lg"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="exp_method">Paid with</Label>
                <select
                  id="exp_method"
                  value={form.payment_method}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      payment_method: e.target
                        .value as typeof form.payment_method,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm"
                >
                  <option value="cash">Cash (affects drawer)</option>
                  <option value="card">Card</option>
                  <option value="gcash">GCash</option>
                  <option value="maya">Maya</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {categories.length > 0 && (
              <div className="space-y-1">
                <Label htmlFor="exp_cat">Category</Label>
                <select
                  id="exp_cat"
                  value={form.category_id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category_id: e.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm"
                >
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="exp_desc">Description *</Label>
              <Input
                id="exp_desc"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="What was this for?"
                className="h-10 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="exp_ref">Reference / OR #</Label>
                <Input
                  id="exp_ref"
                  value={form.reference_number}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      reference_number: e.target.value,
                    }))
                  }
                  placeholder="Optional"
                  className="h-10 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="exp_notes">Notes</Label>
                <Input
                  id="exp_notes"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Optional"
                  className="h-10 rounded-lg"
                />
              </div>
            </div>

            <Button
              type="button"
              disabled={!canSubmit}
              onClick={handleCreate}
              className="h-11 w-full bg-[#F36509] text-white hover:bg-[#d95a08]"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Record expense
                </>
              )}
            </Button>
          </div>

          {/* List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-stone-700">
                This shift ({activeExpenses.length})
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={load}
                disabled={isLoading}
                className="text-stone-500"
              >
                <RefreshCw
                  className={`mr-1 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>

            {isLoading && expenses.length === 0 ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-[#F36509]" />
              </div>
            ) : activeExpenses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-200 py-8 text-center text-sm text-stone-400">
                No expenses recorded yet
              </div>
            ) : (
              <ul className="max-h-56 space-y-2 overflow-y-auto">
                {activeExpenses.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-stone-200 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-900">
                        {e.description}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {e.category_name ? `${e.category_name} · ` : ""}
                        {e.payment_method}
                        {e.reference_number ? ` · #${e.reference_number}` : ""}
                        {" · "}
                        {new Date(e.occurred_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums text-stone-900">
                        {formatCurrency(e.amount)}
                      </span>
                      <button
                        type="button"
                        disabled={voidingId === e.id}
                        onClick={() => handleVoid(e.id)}
                        className="rounded-lg p-1.5 text-stone-300 hover:bg-red-50 hover:text-red-600"
                        aria-label="Void expense"
                      >
                        {voidingId === e.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {voidedExpenses.length > 0 && (
              <p className="text-[11px] text-stone-400">
                {voidedExpenses.length} voided expense
                {voidedExpenses.length === 1 ? "" : "s"} not counted
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Small trigger button for the terminal header / cart area */
export function ExpenseTriggerButton({
  onClick,
  disabled,
  totalCash,
}: {
  onClick: () => void;
  disabled?: boolean;
  totalCash?: number;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="border-stone-200 text-stone-700 hover:border-amber-200 hover:bg-amber-50"
    >
      <Banknote className="mr-2 h-4 w-4" />
      Expenses
      {typeof totalCash === "number" && totalCash > 0 && (
        <span className="ml-1.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
          {formatCurrency(totalCash)}
        </span>
      )}
    </Button>
  );
}
