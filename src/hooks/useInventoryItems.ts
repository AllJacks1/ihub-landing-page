"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createInventoryItem,
  getInventoryBranches,
  getInventoryCategories,
  getInventoryItems,
  getStockHistory,
  recordStockMovement,
  updateInventoryItem,
  type InventoryBranch,
  type InventoryCategory,
  type InventoryItem,
  type InventoryStockMovement,
} from "@/lib/inventory-actions";

export type StockMovementAction =
  | "stock_in"
  | "stock_out"
  | "adjust_increase"
  | "adjust_decrease";

export function useInventoryItems() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [branches, setBranches] = useState<InventoryBranch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  // Dialogs
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [stockHistory, setStockHistory] = useState<InventoryStockMovement[]>(
    [],
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [itemsResult, categoriesResult, branchesResult] = await Promise.all([
        getInventoryItems(),
        getInventoryCategories(),
        getInventoryBranches(),
      ]);

      if (itemsResult.success) {
        setItems(
          [...itemsResult.data].sort((a, b) => a.name.localeCompare(b.name)),
        );
      } else {
        setLoadError(itemsResult.error ?? "Failed to load inventory");
        toast.error(itemsResult.error ?? "Failed to load inventory");
      }

      if (categoriesResult.success) {
        setCategories(categoriesResult.data);
      }

      if (branchesResult.success) {
        setBranches(branchesResult.data);
      }
    } catch (error) {
      console.error("Failed to load inventory:", error);
      setLoadError("Failed to load inventory");
      toast.error("Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Client-side filtering (search + category + branch)
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      if (branchFilter !== "all" && item.branch_id !== branchFilter) {
        return false;
      }

      if (categoryFilter !== "all" && item.category_id !== categoryFilter) {
        return false;
      }

      if (!query) return true;

       return (
         item.name.toLowerCase().includes(query) ||
         item.category.toLowerCase().includes(query) ||
         (item.branch_name ?? "").toLowerCase().includes(query)
       );
    });
  }, [items, search, categoryFilter, branchFilter]);

  const stockSummary = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    for (const item of items) {
      if (item.quantity <= 0) outOfStock += 1;
      else if (item.min_stock > 0 && item.quantity <= item.min_stock)
        lowStock += 1;
      else inStock += 1;
    }

    return { inStock, lowStock, outOfStock };
  }, [items]);

  const openAddItemDialog = () => {
    setEditingItem(null);
    setShowItemDialog(true);
  };

  const openEditItemDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setShowItemDialog(true);
  };

  const handleSaveItem = async (values: {
    name: string;
    price: number | string;
    description: string;
    area_code: string;
    category_id: string;
    branch_id: string;
    quantity: number | string;
    min_stock: number | string;
  }) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
         const result = await updateInventoryItem({
           id: editingItem.id,
           name: values.name,
           category_id: values.category_id,
           description: values.description,
           area_code: values.area_code,
           min_stock: values.min_stock,
         });

        if (result.success) {
          toast.success("Item updated");
          setShowItemDialog(false);
          setEditingItem(null);
          await loadItems();
        } else {
          toast.error(result.error ?? "Failed to update item");
        }
      } else {
        const result = await createInventoryItem(values);

        if (result.success) {
          toast.success("Item added");
          setShowItemDialog(false);
          await loadItems();
        } else {
          toast.error(result.error ?? "Failed to add item");
        }
      }
    } catch (error) {
      console.error("Failed to save item:", error);
      toast.error(editingItem ? "Failed to update item" : "Failed to add item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMovementDialog = (item: InventoryItem) => {
    setMovementItem(item);
    setShowMovementDialog(true);
  };

  const handleRecordMovement = async (values: {
    action: StockMovementAction;
    quantity: number | string;
    reason: string;
  }) => {
    if (!movementItem) return;

    setIsSubmitting(true);
    try {
      const result = await recordStockMovement({
        itemId: movementItem.id,
        action: values.action,
        quantity: values.quantity,
        reason: values.reason || null,
      });

      if (result.success) {
        const label =
          values.action === "stock_in"
            ? "Stock in recorded"
            : values.action === "stock_out"
              ? "Stock out recorded"
              : "Stock adjusted";
        toast.success(
          `${label}${result.newBalance !== undefined ? ` — new quantity: ${result.newBalance}` : ""}`,
        );
        setShowMovementDialog(false);
        setMovementItem(null);
        await loadItems();
      } else {
        toast.error(result.error ?? "Failed to record movement");
      }
    } catch (error) {
      console.error("Failed to record movement:", error);
      toast.error("Failed to record movement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openHistoryDialog = async (item: InventoryItem) => {
    setHistoryItem(item);
    setShowHistoryDialog(true);
    setStockHistory([]);
    setIsLoadingHistory(true);
    try {
      const result = await getStockHistory(item.id);
      if (result.success) {
        setStockHistory(result.data);
      } else {
        toast.error(result.error ?? "Failed to load stock history");
      }
    } catch (error) {
      console.error("Failed to load stock history:", error);
      toast.error("Failed to load stock history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return {
    items: filteredItems,
    allItems: items,
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
  };
}
