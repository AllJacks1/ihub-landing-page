
"use client";

import { useState, type ReactNode } from "react";
import { Package, Wrench } from "lucide-react";

import InventoryProductsSection from "@/components/pages/InventoryProductsSection";
import InventoryEquipmentSection from "@/components/pages/InventoryEquipmentSection";
import { useInventoryItems } from "@/hooks/useInventoryItems";
import { useInventoryEquipment } from "@/hooks/useInventoryEquipment";

type InventoryPageProps = {
  children?: ReactNode;
};

type InventoryTab = "products" | "equipment";

export default function InventoryPage({
  children,
}: InventoryPageProps) {
  const [activeTab, setActiveTab] = useState<InventoryTab>("products");

  const products = useInventoryItems();
  const equipment = useInventoryEquipment();

  return (
    <main className="min-h-0 space-y-6">
      <div>
        <p className="text-sm font-medium text-[#F36509]">
          iHUB Admin / POS
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-stone-900">
          Inventory Management
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Manage consumable products and reusable equipment separately
          for the Bar and Kitchen.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Inventory sections"
        className="flex flex-wrap gap-2 border-b border-stone-200"
      >
        <button
          id="inventory-products-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === "products"}
          aria-controls="inventory-products-panel"
          onClick={() => setActiveTab("products")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "products"
              ? "border-[#F36509] text-[#F36509]"
              : "border-transparent text-stone-500 hover:text-stone-900"
          }`}
        >
          <Package className="h-4 w-4" />
          Products
        </button>

        <button
          id="inventory-equipment-tab"
          type="button"
          role="tab"
          aria-selected={activeTab === "equipment"}
          aria-controls="inventory-equipment-panel"
          onClick={() => setActiveTab("equipment")}
          className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "equipment"
              ? "border-[#F36509] text-[#F36509]"
              : "border-transparent text-stone-500 hover:text-stone-900"
          }`}
        >
          <Wrench className="h-4 w-4" />
          Equipment
        </button>
      </div>

      {activeTab === "products" ? (
        <section
          id="inventory-products-panel"
          role="tabpanel"
          aria-labelledby="inventory-products-tab"
          className="min-w-0"
        >
          <InventoryProductsSection {...products} />
        </section>
      ) : (
        <section
          id="inventory-equipment-panel"
          role="tabpanel"
          aria-labelledby="inventory-equipment-tab"
          className="min-w-0"
        >
          <InventoryEquipmentSection {...equipment} />
        </section>
      )}

      {children}
    </main>
  );
}
