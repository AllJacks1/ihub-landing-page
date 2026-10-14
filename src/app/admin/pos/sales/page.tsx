"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  Download,
  Filter,
  Package,
  RefreshCw,
  Search,
  Store,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─── Types ───────────────────────────────────────────────────────────────────

type SalesSummary = {
  totalSales: number;
  totalTransactions: number;
  averageTicket: number;
  totalItems: number;
};

type EmployeeSale = {
  id: string;
  name: string;
  role: string;
  sales: number;
  transactions: number;
  items: number;
  avgTicket: number;
};

type CategorySale = {
  id: string;
  name: string;
  sales: number;
  quantity: number;
  percentage: number;
};

type ProductSale = {
  id: string;
  name: string;
  category: string;
  sales: number;
  quantity: number;
  avgPrice: number;
};

type BranchSale = {
  id: string;
  name: string;
  sales: number;
  transactions: number;
  percentage: number;
};

type QuotaItem = {
  id: string;
  name: string;
  type: "employee" | "branch";
  target: number;
  actual: number;
  period: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-PH").format(value);
}

// ─── Mock data (replace with real API later) ─────────────────────────────────

const MOCK_SUMMARY: SalesSummary = {
  totalSales: 248750,
  totalTransactions: 186,
  averageTicket: 1337.37,
  totalItems: 412,
};

const MOCK_EMPLOYEES: EmployeeSale[] = [
  {
    id: "1",
    name: "Maria Santos",
    role: "Cashier",
    sales: 68200,
    transactions: 54,
    items: 128,
    avgTicket: 1262.96,
  },
  {
    id: "2",
    name: "Juan Dela Cruz",
    role: "Cashier",
    sales: 59450,
    transactions: 47,
    items: 105,
    avgTicket: 1264.89,
  },
  {
    id: "3",
    name: "Ana Reyes",
    role: "Supervisor",
    sales: 52100,
    transactions: 38,
    items: 92,
    avgTicket: 1371.05,
  },
  {
    id: "4",
    name: "Carlos Mendoza",
    role: "Cashier",
    sales: 41000,
    transactions: 32,
    items: 67,
    avgTicket: 1281.25,
  },
  {
    id: "5",
    name: "Liza Gomez",
    role: "Cashier",
    sales: 28000,
    transactions: 15,
    items: 20,
    avgTicket: 1866.67,
  },
];

const MOCK_CATEGORIES: CategorySale[] = [
  { id: "1", name: "Beverages", sales: 89400, quantity: 210, percentage: 35.9 },
  { id: "2", name: "Snacks", sales: 61200, quantity: 145, percentage: 24.6 },
  { id: "3", name: "Meals", sales: 54800, quantity: 38, percentage: 22.0 },
  { id: "4", name: "Dessert", sales: 28900, quantity: 52, percentage: 11.6 },
  { id: "5", name: "Others", sales: 14450, quantity: 17, percentage: 5.9 },
];

const MOCK_PRODUCTS: ProductSale[] = [
  {
    id: "1",
    name: "Iced Coffee",
    category: "Beverages",
    sales: 28400,
    quantity: 142,
    avgPrice: 200,
  },
  {
    id: "2",
    name: "Chicken Rice Meal",
    category: "Meals",
    sales: 22800,
    quantity: 19,
    avgPrice: 1200,
  },
  {
    id: "3",
    name: "French Fries",
    category: "Snacks",
    sales: 18600,
    quantity: 93,
    avgPrice: 200,
  },
  {
    id: "4",
    name: "Chocolate Cake Slice",
    category: "Dessert",
    sales: 15200,
    quantity: 38,
    avgPrice: 400,
  },
  {
    id: "5",
    name: "Bottled Water",
    category: "Beverages",
    sales: 12400,
    quantity: 124,
    avgPrice: 100,
  },
  {
    id: "6",
    name: "Burger Combo",
    category: "Meals",
    sales: 11800,
    quantity: 8,
    avgPrice: 1475,
  },
];

