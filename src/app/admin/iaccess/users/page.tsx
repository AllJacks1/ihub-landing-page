"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useTransition,
} from "react";
import { parseISO, isAfter, isBefore, format } from "date-fns";
import {
  Search,
  Users,
  RefreshCw,
  Eye,
  Mail,
  Phone,
  Calendar,
  Award,
  User,
  Filter,
  Loader2,
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
import { cn } from "@/lib/utils";
import UserModal from "@/components/sections/UserModal";
import { getUsers } from "@/app/actions/users";

/* ── types ── */
type MembershipStatus = "active" | "expired" | "none";

interface UserRow {
  userId: string;
  firstname: string | null;
  surname: string | null;
  email: string | null;
  memberSince: string | null;
  memberUntil: string | null;
  contactNumber: string | null;
  totalPoints: number;
}

/* ── helpers ── */
const getMembershipStatus = (memberUntil: string | null): MembershipStatus => {
  if (!memberUntil) return "none";
  return isAfter(parseISO(memberUntil), new Date()) ? "active" : "expired";
};

const statusStyles: Record<
  MembershipStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
  expired: {
    label: "Expired",
    className:
      "bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200",
  },
  none: {
    label: "No Membership",
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | "all">(
    "all",
  );

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getUsers();
      if (result.success) {
        setUsers(result.data ?? []);
      } else {
        toast.error(result.error || "Failed to load users");
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── derived data ── */
  const stats = useMemo(() => {
    const active = users.filter(
      (u) => getMembershipStatus(u.memberUntil) === "active",
    ).length;
    const expired = users.filter(
      (u) => getMembershipStatus(u.memberUntil) === "expired",
    ).length;
    const totalPoints = users.reduce((sum, u) => sum + (u.totalPoints || 0), 0);

    return {
      total: users.length,
      active,
      expired,
      totalPoints,
    };
  }, [users]);

  const filtered = useMemo(() => {
    let result = users;

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(
        (u) => getMembershipStatus(u.memberUntil) === statusFilter,
      );
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          `${u.firstname ?? ""} ${u.surname ?? ""}`.toLowerCase().includes(q) ||
          (u.email ?? "").toLowerCase().includes(q) ||
          (u.userId ?? "").toLowerCase().includes(q) ||
          (u.contactNumber ?? "").toLowerCase().includes(q),
      );
    }

    return result;
  }, [users, searchQuery, statusFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      // Highest points first, then by name
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      const nameA = `${a.firstname ?? ""} ${a.surname ?? ""}`.toLowerCase();
      const nameB = `${b.firstname ?? ""} ${b.surname ?? ""}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [filtered]);

  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
            Users
          </h1>
          <p className="mt-1.5 text-sm text-stone-500">
            Manage members, points, and membership status
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
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(
          [
            ["Total Users", stats.total, "text-stone-900"],
            ["Active Members", stats.active, "text-emerald-600"],
            ["Expired", stats.expired, "text-stone-500"],
            [
              "Total Points",
              stats.totalPoints.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              }),
              "text-[#F36509]",
            ],
          ] as const
        ).map(([label, value, color]) => (
          <Card key={label} className="border-stone-200 bg-white">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-stone-500">
                {label}
              </p>
              <p className={cn("mt-1 text-3xl font-semibold", color)}>
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            placeholder="Search name, email, phone, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border-stone-200 pl-10 focus:border-[#F36509] focus:ring-[#F36509]/20"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              if (v) setStatusFilter(v as MembershipStatus | "all");
            }}
          >
            <SelectTrigger className="w-[180px] rounded-lg border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20">
              <Filter className="mr-2 h-4 w-4 text-stone-400" />
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="none">No Membership</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="mt-6 overflow-hidden border-stone-200 bg-white">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-stone-300 border-t-[#F36509]" />
              <span className="ml-3 text-sm text-stone-500">
                Loading users...
              </span>
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-stone-50 p-4">
                <Users className="h-8 w-8 text-stone-300" />
              </div>
              <p className="mt-4 text-sm font-medium text-stone-900">
                {searchQuery || statusFilter !== "all"
                  ? "No matching users"
                  : "No users yet"}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "New users will appear here"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="py-3.5 pr-4 pl-6 text-left font-medium text-stone-500">
                      Member
                    </th>
                    <th className="px-4 py-3.5 text-left font-medium text-stone-500">
                      Contact
                    </th>
                    <th className="px-4 py-3.5 text-left font-medium text-stone-500">
                      Points
                    </th>
                    <th className="px-4 py-3.5 text-left font-medium text-stone-500">
                      Membership
                    </th>
                    <th className="px-4 py-3.5 text-left font-medium text-stone-500">
                      Status
                    </th>
                    <th className="w-32 py-3.5 pr-6 pl-4 text-right font-medium text-stone-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {sorted.map((u) => {
                    const status = getMembershipStatus(u.memberUntil);
                    const isActive = status === "active";

                    return (
                      <tr
                        key={u.userId}
                        className={cn(
                          "group transition-colors hover:bg-stone-50/80",
                          isActive && "bg-emerald-50/20",
                        )}
                      >
                        {/* Member */}
                        <td className="py-4 pr-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "rounded-lg p-2",
                                isActive ? "bg-emerald-100" : "bg-stone-100",
                              )}
                            >
                              <User
                                className={cn(
                                  "h-4 w-4",
                                  isActive
                                    ? "text-emerald-600"
                                    : "text-stone-500",
                                )}
                              />
                            </div>
                            <div>
                              <div className="font-medium text-stone-900">
                                {u.firstname} {u.surname}
                              </div>
                              <div className="mt-0.5 text-xs text-stone-400">
                                ID: {u.userId}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            {u.email && (
                              <div className="flex items-center gap-1.5 text-xs text-stone-600">
                                <Mail className="h-3 w-3 text-stone-400" />
                                {u.email}
                              </div>
                            )}
                            {u.contactNumber && (
                              <div className="flex items-center gap-1.5 text-xs text-stone-600">
                                <Phone className="h-3 w-3 text-stone-400" />
                                {u.contactNumber}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Points */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <Award className="h-4 w-4 text-[#F36509]" />
                            <span className="font-semibold text-[#F36509]">
                              {Number(u.totalPoints ?? 0).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                },
                              )}
                            </span>
                          </div>
                        </td>

                        {/* Membership dates */}
                        <td className="px-4 py-4">
                          <div className="space-y-0.5">
                            {u.memberSince ? (
                              <div className="flex items-center gap-1.5 text-xs text-stone-600">
                                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                                Since{" "}
                                {format(parseISO(u.memberSince), "MMM d, yyyy")}
                              </div>
                            ) : (
                              <span className="text-xs text-stone-400">—</span>
                            )}
                            {u.memberUntil && (
                              <div className="text-xs text-stone-500">
                                Until{" "}
                                {format(parseISO(u.memberUntil), "MMM d, yyyy")}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-medium",
                              statusStyles[status].className,
                            )}
                          >
                            {statusStyles[status].label}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="py-4 pr-6 pl-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                            onClick={() => setSelectedUserId(u.userId)}
                          >
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            View
                          </Button>
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
            Showing{" "}
            <span className="font-medium text-stone-900">{sorted.length}</span>{" "}
            user{sorted.length !== 1 ? "s" : ""}
          </p>
          <p>Sorted by points (highest first)</p>
        </div>
      )}

      {/* User details modal (reuses your existing component) */}
      {selectedUserId && (
        <UserModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUserUpdated={() => {
            // Refresh list after edit
            startTransition(() => {
              fetchData();
            });
          }}
        />
      )}
    </main>
  );
}
