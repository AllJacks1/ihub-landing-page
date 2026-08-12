"use client";

import { format, parseISO } from "date-fns";
import {
  Armchair,
  Calendar,
  Clock,
  Mail,
  MapPin,
  Phone,
  StickyNote,
  User,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Table = {
  id: string;
  table_number: string;
  seats: number;
  zone: "bistro" | "coworking";
  is_active: boolean;
};

type Room = {
  id: string;
  name: string;
  seats: number;
  description: string | null;
  is_active: boolean;
};

export type FloorReservation = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  pax: number;
  zone: "bistro" | "study" | "room";
  start_at: string;
  end_at: string;
  status: string;
  notes: string | null;
  assigned_tables: Table[];
  assigned_rooms: Room[];
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  seated: "bg-sky-50 text-sky-700 border-sky-200",
  completed: "bg-stone-100 text-stone-600 border-stone-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  no_show: "bg-orange-50 text-[#c2410c] border-orange-200",
};

const zoneLabel: Record<string, string> = {
  bistro: "Bistro",
  study: "Study Zone",
  room: "Private Room",
  coworking: "Coworking",
};

interface Props {
  reservation: FloorReservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FloorReservationViewDialog({
  reservation,
  open,
  onOpenChange,
}: Props) {
  if (!reservation) return null;

  const start = parseISO(reservation.start_at);
  const end = parseISO(reservation.end_at);
  const hasAssignment =
    reservation.assigned_tables.length > 0 ||
    reservation.assigned_rooms.length > 0;

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
                statusStyles[reservation.status] ??
                  "border-stone-200 text-stone-600",
              )}
            >
              {reservation.status.replace("_", " ")}
            </Badge>
          </div>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
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
                  {zoneLabel[reservation.zone] ?? reservation.zone}
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

          {/* Assignments */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Assignment
            </p>
            {!hasAssignment ? (
              <p className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-500">
                No table or room assigned yet
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {reservation.assigned_tables.map((t) => (
                  <div
                    key={t.id}
                    className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700"
                  >
                    <Armchair className="size-3.5 text-[#F36509]" />
                    Table {t.table_number}
                    <span className="text-stone-400">
                      · {t.seats} seats · {zoneLabel[t.zone] ?? t.zone}
                    </span>
                  </div>
                ))}
                {reservation.assigned_rooms.map((r) => (
                  <div
                    key={r.id}
                    className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700"
                  >
                    <MapPin className="size-3.5 text-[#F36509]" />
                    {r.name}
                    <span className="text-stone-400">· {r.seats} seats</span>
                  </div>
                ))}
              </div>
            )}
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
        </div>

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
      </DialogContent>
    </Dialog>
  );
}
