"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, parseISO, isToday, isFuture, startOfDay, endOfDay } from "date-fns";
import {
  Search,
  Calendar,
  Users,
  MapPin,
  Clock,
  Phone,
  Mail,
  User,
  Filter,
  RefreshCw,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getReservations } from "@/lib/actions";
import { cn } from "@/lib/utils";

/* ── types (mirror your schema) ── */
type Zone = "bistro" | "study" | "room";
type ReservationStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show";

interface Reservation {
  id: string;
  profile_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  pax: number;
  zone: Zone;
  start_at: string; // ISO from Supabase
  end_at: string;
  status: ReservationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/* ── helpers ── */
const statusStyles: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  confirmed: {
    label: "Confirmed",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
  seated: {
    label: "Seated",
    className:
      "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100",
  },
  completed: {
    label: "Completed",
    className:
      "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  },
  no_show: {
    label: "No Show",
    className:
      "bg-orange-50 text-[#c2410c] border-orange-200 hover:bg-orange-100",
  },
};

const zoneLabel = (z: Zone) =>
  ({ bistro: "Bistro", study: "Study Zone", room: "Private Room" }[z]);

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");
  const [zoneFilter, setZoneFilter] = useState<Zone | "all">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "upcoming" | "past">("all");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const opts: Parameters<typeof getReservations>[0] = {};

      if (statusFilter !== "all") opts.status = statusFilter;
      if (zoneFilter !== "all") opts.zone = zoneFilter;

      if (dateFilter === "today") {
        const now = new Date();
        opts.from = startOfDay(now).toISOString();
        opts.to = endOfDay(now).toISOString();
      } else if (dateFilter === "upcoming") {
        opts.from = new Date().toISOString();
      } else if (dateFilter === "past") {
        opts.to = new Date().toISOString();
      }

      const result = await getReservations(opts);
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
  }, [statusFilter, zoneFilter, dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── derived stats ── */
  const stats = useMemo(() => {
    const today = reservations.filter((r) => isToday(parseISO(r.start_at)));
    const pending = reservations.filter((r) => r.status === "pending");
    const confirmed = reservations.filter((r) => r.status === "confirmed");
    const upcoming = reservations.filter((r) => isFuture(parseISO(r.start_at)));
    return {
      total: reservations.length,
      today: today.length,
      pending: pending.length,
      confirmed: confirmed.length,
      upcoming: upcoming.length,
    };
  }, [reservations]);

  /* ── client-side search ── */
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return reservations;
    const q = searchQuery.toLowerCase();
    return reservations.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.phone && r.phone.toLowerCase().includes(q)),
    );
  }, [reservations, searchQuery]);

  /* ── sort by start time ── */
  const sorted = useMemo(() => {
    return [...filtered].sort(
      (a, b) =>
        new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
    );
  }, [filtered]);

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
            Reservations
          </h1>
          <p className="mt-1.5 text-sm text-stone-500">
            Manage bookings, arrivals, and seating
          </p>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          className="border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Total
            </p>
            <p className="mt-1 text-3xl font-semibold text-stone-900">
              {stats.total}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Today
            </p>
            <p className="mt-1 text-3xl font-semibold text-[#F36509]">
              {stats.today}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Upcoming
            </p>
            <p className="mt-1 text-3xl font-semibold text-emerald-600">
              {stats.upcoming}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Pending
            </p>
            <p className="mt-1 text-3xl font-semibold text-amber-600">
              {stats.pending}
            </p>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              Confirmed
            </p>
            <p className="mt-1 text-3xl font-semibold text-sky-600">
              {stats.confirmed}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            placeholder="Search name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-stone-200 rounded-lg focus:border-[#F36509] focus:ring-[#F36509]/20"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as ReservationStatus | "all")}
          >
            <SelectTrigger className="w-[160px] rounded-lg border-stone-200 focus:ring-[#F36509]/20 focus:border-[#F36509]">
              <Filter className="mr-2 h-4 w-4 text-stone-400" />
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="seated">Seated</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_show">No Show</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={zoneFilter}
            onValueChange={(v) => setZoneFilter(v as Zone | "all")}
          >
            <SelectTrigger className="w-[160px] rounded-lg border-stone-200 focus:ring-[#F36509]/20 focus:border-[#F36509]">
              <MapPin className="mr-2 h-4 w-4 text-stone-400" />
              <SelectValue placeholder="All zones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              <SelectItem value="bistro">Bistro</SelectItem>
              <SelectItem value="study">Study Zone</SelectItem>
              <SelectItem value="room">Private Room</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={dateFilter}
            onValueChange={(v) => setDateFilter(v as typeof dateFilter)}
          >
            <SelectTrigger className="w-[160px] rounded-lg border-stone-200 focus:ring-[#F36509]/20 focus:border-[#F36509]">
              <Calendar className="mr-2 h-4 w-4 text-stone-400" />
              <SelectValue placeholder="Any date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="mt-6 border-stone-200 bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-[#F36509]" />
              <span className="ml-3 text-sm text-stone-500">
                Loading reservations...
              </span>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-stone-50 p-4">
                <Calendar className="h-8 w-8 text-stone-300" />
              </div>
              <p className="mt-4 text-sm font-medium text-stone-900">
                {searchQuery || statusFilter !== "all" || zoneFilter !== "all" || dateFilter !== "all"
                  ? "No matching reservations"
                  : "No reservations yet"}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {searchQuery || statusFilter !== "all" || zoneFilter !== "all" || dateFilter !== "all"
                  ? "Try adjusting your filters"
                  : "New bookings will appear here"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="py-3.5 pl-6 pr-4 text-left font-medium text-stone-500">
                      Guest
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Contact
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Zone
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Date & Time
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Pax
                    </th>
                    <th className="py-3.5 px-4 text-left font-medium text-stone-500">
                      Status
                    </th>
                    <th className="py-3.5 pr-6 pl-4 text-right font-medium text-stone-500 w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {sorted.map((r) => {
                    const start = parseISO(r.start_at);
                    const end = parseISO(r.end_at);
                    const isTodayReservation = isToday(start);

                    return (
                      <tr
                        key={r.id}
                        className={cn(
                          "group hover:bg-stone-50/80 transition-colors",
                          isTodayReservation && "bg-amber-50/30",
                        )}
                      >
                        {/* Guest */}
                        <td className="py-4 pl-6 pr-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "rounded-lg p-2",
                                isTodayReservation
                                  ? "bg-[#F36509]/10"
                                  : "bg-stone-100",
                              )}
                            >
                              <User
                                className={cn(
                                  "h-4 w-4",
                                  isTodayReservation
                                    ? "text-[#F36509]"
                                    : "text-stone-500",
                                )}
                              />
                            </div>
                            <div>
                              <div className="font-medium text-stone-900">
                                {r.full_name}
                              </div>
                              {r.notes && (
                                <div className="text-xs text-stone-400 line-clamp-1 max-w-[200px] mt-0.5">
                                  {r.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-stone-600">
                              <Mail className="h-3 w-3 text-stone-400" />
                              {r.email}
                            </div>
                            {r.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-stone-600">
                                <Phone className="h-3 w-3 text-stone-400" />
                                {r.phone}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Zone */}
                        <td className="py-4 px-4">
                          <Badge
                            variant="outline"
                            className="font-normal text-stone-600 border-stone-200"
                          >
                            <MapPin className="mr-1 h-3 w-3 text-stone-400" />
                            {zoneLabel(r.zone)}
                          </Badge>
                        </td>

                        {/* Date & Time */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-stone-900">
                              <Calendar className="h-3.5 w-3.5 text-stone-400" />
                              <span className="font-medium">
                                {format(start, "MMM d, yyyy")}
                              </span>
                              {isTodayReservation && (
                                <Badge className="ml-1.5 h-5 px-1.5 text-[10px] bg-[#F36509]/10 text-[#F36509] border-[#F36509]/20 hover:bg-[#F36509]/20">
                                  Today
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-stone-500">
                              <Clock className="h-3.5 w-3.5 text-stone-400" />
                              {format(start, "h:mm a")} – {format(end, "h:mm a")}
                            </div>
                          </div>
                        </td>

                        {/* Pax */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-stone-900">
                            <Users className="h-4 w-4 text-stone-400" />
                            <span className="font-medium">{r.pax}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-medium text-xs capitalize",
                              statusStyles[r.status].className,
                            )}
                          >
                            {statusStyles[r.status].label}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="py-4 pr-6 pl-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer count */}
      {!isLoading && sorted.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-xs text-stone-500">
          <p>
            Showing <span className="font-medium text-stone-900">{sorted.length}</span>{" "}
            reservation{sorted.length !== 1 ? "s" : ""}
          </p>
          <p>Ordered by start time</p>
        </div>
      )}
    </main>
  );
}