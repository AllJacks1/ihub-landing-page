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
  Globe,
  X,
  WifiOff,
  Clock,
  CheckCircle,
  AlertCircle,
  Copy,
  Pencil,
  MapPin,
  Armchair,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  getLocations,
  createLocation,
  updateLocation,
  setLocationActive,
  deleteLocation,
  type PosProduct,
  type PosSession,
  type PosLocation,
  type LocationType,
} from "@/lib/pos-actions";
import {
  getLocationLabel,
  LOCATION_TYPE_LABELS,
  LOCATION_TYPES,
} from "@/lib/pos-locations";

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
  const [locations, setLocations] = useState<Record<LocationType, PosLocation[]>>({
    table: [],
    room: [],
    cubicle: [],
  });
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [sessions, setSessions] = useState<PosSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [showCreateSessionDialog, setShowCreateSessionDialog] = useState(false);
  const [createSessionForm, setCreateSessionForm] = useState<{ type: LocationType; id: string }>({ type: "table", id: "" });
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [createdSessionUrl, setCreatedSessionUrl] = useState<string | null>(null);
  const [createdSessionToken, setCreatedSessionToken] = useState<string | null>(null);

  // Location management
  const [showManageLocationsDialog, setShowManageLocationsDialog] = useState(false);
  const [activeLocationTab, setActiveLocationTab] = useState<LocationType>("table");
  const [locationForm, setLocationForm] = useState({
    name: "",
    seats: 4,
    zone: "bistro" as "bistro" | "coworking",
    description: "",
  });
  const [editingLocation, setEditingLocation] = useState<PosLocation | null>(null);
  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [togglingLocationId, setTogglingLocationId] = useState<string | null>(null);
  const [removingLocationId, setRemovingLocationId] = useState<string | null>(null);

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

  async function loadLocations() {
    setIsLoadingLocations(true);
    try {
      const [tablesResult, roomsResult, cubiclesResult] = await Promise.all([
        getLocations("table"),
        getLocations("room"),
        getLocations("cubicle"),
      ]);

      if (tablesResult.success) {
        setLocations((prev) => ({ ...prev, table: tablesResult.data }));
      } else {
        console.error(tablesResult.error);
        toast.error(tablesResult.error || "Failed to load tables");
      }

      if (roomsResult.success) {
        setLocations((prev) => ({ ...prev, room: roomsResult.data }));
      } else {
        console.error(roomsResult.error);
        toast.error(roomsResult.error || "Failed to load rooms");
      }

      if (cubiclesResult.success) {
        setLocations((prev) => ({ ...prev, cubicle: cubiclesResult.data }));
      } else {
        console.error(cubiclesResult.error);
        toast.error(cubiclesResult.error || "Failed to load cubicles");
      }
    } catch (error) {
      console.error("Failed to load locations:", error);
      toast.error("Failed to load locations");
    } finally {
      setIsLoadingLocations(false);
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

  function getSessionStatus(session: PosSession): "active" | "expired" | "deactivated" {
    if (!session.is_active) return "deactivated";
    const expiresAt = new Date(session.expires_at);
    if (expiresAt <= new Date()) return "expired";
    return "active";
  }

  function getSessionLocation(session: PosSession): string {
    if (session.table_number) return getLocationLabel("table", session.table_number);
    if (session.room_name) return getLocationLabel("room", session.room_name);
    if (session.cubicle_name) return getLocationLabel("cubicle", session.cubicle_name);
    return "Unknown";
  }

  function getSessionStatusBadge(status: string) {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            <Clock className="mr-1 h-3 w-3" />
            Expired
          </Badge>
        );
      case "deactivated":
        return (
          <Badge variant="outline" className="border-stone-200 bg-stone-100 text-stone-600">
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
        table_id: createSessionForm.type === "table" ? createSessionForm.id : undefined,
        room_id: createSessionForm.type === "room" ? createSessionForm.id : undefined,
        cubicle_id: createSessionForm.type === "cubicle" ? createSessionForm.id : undefined,
      });

      if (result.success && result.data) {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
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

  function openAddLocationForm(type: LocationType) {
    setActiveLocationTab(type);
    setEditingLocation(null);
    setIsLocationFormOpen(true);
    setLocationForm({
      name: "",
      seats: type === "cubicle" ? 1 : 4,
      zone: "bistro",
      description: "",
    });
  }

  function openEditLocationForm(location: PosLocation) {
    setActiveLocationTab(location.type);
    setEditingLocation(location);
    setIsLocationFormOpen(true);
    setLocationForm({
      name: location.name,
      seats: location.seats,
      zone: (location.zone as "bistro" | "coworking") ?? "bistro",
      description: location.description ?? "",
    });
  }

  function cancelLocationForm() {
    setEditingLocation(null);
    setIsLocationFormOpen(false);
    setLocationForm({ name: "", seats: 4, zone: "bistro", description: "" });
  }

  async function handleSaveLocation() {
    if (!locationForm.name.trim()) {
      toast.error("Location name is required");
      return;
    }

    setIsSavingLocation(true);
    try {
      const payload = {
        type: activeLocationTab,
        name: locationForm.name.trim(),
        seats: locationForm.seats,
        zone: locationForm.zone,
        description: locationForm.description.trim() || null,
      };

      const result = editingLocation
        ? await updateLocation({ ...payload, id: editingLocation.id })
        : await createLocation(payload);

      if (result.success) {
        toast.success(
          editingLocation
            ? `${LOCATION_TYPE_LABELS[activeLocationTab]} updated`
            : `${LOCATION_TYPE_LABELS[activeLocationTab]} created`,
        );
        cancelLocationForm();
        await loadLocations();
      } else {
        toast.error(result.error || "Failed to save location");
      }
    } catch (error) {
      console.error("Save location error:", error);
      toast.error("Failed to save location");
    } finally {
      setIsSavingLocation(false);
    }
  }

  async function handleToggleLocation(location: PosLocation) {
    setTogglingLocationId(location.id);
    try {
      const result = await setLocationActive({
        type: location.type,
        id: location.id,
        is_active: !location.is_active,
      });

      if (result.success) {
        toast.success(
          `${getLocationLabel(location.type, location.name)} ${!location.is_active ? "activated" : "deactivated"}`,
        );
        await loadLocations();
      } else {
        toast.error(result.error || "Failed to update location");
      }
    } catch (error) {
      console.error("Toggle location error:", error);
      toast.error("Failed to update location");
    } finally {
      setTogglingLocationId(null);
    }
  }

  async function handleDeleteLocation(location: PosLocation) {
    setRemovingLocationId(location.id);
    try {
      const result = await deleteLocation({
        type: location.type,
        id: location.id,
      });

      if (result.success) {
        toast.success(`${LOCATION_TYPE_LABELS[location.type]} removed`);
        await loadLocations();
      } else {
        toast.error(result.error || "Failed to remove location");
      }
    } catch (error) {
      console.error("Remove location error:", error);
      toast.error("Failed to remove location");
    } finally {
      setRemovingLocationId(null);
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
    loadLocations();
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
    return cart.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
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
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  function decreaseQuantity(id: string) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(id: string) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== id),
    );
  }

  function clearCart() {
    setCart([]);
  }

  return (
    <main className="flex h-[calc(100vh-4rem)] flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-stone-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F36509]">
              POS
            </p>

            <div className="mt-1 flex items-center gap-3">
              <h1 className="font-serif text-2xl font-semibold text-stone-900">
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

          <div className="flex items-center gap-3">
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
      <div className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#F36509]/10 p-2">
                <QrCode className="h-5 w-5 text-[#F36509]" />
              </div>
              <div>
                <h2 className="font-medium text-stone-900">QR Order Sessions</h2>
                <p className="text-sm text-stone-500">
                  Create sessions for tables, rooms, or cubicles. Customers scan to order.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Active sessions summary */}
              {sessions.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-stone-600">
                  <span>Active:</span>
                  {sessions.filter(s => getSessionStatus(s) === "active").map(s => (
                    <Badge key={s.id} variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      {getSessionLocation(s)}
                    </Badge>
                  ))}
                </div>
              )}

              <Dialog open={showCreateSessionDialog} onOpenChange={setShowCreateSessionDialog}>
                <DialogTrigger>
                  <Button
                    className="rounded-full bg-[#F36509] text-white hover:bg-[#d95a08]"
                    disabled={
                      isCreatingSession ||
                      (locations.table.length === 0 &&
                        locations.room.length === 0 &&
                        locations.cubicle.length === 0)
                    }
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    {isCreatingSession ? "Creating..." : "Create QR Session"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-xl">Create QR Session</DialogTitle>
                    <DialogDescription>
                      Select a table, room, or cubicle to generate a QR code for customer ordering.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700">Location Type</label>
                      <div className="flex flex-wrap gap-4">
                        {LOCATION_TYPES.map((type) => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="sessionType"
                              value={type}
                              checked={createSessionForm.type === type}
                              onChange={() => setCreateSessionForm({ ...createSessionForm, type, id: "" })}
                              className="h-4 w-4 text-[#F36509] border-stone-300 focus:ring-[#F36509]"
                            />
                            <span className="text-sm text-stone-700">
                              {LOCATION_TYPE_LABELS[type]}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-700">
                        Select {LOCATION_TYPE_LABELS[createSessionForm.type]}
                      </label>
                      <select
                        value={createSessionForm.id}
                        onChange={(e) => setCreateSessionForm({ ...createSessionForm, id: e.target.value })}
                        className="w-full rounded-xl border-stone-200 bg-white px-3 py-2 text-sm focus-visible:ring-[#F36509]/30"
                      >
                        <option value="">Choose...</option>
                        {locations[createSessionForm.type]
                          .filter((location) => location.is_active)
                          .map((location) => (
                            <option key={location.id} value={location.id}>
                              {createSessionForm.type === "table"
                                ? `${getLocationLabel("table", location.name)} (${location.zone}, ${location.seats} seats)`
                                : `${getLocationLabel(createSessionForm.type, location.name)} (${location.seats} seats)`}
                            </option>
                          ))}
                      </select>
                      {locations[createSessionForm.type].filter((l) => l.is_active).length === 0 && (
                        <p className="text-xs text-stone-500">
                          No active {LOCATION_TYPE_LABELS[createSessionForm.type].toLowerCase()}s available. Add one via Manage Locations.
                        </p>
                      )}
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
                onClick={() => {
                  setEditingLocation(null);
                  setIsLocationFormOpen(false);
                  setShowManageLocationsDialog(true);
                }}
                disabled={isLoadingLocations}
                className="text-stone-500"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Manage Locations
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={loadSessions}
                disabled={isLoadingSessions}
                className="text-stone-500"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingSessions ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Sessions list */}
          {sessions.length > 0 && (
            <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/50 p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left py-2 px-3 font-medium text-stone-500">Session</th>
                      <th className="text-left py-2 px-3 font-medium text-stone-500">Location</th>
                      <th className="text-left py-2 px-3 font-medium text-stone-500">Status</th>
                      <th className="text-left py-2 px-3 font-medium text-stone-500">Expires</th>
                      <th className="text-right py-2 px-3 font-medium text-stone-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => {
                      const status = getSessionStatus(session);
                      return (
                        <tr key={session.id} className="border-b border-stone-100 last:border-0">
                          <td className="py-2 px-3 font-mono text-[10px] text-stone-500">
                            {session.id.slice(0, 8)}...
                          </td>
                          <td className="py-2 px-3 text-stone-900">
                            {getSessionLocation(session)}
                          </td>
                          <td className="py-2 px-3">
                            {getSessionStatusBadge(status)}
                          </td>
                          <td className="py-2 px-3 text-stone-600">
                            {new Date(session.expires_at).toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {status === "active" && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeactivateSession(session.id)}
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
                                  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
                                  navigator.clipboard.writeText(`${baseUrl}/menu?session=${session.qr_token}`);
                                  toast.success("URL copied");
                                }}
                                className="text-stone-600 hover:bg-stone-100"
                              >
                                <Copy className="mr-1 h-3.5 w-3.5" />
                                Copy URL
                              </Button>
                              {createdSessionToken === session.qr_token && createdSessionUrl && (
                                <Dialog
                                  open={true}
                                  onOpenChange={() => setCreatedSessionUrl(null)}
                                >
                                  <DialogContent className="rounded-2xl sm:max-w-md">
                                    <DialogHeader>
                                      <DialogTitle className="font-serif text-xl">QR Session Created</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div className="flex justify-center">
                                        <QRCodeSVG value={createdSessionUrl} size={180} level="M" />
                                      </div>
                                      <div className="space-y-2 text-center">
                                        <p className="font-medium text-stone-900">
                                          {getSessionLocation(session)}
                                        </p>
                                        <p className="text-sm text-stone-500 break-all">
                                          {createdSessionUrl}
                                        </p>
                                        <p className="text-xs text-stone-400">
                                          Expires: {new Date(session.expires_at).toLocaleString()}
                                        </p>
                                      </div>
                                      <div className="flex gap-2">
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
                                          onClick={() => setCreatedSessionUrl(null)}
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {sessions.length === 0 && !isLoadingSessions && (
            <div className="mt-4 text-center py-8 text-stone-500">
              <QrCode className="mx-auto mb-2 h-8 w-8 text-stone-300" />
              <p>No QR sessions yet. Create one to get started.</p>
            </div>
          )}

          {/* Location management */}
          <Dialog
            open={showManageLocationsDialog}
            onOpenChange={(open) => {
              if (!open) {
                setShowManageLocationsDialog(false);
                setEditingLocation(null);
                setIsLocationFormOpen(false);
              }
            }}
          >
            <DialogContent className="rounded-2xl sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  Manage Locations
                </DialogTitle>
                <DialogDescription>
                  Add, edit, deactivate, or remove tables, rooms, and cubicles.
                  Changes apply immediately to QR session creation.
                </DialogDescription>
              </DialogHeader>

              <Tabs
                value={activeLocationTab}
                onValueChange={(value) => {
                  setActiveLocationTab(value as LocationType);
                  setEditingLocation(null);
                }}
                className="mt-2"
              >
                <TabsList className="grid w-full grid-cols-3 rounded-xl bg-stone-100 p-1">
                  {LOCATION_TYPES.map((type) => (
                    <TabsTrigger
                      key={type}
                      value={type}
                      className="rounded-lg py-2 text-stone-500 transition-all data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm"
                    >
                      {LOCATION_TYPE_LABELS[type]}s
                    </TabsTrigger>
                  ))}
                </TabsList>

                {LOCATION_TYPES.map((type) => (
                  <TabsContent key={type} value={type} className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-stone-500">
                        {locations[type].length} {LOCATION_TYPE_LABELS[type].toLowerCase()}{" "}
                        {locations[type].length !== 1 ? "s" : ""} ·{" "}
                        {locations[type].filter((l) => l.is_active).length} active
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openAddLocationForm(type)}
                        className="rounded-full bg-[#F36509] text-white hover:bg-[#d95a08]"
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add {LOCATION_TYPE_LABELS[type]}
                      </Button>
                    </div>

                    {isLocationFormOpen && activeLocationTab === type && (
                        <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/70 p-4">
                          <p className="text-sm font-medium text-stone-700">
                            {editingLocation
                              ? `Edit ${LOCATION_TYPE_LABELS[type]}`
                              : `Add ${LOCATION_TYPE_LABELS[type]}`}
                          </p>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-stone-600">
                                {type === "table" ? "Table number" : "Name"}
                              </Label>
                              <Input
                                value={locationForm.name}
                                onChange={(e) =>
                                  setLocationForm({ ...locationForm, name: e.target.value })
                                }
                                placeholder={
                                  type === "table"
                                    ? "e.g. 5"
                                    : type === "room"
                                      ? "e.g. Confe D"
                                      : "e.g. Cubicle 5"
                                }
                                className="rounded-xl border-stone-200 bg-white focus-visible:ring-[#F36509]/30"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-stone-600">Seats</Label>
                              <Input
                                type="number"
                                min={1}
                                max={50}
                                value={locationForm.seats}
                                onChange={(e) =>
                                  setLocationForm({
                                    ...locationForm,
                                    seats: parseInt(e.target.value) || 1,
                                  })
                                }
                                className="rounded-xl border-stone-200 bg-white focus-visible:ring-[#F36509]/30"
                              />
                            </div>
                            {type === "table" && (
                              <div className="space-y-1.5">
                                <Label className="text-xs text-stone-600">Zone</Label>
                                <Select
                                  value={locationForm.zone}
                                  onValueChange={(v) => {
                                    if (v) {
                                      setLocationForm({
                                        ...locationForm,
                                        zone: v as "bistro" | "coworking",
                                      });
                                    }
                                  }}
                                >
                                  <SelectTrigger className="rounded-xl border-stone-200 bg-white focus:ring-[#F36509]/30">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl">
                                    <SelectItem value="bistro">Bistro</SelectItem>
                                    <SelectItem value="coworking">Coworking</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {type !== "table" && (
                              <div className="space-y-1.5">
                                <Label className="text-xs text-stone-600">
                                  Description <span className="font-normal text-stone-400">(optional)</span>
                                </Label>
                                <Input
                                  value={locationForm.description}
                                  onChange={(e) =>
                                    setLocationForm({ ...locationForm, description: e.target.value })
                                  }
                                  placeholder="e.g. Projector, whiteboard"
                                  className="rounded-xl border-stone-200 bg-white focus-visible:ring-[#F36509]/30"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleSaveLocation}
                              disabled={isSavingLocation || !locationForm.name.trim()}
                              className="rounded-full bg-[#F36509] text-white hover:bg-[#d95a08]"
                            >
                              {isSavingLocation
                                ? "Saving..."
                                : editingLocation
                                  ? "Save changes"
                                  : `Add ${LOCATION_TYPE_LABELS[type]}`}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={cancelLocationForm}
                              disabled={isSavingLocation}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                    {isLoadingLocations && activeLocationTab === type ? (
                      <div className="flex items-center gap-2 py-6 text-sm text-stone-500">
                        <RefreshCw className="h-4 w-4 animate-spin text-[#F36509]" />
                        Loading {LOCATION_TYPE_LABELS[type].toLowerCase()}s...
                      </div>
                    ) : locations[type].length === 0 ? (
                      <div className="rounded-xl border border-dashed border-stone-300 py-8 text-center">
                        <Armchair className="mx-auto mb-2 h-6 w-6 text-stone-300" />
                        <p className="text-sm text-stone-500">
                          No {LOCATION_TYPE_LABELS[type].toLowerCase()}s yet. Add one to get started.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {locations[type].map((location) => (
                          <div
                            key={location.id}
                            className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-stone-900">
                                  {getLocationLabel(type, location.name)}
                                </p>
                                {!location.is_active && (
                                  <Badge
                                    variant="outline"
                                    className="border-stone-200 bg-stone-100 text-stone-500"
                                  >
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
                                <span className="flex items-center gap-1">
                                  <Armchair className="h-3 w-3 text-stone-400" />
                                  {location.seats} seats
                                </span>
                                {location.zone && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-stone-400" />
                                    {location.zone}
                                  </span>
                                )}
                                {location.description && (
                                  <span className="truncate">{location.description}</span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={location.is_active}
                                  onCheckedChange={() => handleToggleLocation(location)}
                                  disabled={togglingLocationId === location.id}
                                  className="data-[state=checked]:bg-[#F36509]"
                                />
                                <span className="text-xs text-stone-500">
                                  {togglingLocationId === location.id
                                    ? "Updating..."
                                    : location.is_active
                                      ? "Active"
                                      : "Inactive"}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditLocationForm(location)}
                                className="h-7 rounded-full px-2.5 text-xs text-stone-600 hover:bg-stone-100"
                              >
                                <Pencil className="mr-1 h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteLocation(location)}
                                disabled={removingLocationId === location.id}
                                className="h-7 rounded-full px-2.5 text-xs text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                {removingLocationId === location.id ? "Removing..." : "Remove"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowManageLocationsDialog(false);
                    setEditingLocation(null);
                    setIsLocationFormOpen(false);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Terminal */}
      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        {/* Products */}
        <section className="min-w-0 flex-1 overflow-y-auto bg-stone-50 p-6">
          <div className="mx-auto max-w-6xl">
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

            <div className="sticky top-0 z-10 mt-4 flex gap-2 overflow-x-auto bg-stone-50 py-2">
              {categories.map((category) => {
                const active = selectedCategory === category;

                // When search is active, only show categories with matching products
                const hasMatchingProducts =
                  searchQuery.trim() === "" ||
                  filteredProducts.some(
                    (product) => product.category_name === category,
                  );

                const isDisabled =
                  hasMatchingProducts ? false : searchQuery.trim() !== "";

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
                          ? "rounded-full bg-[#F36509] text-white hover:bg-[#d95a08]"
                          : "rounded-full border-stone-200 bg-white text-stone-600 hover:bg-stone-100"
                        : "rounded-full border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
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
                    className={`mr-2 h-4 w-4 ${
                      isLoading ? "animate-spin" : ""
                    }`}
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
                      {searchQuery.trim() ? "No results found." : "No products available"}
                    </h3>

                    <p className="mt-1 max-w-sm text-sm text-stone-500">
                      {searchQuery.trim()
                        ? "Try a different search term or clear the search."
                        : "Add active products to the POS database to display them here."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addToCart(product)}
                      className="group text-left"
                    >
                      <Card className="h-full border-stone-200 bg-white transition-all group-hover:-translate-y-0.5 group-hover:border-[#F36509]/40 group-hover:shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl bg-stone-100">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-10 w-10 text-stone-300" />
                            )}
                          </div>

                          <div className="mt-4">
                            <p className="text-xs font-medium uppercase tracking-wider text-stone-400">
                              {product.category_name}
                            </p>

                            <div className="mt-1 flex items-start justify-between gap-3">
                              <h3 className="text-sm font-semibold text-stone-900">
                                {product.name}
                              </h3>

                              <Plus className="h-4 w-4 shrink-0 text-stone-300 transition-colors group-hover:text-[#F36509]" />
                            </div>

                            <p className="mt-2 text-base font-semibold text-[#F36509]">
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
        <aside className="flex min-h-0 w-full flex-col border-t border-stone-200 bg-white xl:h-full xl:w-[400px] xl:border-t-0 xl:border-l">
          <div className="border-b border-stone-100 px-6 py-5">
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

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {cart.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
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

          {/* Totals */}
          <div className="border-t border-stone-100 bg-stone-50/70 px-6 py-5">
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

                <span className="text-2xl font-bold text-[#F36509]">
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