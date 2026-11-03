"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  History,
  PackageSearch,
  PackageX,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Wallet,
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStockStatus } from "@/lib/inventory-utils";
import type { InventoryItem } from "@/lib/inventory-actions";
import type { StockMovementAction } from "@/hooks/useInventoryItems";
import { useInventoryItems } from "@/hooks/useInventoryItems";

type InventoryProductsSectionProps = ReturnType<typeof useInventoryItems>;

const STATUS_STYLES: Record<
  ReturnType<typeof getStockStatus>,
  { label: string; className: string }
> = {
  in_stock: {
    label: "In Stock",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  low_stock: {
    label: "Low Stock",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  out_of_stock: {
    label: "Out of Stock",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

function StockStatusBadge({ item }: { item: InventoryItem }) {
  const status = getStockStatus(item);
  const style = STATUS_STYLES[status];
  return (
    <Badge variant="outline" className={style.className}>
      {style.label}
    </Badge>
  );
}

const ACTION_OPTIONS: Array<{
  value: StockMovementAction;
  label: string;
}> = [
  { value: "stock_in", label: "Stock In" },
  { value: "stock_out", label: "Stock Out" },
  { value: "adjust_increase", label: "Adjustment — Increase" },
  { value: "adjust_decrease", label: "Adjustment — Decrease" },
];

const selectClassName =
  "h-11 w-full appearance-none rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-stone-800 outline-none focus:border-[#F36509]/50 focus:ring-2 focus:ring-[#F36509]/20";

export default function InventoryProductsSection(
  props: InventoryProductsSectionProps,
) {
  const {
    items,
    categories,
    branches,
    isLoading,
    loadError,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    branchFilter,
    setBranchFilter,
    stockSummary,
    showItemDialog,
    setShowItemDialog,
    editingItem,
    showMovementDialog,
    setShowMovementDialog,
    movementItem,
    showHistoryDialog,
    setShowHistoryDialog,
    historyItem,
    stockHistory,
    isSubmitting,
    isLoadingHistory,
    loadItems,
    openAddItemDialog,
    openEditItemDialog,
    openMovementDialog,
    openHistoryDialog,
    handleSaveItem,
    handleRecordMovement,
  } = props;

  // ── Item form state ────────────────────────────────────────
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAreaCode, setFormAreaCode] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formBranchId, setFormBranchId] = useState("");
  const [formQuantity, setFormQuantity] = useState("0");
  const [formMinStock, setFormMinStock] = useState("0");

  useEffect(() => {
    if (showItemDialog) {
       setFormName(editingItem?.name ?? "");
       setFormPrice(String(editingItem?.price ?? ""));
       setFormDescription(editingItem?.description ?? "");
       setFormAreaCode(editingItem?.area_code ?? "");
       setFormCategoryId(editingItem?.category_id ?? "");
      setFormBranchId(editingItem?.branch_id ?? branches[0]?.id ?? "");
      setFormQuantity(String(editingItem?.quantity ?? 0));
      setFormMinStock(String(editingItem?.min_stock ?? 0));
    }
  }, [showItemDialog, editingItem, branches]);

  // ── Movement form state ────────────────────────────────────
  const [movementAction, setMovementAction] =
    useState<StockMovementAction>("stock_in");
  const [movementQuantity, setMovementQuantity] = useState("");
  const [movementReason, setMovementReason] = useState("");

  useEffect(() => {
    if (showMovementDialog) {
      setMovementAction("stock_in");
      setMovementQuantity("");
      setMovementReason("");
    }
  }, [showMovementDialog]);

  const submitItemForm = () => {
     void handleSaveItem({
       name: formName,
       price: formPrice,
       description: formDescription,
       area_code: formAreaCode,
       category_id: formCategoryId,
      branch_id: formBranchId,
      quantity: formQuantity,
      min_stock: formMinStock,
    });
  };

  const submitMovementForm = () => {
    void handleRecordMovement({
      action: movementAction,
      quantity: movementQuantity,
      reason: movementReason,
    });
  };

  const isAdjustment =
    movementAction === "adjust_increase" ||
    movementAction === "adjust_decrease";

  const noBranches = !isLoading && branches.length === 0;

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-sm text-stone-500">
          Consumable products tracked per branch with stock levels.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadItems}
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
            onClick={openAddItemDialog}
            disabled={noBranches}
            className="h-9 rounded-lg bg-[#F36509] text-white hover:bg-[#d95a08]"
          >
            <Plus className="mr-2 h-3.5 w-3.5" />
            Add Product
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-2 border-b border-stone-100 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-5">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            type="search"
            placeholder="Search products, categories, SKUs..."
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
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className={selectClassName}
          aria-label="Filter by branch"
        >
          <option value="all">All branches</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>

      {/* ── Alerts (branch warning + load error) ── */}
      {noBranches && (
        <div className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:mx-5">
          <p className="font-medium">No branches configured</p>
          <p>
            Stock is tracked per branch, but no branches exist yet. Create a
            branch first, then add products.
          </p>
        </div>
      )}

      {loadError && !isLoading && (
        <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:mx-5">
          <p className="font-medium">Failed to load inventory</p>
          <p>{loadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
            onClick={loadItems}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}

      {/* ── Summary strip (replaces the badge row, matches equipment) ── */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-3 border-b border-stone-100 p-4 sm:px-5">
          {[
            {
              label: "In Stock",
              value: stockSummary.inStock,
              icon: PackageSearch,
              iconClass: "bg-emerald-50 text-emerald-600",
            },
            {
              label: "Low Stock",
              value: stockSummary.lowStock,
              icon: History,
              iconClass: "bg-amber-50 text-amber-600",
            },
            {
              label: "Out of Stock",
              value: stockSummary.outOfStock,
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

      {/* ── Body: loading / empty / table ── */}
      {isLoading ? (
        <div className="space-y-3 p-4 sm:px-5">
          <Skeleton className="h-12 w-full rounded-xl" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-6 text-center sm:p-10">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageSearch className="h-6 w-6 text-stone-400" />
              </EmptyMedia>
              <EmptyTitle>No products found</EmptyTitle>
              <EmptyDescription>
                {search || categoryFilter !== "all" || branchFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : noBranches
                    ? "Create a branch first, then add your first consumable product (coffee beans, milk, syrups, cups, ingredients)."
                    : "Add your first consumable product (coffee beans, milk, syrups, cups, ingredients)."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
          {!noBranches && (
            <Button
              type="button"
              onClick={openAddItemDialog}
              className="mt-4 rounded-lg bg-[#F36509] text-white hover:bg-[#d95a08]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[820px]">
            <TableHeader>
              <TableRow className="border-b border-stone-100 bg-stone-50/80 hover:bg-stone-50/80">
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Min. level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                >
                   <TableCell className="font-medium text-stone-900">
                     {item.name}
                   </TableCell>
                  <TableCell className="text-stone-600">
                    {item.category}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-stone-200 bg-stone-50 text-stone-600"
                    >
                      {item.branch_name ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-stone-900">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-stone-600">
                    {item.min_stock}
                  </TableCell>
                  <TableCell>
                    <StockStatusBadge item={item} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openMovementDialog(item)}
                        className="h-8 text-stone-600 hover:bg-stone-100"
                        title="Record stock in / out / adjustment"
                      >
                        <ArrowDownToLine className="mr-1 h-3.5 w-3.5" />
                        Stock
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openHistoryDialog(item)}
                        className="h-8 text-stone-600 hover:bg-stone-100"
                        title="Stock movement history"
                      >
                        <History className="mr-1 h-3.5 w-3.5" />
                        History
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditItemDialog(item)}
                        className="h-8 text-stone-600 hover:bg-stone-100"
                        title="Edit product"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Add / edit product dialog ─────────────────────── */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {editingItem ? "Edit Product" : "Add Product"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update product details. Quantity changes through stock movements."
                : "Register a consumable product for branch inventory."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Coffee Beans"
                maxLength={100}
              />
            </div>

             <div className="space-y-2">
               <Label htmlFor="item-price">Price</Label>
               <Input
                 id="item-price"
                 type="number"
                 min={0}
                 step="0.01"
                 value={formPrice}
                 onChange={(e) => setFormPrice(e.target.value)}
                 placeholder="0.00"
               />
             </div>

             <div className="space-y-2">
               <Label htmlFor="item-category">Category</Label>
              <select
                id="item-category"
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
                className={selectClassName}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {!editingItem && (
              <div className="space-y-2">
                <Label htmlFor="item-branch">Branch</Label>
                <select
                  id="item-branch"
                  value={formBranchId}
                  onChange={(e) => setFormBranchId(e.target.value)}
                  className={selectClassName}
                >
                  <option value="">Select a branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-stone-400">
                  Stock is tracked per branch.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="item-description">Description</Label>
              <textarea
                id="item-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description"
                maxLength={500}
                rows={3}
                className="flex w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#F36509]/50 focus:ring-2 focus:ring-[#F36509]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-area">Area</Label>
              <select
                id="item-area"
                value={formAreaCode}
                onChange={(e) => setFormAreaCode(e.target.value)}
                className={selectClassName}
              >
                <option value="">Select an area</option>
                <option value="ieat">ieat</option>
                <option value="idrink">idrink</option>
                <option value="iplay">iplay</option>
                <option value="iwork">iwork</option>
                <option value="istudy">istudy</option>
              </select>
            </div>

            {!editingItem && (
              <div className="space-y-2">
                <Label htmlFor="item-quantity">Current quantity</Label>
                <Input
                  id="item-quantity"
                  type="number"
                  min={0}
                  step={1}
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value)}
                />
                <p className="text-xs text-stone-400">
                  After creation, quantities change through stock in / out /
                  adjustments only.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="item-min-stock">Min. stock level</Label>
              <Input
                id="item-min-stock"
                type="number"
                min={0}
                step={1}
                value={formMinStock}
                onChange={(e) => setFormMinStock(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowItemDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitItemForm}
              disabled={
                 isSubmitting ||
                 !formName.trim() ||
                 !formPrice.trim() ||
                 !formCategoryId ||
                 (!editingItem && !formBranchId)
              }
              className="rounded-md bg-[#F36509] text-white hover:bg-[#d95a08]"
            >
              {isSubmitting
                ? "Saving..."
                : editingItem
                  ? "Save Changes"
                  : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Stock movement dialog ─────────────────────────── */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Record Stock Movement
            </DialogTitle>
            <DialogDescription>
              {movementItem
                ? `${movementItem.name}${movementItem.branch_name ? ` (${movementItem.branch_name})` : ""} — current quantity: ${movementItem.quantity}`
                : "Record a stock in, stock out, or adjustment."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="movement-action">Action</Label>
              <select
                id="movement-action"
                value={movementAction}
                onChange={(e) =>
                  setMovementAction(e.target.value as StockMovementAction)
                }
                className={selectClassName}
              >
                {ACTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement-quantity">
                Quantity ({isAdjustment ? "change" : "units"})
              </Label>
              <Input
                id="movement-quantity"
                type="number"
                min={1}
                step={1}
                value={movementQuantity}
                onChange={(e) => setMovementQuantity(e.target.value)}
                placeholder="0"
              />
              {movementAction === "stock_out" && movementItem && (
                <p className="text-xs text-stone-400">
                  Stock on hand: {movementItem.quantity}. Stock cannot go below
                  zero.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement-reason">
                Reason {isAdjustment && <span className="text-red-600">*</span>}
              </Label>
              <textarea
                id="movement-reason"
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                placeholder={
                  isAdjustment
                    ? "e.g. Spillage, inventory correction, wastage"
                    : "e.g. Supplier delivery, used for event"
                }
                maxLength={500}
                rows={3}
                className="flex w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#F36509]/50 focus:ring-2 focus:ring-[#F36509]/20"
              />
              {isAdjustment && (
                <p className="text-xs text-stone-400">
                  A reason is required for adjustments.
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMovementDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitMovementForm}
              disabled={
                isSubmitting ||
                !movementQuantity ||
                Number(movementQuantity) < 1 ||
                (isAdjustment && !movementReason.trim())
              }
              className="rounded-md bg-[#F36509] text-white hover:bg-[#d95a08]"
            >
              {isSubmitting
                ? "Recording..."
                : movementAction === "stock_in"
                  ? "Record Stock In"
                  : movementAction === "stock_out"
                    ? "Record Stock Out"
                    : "Record Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Stock history dialog ──────────────────────────── */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Stock Movement History
            </DialogTitle>
            <DialogDescription>
              {historyItem
                ? `${historyItem.name} — latest 200 movements`
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
            ) : stockHistory.length === 0 ? (
              <Empty className="border-none py-8">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Wallet className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>No movements yet</EmptyTitle>
                  <EmptyDescription>
                    Stock in, stock out, and adjustments will appear here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-2">
                {stockHistory.map((movement) => {
                  const isPositive = movement.quantity > 0;
                  return (
                    <div
                      key={movement.id}
                      className="rounded-xl border border-stone-200 bg-stone-50/60 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              movement.action === "stock_in"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : movement.action === "stock_out"
                                  ? "border-stone-200 bg-stone-100 text-stone-700"
                                  : "border-amber-200 bg-amber-50 text-amber-700"
                            }
                          >
                            {movement.action === "stock_in"
                              ? "Stock In"
                              : movement.action === "stock_out"
                                ? "Stock Out"
                                : "Adjustment"}
                          </Badge>
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              isPositive ? "text-emerald-700" : "text-red-700"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {movement.quantity}
                          </span>
                        </div>
                        <span className="text-xs text-stone-400">
                          {new Date(movement.created_at).toLocaleString()}
                        </span>
                      </div>
                      {movement.notes && (
                        <div className="mt-1.5">
                          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                            {movement.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
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
