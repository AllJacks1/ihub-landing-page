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
  Eye,
} from "lucide-react";
import Image from "next/image";
import {
  FloorReservationViewDialog,
  type FloorReservation,
} from "../sections/FloorReservationView";

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

  const [viewReservation, setViewReservation] =
    useState<FloorReservation | null>(null);

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

  const [assignDialog, setAssignDialog] = useState<{
    type: "table" | "room";
    id: string;
    name: string;
    seats: number;
    zone?: string;
  } | null>(null);

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
        <TabsList className="grid h-auto w-full max-w-md grid-cols-3 rounded-xl bg-stone-100 p-1 pb-12">
          <TabsTrigger
            value="tables"
            className="rounded-lg py-2.5 text-stone-500 transition-all data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm"
          >
            Tables
          </TabsTrigger>
          <TabsTrigger
            value="rooms"
            className="rounded-lg py-2.5 text-stone-500 transition-all data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm"
          >
            Rooms
          </TabsTrigger>
          <TabsTrigger
            value="assign"
            className="rounded-lg py-2.5 text-stone-500 transition-all data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm"
          >
            Assignments
          </TabsTrigger>
        </TabsList>

        {/* ==================== TABLES ==================== */}
        <TabsContent value="tables" className="mt-6 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold text-stone-800">
                Tables
              </h2>
              <p className="mt-0.5 text-sm text-stone-400">
                {tables.length} table{tables.length !== 1 ? "s" : ""} across
                bistro and coworking zones
              </p>
            </div>

            <Dialog open={openTableDialog} onOpenChange={setOpenTableDialog}>
              <DialogTrigger
                render={
                  <Button className="rounded-full bg-[#F36509] text-white shadow-sm hover:bg-[#d95608]">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Table
                  </Button>
                }
              />
              <DialogContent className="rounded-2xl sm:max-w-md">
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
                      onValueChange={(v) => {
                        if (v)
                          setTableForm({
                            ...tableForm,
                            zone: v as "bistro" | "coworking",
                          });
                      }}
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
                    className="w-full rounded-full bg-[#F36509] text-white hover:bg-[#d95608]"
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
                  className={`group overflow-hidden rounded-2xl border-stone-200 pt-0 transition-all duration-300 hover:border-stone-300 hover:shadow-lg ${
                    isOccupied ? "border-dashed opacity-70" : ""
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
                      className={`absolute top-3 right-3 border-0 backdrop-blur-md ${
                        isOccupied
                          ? "bg-stone-500/90 text-white"
                          : "bg-emerald-500/90 text-white"
                      }`}
                    >
                      {isOccupied ? (
                        "Occupied"
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                          Available
                        </span>
                      )}
                    </Badge>

                    <span className="absolute bottom-3 left-4 text-xs font-medium tracking-wider text-white/90 uppercase">
                      {table.zone}
                    </span>
                  </div>

                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-stone-800">
                        {table.table_number}
                      </h3>
                      <span className="font-mono text-[10px] tracking-wider text-stone-300 uppercase">
                        {table.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="mb-4 flex items-center gap-4">
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
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-xs text-[#F36509]">
                          Assigned to {assignedTo.full_name}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-full px-2.5 text-xs text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                          onClick={() => setViewReservation(assignedTo)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-stone-100 pt-3">
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
                        className="rounded-full px-4 text-[#F36509] hover:bg-[#F36509]/5 hover:text-[#d95608]"
                      >
                        Assign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <button
              type="button"
              onClick={() => setOpenTableDialog(true)}
              className="group flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 transition-all duration-300 hover:border-[#F36509] hover:bg-[#F36509]/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 transition-colors group-hover:bg-[#F36509]/10">
                <Plus className="h-6 w-6 text-stone-400 transition-colors group-hover:text-[#F36509]" />
              </div>
              <span className="text-sm font-medium text-stone-400 transition-colors group-hover:text-[#F36509]">
                Add New Table
              </span>
            </button>
          </div>
        </TabsContent>

        {/* ==================== ROOMS ==================== */}
        <TabsContent value="rooms" className="mt-6 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold text-stone-800">
                Rooms
              </h2>
              <p className="mt-0.5 text-sm text-stone-400">
                {rooms.length} room{rooms.length !== 1 ? "s" : ""} available for
                booking
              </p>
            </div>

            <Dialog open={openRoomDialog} onOpenChange={setOpenRoomDialog}>
              <DialogTrigger
                render={
                  <Button className="rounded-full bg-[#F36509] text-white shadow-sm hover:bg-[#d95608]">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Room
                  </Button>
                }
              />
              <DialogContent className="rounded-2xl sm:max-w-md">
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
                    className="w-full rounded-full bg-[#F36509] text-white hover:bg-[#d95608]"
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
                  className={`group overflow-hidden rounded-2xl border-stone-200 pt-0 transition-all duration-300 hover:border-stone-300 hover:shadow-lg ${
                    isOccupied ? "border-dashed opacity-70" : ""
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
                      className={`absolute top-3 right-3 border-0 backdrop-blur-md ${
                        isOccupied
                          ? "bg-stone-500/90 text-white"
                          : "bg-emerald-500/90 text-white"
                      }`}
                    >
                      {isOccupied ? (
                        "Occupied"
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                          Available
                        </span>
                      )}
                    </Badge>
                  </div>

                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-stone-800">
                        {room.name}
                      </h3>
                    </div>

                    <div className="mb-3 flex items-center gap-1.5 text-sm text-stone-500">
                      <Users className="h-3.5 w-3.5 text-stone-400" />
                      {room.seats} seats
                    </div>

                    {room.description && (
                      <p className="mb-4 line-clamp-2 text-sm text-stone-400">
                        {room.description}
                      </p>
                    )}

                    {assignedTo && (
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-xs text-[#F36509]">
                          Assigned to {assignedTo.full_name}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-full px-2.5 text-xs text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                          onClick={() => setViewReservation(assignedTo)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-stone-100 pt-3">
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
                        className="rounded-full px-4 text-[#F36509] hover:bg-[#F36509]/5 hover:text-[#d95608]"
                      >
                        Assign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <button
              type="button"
              onClick={() => setOpenRoomDialog(true)}
              className="group flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 transition-all duration-300 hover:border-[#F36509] hover:bg-[#F36509]/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 transition-colors group-hover:bg-[#F36509]/10">
                <Plus className="h-6 w-6 text-stone-400 transition-colors group-hover:text-[#F36509]" />
              </div>
              <span className="text-sm font-medium text-stone-400 transition-colors group-hover:text-[#F36509]">
                Add New Room
              </span>
            </button>
          </div>
        </TabsContent>

        {/* ==================== ASSIGNMENTS ==================== */}
        <TabsContent value="assign" className="mt-6 space-y-6">
          <div>
            <h2 className="font-serif text-xl font-semibold text-stone-800">
              Active Reservations
            </h2>
            <p className="mt-0.5 text-sm text-stone-400">
              Overview of current assignments. To assign a table or room, use
              the Assign button on the Tables / Rooms tabs.
            </p>
          </div>

          {reservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
                <Inbox className="h-8 w-8 text-stone-300" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-stone-600">
                No reservations
              </h3>
              <p className="max-w-sm text-sm text-stone-400">
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
                    className="rounded-2xl border-stone-200 transition-colors hover:border-stone-300"
                  >
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F36509]/10">
                          <Calendar className="h-5 w-5 text-[#F36509]" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-2 font-medium text-stone-800">
                            {res.full_name}
                            {hasAssignment && (
                              <Badge className="border-0 bg-emerald-100 text-xs text-emerald-700">
                                Assigned
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-stone-400" />
                              {res.pax} pax
                            </span>
                            <span className="flex items-center gap-1 capitalize">
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
                              className="rounded-full text-xs font-medium capitalize"
                            >
                              {res.status}
                            </Badge>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 rounded-full text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                          onClick={() => setViewReservation(res)}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View
                        </Button>
                      </div>

                      {hasAssignment && (
                        <div className="space-y-2 rounded-xl border border-stone-100 bg-stone-50 p-3">
                          <p className="text-xs font-medium tracking-wider text-stone-500 uppercase">
                            Currently assigned
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {res.assigned_tables.map((t) => (
                              <div
                                key={t.id}
                                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm"
                              >
                                <Armchair className="h-3.5 w-3.5 text-[#F36509]" />
                                <span>
                                  Table {t.table_number}
                                  <span className="ml-1 text-stone-400">
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
                                  className="ml-1 text-stone-400 hover:text-red-500"
                                  title="Unassign"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                            {res.assigned_rooms.map((r) => (
                              <div
                                key={r.id}
                                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm"
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
                                  className="ml-1 text-stone-400 hover:text-red-500"
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

      {/* Assignment dialog */}
      <Dialog
        open={!!assignDialog}
        onOpenChange={(open) => !open && setAssignDialog(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Assign {assignDialog?.type === "table" ? "Table" : "Room"}{" "}
              <span className="text-[#F36509]">{assignDialog?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="pt-2">
            {candidateReservations.length === 0 ? (
              <div className="py-10 text-center">
                <Inbox className="mx-auto mb-3 h-8 w-8 text-stone-300" />
                <p className="font-medium text-stone-600">
                  No matching reservations
                </p>
                <p className="mt-1 text-sm text-stone-400">
                  There are no open reservations that fit this{" "}
                  {assignDialog?.type} (capacity / zone).
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="mb-3 text-sm text-stone-500">
                  Select a reservation to assign:
                </p>
                {candidateReservations.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => handleAssign(res.id)}
                    disabled={loadingKey !== null}
                    className="w-full rounded-xl border border-stone-200 p-4 text-left transition-all hover:border-[#F36509]/40 hover:bg-[#F36509]/5 disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-stone-800">
                          {res.full_name}
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-stone-500">
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
                      <span className="shrink-0 text-sm font-medium text-[#F36509]">
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

      {/* Unassign hold-to-confirm */}
      <Dialog
        open={!!unassignDialog}
        onOpenChange={(open) => {
          if (!open) {
            resetHold();
            setUnassignDialog(null);
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-stone-800">
              Unassign {unassignDialog?.type === "table" ? "Table" : "Room"}?
            </DialogTitle>
            <DialogDescription className="pt-1 text-stone-500">
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

          <div className="space-y-4 pt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-red-500"
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

            <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
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
                className="relative w-full select-none overflow-hidden rounded-full bg-red-500 px-6 py-3 font-medium text-white transition-colors hover:bg-red-600 active:bg-red-700 disabled:opacity-50"
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

      <FloorReservationViewDialog
        reservation={viewReservation}
        open={!!viewReservation}
        onOpenChange={(open) => {
          if (!open) setViewReservation(null);
        }}
      />
    </div>
  );
}
