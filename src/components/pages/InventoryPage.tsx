"use client";

import { useState, useCallback, type ReactNode } from "react";
import { Package, Wrench } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import InventoryProductsSection from "@/components/pages/InventoryProductsSection";
import InventoryEquipmentSection from "@/components/pages/InventoryEquipmentSection";
import { useInventoryItems } from "@/hooks/useInventoryItems";
import { useInventoryEquipment } from "@/hooks/useInventoryEquipment";

type InventoryPageProps = {
  children?: ReactNode;
};

type InventoryTab = "products" | "equipment";

const TABS: {
  id: InventoryTab;
  label: string;
  icon: typeof Package;
}[] = [
  { id: "products", label: "Products", icon: Package },
  { id: "equipment", label: "Equipment", icon: Wrench },
];

export default function InventoryPage({ children }: InventoryPageProps) {
  const [activeTab, setActiveTab] = useState<InventoryTab>("products");

  const products = useInventoryItems();
  const equipment = useInventoryEquipment();

  const counts: Record<InventoryTab, number | undefined> = {
    products: products?.items?.length,
    equipment: equipment?.allEquipment?.length,
  };

  const handleTabKeyDown = useCallback((e: React.KeyboardEvent) => {
    const keys: Record<string, InventoryTab> = {
      ArrowLeft: "products",
      ArrowRight: "equipment",
      Home: "products",
      End: "equipment",
    };
    const next = keys[e.key];
    if (next) {
      e.preventDefault();
      setActiveTab(next);
      document.getElementById(`inventory-${next}-tab`)?.focus();
    }
  }, []);

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col bg-stone-50">
      {/* Header — matches Sales page */}
      <div className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#F36509]">
          iHUB Admin / POS
        </p>
        <h1 className="mt-1 font-serif text-xl font-semibold text-stone-900 sm:text-2xl">
          Inventory Management
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage consumable products and reusable equipment separately for the
          Bar and Kitchen.
        </p>
      </div>

      <div className="flex-1 p-4 sm:p-6">
        {/* Segmented tab control — matches Sales page tab style */}
        <div className="mb-4">
          <div
            role="tablist"
            aria-label="Inventory sections"
            onKeyDown={handleTabKeyDown}
            className="flex w-full gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1 sm:w-fit"
          >
            {TABS.map(({ id, label, icon: Icon }) => {
              const selected = activeTab === id;
              const count = counts[id];
              return (
                <button
                  key={id}
                  id={`inventory-${id}-tab`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`inventory-${id}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(id)}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F36509]/40 ${
                    selected
                      ? "bg-[#F36509] text-white"
                      : "text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {typeof count === "number" && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                        selected
                          ? "bg-white/20 text-white"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content card — matches Sales page table card */}
        <Card className="border-stone-200 bg-white">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>

        {children}
      </div>
    </main>
  );
}
