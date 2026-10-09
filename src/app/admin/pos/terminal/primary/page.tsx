"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  ShoppingCart,
  User,
  Receipt,
  RefreshCw,
  Package,
  QrCode,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getPosCategories,
  getPosProducts,
  getPosSessions,
  type PosProduct,
} from "@/lib/pos-actions";
import Image from "next/image";
import Link from "next/link";

type CartItem = PosProduct & {
  quantity: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

export default function PrimaryTerminalPage() {
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);

  async function loadActiveSessions() {
    const result = await getPosSessions();
    if (result.success) {
      const count = result.data.filter(
        (s) => s.is_active && new Date(s.expires_at) > new Date(),
      ).length;
      setActiveCount(count);
    }
  }

  useEffect(() => {
    loadProducts();
    loadActiveSessions();
  }, []);

  async function loadProducts() {
    setIsLoading(true);

    try {
      const [productsResult, categoriesResult] = await Promise.all([
        getPosProducts(),
        getPosCategories(),
      ]);

      if (productsResult.success) {
        setProducts(productsResult.data);
      } else {
        console.error(productsResult.error);
      }

      if (categoriesResult.success) {
        setCategories([
          "All",
          ...categoriesResult.data.map((category) => category.name),
        ]);
      } else {
        console.error(categoriesResult.error);
      }
    } catch (error) {
      console.error("Failed to load POS products:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" ||
        product.category_name === selectedCategory;

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  function addToCart(product: PosProduct) {
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
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(id: string) {
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
  }

  function clearCart() {
    setCart([]);
  }

  return (
    <main className="flex h-[calc(100vh-4rem)] flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F36509]">
              POS
            </p>

            <div className="mt-1 flex items-center gap-3">
              <h1 className="font-serif text-xl font-semibold text-stone-900 sm:text-2xl">
                Primary Terminal
              </h1>

              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                Open
              </Badge>
            </div>

            <p className="mt-1 text-sm text-stone-500">
              Regular walk-in sales terminal
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 sm:flex">
              <User className="h-4 w-4 text-stone-400" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-stone-400">
                  Cashier
                </p>
                <p className="text-sm font-medium text-stone-800">
                  Current User
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-stone-400">
                Items
              </p>
              <p className="text-sm font-semibold text-stone-900">
                {totalItems}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal — whole area scrolls on mobile, split panes on xl */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto xl:flex-row xl:overflow-hidden">
        {/* Products */}
        <section className="min-w-0 flex-1 bg-stone-50 p-4 sm:p-6 xl:overflow-y-auto">
          <div className="mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />

              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products..."
                className="h-12 rounded-xl border-stone-200 bg-white pl-11 pr-11"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.28 5.22a.75.75 0 0 0-1.06 1.06l10 10a.75.75 0 1 0 1.06-1.06l-10-10ZM2.03 13.24a.75.75 0 0 0 1.06 1.06l10 10a.75.75 0 0 0 1.06-1.06l-10-10a.75.75 0 0 0-1.06 0Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              )}
            </div>

            <div className="sticky -top-6 z-10 -mx-4 mt-4 flex gap-2 overflow-x-auto bg-stone-50 px-4 py-2 sm:-mx-6 sm:px-6">
              {categories.map((category) => {
                const active = selectedCategory === category;

                const hasMatchingProducts =
                  searchQuery.trim() === "" ||
                  filteredProducts.some(
                    (product) => product.category_name === category,
                  );

                const isDisabled = hasMatchingProducts
                  ? false
                  : searchQuery.trim() !== "";

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
                          ? "shrink-0 rounded-xl bg-[#F36509] text-white hover:bg-[#d95a08]"
                          : "shrink-0 rounded-xl border-stone-200 bg-white text-stone-600 hover:bg-stone-100"
                        : "shrink-0 cursor-not-allowed rounded-xl border-stone-200 bg-stone-100 text-stone-400"
                    }
                  >
                    {category}
                  </Button>
                );
              })}
            </div>

            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">
                    Products
                  </h2>
                  <p className="text-sm text-stone-500">
                    Select an item to add it to the cart.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={loadProducts}
                  disabled={isLoading}
                  className="text-stone-500"
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>

              {isLoading ? (
                <Card className="border-stone-200 bg-white">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-[#F36509]" />
                    <p className="mt-4 text-sm font-medium text-stone-900">
                      Loading products...
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      Getting products from the POS database.
                    </p>
                  </CardContent>
                </Card>
              ) : filteredProducts.length === 0 ? (
                <Card className="border-stone-200 bg-white">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-full bg-stone-100 p-4">
                      <Package className="h-6 w-6 text-stone-400" />
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-stone-900">
                      {searchQuery.trim()
                        ? "No results found."
                        : "No products available"}
                    </h3>
                    <p className="mt-1 max-w-sm text-sm text-stone-500">
                      {searchQuery.trim()
                        ? "Try a different search term or clear the search."
                        : "Add active products to the POS database to display them here."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 min-[110rem]:grid-cols-6 min-[130rem]:grid-cols-8">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addToCart(product)}
                      className="group text-left"
                    >
                      <Card className="h-full border-stone-200 bg-white transition-all group-hover:-translate-y-0.5 group-hover:border-[#F36509]/40 group-hover:shadow-sm">
                        <CardContent className="p-3 sm:p-4">
                          <div className="relative flex h-20 items-center justify-center overflow-hidden rounded-xl bg-stone-100 sm:h-24 lg:h-28">
                            {product.image_url ? (
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            ) : (
                              <Package className="h-8 w-8 text-stone-300 sm:h-10 sm:w-10" />
                            )}
                          </div>

                          <div className="mt-3 sm:mt-4">
                            <p className="truncate text-xs font-medium uppercase tracking-wider text-stone-400">
                              {product.category_name}
                            </p>

                            <div className="mt-1 flex items-start justify-between gap-2 sm:gap-3">
                              <h3 className="text-sm font-semibold leading-snug text-stone-900">
                                {product.name}
                              </h3>
                              <Plus className="h-4 w-4 shrink-0 text-stone-300 transition-colors group-hover:text-[#F36509]" />
                            </div>

                            <p className="mt-2 text-sm font-semibold text-[#F36509] sm:text-base">
                              {formatCurrency(product.price)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Cart */}
        <aside className="flex w-full flex-col border-t border-stone-200 bg-white xl:h-full xl:min-h-0 xl:w-[400px] xl:border-l xl:border-t-0">
          {/* Cart header */}
          <div className="border-b border-stone-100 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-[#F36509]" />
                  <h2 className="text-lg font-semibold text-stone-900">
                    Current Order
                  </h2>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Walk-in transaction
                </p>
              </div>

              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="text-xs text-stone-500 hover:text-red-600"
                  >
                    Clear
                  </Button>
                )}

                <Link
                  href="/admin/pos/terminal/qr-sessions"
                  className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 transition-colors hover:border-[#F36509]/40"
                >
                  <QrCode className="h-4 w-4 text-[#F36509]" />
                  <span className="hidden text-sm font-medium text-stone-900 sm:inline">
                    QR Sessions
                  </span>
                  {activeCount > 0 && (
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 text-emerald-700"
                    >
                      {activeCount}
                    </Badge>
                  )}
                </Link>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-6 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center text-center xl:min-h-[280px]">
                <div className="rounded-full bg-stone-100 p-4">
                  <ShoppingCart className="h-6 w-6 text-stone-400" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-stone-900">
                  Your cart is empty
                </h3>
                <p className="mt-1 max-w-xs text-xs leading-5 text-stone-500">
                  Select products from the terminal to start an order.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-stone-200 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-medium text-stone-900">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-xs text-stone-500">
                          {formatCurrency(item.price)} each
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded-lg p-1.5 text-stone-300 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-lg border border-stone-200 p-1">
                        <button
                          type="button"
                          onClick={() => decreaseQuantity(item.id)}
                          className="rounded-md p-1 text-stone-500 hover:bg-stone-100"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-6 text-center text-sm font-medium text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => increaseQuantity(item.id)}
                          className="rounded-md p-1 text-stone-500 hover:bg-stone-100"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="text-sm font-semibold text-stone-900">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals — sticky bottom bar on mobile, static footer on xl */}
          <div className="sticky bottom-0 z-10 border-t border-stone-100 bg-stone-50/80 px-4 py-4 backdrop-blur sm:px-6 xl:static xl:z-auto xl:bg-stone-50/70 xl:py-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Subtotal</span>
                <span className="font-medium text-stone-900">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Discount</span>
                <span className="font-medium text-stone-900">
                  {formatCurrency(0)}
                </span>
              </div>

              <Separator className="my-3 bg-stone-200" />

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-900">
                  Total
                </span>
                <span className="text-xl font-bold text-[#F36509] sm:text-2xl">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={cart.length === 0}
                className="h-11 border-stone-200 bg-white"
              >
                <Receipt className="mr-2 h-4 w-4" />
                Hold
              </Button>

              <Button
                type="button"
                disabled={cart.length === 0}
                className="h-11 bg-[#F36509] text-white hover:bg-[#d95a08]"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pay
              </Button>
            </div>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
              <Banknote className="h-3.5 w-3.5" />
              Payment will be connected next
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
