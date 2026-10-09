"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  Mail,
  MapPin,
  Phone,
  Search,
  User,
  Users,
  ShoppingCart,
  RefreshCw,
} from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getReservations } from "@/lib/actions";
import {
  Reservation,
  ReservationStatus,
} from "@/components/sections/ReservationDialog";

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
  rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  no_show: {
    label: "No Show",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
};

const zoneLabels = {
  bistro: "Bistro",
  study: "Study Zone",
  room: "Private Room",
} as const;

export default function ReservationTerminalPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchReservations = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await getReservations();

      if (result.success) {
        setReservations(result.data);
      } else {
        toast.error(result.error || "Failed to load reservations");
      }
    } catch {
      toast.error("Failed to load reservations");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const availableReservations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return reservations
      .filter(
        (reservation) =>
          reservation.status === "confirmed" ||
          reservation.status === "seated",
      )
      .filter((reservation) => {
        if (!query) return true;

        return (
          reservation.full_name.toLowerCase().includes(query) ||
          reservation.email.toLowerCase().includes(query) ||
          reservation.phone?.toLowerCase().includes(query)
        );
      })
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() -
          new Date(b.start_at).getTime(),
      );
  }, [reservations, searchQuery]);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F36509]">
              POS / Terminal
            </p>

            <h1 className="mt-1 font-serif text-2xl font-semibold text-stone-900">
              Reservation Terminal
            </h1>

            <p className="mt-1 text-sm text-stone-500">
              Process sales connected to an existing reservation.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={fetchReservations}
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

      {/* Main content */}
      <div className="grid min-h-0 flex-1 xl:grid-cols-[1fr_420px]">
        {/* Reservations */}
        <section className="min-w-0 overflow-y-auto p-6">
          <div className="mx-auto max-w-5xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />

              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search guest name, email, or phone..."
                className="h-12 rounded-xl border-stone-200 bg-white pl-11"
              />
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">
                  Available Reservations
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Confirmed and seated reservations can be used for a POS order.
                </p>
              </div>

              <span className="text-xs text-stone-400">
                {availableReservations.length} available
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {isLoading ? (
                <Card className="border-stone-200 bg-white">
                  <CardContent className="flex items-center justify-center py-16">
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin text-[#F36509]" />
                    <span className="text-sm text-stone-500">
                      Loading reservations...
                    </span>
                  </CardContent>
                </Card>
              ) : availableReservations.length === 0 ? (
                <Card className="border-stone-200 bg-white">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-full bg-stone-100 p-4">
                      <Calendar className="h-6 w-6 text-stone-400" />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-stone-900">
                      No available reservations
                    </h3>

                    <p className="mt-1 max-w-sm text-sm text-stone-500">
                      Only confirmed or seated reservations are shown here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                availableReservations.map((reservation) => {
                  const selected =
                    selectedReservation?.id === reservation.id;

                  return (
                    <button
                      key={reservation.id}
                      type="button"
                      onClick={() => setSelectedReservation(reservation)}
                      className="block w-full text-left"
                    >
                      <Card
                        className={`border transition-all ${
                          selected
                            ? "border-[#F36509]/50 bg-[#F36509]/5 shadow-sm"
                            : "border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm"
                        }`}
                      >
                        <CardContent className="p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex min-w-0 items-start gap-4">
                              <div
                                className={`rounded-xl p-3 ${
                                  selected
                                    ? "bg-[#F36509]/10"
                                    : "bg-stone-100"
                                }`}
                              >
                                <User
                                  className={`h-5 w-5 ${
                                    selected
                                      ? "text-[#F36509]"
                                      : "text-stone-500"
                                  }`}
                                />
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-semibold text-stone-900">
                                    {reservation.full_name}
                                  </h3>

                                  <Badge
                                    variant="outline"
                                    className={
                                      statusStyles[reservation.status]
                                        .className
                                    }
                                  >
                                    {
                                      statusStyles[reservation.status]
                                        .label
                                    }
                                  </Badge>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatInTimeZone(
                                      parseISO(reservation.start_at),
                                      "UTC",
                                      "MMM d, yyyy",
                                    )}
                                  </span>

                                  <span className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatInTimeZone(
                                      parseISO(reservation.start_at),
                                      "UTC",
                                      "h:mm a",
                                    )}
                                  </span>

                                  <span className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5" />
                                    {reservation.pax} pax
                                  </span>

                                  <span className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {zoneLabels[reservation.zone]}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 text-xs text-stone-400 lg:text-right">
                              Select to continue
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Selected reservation */}
        <aside className="border-t border-stone-200 bg-white xl:border-t-0 xl:border-l">
          {selectedReservation ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-stone-100 px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#F36509]">
                  Selected Reservation
                </p>

                <h2 className="mt-1 text-xl font-semibold text-stone-900">
                  {selectedReservation.full_name}
                </h2>

                <div className="mt-2">
                  <Badge
                    variant="outline"
                    className={
                      statusStyles[selectedReservation.status].className
                    }
                  >
                    {statusStyles[selectedReservation.status].label}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                      Guest
                    </p>

                    <div className="mt-3 space-y-2.5">
                      <div className="flex gap-2.5 text-sm text-stone-700">
                        <User className="h-4 w-4 shrink-0 text-stone-400" />
                        {selectedReservation.full_name}
                      </div>

                      <div className="flex gap-2.5 text-sm text-stone-700">
                        <Mail className="h-4 w-4 shrink-0 text-stone-400" />
                        <span className="break-all">
                          {selectedReservation.email}
                        </span>
                      </div>

                      {selectedReservation.phone && (
                        <div className="flex gap-2.5 text-sm text-stone-700">
                          <Phone className="h-4 w-4 shrink-0 text-stone-400" />
                          {selectedReservation.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                      Reservation
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <InfoBox
                        label="Date"
                        value={formatInTimeZone(
                          parseISO(selectedReservation.start_at),
                          "UTC",
                          "MMM d, yyyy",
                        )}
                        icon={Calendar}
                      />

                      <InfoBox
                        label="Time"
                        value={formatInTimeZone(
                          parseISO(selectedReservation.start_at),
                          "UTC",
                          "h:mm a",
                        )}
                        icon={Clock}
                      />

                      <InfoBox
                        label="Zone"
                        value={zoneLabels[selectedReservation.zone]}
                        icon={MapPin}
                      />

                      <InfoBox
                        label="Guests"
                        value={`${selectedReservation.pax} pax`}
                        icon={Users}
                      />
                    </div>
                  </div>

                  {selectedReservation.notes && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                        Notes
                      </p>

                      <div className="mt-3 rounded-xl bg-stone-50 p-4 text-sm leading-6 text-stone-600">
                        {selectedReservation.notes
                          .replace(/<[^>]*>/g, " ")
                          .replace(/\s+/g, " ")
                          .trim()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-stone-100 bg-stone-50/70 px-6 py-5">
                <Button
                  type="button"
                  className="h-12 w-full bg-[#F36509] text-white hover:bg-[#d95a08]"
                  onClick={() =>
                    toast.info(
                      "POS order creation will be connected next.",
                    )
                  }
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Start Reservation Order
                </Button>

                <p className="mt-2 text-center text-[11px] text-stone-400">
                  This reservation will become the order context.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center px-8 text-center">
              <div className="rounded-full bg-stone-100 p-4">
                <ShoppingCart className="h-6 w-6 text-stone-400" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-stone-900">
                No Reservation Selected
              </h3>

              <p className="mt-1 max-w-xs text-sm leading-5 text-stone-500">
                Select a confirmed or seated reservation to continue with a
                POS order.
              </p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function InfoBox({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-stone-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>

      <p className="mt-1 text-sm font-medium text-stone-900">{value}</p>
    </div>
  );
}