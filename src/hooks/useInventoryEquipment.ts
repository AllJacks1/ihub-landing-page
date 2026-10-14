"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createInventoryEquipment,
  getEquipmentHistory,
  getInventoryEquipment,
  updateInventoryEquipment,
  type Department,
  type EquipmentCondition,
  type InventoryEquipment,
  type InventoryEquipmentHistory,
} from "@/lib/inventory-actions";

export function useInventoryEquipment() {
  const [equipment, setEquipment] = useState<InventoryEquipment[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState<
    "all" | Department
  >("all");

  // Dialogs
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false);
  const [editingEquipment, setEditingEquipment] =
    useState<InventoryEquipment | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyEquipment, setHistoryEquipment] =
    useState<InventoryEquipment | null>(null);
  const [equipmentHistory, setEquipmentHistory] = useState<
    InventoryEquipmentHistory[]
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadEquipment = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await getInventoryEquipment();

      if (result.success) {
        setEquipment(result.data);
        setCategories(
          Array.from(new Set(result.data.map((e) => e.category))).sort(),
        );
      } else {
        // Load failures (e.g. the equipment table not being
        // provisioned) are shown as an inline notice by the
        // section — no toast on every page load.
        setLoadError(result.error ?? "Failed to load equipment");
      }
    } catch (error) {
      console.error("Failed to load equipment:", error);
      setLoadError("Failed to load equipment");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  // Client-side filtering (search + category + Bar/Kitchen)
  const filteredEquipment = useMemo(() => {
    const query = search.trim().toLowerCase();

    return equipment.filter((item) => {
      if (
        departmentFilter !== "all" &&
        item.department !== departmentFilter
      ) {
        return false;
      }

      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      if (!query) return true;

      return (
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.notes ?? "").toLowerCase().includes(query)
      );
    });
  }, [equipment, search, categoryFilter, departmentFilter]);

  const openAddEquipmentDialog = () => {
    setEditingEquipment(null);
    setShowEquipmentDialog(true);
  };

  const openEditEquipmentDialog = (item: InventoryEquipment) => {
    setEditingEquipment(item);
    setShowEquipmentDialog(true);
  };

  const handleSaveEquipment = async (values: {
    name: string;
    category: string;
    department: Department;
    total_quantity: number | string;
    available_quantity: number | string;
    condition: EquipmentCondition;
    notes: string;
  }) => {
    setIsSubmitting(true);
    try {
      if (editingEquipment) {
        const result = await updateInventoryEquipment({
          id: editingEquipment.id,
          ...values,
        });

        if (result.success) {
          toast.success("Equipment updated");
          setShowEquipmentDialog(false);
          setEditingEquipment(null);
          await loadEquipment();
        } else {
          toast.error(result.error ?? "Failed to update equipment");
        }
      } else {
        const result = await createInventoryEquipment(values);

        if (result.success) {
          toast.success("Equipment registered");
          setShowEquipmentDialog(false);
          await loadEquipment();
        } else {
          toast.error(result.error ?? "Failed to register equipment");
        }
      }
    } catch (error) {
      console.error("Failed to save equipment:", error);
      toast.error(
        editingEquipment ? "Failed to update equipment" : "Failed to register equipment",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openHistoryDialog = async (item: InventoryEquipment) => {
    setHistoryEquipment(item);
    setShowHistoryDialog(true);
    setEquipmentHistory([]);
    setIsLoadingHistory(true);
    try {
      const result = await getEquipmentHistory(item.id);
      if (result.success) {
        setEquipmentHistory(result.data);
      } else {
        toast.error(result.error ?? "Failed to load equipment history");
      }
    } catch (error) {
      console.error("Failed to load equipment history:", error);
      toast.error("Failed to load equipment history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return {
    equipment: filteredEquipment,
    allEquipment: equipment,
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
  };
}
