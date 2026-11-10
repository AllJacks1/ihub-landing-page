import { getCurrentUser } from "@/lib/actions";
import { getBranchExpenses } from "@/lib/expense-actions";
import ReportsClient from "./reports-client";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  const userRole = user?.role ?? null;

  if (
    !userRole ||
    !["management", "partner", "crew", "admin"].includes(userRole)
  ) {
    return (
      <main className="flex-1 p-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-stone-900">Access Denied</h1>
            <p className="mt-2 text-stone-500">
              You do not have permission to view Reports.
            </p>
            <a
              href="/admin"
              className="mt-4 inline-flex items-center rounded-md bg-[#F36509] px-4 py-2 text-sm font-medium text-white hover:bg-[#d95a08]"
            >
              Back to Admin
            </a>
          </div>
        </div>
      </main>
    );
  }

  const expensesResult = await getBranchExpenses({ limit: 200 });
  const expenses =
    expensesResult.success && expensesResult.data ? expensesResult.data : [];

  return <ReportsClient expenses={expenses} />;
}
