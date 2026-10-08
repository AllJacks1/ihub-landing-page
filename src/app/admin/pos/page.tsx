import {
  ShoppingCart,
  Receipt,
  Package,
  Users,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const stats = [
  {
    title: "Today's Sales",
    value: "₱0.00",
    description: "Total sales today",
    icon: Receipt,
  },
  {
    title: "Orders Today",
    value: "0",
    description: "Completed orders",
    icon: ShoppingCart,
  },
  {
    title: "Low Stock",
    value: "0",
    description: "Products need attention",
    icon: AlertTriangle,
  },
  {
    title: "Active Shift",
    value: "None",
    description: "No cashier shift is open",
    icon: Clock,
  },
];

const quickActions = [
  {
    title: "Primary Terminal",
    description: "Start a regular POS transaction",
    href: "/admin/pos/terminal/primary",
    icon: ShoppingCart,
  },
  {
    title: "Reservation Terminal",
    description: "Process a reservation order",
    href: "/admin/pos/terminal/reservation",
    icon: Users,
  },
  {
    title: "Inventory",
    description: "Check products and stock",
    href: "/admin/pos/inventory/branch",
    icon: Package,
  },
  {
    title: "Sales Monitoring",
    description: "View current sales activity",
    href: "/admin/pos/monitoring/sales",
    icon: TrendingUp,
  },
];

export default function PosDashboardPage() {
  return (
    <main className="flex-1 p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#F36509]">Point of Sale</p>

          <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-stone-900">
            POS Dashboard
          </h1>

          <p className="mt-1.5 text-sm text-stone-500">
            Manage sales, terminals, inventory, and cashier activity.
          </p>
        </div>

        <Button
          className="bg-[#F36509] text-white hover:bg-[#d95a08]"
          asChild
        >
          <a href="/admin/pos/terminal/primary">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Open Terminal
          </a>
        </Button>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.title}
              className="border-stone-200 bg-white transition-shadow hover:shadow-sm"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                      {stat.title}
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-stone-900">
                      {stat.value}
                    </p>

                    <p className="mt-1 text-xs text-stone-500">
                      {stat.description}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#F36509]/10 p-3">
                    <Icon className="h-5 w-5 text-[#F36509]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Sections */}
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Quick Actions */}
        <Card className="border-stone-200 bg-white">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-stone-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-stone-500">
              Start common POS tasks quickly.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <a
                    key={action.title}
                    href={action.href}
                    className="group rounded-xl border border-stone-200 p-4 transition-all hover:border-[#F36509]/40 hover:bg-stone-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-lg bg-stone-100 p-2.5 transition-colors group-hover:bg-[#F36509]/10">
                        <Icon className="h-5 w-5 text-stone-600 group-hover:text-[#F36509]" />
                      </div>

                      <ArrowUpRight className="h-4 w-4 text-stone-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#F36509]" />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-stone-900">
                      {action.title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      {action.description}
                    </p>
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Shift */}
        <Card className="border-stone-200 bg-white">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-stone-900">
              Current Shift
            </h2>

            <p className="mt-1 text-sm text-stone-500">
              Cashier shift status
            </p>

            <div className="mt-5 rounded-xl border border-dashed border-stone-200 bg-stone-50 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <Clock className="h-5 w-5 text-stone-400" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-stone-900">
                No Active Shift
              </h3>

              <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-stone-500">
                Open a cashier shift before processing POS transactions.
              </p>

              <Button
                variant="outline"
                className="mt-4 border-stone-200"
                asChild
              >
                <a href="/admin/pos/end-shift">Manage Shift</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview Cards */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card className="border-stone-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-stone-100 p-2.5">
                <Package className="h-5 w-5 text-stone-600" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-stone-900">
                  Inventory
                </h2>

                <p className="text-xs text-stone-500">
                  Stock overview
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-stone-50 p-4">
                <p className="text-xs text-stone-500">Products</p>
                <p className="mt-1 text-xl font-semibold text-stone-900">
                  0
                </p>
              </div>

              <div className="rounded-xl bg-stone-50 p-4">
                <p className="text-xs text-stone-500">Out of Stock</p>
                <p className="mt-1 text-xl font-semibold text-stone-900">
                  0
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-stone-100 p-2.5">
                <TrendingUp className="h-5 w-5 text-stone-600" />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-stone-900">
                  Sales Overview
                </h2>

                <p className="text-xs text-stone-500">
                  Sales analytics
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-stone-50 p-4">
              <p className="text-xs text-stone-500">Today's Revenue</p>

              <p className="mt-1 text-2xl font-semibold text-stone-900">
                ₱0.00
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
