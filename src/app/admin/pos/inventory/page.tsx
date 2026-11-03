
import InventoryPage from "@/components/pages/InventoryPage";
import { requireInventoryStaff } from "@/lib/inventory-actions";
import { getCurrentUser } from "@/lib/actions";

export default async function InventoryRoutePage({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireInventoryStaff();
  if (!staff.authorized) {
    return (
      <main className="p-8">
        <h1 className="text-xl font-bold">Inventory access check failed</h1>
        <p className="mt-4">{staff.error}</p>
      </main>
    );
  }

  const user = await getCurrentUser();
  const role = user?.role ?? null;
  if (!role || !["management", "partner", "crew"].includes(role)) {
    return (
      <main className="p-8">
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="mt-2 text-stone-500">
          You do not have permission to view Inventory.
        </p>
      </main>
    );
  }

  return <InventoryPage role={role}>{children}</InventoryPage>;
}
