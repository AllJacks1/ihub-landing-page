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
import {
  getPosCategories,
  getPosProducts,
  getPosSessions,
  ensureTerminalContext,
  type PosProduct,
  getBranchBillingSettings,
} from "@/lib/pos-actions";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  createPosOrder,
  addOrderItems,
  recordPayment,
  completeOrder,
} from "@/lib/order-actions";
import { getCurrentUser } from "@/lib/actions";
import { computeScPwdDiscount } from "@/lib/utils";

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

  const [cashierFullname, setCashierFullname] = useState("");

  const [terminalId, setTerminalId] = useState<string | null>(null);
  const [shiftId, setShiftId] = useState<string | null>(null);
  const [contextReady, setContextReady] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [branchName, setBranchName] = useState("");
  const [terminalName, setTerminalName] = useState("");

  type PaymentMethod = "cash" | "card" | "gcash" | "maya";

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Senior Citizen / PWD discount (payment dialog)
  const [seniorCount, setSeniorCount] = useState(0);
  const [pwdCount, setPwdCount] = useState(0);
  const [otherGuestCount, setOtherGuestCount] = useState(1);
  const [discountVatIncluded, setDiscountVatIncluded] = useState(true);

  // Optional: set from your branch picker / default branch
  const [branchId, setBranchId] = useState<string | undefined>(undefined);

  const [billingSettings, setBillingSettings] = useState<{
    vat_enabled: boolean;
    vat_rate: number;
    service_charge_enabled: boolean;
    service_charge_rate: number;
    price_mode: "exclusive" | "inclusive";
  } | null>(null);

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

  const {
    subtotal,
    eligibleSubtotal,
    nonEligibleSubtotal,
    taxAmount,
    serviceChargeAmount, // SC calculated on full eligible (no discount yet)
    finalTotal, // before SC/PWD discount
  } = useMemo(() => {
    console.log(cart);

    let eligibleSub = 0;
    let nonEligibleSub = 0;

    for (const item of cart) {
      const code = (item.area_code ?? "").toLowerCase();
      const lineTotal = item.price * item.quantity;

      if (code === "ieat" || code === "idrink") {
        eligibleSub += lineTotal;
      } else {
        nonEligibleSub += lineTotal;
      }
    }

    const sub = eligibleSub + nonEligibleSub;

    const vatRate = billingSettings?.vat_enabled ? billingSettings.vat_rate : 0;
    const scRate = billingSettings?.service_charge_enabled
      ? billingSettings.service_charge_rate
      : 0;
    const priceMode = billingSettings?.price_mode ?? "exclusive";

    // Tax still calculated on the full subtotal (common practice)
    let tax = 0;
    if (vatRate > 0) {
      tax =
        priceMode === "inclusive"
          ? (sub * vatRate) / (100 + vatRate)
          : sub * (vatRate / 100);
    }

    // Service charge only on eligible items (before any discount)
    const sc = scRate > 0 ? Math.round(eligibleSub * (scRate / 100)) : 0;

    const total = priceMode === "inclusive" ? sub + sc : sub + tax + sc;

    return {
      subtotal: sub,
      eligibleSubtotal: eligibleSub,
      nonEligibleSubtotal: nonEligibleSub,
      taxAmount: Number(tax.toFixed(2)),
      serviceChargeAmount: sc,
      finalTotal: Number(total.toFixed(2)),
    };
  }, [cart, billingSettings]);

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

  // SC/PWD discount applied on top of finalTotal (VAT + service charge included)
  const discountResult = useMemo(
    () =>
      computeScPwdDiscount({
        totalBill: eligibleSubtotal, // ← only food & drinks
        seniors: seniorCount,
        pwds: pwdCount,
        otherGuests: otherGuestCount,
        vatIncluded: discountVatIncluded,
      }),
    [
      eligibleSubtotal,
      seniorCount,
      pwdCount,
      otherGuestCount,
      discountVatIncluded,
    ],
  );

  const adjustedServiceCharge = useMemo(() => {
    const scRate = billingSettings?.service_charge_enabled
      ? billingSettings.service_charge_rate
      : 0;

    if (scRate <= 0 || eligibleSubtotal <= 0) return 0;

    // After discount, the remaining eligible base
    const discountedEligible = Math.max(
      0,
      eligibleSubtotal - (discountResult.totalSavings || 0),
    );

    return Math.round(discountedEligible * (scRate / 100));
  }, [eligibleSubtotal, discountResult.totalSavings, billingSettings]);

  const amountDue = useMemo(() => {
    const priceMode = billingSettings?.price_mode ?? "exclusive";

    // non-eligible stays full price
    // eligible becomes (eligible - discount)
    // then add the *adjusted* service charge
    // tax stays as previously calculated (or adjust if you want tax only on non-eligible)

    const afterDiscount =
      nonEligibleSubtotal +
      Math.max(0, eligibleSubtotal - (discountResult.totalSavings || 0));

    if (priceMode === "inclusive") {
      return Number((afterDiscount + adjustedServiceCharge).toFixed(2));
    }

    // exclusive: add the original tax + new SC
    return Number(
      (afterDiscount + taxAmount + adjustedServiceCharge).toFixed(2),
    );
  }, [
    nonEligibleSubtotal,
    eligibleSubtotal,
    discountResult.totalSavings,
    adjustedServiceCharge,
    taxAmount,
    billingSettings,
  ]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== "cash") return 0;
    const tendered = parseFloat(amountTendered) || 0;
    return Math.max(0, tendered - amountDue);
  }, [paymentMethod, amountTendered, amountDue]);

  const canConfirmPayment = useMemo(() => {
    if (cart.length === 0 || isProcessingPayment) return false;
    if (!discountResult.valid && (seniorCount > 0 || pwdCount > 0))
      return false;
    if (paymentMethod === "cash") {
      return (parseFloat(amountTendered) || 0) >= amountDue;
    }
    return true;
  }, [
    cart.length,
    isProcessingPayment,
    paymentMethod,
    amountTendered,
    amountDue,
    discountResult.valid,
    seniorCount,
    pwdCount,
  ]);

  function openPaymentDialog() {
    setPaymentMethod("cash");
    setAmountTendered("");
    setSeniorCount(0);
    setPwdCount(0);
    setOtherGuestCount(1);
    // Prefer branch billing: VAT-inclusive prices mean the bill already includes VAT
    setDiscountVatIncluded(
      billingSettings?.price_mode === "inclusive" ||
        billingSettings?.vat_enabled === true,
    );
    setShowPaymentDialog(true);
  }

  async function handleConfirmPayment() {
    if (!canConfirmPayment) return;

    setIsProcessingPayment(true);
    try {
      // 1. Create walk-in order
      const orderResult = await createPosOrder({
        branch_id: branchId,
        terminal_id: terminalId,
        shift_id: shiftId,
        order_type: "walk_in",
        order_source: "manual",
      });

      if (!orderResult.success || !orderResult.data) {
        toast.error(orderResult.error ?? "Failed to create order");
        return;
      }

      const orderId = orderResult.data.id;

      // Whole-peso SC/PWD savings, split across lines with largest-remainder
      const totalSavings = Math.round(discountResult?.totalSavings || 0);
      const n = cart.length;
      const base = n > 0 ? Math.floor(totalSavings / n) : 0;
      let remainder = n > 0 ? totalSavings - base * n : 0;

      const items = cart.map((item) => {
        const extra = remainder > 0 ? 1 : 0;
        if (remainder > 0) remainder -= 1;
        return {
          product_id: item.id,
          quantity: item.quantity,
          discount_amount: base + extra, // integer pesos only
        };
      });

      // 2. Add cart lines
      const itemsResult = await addOrderItems({
        order_id: orderId,
        items,
      });

      if (!itemsResult.success) {
        toast.error(itemsResult.error ?? "Failed to add items");
        return;
      }

      // 3. Record payment against amount due (after SC/PWD discount if any)
      const received =
        paymentMethod === "cash"
          ? parseFloat(amountTendered) || amountDue
          : amountDue;

      const payResult = await recordPayment({
        order_id: orderId,
        payment_method: paymentMethod,
        amount: amountDue,
        received_amount: received,
      });

      if (!payResult.success) {
        toast.error(payResult.error ?? "Payment failed");
        return;
      }

      // 4. Complete (deducts inventory when branch_id is set)
      const completeResult = await completeOrder(orderId);
      if (!completeResult.success) {
        toast.error(
          completeResult.error ??
            "Payment saved but order could not be completed",
        );
      } else {
        toast.success(
          paymentMethod === "cash" && changeDue > 0
            ? `Paid · Change ${formatCurrency(changeDue)}`
            : "Payment successful",
        );
      }

      clearCart();
      setShowPaymentDialog(false);
      setAmountTendered("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setIsProcessingPayment(false);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const user = await getCurrentUser();
        setCashierFullname(user?.full_name ?? "Unknown Cashier");

        const ctx = await ensureTerminalContext();
        if (!ctx.success || !ctx.data) {
          setContextError(ctx.error ?? "Terminal context unavailable");
          setContextReady(false);
          return;
        }

        setBranchId(ctx.data.branch.id);
        setTerminalId(ctx.data.terminal.id);
        setShiftId(ctx.data.shift.id);
        setBranchName(ctx.data.branch.name);
        setTerminalName(ctx.data.terminal.name);
        setContextReady(true);
        setContextError(null);

        // reload products scoped to this branch
        const productsResult = await getPosProducts(ctx.data.branch.id);
        if (productsResult.success) {
          setProducts(productsResult.data);
        }

        const billingRes = await getBranchBillingSettings(ctx.data.branch.id);
        if (billingRes.success && billingRes.data) {
          setBillingSettings(billingRes.data);
        }
      } catch (e) {
        console.error(e);
        setContextError("Failed to initialise terminal");
        setContextReady(false);
      }
    }

    bootstrap();
    loadActiveSessions();
  }, []);

  const canPay =
    contextReady &&
    !!branchId &&
    !!terminalId &&
    !!shiftId &&
    cart.length > 0 &&
    !isProcessingPayment;

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

              {contextReady ? (
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  Open · {branchName} / {terminalName}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-200 bg-amber-50 text-amber-700"
                >
                  {contextError ?? "Initialising…"}
                </Badge>
              )}
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
                  {cashierFullname || "Loading..."}
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
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {billingSettings?.vat_enabled && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">
                  VAT ({billingSettings.vat_rate}%)
                </span>
                <span className="font-medium">{formatCurrency(taxAmount)}</span>
              </div>
            )}
            {billingSettings?.service_charge_enabled && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">
                  Service Charge ({billingSettings.service_charge_rate}%) · Food
                  & Drinks
                </span>
                <span className="font-medium">
                  {formatCurrency(serviceChargeAmount)}
                </span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-stone-200 pt-2 text-sm font-semibold text-stone-900">
              <span>Total</span>
              <span>{formatCurrency(finalTotal)}</span>
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
                disabled={!canPay}
                onClick={openPaymentDialog}
                className="h-11 bg-[#F36509] text-white hover:bg-[#d95a08]"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pay
              </Button>
            </div>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
              <Banknote className="h-3.5 w-3.5" />
              Cash, card, GCash &amp; Maya
            </p>
          </div>
        </aside>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Take Payment
            </DialogTitle>
            <DialogDescription>
              Total due:{" "}
              <span className="font-semibold text-stone-900">
                {formatCurrency(amountDue)}
              </span>
              {discountResult.totalSavings > 0 && (
                <span className="ml-1 text-stone-500">
                  (was {formatCurrency(finalTotal)})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-stone-700">
                Payment method
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "cash" as const, label: "Cash", icon: Banknote },
                    { id: "card" as const, label: "Card", icon: CreditCard },
                    { id: "gcash" as const, label: "GCash", icon: CreditCard },
                    { id: "maya" as const, label: "Maya", icon: CreditCard },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(id);
                      if (id !== "cash") setAmountTendered("");
                    }}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      paymentMethod === id
                        ? "border-[#F36509] bg-[#F36509]/10 text-[#F36509]"
                        : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <Label
                  htmlFor="tendered"
                  className="text-sm font-medium text-stone-700"
                >
                  Amount tendered
                </Label>
                <Input
                  id="tendered"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  placeholder="0.00"
                  className="h-11 rounded-xl border-stone-200"
                  autoFocus
                />
                <div className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm">
                  <span className="text-stone-500">Change</span>
                  <span className="font-semibold text-stone-900">
                    {formatCurrency(changeDue)}
                  </span>
                </div>
              </div>
            )}

            <div className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-xs text-stone-600">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {item.quantity}× {item.name}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Senior Citizen / PWD discount */}
            <div className="space-y-3 rounded-xl border border-stone-200 bg-white p-3">
              <p className="text-sm font-medium text-stone-700">
                Senior Citizen / PWD discount
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-stone-500">Seniors</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={seniorCount}
                    onChange={(e) =>
                      setSeniorCount(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="h-9 rounded-lg border-stone-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-stone-500">PWDs</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={pwdCount}
                    onChange={(e) =>
                      setPwdCount(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="h-9 rounded-lg border-stone-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-stone-500">Others</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={otherGuestCount}
                    onChange={(e) =>
                      setOtherGuestCount(
                        Math.max(0, parseInt(e.target.value) || 0),
                      )
                    }
                    className="h-9 rounded-lg border-stone-200"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-stone-600">
                <input
                  type="checkbox"
                  checked={discountVatIncluded}
                  onChange={(e) => setDiscountVatIncluded(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-stone-300 text-[#F36509] focus:ring-[#F36509]"
                />
                Bill includes 12% VAT
              </label>
              {discountResult.valid && discountResult.eligibleGuests > 0 && (
                <div className="space-y-0.5 border-t border-stone-100 pt-2 text-xs text-stone-500">
                  <div className="flex justify-between">
                    <span>
                      Eligible ({discountResult.eligibleGuests} of{" "}
                      {discountResult.totalGuests})
                    </span>
                    <span className="tabular-nums">
                      share {formatCurrency(discountResult.sharePerGuest)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount &amp; VAT savings</span>
                    <span className="tabular-nums font-medium">
                      −{formatCurrency(discountResult.totalSavings)}
                    </span>
                  </div>
                </div>
              )}
              <p className="text-[10px] leading-4 text-stone-400">
                Equal-share estimate. Count each person once (even if both
                senior &amp; PWD). Actual discount depends on eligible
                consumption.
              </p>
            </div>

            {/* Totals breakdown in payment dialog */}
            <div className="space-y-1 rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              {billingSettings?.vat_enabled && taxAmount > 0 && (
                <div className="flex justify-between text-stone-500">
                  <span>VAT ({billingSettings.vat_rate}%)</span>
                  <span className="tabular-nums">
                    {formatCurrency(taxAmount)}
                  </span>
                </div>
              )}
              {discountResult.totalSavings > 0 &&
                serviceChargeAmount !== adjustedServiceCharge && (
                  <div className="flex justify-between text-xs text-stone-400">
                    <span>Service charge (before discount)</span>
                    <span className="line-through">
                      {formatCurrency(serviceChargeAmount)}
                    </span>
                  </div>
                )}
              {billingSettings?.service_charge_enabled &&
                adjustedServiceCharge > 0 && (
                  <div className="flex justify-between text-stone-500">
                    <span>
                      Service charge ({billingSettings.service_charge_rate}%)
                    </span>
                    <span className="tabular-nums">
                      {formatCurrency(adjustedServiceCharge)}
                    </span>
                  </div>
                )}
              {discountResult.totalSavings > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>SC/PWD savings</span>
                  <span className="tabular-nums">
                    −{formatCurrency(discountResult.totalSavings)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-stone-900">
                <span>Total due</span>
                <span className="tabular-nums">
                  {formatCurrency(amountDue)}
                </span>
              </div>
              {nonEligibleSubtotal > 0 && (
                <p className="mt-1 text-[11px] text-stone-400">
                  Service charge & SC/PWD discount apply only to Food & Drinks
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canConfirmPayment}
              onClick={handleConfirmPayment}
              className="bg-[#F36509] text-white hover:bg-[#d95a08]"
            >
              {isProcessingPayment
                ? "Processing…"
                : `Confirm ${formatCurrency(amountDue)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
