"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Package,
  X,
  Trash2,
  QrCode,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Receipt,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getPosProducts,
  getPosCategories,
  getPosSessionByToken,
  type PosProduct,
} from "@/lib/pos-actions";
import {
  createQrOrder,
  getOrdersBySessionToken,
  type SessionOrder,
} from "@/lib/order-actions";

type CartItem = PosProduct & { quantity: number };

const REQUIRED_CATEGORIES = [
  "Food",
  "Beverages",
  "iSTUDY",
  "iWORK",
  "Equipment",
  "Printing & Services",
] as const;

type Category = (typeof REQUIRED_CATEGORIES)[number];

const BRAND = "#F36508";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700";
    case "ready":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "in_progress":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-stone-200 bg-stone-50 text-stone-700";
  }
}

/* ── Skeletons ─────────────────────────────────────────────────────────── */
function MenuSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-stone-200/80 bg-white"
        >
          <div className="h-36 bg-stone-200/70" />
          <div className="space-y-3 p-4">
            <div className="flex justify-between gap-4">
              <div className="h-4 w-2/3 rounded bg-stone-200" />
              <div className="h-4 w-14 rounded bg-orange-100" />
            </div>
            <div className="h-3 w-full rounded bg-stone-200/80" />
            <div className="h-9 w-full rounded-xl bg-stone-200/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200/80">
        <Icon className="h-8 w-8 text-stone-300" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-stone-900">{title}</h3>
      <div className="mt-1.5 max-w-sm text-sm text-stone-500">{body}</div>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────────────────────── */
