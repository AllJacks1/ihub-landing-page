"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  RefreshCw,
  Receipt,
  ChevronDown,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getOrdersByClientId,
  getCrmUser,
  type SessionOrder,
} from "@/lib/order-actions";

const PAGE_SIZE = 10;

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

const statusColor: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-stone-100 text-stone-700 border-stone-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function ClientOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.userId as string;

  const [orders, setOrders] = useState<SessionOrder[]>([]);
  const [customerName, setCustomerName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);
    try {
      // Load orders + customer in parallel
      const [ordersResult, userResult] = await Promise.all([
        getOrdersByClientId(clientId),
        getCrmUser?.(clientId).catch(() => null), // optional – remove if you don't have it
      ]);

      if (ordersResult.success) {
        setOrders(ordersResult.data);
        setPage(1); // reset to first page on refresh
      } else {
        toast.error(ordersResult.error ?? "Failed to load transactions");
        setOrders([]);
      }

      // Handle customer name
      if (userResult?.success && userResult.data) {
        setCustomerName(userResult.data.firstname ?? "Customer");
      } else {
        // Fallback: try to get name from the first order or just show generic
        setCustomerName("Customer");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return orders.slice(start, start + PAGE_SIZE);
  }, [orders, page]);

  const from = orders.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, orders.length);

  function toggleExpand(orderId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }

  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 shrink-0"
              onClick={() => router.push("/admin/pos/crm")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#F36509]">
                CRM · Transactions
              </p>
              <h1 className="mt-1 font-serif text-xl font-semibold text-stone-900 sm:text-2xl">
                {customerName || "Customer"} Orders
              </h1>
              <p className="mt-1 text-sm text-stone-500">
                All orders linked to this customer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-stone-200 bg-stone-50 text-stone-700"
            >
              {orders.length} order{orders.length !== 1 ? "s" : ""}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              className="border-stone-200"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-stone-50 p-4 sm:p-6">
        <div className="mx-auto max-w-5xl space-y-4">
          {isLoading ? (
            <Card className="border-stone-200 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <RefreshCw className="h-6 w-6 animate-spin text-[#F36509]" />
                <p className="mt-4 text-sm font-medium text-stone-900">
                  Loading transactions…
                </p>
              </CardContent>
            </Card>
          ) : orders.length === 0 ? (
            <Card className="border-stone-200 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-stone-100 p-4">
                  <Receipt className="h-6 w-6 text-stone-400" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-stone-900">
                  No transactions yet
                </h3>
                <p className="mt-1 max-w-sm text-sm text-stone-500">
                  This customer has no orders linked to their account.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                {/* Header */}
                <div className="hidden grid-cols-[40px_140px_110px_100px_1fr_120px] gap-3 border-b border-stone-100 bg-stone-50/80 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-stone-400 sm:grid">
                  <span></span>
                  <span>Order #</span>
                  <span>Status</span>
                  <span>Payment</span>
                  <span>Date</span>
                  <span className="text-right">Total</span>
                </div>

                <ul className="divide-y divide-stone-100">
                  {paginatedOrders.map((order) => {
                    const isExpanded = expandedIds.has(order.id);
                    const hasItems = order.items && order.items.length > 0;

                    return (
                      <li key={order.id}>
                        {/* Main row – clickable */}
                        <button
                          type="button"
                          onClick={() => hasItems && toggleExpand(order.id)}
                          className={`grid w-full grid-cols-1 gap-2 px-4 py-3 text-left transition-colors hover:bg-stone-50 sm:grid-cols-[40px_140px_110px_100px_1fr_120px] sm:items-center sm:gap-3 ${
                            hasItems ? "cursor-pointer" : "cursor-default"
                          }`}
                        >
                          {/* Expand icon */}
                          <div className="hidden sm:flex sm:items-center">
                            {hasItems ? (
                              isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-stone-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-stone-400" />
                              )
                            ) : (
                              <span className="w-4" />
                            )}
                          </div>

                          {/* Order number */}
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-stone-900">
                              {order.order_number ?? order.id.slice(0, 8)}
                            </span>
                            {/* Mobile expand indicator */}
                            {hasItems && (
                              <span className="sm:hidden">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-stone-400" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-stone-400" />
                                )}
                              </span>
                            )}
                          </div>

                          {/* Status */}
                          <div>
                            <Badge
                              variant="outline"
                              className={`capitalize ${statusColor[order.status] ?? "bg-stone-50 text-stone-600"}`}
                            >
                              {order.status.replace("_", " ")}
                            </Badge>
                          </div>

                          {/* Payment */}
                          <div className="text-sm text-stone-600">
                            {order.payment_method ? (
                              <span className="inline-flex items-center gap-1">
                                <CreditCard className="h-3.5 w-3.5 text-stone-400" />
                                {order.payment_method}
                              </span>
                            ) : (
                              "—"
                            )}
                          </div>

                          {/* Date */}
                          <div className="text-sm text-stone-600">
                            {formatDateTime(order.created_at)}
                          </div>

                          {/* Total */}
                          <div className="text-right text-sm font-semibold text-stone-900">
                            {formatMoney(order.total_amount)}
                          </div>
                        </button>

                        {/* Expanded items */}
                        {isExpanded && hasItems && (
                          <div className="border-t border-stone-50 bg-stone-50/50 px-4 py-3 sm:px-6">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-xs font-medium uppercase tracking-wider text-stone-400">
                                    <th className="pb-2 pr-4">Item</th>
                                    <th className="pb-2 pr-4 text-right">
                                      Qty
                                    </th>
                                    <th className="pb-2 pr-4 text-right">
                                      Unit
                                    </th>
                                    <th className="pb-2 text-right">
                                      Line Total
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                  {order.items!.map((item) => (
                                    <tr key={item.id}>
                                      <td className="py-2 pr-4">
                                        <div className="flex items-center gap-2">
                                          <span className="text-stone-800">
                                            {item.product_name}
                                          </span>
                                          {item.area_code && (
                                            <span className="rounded bg-stone-200/60 px-1.5 py-0.5 text-[10px] font-medium uppercase text-stone-500">
                                              {item.area_code}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2 pr-4 text-right text-stone-600">
                                        {item.quantity}
                                      </td>
                                      <td className="py-2 pr-4 text-right text-stone-600">
                                        {formatMoney(item.unit_price)}
                                      </td>
                                      <td className="py-2 text-right font-medium text-stone-800">
                                        {formatMoney(item.line_total)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Order totals summary */}
                            <div className="mt-3 flex flex-wrap justify-end gap-x-4 gap-y-1 border-t border-stone-200/60 pt-3 text-xs text-stone-500">
                              {order.subtotal != null && (
                                <span>
                                  Subtotal {formatMoney(order.subtotal)}
                                </span>
                              )}
                              {(order.discount_amount ?? 0) > 0 && (
                                <span className="text-emerald-700">
                                  Discount −
                                  {formatMoney(order.discount_amount!)}
                                </span>
                              )}
                              {order.service_charge != null &&
                                order.service_charge > 0 && (
                                  <span>
                                    SC {formatMoney(order.service_charge)}
                                  </span>
                                )}
                              {order.tax_amount != null &&
                                order.tax_amount > 0 && (
                                  <span>
                                    VAT {formatMoney(order.tax_amount)}
                                  </span>
                                )}
                              <span className="font-semibold text-stone-800">
                                Total {formatMoney(order.total_amount)}
                              </span>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Pagination */}
              <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-sm text-stone-500">
                  Showing{" "}
                  <span className="font-medium text-stone-700">
                    {from}–{to}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-stone-700">
                    {orders.length}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-stone-200"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="min-w-[5rem] text-center text-sm text-stone-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-stone-200"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
