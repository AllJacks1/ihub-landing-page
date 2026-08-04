"use client";

import { useState, useTransition } from "react";
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
  bistro: "/images/bistro_table.png",
  coworking: "/images/computer_desktop.png",
};

const roomImages: Record<string, string> = {
  default: "/images/room_default.png",
};

export default function FloorClient({
  initialTables,
  initialRooms,
  initialReservations,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [tables, setTables] = useState(initialTables);
  const [rooms, setRooms] = useState(initialRooms);
  const [reservations] = useState(initialReservations);

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

  const [assigning, setAssigning] = useState<{
    type: "table" | "room";
    id: string;
  } | null>(null);

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

  async function handleAssign(reservationId: string) {
    if (!assigning) return;
    startTransition(async () => {
      const result =
        assigning.type === "table"
          ? await assignTableToReservation(reservationId, assigning.id)
          : await assignRoomToReservation(reservationId, assigning.id);

      if (result.success) {
        toast.success("Assigned successfully");
        setAssigning(null);
        router.refresh();
      } else {
        toast.error(result.error || "Assignment failed");
      }
    });
  }

  async function handleUnassignTable(reservationId: string, tableId: string) {
    startTransition(async () => {
      const result = await unassignTable(reservationId, tableId);
      if (result.success) {
        toast.success("Table unassigned");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to unassign");
      }
    });
  }

  async function handleUnassignRoom(reservationId: string, roomId: string) {
    startTransition(async () => {
      const result = await unassignRoom(reservationId, roomId);
      if (result.success) {
        toast.success("Room unassigned");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to unassign");
      }
    });
  }

  const assignedName = assigning
    ? assigning.type === "table"
      ? tables.find((t) => t.id === assigning.id)?.table_number
      : rooms.find((r) => r.id === assigning.id)?.name
    : null;

  return (
    <div className="space-y-8">
      {/* Assignment Banner */}
      {assigning && (
        <div className="rounded-2xl border border-[#F36509]/20 bg-gradient-to-r from-[#F36509]/5 to-orange-50 p-5 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#F36509]/10 flex items-center justify-center shrink-0">
              <Armchair className="h-5 w-5 text-[#F36509]" />
            </div>
            <div>
              <p className="font-medium text-stone-800">
                Ready to assign:{" "}
                <span className="text-[#F36509]">
                  {assigning.type === "table" ? "Table" : "Room"} {assignedName}
                </span>
              </p>
              <p className="text-sm text-stone-500">
                Switch to the Assignments tab and select a reservation to
                complete
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAssigning(null)}
            className="text-stone-400 hover:text-stone-600 hover:bg-stone-100"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      )}

      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-stone-100 p-1 rounded-xl h-auto p pb-12">
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
              ></DialogTrigger>
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

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tables.map((table) => {
              const isOccupied =
                !table.is_active || occupiedTableIds.has(table.id);
              const assignedTo = reservations.find((r) =>
                r.assigned_tables.some((t) => t.id === table.id),
              );

              return (
                <Card
                  key={table.id}
                  className={`group rounded-2xl border-stone-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-stone-300 ${
                    isOccupied ? "opacity-70 border-dashed" : ""
                  }`}
                >
                  {/* Image Header */}
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

                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
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
                          setAssigning({ type: "table", id: table.id })
                        }
                        disabled={isOccupied || isPending}
                        className="text-[#F36509] hover:text-[#d95608] hover:bg-[#F36509]/5 rounded-full px-4"
                      >
                        Assign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Add Table Placeholder */}
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
              ></DialogTrigger>
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

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => {
              const isOccupied =
                !room.is_active || occupiedRoomIds.has(room.id);
              const assignedTo = reservations.find((r) =>
                r.assigned_rooms.some((x) => x.id === room.id),
              );

              return (
                <Card
                  key={room.id}
                  className={`group rounded-2xl border-stone-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-stone-300 ${
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

                  <CardContent className="p-5">
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
                          setAssigning({ type: "room", id: room.id })
                        }
                        disabled={isOccupied || isPending}
                        className="text-[#F36509] hover:text-[#d95608] hover:bg-[#F36509]/5 rounded-full px-4"
                      >
                        Assign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Add Room Placeholder */}
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
              {assigning
                ? `Select a reservation to assign to ${assignedName}`
                : "Select a table or room first, then pick a reservation below"}
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
                      <div className="flex items-center justify-between gap-4">
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

                        <Button
                          size="sm"
                          disabled={!assigning || isPending}
                          onClick={() => handleAssign(res.id)}
                          className={`rounded-full px-5 transition-all shrink-0 ${
                            assigning
                              ? "bg-[#F36509] hover:bg-[#d95608] text-white"
                              : "bg-stone-100 text-stone-400 hover:bg-stone-100"
                          }`}
                        >
                          {assigning ? "Assign here" : "Select space first"}
                        </Button>
                      </div>

                      {/* Current assignments */}
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
                                    handleUnassignTable(res.id, t.id)
                                  }
                                  disabled={isPending}
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
                                    handleUnassignRoom(res.id, r.id)
                                  }
                                  disabled={isPending}
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
    </div>
  );
}
