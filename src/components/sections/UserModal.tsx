"use client";

import { useState, useEffect, useCallback } from "react";
import { parseISO, format, isAfter } from "date-fns";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  History,
  Loader2,
  X,
  Save,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getUserById, updateUser } from "@/app/actions/users";

/* ── types ── */
interface UserData {
  userId: string;
  firstname: string | null;
  surname: string | null;
  email: string | null;
  memberSince: string | null;
  memberUntil: string | null;
  contactNumber: string | null;
}

interface Transaction {
  transactionId?: string;
  points: number;
  transactionType: "earn" | "redeem" | string;
  created_at?: string;
  description?: string | null;
}

interface UserModalProps {
  userId: string;
  onClose: () => void;
  onUserUpdated?: () => void;
}

/* ── helpers ── */
const getMembershipStatus = (memberUntil: string | null) => {
  if (!memberUntil) return "none";
  return isAfter(parseISO(memberUntil), new Date()) ? "active" : "expired";
};

const statusStyles = {
  active: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  expired: {
    label: "Expired",
    className: "bg-stone-100 text-stone-600 border-stone-200",
  },
  none: {
    label: "No Membership",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
} as const;

export default function UserModal({
  userId,
  onClose,
  onUserUpdated,
}: UserModalProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [editFirstname, setEditFirstname] = useState("");
  const [editSurname, setEditSurname] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editContact, setEditContact] = useState("");

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getUserById(userId);
      if (!result.success || !result.data) {
        toast.error(result.error || "User not found");
        onClose();
        return;
      }

      const data = result.data;
      setUser(data);
      setTransactions(data.transactions);
      setTotalPoints(data.totalPoints);

      setEditFirstname(data.firstname ?? "");
      setEditSurname(data.surname ?? "");
      setEditEmail(data.email ?? "");
      setEditContact(data.contactNumber ?? "");
    } catch {
      toast.error("Failed to load user details");
    } finally {
      setIsLoading(false);
    }
  }, [userId, onClose]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const result = await updateUser(user.userId, {
        firstname: editFirstname,
        surname: editSurname,
        email: editEmail,
        contactNumber: editContact,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to update user");
        return;
      }

      toast.success("User updated successfully");
      setIsEditing(false);
      onUserUpdated?.();
      await loadUser();
    } catch {
      toast.error("Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  const membershipStatus = user
    ? getMembershipStatus(user.memberUntil)
    : "none";

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] min-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {isLoading
              ? "Loading..."
              : `${user?.firstname ?? ""} ${user?.surname ?? ""}`.trim() ||
                "User Details"}
          </DialogTitle>
          <DialogDescription className="text-stone-500">
            View and manage member information
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#F36509]" />
            <span className="ml-3 text-sm text-stone-500">
              Loading user details...
            </span>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* Header card */}
            <Card className="border-stone-200 bg-stone-50/50">
              <CardContent className="flex items-start gap-4 p-5">
                <div
                  className={cn(
                    "rounded-xl p-3",
                    membershipStatus === "active"
                      ? "bg-emerald-100"
                      : "bg-stone-200",
                  )}
                >
                  <User
                    className={cn(
                      "h-6 w-6",
                      membershipStatus === "active"
                        ? "text-emerald-600"
                        : "text-stone-600",
                    )}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-stone-900">
                      {user.firstname} {user.surname}
                    </h3>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-medium",
                        statusStyles[membershipStatus].className,
                      )}
                    >
                      {statusStyles[membershipStatus].label}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-stone-500">
                    ID: {user.userId}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <Award className="h-4 w-4 text-[#F36509]" />
                    <span className="text-xl font-semibold text-[#F36509]">
                      {totalPoints.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-sm text-stone-500">points</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Editable fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  First Name
                </label>
                {isEditing ? (
                  <Input
                    value={editFirstname}
                    onChange={(e) => setEditFirstname(e.target.value)}
                    className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20"
                  />
                ) : (
                  <p className="text-sm font-medium text-stone-900">
                    {user.firstname || "—"}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Surname
                </label>
                {isEditing ? (
                  <Input
                    value={editSurname}
                    onChange={(e) => setEditSurname(e.target.value)}
                    className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20"
                  />
                ) : (
                  <p className="text-sm font-medium text-stone-900">
                    {user.surname || "—"}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Email
                </label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-stone-900">
                    <Mail className="h-3.5 w-3.5 text-stone-400" />
                    {user.email || "—"}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Contact Number
                </label>
                {isEditing ? (
                  <Input
                    value={editContact}
                    onChange={(e) => setEditContact(e.target.value)}
                    className="border-stone-200 focus:border-[#F36509] focus:ring-[#F36509]/20"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-stone-900">
                    <Phone className="h-3.5 w-3.5 text-stone-400" />
                    {user.contactNumber || "—"}
                  </div>
                )}
              </div>
            </div>

            {/* Membership dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Member Since
                </label>
                <div className="flex items-center gap-2 text-sm text-stone-900">
                  <Calendar className="h-3.5 w-3.5 text-stone-400" />
                  {user.memberSince
                    ? format(parseISO(user.memberSince), "MMM d, yyyy")
                    : "—"}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Member Until
                </label>
                <div className="flex items-center gap-2 text-sm text-stone-900">
                  <Calendar className="h-3.5 w-3.5 text-stone-400" />
                  {user.memberUntil
                    ? format(parseISO(user.memberUntil), "MMM d, yyyy")
                    : "—"}
                </div>
              </div>
            </div>

            <Separator className="bg-stone-200" />

            {/* Transaction history */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <History className="h-4 w-4 text-stone-500" />
                <h4 className="text-sm font-semibold text-stone-900">
                  Points History
                </h4>
                <span className="text-xs text-stone-400">
                  ({transactions.length})
                </span>
              </div>

              {transactions.length === 0 ? (
                <p className="py-6 text-center text-sm text-stone-400">
                  No transactions yet
                </p>
              ) : (
                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {transactions.map((tx, idx) => {
                    const isEarn = tx.transactionType === "earn";
                    return (
                      <div
                        key={tx.transactionId ?? idx}
                        className="flex items-center justify-between rounded-lg border border-stone-100 bg-white px-3 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "rounded-md px-2 py-0.5 text-xs font-medium",
                              isEarn
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-600",
                            )}
                          >
                            {isEarn ? "Earn" : "Redeem"}
                          </div>
                          <div>
                            <p className="text-sm text-stone-700">
                              {tx.description || "—"}
                            </p>
                            {tx.created_at && (
                              <p className="text-xs text-stone-400">
                                {format(
                                  parseISO(tx.created_at),
                                  "MMM d, yyyy • h:mm a",
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "font-semibold",
                            isEarn ? "text-emerald-600" : "text-red-600",
                          )}
                        >
                          {isEarn ? "+" : "−"}
                          {Number(tx.points).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  // reset fields
                  if (user) {
                    setEditFirstname(user.firstname ?? "");
                    setEditSurname(user.surname ?? "");
                    setEditEmail(user.email ?? "");
                    setEditContact(user.contactNumber ?? "");
                  }
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#F36509] text-white hover:bg-[#e05a00]"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-stone-200"
              >
                Close
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => loadUser()}
                className="border-stone-200"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button
                type="button"
                onClick={() => setIsEditing(true)}
                className="bg-[#F36509] text-white hover:bg-[#e05a00]"
              >
                Edit Details
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
