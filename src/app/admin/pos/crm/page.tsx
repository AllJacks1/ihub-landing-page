"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  User,
  RefreshCw,
  Mail,
  Phone,
  Cake,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getCrmUsers,
  createCrmUser,
  updateCrmUser,
  deleteCrmUser,
  type CrmUser,
} from "@/lib/actions";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 20;

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Date(
      value + (value.length === 10 ? "T00:00:00" : ""),
    ).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

type FormState = {
  firstname: string;
  birthday: string;
  contactNumber: string;
  email: string;
};

const emptyForm: FormState = {
  firstname: "",
  birthday: "",
  contactNumber: "",
  email: "",
};

export default function CrmPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<CrmUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // debounced

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editing, setEditing] = useState<CrmUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<CrmUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search → reset to page 1
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const loadCustomers = useCallback(
    async (opts?: { page?: number; search?: string }) => {
      const p = opts?.page ?? page;
      const s = opts?.search ?? searchQuery;
      setIsLoading(true);
      try {
        const result = await getCrmUsers({
          page: p,
          pageSize: PAGE_SIZE,
          search: s,
        });
        if (result.success) {
          setCustomers(result.data);
          setTotal(result.total);
          setTotalPages(result.totalPages);
          setPage(result.page);
        } else {
          toast.error(result.error ?? "Failed to load customers");
          setCustomers([]);
          setTotal(0);
          setTotalPages(1);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load customers");
      } finally {
        setIsLoading(false);
      }
    },
    [page, searchQuery],
  );

  useEffect(() => {
    loadCustomers({ page, search: searchQuery });
  }, [page, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowFormDialog(true);
  }

  function openEdit(customer: CrmUser) {
    setEditing(customer);
    setForm({
      firstname: customer.firstname,
      birthday: customer.birthday?.slice(0, 10) ?? "",
      contactNumber: customer.contactNumber ?? "",
      email: customer.email ?? "",
    });
    setShowFormDialog(true);
  }

  async function handleSave() {
    if (!form.firstname.trim()) {
      toast.error("First name is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        firstname: form.firstname.trim(),
        birthday: form.birthday || null,
        contactNumber: form.contactNumber.trim() || null,
        email: form.email.trim() || null,
      };

      const result = editing
        ? await updateCrmUser(editing.userId, payload)
        : await createCrmUser(payload);

      if (!result.success) {
        toast.error(result.error ?? "Save failed");
        return;
      }

      toast.success(editing ? "Customer updated" : "Customer created");
      setShowFormDialog(false);
      setEditing(null);
      setForm(emptyForm);
      await loadCustomers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteCrmUser(deleteTarget.userId);
      if (!result.success) {
        toast.error(result.error ?? "Delete failed");
        return;
      }
      toast.success("Customer deleted");
      setDeleteTarget(null);
      // If last item on page was deleted, go back a page
      const nextPage = customers.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await loadCustomers({ page: nextPage });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F36509]">
              CRM
            </p>
            <h1 className="mt-1 font-serif text-xl font-semibold text-stone-900 sm:text-2xl">
              Customers
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              View, create, update, and delete customer accounts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-stone-200 bg-stone-50 text-stone-700"
            >
              {total} total
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadCustomers()}
              disabled={isLoading}
              className="border-stone-200"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              type="button"
              onClick={openCreate}
              className="bg-[#F36509] text-white hover:bg-[#d95a08]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add customer
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-stone-50 p-4 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="h-11 rounded-xl border-stone-200 bg-white pl-11"
            />
          </div>

          {/* List */}
          {isLoading ? (
            <Card className="border-stone-200 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <RefreshCw className="h-6 w-6 animate-spin text-[#F36509]" />
                <p className="mt-4 text-sm font-medium text-stone-900">
                  Loading customers…
                </p>
              </CardContent>
            </Card>
          ) : customers.length === 0 ? (
            <Card className="border-stone-200 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-stone-100 p-4">
                  <User className="h-6 w-6 text-stone-400" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-stone-900">
                  {searchQuery ? "No matches" : "No customers yet"}
                </h3>
                <p className="mt-1 max-w-sm text-sm text-stone-500">
                  {searchQuery
                    ? "Try a different search term."
                    : "Add your first customer to get started."}
                </p>
                {!searchQuery && (
                  <Button
                    type="button"
                    onClick={openCreate}
                    className="mt-4 bg-[#F36509] text-white hover:bg-[#d95a08]"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add customer
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                <div className="hidden sm:grid-cols-[1fr_120px_140px_1fr_130px] gap-3 border-b border-stone-100 bg-stone-50/80 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-stone-400 sm:grid">
                  <span>Name</span>
                  <span>Birthday</span>
                  <span>Phone</span>
                  <span>Email</span>
                  <span className="text-right">Actions</span>
                </div>

                <ul className="divide-y divide-stone-100">
                  {customers.map((c) => (
                    <li
                      key={c.userId}
                      className="grid grid-cols-1 gap-2 px-4 py-3 sm:grid-cols-[1fr_120px_140px_1fr_130px] sm:items-center sm:gap-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F36509]/10 text-sm font-semibold text-[#F36509]">
                          {c.firstname.charAt(0).toUpperCase()}
                        </div>
                        <p className="truncate font-medium text-stone-900">
                          {c.firstname}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-stone-600 sm:block">
                        <Cake className="h-3.5 w-3.5 text-stone-400 sm:hidden" />
                        {formatDate(c.birthday)}
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-stone-600 sm:block">
                        <Phone className="h-3.5 w-3.5 text-stone-400 sm:hidden" />
                        {c.contactNumber || "—"}
                      </div>

                      <div className="flex min-w-0 items-center gap-1.5 text-sm text-stone-600 sm:block">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-stone-400 sm:hidden" />
                        <span className="truncate">{c.email || "—"}</span>
                      </div>

                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-stone-500 hover:text-[#F36509]"
                          onClick={() => router.push(`/admin/pos/crm/${c.userId}/orders`)}
                          aria-label={`View transactions for ${c.firstname}`}
                          title="View transactions"
                        >
                          <Receipt className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-stone-500 hover:text-[#F36509]"
                          onClick={() => openEdit(c)}
                          aria-label={`Edit ${c.firstname}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-stone-500 hover:text-red-600"
                          onClick={() => setDeleteTarget(c)}
                          aria-label={`Delete ${c.firstname}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pagination */}
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-sm text-stone-500">
                  Showing{" "}
                  <span className="font-medium text-stone-700">
                    {from}–{to}
                  </span>{" "}
                  of <span className="font-medium text-stone-700">{total}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-stone-200"
                    disabled={page <= 1 || isLoading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <span className="min-w-[5rem] text-center text-sm text-stone-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-stone-200"
                    disabled={page >= totalPages || isLoading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create / Edit dialog — unchanged */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editing ? "Edit customer" : "Add customer"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update this customer’s details."
                : "Create a new customer account."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="firstname">First name *</Label>
              <Input
                id="firstname"
                value={form.firstname}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstname: e.target.value }))
                }
                placeholder="Juan"
                className="h-11 rounded-xl border-stone-200"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Input
                id="birthday"
                type="date"
                value={form.birthday}
                onChange={(e) =>
                  setForm((f) => ({ ...f, birthday: e.target.value }))
                }
                className="h-11 rounded-xl border-stone-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact number</Label>
              <Input
                id="contactNumber"
                type="tel"
                value={form.contactNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, contactNumber: e.target.value }))
                }
                placeholder="09xxxxxxxxx"
                className="h-11 rounded-xl border-stone-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="name@example.com"
                className="h-11 rounded-xl border-stone-200"
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFormDialog(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !form.firstname.trim()}
              className="bg-[#F36509] text-white hover:bg-[#d95a08]"
            >
              {isSaving ? "Saving…" : editing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm — unchanged */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Delete customer?
            </DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-stone-900">
                {deleteTarget?.firstname}
              </span>
              . This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
