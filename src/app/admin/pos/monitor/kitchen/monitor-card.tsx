"use client";

import { useEffect, useState, useTransition } from "react";
import { updateMonitorPrepStatus } from "@/lib/monitor-actions";
import { type MonitorCard, type PreparationStatus } from "@/lib/monitor-types";
import { Clock, CheckCircle2, ChefHat, Coffee, AlertCircle } from "lucide-react";

interface MonitorCardProps {
  card: MonitorCard;
  station: "kitchen" | "bar";
}

interface MonitorCardProps {
  card: MonitorCard;
  station: "kitchen" | "bar";
}

const statusConfig: Record<
  PreparationStatus,
  { label: string; color: string; bg: string; next?: PreparationStatus; actionLabel?: string }
> = {
  new: {
    label: "New",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    next: "preparing",
    actionLabel: "Start Preparing",
  },
  preparing: {
    label: "Preparing",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    next: "ready",
    actionLabel: "Mark Ready",
  },
  ready: {
    label: "Ready",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    next: "completed",
    actionLabel: "Mark Completed",
  },
  completed: {
    label: "Completed",
    color: "text-stone-700",
    bg: "bg-stone-50 border-stone-200",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
  },
};

function formatElapsed(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export default function MonitorCardComponent({ card, station }: MonitorCardProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<PreparationStatus>(card.item.preparationStatus);
  const [elapsed, setElapsed] = useState(card.item.elapsedSeconds || 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((e: number) => e + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const config = statusConfig[status];
  const canUpdate = status !== "completed" && status !== "cancelled" && config.next;

  const handleUpdate = () => {
    if (!canUpdate || !config.next) return;
    setError(null);
    startTransition(async () => {
      const result = await updateMonitorPrepStatus({
        orderId: card.item.orderId,
        itemId: card.item.itemId,
        preparationStatus: config.next!,
        station,
      });
      if (result.success) {
        setStatus(config.next!);
      } else {
        setError(result.error || "Failed to update status");
      }
    });
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F36509]/10">
            {station === "kitchen" ? (
              <ChefHat className="h-5 w-5 text-[#F36509]" />
            ) : (
              <Coffee className="h-5 w-5 text-[#F36509]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-stone-900">#{card.orderNumber}</p>
              {card.item.isNew && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                  New
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <Clock className="h-3 w-3" />
              <span>{formatElapsed(elapsed)}</span>
              <span>•</span>
              <span className="uppercase">{card.item.orderSource}</span>
            </div>
          </div>
        </div>
        <div className={`rounded-full border px-3 py-1 text-xs font-medium ${config.bg} ${config.color}`}>
          {config.label}
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-lg font-medium text-stone-900">
              {card.item.quantity}x {card.item.productName}
            </p>
            {card.item.specialInstructions && (
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>{card.item.specialInstructions}</p>
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-stone-700">₱{card.item.lineTotal.toFixed(2)}</p>
        </div>
      </div>

      {canUpdate && (
        <div className="border-t border-stone-100 px-5 py-3">
          <button
            onClick={handleUpdate}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#F36509] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#d95a08] disabled:opacity-50"
          >
            {isPending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {config.actionLabel}
          </button>
          {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
