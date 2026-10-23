import { getMonitorData } from "@/lib/monitor-actions";
import { getCurrentUser } from "@/lib/actions";
import { STATION_UPDATE_ROLES } from "@/lib/monitor-types";
import { Suspense } from "react";
import MonitorCardComponent from "./monitor-card";
import { Loader } from "lucide-react";
import MonitorAutoRefresh from "@/components/MonitorAutoRefresh";

const STATION = "kitchen" as const;

const STATION_META = {
  kitchen: {
    label: "Kitchen Monitor",
    subtitle: "iEat — Food Orders",
    icon: "🍳",
    route: "/admin/pos/monitor/kitchen",
    updateRole: STATION_UPDATE_ROLES.kitchen.map((r) => r.role),
  },
} as const;

interface Props {}

export default async function MonitorPage(_props: Props) {
  const station = STATION;
  const meta = STATION_META[station];

  const user = await getCurrentUser();
  const userRole = user?.role ?? null;
  if (!userRole) {
    return (
      <main className="flex-1 p-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-stone-900">Access Denied</h1>
            <p className="mt-2 text-stone-500">You do not have permission to view this monitor.</p>
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

  const allowedRoles = meta.updateRole as string[];
  if (!allowedRoles.includes(userRole)) {
    return (
      <main className="flex-1 p-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-stone-900">Access Denied</h1>
            <p className="mt-2 text-stone-500">Your role ({userRole}) is not authorized to access the {meta.label}.</p>
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

  const result = await getMonitorData(station);

  const data = result.success && result.data ? result.data : undefined;
  const isLoading = false;

  return (
      <main className="flex-1 bg-stone-50">
      <MonitorAutoRefresh />
      <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-7xl flex-col p-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F36509] text-3xl">
              {meta.icon}
            </div>
            <div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
                {meta.label}
              </h1>
              <p className="text-sm text-stone-500">{meta.subtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 overflow-y-auto">
            {result && !result.success ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-600">
              <span className="text-4xl">??</span>
              <p className="mt-4 text-lg">Monitor failed to load</p>
              <p className="mt-1 text-sm">{result.error ?? "Unknown error"}</p>
            </div>
          ) : isLoading ? (
              <div className="flex items-center justify-center py-16">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#F36509] border-t-transparent" />
              </div>
            ) : data && data.unassignedItems.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold">Unassigned/invalid area items (not routed)</p>
                <ul className="mt-2 list-disc pl-5">
                  {data.unassignedItems.map((i) => (
                    <li key={i.itemId}>{i.productName} (order {i.orderNumber}) area: {i.areaCode ?? "missing"}</li>
                  ))}
                </ul>
              </div>
            ) : !data || data.orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-stone-500">
                <span className="text-4xl">📋</span>
                <p className="mt-4 text-lg">No eligible orders</p>
                <p className="mt-1 text-sm">Orders placed through the POS or QR will appear here.</p>
              </div>
            ) : (
              data.orders.map((card) => (
                <SuspenseFallback key={card.orderId}>
                  <MonitorCardComponent card={card} station={station} />
                </SuspenseFallback>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function StockCard({
  label,
  value,
  icon,
  accent = "stone",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: "stone" | "amber" | "red";
}) {
  const colors: Record<string, string> = {
    stone: "bg-stone-100 text-stone-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-xl p-3 ${colors[accent]}`}>{icon}</div>
        <div>
          <p className="text-xs text-stone-500">{label}</p>
          <p className="text-2xl font-semibold text-stone-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SuspenseFallback({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-16"><Loader className="h-8 w-8 animate-spin text-[#F36509]" /></div>}>
      {children}
    </Suspense>
  );
}
