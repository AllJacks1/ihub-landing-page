"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Package,
  Smartphone,
  X,
  Trash2,
  QrCode,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
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
import { createQrOrder } from "@/lib/order-actions";

type CartItem = PosProduct & {
  quantity: number;
};

const REQUIRED_CATEGORIES = [
  "Food",
  "Beverages",
  "iSTUDY",
  "iWORK",
  "Equipment",
  "Printing & Services",
] as const;

type Category = (typeof REQUIRED_CATEGORIES)[number];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

export default function MenuPage() {
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

  // Session validation
  const [session, setSession] = useState<{
    valid: boolean;
    expired: boolean;
    table_number?: string | null;
    room_name?: string | null;
    cubicle_name?: string | null;
  } | null>(null);
  const [isValidatingSession, setIsValidatingSession] = useState(false);

  const canOrder = Boolean(sessionToken && session?.valid && !session?.expired);

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
        const availableCategories = new Set(
          categoriesResult.data.map((c) => c.name),
        );
        const requiredCategories = REQUIRED_CATEGORIES.filter((c) =>
          availableCategories.has(c),
        );
        setCategories(["All", ...requiredCategories]);
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
          cubicle_name: (result.data as any).cubicle_name ?? null,
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
    validateSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    validateSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToken]);

  const searchFilteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)
      );
    });
  }, [products, searchQuery]);

  // After products load
  const areas = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.area_id && p.area_name) map.set(p.area_id, p.area_name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  const [selectedArea, setSelectedArea] = useState<string | "All">("All");

  const displayedProducts = useMemo(() => {
    let list = searchFilteredProducts;
    if (selectedCategory !== "All") {
      list = list.filter((p) => p.category_name === selectedCategory);
    }
    if (selectedArea !== "All") {
      list = list.filter((p) => p.area_id === selectedArea);
    }
    // inventory sync (from previous step)
    // list = list.filter((p) => p.in_stock !== false);
    return list;
  }, [searchFilteredProducts, selectedCategory, selectedArea]);

  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  function addToCart(product: PosProduct) {
    if (!canOrder) {
      toast.error("A valid QR session is required to order");
      return;
    }
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id);
      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  }

  function increaseQuantity(id: string) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  }

  function decreaseQuantity(id: string) {
    setCart((currentCart) => {
      const item = currentCart.find((i) => i.id === id);
      if (!item || item.quantity <= 1) return currentCart;
      return currentCart.map((i) =>
        i.id === id ? { ...i, quantity: i.quantity - 1 } : i,
      );
    });
  }

  function removeFromCart(id: string) {
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
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

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#F36508] border-t-transparent" />
          <p className="text-sm font-medium text-stone-600">Loading menu...</p>
        </div>
      </main>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Package className="h-12 w-12 text-stone-400" />
          <h3 className="text-lg font-semibold text-stone-900">
            Unable to load menu
          </h3>
          <p className="text-sm text-stone-500">{error}</p>
          <Button onClick={() => loadData()}>Retry</Button>
        </div>
      </main>
    );
  }

  // ── Order success ────────────────────────────────────────────────────────
  if (orderPlaced) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-6">
        <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-stone-900">
            Order placed!
          </h2>
          <p className="mt-2 text-sm text-stone-500">
            {orderPlaced.updatedExisting
              ? "Items added to your current order."
              : "Your order has been sent to the kitchen."}
          </p>
          {orderPlaced.orderNumber && (
            <p className="mt-3 font-mono text-sm text-stone-600">
              {orderPlaced.orderNumber}
            </p>
          )}
          <p className="mt-1 text-lg font-semibold text-stone-900">
            {formatCurrency(orderPlaced.total)}
          </p>
          <p className="mt-4 text-xs text-stone-400">
            Please wait for staff to confirm. You can keep adding items on this
            table. Staff will charge once when you pay.
          </p>
          <Button
            className="mt-6 w-full rounded-xl bg-[#F36508] text-white hover:bg-[#d95a08]"
            onClick={() => setOrderPlaced(null)}
          >
            Order more
          </Button>
        </div>
      </main>
    );
  }

  // ── Main menu ────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-stone-50 pb-24">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mt-24 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#F36508] p-3">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-900">
                Menu
              </h1>
              <p className="text-sm text-stone-500">
                Scan to order. Pick up at the counter.
              </p>
            </div>
          </div>
        </div>

        {/* Session status */}
        {(sessionToken || isValidatingSession) && (
          <div className="mb-6">
            {isValidatingSession ? (
              <Card className="border-stone-200 bg-white">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#F36508] border-t-transparent" />
                  <p className="text-sm font-medium text-stone-600">
                    Validating session...
                  </p>
                </CardContent>
              </Card>
            ) : session?.valid ? (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-100 p-2">
                      <CheckCircle className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-800">
                        Session Active
                      </p>
                      <p className="text-sm text-emerald-600">
                        {getSessionLabel()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-700"
                  >
                    <QrCode className="mr-1 h-3 w-3" />
                    QR Order
                  </Badge>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                  <div className="rounded-xl bg-red-100 p-3">
                    {session?.expired ? (
                      <Clock className="h-6 w-6 text-red-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-red-800">
                    {session?.expired
                      ? "This QR session has expired"
                      : "Invalid or inactive QR session"}
                  </h3>
                  <p className="max-w-sm text-sm text-red-600">
                    {session?.expired
                      ? "The ordering session for this table/room has expired. Please ask staff to create a new session."
                      : "This QR code is not valid or the session has been deactivated. Please ask staff for assistance."}
                  </p>
                  <p className="text-xs text-red-500">
                    You can still browse the menu, but ordering is disabled.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* No session token at all */}
        {!sessionToken && !isValidatingSession && (
          <div className="mb-6">
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    No QR session
                  </p>
                  <p className="text-xs text-amber-700">
                    Scan a table/room QR code to place an order. Browsing only
                    for now.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="h-11 rounded-xl border-stone-200 bg-white pl-10 pr-10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="mb-6 overflow-x-auto pb-1">
          <div className="flex gap-2">
            {categories.map((category) => {
              const active = selectedCategory === category;
              const hasMatchingProducts =
                category === "All"
                  ? searchFilteredProducts.length > 0
                  : searchFilteredProducts.some(
                      (p) => p.category_name === category,
                    );

              const isDisabled =
                searchQuery.trim() !== "" && !hasMatchingProducts;

              return (
                <Button
                  key={category}
                  type="button"
                  variant={active ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  disabled={isDisabled}
                  className={
                    hasMatchingProducts
                      ? active
                        ? "rounded-full bg-[#F36508] text-white hover:bg-[#d95a08]"
                        : "rounded-full border-stone-200 bg-white text-stone-600 hover:bg-stone-100"
                      : "cursor-not-allowed rounded-full border-stone-200 bg-stone-100 text-stone-400"
                  }
                >
                  {category}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Product grid */}
        <div className="mb-6">
          {displayedProducts.length === 0 ? (
            <Card className="border-stone-200 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-stone-100 p-4">
                  <Package className="h-6 w-6 text-stone-400" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-stone-900">
                  {searchQuery.trim()
                    ? "No results found."
                    : "No products available."}
                </h3>
                <p className="mt-1 max-w-sm text-sm text-stone-500">
                  {searchQuery.trim()
                    ? "Try a different search term or clear the search."
                    : "Add active products to the POS database to display them here."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayedProducts.map((product) => (
                <Card
                  key={product.id}
                  className="border-stone-200 bg-white transition-shadow hover:shadow-sm"
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 rounded-xl bg-stone-100 p-3">
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-stone-200">
                            <Package className="h-8 w-8 text-stone-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="truncate text-sm font-semibold text-stone-900">
                            {product.name}
                          </h3>
                          <span className="text-sm font-semibold text-[#F36508]">
                            {formatCurrency(product.price)}
                          </span>
                        </div>

                        {product.description && (
                          <p className="line-clamp-2 text-xs text-stone-500">
                            {product.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 pt-2">
                          <Badge variant="outline" className="text-xs">
                            {product.category_name}
                          </Badge>
                          {product.area_name && (
                            <Badge variant="outline" className="text-xs">
                              {product.area_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addToCart(product)}
                      disabled={!canOrder}
                      className="mt-3 w-full justify-center rounded-xl bg-[#F36508]/10 text-[#F36508] hover:bg-[#F36508]/20 disabled:opacity-50"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      {canOrder ? "Add to Cart" : "Session required"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating cart button + dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <Button
          type="button"
          onClick={() => setIsCartOpen(true)}
          disabled={!canOrder && cart.length === 0}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#F36508] px-4 py-3 font-semibold text-white shadow-lg hover:bg-[#d95a08] disabled:opacity-60"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>
            {totalItems} item{totalItems !== 1 ? "s" : ""}
          </span>
          <Badge
            variant="secondary"
            className="ml-1 rounded-full bg-white/20 text-white"
          >
            {formatCurrency(subtotal)}
          </Badge>
        </Button>

        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your Cart</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="h-10 w-10 text-stone-300" />
                <p className="mt-3 text-sm text-stone-500">
                  Your cart is empty.
                </p>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex-shrink-0 rounded-lg bg-stone-100 p-2">
                      {item.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded bg-stone-200">
                          <Package className="h-6 w-6 text-stone-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-stone-900">
                        {item.name}
                      </h3>
                      <p className="text-xs text-stone-500">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                      <p className="text-xs font-semibold text-stone-900">
                        = {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => decreaseQuantity(item.id)}
                        disabled={isSubmitting}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => increaseQuantity(item.id)}
                        disabled={isSubmitting}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeFromCart(item.id)}
                      disabled={isSubmitting}
                      className="text-stone-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <DialogFooter className="flex-col items-stretch gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500">Total</span>
              <span className="text-lg font-semibold text-stone-900">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {!canOrder && (
              <p className="text-center text-xs text-amber-600">
                A valid QR session is required to submit an order.
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={clearCart}
                disabled={cart.length === 0 || isSubmitting}
                className="flex-1"
              >
                Clear Cart
              </Button>
              <Button
                type="button"
                onClick={handleSubmitOrder}
                disabled={cart.length === 0 || !canOrder || isSubmitting}
                className="flex-1 rounded-xl bg-[#F36508] text-white hover:bg-[#d95a08]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing...
                  </>
                ) : (
                  "Submit Order"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
