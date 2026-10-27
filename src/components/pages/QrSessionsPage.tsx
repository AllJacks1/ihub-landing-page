"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  Banknote,
  CreditCard,
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
import {
  recordPayment,
  completeOrder,
  updateOrderItemDiscount,
  updatePosOrder,
  SessionOrder,
} from "@/lib/order-actions";
import { ensureTerminalContext } from "@/lib/pos-actions";
import {
  createCrmUser,
  CrmUser,
  isIaccessMember as checkIsIaccessMember,
  getCurrentUser,
} from "@/lib/actions";
import { addPoints } from "@/app/actions/points";

type QrSessionsReturn = ReturnType<typeof useQrSessions>;

type QrSessionsPageProps = QrSessionsReturn & {
  getSessionStatusBadge: (status: string) => ReactNode;
  /** Map of session.id → orders for that session. Populate from the hook. */
  sessionOrders?: Record<string, SessionOrder[]>;
  /** Loading state while fetching orders for a specific session */
  isLoadingSessionOrders?: boolean;
  /** Optional: call this when the user opens the orders modal for a session */
  onLoadSessionOrders?: (sessionId: string) => void;
  /** Optional: initial / live CRM user list for payment dialog search */
  crmUsersList?: CrmUser[];
  /** Optional: trigger a CRM search/load when the query changes */
  onSearchCrmUsers?: (query: string) => void;
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
      // Less than 2 hours remaining is treated as urgent
      urgent: hours < 2,
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

/** Senior Citizen & PWD discount (equal-share estimate).
 *  20% discount on each eligible guest's share; if VAT is included in the bill,
 *  VAT is stripped from that share before applying the 20%.
 */
function computeScPwdDiscount(params: {
  totalBill: number;
  seniors: number;
  pwds: number;
  otherGuests: number;
  vatIncluded: boolean;
}) {
  const { totalBill, seniors, pwds, otherGuests, vatIncluded } = params;
  const totalGuests = seniors + pwds + otherGuests;
  const eligibleGuests = seniors + pwds;

  if (
    !Number.isFinite(totalBill) ||
    totalBill < 0 ||
    totalGuests <= 0 ||
    ![seniors, pwds, otherGuests].every((n) => Number.isInteger(n) && n >= 0)
  ) {
    return {
      valid: false,
      totalGuests: 0,
      eligibleGuests: 0,
      sharePerGuest: 0,
      totalSavings: 0,
      amountDue: totalBill,
    };
  }

  const sharePerGuest = totalBill / totalGuests;
  const discountedShare = vatIncluded
    ? (sharePerGuest / 1.12) * 0.8
    : sharePerGuest * 0.8;
  const totalSavings = eligibleGuests * (sharePerGuest - discountedShare);
  const amountDue = Math.max(0, Math.round(totalBill - totalSavings));

  return {
    valid: true,
    totalGuests,
    eligibleGuests,
    sharePerGuest: Math.round(sharePerGuest),
    totalSavings: Math.round(totalSavings),
    amountDue,
  };
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

  crmUsersList,
  onSearchCrmUsers,
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

  const [cashierFullname, setCashierFullname] = useState("");

  // Senior Citizen / PWD discount (payment dialog)
  const [seniorCount, setSeniorCount] = useState(0);
  const [pwdCount, setPwdCount] = useState(0);
  const [otherGuestCount, setOtherGuestCount] = useState(1);
  const [discountVatIncluded, setDiscountVatIncluded] = useState(true);

  const [terminalId, setTerminalId] = useState<string | null>(null);
  const [shiftId, setShiftId] = useState<string | null>(null);

  // Bootstrap terminal + open shift so payments can be recorded against them.
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const user = await getCurrentUser();
        if (cancelled) return;
        setCashierFullname(user?.full_name ?? "Unknown Cashier");

        const ctx = await ensureTerminalContext();
        if (cancelled) return;

        if (!ctx.success || !ctx.data) {
          console.error(ctx.error ?? "Terminal context unavailable");
          return;
        }

        setTerminalId(ctx.data.terminal.id);
        setShiftId(ctx.data.shift.id);
      } catch (e) {
        console.error("Failed to initialise terminal context", e);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const [localCrmUsers, setLocalCrmUsers] = useState<CrmUser[]>([]);
  const crmUsers = useMemo(() => {
    const map = new Map<string, CrmUser>();
    for (const u of crmUsersList ?? []) map.set(u.userId, u);
    for (const u of localCrmUsers) map.set(u.userId, u);
    return Array.from(map.values());
  }, [crmUsersList, localCrmUsers]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );

  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    first_name: "",
    birthday: "",
    contact_number: "",
    email: "",
  });
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const [isIaccessMemberFlag, setIsIaccessMemberFlag] = useState(false);
  const [checkingIaccess, setCheckingIaccess] = useState(false);

  // Notify parent of search so it can load remote CRM users.
  useEffect(() => {
    onSearchCrmUsers?.(customerSearch.trim());
  }, [customerSearch, onSearchCrmUsers]);

  const discountResult = useMemo(() => {
    const items = payOrder?.items ?? [];

    let eligibleSubtotal = 0;
    let nonEligibleSubtotal = 0;
    let originalServiceCharge = 0;

    for (const item of items) {
      const lineAmount =
        (Number(item.unit_price) || 0) * (Number(item.quantity) || 0);
      const sc = Number(item.service_charge) || 0;

      originalServiceCharge += sc;

      if (item.area_code === "ieat" || item.area_code === "idrink") {
        eligibleSubtotal += lineAmount;
      } else {
        nonEligibleSubtotal += lineAmount;
      }
    }

    const scPwd = computeScPwdDiscount({
      totalBill: eligibleSubtotal,
      seniors: seniorCount,
      pwds: pwdCount,
      otherGuests: otherGuestCount,
      vatIncluded: discountVatIncluded,
    });

    const hasScPwdGuests = seniorCount > 0 || pwdCount > 0;
    const hasScPwdDiscount =
      hasScPwdGuests && scPwd.valid && scPwd.eligibleGuests > 0;

    // Step 1: Apply Senior/PWD first.
    const scPwdSavings = hasScPwdDiscount
      ? Math.round(eligibleSubtotal - scPwd.amountDue)
      : 0;

    const afterScPwd = hasScPwdDiscount ? scPwd.amountDue : eligibleSubtotal;

    // Step 2: Apply iAccess 10% to the remaining eligible amount.
    const iaccessDiscountRate = isIaccessMemberFlag ? 0.1 : 0;

    const iaccessSavings = Math.round(afterScPwd * iaccessDiscountRate);

    const discountedEligibleSubtotal = Math.max(0, afterScPwd - iaccessSavings);

    // Combined discount factor for order items and service charge.
    const discountFactor =
      eligibleSubtotal > 0 ? discountedEligibleSubtotal / eligibleSubtotal : 1;

    const totalSavings = scPwdSavings + iaccessSavings;

    const scRate =
      payOrder?.service_charge_rate != null
        ? Number(payOrder.service_charge_rate) / 100
        : null;

    let recalculatedServiceCharge = 0;

    for (const item of items) {
      const lineAmount =
        (Number(item.unit_price) || 0) * (Number(item.quantity) || 0);
      const originalSc = Number(item.service_charge) || 0;

      const isEligible =
        item.area_code === "ieat" || item.area_code === "idrink";

      if (isEligible && (hasScPwdDiscount || iaccessDiscountRate > 0)) {
        if (scRate != null) {
          recalculatedServiceCharge += lineAmount * discountFactor * scRate;
        } else {
          recalculatedServiceCharge += originalSc * discountFactor;
        }
      } else {
        recalculatedServiceCharge += originalSc;
      }
    }

    recalculatedServiceCharge = Math.ceil(recalculatedServiceCharge);

    const hasAnyDiscount = hasScPwdDiscount || iaccessDiscountRate > 0;

    const amountDue = hasAnyDiscount
      ? Math.max(
          0,
          discountedEligibleSubtotal +
            nonEligibleSubtotal +
            recalculatedServiceCharge,
        )
      : Number(payOrder?.total_amount) ||
        eligibleSubtotal + nonEligibleSubtotal + recalculatedServiceCharge;

    return {
      ...scPwd,
      amountDue,
      eligibleSubtotal,
      nonEligibleSubtotal,
      originalServiceCharge,
      recalculatedServiceCharge: hasAnyDiscount
        ? recalculatedServiceCharge
        : Number(payOrder?.service_charge) || recalculatedServiceCharge,
      discountFactor,
      totalSavings,
      scPwdSavings,
      iaccessSavings,
      iaccessDiscountRate,
      hasScPwdDiscount,
      hasAnyDiscount,
    };
  }, [
    payOrder,
    seniorCount,
    pwdCount,
    otherGuestCount,
    discountVatIncluded,
    isIaccessMemberFlag,
  ]);

  const amountDue = discountResult.amountDue;

  const changeDue = useMemo(() => {
    if (!payOrder || paymentMethod !== "cash") return 0;
    const tendered = parseFloat(amountTendered) || 0;
    return Math.max(0, tendered - amountDue);
  }, [payOrder, paymentMethod, amountTendered, amountDue]);

  const canConfirmPayment = useMemo(() => {
    if (!payOrder || isProcessingPayment) return false;
    if (!discountResult.valid && (seniorCount > 0 || pwdCount > 0))
      return false;
    if (paymentMethod === "cash") {
      return (parseFloat(amountTendered) || 0) >= amountDue;
    }
    return true;
  }, [
    payOrder,
    isProcessingPayment,
    paymentMethod,
    amountTendered,
    amountDue,
    discountResult.valid,
    seniorCount,
    pwdCount,
  ]);

  function openPayDialog(order: SessionOrder) {
    setPayOrder(order);
    setPaymentMethod("cash");
    setAmountTendered("");
    setSeniorCount(0);
    setPwdCount(0);
    setOtherGuestCount(1);
    setDiscountVatIncluded(true);
    setSelectedCustomerId(null);
    setCustomerSearch("");
    setIsIaccessMemberFlag(false);
    setCheckingIaccess(false);
  }

  function isOrderPayable(status: string) {
    const s = status.toLowerCase();
    return s !== "completed" && s !== "cancelled" && s !== "void";
  }

  async function handleConfirmPayment() {
    if (!payOrder || !canConfirmPayment || !ordersModalSession) return;

    setIsProcessingPayment(true);

    try {
      // 1. Validate the selected customer before proceeding.
      const customerId = selectedCustomerId?.trim() || null;

      if (selectedCustomerId && !customerId) {
        toast.error("Invalid customer ID. Please select the customer again.");
        return;
      }

      if (customerId) {
        // Confirm the selected customer still exists in the loaded CRM list.
        const customerExists = crmUsers.some(
          (customer) => customer.userId === customerId,
        );

        if (!customerExists) {
          toast.error(
            "Selected customer could not be verified. Please select the customer again.",
          );
          return;
        }
      }

      // 2. Require a valid order ID.
      if (!payOrder.id?.trim()) {
        toast.error("Invalid order ID. Payment cannot proceed.");
        return;
      }

      // 3. Ensure terminal context is available before updating the order.
      if (!terminalId || !shiftId) {
        toast.error("Terminal context not ready. Please try again.");
        return;
      }

      const hasDiscount = discountResult.hasAnyDiscount;
      const items = payOrder.items ?? [];

      // 4. Update the order's customer and payment context BEFORE payment.
      const orderUpdate = await updatePosOrder({
        order_id: payOrder.id,
        terminal_id: terminalId,
        shift_id: shiftId,
        client_id: customerId,
        ...(hasDiscount
          ? {
              total_amount: amountDue,
              service_charge_amount: discountResult.recalculatedServiceCharge,
            }
          : {}),
      });

      if (!orderUpdate.success) {
        toast.error(
          orderUpdate.error ??
            "Failed to update order/customer. Payment was not processed.",
        );
        return;
      }

      // ── 1. Apply SC / PWD discounts to line items ──────────────────────────
      if (hasDiscount) {
        if (!terminalId || !shiftId) {
          toast.error(
            "Terminal context not ready. Wait a moment and try again.",
          );
          return;
        }

        const reasonParts: string[] = [];
        if (discountResult.hasScPwdDiscount) {
          if (seniorCount > 0) reasonParts.push(`${seniorCount} Senior`);
          if (pwdCount > 0) reasonParts.push(`${pwdCount} PWD`);
        }

        if (discountResult.iaccessDiscountRate > 0) {
          reasonParts.push("iAccess Member 10%");
        }

        const discountReason = reasonParts.join(", ");
        const scRate =
          payOrder.service_charge_rate != null
            ? Number(payOrder.service_charge_rate) / 100
            : null;

        for (const item of items) {
          const lineAmount =
            (Number(item.unit_price) || 0) * (Number(item.quantity) || 0);
          const originalSc = Number(item.service_charge) || 0;
          const isEligible =
            item.area_code === "ieat" || item.area_code === "idrink";

          let discountAmount = Math.round(Number(item.discount_amount) || 0);
          let lineTotal =
            Number(item.line_total) || Math.max(0, lineAmount - discountAmount);
          let serviceCharge = originalSc;

          if (isEligible) {
            discountAmount = Math.round(
              lineAmount * (1 - discountResult.discountFactor),
            );

            lineTotal = Math.max(0, lineAmount - discountAmount);

            if (scRate != null) {
              serviceCharge = Math.round(lineTotal * scRate);
            } else {
              serviceCharge = Math.round(
                originalSc * discountResult.discountFactor,
              );
            }
          }

          const updateResult = await updateOrderItemDiscount({
            item_id: item.id,
            discount_amount: discountAmount,
            line_total: lineTotal,
            service_charge: serviceCharge,
            discount_reason: isEligible ? discountReason : null,
          });

          if (!updateResult.success) {
            toast.error(
              updateResult.error ?? "Failed to apply discount to item",
            );
            return;
          }
        }

        // ── 2. Force order totals to the exact amount the cashier confirmed ──
        // (recalculateOrderTotals inside updateOrderItemDiscount may differ
        //  slightly due to rounding / allocation; lock to amountDue)
        const orderUpdate = await updatePosOrder({
          order_id: payOrder.id,
          terminal_id: terminalId,
          shift_id: shiftId,
          total_amount: amountDue,
          service_charge_amount: discountResult.recalculatedServiceCharge,
          client_id: selectedCustomerId,
        });

        if (!orderUpdate.success) {
          toast.error(orderUpdate.error ?? "Failed to update order totals");
          return;
        }
      }

      // ── 3. Record payment for the (possibly discounted) amountDue ──────────
      const received =
        paymentMethod === "cash"
          ? parseFloat(amountTendered) || amountDue
          : amountDue;

      const payResult = await recordPayment({
        order_id: payOrder.id,
        payment_method: paymentMethod,
        amount: amountDue,
        received_amount: received,
      });

      if (!payResult.success) {
        toast.error(payResult.error ?? "Payment failed");
        return;
      }

      // ── 4. Complete the order ──────────────────────────────────────────────
      const completeResult = await completeOrder(payOrder.id);

      if (!completeResult.success) {
        toast.error(
          completeResult.error ??
            "Payment saved but order could not be completed",
        );
        // still refresh so payment_method shows
      } else {
        toast.success(
          paymentMethod === "cash" && changeDue > 0
            ? `Paid · Change ${formatCurrency(changeDue)}`
            : "Payment successful",
        );
      }

      if (isIaccessMemberFlag && selectedCustomerId && amountDue > 0) {
        const orderNumber = payOrder.order_number;
        const pointsResult = await addPoints({
          userId: selectedCustomerId,
          amount: amountDue,
          receiptNumber: orderNumber,
          description: `POS sale ${orderNumber}`,
          adminEmail: cashierFullname || null,
        });
        if (pointsResult.success) {
          const pts =
            (pointsResult.data as { pointsAdded?: number })?.pointsAdded ??
            amountDue / 150;
          toast.success(`iAccess: +${Number(pts).toFixed(2)} points`);
        } else {
          console.error("addPoints failed:", pointsResult.error);
          toast.message(
            pointsResult.error ?? "Payment OK, but points could not be added",
          );
        }
      }

      setPayOrder(null);
      setAmountTendered("");
      setSeniorCount(0);
      setPwdCount(0);
      setOtherGuestCount(1);
      onLoadSessionOrders?.(ordersModalSession.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setIsProcessingPayment(false);
    }
  }

  const filteredCrmUsers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return crmUsers.slice(0, 20);
    return crmUsers
      .filter(
        (u) =>
          u.firstname.toLowerCase().includes(q) ||
          (u.email ?? "").toLowerCase().includes(q) ||
          (u.contactNumber ?? "").includes(q),
      )
      .slice(0, 20);
  }, [crmUsers, customerSearch]);

  const selectedCustomer = useMemo(
    () => crmUsers.find((u) => u.userId === selectedCustomerId) ?? null,
    [crmUsers, selectedCustomerId],
  );

  async function handleCreateCustomerFromPayment() {
    if (!newCustomerForm.first_name.trim()) {
      toast.error("First name is required");
      return;
    }

    setIsSavingCustomer(true);
    try {
      const result = await createCrmUser({
        firstname: newCustomerForm.first_name.trim(),
        birthday: newCustomerForm.birthday || null,
        contactNumber: newCustomerForm.contact_number.trim() || null,
        email: newCustomerForm.email.trim() || null,
      });

      if (!result.success || !result.data) {
        toast.error(result.error ?? "Failed to create customer");
        return;
      }

      setLocalCrmUsers((prev) =>
        [...prev, result.data].sort((a, b) =>
          a.firstname.localeCompare(b.firstname),
        ),
      );
      setSelectedCustomerId(result.data.userId);
      setShowNewCustomer(false);
      setNewCustomerForm({
        first_name: "",
        birthday: "",
        contact_number: "",
        email: "",
      });
      setCustomerSearch("");
      toast.success("Customer added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create customer");
    } finally {
      setIsSavingCustomer(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function checkMember() {
      if (!selectedCustomerId) {
        setIsIaccessMemberFlag(false);
        return;
      }

      setCheckingIaccess(true);
      try {
        const res = await checkIsIaccessMember(selectedCustomerId);
        if (!cancelled) {
          setIsIaccessMemberFlag(!!(res.success && res.isMember));
        }
      } catch {
        if (!cancelled) setIsIaccessMemberFlag(false);
      } finally {
        if (!cancelled) setCheckingIaccess(false);
      }
    }

    checkMember();
    return () => {
      cancelled = true;
    };
  }, [selectedCustomerId]);

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

                    {/* VAT / service charge breakdown when present */}
                    {(order.subtotal != null ||
                      (order.tax_amount != null && order.tax_amount > 0) ||
                      (order.service_charge != null &&
                        order.service_charge > 0)) && (
                      <div className="mt-2 space-y-0.5 border-t border-stone-200 pt-2 text-xs text-stone-500">
                        {order.subtotal != null && (
                          <div className="flex justify-between gap-2">
                            <span>Subtotal</span>
                            <span className="tabular-nums">
                              {formatCurrency(order.subtotal)}
                            </span>
                          </div>
                        )}
                        {order.tax_amount != null && order.tax_amount > 0 && (
                          <div className="flex justify-between gap-2">
                            <span>
                              VAT
                              {order.vat_rate != null
                                ? ` (${order.vat_rate}%)`
                                : ""}
                            </span>
                            <span className="tabular-nums">
                              {formatCurrency(order.tax_amount)}
                            </span>
                          </div>
                        )}
                        {order.service_charge != null &&
                          order.service_charge > 0 && (
                            <div className="flex justify-between gap-2">
                              <span>
                                Service charge
                                {order.service_charge_rate != null
                                  ? ` (${order.service_charge_rate}%)`
                                  : ""}
                              </span>
                              <span className="tabular-nums">
                                {formatCurrency(order.service_charge)}
                              </span>
                            </div>
                          )}
                        <div className="flex justify-between gap-2 font-medium text-stone-800">
                          <span>Total</span>
                          <span className="tabular-nums">
                            {formatCurrency(order.total_amount)}
                          </span>
                        </div>
                      </div>
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
                    {formatCurrency(amountDue)}
                  </span>
                  {discountResult.totalSavings > 0 && (
                    <span className="ml-1 text-stone-500">
                      (was {formatCurrency(payOrder.total_amount)})
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {payOrder && (
            <div className="space-y-4 py-2">
              {/* Optional regular customer */}
              <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-stone-700">
                    Customer{" "}
                    <span className="font-normal text-stone-400">
                      (optional)
                    </span>
                  </p>
                  {!showNewCustomer && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-[#F36509]"
                      onClick={() => setShowNewCustomer(true)}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      New
                    </Button>
                  )}
                </div>

                {selectedCustomer ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-900">
                        {selectedCustomer.firstname}
                      </p>
                      <p className="truncate text-xs text-stone-500">
                        {[
                          selectedCustomer.contactNumber,
                          selectedCustomer.email,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "No contact info"}
                      </p>
                      {checkingIaccess ? (
                        <p className="mt-1.5 text-[11px] text-stone-400">
                          Checking iAccess…
                        </p>
                      ) : isIaccessMemberFlag ? (
                        <p className="mt-1.5 text-[11px] font-medium text-emerald-700">
                          iAccess member · 10% off Food &amp; Drinks
                        </p>
                      ) : selectedCustomerId ? (
                        <p className="mt-1.5 text-[11px] text-stone-400">
                          Not an iAccess member
                        </p>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-xs text-stone-500"
                      onClick={() => setSelectedCustomerId(null)}
                    >
                      Clear
                    </Button>
                  </div>
                ) : showNewCustomer ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="First name *"
                      value={newCustomerForm.first_name}
                      onChange={(e) =>
                        setNewCustomerForm((f) => ({
                          ...f,
                          first_name: e.target.value,
                        }))
                      }
                      className="h-9 rounded-lg border-stone-200"
                    />
                    <Input
                      type="date"
                      placeholder="Birthday"
                      value={newCustomerForm.birthday}
                      onChange={(e) =>
                        setNewCustomerForm((f) => ({
                          ...f,
                          birthday: e.target.value,
                        }))
                      }
                      className="h-9 rounded-lg border-stone-200"
                    />
                    <Input
                      type="tel"
                      placeholder="Contact number"
                      value={newCustomerForm.contact_number}
                      onChange={(e) =>
                        setNewCustomerForm((f) => ({
                          ...f,
                          contact_number: e.target.value,
                        }))
                      }
                      className="h-9 rounded-lg border-stone-200"
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={newCustomerForm.email}
                      onChange={(e) =>
                        setNewCustomerForm((f) => ({
                          ...f,
                          email: e.target.value,
                        }))
                      }
                      className="h-9 rounded-lg border-stone-200"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={isSavingCustomer}
                        onClick={() => {
                          setShowNewCustomer(false);
                          setNewCustomerForm({
                            first_name: "",
                            birthday: "",
                            contact_number: "",
                            email: "",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 bg-[#F36509] text-white hover:bg-[#d95a08]"
                        disabled={
                          isSavingCustomer || !newCustomerForm.first_name.trim()
                        }
                        onClick={handleCreateCustomerFromPayment}
                      >
                        {isSavingCustomer ? "Saving…" : "Add customer"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Search name, phone, or email…"
                      className="h-9 rounded-lg border-stone-200"
                    />
                    {customerSearch.trim() && (
                      <ul className="max-h-36 overflow-y-auto rounded-lg border border-stone-200">
                        {filteredCrmUsers.length === 0 ? (
                          <li className="px-3 py-2 text-xs text-stone-500">
                            No matches. Use “New” to add them.
                          </li>
                        ) : (
                          filteredCrmUsers.map((u) => (
                            <li key={u.userId}>
                              <button
                                type="button"
                                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-stone-50"
                                onClick={() => {
                                  setSelectedCustomerId(u.userId);
                                  setCustomerSearch("");
                                }}
                              >
                                <span className="font-medium text-stone-900">
                                  {u.firstname}
                                </span>
                                <span className="text-xs text-stone-500">
                                  {[u.contactNumber, u.email]
                                    .filter(Boolean)
                                    .join(" · ") || "—"}
                                </span>
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                    {!customerSearch.trim() && (
                      <p className="text-[11px] text-stone-400">
                        Leave empty for walk-in with no account, or search / add
                        a regular.
                      </p>
                    )}
                  </div>
                )}
              </div>
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

              {/* Senior Citizen / PWD discount */}
              <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-3">
                <p className="text-sm font-medium text-stone-700">
                  Senior Citizen / PWD discount
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-stone-500">Seniors</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={seniorCount}
                      onChange={(e) =>
                        setSeniorCount(
                          Math.max(0, parseInt(e.target.value) || 0),
                        )
                      }
                      className="h-9 rounded-lg border-stone-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-stone-500">PWDs</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={pwdCount}
                      onChange={(e) =>
                        setPwdCount(Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="h-9 rounded-lg border-stone-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-stone-500">Others</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={otherGuestCount}
                      onChange={(e) =>
                        setOtherGuestCount(
                          Math.max(0, parseInt(e.target.value) || 0),
                        )
                      }
                      className="h-9 rounded-lg border-stone-200"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-stone-600">
                  <input
                    type="checkbox"
                    checked={discountVatIncluded}
                    onChange={(e) => setDiscountVatIncluded(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-stone-300 text-[#F36509] focus:ring-[#F36509]"
                  />
                  Bill includes 12% VAT
                </label>
                {discountResult.valid && discountResult.eligibleGuests > 0 && (
                  <div className="space-y-0.5 border-t border-stone-100 pt-2 text-xs text-stone-500">
                    <div className="flex justify-between">
                      <span>
                        Eligible ({discountResult.eligibleGuests} of{" "}
                        {discountResult.totalGuests})
                      </span>
                      <span className="tabular-nums">
                        share {formatCurrency(discountResult.sharePerGuest)}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount &amp; VAT savings</span>
                      <span className="tabular-nums font-medium">
                        −{formatCurrency(discountResult.totalSavings)}
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-[10px] leading-4 text-stone-400">
                  Equal-share estimate. Count each person once (even if both
                  senior &amp; PWD). Actual discount depends on eligible
                  consumption.
                </p>
              </div>

              {/* Totals breakdown (VAT / service charge) */}
              <div className="space-y-1 rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm">
                {payOrder.subtotal != null && (
                  <div className="flex justify-between text-stone-500">
                    <span>Subtotal</span>
                    <span className="tabular-nums">
                      {formatCurrency(payOrder.subtotal)}
                    </span>
                  </div>
                )}
                {payOrder.tax_amount != null && payOrder.tax_amount > 0 && (
                  <div className="flex justify-between text-stone-500">
                    <span>
                      VAT
                      {payOrder.vat_rate != null
                        ? ` (${payOrder.vat_rate}%)`
                        : ""}
                    </span>
                    <span className="tabular-nums">
                      {formatCurrency(payOrder.tax_amount)}
                    </span>
                  </div>
                )}
                {/* Service charge – show recalculated when discount is applied */}
                {(payOrder.service_charge != null &&
                  payOrder.service_charge > 0) ||
                discountResult.recalculatedServiceCharge > 0 ? (
                  <div className="flex justify-between text-stone-500">
                    <span>
                      Service charge
                      {payOrder.service_charge_rate != null
                        ? ` (${payOrder.service_charge_rate}%)`
                        : ""}
                    </span>
                    <span className="tabular-nums">
                      {formatCurrency(discountResult.recalculatedServiceCharge)}
                    </span>
                  </div>
                ) : null}
                {discountResult.scPwdSavings > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>SC/PWD discount savings</span>
                    <span className="tabular-nums">
                      −{formatCurrency(discountResult.scPwdSavings)}
                    </span>
                  </div>
                )}
                {discountResult.iaccessSavings > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>iAccess member discount (10%)</span>
                    <span className="tabular-nums">
                      −{formatCurrency(discountResult.iaccessSavings)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-stone-900">
                  <span>Total due</span>
                  <span className="tabular-nums">
                    {formatCurrency(amountDue)}
                  </span>
                </div>
              </div>
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
                  ? `Confirm ${formatCurrency(amountDue)}`
                  : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
