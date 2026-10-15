"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  QrCode,
  RefreshCw,
  Copy,
  ArrowLeft,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Armchair,
  Clock,
  Eye,
  ShoppingBag,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LOCATION_TYPE_LABELS,
  LOCATION_TYPES,
  getLocationLabel,
  LocationType,
} from "@/lib/pos-locations";
import type { useQrSessions } from "@/hooks/useQrSessions";
import { Banknote, CreditCard } from "lucide-react";
import { recordPayment, completeOrder } from "@/lib/order-actions";

type QrSessionsReturn = ReturnType<typeof useQrSessions>;

/** Minimal order shape expected from the hook for the session orders modal */
export type SessionOrder = {
  id: string;
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

type QrSessionsPageProps = QrSessionsReturn & {
  getSessionStatusBadge: (status: string) => React.ReactNode;
  /** Map of session.id → orders for that session. Populate from the hook. */
  sessionOrders?: Record<string, SessionOrder[]>;
  /** Loading state while fetching orders for a specific session */
  isLoadingSessionOrders?: boolean;
  /** Optional: call this when the user opens the orders modal for a session */
  onLoadSessionOrders?: (sessionId: string) => void;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getTimeRemaining(expiresAt: string): {
  label: string;
  urgent: boolean;
  expired: boolean;
} {
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const diffMs = exp - now;

  if (diffMs <= 0) {
    return { label: "Expired", urgent: true, expired: true };
  }

  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return {
      label: `${days}d ${hours % 24}h left`,
      urgent: false,
      expired: false,
    };
  }
  if (hours > 0) {
    return {
      label: `${hours}h ${minutes}m left`,
      urgent: hours < 1,
      expired: false,
    };
  }
  return {
    label: `${minutes}m left`,
    urgent: minutes < 30,
    expired: false,
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getOrderStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "completed" || s === "paid") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700"
      >
        {status}
      </Badge>
    );
  }
  if (s === "open" || s === "pending" || s === "in_progress") {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700"
      >
        {status}
      </Badge>
    );
  }
  if (s === "cancelled" || s === "void") {
    return (
      <Badge
        variant="outline"
        className="border-stone-200 bg-stone-100 text-stone-500"
      >
        {status}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-stone-200 text-stone-600">
      {status}
    </Badge>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function SessionSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-stone-200 bg-white p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-stone-200" />
              <div className="h-3 w-20 rounded bg-stone-100" />
              <div className="h-3 w-40 rounded bg-stone-100" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-20 rounded-lg bg-stone-100" />
              <div className="h-8 w-20 rounded-lg bg-stone-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function QrSessionsPage({
  // Sessions
  sessions,
  isLoadingSessions,
  isCreatingSession,
  showCreateSessionDialog,
  setShowCreateSessionDialog,
  createSessionForm,
  setCreateSessionForm,
  createdSessionUrl,
  setCreatedSessionUrl,
  createdSessionToken,
  loadSessions,
  handleCreateSession,
  handleDeactivateSession,
  copySessionUrl,
  getSessionStatus,
  getSessionLocation,

  // Branches
  branches = [],
  isLoadingBranches = false,

  // Locations
  locations,
  isLoadingLocations,
  showManageLocationsDialog,
  setShowManageLocationsDialog,
  activeLocationTab,
  setActiveLocationTab,
  locationForm,
  setLocationForm,
  editingLocation,
  isLocationFormOpen,
  isSavingLocation,
  togglingLocationId,
  removingLocationId,
  openAddLocationForm,
  openEditLocationForm,
  cancelLocationForm,
  handleSaveLocation,
  handleToggleLocation,
  handleDeleteLocation,

  // Badge helper
  getSessionStatusBadge,

  // Orders (new)
  sessionOrders = {},
  isLoadingSessionOrders = false,
  onLoadSessionOrders,
}: QrSessionsPageProps) {
  // Local UI state for QR viewer + Orders modal
  const [viewQrSession, setViewQrSession] = useState<{
    token: string;
    locationLabel: string;
    expiresAt: string;
  } | null>(null);

  const [ordersModalSession, setOrdersModalSession] = useState<{
    id: string;
    locationLabel: string;
  } | null>(null);

  const openOrdersModal = (sessionId: string, locationLabel: string) => {
    setOrdersModalSession({ id: sessionId, locationLabel });
    onLoadSessionOrders?.(sessionId);
  };

  const currentOrders = useMemo(() => {
    if (!ordersModalSession) return [];
    return sessionOrders[ordersModalSession.id] ?? [];
  }, [ordersModalSession, sessionOrders]);

  const buildSessionUrl = (token: string) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/menu?session=${token}`;
  };

  const handleCopyUrl = (token: string) => {
    const url = buildSessionUrl(token);
    navigator.clipboard.writeText(url);
    toast.success("URL copied");
  };

  type PaymentMethod = "cash" | "card" | "gcash" | "maya";

  const [payOrder, setPayOrder] = useState<SessionOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const changeDue = useMemo(() => {
    if (!payOrder || paymentMethod !== "cash") return 0;
    const tendered = parseFloat(amountTendered) || 0;
    return Math.max(0, tendered - payOrder.total_amount);
  }, [payOrder, paymentMethod, amountTendered]);

  const canConfirmPayment = useMemo(() => {
    if (!payOrder || isProcessingPayment) return false;
    if (paymentMethod === "cash") {
      return (parseFloat(amountTendered) || 0) >= payOrder.total_amount;
    }
    return true;
  }, [payOrder, isProcessingPayment, paymentMethod, amountTendered]);

  function openPayDialog(order: SessionOrder) {
    setPayOrder(order);
    setPaymentMethod("cash");
    setAmountTendered("");
  }

  function isOrderPayable(status: string) {
    const s = status.toLowerCase();
    return s !== "completed" && s !== "cancelled" && s !== "void";
  }

  async function handleConfirmPayment() {
    if (!payOrder || !canConfirmPayment || !ordersModalSession) return;

    setIsProcessingPayment(true);
    try {
      const received =
        paymentMethod === "cash"
          ? parseFloat(amountTendered) || payOrder.total_amount
          : payOrder.total_amount;

      const payResult = await recordPayment({
        order_id: payOrder.id,
        payment_method: paymentMethod,
        amount: payOrder.total_amount,
        received_amount: received,
      });

      if (!payResult.success) {
        toast.error(payResult.error ?? "Payment failed");
        return;
      }

      const completeResult = await completeOrder(payOrder.id);
      if (!completeResult.success) {
        toast.error(
          completeResult.error ??
            "Payment saved but order could not be completed",
        );
        // still refresh so payment_method shows
      } else {
        toast.success("Payment recorded");
      }

      setPayOrder(null);
      setAmountTendered("");
      onLoadSessionOrders?.(ordersModalSession.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setIsProcessingPayment(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] flex-1 bg-stone-50/50">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/pos/terminal/primary"
              className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              aria-label="Back to terminal"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="rounded-xl bg-[#F36509]/10 p-2">
              <QrCode className="h-5 w-5 text-[#F36509]" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-semibold text-stone-900 sm:text-2xl">
                QR Order Sessions
              </h1>
              <p className="text-sm text-stone-500">
                Create sessions for tables, rooms, or cubicles. Customers scan
                to order.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Active sessions summary */}
            {sessions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
                <span className="hidden sm:inline">Active:</span>
                {sessions
                  .filter((s) => getSessionStatus(s) === "active")
                  .map((s) => (
                    <Badge
                      key={s.id}
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-emerald-700"
                    >
                      {getSessionLocation(s)}
                    </Badge>
                  ))}
              </div>
            )}

            {/* Create QR Session */}
            <Dialog
              open={showCreateSessionDialog}
              onOpenChange={setShowCreateSessionDialog}
            >
              <DialogTrigger
                render={
                  <Button
                    className="rounded-full bg-[#F36509] text-white hover:bg-[#d95a08]"
                    disabled={
                      isCreatingSession ||
                      (locations.table.length === 0 &&
                        locations.room.length === 0 &&
                        locations.cubicle.length === 0)
                    }
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    {isCreatingSession ? "Creating..." : "Create QR Session"}
                  </Button>
                }
              />

              <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">
                    Create QR Session
                  </DialogTitle>
                  <DialogDescription>
                    Select a table, room, or cubicle to generate a QR code for
                    customer ordering.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Branch */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">
                      Branch
                    </label>
                    <Select
                      value={createSessionForm.branch_id || undefined}
                      onValueChange={(v) => {
                        if (v) {
                          setCreateSessionForm({
                            ...createSessionForm,
                            branch_id: v,
                          });
                        }
                      }}
                      disabled={isLoadingBranches || branches.length === 0}
                    >
                      <SelectTrigger className="w-full rounded-xl border-stone-200 bg-white focus:ring-[#F36509]/30">
                        <SelectValue
                          placeholder={
                            isLoadingBranches
                              ? "Loading branches..."
                              : branches.length === 0
                                ? "No branches found"
                                : "Select branch"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {branches.length === 0 && !isLoadingBranches && (
                      <p className="text-xs text-amber-600">
                        No branches available. Add a branch before creating QR
                        sessions.
                      </p>
                    )}
                  </div>

                  {/* Location type radios */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">
                      Location Type
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {LOCATION_TYPES.map((type) => (
                        <label
                          key={type}
                          className="flex cursor-pointer items-center gap-2"
                        >
                          <input
                            type="radio"
                            name="sessionType"
                            value={type}
                            checked={createSessionForm.type === type}
                            onChange={() =>
                              setCreateSessionForm({
                                ...createSessionForm,
                                type,
                                id: "",
                              })
                            }
                            className="h-4 w-4 border-stone-300 text-[#F36509] focus:ring-[#F36509]"
                          />
                          <span className="text-sm text-stone-700">
                            {LOCATION_TYPE_LABELS[type]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Location select */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700">
                      Select {LOCATION_TYPE_LABELS[createSessionForm.type]}
                    </label>
                    <select
                      value={createSessionForm.id}
                      onChange={(e) =>
                        setCreateSessionForm({
                          ...createSessionForm,
                          id: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border-stone-200 bg-white px-3 py-2 text-sm focus-visible:ring-[#F36509]/30"
                    >
                      <option value="">Choose...</option>
                      {locations[createSessionForm.type]
                        .filter((l) => l.is_active)
                        .map((location) => (
                          <option key={location.id} value={location.id}>
                            {createSessionForm.type === "table"
                              ? `${getLocationLabel("table", location.name)} (${location.zone}, ${location.seats} seats)`
                              : `${getLocationLabel(createSessionForm.type, location.name)} (${location.seats} seats)`}
                          </option>
                        ))}
                    </select>
                    {locations[createSessionForm.type].filter(
                      (l) => l.is_active,
                    ).length === 0 && (
                      <p className="text-xs text-stone-500">
                        No active{" "}
                        {LOCATION_TYPE_LABELS[
                          createSessionForm.type
                        ].toLowerCase()}
                        s available. Add one via Manage Locations.
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateSessionDialog(false)}
                    disabled={isCreatingSession}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateSession}
                    disabled={
                      isCreatingSession ||
                      !createSessionForm.id ||
                      !createSessionForm.branch_id
                    }
                    className="rounded-xl bg-[#F36509] text-white hover:bg-[#d95a08]"
                  >
                    {isCreatingSession ? "Creating..." : "Create Session"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Manage Locations */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                cancelLocationForm();
                setShowManageLocationsDialog(true);
              }}
              disabled={isLoadingLocations}
              className="text-stone-500"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Manage Locations
            </Button>

            {/* Refresh */}
            <Button
              type="button"
              variant="outline"
              onClick={loadSessions}
              disabled={isLoadingSessions}
              className="text-stone-500"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoadingSessions ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* ── Sessions list ──────────────────────────────────────────────── */}
      <div className="px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {isLoadingSessions ? (
            <SessionSkeleton />
          ) : sessions.length > 0 ? (
            <div className="space-y-2">
              {sessions.map((session) => {
                const status = getSessionStatus(session);
                const time = getTimeRemaining(session.expires_at);
                const locationLabel = getSessionLocation(session);
                const orderCount = sessionOrders[session.id]?.length ?? 0;

                return (
                  <div
                    key={session.id}
                    className="rounded-xl border border-stone-200 bg-white p-3 sm:p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-stone-900">
                            {locationLabel}
                          </p>
                          {getSessionStatusBadge(status)}
                          {/* Time remaining */}
                          <Badge
                            variant="outline"
                            className={
                              time.expired
                                ? "border-stone-200 bg-stone-100 text-stone-500"
                                : time.urgent
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-stone-200 bg-stone-50 text-stone-600"
                            }
                          >
                            <Clock className="mr-1 h-3 w-3" />
                            {time.label}
                          </Badge>
                        </div>
                        <p className="mt-1 font-mono text-[10px] text-stone-400">
                          {session.id.slice(0, 8)}…
                        </p>
                        <p className="mt-0.5 text-xs text-stone-500">
                          Expires{" "}
                          {new Date(session.expires_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {/* View Orders */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openOrdersModal(session.id, locationLabel)
                          }
                          className="text-stone-600 hover:bg-stone-100"
                        >
                          <ShoppingBag className="mr-1 h-3.5 w-3.5" />
                          Orders
                          {orderCount > 0 && (
                            <span className="ml-1 rounded-full bg-stone-100 px-1.5 text-[10px] font-medium text-stone-600">
                              {orderCount}
                            </span>
                          )}
                        </Button>

                        {/* View QR */}
                        {status === "active" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setViewQrSession({
                                token: session.qr_token,
                                locationLabel,
                                expiresAt: session.expires_at,
                              })
                            }
                            className="text-stone-600 hover:bg-stone-100"
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            View QR
                          </Button>
                        )}

                        {/* Copy URL */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyUrl(session.qr_token)}
                          className="text-stone-600 hover:bg-stone-100"
                        >
                          <Copy className="mr-1 h-3.5 w-3.5" />
                          Copy URL
                        </Button>

                        {/* Deactivate */}
                        {status === "active" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivateSession(session.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white py-16 text-center">
              <QrCode className="mx-auto mb-3 h-10 w-10 text-stone-300" />
              <p className="font-medium text-stone-600">No QR sessions yet</p>
              <p className="mt-1 text-sm text-stone-500">
                Create one for a table, room, or cubicle to get started.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── View QR dialog (reusable for any session) ──────────────────── */}
      <Dialog
        open={!!viewQrSession}
        onOpenChange={(open) => {
          if (!open) setViewQrSession(null);
        }}
      >
        <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">QR Code</DialogTitle>
            <DialogDescription>
              {viewQrSession?.locationLabel}
            </DialogDescription>
          </DialogHeader>
          {viewQrSession && (
            <div className="space-y-4 py-2">
              <div className="flex justify-center rounded-xl bg-white p-4">
                <QRCodeSVG
                  value={buildSessionUrl(viewQrSession.token)}
                  size={200}
                  level="M"
                />
              </div>
              <div className="space-y-1.5 text-center">
                <p className="break-all text-sm text-stone-500">
                  {buildSessionUrl(viewQrSession.token)}
                </p>
                <p className="text-xs text-stone-400">
                  Expires: {new Date(viewQrSession.expiresAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCopyUrl(viewQrSession.token)}
                  className="flex-1"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy URL
                </Button>
                <Button
                  type="button"
                  onClick={() => setViewQrSession(null)}
                  className="flex-1 bg-[#F36509] text-white hover:bg-[#d95a08]"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Post-create success QR (keeps existing behaviour) ──────────── */}
      {createdSessionToken && createdSessionUrl && (
        <Dialog open={true} onOpenChange={() => setCreatedSessionUrl(null)}>
          <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl">
                QR Session Created
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <QRCodeSVG value={createdSessionUrl} size={180} level="M" />
              </div>
              <div className="space-y-2 text-center">
                <p className="break-all text-sm text-stone-500">
                  {createdSessionUrl}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={copySessionUrl}
                  className="flex-1"
                >
                  Copy URL
                </Button>
                <Button
                  type="button"
                  onClick={() => setCreatedSessionUrl(null)}
                  className="flex-1 bg-[#F36509] text-white hover:bg-[#d95a08]"
                >
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Session Orders modal ───────────────────────────────────────── */}
      <Dialog
        open={!!ordersModalSession}
        onOpenChange={(open) => {
          if (!open) setOrdersModalSession(null);
        }}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-hidden rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-xl">
              <Receipt className="h-5 w-5 text-[#F36509]" />
              Orders
            </DialogTitle>
            <DialogDescription>
              {ordersModalSession?.locationLabel}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto py-2">
            {isLoadingSessionOrders ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-stone-500">
                <RefreshCw className="h-4 w-4 animate-spin text-[#F36509]" />
                Loading orders…
              </div>
            ) : currentOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 py-12 text-center">
                <ShoppingBag className="mx-auto mb-2 h-8 w-8 text-stone-300" />
                <p className="text-sm font-medium text-stone-600">
                  No orders yet
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  Orders placed via this QR session will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-stone-200 bg-stone-50/50 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-xs text-stone-500">
                            #{order.id.slice(0, 8)}
                          </p>
                          {getOrderStatusBadge(order.status)}
                        </div>
                        <p className="mt-1 text-xs text-stone-500">
                          {new Date(order.created_at).toLocaleString()}
                          {order.payment_method && (
                            <span className="ml-2 capitalize">
                              · {order.payment_method}
                            </span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-stone-900">
                        {formatCurrency(order.total_amount)}
                      </p>
                    </div>

                    {/* Line items */}
                    {order.items && order.items.length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-stone-200 pt-2">
                        {order.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-baseline justify-between gap-2 text-xs text-stone-600"
                          >
                            <span className="min-w-0 truncate">
                              <span className="font-medium text-stone-800">
                                {item.quantity}×
                              </span>{" "}
                              {item.product_name}
                              {item.area_code && (
                                <span className="ml-1.5 rounded bg-stone-200/70 px-1 py-0.5 text-[10px] text-stone-500">
                                  {item.area_code}
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 tabular-nums">
                              {formatCurrency(item.line_total)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {isOrderPayable(order.status) && (
                      <div className="mt-3 flex justify-end border-t border-stone-200 pt-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => openPayDialog(order)}
                          className="rounded-full bg-[#F36509] text-white hover:bg-[#d95a08]"
                        >
                          <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                          Pay {formatCurrency(order.total_amount)}
                        </Button>
                      </div>
                    )}

                    {!order.items && order.item_count != null && (
                      <p className="mt-1.5 text-xs text-stone-500">
                        {order.item_count} item
                        {order.item_count !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOrdersModalSession(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Manage Locations dialog ────────────────────────────────────── */}
      <Dialog
        open={showManageLocationsDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowManageLocationsDialog(false);
            cancelLocationForm();
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Manage Locations
            </DialogTitle>
            <DialogDescription>
              Add, edit, deactivate, or remove tables, rooms, and cubicles.
              Changes apply immediately to QR session creation.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeLocationTab}
            onValueChange={(value) => {
              setActiveLocationTab(value as LocationType);
              cancelLocationForm();
            }}
            className="mt-2"
          >
            <TabsList className="grid w-full grid-cols-3 rounded-xl bg-stone-100 p-1">
              {LOCATION_TYPES.map((type) => (
                <TabsTrigger
                  key={type}
                  value={type}
                  className="rounded-lg py-2 text-stone-500 transition-all data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm"
                >
                  {LOCATION_TYPE_LABELS[type]}s
                </TabsTrigger>
              ))}
            </TabsList>

            {LOCATION_TYPES.map((type) => (
              <TabsContent key={type} value={type} className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-stone-500">
                    {locations[type].length}{" "}
                    {LOCATION_TYPE_LABELS[type].toLowerCase()}
                    {locations[type].length !== 1 ? "s" : ""} ·{" "}
                    {locations[type].filter((l) => l.is_active).length} active
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => openAddLocationForm(type)}
                    className="rounded-full bg-[#F36509] text-white hover:bg-[#d95a08]"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add {LOCATION_TYPE_LABELS[type]}
                  </Button>
                </div>

                {/* Inline add/edit form */}
                {isLocationFormOpen && activeLocationTab === type && (
                  <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/70 p-4">
                    <p className="text-sm font-medium text-stone-700">
                      {editingLocation
                        ? `Edit ${LOCATION_TYPE_LABELS[type]}`
                        : `Add ${LOCATION_TYPE_LABELS[type]}`}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-stone-600">
                          {type === "table" ? "Table number" : "Name"}
                        </Label>
                        <Input
                          value={locationForm.name}
                          onChange={(e) =>
                            setLocationForm({
                              ...locationForm,
                              name: e.target.value,
                            })
                          }
                          placeholder={
                            type === "table"
                              ? "e.g. 5"
                              : type === "room"
                                ? "e.g. Conference D"
                                : "e.g. Cubicle 5"
                          }
                          className="rounded-xl border-stone-200 bg-white focus-visible:ring-[#F36509]/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-stone-600">Seats</Label>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={locationForm.seats}
                          onChange={(e) =>
                            setLocationForm({
                              ...locationForm,
                              seats: parseInt(e.target.value) || 1,
                            })
                          }
                          className="rounded-xl border-stone-200 bg-white focus-visible:ring-[#F36509]/30"
                        />
                      </div>
                      {type === "table" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-stone-600">Zone</Label>
                          <Select
                            value={locationForm.zone}
                            onValueChange={(v) => {
                              if (v) {
                                setLocationForm({
                                  ...locationForm,
                                  zone: v as "bistro" | "coworking",
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="rounded-xl border-stone-200 bg-white focus:ring-[#F36509]/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="bistro">Bistro</SelectItem>
                              <SelectItem value="coworking">
                                Coworking
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {type !== "table" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-stone-600">
                            Description{" "}
                            <span className="font-normal text-stone-400">
                              (optional)
                            </span>
                          </Label>
                          <Input
                            value={locationForm.description}
                            onChange={(e) =>
                              setLocationForm({
                                ...locationForm,
                                description: e.target.value,
                              })
                            }
                            placeholder="e.g. Projector, whiteboard"
                            className="rounded-xl border-stone-200 bg-white focus-visible:ring-[#F36509]/30"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveLocation}
                        disabled={isSavingLocation || !locationForm.name.trim()}
                        className="rounded-full bg-[#F36509] text-white hover:bg-[#d95a08]"
                      >
                        {isSavingLocation
                          ? "Saving..."
                          : editingLocation
                            ? "Save changes"
                            : `Add ${LOCATION_TYPE_LABELS[type]}`}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={cancelLocationForm}
                        disabled={isSavingLocation}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* List */}
                {isLoadingLocations && activeLocationTab === type ? (
                  <div className="flex items-center gap-2 py-6 text-sm text-stone-500">
                    <RefreshCw className="h-4 w-4 animate-spin text-[#F36509]" />
                    Loading {LOCATION_TYPE_LABELS[type].toLowerCase()}s...
                  </div>
                ) : locations[type].length === 0 ? (
                  <div className="rounded-xl border border-dashed border-stone-300 py-8 text-center">
                    <Armchair className="mx-auto mb-2 h-6 w-6 text-stone-300" />
                    <p className="text-sm text-stone-500">
                      No {LOCATION_TYPE_LABELS[type].toLowerCase()}s yet. Add
                      one to get started.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {locations[type].map((location) => (
                      <div
                        key={location.id}
                        className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-stone-900">
                              {getLocationLabel(type, location.name)}
                            </p>
                            {!location.is_active && (
                              <Badge
                                variant="outline"
                                className="border-stone-200 bg-stone-100 text-stone-500"
                              >
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
                            <span className="flex items-center gap-1">
                              <Armchair className="h-3 w-3 text-stone-400" />
                              {location.seats} seats
                            </span>
                            {location.zone && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-stone-400" />
                                {location.zone}
                              </span>
                            )}
                            {location.description && (
                              <span className="truncate">
                                {location.description}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={location.is_active}
                              onCheckedChange={() =>
                                handleToggleLocation(location)
                              }
                              disabled={togglingLocationId === location.id}
                              className="data-[state=checked]:bg-[#F36509]"
                            />
                            <span className="text-xs text-stone-500">
                              {togglingLocationId === location.id
                                ? "Updating..."
                                : location.is_active
                                  ? "Active"
                                  : "Inactive"}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditLocationForm(location)}
                            className="h-7 rounded-full px-2.5 text-xs text-stone-600 hover:bg-stone-100"
                          >
                            <Pencil className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLocation(location)}
                            disabled={removingLocationId === location.id}
                            className="h-7 rounded-full px-2.5 text-xs text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            {removingLocationId === location.id
                              ? "Removing..."
                              : "Remove"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowManageLocationsDialog(false);
                cancelLocationForm();
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Pay order dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={!!payOrder}
        onOpenChange={(open) => {
          if (!open) {
            setPayOrder(null);
            setAmountTendered("");
          }
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Take Payment
            </DialogTitle>
            <DialogDescription>
              {payOrder && (
                <>
                  Order #{payOrder.id.slice(0, 8)} ·{" "}
                  <span className="font-semibold text-stone-900">
                    {formatCurrency(payOrder.total_amount)}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {payOrder && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-stone-700">
                  Payment method
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "cash" as const, label: "Cash", icon: Banknote },
                      { id: "card" as const, label: "Card", icon: CreditCard },
                      {
                        id: "gcash" as const,
                        label: "GCash",
                        icon: CreditCard,
                      },
                      { id: "maya" as const, label: "Maya", icon: CreditCard },
                    ] as const
                  ).map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(id);
                        if (id !== "cash") setAmountTendered("");
                      }}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                        paymentMethod === id
                          ? "border-[#F36509] bg-[#F36509]/10 text-[#F36509]"
                          : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "cash" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="tendered"
                    className="text-sm font-medium text-stone-700"
                  >
                    Amount tendered
                  </Label>
                  <Input
                    id="tendered"
                    type="number"
                    min={0}
                    step="0.01"
                    inputMode="decimal"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    placeholder="0.00"
                    className="h-11 rounded-xl border-stone-200"
                    autoFocus
                  />
                  <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm">
                    <span className="text-stone-500">Change</span>
                    <span className="font-semibold text-stone-900">
                      {formatCurrency(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {payOrder.items && payOrder.items.length > 0 && (
                <div className="max-h-28 space-y-1 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-xs text-stone-600">
                  {payOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-2">
                      <span className="truncate">
                        {item.quantity}× {item.product_name}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {formatCurrency(item.line_total)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPayOrder(null)}
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canConfirmPayment}
              onClick={handleConfirmPayment}
              className="bg-[#F36509] text-white hover:bg-[#d95a08]"
            >
              {isProcessingPayment
                ? "Processing…"
                : payOrder
                  ? `Confirm ${formatCurrency(payOrder.total_amount)}`
                  : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
