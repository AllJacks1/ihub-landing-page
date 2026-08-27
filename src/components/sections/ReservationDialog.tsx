"use client";

import { useState, useTransition, useEffect } from "react";
import { format, parseISO, isValid } from "date-fns";
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
import { formatInTimeZone } from "date-fns-tz";
import { updateReservationStatus } from "@/lib/updateReservationStatus";

function safeFormatUtc(isoString: string, formatStr: string): string {
  try {
    const parsed = parseISO(isoString);
    return isValid(parsed)
      ? formatInTimeZone(parsed, "UTC", formatStr)
      : "Invalid date";
  } catch {
    return "Invalid date";
  }
}

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
  ({ bistro: "Bistro", study: "Study Zone", room: "Private Room" })[z] ?? z;

function nextActions(status: ReservationStatus) {
  switch (status) {
    case "pending":
      return [
        {
          status: "confirmed" as const,
          label: "Approve",
          icon: Check,
          variant: "default" as const,
        },
        {
          status: "cancelled" as const,
          label: "Reject",
          icon: X,
          variant: "destructive" as const,
        },
      ];
    case "confirmed":
      return [
        {
          status: "seated" as const,
          label: "Mark seated",
          icon: Armchair,
          variant: "default" as const,
        },
        {
          status: "no_show" as const,
          label: "No show",
          icon: UserX,
          variant: "outline" as const,
        },
        {
          status: "cancelled" as const,
          label: "Cancel",
          icon: Ban,
          variant: "destructive" as const,
        },
      ];
    case "seated":
      return [
        {
          status: "completed" as const,
          label: "Close / Complete",
          icon: CircleCheck,
          variant: "default" as const,
        },
        {
          status: "cancelled" as const,
          label: "Cancel",
          icon: Ban,
          variant: "destructive" as const,
        },
      ];
    default:
      return [];
  }
}

function safeFormatDate(isoString: string, formatStr: string): string {
  try {
    const parsed = parseISO(isoString);
    return isValid(parsed) ? format(parsed, formatStr) : "Invalid date";
  } catch {
    return "Invalid date";
  }
}

// Friendly labels for the confirm dialog
const confirmMessages: Record<
  ReservationStatus,
  { title: string; description: string }
> = {
  confirmed: {
    title: "Approve this reservation?",
    description:
      "This will mark the booking as confirmed and automatically send a confirmation email to the guest.",
  },
  cancelled: {
    title: "Cancel this reservation?",
    description:
      "This action cannot be undone. The guest will not be notified automatically.",
  },
  seated: {
    title: "Mark as seated?",
    description: "Confirm that the guest has arrived and been seated.",
  },
  completed: {
    title: "Complete this reservation?",
    description: "Mark the booking as finished / closed.",
  },
  no_show: {
    title: "Mark as no-show?",
    description: "Confirm that the guest did not arrive for their booking.",
  },
  pending: {
    title: "Change status?",
    description: "Are you sure you want to update this reservation?",
  },
};

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
  const [currentStatus, setCurrentStatus] = useState<ReservationStatus | null>(
    reservation?.status ?? null,
  );

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusToConfirm, setStatusToConfirm] =
    useState<ReservationStatus | null>(null);

  useEffect(() => {
    setCurrentStatus(reservation?.status ?? null);
  }, [reservation]);

  if (!reservation || !currentStatus) return null;

  const actions = nextActions(currentStatus);

  // Open the confirmation dialog instead of updating immediately
  const requestStatusChange = (next: ReservationStatus) => {
    setStatusToConfirm(next);
    setConfirmOpen(true);
  };

  // Actually perform the update after user confirms
  const handleConfirmedStatusChange = () => {
    if (!statusToConfirm) return;

    const next = statusToConfirm;
    setConfirmOpen(false);
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

        setCurrentStatus(next);
        onUpdated?.(updated);
        toast.success(
          next === "confirmed"
            ? `Confirmed — email sent to ${reservation.email}`
            : `Marked as ${statusStyles[next].label}`,
        );
      } catch {
        toast.error("Failed to update status");
      } finally {
        setPendingStatus(null);
        setStatusToConfirm(null);
      }
    });
  };

  const confirmInfo = statusToConfirm ? confirmMessages[statusToConfirm] : null;

  return (
    <>
      {/* Main details dialog */}
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
                  statusStyles[currentStatus].className,
                )}
              >
                {statusStyles[currentStatus].label}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-5 px-6 py-5">
            {/* Guest */}
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
                    Date (UTC)
                  </div>
                  <p className="text-sm font-medium text-stone-900">
                    {safeFormatUtc(reservation.start_at, "EEE, MMM d, yyyy")}
                  </p>
                </div>

                <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs text-stone-500">
                    <Clock className="size-3.5" />
                    Time (UTC)
                  </div>
                  <p className="text-sm font-medium text-stone-900">
                    {safeFormatUtc(reservation.start_at, "HH:mm")} –{" "}
                    {safeFormatUtc(reservation.end_at, "HH:mm 'UTC'")}
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
                <div className="flex gap-2.5 rounded-xl border border-stone-100 bg-stone-50 p-4 text-sm text-stone-700">
                  <StickyNote className="mt-0.5 size-4 shrink-0 text-stone-400" />
                  <div
                    className="prose prose-sm prose-stone max-w-none prose-p:my-0 prose-p:leading-normal"
                    dangerouslySetInnerHTML={{ __html: reservation.notes }}
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-stone-400">
              Created{" "}
              {safeFormatDate(reservation.created_at, "MMM d, yyyy · h:mm a")}
            </p>
          </div>

          {/* Actions */}
          <DialogFooter className="flex-col gap-2 border-t border-stone-100 bg-stone-50/80 px-6 py-4 sm:flex-row sm:justify-end">
            {actions.length > 0 ? (
              actions.map((action) => {
                const Icon = action.icon;
                const loading = isPending && pendingStatus === action.status;
                return (
                  <Button
                    key={action.status}
                    type="button"
                    variant={action.variant}
                    disabled={isPending}
                    onClick={() => requestStatusChange(action.status)}
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
              })
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full border-stone-200 sm:w-auto"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">
              {confirmInfo?.title ?? "Confirm change?"}
            </DialogTitle>
            <DialogDescription className="text-stone-500">
              {confirmInfo?.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setStatusToConfirm(null);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmedStatusChange}
              disabled={isPending}
              className={cn(
                statusToConfirm === "cancelled" || statusToConfirm === "no_show"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-[#F36509] text-white hover:bg-[#e05a00]",
              )}
            >
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {statusToConfirm === "confirmed"
                ? "Approve & Send Email"
                : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
