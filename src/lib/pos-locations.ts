export type LocationType = "table" | "room" | "cubicle";

export type PosLocation = {
  type: LocationType;
  id: string;
  name: string;
  seats: number;
  zone: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const LOCATION_TYPES: LocationType[] = ["table", "room", "cubicle"];

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  table: "Table",
  room: "Room",
  cubicle: "Cubicle",
};

export function getLocationLabel(
  type: LocationType,
  name: string | null | undefined,
): string {
  if (!name) return "Unknown";
  return type === "table" ? `Table ${name}` : name;
}

const LOCATION_TABLES: Record<LocationType, string> = {
  table: "tables",
  room: "rooms",
  cubicle: "cubicles",
};

export function getLocationTableName(type: LocationType): string {
  return LOCATION_TABLES[type];
}

export function getLocationNameColumn(type: LocationType): string {
  return type === "table" ? "table_number" : "name";
}

export type RawTableRow = {
  id: string;
  table_number: string;
  seats: number;
  zone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RawRoomRow = {
  id: string;
  name: string;
  seats: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function mapRowToLocation(
  type: LocationType,
  row: RawTableRow | RawRoomRow,
): PosLocation {
  if (type === "table") {
    const table = row as RawTableRow;
    return {
      type,
      id: table.id,
      name: table.table_number,
      seats: Number(table.seats),
      zone: table.zone ?? null,
      description: null,
      is_active: table.is_active,
      created_at: table.created_at,
      updated_at: table.updated_at,
    };
  }

  const room = row as RawRoomRow;
  return {
    type,
    id: room.id,
    name: room.name,
    seats: Number(room.seats),
    zone: null,
    description: room.description ?? null,
    is_active: room.is_active,
    created_at: room.created_at,
    updated_at: room.updated_at,
  };
}
