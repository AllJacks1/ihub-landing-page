"use client";

import { useEffect, useState, useTransition } from "react";
import { updateDepartmentStatus } from "@/lib/monitor-actions";
import { type MonitorCard, type DepartmentStatus } from "@/lib/monitor-types";
import { Clock, CheckCircle2, ChefHat, Coffee, AlertCircle } from "lucide-react";

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
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<DepartmentStatus>(card.items[0]?.departmentStatus ?? "order_placed");
  const [elapsed, setElapsed] = useState(card.items[0]?.elapsedSeconds || 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e: number) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const config = statusConfig[status];
  const canUpdate = status !== "served" && !!config.next;

  const handleUpdate = () => {
    if (!canUpdate || !config.next) return;
    setError(null);
    startTransition(async () => {
      const result = await updateDepartmentStatus({
        orderId: card.items[0]?.orderId ?? card.orderId,
        station,
        newStatus: config.next as any,
      });
      if (result.success) setStatus(config.next!);
      else setError(result.error || "Failed to update status");
    });
  };

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
          {isPending ? "Updating..." : config.actionLabel}
        </button>
      )}
      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
