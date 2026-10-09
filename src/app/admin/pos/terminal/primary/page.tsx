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
  WifiOff,
  Clock,
  CheckCircle,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

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
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import {
  getPosCategories,
  getPosProducts,
  getPosSessions,
  createPosSession,
  deactivatePosSession,
  type PosProduct,
  type PosSession,
} from "@/lib/pos-actions";
import Image from "next/image";

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

  // Session management
  const [tables, setTables] = useState<
    Array<{
      id: string;
      table_number: string;
      zone: string;
      seats: number;
      is_active: boolean;
    }>
  >([]);
  const [rooms, setRooms] = useState<
    Array<{ id: string; name: string; seats: number; is_active: boolean }>
  >([]);
  const [sessions, setSessions] = useState<PosSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [showCreateSessionDialog, setShowCreateSessionDialog] = useState(false);
  const [createSessionForm, setCreateSessionForm] = useState<{
    type: "table" | "room";
    id: string;
  }>({ type: "table", id: "" });
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [createdSessionUrl, setCreatedSessionUrl] = useState<string | null>(
    null,
  );
  const [createdSessionToken, setCreatedSessionToken] = useState<string | null>(
    null,
  );

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

  async function loadTablesAndRooms() {
    try {
      const [tablesResult, roomsResult] = await Promise.all([
        fetch("/api/admin/tables").then((r) => r.json()),
        fetch("/api/admin/rooms").then((r) => r.json()),
      ]);

      if (tablesResult.success) {
        setTables(tablesResult.data.filter((t: any) => t.is_active));
      }
      if (roomsResult.success) {
        setRooms(roomsResult.data.filter((r: any) => r.is_active));
      }
    } catch (error) {
      console.error("Failed to load tables/rooms:", error);
    }
  }

  async function loadSessions() {
    setIsLoadingSessions(true);
    try {
      const result = await getPosSessions();
      if (result.success) {
        setSessions(result.data);
      } else {
        console.error(result.error);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setIsLoadingSessions(false);
    }
  }

  function getSessionStatus(
    session: PosSession,
  ): "active" | "expired" | "deactivated" {
    if (!session.is_active) return "deactivated";
    const expiresAt = new Date(session.expires_at);
    if (expiresAt <= new Date()) return "expired";
    return "active";
  }

  function getSessionLocation(session: PosSession): string {
    if (session.table_number) return `Table ${session.table_number}`;
    if (session.room_name) return `Room ${session.room_name}`;
    return "Unknown";
  }

  function getSessionStatusBadge(status: string) {
    switch (status) {
      case "active":
        return (
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case "expired":
        return (
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-700"
          >
            <Clock className="mr-1 h-3 w-3" />
            Expired
          </Badge>
        );
      case "deactivated":
        return (
          <Badge
            variant="outline"
            className="border-stone-200 bg-stone-100 text-stone-600"
          >
            <WifiOff className="mr-1 h-3 w-3" />
            Deactivated
          </Badge>
        );
      default:
        return null;
    }
  }

  async function handleCreateSession() {
    if (!createSessionForm.id) return;

    setIsCreatingSession(true);
    try {
      const result = await createPosSession({
        table_id:
          createSessionForm.type === "table" ? createSessionForm.id : undefined,
        room_id:
          createSessionForm.type === "room" ? createSessionForm.id : undefined,
      });

      if (result.success && result.data) {
        const baseUrl =
          typeof window !== "undefined" ? window.location.origin : "";
        const sessionUrl = `${baseUrl}/menu?session=${result.data.qr_token}`;
        setCreatedSessionUrl(sessionUrl);
        setCreatedSessionToken(result.data.qr_token);
        await loadSessions();
        toast.success("QR session created successfully");
      } else {
        toast.error(result.error || "Failed to create session");
      }
    } catch (error) {
      console.error("Create session error:", error);
      toast.error("Failed to create session");
    } finally {
      setIsCreatingSession(false);
      setShowCreateSessionDialog(false);
      setCreateSessionForm({ type: "table", id: "" });
    }
  }

  async function handleDeactivateSession(sessionId: string) {
    try {
      const result = await deactivatePosSession(sessionId);
      if (result.success) {
        await loadSessions();
        toast.success("Session deactivated");
      } else {
        toast.error(result.error || "Failed to deactivate session");
      }
    } catch (error) {
      console.error("Deactivate session error:", error);
      toast.error("Failed to deactivate session");
    }
  }

  function copySessionUrl() {
    if (createdSessionUrl) {
      navigator.clipboard.writeText(createdSessionUrl);
      toast.success("URL copied to clipboard");
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadTablesAndRooms();
    loadSessions();
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

      {/* QR Session Management */}
      <div className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#F36509]/10 p-2">
                <QrCode className="h-5 w-5 text-[#F36509]" />
              </div>
              <div>
                <h2 className="font-medium text-stone-900">
                  QR Order Sessions
                </h2>
                <p className="text-sm text-stone-500">
                  Create sessions for tables or rooms. Customers scan to order.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Active sessions summary */}
              {sessions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
                  <span>Active:</span>
                  {sessions
                    .filter((s) => getSessionStatus(s) === "active")
                    .map((s) => (
                      <Badge
                        key={s.id}
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        {getSessionLocation(s)}
                      </Badge>
                    ))}
                </div>
              )}

              <Dialog
                open={showCreateSessionDialog}
                onOpenChange={setShowCreateSessionDialog}
              >
                <DialogTrigger>
                  <Button
                    className="rounded-full bg-[#F36509] text-white hover:bg-[#d95a08]"
                    disabled={
                      isCreatingSession ||
                      (tables.length === 0 && rooms.length === 0)
                    }
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    {isCreatingSession ? "Creating..." : "Create QR Session"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100vw-2rem)] rounded-2xl sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-xl">
                      Create QR Session
                    </DialogTitle>
                    <DialogDescription>
                      Select a table or room to generate a QR code for customer
                      ordering.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700">
                        Location Type
                      </label>
                      <div className="flex gap-4">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="sessionType"
                            value="table"
                            checked={createSessionForm.type === "table"}
                            onChange={() =>
                              setCreateSessionForm({
                                ...createSessionForm,
                                type: "table",
                                id: "",
                              })
                            }
                            className="h-4 w-4 border-stone-300 text-[#F36509] focus:ring-[#F36509]"
                          />
                          <span className="text-sm text-stone-700">Table</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            name="sessionType"
                            value="room"
                            checked={createSessionForm.type === "room"}
                            onChange={() =>
                              setCreateSessionForm({
                                ...createSessionForm,
                                type: "room",
                                id: "",
                              })
                            }
                            className="h-4 w-4 border-stone-300 text-[#F36509] focus:ring-[#F36509]"
                          />
                          <span className="text-sm text-stone-700">Room</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700">
                        {createSessionForm.type === "table"
                          ? "Select Table"
                          : "Select Room"}
                      </label>
                      <select
                        value={createSessionForm.id}
                        onChange={(e) =>
                          setCreateSessionForm({
                            ...createSessionForm,
                            id: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border-stone-200 bg-white px-3 py-2 text-sm focus-visible:ring-[#F36509]/30"
                      >
                        <option value="">Choose...</option>
                        {createSessionForm.type === "table"
                          ? tables.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.table_number} ({t.zone}, {t.seats} seats)
                              </option>
                            ))
                          : rooms.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} ({r.seats} seats)
                              </option>
                            ))}
                      </select>
                    </div>
                  </div>
                  <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateSessionDialog(false)}
                      disabled={isCreatingSession}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCreateSession}
                      disabled={isCreatingSession || !createSessionForm.id}
                      className="rounded-xl bg-[#F36509] text-white hover:bg-[#d95a08]"
                    >
                      {isCreatingSession ? "Creating..." : "Create Session"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                type="button"
                variant="outline"
                onClick={loadSessions}
                disabled={isLoadingSessions}
                className="text-stone-500"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isLoadingSessions ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Sessions list — card-based so it works at every breakpoint */}
          {sessions.length > 0 && (
            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/50 p-3 sm:p-4">
              <div className="space-y-2">
                {sessions.map((session) => {
                  const status = getSessionStatus(session);
                  return (
                    <div
                      key={session.id}
                      className="rounded-xl border border-stone-200 bg-white p-3 sm:p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-stone-900">
                              {getSessionLocation(session)}
                            </p>
                            {getSessionStatusBadge(status)}
                          </div>
                          <p className="mt-1 font-mono text-[10px] text-stone-400">
                            {session.id.slice(0, 8)}...
                          </p>
                          <p className="mt-0.5 text-xs text-stone-500">
                            Expires{" "}
                            {new Date(session.expires_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {status === "active" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeactivateSession(session.id)
                              }
                              className="text-red-600 hover:bg-red-50"
                            >
                              Deactivate
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const baseUrl =
                                typeof window !== "undefined"
                                  ? window.location.origin
                                  : "";
                              navigator.clipboard.writeText(
                                `${baseUrl}/menu?session=${session.qr_token}`,
                              );
                              toast.success("URL copied");
                            }}
                            className="text-stone-600 hover:bg-stone-100"
                          >
                            <Copy className="mr-1 h-3.5 w-3.5" />
                            Copy URL
                          </Button>

                          {createdSessionToken === session.qr_token &&
                            createdSessionUrl && (
                              <Dialog
                                open={true}
                                onOpenChange={() => setCreatedSessionUrl(null)}
                              >
                                <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="font-serif text-xl">
                                      QR Session Created
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="flex justify-center">
                                      <QRCodeSVG
                                        value={createdSessionUrl}
                                        size={180}
                                        level="M"
                                      />
                                    </div>
                                    <div className="space-y-2 text-center">
                                      <p className="font-medium text-stone-900">
                                        {getSessionLocation(session)}
                                      </p>
                                      <p className="break-all text-sm text-stone-500">
                                        {createdSessionUrl}
                                      </p>
                                      <p className="text-xs text-stone-400">
                                        Expires:{" "}
                                        {new Date(
                                          session.expires_at,
                                        ).toLocaleString()}
                                      </p>
                                    </div>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={copySessionUrl}
                                        className="flex-1"
                                      >
                                        Copy URL
                                      </Button>
                                      <Button
                                        type="button"
                                        onClick={() =>
                                          setCreatedSessionUrl(null)
                                        }
                                        className="flex-1 bg-[#F36509] text-white hover:bg-[#d95a08]"
                                      >
                                        Done
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sessions.length === 0 && !isLoadingSessions && (
            <div className="mt-4 py-8 text-center text-stone-500">
              <QrCode className="mx-auto mb-2 h-8 w-8 text-stone-300" />
              <p>No QR sessions yet. Create one to get started.</p>
            </div>
          )}
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
          <div className="border-b border-stone-100 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center justify-between">
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