const MOCK_BRANCHES: BranchSale[] = [
  {
    id: "1",
    name: "Main Branch",
    sales: 142300,
    transactions: 98,
    percentage: 57.2,
  },
  {
    id: "2",
    name: "SM Mall Branch",
    sales: 68400,
    transactions: 52,
    percentage: 27.5,
  },
  {
    id: "3",
    name: "Airport Kiosk",
    sales: 38050,
    transactions: 36,
    percentage: 15.3,
  },
];

const MOCK_QUOTAS: QuotaItem[] = [
  {
    id: "1",
    name: "Maria Santos",
    type: "employee",
    target: 80000,
    actual: 68200,
    period: "October 2026",
  },
  {
    id: "2",
    name: "Juan Dela Cruz",
    type: "employee",
    target: 70000,
    actual: 59450,
    period: "October 2026",
  },
  {
    id: "3",
    name: "Ana Reyes",
    type: "employee",
    target: 60000,
    actual: 52100,
    period: "October 2026",
  },
  {
    id: "4",
    name: "Main Branch",
    type: "branch",
    target: 200000,
    actual: 142300,
    period: "October 2026",
  },
  {
    id: "5",
    name: "SM Mall Branch",
    type: "branch",
    target: 90000,
    actual: 68400,
    period: "October 2026",
  },
  {
    id: "6",
    name: "Airport Kiosk",
    type: "branch",
    target: 50000,
    actual: 38050,
    period: "October 2026",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

type Tab = "employee" | "category" | "product" | "branch" | "quota";

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("employee");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("this-month");

  // Simulate loading
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "employee",
      label: "By Employee",
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: "category",
      label: "By Category",
      icon: <Layers className="h-4 w-4" />,
    },
    {
      id: "product",
      label: "By Product",
      icon: <Package className="h-4 w-4" />,
    },
    { id: "branch", label: "By Branch", icon: <Store className="h-4 w-4" /> },
    { id: "quota", label: "Sales Quota", icon: <Target className="h-4 w-4" /> },
  ];

  // Filtered data
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return MOCK_EMPLOYEES;
    return MOCK_EMPLOYEES.filter(
      (e) =>
        e.name.toLowerCase().includes(q) || e.role.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return MOCK_PRODUCTS;
    return MOCK_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const filteredQuotas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return MOCK_QUOTAS;
    return MOCK_QUOTAS.filter((qItem) => qItem.name.toLowerCase().includes(q));
  }, [searchQuery]);

  function getQuotaProgress(actual: number, target: number) {
    return Math.min(100, Math.round((actual / target) * 100));
  }

  function getQuotaColor(progress: number) {
    if (progress >= 100) return "bg-emerald-500";
    if (progress >= 75) return "bg-[#F36509]";
    if (progress >= 50) return "bg-amber-500";
    return "bg-stone-300";
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col bg-stone-50">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F36509]">
              Analytics
            </p>
            <h1 className="mt-1 font-serif text-xl font-semibold text-stone-900 sm:text-2xl">
              Sales Report
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Track performance across employees, products, branches & quotas
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date range */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="h-11 appearance-none rounded-xl border border-stone-200 bg-white pl-10 pr-10 text-sm font-medium text-stone-800 outline-none focus:border-[#F36509]/50 focus:ring-2 focus:ring-[#F36509]/20"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-stone-200"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-stone-200"
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 500);
              }}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6">
        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="border-stone-200 bg-white">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  Total Sales
                </p>
                <div className="rounded-lg bg-orange-50 p-2">
                  <TrendingUp className="h-4 w-4 text-[#F36509]" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-stone-900">
                {isLoading ? "—" : formatCurrency(MOCK_SUMMARY.totalSales)}
              </p>
              <p className="mt-1 text-xs text-emerald-600">
                +12.4% vs last period
              </p>
            </CardContent>
          </Card>

          <Card className="border-stone-200 bg-white">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  Transactions
                </p>
                <div className="rounded-lg bg-stone-100 p-2">
                  <BarChart3 className="h-4 w-4 text-stone-500" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-stone-900">
                {isLoading ? "—" : formatNumber(MOCK_SUMMARY.totalTransactions)}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Avg {formatCurrency(MOCK_SUMMARY.averageTicket)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-stone-200 bg-white">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  Items Sold
                </p>
                <div className="rounded-lg bg-stone-100 p-2">
                  <Package className="h-4 w-4 text-stone-500" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-stone-900">
                {isLoading ? "—" : formatNumber(MOCK_SUMMARY.totalItems)}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Across all categories
              </p>
            </CardContent>
          </Card>

          <Card className="border-stone-200 bg-white">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                  Avg Ticket
                </p>
                <div className="rounded-lg bg-stone-100 p-2">
                  <Target className="h-4 w-4 text-stone-500" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-stone-900">
                {isLoading ? "—" : formatCurrency(MOCK_SUMMARY.averageTicket)}
              </p>
              <p className="mt-1 text-xs text-stone-500">Per transaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs + Search */}
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery("");
                }}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#F36509] text-white"
                    : "text-stone-600 hover:bg-stone-50"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {(activeTab === "employee" ||
            activeTab === "product" ||
            activeTab === "quota") && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === "employee"
                    ? "Search employee..."
                    : activeTab === "product"
                      ? "Search product..."
                      : "Search name..."
                }
                className="h-10 rounded-xl border-stone-200 bg-white pl-10"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <Card className="border-stone-200 bg-white">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="h-6 w-6 animate-spin text-[#F36509]" />
                <p className="mt-4 text-sm font-medium text-stone-900">
                  Loading sales data...
                </p>
              </div>
            ) : (
              <>
                {/* ── By Employee ── */}
                {activeTab === "employee" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-stone-100 bg-stone-50/80">
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Employee
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Role
                          </th>
                          <th className="px-5 py-3.5 text-right font-medium text-stone-500">
                            Sales
                          </th>
                          <th className="px-5 py-3.5 text-right font-medium text-stone-500">
                            Txns
                          </th>
                          <th className="px-5 py-3.5 text-right font-medium text-stone-500">
                            Items
                          </th>
                          <th className="px-5 py-3.5 text-right font-medium text-stone-500">
                            Avg Ticket
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-5 py-12 text-center text-stone-500"
                            >
                              No employees found
                            </td>
                          </tr>
                        ) : (
                          filteredEmployees.map((emp) => (
                            <tr
                              key={emp.id}
                              className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                            >
                              <td className="px-5 py-4 font-medium text-stone-900">
                                {emp.name}
                              </td>
                              <td className="px-5 py-4 text-stone-500">
                                {emp.role}
                              </td>
                              <td className="px-5 py-4 text-right font-semibold text-stone-900">
                                {formatCurrency(emp.sales)}
                              </td>
                              <td className="px-5 py-4 text-right text-stone-600">
                                {emp.transactions}
                              </td>
                              <td className="px-5 py-4 text-right text-stone-600">
                                {emp.items}
                              </td>
                              <td className="px-5 py-4 text-right text-stone-600">
                                {formatCurrency(emp.avgTicket)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── By Category ── */}
                {activeTab === "category" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-stone-100 bg-stone-50/80">
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Category
                          </th>
                          <th className="px-5 py-3.5 text-right font-medium text-stone-500">
                            Sales
                          </th>
                          <th className="px-5 py-3.5 text-right font-medium text-stone-500">
                            Qty Sold
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Share
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_CATEGORIES.map((cat) => (
                          <tr
                            key={cat.id}
                            className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                          >
                            <td className="px-5 py-4 font-medium text-stone-900">
                              {cat.name}
                            </td>
                            <td className="px-5 py-4 text-right font-semibold text-stone-900">
                              {formatCurrency(cat.sales)}
                            </td>
                            <td className="px-5 py-4 text-right text-stone-600">
                              {cat.quantity}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                                  <div
                                    className="h-full rounded-full bg-[#F36509]"
                                    style={{ width: `${cat.percentage}%` }}
                                  />
                                </div>
                                <span className="w-12 text-right text-xs text-stone-500">
                                  {cat.percentage}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── By Product ── */}
                {activeTab === "product" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-stone-100 bg-stone-50/80">
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Product
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Category
                          </th>
                          <th className="px-5 py-3.5 text-right font-medium text-stone-500">
                            Sales
                          </th>
                          <th className="px-5 py-3.5 text-right font-medium text-stone-500">
                            Qty
                          </th>
                          <th className="px-5 py-3.5 text-right font-medium text-stone-500">
                            Avg Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-5 py-12 text-center text-stone-500"
                            >
                              No products found
                            </td>
                          </tr>
                        ) : (
                          filteredProducts.map((prod) => (
                            <tr
                              key={prod.id}
                              className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                            >
                              <td className="px-5 py-4 font-medium text-stone-900">
                                {prod.name}
                              </td>
                              <td className="px-5 py-4">
                                <Badge
                                  variant="outline"
                                  className="border-stone-200 bg-stone-50 text-stone-600"
                                >
                                  {prod.category}
                                </Badge>
                              </td>
                              <td className="px-5 py-4 text-right font-semibold text-stone-900">
                                {formatCurrency(prod.sales)}
                              </td>
                              <td className="px-5 py-4 text-right text-stone-600">
                                {prod.quantity}
                              </td>
                              <td className="px-5 py-4 text-right text-stone-600">
                                {formatCurrency(prod.avgPrice)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── By Branch ── */}
                {activeTab === "branch" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-stone-100 bg-stone-50/80">
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Branch
                          </th>
                          <th className="px-5 py-3.5 text-right font-medium text-stone-500">
                            Sales
                          </th>
                          <th className="px-5 py-3.5 text-right font-medium text-stone-500">
                            Transactions
                          </th>
                          <th className="px-5 py-3.5 font-medium text-stone-500">
                            Share
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {MOCK_BRANCHES.map((branch) => (
                          <tr
                            key={branch.id}
                            className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50"
                          >
                            <td className="px-5 py-4 font-medium text-stone-900">
                              {branch.name}
                            </td>
                            <td className="px-5 py-4 text-right font-semibold text-stone-900">
                              {formatCurrency(branch.sales)}
                            </td>
                            <td className="px-5 py-4 text-right text-stone-600">
                              {branch.transactions}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                                  <div
                                    className="h-full rounded-full bg-[#F36509]"
                                    style={{ width: `${branch.percentage}%` }}
                                  />
                                </div>
                                <span className="w-12 text-right text-xs text-stone-500">
                                  {branch.percentage}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── Sales Quota ── */}
                {activeTab === "quota" && (
                  <div className="divide-y divide-stone-100">
                    {filteredQuotas.length === 0 ? (
                      <div className="px-5 py-12 text-center text-stone-500">
                        No quotas found
                      </div>
                    ) : (
                      filteredQuotas.map((item) => {
                        const progress = getQuotaProgress(
                          item.actual,
                          item.target,
                        );
                        return (
                          <div
                            key={item.id}
                            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-stone-900">
                                  {item.name}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={
                                    item.type === "employee"
                                      ? "border-blue-200 bg-blue-50 text-blue-700"
                                      : "border-purple-200 bg-purple-50 text-purple-700"
                                  }
                                >
                                  {item.type}
                                </Badge>
                              </div>
                              <p className="mt-0.5 text-xs text-stone-500">
                                Target: {formatCurrency(item.target)} ·{" "}
                                {item.period}
                              </p>
                            </div>

                            <div className="w-full sm:w-72">
                              <div className="mb-1.5 flex items-center justify-between text-xs">
                                <span className="font-medium text-stone-700">
                                  {formatCurrency(item.actual)}
                                </span>
                                <span
                                  className={
                                    progress >= 100
                                      ? "font-semibold text-emerald-600"
                                      : "text-stone-500"
                                  }
                                >
                                  {progress}%
                                </span>
                              </div>
                              <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
                                <div
                                  className={`h-full rounded-full transition-all ${getQuotaColor(progress)}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
