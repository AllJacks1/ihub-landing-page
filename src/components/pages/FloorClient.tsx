"use client";

import { useState, useTransition, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createTable,
  createRoom,
  toggleTableActive,
  toggleRoomActive,
  assignTableToReservation,
  assignRoomToReservation,
  unassignRoom,
  unassignTable,
} from "@/lib/actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Users,
  MapPin,
  Armchair,
  Calendar,
  X,
  Inbox,
} from "lucide-react";
import Image from "next/image";

type Table = {
  id: string;
  table_number: string;
  seats: number;
  zone: "bistro" | "coworking";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Room = {
  id: string;
  name: string;
  seats: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type Reservation = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  pax: number;
  zone: "bistro" | "study" | "room";
  start_at: string;
  end_at: string;
  status: string;
  notes: string | null;
  assigned_tables: Table[];
  assigned_rooms: Room[];
};

interface Props {
  initialTables: Table[];
  initialRooms: Room[];
  initialReservations: Reservation[];
}

const tableImages: Record<string, string> = {
  bistro: "/images/bistroThumbnail.png",
  coworking: "/images/iLounge.png",
};

const roomImages: Record<string, string> = {
  default: "/images/coworking-space.png",
};

const UNASSIGN_HOLD_MS = 3000;

export default function FloorClient({
  initialTables,
  initialRooms,
  initialReservations,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const [tables, setTables] = useState(initialTables);
  const [rooms, setRooms] = useState(initialRooms);
  const [reservations, setReservations] = useState(initialReservations);

  useEffect(() => {
    setTables(initialTables);
    setRooms(initialRooms);
    setReservations(initialReservations);
  }, [initialTables, initialRooms, initialReservations]);

  const [tableForm, setTableForm] = useState({
    table_number: "",
    seats: 2,
    zone: "bistro" as "bistro" | "coworking",
  });
  const [openTableDialog, setOpenTableDialog] = useState(false);

  const [roomForm, setRoomForm] = useState({
    name: "",
    seats: 6,
    description: "",
  });
  const [openRoomDialog, setOpenRoomDialog] = useState(false);

  // ── Assignment dialog ────────────────────────────────────
  const [assignDialog, setAssignDialog] = useState<{
    type: "table" | "room";
    id: string;
    name: string;
    seats: number;
    zone?: string;
  } | null>(null);

  // ── Unassign confirmation dialog ─────────────────────────
  const [unassignDialog, setUnassignDialog] = useState<{
    type: "table" | "room";
    reservationId: string;
    resourceId: string;
    resourceName: string;
    guestName: string;
  } | null>(null);

  const [holdProgress, setHoldProgress] = useState(0);
  const holdRafRef = useRef<number | null>(null);
  const holdStartRef = useRef<number | null>(null);

  function resetHold() {
    if (holdRafRef.current !== null) {
      cancelAnimationFrame(holdRafRef.current);
      holdRafRef.current = null;
    }
    holdStartRef.current = null;
    setHoldProgress(0);
  }

  function startHold() {
    if (!unassignDialog) return;
    resetHold();

    const tick = (now: number) => {
      // Capture start time from the first rAF frame — no Date.now / performance.now
      if (holdStartRef.current === null) {
        holdStartRef.current = now;
      }

      const elapsed = now - holdStartRef.current;
      const pct = Math.min(100, (elapsed / UNASSIGN_HOLD_MS) * 100);
      setHoldProgress(pct);

      if (pct >= 100) {
        void performUnassign();
        return;
      }

      holdRafRef.current = requestAnimationFrame(tick);
    };

    holdRafRef.current = requestAnimationFrame(tick);
  }

  function cancelHold() {
    resetHold();
  }

  // Clean up hold when dialog closes or component unmounts
  useEffect(() => {
    if (!unassignDialog) resetHold();
    return () => resetHold();
  }, [unassignDialog]);

  async function performUnassign() {
    if (!unassignDialog) return;

    const { type, reservationId, resourceId } = unassignDialog;
    const key =
      type === "table"
        ? `unassign-table-${resourceId}`
        : `unassign-room-${resourceId}`;

    setLoadingKey(key);
    setUnassignDialog(null);
    resetHold();

    try {
      const result =
        type === "table"
          ? await unassignTable(reservationId, resourceId)
          : await unassignRoom(reservationId, resourceId);

      if (result.success) {
        toast.success(
          type === "table" ? "Table unassigned" : "Room unassigned",
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to unassign");
      }
    } finally {
      setLoadingKey(null);
    }
  }

  function openUnassignConfirm(
    type: "table" | "room",
    reservationId: string,
    resourceId: string,
    resourceName: string,
    guestName: string,
  ) {
    setUnassignDialog({
      type,
      reservationId,
      resourceId,
      resourceName,
      guestName,
    });
  }

  async function handleCreateTable() {
    startTransition(async () => {
      const result = await createTable(tableForm);
      if (result.success) {
        toast.success("Table created");
        setOpenTableDialog(false);
        setTableForm({ table_number: "", seats: 2, zone: "bistro" });
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create table");
      }
    });
  }

  async function handleCreateRoom() {
    startTransition(async () => {
      const result = await createRoom({
        name: roomForm.name,
        seats: roomForm.seats,
        description: roomForm.description || null,
      });
      if (result.success) {
        toast.success("Room created");
        setOpenRoomDialog(false);
        setRoomForm({ name: "", seats: 6, description: "" });
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create room");
      }
    });
  }

  async function handleToggleTable(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleTableActive(id, !current);
      if (result.success) {
        setTables((prev) =>
          prev.map((t) => (t.id === id ? { ...t, is_active: !current } : t)),
        );
        toast.success(`Table ${!current ? "activated" : "deactivated"}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  async function handleToggleRoom(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleRoomActive(id, !current);
      if (result.success) {
        setRooms((prev) =>
          prev.map((r) => (r.id === id ? { ...r, is_active: !current } : r)),
        );
        toast.success(`Room ${!current ? "activated" : "deactivated"}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  const occupiedTableIds = new Set(
    reservations.flatMap((r) => r.assigned_tables.map((t) => t.id)),
  );
  const occupiedRoomIds = new Set(
    reservations.flatMap((r) => r.assigned_rooms.map((r) => r.id)),
  );

  const candidateReservations = useMemo(() => {
    if (!assignDialog) return [];

    return reservations.filter((res) => {
      const hasSomething =
        res.assigned_tables.length > 0 || res.assigned_rooms.length > 0;
      if (hasSomething) return false;

      if (res.pax > assignDialog.seats) return false;

      if (assignDialog.type === "table") {
        if (res.zone === "room") return false;
      } else {
        if (res.zone !== "room") return false;
      }

      return true;
    });
  }, [assignDialog, reservations]);

  async function handleAssign(reservationId: string) {
    if (!assignDialog) return;

    const key = `assign-${reservationId}`;
    setLoadingKey(key);

    try {
      const result =
        assignDialog.type === "table"
          ? await assignTableToReservation(reservationId, assignDialog.id)
          : await assignRoomToReservation(reservationId, assignDialog.id);

      if (result.success) {
        toast.success("Assigned successfully");
        setAssignDialog(null);
        router.refresh();
      } else {
        toast.error(result.error || "Assignment failed");
      }
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="space-y-8">
      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-stone-100 p-1 rounded-xl h-auto pb-12">
          <TabsTrigger
            value="tables"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm text-stone-500 py-2.5 transition-all"
          >
            Tables
          </TabsTrigger>
          <TabsTrigger
            value="rooms"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm text-stone-500 py-2.5 transition-all"
          >
            Rooms
          </TabsTrigger>
          <TabsTrigger
            value="assign"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm text-stone-500 py-2.5 transition-all"
          >
            Assignments
          </TabsTrigger>
        </TabsList>

        {/* ==================== TABLES ==================== */}
        <TabsContent value="tables" className="space-y-6 mt-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold font-serif text-stone-800">
                Tables
              </h2>
              <p className="text-sm text-stone-400 mt-0.5">
                {tables.length} table{tables.length !== 1 ? "s" : ""} across
                bistro and coworking zones
              </p>
            </div>

            <Dialog open={openTableDialog} onOpenChange={setOpenTableDialog}>
              <DialogTrigger
                render={
                  <Button className="rounded-full bg-[#F36509] hover:bg-[#d95608] text-white shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Table
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">
                    Create New Table
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 pt-4">
                  <div className="space-y-2">
                    <Label className="text-stone-600">Table Number</Label>
                    <Input
                      placeholder="e.g. T-12 or A1"
                      value={tableForm.table_number}
                      onChange={(e) =>
                        setTableForm({
                          ...tableForm,
                          table_number: e.target.value,
                        })
                      }
                      className="rounded-xl border-stone-200 focus-visible:ring-[#F36509]/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-stone-600">Seats</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={tableForm.seats}
                      onChange={(e) =>
                        setTableForm({
                          ...tableForm,
                          seats: parseInt(e.target.value) || 1,
                        })
                      }
                      className="rounded-xl border-stone-200 focus-visible:ring-[#F36509]/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-stone-600">Zone</Label>
                    <Select
                      value={tableForm.zone}
                      onValueChange={(v) =>
                        setTableForm({
                          ...tableForm,
                          zone: v as "bistro" | "coworking",
                        })
                      }
                    >
                      <SelectTrigger className="rounded-xl border-stone-200 focus:ring-[#F36509]/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="bistro">Bistro</SelectItem>
                        <SelectItem value="coworking">Coworking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full rounded-full bg-[#F36509] hover:bg-[#d95608] text-white"
                    onClick={handleCreateTable}
                    disabled={isPending || !tableForm.table_number}
                  >
                    {isPending ? "Creating..." : "Create Table"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {tables.map((table) => {
              const isOccupied =
                !table.is_active || occupiedTableIds.has(table.id);
              const assignedTo = reservations.find((r) =>
                r.assigned_tables.some((t) => t.id === table.id),
              );

              return (
                <Card
                  key={table.id}
                  className={`pt-0 group rounded-2xl border-stone-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-stone-300 ${
                    isOccupied ? "opacity-70 border-dashed" : ""
                  }`}
                >
                  <div className="relative h-40 w-full overflow-hidden">
                    <Image
                      src={
                        tableImages[table.zone] || "/images/zones/default.jpg"
                      }
                      alt={`${table.zone} zone`}
                      fill
                      className={`object-cover transition-transform duration-500 ${
                        table.is_active ? "group-hover:scale-105" : "grayscale"
                      }`}
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    <Badge
                      className={`absolute top-3 right-3 backdrop-blur-md border-0 ${
                        isOccupied
                          ? "bg-stone-500/90 text-white"
                          : "bg-emerald-500/90 text-white"
                      }`}
                    >
                      {isOccupied ? (
                        "Occupied"
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Available
                        </span>
                      )}
                    </Badge>

                    <span className="absolute bottom-3 left-4 text-white/90 text-xs font-medium uppercase tracking-wider">
                      {table.zone}
                    </span>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-stone-800">
                        {table.table_number}
                      </h3>
                      <span className="text-[10px] text-stone-300 font-mono uppercase tracking-wider">
                        {table.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <span className="flex items-center gap-1.5 text-sm text-stone-500">
                        <Users className="h-3.5 w-3.5 text-stone-400" />
                        {table.seats} seats
                      </span>
                      <span className="flex items-center gap-1.5 text-sm text-stone-500 capitalize">
                        <MapPin className="h-3.5 w-3.5 text-stone-400" />
                        {table.zone}
                      </span>
                    </div>

                    {assignedTo && (
                      <p className="text-xs text-[#F36509] mb-3">
                        Assigned to {assignedTo.full_name}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                      <div className="flex items-center gap-2.5">
                        <Switch
                          checked={table.is_active}
                          onCheckedChange={() =>
                            handleToggleTable(table.id, table.is_active)
                          }
                          disabled={isPending}
                          className="data-[state=checked]:bg-[#F36509]"
                        />
                        <span className="text-sm text-stone-600">Active</span>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setAssignDialog({
                            type: "table",
                            id: table.id,
                            name: table.table_number,
                            seats: table.seats,
                            zone: table.zone,
                          })
                        }
                        disabled={isOccupied}
                        className="text-[#F36509] hover:text-[#d95608] hover:bg-[#F36509]/5 rounded-full px-4"
                      >
                        Assign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <button
              onClick={() => setOpenTableDialog(true)}
              className="group flex flex-col items-center justify-center gap-3 min-h-[320px] rounded-2xl border-2 border-dashed border-stone-300 hover:border-[#F36509] hover:bg-[#F36509]/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-stone-100 group-hover:bg-[#F36509]/10 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-stone-400 group-hover:text-[#F36509] transition-colors" />
              </div>
              <span className="text-sm font-medium text-stone-400 group-hover:text-[#F36509] transition-colors">
                Add New Table
              </span>
            </button>
          </div>
        </TabsContent>

        {/* ==================== ROOMS ==================== */}
        <TabsContent value="rooms" className="space-y-6 mt-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-xl font-semibold font-serif text-stone-800">
                Rooms
              </h2>
              <p className="text-sm text-stone-400 mt-0.5">
                {rooms.length} room{rooms.length !== 1 ? "s" : ""} available for
                booking
              </p>
            </div>

            <Dialog open={openRoomDialog} onOpenChange={setOpenRoomDialog}>
              <DialogTrigger
                render={
                  <Button className="rounded-full bg-[#F36509] hover:bg-[#d95608] text-white shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Room
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl">
                    Create New Room
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 pt-4">
                  <div className="space-y-2">
                    <Label className="text-stone-600">Room Name</Label>
                    <Input
                      placeholder="e.g. Conference A, Private Booth 1"
                      value={roomForm.name}
                      onChange={(e) =>
                        setRoomForm({ ...roomForm, name: e.target.value })
                      }
                      className="rounded-xl border-stone-200 focus-visible:ring-[#F36509]/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-stone-600">Capacity</Label>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      value={roomForm.seats}
                      onChange={(e) =>
                        setRoomForm({
                          ...roomForm,
                          seats: parseInt(e.target.value) || 1,
                        })
                      }
                      className="rounded-xl border-stone-200 focus-visible:ring-[#F36509]/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-stone-600">Description</Label>
                    <Input
                      placeholder="Projector, whiteboard, etc."
                      value={roomForm.description}
                      onChange={(e) =>
                        setRoomForm({
                          ...roomForm,
                          description: e.target.value,
                        })
                      }
                      className="rounded-xl border-stone-200 focus-visible:ring-[#F36509]/30"
                    />
                  </div>
                  <Button
                    className="w-full rounded-full bg-[#F36509] hover:bg-[#d95608] text-white"
                    onClick={handleCreateRoom}
                    disabled={isPending || !roomForm.name}
                  >
                    {isPending ? "Creating..." : "Create Room"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {rooms.map((room) => {
              const isOccupied =
                !room.is_active || occupiedRoomIds.has(room.id);
              const assignedTo = reservations.find((r) =>
                r.assigned_rooms.some((x) => x.id === room.id),
              );

              return (
                <Card
                  key={room.id}
                  className={`pt-0 group rounded-2xl border-stone-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-stone-300 ${
                    isOccupied ? "opacity-70 border-dashed" : ""
                  }`}
                >
                  <div className="relative h-40 w-full overflow-hidden">
                    <Image
                      src={roomImages.default}
                      alt={room.name}
                      fill
                      className={`object-cover transition-transform duration-500 ${
                        isOccupied ? "grayscale" : "group-hover:scale-105"
                      }`}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    <Badge
                      className={`absolute top-3 right-3 backdrop-blur-md border-0 ${
                        isOccupied
                          ? "bg-stone-500/90 text-white"
                          : "bg-emerald-500/90 text-white"
                      }`}
                    >
                      {isOccupied ? (
                        "Occupied"
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Available
                        </span>
                      )}
                    </Badge>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-stone-800">
                        {room.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-stone-500 mb-3">
                      <Users className="h-3.5 w-3.5 text-stone-400" />
                      {room.seats} seats
                    </div>

                    {room.description && (
                      <p className="text-sm text-stone-400 line-clamp-2 mb-4">
                        {room.description}
                      </p>
                    )}

                    {assignedTo && (
                      <p className="text-xs text-[#F36509] mb-3">
                        Assigned to {assignedTo.full_name}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                      <div className="flex items-center gap-2.5">
                        <Switch
                          checked={room.is_active}
                          onCheckedChange={() =>
                            handleToggleRoom(room.id, room.is_active)
                          }
                          disabled={isPending}
                          className="data-[state=checked]:bg-[#F36509]"
                        />
                        <span className="text-sm text-stone-600">Active</span>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setAssignDialog({
                            type: "room",
                            id: room.id,
                            name: room.name,
                            seats: room.seats,
                          })
                        }
                        disabled={isOccupied}
                        className="text-[#F36509] hover:text-[#d95608] hover:bg-[#F36509]/5 rounded-full px-4"
                      >
                        Assign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <button
              onClick={() => setOpenRoomDialog(true)}
              className="group flex flex-col items-center justify-center gap-3 min-h-[280px] rounded-2xl border-2 border-dashed border-stone-300 hover:border-[#F36509] hover:bg-[#F36509]/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-stone-100 group-hover:bg-[#F36509]/10 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-stone-400 group-hover:text-[#F36509] transition-colors" />
              </div>
              <span className="text-sm font-medium text-stone-400 group-hover:text-[#F36509] transition-colors">
                Add New Room
              </span>
            </button>
          </div>
        </TabsContent>

        {/* ==================== ASSIGNMENTS ==================== */}
        <TabsContent value="assign" className="space-y-6 mt-6">
          <div>
            <h2 className="text-xl font-semibold font-serif text-stone-800">
              Active Reservations
            </h2>
            <p className="text-sm text-stone-400 mt-0.5">
              Overview of current assignments. To assign a table or room, use
              the Assign button on the Tables / Rooms tabs.
            </p>
          </div>

          {reservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-stone-300" />
              </div>
              <h3 className="text-lg font-medium text-stone-600 mb-1">
                No reservations
              </h3>
              <p className="text-sm text-stone-400 max-w-sm">
                There are no pending or confirmed reservations waiting for
                assignment right now.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {reservations.map((res) => {
                const hasAssignment =
                  res.assigned_tables.length > 0 ||
                  res.assigned_rooms.length > 0;

                return (
                  <Card
                    key={res.id}
                    className="rounded-2xl border-stone-200 hover:border-stone-300 transition-colors"
                  >
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#F36509]/10 flex items-center justify-center shrink-0">
                          <Calendar className="h-5 w-5 text-[#F36509]" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium text-stone-800 flex items-center gap-2">
                            {res.full_name}
                            {hasAssignment && (
                              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                                Assigned
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-stone-500 flex flex-wrap gap-x-4 gap-y-1">
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-stone-400" />
                              {res.pax} pax
                            </span>
                            <span className="capitalize flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-stone-400" />
                              {res.zone}
                            </span>
                            <span>
                              {new Date(res.start_at).toLocaleString(
                                undefined,
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                },
                              )}
                            </span>
                            <Badge
                              variant="outline"
                              className="capitalize rounded-full text-xs font-medium"
                            >
                              {res.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {hasAssignment && (
                        <div className="rounded-xl bg-stone-50 border border-stone-100 p-3 space-y-2">
                          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                            Currently assigned
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {res.assigned_tables.map((t) => (
                              <div
                                key={t.id}
                                className="inline-flex items-center gap-2 rounded-full bg-white border border-stone-200 px-3 py-1.5 text-sm"
                              >
                                <Armchair className="h-3.5 w-3.5 text-[#F36509]" />
                                <span>
                                  Table {t.table_number}
                                  <span className="text-stone-400 ml-1">
                                    ({t.zone})
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openUnassignConfirm(
                                      "table",
                                      res.id,
                                      t.id,
                                      t.table_number,
                                      res.full_name,
                                    )
                                  }
                                  disabled={
                                    loadingKey === `unassign-table-${t.id}`
                                  }
                                  className="text-stone-400 hover:text-red-500 ml-1"
                                  title="Unassign"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                            {res.assigned_rooms.map((r) => (
                              <div
                                key={r.id}
                                className="inline-flex items-center gap-2 rounded-full bg-white border border-stone-200 px-3 py-1.5 text-sm"
                              >
                                <MapPin className="h-3.5 w-3.5 text-[#F36509]" />
                                <span>Room {r.name}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openUnassignConfirm(
                                      "room",
                                      res.id,
                                      r.id,
                                      r.name,
                                      res.full_name,
                                    )
                                  }
                                  disabled={
                                    loadingKey === `unassign-room-${r.id}`
                                  }
                                  className="text-stone-400 hover:text-red-500 ml-1"
                                  title="Unassign"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Assignment Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={!!assignDialog}
        onOpenChange={(open) => !open && setAssignDialog(null)}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Assign {assignDialog?.type === "table" ? "Table" : "Room"}{" "}
              <span className="text-[#F36509]">{assignDialog?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="pt-2">
            {candidateReservations.length === 0 ? (
              <div className="py-10 text-center">
                <Inbox className="mx-auto h-8 w-8 text-stone-300 mb-3" />
                <p className="text-stone-600 font-medium">
                  No matching reservations
                </p>
                <p className="text-sm text-stone-400 mt-1">
                  There are no open reservations that fit this{" "}
                  {assignDialog?.type} (capacity / zone).
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-stone-500 mb-3">
                  Select a reservation to assign:
                </p>
                {candidateReservations.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => handleAssign(res.id)}
                    disabled={loadingKey !== null}
                    className="w-full text-left rounded-xl border border-stone-200 hover:border-[#F36509]/40 hover:bg-[#F36509]/5 p-4 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-stone-800">
                          {res.full_name}
                        </div>
                        <div className="text-sm text-stone-500 flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                          <span>{res.pax} pax</span>
                          <span className="capitalize">{res.zone}</span>
                          <span>
                            {new Date(res.start_at).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-[#F36509] shrink-0">
                        {loadingKey === `assign-${res.id}`
                          ? "Assigning…"
                          : "Assign →"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Unassign Confirmation Dialog (hold ~8s) ───────────────────── */}
      <Dialog
        open={!!unassignDialog}
        onOpenChange={(open) => {
          if (!open) {
            resetHold();
            setUnassignDialog(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-stone-800">
              Unassign {unassignDialog?.type === "table" ? "Table" : "Room"}?
            </DialogTitle>
            <DialogDescription className="text-stone-500 pt-1">
              You are about to unassign{" "}
              <span className="font-medium text-stone-700">
                {unassignDialog?.type === "table"
                  ? `Table ${unassignDialog?.resourceName}`
                  : `Room ${unassignDialog?.resourceName}`}
              </span>{" "}
              from{" "}
              <span className="font-medium text-stone-700">
                {unassignDialog?.guestName}
              </span>
              .
              <br />
              Hold the button below for ~{UNASSIGN_HOLD_MS / 1000} seconds to
              confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-4 space-y-4">
            <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${holdProgress}%` }}
              />
            </div>

            <p className="text-center text-xs text-stone-400 tabular-nums">
              {holdProgress >= 100
                ? "Confirming…"
                : `${Math.ceil(
                    (UNASSIGN_HOLD_MS * (100 - holdProgress)) / 100 / 1000,
                  )}s remaining`}
            </p>

            <DialogFooter className="flex-col sm:flex-col gap-2 sm:space-x-0">
              <button
                type="button"
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startHold();
                }}
                onTouchEnd={cancelHold}
                onTouchCancel={cancelHold}
                disabled={loadingKey !== null}
                className="relative w-full select-none rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-medium py-3 px-6 transition-colors disabled:opacity-50 overflow-hidden"
              >
                <span className="relative z-10">
                  {holdProgress >= 100 ? "Unassigning…" : "Hold to unassign"}
                </span>
              </button>

              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-full text-stone-500"
                onClick={() => {
                  resetHold();
                  setUnassignDialog(null);
                }}
              >
                Cancel
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
