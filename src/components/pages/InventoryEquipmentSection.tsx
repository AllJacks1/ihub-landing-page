import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  CheckCircle2,
  History,
  PackageSearch,
  PackageX,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import {
  getInventoryEquipment,
  type Department,
  type EquipmentCondition,
  type InventoryEquipment,
  type InventoryEquipmentHistory,
} from "@/lib/inventory-actions";
import type { useInventoryEquipment } from "@/hooks/useInventoryEquipment";

type InventoryEquipmentSectionProps = ReturnType<typeof useInventoryEquipment>;

const CONDITION_STYLES: Record<
  EquipmentCondition,
  { label: string; className: string }
> = {
  good: {
    label: "Good",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  damaged: {
    label: "Damaged",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  under_maintenance: {
    label: "Under Maintenance",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
};

function EquipmentStatusBadge({
  equipment,
}: {
  equipment: InventoryEquipment;
}) {
  const isAvailable = equipment.available_quantity <= 0;
  return (
    <Badge
      variant="outline"
      className={
        isAvailable
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-stone-200 bg-white text-stone-600"
      }
    >
      {isAvailable ? "Out of Service" : "In Use"}
    </Badge>
  );
}
const selectClassName =
  "h-11 w-full appearance-none rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-stone-800 outline-none focus:border-[#F36509]/50 focus:ring-2 focus:ring-[#F36509]/20";

export default function InventoryEquipmentSection(
  props: InventoryEquipmentSectionProps,
) {
  const {
    equipment,
    categories,
    isLoading,
    loadError,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    departmentFilter,
    setDepartmentFilter,
    showEquipmentDialog,
    setShowEquipmentDialog,
    editingEquipment,
    showHistoryDialog,
    setShowHistoryDialog,
    historyEquipment,
    equipmentHistory,
    isSubmitting,
    isLoadingHistory,
    loadEquipment,
    openAddEquipmentDialog,
    openEditEquipmentDialog,
    openHistoryDialog,
    handleSaveEquipment,
  } = props;

  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDepartment, setFormDepartment] = useState<Department>("bar");
  const [formTotalQuantity, setFormTotalQuantity] = useState("1");
  const [formAvailableQuantity, setFormAvailableQuantity] = useState("1");
  const [formCondition, setFormCondition] =
    useState<EquipmentCondition>("good");
  const [formNotes, setFormNotes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setFormName("");
    setFormCategory("");
    setFormDepartment("bar");
    setFormTotalQuantity("1");
    setFormAvailableQuantity("1");
    setFormCondition("good");
    setFormNotes("");
    setSubmitError(null);
  }, []);

  useEffect(() => {
    resetForm();
  }, [editingEquipment, resetForm]);

  const handleSaveEquipmentRun = useCallback(
    async (values: {
      name: string;
      category: string;
      department: Department;
      total_quantity: number | string;
      available_quantity: number | string;
      condition: EquipmentCondition;
      notes: string;
    }) => {
      setSubmitError(null);
      try {
        await handleSaveEquipment(values);
      } catch (error) {
        console.error("Failed to save equipment:", error);
        setSubmitError(
          editingEquipment
            ? "Failed to update equipment"
            : "Failed to register equipment",
        );
        toast.error(
          editingEquipment
            ? "Failed to update equipment"
            : "Failed to register equipment",
        );
      }
    },
    [editingEquipment, handleSaveEquipment],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formName.trim() || !formCategory.trim()) return;
      const total = Number(formTotalQuantity);
      const available = Number(formAvailableQuantity);
      if (!Number.isFinite(total) || total < 0) {
        setSubmitError("Total quantity must be a valid number");
        return;
      }
      if (!Number.isFinite(available) || available < 0) {
        setSubmitError("Available quantity must be a valid number");
        return;
      }
      handleSaveEquipmentRun({
        name: formName.trim(),
        category: formCategory.trim(),
        department: formDepartment,
        total_quantity: total,
        available_quantity: available,
        condition: formCondition,
        notes: formNotes.trim(),
      });
    },
    [
      formName,
      formCategory,
      formDepartment,
      formTotalQuantity,
      formAvailableQuantity,
      formCondition,
      formNotes,
      handleSaveEquipmentRun,
    ],
  );
  const filteredEquipment = useMemo(() => {
    const query = search.trim().toLowerCase();
    return equipment.filter((item) => {
      if (departmentFilter !== "all" && item.department !== departmentFilter)
        return false;
      if (categoryFilter !== "all" && item.category !== categoryFilter)
        return false;
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.notes ?? "").toLowerCase().includes(query)
      );
    });
  }, [equipment, search, categoryFilter, departmentFilter]);

  const equipmentSummary = useMemo(() => {
    let total = 0;
    let available = 0;
    let underMaintenance = 0;
    let damaged = 0;
    let inUse = 0;
    for (const item of equipment) {
      total += item.total_quantity;
      available += item.available_quantity;
      if (item.condition === "under_maintenance") underMaintenance += 1;
      else if (item.condition === "damaged") damaged += 1;
      if (item.available_quantity <= 0) inUse += 1;
    }
    return { total, available, underMaintenance, damaged, inUse };
  }, [equipment]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-sm text-stone-500">
          Reusable Bar &amp; Kitchen equipment, quantities, and condition.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadEquipment}
            disabled={isLoading}
            className="h-9 rounded-lg border-stone-200 text-stone-600"
          >
            <RefreshCw
              className={`mr-2 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={openAddEquipmentDialog}
            disabled={Boolean(loadError)}
            className="h-9 rounded-lg bg-[#F36509] text-white hover:bg-[#d95a08]"
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Add Equipment
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-b border-stone-100 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-5">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            type="search"
            placeholder="Search equipment, categories, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-stone-200 bg-white pl-9 text-sm focus:border-[#F36509]/50 focus:ring-2 focus:ring-[#F36509]/20"
          />
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-stone-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 appearance-none bg-transparent text-sm font-medium text-stone-800 outline-none"
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <select
          value={departmentFilter}
          onChange={(e) =>
            setDepartmentFilter(e.target.value as "all" | Department)
          }
          className={selectClassName}
          aria-label="Filter by department"
        >
          <option value="all">All departments</option>
          <option value="bar">Bar</option>
          <option value="kitchen">Kitchen</option>
        </select>
      </div>

      {/* ── Error state ── */}
      {loadError && !isLoading && (
        <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:mx-5">
          <p className="font-medium">Failed to load equipment</p>
          <p>{loadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
            onClick={loadEquipment}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}

      {/* ── Summary strip (KPI-style, matches Sales page cards) ── */}
      {!isLoading && equipmentSummary.total > 0 && (
        <div className="grid grid-cols-2 gap-3 border-b border-stone-100 p-4 sm:grid-cols-4 sm:px-5">
          {[
            {
              label: "Total Units",
              value: equipmentSummary.total,
              icon: PackageSearch,
              iconClass: "bg-orange-50 text-[#F36509]",
            },
            {
              label: "Available",
              value: equipmentSummary.available,
              icon: CheckCircle2,
              iconClass: "bg-emerald-50 text-emerald-600",
            },
            {
              label: "Under Maintenance",
              value: equipmentSummary.underMaintenance,
              icon: Activity,
              iconClass: "bg-sky-50 text-sky-600",
            },
            {
              label: "Out of Service",
              value: equipmentSummary.inUse,
              icon: PackageX,
              iconClass: "bg-red-50 text-red-600",
            },
          ].map(({ label, value, icon: Icon, iconClass }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl bg-stone-50 p-3.5"
            >
              <div className={`shrink-0 rounded-lg p-2 ${iconClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium uppercase tracking-wider text-stone-400">
                  {label}
                </p>
                <p className="text-xl font-bold tabular-nums text-stone-900">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {isLoading && (
        <div className="space-y-3 p-4 sm:px-5">
          <Skeleton className="h-12 w-full rounded-xl" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && equipment.length === 0 && !loadError && (
        <div className="p-6 text-center sm:p-10">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageSearch className="h-6 w-6 text-stone-400" />
              </EmptyMedia>
              <EmptyTitle>No equipment registered</EmptyTitle>
              <EmptyDescription>
                Add your first reusable piece of Bar or Kitchen equipment to
                start tracking quantities and condition.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
          <Button
            type="button"
            onClick={openAddEquipmentDialog}
            className="mt-4 rounded-lg bg-[#F36509] text-white hover:bg-[#d95a08]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Equipment
          </Button>
        </div>
      )}

      {!isLoading && equipment.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-stone-100 bg-stone-50/80 hover:bg-stone-50/80">
                <TableHead>Equipment</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-stone-500"
                  >
                    No equipment matches your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEquipment.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                  >
                    <TableCell>
                      <div className="font-medium text-stone-900">
                        {item.name}
                      </div>
                      {item.notes && (
                        <p className="text-xs text-stone-400">{item.notes}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                        {item.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${item.department === "bar" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
                      >
                        {item.department === "bar" ? (
                          <>
                            <Wrench className="h-3 w-3" /> Bar
                          </>
                        ) : (
                          <>
                            <Wrench className="h-3 w-3" /> Kitchen
                          </>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.total_quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.available_quantity}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={CONDITION_STYLES[item.condition].className}
                      >
                        {CONDITION_STYLES[item.condition].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          item.available_quantity <= 0
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-stone-200 bg-white text-stone-600"
                        }
                      >
                        {item.available_quantity <= 0
                          ? "Out of Service"
                          : "In Use"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditEquipmentDialog(item)}
                          className="text-stone-400 hover:text-[#F36509]"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openHistoryDialog(item)}
                          className="text-stone-400 hover:text-[#F36509]"
                        >
                          <History className="h-4 w-4" />
                          <span className="sr-only">History</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {/* Equipment edit dialog */}
      <Dialog open={showEquipmentDialog} onOpenChange={setShowEquipmentDialog}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {editingEquipment ? "Update Equipment" : "Register Equipment"}
            </DialogTitle>
            <DialogDescription>
              {editingEquipment
                ? "Update the total quantity, available quantity, condition, and notes for this equipment item."
                : "Add a reusable piece of equipment for Bar or Kitchen."}
            </DialogDescription>
          </DialogHeader>
          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="equipment-name">Name</Label>
                <Input
                  id="equipment-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Commercial Espresso Machine"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipment-category">Category</Label>
                <Input
                  id="equipment-category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g. Equipment"
                  list="equipment-categories"
                  maxLength={100}
                />
                <datalist id="equipment-categories">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipment-department">Department</Label>
                <select
                  id="equipment-department"
                  value={formDepartment}
                  onChange={(e) =>
                    setFormDepartment(e.target.value as Department)
                  }
                  className={selectClassName}
                >
                  <option value="bar">Bar</option>
                  <option value="kitchen">Kitchen</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="equipment-total">Total quantity</Label>
                  <Input
                    id="equipment-total"
                    type="number"
                    min={0}
                    step={1}
                    value={formTotalQuantity}
                    onChange={(e) => setFormTotalQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment-available">
                    Available quantity
                  </Label>
                  <Input
                    id="equipment-available"
                    type="number"
                    min={0}
                    step={1}
                    value={formAvailableQuantity}
                    onChange={(e) => setFormAvailableQuantity(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipment-condition">Condition</Label>
                <select
                  id="equipment-condition"
                  value={formCondition}
                  onChange={(e) =>
                    setFormCondition(e.target.value as EquipmentCondition)
                  }
                  className={selectClassName}
                >
                  <option value="good">Good</option>
                  <option value="damaged">Damaged</option>
                  <option value="under_maintenance">Under Maintenance</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="equipment-notes">Notes</Label>
                <Input
                  id="equipment-notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Last serviced 2026-10-01"
                  maxLength={200}
                />
              </div>
            </div>
            <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEquipmentDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting || !formName.trim() || !formCategory.trim()
                }
                className="rounded-md bg-[#F36509] text-white hover:bg-[#d95a08]"
              >
                {isSubmitting
                  ? "Saving..."
                  : editingEquipment
                    ? "Save Changes"
                    : "Register Equipment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Equipment history dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Equipment history</DialogTitle>
            {/* BUG FIX: was a template literal rendering raw code as text */}
            <DialogDescription>
              {historyEquipment
                ? `${historyEquipment.name} — latest 200 history entries`
                : "Loading history..."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {isLoadingHistory ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : equipmentHistory.length === 0 ? (
              <Empty className="border-none py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Wrench className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>No history yet</EmptyTitle>
                  <EmptyDescription>
                    Quantity, condition, and notes changes will appear here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-2">
                {equipmentHistory.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-stone-200 bg-stone-50/60 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            record.event === "quantity_update"
                              ? "border-stone-200 bg-stone-100 text-stone-700"
                              : record.event === "condition_update"
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-sky-200 bg-sky-50 text-sky-700"
                          }
                        >
                          {record.event === "quantity_update"
                            ? "Quantity Update"
                            : record.event === "condition_update"
                              ? "Condition Update"
                              : "Notes Update"}
                        </Badge>
                        <span className="text-sm font-semibold tabular-nums">
                          {record.details}
                        </span>
                      </div>
                      <span className="text-xs text-stone-400">
                        {new Date(record.created_at).toLocaleString()}
                      </span>
                    </div>
                    {record.staff_name && (
                      <div className="mt-1 text-xs text-stone-400">
                        by {record.staff_name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowHistoryDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
