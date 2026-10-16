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
  ensureTerminalContext,
  getBranchBillingSettings,
  type PosProduct,
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
  const [branchId, setBranchId] = useState<string | null>(null);
  const [contextReady, setContextReady] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [branchName, setBranchName] = useState("");
  const [terminalName, setTerminalName] = useState("");

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

  async function loadProducts(targetBranchId?: string) {
    setIsLoading(true);
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        getPosProducts(targetBranchId),
        getPosCategories(),
      ]);

      if (productsResult.success) setProducts(productsResult.data);
      if (categoriesResult.success) {
        setCategories(["All", ...categoriesResult.data.map((c) => c.name)]);
      }
    } catch (error) {
      console.error("Failed to load POS products:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" || product.category_name === selectedCategory;
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  // Financial calculations with VAT and whole-peso service charge rounding
  const { subtotal, taxAmount, serviceChargeAmount, finalTotal, totalItems } = useMemo(() => {
    const sub = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const itemsCount = cart.reduce((total, item) => total + item.quantity, 0);

    const vatRate = billingSettings?.vat_enabled ? billingSettings.vat_rate : 0;
    const scRate = billingSettings?.service_charge_enabled ? billingSettings.service_charge_rate : 0;
    const priceMode = billingSettings?.price_mode ?? "exclusive";

    let tax = 0;
    if (vatRate > 0) {
      tax = priceMode === "inclusive" ? (sub * vatRate) / (100 + vatRate) : sub * (vatRate / 100);
    }
    const serviceCharge = scRate > 0 ? Math.round(sub * (scRate / 100)) : 0;
    const total = priceMode === "inclusive" ? sub + serviceCharge : sub + tax + serviceCharge;

    return {
      subtotal: sub,
      taxAmount: Number(tax.toFixed(2)),
      serviceChargeAmount: serviceCharge,
      finalTotal: Number(total.toFixed(2)),
      totalItems: itemsCount,
    };
  }, [cart, billingSettings]);

  function addToCart(product: PosProduct) {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.id === product.id);
      if (existing) {
        return currentCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
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

  type PaymentMethod = "cash" | "card" | "gcash" | "maya";
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const changeDue = useMemo(() => {
    if (paymentMethod !== "cash") return 0;
    const tendered = parseFloat(amountTendered) || 0;
    return Math.max(0, tendered - finalTotal);
  }, [paymentMethod, amountTendered, finalTotal]);

  const canConfirmPayment = useMemo(() => {
    if (cart.length === 0 || isProcessingPayment) return false;
    if (paymentMethod === "cash") {
      return (parseFloat(amountTendered) || 0) >= finalTotal;
    }
    return true;
  }, [cart.length, isProcessingPayment, paymentMethod, amountTendered, finalTotal]);

  function openPaymentDialog() {
    setPaymentMethod("cash");
    setAmountTendered("");
    setShowPaymentDialog(true);
  }

  async function handleConfirmPayment() {
    if (!canConfirmPayment) return;

    setIsProcessingPayment(true);
    try {
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

      const itemsResult = await addOrderItems({
        order_id: orderId,
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          discount_amount: 0,
        })),
      });

      if (!itemsResult.success) {
        toast.error(itemsResult.error ?? "Failed to add items");
        return;
      }

      const received =
        paymentMethod === "cash" ? parseFloat(amountTendered) || finalTotal : finalTotal;

      const payResult = await recordPayment({
        order_id: orderId,
        payment_method: paymentMethod,
        amount: finalTotal,
        received_amount: received,
      });

      if (!payResult.success) {
        toast.error(payResult.error ?? "Payment failed");
        return;
      }

      const completeResult = await completeOrder(orderId);
      if (!completeResult.success) {
        toast.error(completeResult.error ?? "Payment saved but order could not be completed");
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

        const [productsRes, billingRes] = await Promise.all([
          getPosProducts(ctx.data.branch.id),
          getBranchBillingSettings(ctx.data.branch.id),
        ]);

        if (productsRes.success) setProducts(productsRes.data);
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
    contextReady && !!branchId && !!terminalId && !!shiftId && cart.length > 0 && !isProcessingPayment;

  return (
    <main className="flex h-[calc(100vh-4rem)] flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F36509]">POS</p>
            <div className="mt-1 flex items-center gap-3">
              <h1 className="font-serif text-xl font-semibold text-stone-900 sm:text-2xl">
                Primary Terminal
              </h1>
              {contextReady ? (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  Open · {branchName} / {terminalName}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                  {contextError ?? "Initialising…"}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-stone-400">Items</p>
              <p className="text-sm font-semibold text-stone-900">{totalItems}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto xl:flex-row xl:overflow-hidden">
        {/* Products Section */}
        <section className="min-w-0 flex-1 bg-stone-50 p-4 sm:p-6 xl:overflow-y-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="h-12 rounded-xl border-stone-200 bg-white pl-11 pr-11"
            />
          </div>

          <div className="sticky -top-6 z-10 -mx-4 mt-4 flex gap-2 overflow-x-auto bg-stone-50 px-4 py-2">
            {categories.map((category) => (
              <Button
                key={category}
                type="button"
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? "rounded-xl bg-[#F36509] text-white hover:bg-[#d95a08]"
                    : "rounded-xl border-stone-200 bg-white text-stone-600"
                }
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addToCart(product)}
                className="group text-left"
              >
                <Card className="h-full border-stone-200 bg-white transition-all group-hover:border-[#F36509]/40">
                  <CardContent className="p-3 sm:p-4">
                    <div className="relative flex h-20 items-center justify-center overflow-hidden rounded-xl bg-stone-100">
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                      ) : (
                        <Package className="h-8 w-8 text-stone-300" />
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="truncate text-xs uppercase text-stone-400">{product.category_name}</p>
                      <h3 className="text-sm font-semibold text-stone-900">{product.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-[#F36509]">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </section>

        {/* Cart & Totals Sidebar */}
        <aside className="flex w-full flex-col border-t border-stone-200 bg-white xl:w-[400px] xl:border-l xl:border-t-0">
          <div className="border-b border-stone-100 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-[#F36509]" />
                <h2 className="text-lg font-semibold text-stone-900">Current Order</h2>
              </div>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart} className="text-stone-500 hover:text-red-600">
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="px-4 py-4 xl:flex-1 xl:overflow-y-auto space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="rounded-xl border border-stone-200 p-3">
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium text-stone-900">{item.name}</h3>
                  <button onClick={() => removeItem(item.id)} className="text-stone-300 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 border rounded-lg p-1">
                    <button onClick={() => decreaseQuantity(item.id)}><Minus className="h-3.5 w-3.5" /></button>
                    <span className="text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => increaseQuantity(item.id)}><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Section */}
          <div className="border-t bg-stone-50 px-4 py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {billingSettings?.vat_enabled && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">VAT ({billingSettings.vat_rate}%)</span>
                <span className="font-medium">{formatCurrency(taxAmount)}</span>
              </div>
            )}
            {billingSettings?.service_charge_enabled && (
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Service Charge ({billingSettings.service_charge_rate}%)</span>
                <span className="font-medium">{formatCurrency(serviceChargeAmount)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-xl font-bold text-[#F36509]">{formatCurrency(finalTotal)}</span>
            </div>
            <Button disabled={!canPay} onClick={openPaymentDialog} className="w-full mt-3 bg-[#F36509] text-white">
              <CreditCard className="mr-2 h-4 w-4" /> Pay {formatCurrency(finalTotal)}
            </Button>
          </div>
        </aside>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Take Payment</DialogTitle>
            <DialogDescription>Total Due: {formatCurrency(finalTotal)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              {(["cash", "card", "gcash", "maya"] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`border rounded-xl px-3 py-2.5 text-sm uppercase ${
                    paymentMethod === method ? "border-[#F36509] bg-[#F36509]/10 text-[#F36509]" : ""
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <Label>Amount Tendered</Label>
                <Input
                  type="number"
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  placeholder="0.00"
                />
                <div className="flex justify-between bg-stone-50 p-2 rounded-xl text-sm">
                  <span>Change</span>
                  <span className="font-semibold">{formatCurrency(changeDue)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
            <Button disabled={!canConfirmPayment} onClick={handleConfirmPayment} className="bg-[#F36509] text-white">
              Confirm {formatCurrency(finalTotal)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}