export default function MenuInner() {
  const searchParams = useSearchParams();
  const sessionToken = searchParams.get("session");

  const [products, setProducts] = useState<PosProduct[]>([]);
  const [categories, setCategories] = useState<Array<Category | "All">>([
    "All",
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">(
    "All",
  );
  const [selectedArea, setSelectedArea] = useState<string | "All">("All");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<{
    orderNumber?: string;
    total: number;
    updatedExisting?: boolean;
  } | null>(null);

  const [session, setSession] = useState<{
    valid: boolean;
    expired: boolean;
    table_number?: string | null;
    room_name?: string | null;
    cubicle_name?: string | null;
  } | null>(null);
  const [isValidatingSession, setIsValidatingSession] = useState(false);

  const canOrder = Boolean(sessionToken && session?.valid && !session?.expired);

  const [orders, setOrders] = useState<SessionOrder[]>([]);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  /* ── Data loading ──────────────────────────────────────────────────── */
  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        getPosProducts(),
        getPosCategories(),
      ]);
      if (productsResult.success) {
        setProducts(productsResult.data);
      } else {
        setError(productsResult.error ?? "Failed to load products");
      }
      if (categoriesResult.success) {
        const available = new Set(categoriesResult.data.map((c) => c.name));
        setCategories([
          "All",
          ...REQUIRED_CATEGORIES.filter((c) => available.has(c)),
        ]);
      } else if (!productsResult.success) {
        console.error(categoriesResult.error);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadOrders() {
    if (!sessionToken) {
      setOrders([]);
      return;
    }
    setIsLoadingOrders(true);
    try {
      const result = await getOrdersBySessionToken(sessionToken);
      setOrders(result.success ? result.data : []);
    } catch {
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  }

  async function validateSession() {
    if (!sessionToken) {
      setSession(null);
      return;
    }
    setIsValidatingSession(true);
    try {
      const result = await getPosSessionByToken(sessionToken);
      if (result.success && result.data) {
        setSession({
          valid: result.data.valid,
          expired: result.data.expired,
          table_number: result.data.table_number,
          room_name: result.data.room_name,
          cubicle_name:
            (result.data as { cubicle_name?: string | null }).cubicle_name ??
            null,
        });
      } else {
        setSession({ valid: false, expired: false });
      }
    } catch {
      setSession({ valid: false, expired: false });
    } finally {
      setIsValidatingSession(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    validateSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken]);

  useEffect(() => {
    if (canOrder) {
      loadOrders();
    } else {
      setOrders([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canOrder, sessionToken]);

  /* ── Derived state ─────────────────────────────────────────────────── */
  const areas = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.area_id && p.area_name) map.set(p.area_id, p.area_name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const searchFilteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query),
    );
  }, [products, searchQuery]);

  const displayedProducts = useMemo(() => {
    let list = searchFilteredProducts;
    if (selectedCategory !== "All")
      list = list.filter((p) => p.category_name === selectedCategory);
    if (selectedArea !== "All")
      list = list.filter((p) => p.area_id === selectedArea);
    return list;
  }, [searchFilteredProducts, selectedCategory, selectedArea]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    searchFilteredProducts.forEach((p) => {
      map.set(p.category_name, (map.get(p.category_name) ?? 0) + 1);
    });
    return map;
  }, [searchFilteredProducts]);

  const subtotal = useMemo(
    () => cart.reduce((t, i) => t + i.price * i.quantity, 0),
    [cart],
  );
  const totalItems = useMemo(
    () => cart.reduce((t, i) => t + i.quantity, 0),
    [cart],
  );

  /* ── Cart ops ──────────────────────────────────────────────────────── */
  function addToCart(product: PosProduct) {
    if (!canOrder) {
      toast.error("A valid QR session is required to order");
      return;
    }
    setCart((cur) => {
      const existing = cur.find((i) => i.id === product.id);
      return existing
        ? cur.map((i) =>
            i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          )
        : [...cur, { ...product, quantity: 1 }];
    });
  }

  function setQuantity(id: string, qty: number) {
    setCart((cur) =>
      qty <= 0
        ? cur.filter((i) => i.id !== id)
        : cur.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
    );
  }

  function removeFromCart(id: string) {
    setCart((cur) => cur.filter((i) => i.id !== id));
  }

  function clearCart() {
    setCart([]);
  }

  async function handleSubmitOrder() {
    if (!canOrder || !sessionToken) {
      toast.error("A valid QR session is required to place an order");
      return;
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createQrOrder({
        session_token: sessionToken,
        order_type: "dine_in",
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          discount_amount: 0,
        })),
      });
      if (!result.success || !result.data) {
        toast.error(result.error ?? "Failed to place order");
        return;
      }
      setOrderPlaced({
        orderNumber: result.data.order_number,
        total: result.data.total_amount,
        updatedExisting: result.updatedExisting ?? false,
      });
      setCart([]);
      setIsCartOpen(false);
      toast.success("Order placed successfully!");
      await loadOrders();
    } catch (err) {
      console.error("Submit order error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  }

  function getSessionLabel() {
    if (!session) return "Valid session";
    if (session.table_number) return `Table ${session.table_number}`;
    if (session.room_name) return `Room ${session.room_name}`;
    if (session.cubicle_name) return `Cubicle ${session.cubicle_name}`;
    return "Valid session";
  }

  /* ── Loading / error / success screens ─────────────────────────────── */
  if (isLoading) {
    return (
      <main className="min-h-screen bg-stone-50">
        <div className="sticky top-0 z-30 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
            <div className="h-8 w-8 animate-pulse rounded-xl bg-orange-100" />
            <div className="h-4 w-24 animate-pulse rounded bg-stone-200" />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-5 h-11 max-w-md animate-pulse rounded-xl bg-stone-200/80" />
          <div className="mb-6 flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-24 animate-pulse rounded-full bg-stone-200/80"
              />
            ))}
          </div>
          <MenuSkeleton />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 p-6">
        <SectionState
          icon={Package}
          title="Unable to load menu"
          body={error}
          action={
            <Button
              onClick={() => loadData()}
              className="rounded-xl text-white hover:bg-[#d95a08]"
              style={{ backgroundColor: BRAND }}
            >
              Try again
            </Button>
          }
        />
      </main>
    );
  }

  if (orderPlaced) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 p-6">
        <div className="w-full max-w-sm rounded-3xl border border-stone-200/80 bg-white p-8 text-center shadow-lg shadow-stone-200/60">
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-100 opacity-60" />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-7 w-7 text-emerald-600" />
            </span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-stone-900">
            Order placed!
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            {orderPlaced.updatedExisting
              ? "Items added to your current order."
              : "Your order has been sent to the kitchen."}
          </p>
          {orderPlaced.orderNumber && (
            <p className="mt-3 inline-flex rounded-full bg-stone-100 px-3 py-1 font-mono text-xs text-stone-600">
              {orderPlaced.orderNumber}
            </p>
          )}
          <p className="mt-2 text-2xl font-bold tracking-tight text-stone-900">
            {formatCurrency(orderPlaced.total)}
          </p>
          <p className="mt-4 text-xs leading-relaxed text-stone-400">
            Please wait for staff to confirm. You can keep adding items on this
            table — staff will charge once when you pay.
          </p>
          <Button
            className="mt-6 w-full rounded-xl text-white hover:bg-[#d95a08]"
            style={{ backgroundColor: BRAND }}
            onClick={() => setOrderPlaced(null)}
          >
            Order more
          </Button>
          <Button
            variant="outline"
            className="mt-3 w-full rounded-xl"
            onClick={() => {
              setOrderPlaced(null);
              setIsOrdersOpen(true);
              loadOrders();
            }}
          >
            View my orders
          </Button>
        </div>
      </main>
    );
  }

  /* ── Main menu ─────────────────────────────────────────────────────── */
  return (
    <main className="min-h-screen bg-stone-50 pb-28">
      {/* Sticky glass header */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur-md">
        <div className=" mt-10"></div>
        {canOrder && (
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2.5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm"
                style={{ backgroundColor: BRAND }}
              >
                <Package className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold tracking-tight text-stone-900">
                  {getSessionLabel()}
                </h1>
                <p className="truncate text-[11px] leading-tight text-stone-500">
                  Scan to order · Pick up at the counter
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="hidden border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 sm:inline-flex">
                <QrCode className="mr-1 h-3 w-3" />
                Ordering on
              </Badge>
              <button
                type="button"
                onClick={() => {
                  setIsCartOpen(true);
                }}
                className="relative flex h-9 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-medium text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-100 sm:hidden"
              >
                <ShoppingCart className="h-4 w-4" />
                {totalItems > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                    style={{ backgroundColor: BRAND }}
                  >
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6 lg:px-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search the menu..."
              className="h-10 rounded-full border-stone-200 bg-white pl-10 pr-10 shadow-sm focus-visible:ring-orange-500/30"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Category pills */}
        <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6 lg:px-8">
          <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:px-0">
            {categories.map((category) => {
              const active = selectedCategory === category;
              const count =
                category === "All"
                  ? searchFilteredProducts.length
                  : (categoryCounts.get(category) ?? 0);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`flex shrink-0 snap-start items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    active
                      ? "text-white shadow-sm"
                      : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                  style={active ? { backgroundColor: BRAND } : undefined}
                >
                  {category}
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-semibold ${
                      active
                        ? "bg-white/25 text-white"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        {/* Session banner */}
        {sessionToken && (
          <div className="mb-5">
            {isValidatingSession ? (
              <div className="flex items-center gap-2.5 rounded-2xl border border-stone-200/80 bg-white px-4 py-3 text-sm text-stone-500 shadow-sm">
                <Loader2
                  className="h-4 w-4 animate-spin"
                  style={{ color: BRAND }}
                />
                Validating session…
              </div>
            ) : session?.valid ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 to-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <p className="text-sm font-medium text-emerald-800">
                    Session active · {getSessionLabel()}
                  </p>
                </div>
                {orders.length > 0 && (
                  <Badge
                    variant="outline"
                    className="cursor-pointer border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                    onClick={() => {
                      setIsOrdersOpen(true);
                      loadOrders();
                    }}
                  >
                    <Receipt className="mr-1 h-3 w-3" />
                    {orders.length} order{orders.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3 rounded-2xl border border-red-200/70 bg-red-50/80 p-5 text-center sm:flex-row sm:items-center sm:text-left">
                <div className="mx-auto shrink-0 rounded-2xl bg-red-100 p-3 sm:mx-0">
                  {session?.expired ? (
                    <Clock className="h-5 w-5 text-red-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-red-800">
                    {session?.expired
                      ? "This QR session has expired"
                      : "Invalid or inactive QR session"}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-red-600">
                    {session?.expired
                      ? "The ordering session for this table has expired. Ask staff to create a new one."
                      : "This QR code isn't valid or the session was deactivated. Ask staff for help."}{" "}
                    You can still browse the menu.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {!sessionToken && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Browsing only.</span>{" "}
              <span className="text-amber-700">
                Scan a table or room QR code to place an order.
              </span>
            </p>
          </div>
        )}

        {/* Area filter */}
        {areas.length > 1 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
              Station
            </span>
            {(["All", ...areas.map((a) => a.id)] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedArea(id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedArea === id
                    ? "bg-stone-900 text-white"
                    : "bg-white text-stone-500 ring-1 ring-stone-200 hover:text-stone-900"
                }`}
              >
                {id === "All"
                  ? "All stations"
                  : areas.find((a) => a.id === id)?.name}
              </button>
            ))}
          </div>
        )}

        {/* Product grid */}
        {displayedProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 py-16 text-center">
            <div className="mx-auto w-fit rounded-3xl bg-stone-100 p-4">
              <Package className="h-6 w-6 text-stone-400" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-stone-900">
              {searchQuery.trim() ? "No matches found" : "No products here yet"}
            </h3>
            <p className="mx-auto mt-1 max-w-xs text-sm text-stone-500">
              {searchQuery.trim()
                ? "Try a different search term or category."
                : "Add active products in the POS to display them here."}
            </p>
            {searchQuery.trim() && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-full"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedProducts.map((product) => {
              const cartItem = cart.find((i) => i.id === product.id);
              return (
                <Card
                  key={product.id}
                  className="group flex flex-col overflow-hidden py-0 rounded-2xl border-stone-200/80 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-stone-200/70"
                >
                  {/* Image */}
                  <div className="relative h-36 shrink-0 overflow-hidden bg-stone-100">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                        <Package className="h-10 w-10 text-stone-300" />
                      </div>
                    )}
                    {cartItem && (
                      <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white shadow">
                        {cartItem.quantity}
                      </span>
                    )}
                  </div>

                  <CardContent className="flex flex-1 flex-col gap-2.5 p-4">
                    {/* Title + price */}
                    <div>
                      <h3 className="truncate text-sm font-semibold text-stone-900">
                        {product.name}
                      </h3>
                      <p
                        className="mt-0.5 text-sm font-bold"
                        style={{ color: BRAND }}
                      >
                        {formatCurrency(product.price)}
                      </p>
                    </div>

                    {/* Description — always present for consistent height */}
                    <p className="line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-stone-500">
                      {product.description || "No description"}
                    </p>

                    {/* Pills — fixed min-height so rows stay aligned */}
                    <div className="flex min-h-[1.5rem] flex-wrap items-center gap-1.5">
                      {product.category_name && (
                        <Badge
                          variant="secondary"
                          className="rounded-full bg-stone-100 text-[11px] font-medium text-stone-600 hover:bg-stone-100"
                        >
                          {product.category_name}
                        </Badge>
                      )}
                      {product.area_name && (
                        <Badge
                          variant="outline"
                          className="rounded-full border-stone-200 text-[11px] font-medium text-stone-500"
                        >
                          {product.area_name}
                        </Badge>
                      )}
                    </div>

                    {/* Action — pushed to bottom */}
                    <div className="mt-auto pt-1">
                      {cartItem ? (
                        <div className="flex h-9 items-center justify-between rounded-xl bg-orange-50 ring-1 ring-orange-200/70">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              setQuantity(product.id, cartItem.quantity - 1)
                            }
                            className="flex h-full w-10 items-center justify-center rounded-l-xl text-orange-700 transition hover:bg-orange-100"
                          >
                            {cartItem.quantity === 1 ? (
                              <Trash2 className="h-3.5 w-3.5" />
                            ) : (
                              <Minus className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <span
                            className="text-sm font-bold tabular-nums"
                            style={{ color: BRAND }}
                          >
                            {cartItem.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() =>
                              setQuantity(product.id, cartItem.quantity + 1)
                            }
                            className="flex h-full w-10 items-center justify-center rounded-r-xl text-orange-700 transition hover:bg-orange-100"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addToCart(product)}
                          disabled={!canOrder}
                          className="h-9 w-full rounded-xl font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
                          style={
                            canOrder ? { backgroundColor: BRAND } : undefined
                          }
                        >
                          <Plus className="mr-1.5 h-4 w-4" />
                          {canOrder ? "Add" : "Scan QR to order"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-stone-400">
          Prices in Philippine Peso · Pay at the counter
        </p>
      </div>

      {/* Floating actions */}
      {canOrder && (
        <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-3 sm:right-6">
          {orders.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsOrdersOpen(true);
                loadOrders();
              }}
              className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-stone-800 shadow-lg ring-1 ring-stone-200 transition hover:bg-stone-50"
            >
              <Receipt className="h-4 w-4" />
              <span className="inline">Orders</span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-900 px-1.5 text-[10px] font-bold text-white">
                {orders.length}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex h-13 items-center gap-2.5 rounded-full py-3 pl-4 pr-5 font-semibold text-white shadow-xl shadow-orange-500/30 transition hover:brightness-95 active:scale-95"
            style={{ backgroundColor: BRAND, height: 52 }}
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
              {totalItems}
            </span>
            <ShoppingCart className="h-5 w-5" />
            <span className="text-sm">{formatCurrency(subtotal)}</span>
          </button>
        </div>
      )}

      {/* Cart dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Your cart</DialogTitle>
          </DialogHeader>

          <div className="max-h-[45vh] flex-1 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="rounded-3xl bg-stone-100 p-4">
                  <ShoppingCart className="h-6 w-6 text-stone-400" />
                </div>
                <p className="mt-3 text-sm text-stone-500">
                  Your cart is empty.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3.5">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-stone-200">
                          <Package className="h-5 w-5 text-stone-400" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-stone-900">
                        {item.name}
                      </h3>
                      <p className="text-xs text-stone-500">
                        {formatCurrency(item.price)} each
                      </p>
                      <p className="text-xs font-semibold text-stone-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-stone-100 px-1 py-1">
                      <button
                        type="button"
                        aria-label="Decrease"
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-stone-600 transition hover:bg-white hover:shadow-sm"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase"
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-stone-600 transition hover:bg-white hover:shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <DialogFooter className="flex-col items-stretch gap-3 sm:flex-col">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">
                {totalItems} item{totalItems !== 1 ? "s" : ""}
              </span>
              <span className="text-lg font-bold tracking-tight text-stone-900">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {!canOrder && (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
                A valid QR session is required to submit an order.
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={clearCart}
                disabled={cart.length === 0 || isSubmitting}
                className="flex-1 rounded-xl"
              >
                Clear
              </Button>
              <Button
                type="button"
                onClick={handleSubmitOrder}
                disabled={cart.length === 0 || !canOrder || isSubmitting}
                className="flex-1 rounded-xl font-semibold text-white hover:brightness-95"
                style={{ backgroundColor: BRAND }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing…
                  </>
                ) : (
                  "Place order"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Orders dialog */}
      <Dialog open={isOrdersOpen} onOpenChange={setIsOrdersOpen}>
        <DialogContent className="flex max-h-[85vh] w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-2xl p-0 sm:w-full">
          <DialogHeader className="shrink-0 border-b border-stone-100 px-4 pb-3 pt-4 sm:px-6">
            <DialogTitle className="flex items-center justify-between gap-2 pr-8">
              <span className="text-base font-semibold tracking-tight">
                Your orders
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => loadOrders()}
                disabled={isLoadingOrders}
                className="h-8 w-8 rounded-full"
                aria-label="Refresh orders"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoadingOrders ? "animate-spin" : ""}`}
                />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6">
            {isLoadingOrders ? (
              <div className="flex flex-col items-center py-12">
                <Loader2
                  className="h-8 w-8 animate-spin"
                  style={{ color: BRAND }}
                />
                <p className="mt-3 text-sm text-stone-500">Loading orders…</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="rounded-3xl bg-stone-100 p-4">
                  <Receipt className="h-6 w-6 text-stone-400" />
                </div>
                <p className="mt-3 text-sm text-stone-500">
                  No orders yet for this table.
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  Orders you place will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pb-2">
                {orders.map((order) => {
                  const hasBreakdown =
                    order.subtotal != null ||
                    order.service_charge != null ||
                    order.tax_amount != null;

                  return (
                    <Card
                      key={order.id}
                      className="rounded-2xl border-stone-200/80 shadow-sm"
                    >
                      <CardContent className="space-y-3 p-4">
                        {/* Header: order # + status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-mono text-sm font-semibold text-stone-900">
                              {order.order_number ?? order.id.slice(0, 8)}
                            </p>
                            <p className="mt-0.5 text-xs text-stone-500">
                              {new Date(order.created_at).toLocaleString(
                                "en-PH",
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                },
                              )}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`shrink-0 rounded-full capitalize ${statusBadgeClass(order.status)}`}
                          >
                            {order.status.replace(/_/g, " ")}
                          </Badge>
                        </div>

                        {/* Line items */}
                        {order.items && order.items.length > 0 && (
                          <ul className="space-y-1.5 text-sm">
                            {order.items.map((item) => (
                              <li
                                key={item.id}
                                className="flex justify-between gap-3 text-stone-700"
                              >
                                <span className="min-w-0 truncate">
                                  <span className="tabular-nums text-stone-500">
                                    {item.quantity}×
                                  </span>{" "}
                                  {item.product_name}
                                </span>
                                <span className="shrink-0 font-medium tabular-nums">
                                  {formatCurrency(item.line_total)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <Separator className="bg-stone-100" />

                        {/* Amount breakdown */}
                        <div className="space-y-1.5 text-sm">
                          {hasBreakdown && (
                            <>
                              {order.subtotal != null && (
                                <div className="flex justify-between text-stone-500">
                                  <span>Subtotal</span>
                                  <span className="tabular-nums">
                                    {formatCurrency(order.subtotal)}
                                  </span>
                                </div>
                              )}
                              {order.service_charge != null &&
                                order.service_charge > 0 && (
                                  <div className="flex justify-between text-stone-500">
                                    <span>Service charge</span>
                                    <span className="tabular-nums">
                                      {formatCurrency(order.service_charge)}
                                    </span>
                                  </div>
                                )}
                              {order.tax_amount != null &&
                                order.tax_amount > 0 && (
                                  <div className="flex justify-between text-stone-500">
                                    <span>Tax</span>
                                    <span className="tabular-nums">
                                      {formatCurrency(order.tax_amount)}
                                    </span>
                                  </div>
                                )}
                            </>
                          )}

                          <div className="flex items-center justify-between pt-0.5">
                            <span className="font-medium text-stone-700">
                              Total
                            </span>
                            <span className="text-base font-semibold tabular-nums text-stone-900">
                              {formatCurrency(order.total_amount)}
                            </span>
                          </div>
                        </div>

                        {/* Payment method */}
                        {order.payment_method && (
                          <p className="text-xs text-stone-400">
                            Paid via{" "}
                            <span className="capitalize">
                              {order.payment_method.replace(/_/g, " ")}
                            </span>
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
