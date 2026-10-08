"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  Search,
  Users,
  User,
} from "lucide-react";
import { parseISO, isToday, isFuture, isPast } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  confirmed: {
    label: "Confirmed",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  seated: {
    label: "Seated",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  completed: {
    label: "Completed",
    className: "border-stone-200 bg-stone-100 text-stone-600",
  },
  rejected: {
    label: "Rejected",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  no_show: {
    label: "No Show",
    className: "border-orange-200 bg-orange-50 text-orange-700",
  },
};

const zoneLabels = {
  bistro: "Bistro",
  study: "Study Zone",
  room: "Private Room",
} as const;

type MonitorFilter = "all" | "today" | "upcoming" | "seated" | "completed";

export default function ReservationMonitorPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<MonitorFilter>("all");
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

  const filteredReservations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date();

    return reservations
      .filter((reservation) => {
        if (!query) return true;

        return (
          reservation.full_name.toLowerCase().includes(query) ||
          reservation.email.toLowerCase().includes(query) ||
          reservation.phone?.toLowerCase().includes(query)
        );
      })
      .filter((reservation) => {
        const start = parseISO(reservation.start_at);

        switch (activeFilter) {
          case "today":
            return isToday(start);

          case "upcoming":
            return (
              isFuture(start) &&
              (reservation.status === "confirmed" ||
                reservation.status === "seated")
            );

          case "seated":
            return reservation.status === "seated";

          case "completed":
            return reservation.status === "completed";

          default:
            return true;
        }
      })
      .sort((a, b) => {
        const aTime = new Date(a.start_at).getTime();
        const bTime = new Date(b.start_at).getTime();

        return aTime - bTime;
      });
  }, [reservations, searchQuery, activeFilter]);

  const stats = useMemo(() => {
    const today = reservations.filter((reservation) =>
      isToday(parseISO(reservation.start_at)),
    );

    const confirmedToday = today.filter(
      (reservation) => reservation.status === "confirmed",
    );

    const seated = reservations.filter(
      (reservation) => reservation.status === "seated",
    );

    const upcoming = reservations.filter((reservation) => {
      const start = parseISO(reservation.start_at);

      return (
        isFuture(start) &&
        (reservation.status === "confirmed" ||
          reservation.status === "seated")
      );
    });

    return {
      today: today.length,
      confirmedToday: confirmedToday.length,
      seated: seated.length,
      upcoming: upcoming.length,
    };
  }, [reservations]);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F36509]">
              POS / Terminal
            </p>

            <h1 className="mt-1 font-serif text-2xl font-semibold text-stone-900">
              Reservation Monitor
            </h1>

            <p className="mt-1 text-sm text-stone-500">
              Monitor arrivals, reservations, and current guest status.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={fetchReservations}
            disabled={isLoading}
            className="border-stone-200 bg-white"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                isLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MonitorStat
              label="Today"
              value={stats.today}
              description="Reservations today"
              icon={Calendar}
            />

            <MonitorStat
              label="Confirmed Today"
              value={stats.confirmedToday}
              description="Guests expected today"
              icon={Users}
            />

            <MonitorStat
              label="Currently Seated"
              value={stats.seated}
              description="Guests currently seated"
              icon={User}
            />

            <MonitorStat
              label="Upcoming"
              value={stats.upcoming}
              description="Future confirmed bookings"
              icon={Clock}
            />
          </div>

          {/* Filters */}
          <Card className="mt-6 border-stone-200 bg-white">
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative max-w-md flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />

                  <Input
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(event.target.value)
                    }
                    placeholder="Search guest name, email, or phone..."
                    className="h-11 rounded-xl border-stone-200 pl-10"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["all", "All"],
                      ["today", "Today"],
                      ["upcoming", "Upcoming"],
                      ["seated", "Seated"],
                      ["completed", "Completed"],
                    ] as const
                  ).map(([value, label]) => {
                    const active = activeFilter === value;

                    return (
                      <Button
                        key={value}
                        type="button"
                        variant={active ? "default" : "outline"}
                        onClick={() => setActiveFilter(value)}
                        className={
                          active
                            ? "rounded-full bg-[#F36509] text-white hover:bg-[#d95a08]"
                            : "rounded-full border-stone-200 bg-white text-stone-600"
                        }
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reservations */}
          <Card className="mt-6 overflow-hidden border-stone-200 bg-white">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin text-[#F36509]" />

                  <span className="text-sm text-stone-500">
                    Loading reservations...
                  </span>
                </div>
              ) : filteredReservations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="rounded-full bg-stone-100 p-4">
                    <Calendar className="h-6 w-6 text-stone-400" />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-stone-900">
                    No reservations found
                  </h3>

                  <p className="mt-1 text-sm text-stone-500">
                    Try another search or monitoring filter.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {filteredReservations.map((reservation) => {
                    const start = parseISO(reservation.start_at);
                    const end = parseISO(reservation.end_at);

                    const todayReservation = isToday(start);
                    const passed =
                      isPast(end) &&
                      reservation.status !== "completed";

                    return (
                      <div
                        key={reservation.id}
                        className={`p-5 transition-colors hover:bg-stone-50 ${
                          todayReservation ? "bg-amber-50/30" : ""
                        }`}
                      >
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                          <div className="flex min-w-0 gap-4">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                reservation.status === "seated"
                                  ? "bg-sky-50"
                                  : "bg-stone-100"
                              }`}
                            >
                              <User
                                className={`h-5 w-5 ${
                                  reservation.status === "seated"
                                    ? "text-sky-600"
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

                                {todayReservation && (
                                  <Badge className="border-[#F36509]/20 bg-[#F36509]/10 text-[#F36509] hover:bg-[#F36509]/20">
                                    Today
                                  </Badge>
                                )}

                                {passed && (
                                  <Badge
                                    variant="outline"
                                    className="border-orange-200 bg-orange-50 text-orange-700"
                                  >
                                    Time passed
                                  </Badge>
                                )}
                              </div>

                              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-stone-500">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5 text-stone-400" />
                                  {formatInTimeZone(
                                    start,
                                    "UTC",
                                    "MMM d, yyyy",
                                  )}
                                </span>

                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-stone-400" />
                                  {formatInTimeZone(
                                    start,
                                    "UTC",
                                    "h:mm a",
                                  )}{" "}
                                  –{" "}
                                  {formatInTimeZone(
                                    end,
                                    "UTC",
                                    "h:mm a",
                                  )}
                                </span>

                                <span className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-stone-400" />
                                  {zoneLabels[reservation.zone]}
                                </span>

                                <span className="flex items-center gap-1.5">
                                  <Users className="h-3.5 w-3.5 text-stone-400" />
                                  {reservation.pax} pax
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 rounded-xl border border-stone-100 bg-stone-50 px-4 py-3 xl:min-w-[180px]">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                              Guest Contact
                            </p>

                            <p className="mt-1 truncate text-xs text-stone-600">
                              {reservation.email}
                            </p>

                            {reservation.phone && (
                              <p className="mt-0.5 text-xs text-stone-500">
                                {reservation.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {!isLoading && (
            <div className="mt-3 text-xs text-stone-400">
              Showing {filteredReservations.length} reservation
              {filteredReservations.length !== 1 ? "s" : ""}.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function MonitorStat({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="border-stone-200 bg-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
              {label}
            </p>

            <p className="mt-2 text-2xl font-semibold text-stone-900">
              {value}
            </p>

            <p className="mt-1 text-xs text-stone-500">
              {description}
            </p>
          </div>

          <div className="rounded-xl bg-[#F36509]/10 p-3">
            <Icon className="h-5 w-5 text-[#F36509]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}