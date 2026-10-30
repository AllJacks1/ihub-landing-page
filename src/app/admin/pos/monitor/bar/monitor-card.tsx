"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updateDepartmentStatus } from "@/lib/monitor-actions";
import { type MonitorCard, type DepartmentStatus } from "@/lib/monitor-types";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

interface MonitorCardProps {
  card: MonitorCard;
  station: "kitchen" | "bar";
}

const statusConfig: Record<
  DepartmentStatus,
  { label: string; color: string; bg: string; next?: DepartmentStatus; actionLabel?: string }
> = {
  order_placed: { label: "Order Placed", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", next: "preparing", actionLabel: "Start Preparing" },
  preparing: { label: "Preparing", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", next: "serving", actionLabel: "Mark Serving" },
  serving: { label: "Serving", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", next: "served", actionLabel: "Mark Served" },
  served: { label: "Served", color: "text-stone-700", bg: "bg-stone-50 border-stone-200" },
};

function formatElapsed(seconds: number): number {
  if (seconds < 0) seconds = 0;
  return Math.floor(seconds / 60);
}

export default function MonitorCardComponent({ card, station }: MonitorCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const initialStatus = card.items[0]?.departmentStatus ?? null;
  const [status, setStatus] = useState<DepartmentStatus | null>(initialStatus);
  const [elapsed, setElapsed] = useState(card.items[0]?.elapsedSeconds || 0);
  const [error, setError] = useState<string | null>(null);

  const orderIdRef = useRef(card.items[0]?.orderId ?? card.orderId);
  const currentOrderIdRef = useRef(card.items[0]?.orderId ?? card.orderId);
  const lastSentRef = useRef<DepartmentStatus | null>(initialStatus);
  const updatingRef = useRef(false);
  const lastAppliedRef = useRef<DepartmentStatus | null>(initialStatus);

  // Keep latest rendered order id updated every render (in effect, not during render)
  useEffect(() => {
    currentOrderIdRef.current = card.items[0]?.orderId ?? card.orderId;
  });

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e: number) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const isUninitialized = status === null;
  const effectiveStatus: DepartmentStatus = isUninitialized ? "order_placed" : (status as DepartmentStatus);
  const config = statusConfig[effectiveStatus];
  const canUpdate = isUninitialized
    ? true // NULL -> order_placed
    : (status !== "served" && !!config.next);

  const handleUpdate = () => {
    if (!canUpdate || isPending || updatingRef.current) return;
    setError(null);
    const requestOrderId = card.items[0]?.orderId ?? card.orderId;
    const toSend: DepartmentStatus = isUninitialized ? "order_placed" : (config.next as DepartmentStatus);
    updatingRef.current = true;
    const previousStatus = status;
    setStatus(toSend);
    startTransition(async () => {
      try {
        const result = await updateDepartmentStatus({
          orderId: requestOrderId,
          station,
          newStatus: toSend,
        });

        // Ignore response if order changed (check against latest rendered order id)
        const currentOrderIdNow = card.items[0]?.orderId ?? card.orderId;
        if (requestOrderId !== currentOrderIdNow || requestOrderId !== currentOrderIdRef.current) {
          return;
        }

        if (result.success) {
          lastSentRef.current = toSend;
          lastAppliedRef.current = toSend;
          setError(null);
          router.refresh();
        } else {
          setStatus(previousStatus);
          const currentOrderIdNow = card.items[0]?.orderId ?? card.orderId;
          if (requestOrderId === currentOrderIdNow && requestOrderId === currentOrderIdRef.current) {
            setError(result.error || "Failed to update status");
          }
        }
        // Do not update status on failure
      } catch (err) {
        setStatus(previousStatus);
        const currentOrderIdNow = card.items[0]?.orderId ?? card.orderId;
        if (requestOrderId === currentOrderIdNow && requestOrderId === currentOrderIdRef.current) {
          setError(err instanceof Error ? err.message : "Failed to update status");
        }
        // Otherwise ignore thrown error for a different order
      } finally {
        updatingRef.current = false;
      }
    });
  };

  useEffect(() => {
    const propStatus = card.items[0]?.departmentStatus ?? null;
    const currentOrderId = card.items[0]?.orderId ?? card.orderId;

    // Order identity changed -> reset from server props
    if (currentOrderId !== orderIdRef.current) {
      orderIdRef.current = currentOrderId;
      currentOrderIdRef.current = currentOrderId;
      lastSentRef.current = propStatus;
      lastAppliedRef.current = propStatus;
      // Defer to avoid synchronous setState in effect
      queueMicrotask(() => {
        setStatus(propStatus);
        setError(null);
      });
      return;
    }

    // Do not overwrite local state while a request is in-flight
    if (isPending || updatingRef.current) {
      return;
    }

    // Do not overwrite local status from possibly stale props; parent refresh resets component.
  }, [card.items, card.orderId, isPending, status]);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <p className="text-lg font-bold text-stone-900">ORDER #{card.orderNumber}</p>
        <p className="text-xs text-stone-500">Location: {card.items[0]?.location ?? "unavailable"}</p>
        <div className="mt-1 flex items-center justify-between text-xs text-stone-500">
          <span>Source: {card.items[0]?.orderSource ?? "pos"}</span>
          <span>Status: {config.label}</span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-xs text-stone-500">
          <Clock className="h-3 w-3" />
          <span>{formatElapsed(elapsed)}m</span>
        </div>
      </div>

      <div className="border-t border-stone-200 pt-2">
        <div className="flex justify-between text-xs font-semibold text-stone-600">
          <span>Product</span>
          <span>Quantity</span>
        </div>
        {card.items.map((it) => (
          <div key={it.itemId} className="flex justify-between text-sm text-stone-800">
            <span>{it.productName}</span>
            <span>{it.quantity}×</span>
          </div>
        ))}
      </div>

      {canUpdate && (
        <button
          onClick={handleUpdate}
          disabled={isPending}
          className="mt-3 w-full rounded-lg bg-[#F36509] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#d95a08] disabled:opacity-50"
        >
          {isPending ? "Processing..." : config.actionLabel}
        </button>
      )}
      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
    </div>

  );
}

