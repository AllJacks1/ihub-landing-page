
import InventoryPage from "@/components/pages/InventoryPage";
import { requireInventoryStaff } from "@/lib/inventory-actions";

export default async function InventoryRoutePage({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireInventoryStaff();

  if (!staff.authorized) {
    return (
      <main className="p-8">
        <h1 className="text-xl font-bold">
          Inventory access check failed
        </h1>
        <p className="mt-4">{staff.error}</p>
      </main>
    );
  }

  return <InventoryPage>{children}</InventoryPage>;
}
