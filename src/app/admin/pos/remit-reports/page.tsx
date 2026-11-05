"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  History,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getPosBranches,
  getPendingRemittances,
  getRemittanceHistory,
  getShiftHandoverStatus,
  getClosedShiftsWithCashSummary,
  confirmRemittance,
  getRemittanceVerificationSummary,
  type CashRemittance,
  type ShiftHandoverRow,
  type ClosedShiftCashRow,
  type PosBranch,
  type RemittanceVerificationSummary,
} from "@/lib/pos-actions";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type TabId = "pending" | "handover" | "closed" | "history";

export default function RemitReportsPage() {
  const [tab, setTab] = useState<TabId>("pending");
  const [branches, setBranches] = useState<PosBranch[]>([]);
  const [branchId, setBranchId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const [pending, setPending] = useState<CashRemittance[]>([]);
  const [handover, setHandover] = useState<ShiftHandoverRow[]>([]);
  const [closedShifts, setClosedShifts] = useState<ClosedShiftCashRow[]>([]);
  const [history, setHistory] = useState<CashRemittance[]>([]);

  const [confirmTarget, setConfirmTarget] = useState<CashRemittance | null>(
    null,
  );
  const [confirmForm, setConfirmForm] = useState({
    actual_amount: "",
    recipient_name: "",
    notes: "",
  });
  const [isConfirming, setIsConfirming] = useState(false);
  const [verification, setVerification] =
    useState<RemittanceVerificationSummary | null>(null);
  const [isLoadingVerification, setIsLoadingVerification] = useState(false);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [branchesRes, pendingRes, handoverRes, closedRes, historyRes] =
        await Promise.all([
          getPosBranches(),
          getPendingRemittances(branchId || undefined),
          getShiftHandoverStatus(branchId || undefined),
          getClosedShiftsWithCashSummary({
            branchId: branchId || undefined,
            limit: 40,
          }),
          getRemittanceHistory({
            branchId: branchId || undefined,
            limit: 50,
          }),
        ]);

      if (branchesRes.success) {
        setBranches(branchesRes.data);
        if (!branchId && branchesRes.data.length === 1) {
          setBranchId(branchesRes.data[0].id);
        }
      }
      if (pendingRes.success) setPending(pendingRes.data);
      if (handoverRes.success) setHandover(handoverRes.data);
      if (closedRes.success) setClosedShifts(closedRes.data);
      if (historyRes.success) setHistory(historyRes.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function openConfirm(r: CashRemittance) {
    setConfirmTarget(r);
    setConfirmForm({
      actual_amount: String(r.expected_amount),
      recipient_name: r.recipient_name ?? "",
      notes: "",
    });
    setVerification(null);
    setIsLoadingVerification(true);
    try {
      const res = await getRemittanceVerificationSummary(r.id);
      if (res.success && res.data) {
        setVerification(res.data);
      } else {
        toast.message(res.error ?? "Could not load shift summary");
      }
    } catch (e) {
      toast.message(
        e instanceof Error ? e.message : "Could not load shift summary",
      );
    } finally {
      setIsLoadingVerification(false);
    }
  }

  async function handleConfirm() {
    if (!confirmTarget) return;
    const actual = parseFloat(confirmForm.actual_amount);
    if (!Number.isFinite(actual) || actual < 0) {
      toast.error("Enter a valid actual amount");
      return;
    }

    setIsConfirming(true);
    try {
      const res = await confirmRemittance({
        id: confirmTarget.id,
        actual_amount: actual,
        recipient_name: confirmForm.recipient_name.trim() || null,
        notes: confirmForm.notes.trim() || null,
      });

      if (!res.success) {
        toast.error(res.error ?? "Failed to confirm");
        return;
      }

      const diff = res.data?.difference_amount ?? 0;
      toast.success(
        diff === 0
          ? "Remittance confirmed · balanced"
          : `Remittance adjusted · difference ${formatCurrency(diff)}`,
      );
      setConfirmTarget(null);
      setVerification(null);
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to confirm");
    } finally {
      setIsConfirming(false);
    }
  }

  const pendingTotal = useMemo(
    () => pending.reduce((s, r) => s + r.expected_amount, 0),
    [pending],
  );

  const mismatchCount = useMemo(
    () => handover.filter((h) => h.match_status === "mismatch").length,
    [handover],
  );

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "pending", label: "Pending", count: pending.length },
    {
      id: "handover",
      label: "Handover check",
      count: mismatchCount || undefined,
    },
    { id: "closed", label: "Closed shifts" },
    { id: "history", label: "History" },
  ];

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col overflow-hidden">
      <div className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F36509]">
              POS · Cash
            </p>
            <h1 className="mt-1 font-serif text-xl font-semibold text-stone-900 sm:text-2xl">
              Remit Reports
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Track cash left for the next shift and money prepared for
              remittance / banking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm"
            >
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadAll}
              disabled={isLoading}
              className="border-stone-200"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-amber-700">
              Pending to remit
            </p>
            <p className="text-sm font-semibold text-amber-900">
              {formatCurrency(pendingTotal)}
              <span className="ml-2 font-normal text-amber-700">
                ({pending.length})
              </span>
            </p>
          </div>
          {mismatchCount > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-red-700">
                Handover mismatches
              </p>
              <p className="text-sm font-semibold text-red-900">
                {mismatchCount} terminal{mismatchCount === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-[#F36509] text-white"
                  : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              {t.label}
              {t.count != null && t.count > 0 && (
                <span
                  className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${
                    tab === t.id
                      ? "bg-white/20 text-white"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-stone-50 p-4 sm:p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="h-6 w-6 animate-spin text-[#F36509]" />
            <p className="mt-3 text-sm text-stone-500">Loading…</p>
          </div>
        ) : tab === "pending" ? (
          <PendingTab pending={pending} onConfirm={openConfirm} />
        ) : tab === "handover" ? (
          <HandoverTab rows={handover} />
        ) : tab === "closed" ? (
          <ClosedShiftsTab
            rows={closedShifts}
            onConfirmRemittance={(id) => {
              const target = pending.find((p) => p.id === id);
              if (target) openConfirm(target);
              else
                toast.message(
                  "Remittance already processed or not found in pending.",
                );
            }}
          />
        ) : (
          <HistoryTab rows={history} />
        )}
      </div>

      {/* Confirm dialog with verification summary */}
      <Dialog
        open={!!confirmTarget}
        onOpenChange={(open) => {
          if (!open && !isConfirming) {
            setConfirmTarget(null);
            setVerification(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Confirm remittance
            </DialogTitle>
            <DialogDescription>
              {confirmTarget && (
                <>
                  Expected{" "}
                  <span className="font-semibold text-stone-900">
                    {formatCurrency(confirmTarget.expected_amount)}
                  </span>
                  {confirmTarget.from_shift_number && (
                    <> · from shift {confirmTarget.from_shift_number}</>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {confirmTarget && (
            <div className="space-y-4 py-2">
              {/* Shift sales & cash verification */}
              {isLoadingVerification ? (
                <div className="flex flex-col items-center py-8">
                  <RefreshCw className="h-5 w-5 animate-spin text-[#F36509]" />
                  <p className="mt-2 text-sm text-stone-500">
                    Loading shift summary…
                  </p>
                </div>
              ) : verification ? (
                <VerificationSummaryBlock data={verification} />
              ) : (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-500">
                  Shift summary unavailable. You can still confirm the
                  remittance amount.
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="actual_amount">Actual amount received</Label>
                <Input
                  id="actual_amount"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={confirmForm.actual_amount}
                  onChange={(e) =>
                    setConfirmForm((f) => ({
                      ...f,
                      actual_amount: e.target.value,
                    }))
                  }
                  className="h-11 rounded-xl"
                  autoFocus
                />
                {confirmForm.actual_amount !== "" &&
                  Number.isFinite(parseFloat(confirmForm.actual_amount)) && (
                    <p
                      className={`text-sm ${
                        parseFloat(confirmForm.actual_amount) ===
                        confirmTarget.expected_amount
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      Difference:{" "}
                      {formatCurrency(
                        parseFloat(confirmForm.actual_amount) -
                          confirmTarget.expected_amount,
                      )}
                    </p>
                  )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient">
                  Recipient / bag label (optional)
                </Label>
                <Input
                  id="recipient"
                  value={confirmForm.recipient_name}
                  onChange={(e) =>
                    setConfirmForm((f) => ({
                      ...f,
                      recipient_name: e.target.value,
                    }))
                  }
                  placeholder="e.g. Safe bag #12, Accounting"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remit_notes">Notes (optional)</Label>
                <Input
                  id="remit_notes"
                  value={confirmForm.notes}
                  onChange={(e) =>
                    setConfirmForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isConfirming}
              onClick={() => {
                setConfirmTarget(null);
                setVerification(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                isConfirming ||
                confirmForm.actual_amount === "" ||
                !Number.isFinite(parseFloat(confirmForm.actual_amount))
              }
              onClick={handleConfirm}
              className="bg-[#F36509] text-white hover:bg-[#d95a08]"
            >
              {isConfirming ? "Saving…" : "Confirm received"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

/* ---------- Verification summary (sales + expenses) ---------- */

function VerificationSummaryBlock({
  data,
}: {
  data: RemittanceVerificationSummary;
}) {
  const { cash, remittance, chain, chain_totals } = data;

  const remittanceMatches =
    cash.implied_remittance != null &&
    Math.abs(cash.implied_remittance - remittance.expected_amount) < 0.005;

  return (
    <div className="space-y-3">
      {/* Chain overview */}
      <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
          Float chain · {chain_totals.shift_count} shift
          {chain_totals.shift_count === 1 ? "" : "s"}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <p className="text-[10px] uppercase text-stone-400">Cash sales</p>
            <p className="font-semibold tabular-nums text-stone-900">
              {formatCurrency(chain_totals.cash_sales)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-stone-400">Cash expenses</p>
            <p className="font-semibold tabular-nums text-stone-900">
              {formatCurrency(chain_totals.cash_expenses)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-stone-400">Orders</p>
            <p className="font-semibold tabular-nums text-stone-900">
              {chain_totals.order_count}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase text-stone-400">Remittance</p>
            <p
              className={`font-semibold tabular-nums ${
                remittanceMatches ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {formatCurrency(remittance.expected_amount)}
            </p>
          </div>
        </div>
        {chain.length > 1 && (
          <p className="mt-2 text-xs text-stone-500">
            {chain
              .map((c) => c.shift_number ?? c.id.slice(0, 6))
              .join(" → ")}
          </p>
        )}
      </div>

      {/* Each shift in the chain (oldest → remitting) */}
      {chain.map((s, idx) => {
        const activeExpenses = s.expenses.filter(
          (e) => !["void", "cancelled"].includes(e.status),
        );
        return (
          <div
            key={s.id}
            className={`rounded-xl border p-3 text-sm ${
              s.is_source_shift
                ? "border-[#F36509]/40 bg-orange-50/30"
                : "border-stone-200 bg-white"
            }`}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Shift {idx + 1} of {chain.length}
              </span>
              <span className="font-medium text-stone-900">
                {s.shift_number ?? s.id.slice(0, 8)}
              </span>
              {s.is_source_shift && (
                <Badge
                  variant="outline"
                  className="border-[#F36509]/30 bg-orange-50 text-[#F36509]"
                >
                  Prepared this remittance
                </Badge>
              )}
              {!s.is_source_shift && s.retained_for_next > 0 && (
                <Badge
                  variant="outline"
                  className="border-sky-200 bg-sky-50 text-sky-700"
                >
                  Retained {formatCurrency(s.retained_for_next)} → next
                </Badge>
              )}
            </div>
            <p className="mb-2 text-xs text-stone-500">
              {formatDateTime(s.opened_at)}
              {s.closed_at && <> → {formatDateTime(s.closed_at)}</>}
              {" · "}
              {s.order_count} order(s)
            </p>

            {/* Reconciliation */}
            <div className="space-y-0.5 rounded-lg bg-white/80 px-2 py-1.5">
              <Row label="Opening float" value={s.opening} />
              <Row label="+ Cash sales" value={s.cash_sales} />
              {s.cash_topups > 0 && (
                <Row label="+ Top-ups" value={s.cash_topups} />
              )}
              {s.cash_refunds > 0 && (
                <Row label="− Cash refunds" value={s.cash_refunds} negative />
              )}
              <Row label="− Cash expenses" value={s.cash_expenses} negative />
              <div className="flex justify-between border-t border-stone-100 pt-1 text-xs font-semibold text-stone-900">
                <span>Expected / actual</span>
                <span className="tabular-nums">
                  {formatCurrency(s.expected_in_drawer)}
                  {s.actual_counted != null && (
                    <> · counted {formatCurrency(s.actual_counted)}</>
                  )}
                </span>
              </div>
              {s.variance != null && s.variance !== 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">Variance</span>
                  <span
                    className={
                      s.variance > 0 ? "text-sky-700" : "text-red-700"
                    }
                  >
                    {formatCurrency(s.variance)}
                  </span>
                </div>
              )}
              <Row
                label="Retained for next"
                value={s.retained_for_next}
              />
              {s.is_source_shift && (
                <div className="flex justify-between border-t border-stone-100 pt-1 font-semibold text-stone-900">
                  <span>Remittance</span>
                  <span className="tabular-nums">
                    {formatCurrency(s.remitted_amount)}
                  </span>
                </div>
              )}
            </div>

            {/* Payment mix */}
            {(s.payment_breakdown.cash > 0 ||
              s.payment_breakdown.card > 0 ||
              s.payment_breakdown.gcash > 0 ||
              s.payment_breakdown.maya > 0) && (
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-stone-600 sm:grid-cols-4">
                <span>
                  Cash{" "}
                  <span className="tabular-nums font-medium text-stone-800">
                    {formatCurrency(s.payment_breakdown.cash)}
                  </span>
                </span>
                <span>
                  Card{" "}
                  <span className="tabular-nums font-medium text-stone-800">
                    {formatCurrency(s.payment_breakdown.card)}
                  </span>
                </span>
                <span>
                  GCash{" "}
                  <span className="tabular-nums font-medium text-stone-800">
                    {formatCurrency(s.payment_breakdown.gcash)}
                  </span>
                </span>
                <span>
                  Maya{" "}
                  <span className="tabular-nums font-medium text-stone-800">
                    {formatCurrency(s.payment_breakdown.maya)}
                  </span>
                </span>
              </div>
            )}

            {/* Cash sale lines */}
            {s.cash_sales_lines.length > 0 && (
              <div className="mt-2">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-stone-400">
                  Cash receipts ({s.cash_sales_lines.length})
                </p>
                <ul className="max-h-28 space-y-0.5 overflow-y-auto text-xs">
                  {s.cash_sales_lines.map((line) => (
                    <li
                      key={line.payment_id}
                      className="flex justify-between gap-2"
                    >
                      <span className="text-stone-600">
                        {line.order_number ?? line.order_id.slice(0, 8)}
                      </span>
                      <span className="tabular-nums text-stone-900">
                        {formatCurrency(line.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Expenses */}
            {activeExpenses.length > 0 && (
              <div className="mt-2">
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-stone-400">
                  Expenses ({activeExpenses.length})
                </p>
                <ul className="max-h-28 space-y-1 overflow-y-auto text-xs">
                  {activeExpenses.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-stone-800">
                          {e.description}
                        </p>
                        <p className="text-stone-400">
                          {e.category_name ? `${e.category_name} · ` : ""}
                          {e.payment_method}
                          {e.payment_method === "cash"
                            ? " · affects drawer"
                            : ""}
                        </p>
                      </div>
                      <span className="shrink-0 tabular-nums font-medium text-stone-900">
                        {formatCurrency(e.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {s.cash_sales === 0 &&
              activeExpenses.length === 0 &&
              s.order_count === 0 && (
                <p className="mt-2 text-xs text-stone-400">
                  No sales or expenses on this shift (float pass-through).
                </p>
              )}
          </div>
        );
      })}

      {/* Final remittance check */}
      <div className="rounded-xl border border-stone-200 bg-white p-3 text-sm">
        <div className="flex justify-between font-semibold text-stone-900">
          <span>Implied remittance (last shift)</span>
          <span className="tabular-nums">
            {cash.implied_remittance != null
              ? formatCurrency(cash.implied_remittance)
              : "—"}
          </span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-stone-500">Remittance expected</span>
          <span
            className={`tabular-nums font-semibold ${
              remittanceMatches ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {formatCurrency(remittance.expected_amount)}
            {remittanceMatches ? " · matches" : " · check"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  negative,
  emphasize,
}: {
  label: string;
  value: number | null;
  negative?: boolean;
  emphasize?: boolean;
}) {
  if (value == null) {
    return (
      <div className="flex justify-between text-xs">
        <span className="text-stone-500">{label}</span>
        <span className="text-stone-400">—</span>
      </div>
    );
  }
  return (
    <div className="flex justify-between text-xs">
      <span className="text-stone-500">{label}</span>
      <span
        className={`tabular-nums ${
          emphasize ? "font-medium text-stone-900" : "text-stone-700"
        }`}
      >
        {negative && value > 0 ? "−" : ""}
        {formatCurrency(value)}
      </span>
    </div>
  );
}

/* ---------- Tab components ---------- */

function PendingTab({
  pending,
  onConfirm,
}: {
  pending: CashRemittance[];
  onConfirm: (r: CashRemittance) => void;
}) {
  if (pending.length === 0) {
    return (
      <EmptyState
        icon={Banknote}
        title="No pending remittances"
        description="When a shift is closed with cash to remit, it will appear here as a draft."
      />
    );
  }

  return (
    <div className="space-y-3">
      {pending.map((r) => (
        <Card key={r.id} className="border-stone-200 bg-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-amber-200 bg-amber-50 text-amber-800"
                  >
                    {r.status}
                  </Badge>
                  {r.remittance_number != null && (
                    <span className="text-xs text-stone-400">
                      #{r.remittance_number}
                    </span>
                  )}
                  <span className="text-sm font-medium text-stone-900">
                    {r.branch_name ?? "—"}
                  </span>
                </div>
                <p className="text-sm text-stone-500">
                  From shift{" "}
                  <span className="font-medium text-stone-700">
                    {r.from_shift_number ?? "—"}
                  </span>
                  {" · "}
                  {formatDateTime(r.prepared_at)}
                </p>
                {r.notes && (
                  <p className="text-xs text-stone-400 line-clamp-2">
                    {r.notes}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                <p className="text-lg font-semibold tabular-nums text-stone-900">
                  {formatCurrency(r.expected_amount)}
                </p>
                <p className="text-xs text-stone-500">
                  Retained {formatCurrency(r.retained_cash)}
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onConfirm(r)}
                  className="bg-[#F36509] text-white hover:bg-[#d95a08]"
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Review &amp; confirm
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function HandoverTab({ rows }: { rows: ShiftHandoverRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ArrowRightLeft}
        title="No terminals to check"
        description="Active terminals will appear here with last retained float vs current open shift count."
      />
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((h) => {
        const statusStyle =
          h.match_status === "matched"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : h.match_status === "mismatch"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-stone-200 bg-stone-50 text-stone-600";

        const statusLabel =
          h.match_status === "matched"
            ? "Matched"
            : h.match_status === "mismatch"
              ? "Mismatch"
              : h.match_status === "no_open_shift"
                ? "No open shift"
                : "No prior retained";

        return (
          <Card key={h.terminal_id} className="border-stone-200 bg-white">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-stone-900">
                      {h.terminal_name}
                    </span>
                    <span className="text-sm text-stone-500">
                      {h.branch_name}
                    </span>
                    <Badge variant="outline" className={statusStyle}>
                      {statusLabel}
                    </Badge>
                  </div>
                  <div className="mt-2 grid gap-1 text-sm text-stone-600 sm:grid-cols-2">
                    <p>
                      Last retained:{" "}
                      <span className="font-medium tabular-nums">
                        {h.last_retained_cash != null
                          ? formatCurrency(h.last_retained_cash)
                          : "—"}
                      </span>
                      {h.last_closed_shift_number && (
                        <span className="text-stone-400">
                          {" "}
                          ({h.last_closed_shift_number})
                        </span>
                      )}
                    </p>
                    <p>
                      Open counted:{" "}
                      <span className="font-medium tabular-nums">
                        {h.open_opening_counted_cash != null
                          ? formatCurrency(h.open_opening_counted_cash)
                          : h.open_starting_cash != null
                            ? formatCurrency(h.open_starting_cash)
                            : "—"}
                      </span>
                      {h.open_shift_number && (
                        <span className="text-stone-400">
                          {" "}
                          ({h.open_shift_number})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {h.difference != null && h.difference !== 0 && (
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-red-600">
                      Difference
                    </p>
                    <p className="text-lg font-semibold tabular-nums text-red-700">
                      {formatCurrency(h.difference)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ClosedShiftsTab({
  rows,
  onConfirmRemittance,
}: {
  rows: ClosedShiftCashRow[];
  onConfirmRemittance: (remittanceId: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No closed shifts yet"
        description="Closed shifts with cash summaries will show here."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
          <tr>
            <th className="px-4 py-3 font-medium">Shift</th>
            <th className="px-4 py-3 font-medium text-right">Expected</th>
            <th className="px-4 py-3 font-medium text-right">Actual</th>
            <th className="px-4 py-3 font-medium text-right">Variance</th>
            <th className="px-4 py-3 font-medium text-right">Retained</th>
            <th className="px-4 py-3 font-medium">Remittance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr
              key={s.id}
              className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
            >
              <td className="px-4 py-3">
                <p className="font-medium text-stone-900">
                  {s.shift_number ?? s.id.slice(0, 8)}
                </p>
                <p className="text-xs text-stone-400">
                  {formatDateTime(s.closed_at)}
                </p>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatCurrency(s.expected_cash)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {s.actual_cash != null ? formatCurrency(s.actual_cash) : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                {s.variance == null ? (
                  "—"
                ) : (
                  <span
                    className={
                      s.variance === 0
                        ? "text-emerald-700"
                        : s.variance > 0
                          ? "text-sky-700"
                          : "text-red-700"
                    }
                  >
                    {s.variance === 0 ? "Balanced" : formatCurrency(s.variance)}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatCurrency(s.retained_cash)}
              </td>
              <td className="px-4 py-3">
                {s.remittance_id ? (
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant="outline"
                      className={
                        s.remittance_status === "draft" ||
                        s.remittance_status === "prepared"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800"
                      }
                    >
                      {s.remittance_status}
                    </Badge>
                    {s.remittance_expected != null && (
                      <span className="text-xs tabular-nums text-stone-500">
                        {formatCurrency(s.remittance_expected)}
                      </span>
                    )}
                    {(s.remittance_status === "draft" ||
                      s.remittance_status === "prepared") && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 justify-start px-0 text-xs text-[#F36509]"
                        onClick={() => onConfirmRemittance(s.remittance_id!)}
                      >
                        Review →
                      </Button>
                    )}
                  </div>
                ) : (
                  <span className="text-stone-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTab({ rows }: { rows: CashRemittance[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No remittance history"
        description="Confirmed and adjusted remittances will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <Card key={r.id} className="border-stone-200 bg-white">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      r.status === "cancelled"
                        ? "border-stone-200 bg-stone-50 text-stone-600"
                        : r.difference_amount && r.difference_amount !== 0
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800"
                    }
                  >
                    {r.status}
                  </Badge>
                  <span className="text-sm font-medium text-stone-900">
                    {r.branch_name ?? "—"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-stone-500">
                  {formatDateTime(r.confirmed_at ?? r.prepared_at)}
                  {r.from_shift_number && <> · shift {r.from_shift_number}</>}
                  {r.recipient_name && <> · {r.recipient_name}</>}
                </p>
              </div>
              <div className="text-right">
                <p className="tabular-nums text-stone-900">
                  Expected {formatCurrency(r.expected_amount)}
                </p>
                <p className="tabular-nums text-sm text-stone-600">
                  Actual{" "}
                  {r.actual_amount != null
                    ? formatCurrency(r.actual_amount)
                    : "—"}
                  {r.difference_amount != null && r.difference_amount !== 0 && (
                    <span className="ml-2 text-amber-700">
                      ({formatCurrency(r.difference_amount)})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-stone-200 bg-white">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-stone-100 p-4">
          <Icon className="h-6 w-6 text-stone-400" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-stone-900">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-stone-500">{description}</p>
      </CardContent>
    </Card>
  );
}