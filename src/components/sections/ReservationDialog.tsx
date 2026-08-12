"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  Clock,
  Mail,
  MapPin,
  Phone,
  StickyNote,
  User,
  Users,
  Check,
  X,
  Armchair,
  CircleCheck,
  UserX,
  Ban,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { updateReservationStatus } from "@/lib/actions";

/* ── types ── */
export type Zone = "bistro" | "study" | "room";
export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Reservation {
  id: string;
  profile_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  pax: number;
  zone: Zone;
  start_at: string;
  end_at: string;
  status: ReservationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusStyles: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  seated: {
    label: "Seated",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  completed: {
    label: "Completed",
    className: "bg-stone-100 text-stone-600 border-stone-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  no_show: {
    label: "No Show",
    className: "bg-orange-50 text-[#c2410c] border-orange-200",
  },
};

const zoneLabel = (z: Zone) =>
  ({ bistro: "Bistro", study: "Study Zone", room: "Private Room" })[z];

/** Allowed next statuses from the current one */
function nextActions(
  status: ReservationStatus,
): {
  status: ReservationStatus;
  label: string;
  icon: React.ElementType;
  variant: "default" | "outline" | "destructive" | "secondary";
}[] {
  switch (status) {
    case "pending":
      return [
        {
          status: "confirmed",
          label: "Approve",
          icon: Check,
          variant: "default",
        },
        {
          status: "cancelled",
          label: "Reject",
          icon: X,
          variant: "destructive",
        },
      ];
    case "confirmed":
      return [
        {
          status: "seated",
          label: "Mark seated",
          icon: Armchair,
          variant: "default",
        },
        {
          status: "no_show",
          label: "No show",
          icon: UserX,
          variant: "outline",
        },
        {
          status: "cancelled",
          label: "Cancel",
          icon: Ban,
          variant: "destructive",
        },
      ];
    case "seated":
      return [
        {
          status: "completed",
          label: "Close / Complete",
          icon: CircleCheck,
          variant: "default",
        },
        {
          status: "cancelled",
          label: "Cancel",
          icon: Ban,
          variant: "destructive",
        },
      ];
    case "completed":
    case "cancelled":
    case "no_show":
      return [];
    default:
      return [];
  }
}

interface ReservationDetailsDialogProps {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (updated: Reservation) => void;
}

export function ReservationDetailsDialog({
  reservation,
  open,
  onOpenChange,
  onUpdated,
}: ReservationDetailsDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<ReservationStatus | null>(
    null,
  );

  if (!reservation) return null;

  const start = parseISO(reservation.start_at);
  const end = parseISO(reservation.end_at);
  const actions = nextActions(reservation.status);

  const handleStatusChange = (next: ReservationStatus) => {
    setPendingStatus(next);
    startTransition(async () => {
      try {
        const result = await updateReservationStatus(reservation.id, next);
        if (result?.success === false) {
          toast.error(result.message || "Failed to update status");
          return;
        }
        const updated: Reservation = {
          ...reservation,
          status: next,
          updated_at: new Date().toISOString(),
        };
        onUpdated?.(updated);
        toast.success(`Marked as ${statusStyles[next].label}`);
        // Keep dialog open so staff can see the new state / further actions
      } catch {
        toast.error("Failed to update status");
      } finally {
        setPendingStatus(null);
      }
    });
  };

  const plainNotes = reservation.notes
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-stone-100 px-6 py-5 text-left">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="font-serif text-xl font-semibold text-stone-900">
                {reservation.full_name}
              </DialogTitle>
              <DialogDescription className="mt-1 text-stone-500">
                Reservation details
              </DialogDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 font-medium capitalize",
                statusStyles[reservation.status].className,
              )}
            >
              {statusStyles[reservation.status].label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {/* Contact */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Guest
            </p>
            <div className="flex items-center gap-2 text-sm text-stone-700">
              <User className="size-4 shrink-0 text-stone-400" />
              {reservation.full_name}
            </div>
            <div className="flex items-center gap-2 text-sm text-stone-700">
              <Mail className="size-4 shrink-0 text-stone-400" />
              <a
                href={`mailto:${reservation.email}`}
                className="text-[#F36509] hover:underline"
              >
                {reservation.email}
              </a>
            </div>
            {reservation.phone && (
              <div className="flex items-center gap-2 text-sm text-stone-700">
                <Phone className="size-4 shrink-0 text-stone-400" />
                <a
                  href={`tel:${reservation.phone}`}
                  className="text-[#F36509] hover:underline"
                >
                  {reservation.phone}
                </a>
              </div>
            )}
          </div>

          {/* Booking */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Booking
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-stone-500">
                  <Calendar className="size-3.5" />
                  Date
                </div>
                <p className="text-sm font-medium text-stone-900">
                  {format(start, "EEE, MMM d, yyyy")}
                </p>
              </div>
              <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-stone-500">
                  <Clock className="size-3.5" />
                  Time
                </div>
                <p className="text-sm font-medium text-stone-900">
                  {format(start, "h:mm a")} – {format(end, "h:mm a")}
                </p>
              </div>
              <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-stone-500">
                  <MapPin className="size-3.5" />
                  Zone
                </div>
                <p className="text-sm font-medium text-stone-900">
                  {zoneLabel(reservation.zone)}
                </p>
              </div>
              <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-stone-500">
                  <Users className="size-3.5" />
                  Guests
                </div>
                <p className="text-sm font-medium text-stone-900">
                  {reservation.pax} pax
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {reservation.notes && (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Notes
              </p>
              {/<[a-z][\s\S]*>/i.test(reservation.notes) ? (
                <div
                  className="prose prose-sm prose-stone max-w-none rounded-xl border border-stone-100 bg-stone-50 p-4 text-stone-700"
                  dangerouslySetInnerHTML={{ __html: reservation.notes }}
                />
              ) : (
                <div className="flex gap-2 rounded-xl border border-stone-100 bg-stone-50 p-4 text-sm text-stone-700">
                  <StickyNote className="mt-0.5 size-4 shrink-0 text-stone-400" />
                  <p>{plainNotes}</p>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-stone-400">
            Created{" "}
            {format(parseISO(reservation.created_at), "MMM d, yyyy · h:mm a")}
          </p>
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <DialogFooter className="flex-col gap-2 border-t border-stone-100 bg-stone-50/80 px-6 py-4 sm:flex-row sm:justify-end">
            {actions.map((action) => {
              const Icon = action.icon;
              const loading = isPending && pendingStatus === action.status;
              return (
                <Button
                  key={action.status}
                  type="button"
                  variant={action.variant}
                  disabled={isPending}
                  onClick={() => handleStatusChange(action.status)}
                  className={cn(
                    "w-full sm:w-auto",
                    action.variant === "default" &&
                      "bg-[#F36509] text-white hover:bg-[#e05a00]",
                  )}
                >
                  {loading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Icon className="mr-2 size-4" />
                  )}
                  {action.label}
                </Button>
              );
            })}
          </DialogFooter>
        )}

        {actions.length === 0 && (
          <DialogFooter className="border-t border-stone-100 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="w-full border-stone-200 sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
