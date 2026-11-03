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
  Search,
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
  type CashRemittance,
  type ShiftHandoverRow,
  type ClosedShiftCashRow,
  type PosBranch,
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

  function openConfirm(r: CashRemittance) {
    setConfirmTarget(r);
    setConfirmForm({
      actual_amount: String(r.expected_amount),
      recipient_name: r.recipient_name ?? "",
      notes: "",
    });
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
      {/* Header */}
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

        {/* Summary chips */}
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
                {mismatchCount} drawer{mismatchCount === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
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

      {/* Body */}
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
              const r =
                pending.find((p) => p.id === id) ??
                history.find((h) => h.id === id);
              // Prefer pending list; if already confirmed it won't appear here
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

      {/* Confirm dialog */}
      <Dialog
        open={!!confirmTarget}
        onOpenChange={(open) => {
          if (!open && !isConfirming) setConfirmTarget(null);
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
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
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Drawer</span>
                  <span>{confirmTarget.drawer_name ?? "—"}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-stone-500">Retained float</span>
                  <span>{formatCurrency(confirmTarget.retained_cash)}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-stone-500">Prepared</span>
                  <span>{formatDateTime(confirmTarget.prepared_at)}</span>
                </div>
              </div>

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
              onClick={() => setConfirmTarget(null)}
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
                    {r.drawer_name ?? "Drawer"} · {r.branch_name ?? "—"}
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
                  Confirm
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
            <th className="px-4 py-3 font-medium">Drawer</th>
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
              <td className="px-4 py-3 text-stone-600">
                {s.drawer_name ?? "—"}
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
                        Confirm →
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
                    {r.drawer_name ?? "Drawer"} · {r.branch_name ?? "—"}
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
