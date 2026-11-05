"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import z from "zod/v3";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  getLocationNameColumn,
  getLocationTableName,
  LOCATION_TYPE_LABELS,
  LocationType,
  mapRowToLocation,
  PosLocation,
  RawRoomRow,
  RawTableRow,
} from "./pos-locations";

type PosCategory = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

export type PosBillingSettings = {
  branch_id: string;
  vat_enabled: boolean;
  vat_rate: number;
  service_charge_enabled: boolean;
  service_charge_rate: number;
  service_charge_rounding: string;
  price_mode: "exclusive" | "inclusive";
};

export type PosProduct = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  category_name: string;
  area_id: string | null;
  area_code: string | null;
  area_name: string | null;
  stock_quantity: number;
  reorder_level: number;
  inventory_id: string | null;
  branch_id: string | null;
};
export type PosSession = {
  id: string;
  table_id: string | null;
  room_id: string | null;
  cubicle_id: string | null;
  branch_id: string | null;
  qr_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  table_number?: string | null;
  room_name?: string | null;
  cubicle_name?: string | null;
};

export interface Table {
  id: string;
  table_number: string;
  zone: string;
  seats: number;
  is_active: boolean;
}

export interface Room {
  id: string;
  name: string;
  seats: number;
  is_active: boolean;
}

type PosSessionRow = {
  id: string;
  table_id: string | null;
  room_id: string | null;
  cubicle_id: string | null;
  branch_id: string | null;
  qr_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  tables: { table_number: string } | null;
  rooms: { name: string } | null;
  cubicles: { name: string } | null;
};

export type PosBranch = {
  id: string;
  name: string;
  code: string | null;
  location: string | null;
  is_active: boolean;
};

export type PosTerminal = {
  id: string;
  branch_id: string;
  name: string;
  code: string | null;
  terminal_type: string;
  is_active: boolean;
};

export type PosShift = {
  id: string;
  branch_id: string;
  terminal_id: string;
  cashier_user_id: string;
  shift_number: string | null;
  status: string;
  opened_at: string;
  starting_cash: number;
  expected_cash: number;
  actual_cash: number | null;
  variance: number | null;
  notes: string | null;
  closed_at: string | null;
  /** @deprecated Legacy; no longer used by application logic */
  drawer_id: string | null;
  opening_counted_cash: number | null;
  retained_cash: number | null;
  turnover_status: string | null;
  /** Shift from which this shift received a retained float */
  previous_shift_id: string | null;
  turnover_acknowledged_by: string | null;
  turnover_acknowledged_at: string | null;
  turnover_actual_cash: number | null;
  turnover_difference: number | null;
};

/** Pending retained-float handover from a previous closed shift on the same terminal */
export type PendingTurnover = {
  shift_id: string;
  shift_number: string | null;
  branch_id: string;
  terminal_id: string;
  cashier_user_id: string;
  cashier_name: string | null;
  retained_cash: number;
  closed_at: string | null;
  turnover_status: string;
};

const createLocationSchema = z.object({
  type: z.enum(["table", "room", "cubicle"]),
  name: z.string().min(1, "Name is required").max(100),
  seats: z.coerce.number().min(1).max(50),
  zone: z.enum(["bistro", "coworking"]).optional(),
  description: z.string().max(500).optional().nullable(),
});

const updateLocationSchema = z.object({
  type: z.enum(["table", "room", "cubicle"]),
  id: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100).optional(),
  seats: z.coerce.number().min(1).max(50).optional(),
  zone: z.enum(["bistro", "coworking"]).optional(),
  description: z.string().max(500).optional().nullable(),
});

function mapSessionRow(row: PosSessionRow): PosSession {
  return {
    id: row.id,
    table_id: row.table_id,
    room_id: row.room_id,
    cubicle_id: row.cubicle_id,
    branch_id: row.branch_id ?? null,
    qr_token: row.qr_token,
    expires_at: row.expires_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_active: row.is_active,
    table_number: row.tables?.table_number ?? null,
    room_name: row.rooms?.name ?? null,
    cubicle_name: row.cubicles?.name ?? null,
  };
}

function generateQrToken(): string {
  return randomBytes(16).toString("hex");
}

async function createPosSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server action does not need to modify cookies here.
        },
      },
    },
  );
}

export async function getPosCategories(): Promise<{
  success: boolean;
  data: PosCategory[];
  error?: string;
}> {
  try {
    const supabase = await createPosSupabaseClient();

    const { data, error } = await supabase
      .from("pos_categories")
      .select("id, name, description, is_active")
      .order("name", { ascending: true });

    if (error) {
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }

    return {
      success: true,
      data: data ?? [],
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error ? error.message : "Failed to load categories",
    };
  }
}

const createSessionInputSchema = z.object({
  table_id: z.string().uuid().optional(),
  room_id: z.string().uuid().optional(),
  cubicle_id: z.string().uuid().optional(),
  branch_id: z.string().uuid(),
});

let posAdminClient: SupabaseClient | null = null;

function createPosAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }

  if (!serviceRoleKey || serviceRoleKey.trim() === "") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured; staff-side POS operations are disabled",
    );
  }

  if (!posAdminClient) {
    posAdminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return posAdminClient;
}

type PosStaffUser = {
  id: string;
  email: string | null;
};

async function requirePosStaff(): Promise<
  | { authorized: true; user: PosStaffUser }
  | { authorized: false; error: string }
> {
  const authClient = await createPosSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return { authorized: false, error: "Unauthorized" };
  }

  const adminClient = createPosAdminClient();

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return { authorized: false, error: "Staff verification failed" };
  }

  if (!profile) {
    return { authorized: false, error: "Unauthorized: staff account required" };
  }

  return {
    authorized: true,
    user: { id: user.id, email: user.email ?? null },
  };
}

export async function getPosProducts(branchId?: string): Promise<{
  success: boolean;
  data: PosProduct[];
  error?: string;
}> {
  try {
    const supabase = await createPosSupabaseClient();

    let inventoryQuery = supabase
      .from("pos_inventory")
      .select(
        `
        id,
        branch_id,
        product_id,
        stock_quantity,
        reorder_level,
        product:product_id (
          id,
          category_id,
          name,
          description,
          price,
          image_url,
          is_active,
          area:area_id (
            id,
            code,
            name
          )
        )
      `,
      )
      .order("updated_at", { ascending: false });

    if (branchId) {
      inventoryQuery = inventoryQuery.eq("branch_id", branchId);
    }

    const [
      { data: inventoryRows, error: inventoryError },
      { data: categories },
    ] = await Promise.all([
      inventoryQuery,
      supabase.from("pos_categories").select("id, name"),
    ]);

    if (inventoryError) {
      return {
        success: false,
        data: [],
        error: inventoryError.message,
      };
    }

    const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]));

    type ProductJoin = {
      id: string;
      category_id: string | null;
      name: string;
      description: string | null;
      price: number | string;
      image_url: string | null;
      is_active: boolean;
      area_id: string | null;
      area:
        | {
            id: string;
            code: string;
            name: string;
          }
        | null
        | Array<{
            id: string;
            code: string;
            name: string;
          }>;
    };

    type InventoryJoinRow = {
      id: string;
      branch_id: string | null;
      product_id: string;
      stock_quantity: number | string | null;
      reorder_level: number | string | null;
      product: ProductJoin | ProductJoin[] | null;
    };

    const mappedProducts: PosProduct[] = (inventoryRows ?? [])
      .flatMap((row) => {
        const r = row as InventoryJoinRow;
        const product = Array.isArray(r.product) ? r.product[0] : r.product;
        if (!product || !product.is_active) return [];

        // Handle both object and array shapes from PostgREST
        const area = Array.isArray(product.area)
          ? product.area[0]
          : product.area;

        const item: PosProduct = {
          id: product.id,
          category_id: product.category_id,
          name: product.name,
          description: product.description,
          price: Number(product.price),
          image_url: product.image_url,
          is_active: product.is_active,
          category_name: product.category_id
            ? (categoryMap.get(product.category_id) ?? "Uncategorized")
            : "Uncategorized",
          area_id: product.area_id ?? area?.id ?? null,
          area_code: area?.code ?? null, // ← this is the important one
          area_name: area?.name ?? null,
          stock_quantity: Number(r.stock_quantity ?? 0),
          reorder_level: Number(r.reorder_level ?? 0),
          inventory_id: r.id,
          branch_id: r.branch_id ?? null,
        };

        return [item];
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      success: true,
      data: mappedProducts,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Failed to load products",
    };
  }
}

export async function getPosSessions(): Promise<{
  success: boolean;
  data: PosSession[];
  error?: string;
}> {
  try {
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return {
        success: false,
        data: [],
        error: staff.error,
      };
    }

    const supabase = createPosAdminClient();

    const { data, error } = await supabase
      .from("pos_sessions")
      .select(
        `
        id,
        table_id,
        room_id,
        cubicle_id,
        qr_token,
        expires_at,
        created_at,
        updated_at,
        is_active,
        tables:table_id (table_number),
        rooms:room_id (name),
        cubicles:cubicle_id (name)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }

    const mappedSessions: PosSession[] = (
      (data ?? []) as unknown as PosSessionRow[]
    ).map(mapSessionRow);

    return {
      success: true,
      data: mappedSessions,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Failed to load sessions",
    };
  }
}

export async function createPosSession(input: {
  table_id?: string;
  room_id?: string;
  cubicle_id?: string;
  branch_id: string;
}): Promise<{
  success: boolean;
  data?: PosSession;
  error?: string;
}> {
  try {
    const validated = createSessionInputSchema.parse(input);

    const provided: Array<[LocationType, string]> = [
      ["table", validated.table_id],
      ["room", validated.room_id],
      ["cubicle", validated.cubicle_id],
    ].filter((entry): entry is [LocationType, string] => Boolean(entry[1]));

    if (provided.length === 0) {
      return {
        success: false,
        error: "A table, room, or cubicle must be provided",
      };
    }

    if (provided.length > 1) {
      return {
        success: false,
        error: "Cannot specify more than one location type",
      };
    }

    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const [locationType, locationId] = provided[0];
    const supabase = createPosAdminClient();

    // The submitted location must exist and be active before a
    // QR session is issued for it.
    const { data: location, error: locationError } = await supabase
      .from(getLocationTableName(locationType))
      .select("id, is_active")
      .eq("id", locationId)
      .maybeSingle();

    if (locationError) {
      return { success: false, error: locationError.message };
    }

    if (!location) {
      return {
        success: false,
        error: "The selected location no longer exists",
      };
    }

    if (!location.is_active) {
      return {
        success: false,
        error: `The selected ${LOCATION_TYPE_LABELS[locationType].toLowerCase()} is deactivated`,
      };
    }

    const qr_token = generateQrToken();
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from creation

    const { data, error } = await supabase
      .from("pos_sessions")
      .insert({
        table_id: locationType === "table" ? locationId : null,
        room_id: locationType === "room" ? locationId : null,
        cubicle_id: locationType === "cubicle" ? locationId : null,
        branch_id: validated.branch_id,
        qr_token,
        expires_at,
        is_active: true,
      })
      .select(
        `
      id, table_id, room_id, cubicle_id, branch_id,
      qr_token, expires_at, created_at, updated_at, is_active,
      tables:table_id (table_number),
      rooms:room_id (name),
      cubicles:cubicle_id (name)
    `,
      )
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const mappedSession: PosSession = mapSessionRow(
      data as unknown as PosSessionRow,
    );

    return {
      success: true,
      data: mappedSession,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create session",
    };
  }
}

export async function deactivatePosSession(sessionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createPosAdminClient();

    const { error } = await supabase
      .from("pos_sessions")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", sessionId);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to deactivate session",
    };
  }
}

export async function getPosSessionByToken(qr_token: string): Promise<{
  success: boolean;
  data?: PosSession & { valid: boolean; expired: boolean };
  error?: string;
}> {
  try {
    // Customer-facing validation goes through the SECURITY DEFINER
    // function validate_pos_session() (see migration
    // 20261009_add_cubicles_and_seed_locations.sql). It returns only
    // the validation result and the location label for this token —
    // pos_sessions itself has no public read policy, so customers can
    // never list sessions or read other customers' QR tokens.
    const supabase = await createPosSupabaseClient();

    const { data, error } = await supabase.rpc("validate_pos_session", {
      p_qr_token: qr_token,
    });

    if (error) {
      return {
        success: false,
        data: undefined,
        error: error.message,
      };
    }

    const payload = data as {
      found?: boolean;
      valid?: boolean;
      expired?: boolean;
      table_number?: string | null;
      room_name?: string | null;
      cubicle_name?: string | null;
    } | null;

    const mappedSession: PosSession & { valid: boolean; expired: boolean } = {
      id: "",
      table_id: null,
      room_id: null,
      cubicle_id: null,
      branch_id: null,
      qr_token: "",
      expires_at: "",
      created_at: "",
      updated_at: "",
      is_active: false,
      table_number: payload?.table_number ?? null,
      room_name: payload?.room_name ?? null,
      cubicle_name: payload?.cubicle_name ?? null,
      valid: payload?.valid === true,
      expired: payload?.expired === true,
    };

    return {
      success: true,
      data: mappedSession,
    };
  } catch (error) {
    return {
      success: false,
      data: undefined,
      error:
        error instanceof Error ? error.message : "Failed to validate session",
    };
  }
}

export async function getLocations(type: LocationType): Promise<{
  success: boolean;
  data: PosLocation[];
  error?: string;
}> {
  try {
    const supabase = await createPosSupabaseClient();

    const { data, error } = await supabase
      .from(getLocationTableName(type))
      .select("*")
      .order(getLocationNameColumn(type), { ascending: true });

    if (error) {
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }

    const mappedLocations: PosLocation[] = (
      (data ?? []) as Array<RawTableRow | RawRoomRow>
    ).map((row) => mapRowToLocation(type, row));

    return {
      success: true,
      data: mappedLocations,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error ? error.message : "Failed to load locations",
    };
  }
}

export async function createLocation(input: {
  type: LocationType;
  name: string;
  seats: number;
  zone?: "bistro" | "coworking";
  description?: string | null;
}): Promise<{
  success: boolean;
  data?: PosLocation;
  error?: string;
}> {
  try {
    const validated = createLocationSchema.parse(input);

    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createPosAdminClient();

    // Prevent duplicate location names within the same scope
    const nameColumn = getLocationNameColumn(validated.type);
    const duplicateQuery = supabase
      .from(getLocationTableName(validated.type))
      .select("id")
      .eq(nameColumn, validated.name);

    const { data: existing } =
      validated.type === "table"
        ? await duplicateQuery
            .eq("zone", validated.zone ?? "bistro")
            .maybeSingle()
        : await duplicateQuery.maybeSingle();

    if (existing) {
      return {
        success: false,
        error: `${LOCATION_TYPE_LABELS[validated.type]} "${validated.name}" already exists`,
      };
    }

    const payload: Record<string, unknown> = {
      seats: validated.seats,
      is_active: true,
    };

    if (validated.type === "table") {
      payload.table_number = validated.name;
      payload.zone = validated.zone ?? "bistro";
    } else {
      payload.name = validated.name;
      payload.description = validated.description ?? null;
    }

    const { data, error } = await supabase
      .from(getLocationTableName(validated.type))
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: mapRowToLocation(validated.type, data as RawTableRow | RawRoomRow),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create location",
    };
  }
}

export async function updateLocation(input: {
  type: LocationType;
  id: string;
  name?: string;
  seats?: number;
  zone?: "bistro" | "coworking";
  description?: string | null;
}): Promise<{
  success: boolean;
  data?: PosLocation;
  error?: string;
}> {
  try {
    const validated = updateLocationSchema.parse(input);
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createPosAdminClient();

    // Prevent duplicate names (excluding the row being edited).
    // For tables, uniqueness is scoped per zone — resolve the row's
    // current zone when the update does not change it.
    if (validated.name) {
      const nameColumn = getLocationNameColumn(validated.type);
      const duplicateQuery = supabase
        .from(getLocationTableName(validated.type))
        .select("id")
        .eq(nameColumn, validated.name)
        .neq("id", validated.id);

      let effectiveZone = validated.zone;
      if (validated.type === "table" && effectiveZone === undefined) {
        const { data: currentRow } = await supabase
          .from("tables")
          .select("zone")
          .eq("id", validated.id)
          .maybeSingle();
        effectiveZone =
          (currentRow as { zone: "bistro" | "coworking" } | null)?.zone ??
          "bistro";
      }

      const { data: existing } =
        validated.type === "table"
          ? await duplicateQuery.eq("zone", effectiveZone).maybeSingle()
          : await duplicateQuery.maybeSingle();

      if (existing) {
        return {
          success: false,
          error: `${LOCATION_TYPE_LABELS[validated.type]} "${validated.name}" already exists`,
        };
      }
    }

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.name !== undefined) {
      if (validated.type === "table") {
        payload.table_number = validated.name;
      } else {
        payload.name = validated.name;
      }
    }

    if (validated.seats !== undefined) {
      payload.seats = validated.seats;
    }

    if (validated.type === "table") {
      if (validated.zone !== undefined) {
        payload.zone = validated.zone;
      }
    } else if (validated.description !== undefined) {
      payload.description = validated.description;
    }

    const { data, error } = await supabase
      .from(getLocationTableName(validated.type))
      .update(payload)
      .eq("id", validated.id)
      .select("*")
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: mapRowToLocation(validated.type, data as RawTableRow | RawRoomRow),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update location",
    };
  }
}

export async function setLocationActive(input: {
  type: LocationType;
  id: string;
  is_active: boolean;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validated = z
      .object({
        type: z.enum(["table", "room", "cubicle"]),
        id: z.string().min(1),
        is_active: z.boolean(),
      })
      .parse(input);
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createPosAdminClient();

    const { error } = await supabase
      .from(getLocationTableName(validated.type))
      .update({
        is_active: validated.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.id);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update location",
    };
  }
}

export async function deleteLocation(input: {
  type: LocationType;
  id: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validated = z
      .object({
        type: z.enum(["table", "room", "cubicle"]),
        id: z.string().min(1),
      })
      .parse(input);
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createPosAdminClient();

    // Block hard delete while QR sessions still reference the location.
    // Staff should deactivate it instead so existing session history is kept.
    const sessionColumn =
      validated.type === "table"
        ? "table_id"
        : validated.type === "room"
          ? "room_id"
          : "cubicle_id";

    const { count, error: countError } = await supabase
      .from("pos_sessions")
      .select("*", { count: "exact", head: true })
      .eq(sessionColumn, validated.id);

    if (countError) {
      return {
        success: false,
        error: countError.message,
      };
    }

    if ((count ?? 0) > 0) {
      return {
        success: false,
        error: `${LOCATION_TYPE_LABELS[validated.type]} has ${count} QR session(s). Deactivate it instead of removing it.`,
      };
    }

    const { error } = await supabase
      .from(getLocationTableName(validated.type))
      .delete()
      .eq("id", validated.id);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to remove location",
    };
  }
}

export async function getPosBranches(): Promise<{
  success: boolean;
  data: PosBranch[];
  error?: string;
}> {
  try {
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, data: [], error: staff.error };
    }

    const supabase = createPosAdminClient();
    const { data, error } = await supabase
      .from("pos_branches")
      .select("id, name, code, location, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) return { success: false, data: [], error: error.message };
    return { success: true, data: (data ?? []) as PosBranch[] };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Failed to load branches",
    };
  }
}

export async function getPrimaryTerminal(branchId: string): Promise<{
  success: boolean;
  data?: PosTerminal;
  error?: string;
}> {
  try {
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createPosAdminClient();
    const { data, error } = await supabase
      .from("pos_terminals")
      .select("id, branch_id, name, code, terminal_type, is_active")
      .eq("branch_id", branchId)
      .eq("terminal_type", "primary")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    if (!data) {
      return {
        success: false,
        error: "No active primary terminal for this branch",
      };
    }
    return { success: true, data: data as PosTerminal };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load terminal",
    };
  }
}

export async function getOpenShift(params: {
  branch_id: string;
  terminal_id: string;
  cashier_user_id: string;
}): Promise<{
  success: boolean;
  data?: PosShift;
  error?: string;
}> {
  try {
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createPosAdminClient();
    const { data, error } = await supabase
      .from("pos_shifts")
      .select("*")
      .eq("branch_id", params.branch_id)
      .eq("terminal_id", params.terminal_id)
      .eq("cashier_user_id", params.cashier_user_id)
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    return { success: true, data: (data as PosShift) ?? undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load shift",
    };
  }
}

export async function openPosShift(params: {
  branch_id: string;
  terminal_id: string;
  cashier_user_id: string;
  starting_cash: number;
  opening_counted_cash?: number | null;
  notes?: string | null;
  /**
   * When acknowledging a pending retained-float turnover:
   * - previous_shift_id: the closed shift that left the float
   * - turnover_actual_cash: physical count of cash received
   * - acknowledge: must be true to complete the previous shift's turnover
   */
  previous_shift_id?: string | null;
  turnover_actual_cash?: number | null;
  acknowledge_turnover?: boolean;
}): Promise<{
  success: boolean;
  data?: PosShift;
  error?: string;
}> {
  try {
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    if (staff.user.id !== params.cashier_user_id) {
      return { success: false, error: "Cannot open a shift for another user" };
    }

    const starting = Number(params.starting_cash);
    if (!Number.isFinite(starting) || starting < 0) {
      return { success: false, error: "Starting cash must be 0 or greater" };
    }

    const counted =
      params.opening_counted_cash != null &&
      Number.isFinite(Number(params.opening_counted_cash))
        ? Number(params.opening_counted_cash)
        : starting;

    const supabase = createPosAdminClient();

    // Guard: one open shift per (terminal + cashier)
    const existing = await getOpenShift({
      branch_id: params.branch_id,
      terminal_id: params.terminal_id,
      cashier_user_id: params.cashier_user_id,
    });
    if (existing.success && existing.data) {
      return {
        success: false,
        error: "You already have an open shift on this terminal",
      };
    }

    let previousShiftId: string | null = null;
    let turnoverAcked = false;

    // Explicit acknowledgement of a pending retained-float turnover.
    // Starting a shift alone must NEVER complete the previous turnover.
    if (params.acknowledge_turnover && params.previous_shift_id) {
      const actualReceived = Number(params.turnover_actual_cash);
      if (!Number.isFinite(actualReceived) || actualReceived < 0) {
        return {
          success: false,
          error:
            "Enter a valid physical cash count to acknowledge the turnover",
        };
      }

      const { data: prev, error: prevErr } = await supabase
        .from("pos_shifts")
        .select(
          "id, branch_id, terminal_id, status, turnover_status, retained_cash, cashier_user_id",
        )
        .eq("id", params.previous_shift_id)
        .maybeSingle();

      if (prevErr) return { success: false, error: prevErr.message };
      if (!prev) {
        return { success: false, error: "Previous shift not found" };
      }
      if (prev.status !== "closed") {
        return {
          success: false,
          error: "Previous shift is not closed; cannot acknowledge turnover",
        };
      }
      if (prev.turnover_status !== "pending") {
        return {
          success: false,
          error:
            prev.turnover_status === "completed"
              ? "This turnover has already been acknowledged"
              : "No pending turnover on the previous shift",
        };
      }
      if (prev.terminal_id !== params.terminal_id) {
        return {
          success: false,
          error: "Turnover does not belong to this terminal",
        };
      }
      if (prev.branch_id !== params.branch_id) {
        return {
          success: false,
          error: "Turnover does not belong to this branch",
        };
      }

      const expectedRetained = Number(prev.retained_cash ?? 0);
      const difference = Number((actualReceived - expectedRetained).toFixed(2));
      const ackedAt = new Date().toISOString();

      // Atomic-ish: update previous shift first; if it fails or was raced, abort.
      // Condition on turnover_status = 'pending' prevents double acknowledgement.
      const { data: updatedPrev, error: ackErr } = await supabase
        .from("pos_shifts")
        .update({
          turnover_status: "completed",
          turnover_acknowledged_by: staff.user.id,
          turnover_acknowledged_at: ackedAt,
          turnover_actual_cash: actualReceived,
          turnover_difference: difference,
          updated_at: ackedAt,
        })
        .eq("id", prev.id)
        .eq("turnover_status", "pending")
        .select("id")
        .maybeSingle();

      if (ackErr) {
        return {
          success: false,
          error: `Failed to acknowledge turnover: ${ackErr.message}`,
        };
      }
      if (!updatedPrev) {
        return {
          success: false,
          error:
            "Turnover was already acknowledged by another cashier. Refresh and try again.",
        };
      }

      previousShiftId = prev.id;
      turnoverAcked = true;

      // Opening cash for the new shift is the physical count the cashier just confirmed.
      // (Caller should already have set starting_cash / opening_counted_cash to this value.)
    } else if (params.previous_shift_id && !params.acknowledge_turnover) {
      // Safety: never silently complete a turnover just because a previous_shift_id was sent.
      return {
        success: false,
        error:
          "Turnover acknowledgement is required. Set acknowledge_turnover and provide the counted cash.",
      };
    }

    const shiftNumber = `SH-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${randomBytes(2).toString("hex").toUpperCase()}`;

    const { data, error } = await supabase
      .from("pos_shifts")
      .insert({
        branch_id: params.branch_id,
        terminal_id: params.terminal_id,
        cashier_user_id: params.cashier_user_id,
        shift_number: shiftNumber,
        status: "open",
        starting_cash: starting,
        opening_counted_cash: counted,
        expected_cash: counted,
        drawer_id: null, // cash drawers removed from workflow
        previous_shift_id: previousShiftId,
        notes: params.notes?.trim() || null,
      })
      .select("*")
      .single();

    if (error) {
      // Best-effort rollback of the acknowledgement if insert fails after ack.
      // (In production prefer a DB function / transaction.)
      if (turnoverAcked && previousShiftId) {
        await supabase
          .from("pos_shifts")
          .update({
            turnover_status: "pending",
            turnover_acknowledged_by: null,
            turnover_acknowledged_at: null,
            turnover_actual_cash: null,
            turnover_difference: null,
          })
          .eq("id", previousShiftId)
          .eq("turnover_status", "completed");
      }
      return { success: false, error: error.message };
    }
    return { success: true, data: data as PosShift };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to open shift",
    };
  }
}

/**
 * Find the most recent closed shift on this terminal that still has a pending
 * retained-float turnover (awaiting acknowledgement by the next cashier).
 * Uses direct shift-to-shift relationship — no cash drawers.
 */
export async function getPendingTurnoverForTerminal(params: {
  branch_id: string;
  terminal_id: string;
}): Promise<{
  success: boolean;
  data?: PendingTurnover | null;
  error?: string;
}> {
  try {
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createPosAdminClient();

    const { data: prev, error } = await supabase
      .from("pos_shifts")
      .select(
        "id, shift_number, branch_id, terminal_id, cashier_user_id, retained_cash, closed_at, turnover_status, status",
      )
      .eq("branch_id", params.branch_id)
      .eq("terminal_id", params.terminal_id)
      .eq("status", "closed")
      .eq("turnover_status", "pending")
      .gt("retained_cash", 0)
      .order("closed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    if (!prev) return { success: true, data: null };

    // Resolve previous cashier display name (best-effort)
    let cashierName: string | null = null;
    if (prev.cashier_user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, first_name, last_name")
        .eq("auth_user_id", prev.cashier_user_id)
        .maybeSingle();
      if (profile) {
        cashierName =
          (profile as { full_name?: string }).full_name ||
          [
            (profile as { first_name?: string }).first_name,
            (profile as { last_name?: string }).last_name,
          ]
            .filter(Boolean)
            .join(" ") ||
          null;
      }
    }

    return {
      success: true,
      data: {
        shift_id: prev.id,
        shift_number: prev.shift_number,
        branch_id: prev.branch_id,
        terminal_id: prev.terminal_id,
        cashier_user_id: prev.cashier_user_id,
        cashier_name: cashierName,
        retained_cash: Number(prev.retained_cash ?? 0),
        closed_at: prev.closed_at,
        turnover_status: prev.turnover_status,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load pending turnover",
    };
  }
}

/**
 * One-shot helper for the primary terminal page.
 * Returns branch + primary terminal + open shift (creates the shift if needed).
 */
export async function ensureTerminalContext(
  preferredBranchId?: string | null,
): Promise<{
  success: boolean;
  data?: {
    branch: PosBranch;
    terminal: PosTerminal;
    shift: PosShift | null;
    cashier_user_id: string;
  };
  error?: string;
}> {
  try {
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const branchesResult = await getPosBranches();
    if (!branchesResult.success || branchesResult.data.length === 0) {
      return {
        success: false,
        error: "No active branches configured. Add a branch first.",
      };
    }

    const branch =
      (preferredBranchId
        ? branchesResult.data.find((b) => b.id === preferredBranchId)
        : null) ?? branchesResult.data[0];

    const terminalResult = await getPrimaryTerminal(branch.id);
    if (!terminalResult.success || !terminalResult.data) {
      return {
        success: false,
        error:
          terminalResult.error ??
          "No active primary terminal for the selected branch",
      };
    }

    const shiftResult = await getOpenShift({
      branch_id: branch.id,
      terminal_id: terminalResult.data.id,
      cashier_user_id: staff.user.id,
    });

    return {
      success: true,
      data: {
        branch,
        terminal: terminalResult.data,
        shift: shiftResult.success ? (shiftResult.data ?? null) : null,
        cashier_user_id: staff.user.id,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to initialise terminal context",
    };
  }
}

export async function getBranchBillingSettings(branchId: string): Promise<{
  success: boolean;
  data?: PosBillingSettings;
  error?: string;
}> {
  try {
    const supabase = createPosAdminClient();
    const { data, error } = await supabase
      .from("pos_billing_settings")
      .select("*")
      .eq("branch_id", branchId)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    const settings: PosBillingSettings = data
      ? {
          branch_id: data.branch_id,
          vat_enabled: Boolean(data.vat_enabled),
          vat_rate: Number(data.vat_rate ?? 12),
          service_charge_enabled: Boolean(data.service_charge_enabled),
          service_charge_rate: Number(data.service_charge_rate ?? 5),
          service_charge_rounding: data.service_charge_rounding ?? "half_up",
          price_mode:
            data.price_mode === "inclusive" ? "inclusive" : "exclusive",
        }
      : {
          branch_id: branchId,
          vat_enabled: true,
          vat_rate: 12,
          service_charge_enabled: true,
          service_charge_rate: 5,
          service_charge_rounding: "half_up",
          price_mode: "exclusive",
        };

    return { success: true, data: settings };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load billing settings",
    };
  }
}

/**
 * @deprecated Cash drawers have been removed from the POS turnover workflow.
 * Retained for any residual imports; always returns an empty list.
 */
export async function getCashDrawers(
  _branchId: string,
  _terminalId?: string,
): Promise<{
  success: boolean;
  data: never[];
  error?: string;
}> {
  return { success: true, data: [] };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ShiftCashSummary = {
  shift_id: string;
  starting_cash: number;
  opening_counted_cash: number | null;
  cash_sales: number;
  cash_refunds: number;
  cash_expenses: number;
  cash_topups: number;
  /** starting + sales - refunds - expenses + topups */
  expected_cash: number;
  payment_breakdown: {
    cash: number;
    card: number;
    gcash: number;
    maya: number;
    employee_charge: number;
    other: number;
  };
  order_count: number;
  open_order_count: number;
};

export type CloseShiftResult = {
  shift: {
    id: string;
    status: string;
    closed_at: string;
    starting_cash: number;
    expected_cash: number;
    actual_cash: number;
    variance: number;
    retained_cash: number;
    remittance_amount: number;
  };
};

// ---------------------------------------------------------------------------
// getShiftCashSummary
// ---------------------------------------------------------------------------

/**
 * Computes expected drawer cash for an open shift.
 * Cash sales come from completed payments with payment_method = 'cash'
 * linked to orders on this shift. Adjust the join paths if your
 * order/payment tables differ.
 */
export async function getShiftCashSummary(shiftId: string): Promise<{
  success: boolean;
  data?: ShiftCashSummary;
  error?: string;
}> {
  try {
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createPosAdminClient();

    const { data: shift, error: shiftError } = await supabase
      .from("pos_shifts")
      .select(
        "id, branch_id, terminal_id, cashier_user_id, status, starting_cash, opening_counted_cash, expected_cash, drawer_id",
      )
      .eq("id", shiftId)
      .maybeSingle();

    if (shiftError) return { success: false, error: shiftError.message };
    if (!shift) return { success: false, error: "Shift not found" };
    if (shift.status !== "open") {
      return { success: false, error: "Shift is not open" };
    }
    if (shift.cashier_user_id !== staff.user.id) {
      return {
        success: false,
        error: "You can only close your own shift",
      };
    }

    const { data: orders, error: ordersError } = await supabase
      .from("pos_orders")
      .select("id, status")
      .eq("shift_id", shiftId);

    if (ordersError) {
      return { success: false, error: ordersError.message };
    }

    const orderIds = (orders ?? []).map((o) => o.id);
    const openOrderCount = (orders ?? []).filter(
      (o) =>
        o.status !== "completed" &&
        o.status !== "cancelled" &&
        o.status !== "void",
    ).length;

    let cashSales = 0;
    const cashRefunds = 0;
    const breakdown = {
      cash: 0,
      card: 0,
      gcash: 0,
      maya: 0,
      employee_charge: 0,
      other: 0,
    };

    if (orderIds.length > 0) {
      const { data: payments, error: payError } = await supabase
        .from("pos_payments")
        .select("order_id, payment_method, amount, status, received_amount")
        .in("order_id", orderIds)
        .eq("status", "completed");

      if (payError) {
        return { success: false, error: payError.message };
      }

      for (const p of payments ?? []) {
        const method = String(p.payment_method ?? "other").toLowerCase();
        const amt = Number(p.amount ?? 0);
        if (!Number.isFinite(amt)) continue;

        if (method === "cash") {
          breakdown.cash += amt;
          cashSales += amt;
        } else if (method === "card") {
          breakdown.card += amt;
        } else if (method === "gcash") {
          breakdown.gcash += amt;
        } else if (method === "maya") {
          breakdown.maya += amt;
        } else if (method === "employee_charge") {
          breakdown.employee_charge += amt;
        } else {
          breakdown.other += amt;
        }
      }
    }

    let cashExpenses = 0;
    const { data: expenses } = await supabase
      .from("cash_expenses")
      .select("amount, status, payment_method")
      .eq("shift_id", shiftId)
      .in("status", ["paid", "approved", "completed"]);

    for (const e of expenses ?? []) {
      if (String(e.payment_method ?? "cash").toLowerCase() === "cash") {
        cashExpenses += Number(e.amount ?? 0);
      }
    }

    let cashTopups = 0;
    const { data: ledger } = await supabase
      .from("cash_ledger")
      .select("movement_type, amount")
      .eq("shift_id", shiftId);

    for (const row of ledger ?? []) {
      const t = String(row.movement_type ?? "").toLowerCase();
      const amt = Number(row.amount ?? 0);
      if (t === "topup" || t === "float_in" || t === "paid_in") {
        cashTopups += amt;
      }
    }

    const starting = Number(
      shift.opening_counted_cash ?? shift.starting_cash ?? 0,
    );
    const expected =
      starting + cashSales - cashRefunds - cashExpenses + cashTopups;

    return {
      success: true,
      data: {
        shift_id: shift.id,
        starting_cash: Number(shift.starting_cash ?? 0),
        opening_counted_cash:
          shift.opening_counted_cash != null
            ? Number(shift.opening_counted_cash)
            : null,
        cash_sales: cashSales,
        cash_refunds: cashRefunds,
        cash_expenses: cashExpenses,
        cash_topups: cashTopups,
        expected_cash: Number(expected.toFixed(2)),
        payment_breakdown: {
          cash: Number(breakdown.cash.toFixed(2)),
          card: Number(breakdown.card.toFixed(2)),
          gcash: Number(breakdown.gcash.toFixed(2)),
          maya: Number(breakdown.maya.toFixed(2)),
          employee_charge: Number(breakdown.employee_charge.toFixed(2)),
          other: Number(breakdown.other.toFixed(2)),
        },
        order_count: orderIds.length,
        open_order_count: openOrderCount,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load shift cash summary",
    };
  }
}

// ---------------------------------------------------------------------------
// getRemittanceVerificationSummary
// ---------------------------------------------------------------------------

export type RemittanceExpenseLine = {
  id: string;
  description: string;
  amount: number;
  payment_method: string;
  status: string;
  category_name: string | null;
  reference_number: string | null;
  notes: string | null;
  occurred_at: string;
};

/** Individual completed cash payment that entered the till during a shift */
export type RemittanceCashSaleLine = {
  payment_id: string;
  order_id: string;
  order_number: string | null;
  amount: number;
  paid_at: string | null;
};

/** One shift in the float/remittance chain */
export type RemittanceChainShift = {
  id: string;
  shift_number: string | null;
  opened_at: string;
  closed_at: string | null;
  cashier_user_id: string;
  previous_shift_id: string | null;
  opening: number;
  cash_sales: number;
  cash_expenses: number;
  cash_topups: number;
  cash_refunds: number;
  expected_in_drawer: number;
  actual_counted: number | null;
  variance: number | null;
  retained_for_next: number;
  /** Cash this shift sent out as remittance (0 if it only retained) */
  remitted_amount: number;
  payment_breakdown: {
    cash: number;
    card: number;
    gcash: number;
    maya: number;
    employee_charge: number;
    other: number;
  };
  order_count: number;
  cash_sales_lines: RemittanceCashSaleLine[];
  expenses: RemittanceExpenseLine[];
  /** true for the shift that prepared this remittance */
  is_source_shift: boolean;
};

export type RemittanceVerificationSummary = {
  remittance: {
    id: string;
    expected_amount: number;
    retained_cash: number;
    status: string;
    prepared_at: string;
    from_shift_id: string | null;
    notes: string | null;
  };
  /** Source shift (same as the last item in chain that is_source_shift) */
  shift: {
    id: string;
    shift_number: string | null;
    opened_at: string;
    closed_at: string | null;
    starting_cash: number;
    opening_counted_cash: number | null;
    expected_cash: number;
    actual_cash: number | null;
    variance: number | null;
    retained_cash: number;
    cashier_user_id: string;
    previous_shift_id: string | null;
  };
  cash: {
    opening: number;
    cash_sales: number;
    cash_expenses: number;
    cash_topups: number;
    cash_refunds: number;
    expected_in_drawer: number;
    actual_counted: number | null;
    retained_for_next: number;
    implied_remittance: number | null;
  };
  payment_breakdown: {
    cash: number;
    card: number;
    gcash: number;
    maya: number;
    employee_charge: number;
    other: number;
  };
  order_count: number;
  cash_sales_lines: RemittanceCashSaleLine[];
  expenses: RemittanceExpenseLine[];
  /**
   * Full float chain from the earliest connected shift → source shift
   * (oldest first). Every shift that passed retained cash into this bag.
   */
  chain: RemittanceChainShift[];
  /** Aggregates across the whole chain (for finance glance) */
  chain_totals: {
    cash_sales: number;
    cash_expenses: number;
    order_count: number;
    shift_count: number;
  };
};

const MAX_CHAIN_DEPTH = 30;

async function loadShiftCashDetail(
  supabase: ReturnType<typeof createPosAdminClient>,
  shiftId: string,
): Promise<{
  shift: {
    id: string;
    shift_number: string | null;
    opened_at: string;
    closed_at: string | null;
    starting_cash: number;
    opening_counted_cash: number | null;
    expected_cash: number | null;
    actual_cash: number | null;
    variance: number | null;
    retained_cash: number;
    cashier_user_id: string;
    previous_shift_id: string | null;
    status: string;
  };
  cash_sales: number;
  cash_expenses: number;
  cash_topups: number;
  cash_refunds: number;
  breakdown: {
    cash: number;
    card: number;
    gcash: number;
    maya: number;
    employee_charge: number;
    other: number;
  };
  order_count: number;
  cash_sales_lines: RemittanceCashSaleLine[];
  expenses: RemittanceExpenseLine[];
} | null> {
  const { data: shift, error } = await supabase
    .from("pos_shifts")
    .select(
      "id, shift_number, opened_at, closed_at, starting_cash, opening_counted_cash, expected_cash, actual_cash, variance, retained_cash, cashier_user_id, status, previous_shift_id",
    )
    .eq("id", shiftId)
    .maybeSingle();

  if (error || !shift) return null;

  const { data: orders } = await supabase
    .from("pos_orders")
    .select("id, order_number, status")
    .eq("shift_id", shift.id);

  const orderIds = (orders ?? []).map((o) => o.id);
  const orderNumberById = new Map(
    (orders ?? []).map((o) => [o.id, o.order_number as string | null]),
  );

  const breakdown = {
    cash: 0,
    card: 0,
    gcash: 0,
    maya: 0,
    employee_charge: 0,
    other: 0,
  };
  let cashSales = 0;
  let cashRefunds = 0;
  const cashSalesLines: RemittanceCashSaleLine[] = [];

  if (orderIds.length > 0) {
    const { data: payments } = await supabase
      .from("pos_payments")
      .select("id, order_id, payment_method, amount, status, paid_at")
      .in("order_id", orderIds)
      .eq("status", "completed");

    for (const p of payments ?? []) {
      const method = String(p.payment_method ?? "other").toLowerCase();
      const amt = Number(p.amount ?? 0);
      if (!Number.isFinite(amt)) continue;

      if (method === "cash") {
        breakdown.cash += amt;
        if (amt >= 0) {
          cashSales += amt;
          cashSalesLines.push({
            payment_id: p.id as string,
            order_id: p.order_id as string,
            order_number: orderNumberById.get(p.order_id as string) ?? null,
            amount: amt,
            paid_at: (p.paid_at as string) ?? null,
          });
        } else {
          cashRefunds += Math.abs(amt);
        }
      } else if (method === "card") {
        breakdown.card += amt;
      } else if (method === "gcash") {
        breakdown.gcash += amt;
      } else if (method === "maya") {
        breakdown.maya += amt;
      } else if (method === "employee_charge") {
        breakdown.employee_charge += amt;
      } else {
        breakdown.other += amt;
      }
    }
  }

  cashSalesLines.sort((a, b) => {
    const ta = a.paid_at ? new Date(a.paid_at).getTime() : 0;
    const tb = b.paid_at ? new Date(b.paid_at).getTime() : 0;
    return ta - tb;
  });

  const { data: expenseRows } = await supabase
    .from("cash_expenses")
    .select(
      `
      id, description, amount, payment_method, status, occurred_at,
      reference_number, notes,
      cash_expense_categories:category_id ( name )
    `,
    )
    .eq("shift_id", shift.id)
    .order("occurred_at", { ascending: true });

  const expenses: RemittanceExpenseLine[] = (expenseRows ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    const cat = r.cash_expense_categories as
      | { name: string }
      | { name: string }[]
      | null;
    const catName = Array.isArray(cat) ? cat[0]?.name : cat?.name;
    return {
      id: r.id as string,
      description: (r.description as string) ?? "",
      amount: Number(r.amount ?? 0),
      payment_method: String(r.payment_method ?? "cash"),
      status: String(r.status ?? "paid"),
      category_name: catName ?? null,
      reference_number: (r.reference_number as string) ?? null,
      notes: (r.notes as string) ?? null,
      occurred_at: r.occurred_at as string,
    };
  });

  let cashExpenses = 0;
  for (const e of expenses) {
    if (
      e.payment_method === "cash" &&
      !["void", "cancelled"].includes(e.status)
    ) {
      cashExpenses += e.amount;
    }
  }

  let cashTopups = 0;
  const { data: ledger } = await supabase
    .from("cash_ledger")
    .select("movement_type, amount")
    .eq("shift_id", shift.id);
  for (const row of ledger ?? []) {
    const t = String(row.movement_type ?? "").toLowerCase();
    const amt = Number(row.amount ?? 0);
    if (t === "topup" || t === "float_in" || t === "paid_in") {
      cashTopups += amt;
    }
  }

  return {
    shift: {
      id: shift.id,
      shift_number: shift.shift_number,
      opened_at: shift.opened_at,
      closed_at: shift.closed_at,
      starting_cash: Number(shift.starting_cash ?? 0),
      opening_counted_cash:
        shift.opening_counted_cash != null
          ? Number(shift.opening_counted_cash)
          : null,
      expected_cash:
        shift.expected_cash != null ? Number(shift.expected_cash) : null,
      actual_cash: shift.actual_cash != null ? Number(shift.actual_cash) : null,
      variance: shift.variance != null ? Number(shift.variance) : null,
      retained_cash: Number(shift.retained_cash ?? 0),
      cashier_user_id: shift.cashier_user_id,
      previous_shift_id: (shift.previous_shift_id as string) ?? null,
      status: shift.status,
    },
    cash_sales: Number(cashSales.toFixed(2)),
    cash_expenses: Number(cashExpenses.toFixed(2)),
    cash_topups: Number(cashTopups.toFixed(2)),
    cash_refunds: Number(cashRefunds.toFixed(2)),
    breakdown: {
      cash: Number(breakdown.cash.toFixed(2)),
      card: Number(breakdown.card.toFixed(2)),
      gcash: Number(breakdown.gcash.toFixed(2)),
      maya: Number(breakdown.maya.toFixed(2)),
      employee_charge: Number(breakdown.employee_charge.toFixed(2)),
      other: Number(breakdown.other.toFixed(2)),
    },
    order_count: orderIds.length,
    cash_sales_lines: cashSalesLines,
    expenses,
  };
}

/**
 * Full verification package: walks previous_shift_id from the remitting shift
 * back to the start of the float chain so finance sees every connected shift.
 */
export async function getRemittanceVerificationSummary(
  remittanceId: string,
): Promise<{
  success: boolean;
  data?: RemittanceVerificationSummary;
  error?: string;
}> {
  try {
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createPosAdminClient();

    const { data: rem, error: remErr } = await supabase
      .from("cash_remittances")
      .select(
        "id, expected_amount, retained_cash, status, prepared_at, from_shift_id, notes, branch_id",
      )
      .eq("id", remittanceId)
      .maybeSingle();

    if (remErr) return { success: false, error: remErr.message };
    if (!rem) return { success: false, error: "Remittance not found" };
    if (!rem.from_shift_id) {
      return {
        success: false,
        error: "This remittance is not linked to a source shift",
      };
    }

    // Walk previous_shift_id → root of the chain
    const idChain: string[] = [];
    let cursor: string | null = rem.from_shift_id;
    const seen = new Set<string>();
    while (cursor && idChain.length < MAX_CHAIN_DEPTH) {
      if (seen.has(cursor)) break; // cycle guard
      seen.add(cursor);
      idChain.push(cursor);

      const { data: link } = await supabase
        .from("pos_shifts")
        .select("previous_shift_id")
        .eq("id", cursor)
        .maybeSingle();
      cursor = (link?.previous_shift_id as string) ?? null;
    }

    // idChain is source → ... → oldest; reverse to oldest → source
    idChain.reverse();

    const chain: RemittanceChainShift[] = [];
    for (const sid of idChain) {
      const detail = await loadShiftCashDetail(supabase, sid);
      if (!detail) continue;

      const opening = Number(
        detail.shift.opening_counted_cash ?? detail.shift.starting_cash ?? 0,
      );
      const expectedInDrawer = Number(
        (
          opening +
          detail.cash_sales -
          detail.cash_refunds -
          detail.cash_expenses +
          detail.cash_topups
        ).toFixed(2),
      );
      const actual = detail.shift.actual_cash;
      const retained = detail.shift.retained_cash;
      const isSource = sid === rem.from_shift_id;
      // Only the source shift's remittance amount is this record; earlier
      // shifts in the chain typically retained everything (remitted 0).
      const remitted = isSource
        ? Number(rem.expected_amount ?? 0)
        : actual != null
          ? Number(Math.max(0, actual - retained).toFixed(2))
          : 0;

      chain.push({
        id: detail.shift.id,
        shift_number: detail.shift.shift_number,
        opened_at: detail.shift.opened_at,
        closed_at: detail.shift.closed_at,
        cashier_user_id: detail.shift.cashier_user_id,
        previous_shift_id: detail.shift.previous_shift_id,
        opening,
        cash_sales: detail.cash_sales,
        cash_expenses: detail.cash_expenses,
        cash_topups: detail.cash_topups,
        cash_refunds: detail.cash_refunds,
        expected_in_drawer: expectedInDrawer,
        actual_counted: actual,
        variance: detail.shift.variance,
        retained_for_next: retained,
        remitted_amount: remitted,
        payment_breakdown: detail.breakdown,
        order_count: detail.order_count,
        cash_sales_lines: detail.cash_sales_lines,
        expenses: detail.expenses,
        is_source_shift: isSource,
      });
    }

    const sourceDetail =
      chain.find((c) => c.is_source_shift) ?? chain[chain.length - 1];
    if (!sourceDetail) {
      return { success: false, error: "Source shift not found" };
    }

    const impliedRemittance =
      sourceDetail.actual_counted != null
        ? Number(
            (
              sourceDetail.actual_counted - sourceDetail.retained_for_next
            ).toFixed(2),
          )
        : null;

    const chain_totals = {
      cash_sales: Number(
        chain.reduce((s, c) => s + c.cash_sales, 0).toFixed(2),
      ),
      cash_expenses: Number(
        chain.reduce((s, c) => s + c.cash_expenses, 0).toFixed(2),
      ),
      order_count: chain.reduce((s, c) => s + c.order_count, 0),
      shift_count: chain.length,
    };

    return {
      success: true,
      data: {
        remittance: {
          id: rem.id,
          expected_amount: Number(rem.expected_amount ?? 0),
          retained_cash: Number(rem.retained_cash ?? 0),
          status: rem.status,
          prepared_at: rem.prepared_at,
          from_shift_id: rem.from_shift_id,
          notes: rem.notes,
        },
        shift: {
          id: sourceDetail.id,
          shift_number: sourceDetail.shift_number,
          opened_at: sourceDetail.opened_at,
          closed_at: sourceDetail.closed_at,
          starting_cash: sourceDetail.opening,
          opening_counted_cash: sourceDetail.opening,
          expected_cash: sourceDetail.expected_in_drawer,
          actual_cash: sourceDetail.actual_counted,
          variance: sourceDetail.variance,
          retained_cash: sourceDetail.retained_for_next,
          cashier_user_id: sourceDetail.cashier_user_id,
          previous_shift_id: sourceDetail.previous_shift_id,
        },
        cash: {
          opening: sourceDetail.opening,
          cash_sales: sourceDetail.cash_sales,
          cash_expenses: sourceDetail.cash_expenses,
          cash_topups: sourceDetail.cash_topups,
          cash_refunds: sourceDetail.cash_refunds,
          expected_in_drawer: sourceDetail.expected_in_drawer,
          actual_counted: sourceDetail.actual_counted,
          retained_for_next: sourceDetail.retained_for_next,
          implied_remittance: impliedRemittance,
        },
        payment_breakdown: sourceDetail.payment_breakdown,
        order_count: sourceDetail.order_count,
        cash_sales_lines: sourceDetail.cash_sales_lines,
        expenses: sourceDetail.expenses,
        chain,
        chain_totals,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load remittance verification summary",
    };
  }
}

// ---------------------------------------------------------------------------
// closePosShift (End Shift only)
// ---------------------------------------------------------------------------

const closeShiftSchema = z.object({
  shift_id: z.string().uuid(),
  /** Physical count of all cash currently on hand */
  actual_cash: z.coerce.number().min(0),
  /** Amount intentionally left as starting float for the next cashier */
  retained_cash: z.coerce.number().min(0),
  notes: z.string().max(1000).optional().nullable(),
  /** If true, refuse to close while any non-completed orders remain */
  block_if_open_orders: z.boolean().default(true),
});

export async function closePosShift(
  input: z.infer<typeof closeShiftSchema>,
): Promise<{
  success: boolean;
  data?: CloseShiftResult;
  error?: string;
}> {
  try {
    const validated = closeShiftSchema.parse(input);

    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createPosAdminClient();

    const summaryRes = await getShiftCashSummary(validated.shift_id);
    if (!summaryRes.success || !summaryRes.data) {
      return {
        success: false,
        error: summaryRes.error ?? "Could not compute expected cash",
      };
    }
    const summary = summaryRes.data;

    if (validated.block_if_open_orders && summary.open_order_count > 0) {
      return {
        success: false,
        error: `There are still ${summary.open_order_count} open order(s). Complete or cancel them before ending the shift.`,
      };
    }

    const expected = summary.expected_cash;
    const actual = Number(validated.actual_cash);
    const retained = Number(validated.retained_cash);
    if (retained > actual) {
      return {
        success: false,
        error: "Retained float cannot be greater than the counted cash.",
      };
    }
    const remittanceAmount = Number((actual - retained).toFixed(2));
    const variance = Number((actual - expected).toFixed(2));

    const { data: shiftRow, error: loadErr } = await supabase
      .from("pos_shifts")
      .select("*")
      .eq("id", validated.shift_id)
      .eq("status", "open")
      .maybeSingle();

    if (loadErr) return { success: false, error: loadErr.message };
    if (!shiftRow) {
      return {
        success: false,
        error: "Open shift not found (already closed?)",
      };
    }
    if (shiftRow.cashier_user_id !== staff.user.id) {
      return { success: false, error: "You can only close your own shift" };
    }

    const closedAt = new Date().toISOString();

    // Prepare the remittance before closing so a remittance insert failure
    // cannot leave the shift closed without its corresponding cash record.
    // Remittance is independent of retained-float turnover acknowledgement.
    let remittanceId: string | null = null;
    if (remittanceAmount > 0) {
      const { data: remittance, error: remittanceError } = await supabase
        .from("cash_remittances")
        .insert({
          branch_id: shiftRow.branch_id,
          drawer_id: null, // cash drawers removed from workflow
          expected_amount: remittanceAmount,
          retained_cash: retained,
          status: "draft",
          prepared_by: staff.user.id,
          prepared_at: closedAt,
          from_shift_id: shiftRow.id,
          notes:
            `Prepared from shift ${shiftRow.shift_number ?? shiftRow.id}. ${validated.notes?.trim() ?? ""}`.trim(),
        })
        .select("id")
        .single();

      if (remittanceError) {
        return {
          success: false,
          error: `Could not prepare cash remittance: ${remittanceError.message}`,
        };
      }
      remittanceId = remittance.id;
    }

    const { data: closedShift, error: closeErr } = await supabase
      .from("pos_shifts")
      .update({
        status: "closed",
        closed_at: closedAt,
        expected_cash: expected,
        actual_cash: actual,
        variance,
        retained_cash: retained,
        turnover_status: retained > 0 ? "pending" : "not_started",
        notes:
          [shiftRow.notes, validated.notes?.trim()]
            .filter(Boolean)
            .join("\n") || null,
        cash_management_notes: validated.notes?.trim() || null,
        reconciled_at: closedAt,
        reconciled_by: staff.user.id,
      })
      .eq("id", validated.shift_id)
      .eq("status", "open")
      .select("*")
      .single();

    if (closeErr) {
      if (remittanceId) {
        await supabase.from("cash_remittances").delete().eq("id", remittanceId);
      }
      return { success: false, error: closeErr.message };
    }
    if (!closedShift) {
      if (remittanceId) {
        await supabase.from("cash_remittances").delete().eq("id", remittanceId);
      }
      return { success: false, error: "Failed to close shift" };
    }

    // Optional audit row in cash_ledger
    const { error: ledgerErr } = await supabase.from("cash_ledger").upsert(
      {
        branch_id: shiftRow.branch_id,
        drawer_id: null,
        shift_id: shiftRow.id,
        movement_type: "shift_close",
        amount: actual,
        source_type: "pos_shift",
        source_id: shiftRow.id,
        idempotency_key: `shift-close-${shiftRow.id}`,
        recorded_by: staff.user.id,
        occurred_at: closedAt,
      },
      { onConflict: "idempotency_key", ignoreDuplicates: true },
    );

    if (ledgerErr) {
      console.error("cash_ledger write after shift close:", ledgerErr);
    }

    if (retained > 0) {
      const { error: retainedLedgerError } = await supabase
        .from("cash_ledger")
        .upsert(
          {
            branch_id: shiftRow.branch_id,
            drawer_id: null,
            shift_id: shiftRow.id,
            movement_type: "float_retained",
            amount: retained,
            source_type: "pos_shift",
            source_id: shiftRow.id,
            idempotency_key: `float-retained-${shiftRow.id}`,
            recorded_by: staff.user.id,
            occurred_at: closedAt,
          },
          { onConflict: "idempotency_key", ignoreDuplicates: true },
        );
      if (retainedLedgerError) {
        console.error("cash_ledger retained-float write:", retainedLedgerError);
      }
    }

    return {
      success: true,
      data: {
        shift: {
          id: closedShift.id,
          status: closedShift.status,
          closed_at: closedShift.closed_at,
          starting_cash: Number(closedShift.starting_cash),
          expected_cash: Number(closedShift.expected_cash),
          actual_cash: Number(closedShift.actual_cash),
          variance: Number(closedShift.variance),
          retained_cash: Number(closedShift.retained_cash ?? 0),
          remittance_amount: remittanceAmount,
        },
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to close shift",
    };
  }
}

// ---------------------------------------------------------------------------
// Remittance / Handover types & actions
// ---------------------------------------------------------------------------

export type CashRemittance = {
  id: string;
  branch_id: string;
  drawer_id: string | null;
  remittance_number: number | null;
  recipient_name: string | null;
  expected_amount: number;
  actual_amount: number | null;
  difference_amount: number | null;
  retained_cash: number;
  status: string;
  prepared_by: string | null;
  confirmed_by: string | null;
  prepared_at: string;
  confirmed_at: string | null;
  notes: string | null;
  from_shift_id: string | null;
  to_shift_id: string | null;
  // joined
  drawer_name?: string | null;
  branch_name?: string | null;
  prepared_by_name?: string | null;
  confirmed_by_name?: string | null;
  from_shift_number?: string | null;
  from_shift_variance?: number | null;
  from_shift_actual_cash?: number | null;
};

export type ShiftHandoverRow = {
  terminal_id: string;
  terminal_name: string;
  branch_id: string;
  branch_name: string;
  last_closed_shift_id: string | null;
  last_closed_shift_number: string | null;
  last_retained_cash: number | null;
  last_closed_at: string | null;
  last_turnover_status: string | null;
  open_shift_id: string | null;
  open_shift_number: string | null;
  open_starting_cash: number | null;
  open_opening_counted_cash: number | null;
  open_cashier_user_id: string | null;
  match_status: "matched" | "mismatch" | "no_open_shift" | "no_prior_retained";
  difference: number | null;
};

export type ClosedShiftCashRow = {
  id: string;
  shift_number: string | null;
  branch_id: string;
  branch_name: string | null;
  terminal_id: string;
  terminal_name: string | null;
  drawer_id: string | null;
  drawer_name: string | null;
  cashier_user_id: string;
  status: string;
  opened_at: string;
  closed_at: string | null;
  starting_cash: number;
  opening_counted_cash: number | null;
  expected_cash: number;
  actual_cash: number | null;
  variance: number | null;
  retained_cash: number;
  turnover_status: string | null;
  remittance_id: string | null;
  remittance_status: string | null;
  remittance_expected: number | null;
};

type RemittanceJoinRow = {
  id: string;
  branch_id: string;
  drawer_id: string | null;
  remittance_number: number | null;
  recipient_name: string | null;
  expected_amount: number | string | null;
  actual_amount: number | string | null;
  difference_amount: number | string | null;
  retained_cash: number | string | null;
  status: string;
  prepared_by: string | null;
  confirmed_by: string | null;
  prepared_at: string;
  confirmed_at: string | null;
  notes: string | null;
  from_shift_id: string | null;
  to_shift_id: string | null;
  cash_drawers: { name: string } | { name: string }[] | null;
  pos_branches: { name: string } | { name: string }[] | null;
  from_shift:
    | {
        shift_number: string | null;
        variance: number | string | null;
        actual_cash: number | string | null;
      }
    | {
        shift_number: string | null;
        variance: number | string | null;
        actual_cash: number | string | null;
      }[]
    | null;
};

type ClosedShiftJoinRow = {
  id: string;
  shift_number: string | null;
  branch_id: string;
  terminal_id: string;
  cashier_user_id: string;
  status: string;
  opened_at: string;
  closed_at: string | null;
  starting_cash: number | string | null;
  opening_counted_cash: number | string | null;
  expected_cash: number | string | null;
  actual_cash: number | string | null;
  variance: number | string | null;
  retained_cash: number | string | null;
  turnover_status: string | null;
  drawer_id: string | null;
  pos_branches: { name: string } | { name: string }[] | null;
  pos_terminals: { name: string } | { name: string }[] | null;
  cash_drawers: { name: string } | { name: string }[] | null;
};

type ClosedShiftLite = {
  id: string;
  shift_number: string | null;
  terminal_id: string | null;
  retained_cash: number | string | null;
  closed_at: string | null;
  turnover_status: string | null;
  status: string;
};

type OpenShiftLite = {
  id: string;
  shift_number: string | null;
  terminal_id: string | null;
  starting_cash: number | string | null;
  opening_counted_cash: number | string | null;
  cashier_user_id: string | null;
  status: string;
};

function firstJoin<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

const confirmRemittanceSchema = z.object({
  id: z.string().uuid(),
  actual_amount: z.coerce.number().min(0),
  recipient_name: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  to_shift_id: z.string().uuid().optional().nullable(),
});

export async function getPendingRemittances(branchId?: string): Promise<{
  success: boolean;
  data: CashRemittance[];
  error?: string;
}> {
  try {
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, data: [], error: staff.error };
    }

    const supabase = createPosAdminClient();

    let query = supabase
      .from("cash_remittances")
      .select(
        `
        id, branch_id, drawer_id, remittance_number, recipient_name,
        expected_amount, actual_amount, difference_amount, retained_cash,
        status, prepared_by, confirmed_by, prepared_at, confirmed_at, notes,
        from_shift_id, to_shift_id
      `,
      )
      .in("status", ["draft", "prepared"])
      .order("prepared_at", { ascending: false });

    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("getPendingRemittances error:", error);
      return { success: false, data: [], error: error.message };
    }

    const rows: CashRemittance[] = (data ?? []).map((r) => ({
      id: r.id,
      branch_id: r.branch_id,
      drawer_id: r.drawer_id,
      remittance_number: r.remittance_number,
      recipient_name: r.recipient_name,
      expected_amount: Number(r.expected_amount ?? 0),
      actual_amount: r.actual_amount != null ? Number(r.actual_amount) : null,
      difference_amount:
        r.difference_amount != null ? Number(r.difference_amount) : null,
      retained_cash: Number(r.retained_cash ?? 0),
      status: r.status,
      prepared_by: r.prepared_by,
      confirmed_by: r.confirmed_by,
      prepared_at: r.prepared_at,
      confirmed_at: r.confirmed_at,
      notes: r.notes,
      from_shift_id: r.from_shift_id,
      to_shift_id: r.to_shift_id,
      drawer_name: null,
      branch_name: null,
      from_shift_number: null,
      from_shift_variance: null,
      from_shift_actual_cash: null,
    }));

    return { success: true, data: rows };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to load pending remittances",
    };
  }
}

export async function getRemittanceHistory(params?: {
  branchId?: string;
  status?: string;
  from?: string; // ISO date
  to?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  data: CashRemittance[];
  error?: string;
}> {
  try {
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, data: [], error: staff.error };
    }

    const supabase = createPosAdminClient();
    const limit = Math.min(params?.limit ?? 50, 200);

    let query = supabase
      .from("cash_remittances")
      .select(
        `
    id, branch_id, drawer_id, remittance_number, recipient_name,
    expected_amount, actual_amount, difference_amount, retained_cash,
    status, prepared_by, confirmed_by, prepared_at, confirmed_at, notes,
    from_shift_id, to_shift_id
  `,
      )
      .order("prepared_at", { ascending: false })
      .limit(limit);

    if (params?.branchId) query = query.eq("branch_id", params.branchId);
    if (params?.status) query = query.eq("status", params.status);
    if (params?.from) query = query.gte("prepared_at", params.from);
    if (params?.to) query = query.lte("prepared_at", params.to);

    // Default: show completed ones; caller can pass status if needed
    if (!params?.status) {
      query = query.in("status", [
        "confirmed",
        "received",
        "banked",
        "adjusted",
        "cancelled",
      ]);
    }

    const { data, error } = await query;
    console.log("getRemittanceHistory raw:", {
      data,
      error,
      count: data?.length,
    });
    if (error) return { success: false, data: [], error: error.message };

    const rowsRaw = data ?? [];

    // Collect IDs
    const branchIds = [...new Set(rowsRaw.map((r) => r.branch_id))];
    const shiftIds = [
      ...new Set(
        rowsRaw
          .map((r) => r.from_shift_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const drawerIds = [
      ...new Set(
        rowsRaw
          .map((r) => r.drawer_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    // Fetch related data
    const branchMap = new Map<string, string>();
    const shiftMap = new Map<
      string,
      {
        shift_number: string | null;
        variance: number | null;
        actual_cash: number | null;
      }
    >();
    const drawerMap = new Map<string, string>();

    if (branchIds.length > 0) {
      const { data: branches } = await supabase
        .from("pos_branches")
        .select("id, name")
        .in("id", branchIds);
      for (const b of branches ?? []) branchMap.set(b.id, b.name);
    }

    if (shiftIds.length > 0) {
      const { data: shifts } = await supabase
        .from("pos_shifts")
        .select("id, shift_number, variance, actual_cash")
        .in("id", shiftIds);
      for (const s of shifts ?? []) {
        shiftMap.set(s.id, {
          shift_number: s.shift_number,
          variance: s.variance != null ? Number(s.variance) : null,
          actual_cash: s.actual_cash != null ? Number(s.actual_cash) : null,
        });
      }
    }

    if (drawerIds.length > 0) {
      const { data: drawers } = await supabase
        .from("cash_drawers")
        .select("id, name")
        .in("id", drawerIds);
      for (const d of drawers ?? []) drawerMap.set(d.id, d.name);
    }

    // Map to final shape
    const rows: CashRemittance[] = rowsRaw.map((r) => {
      const shift = r.from_shift_id ? shiftMap.get(r.from_shift_id) : null;

      return {
        id: r.id,
        branch_id: r.branch_id,
        drawer_id: r.drawer_id,
        remittance_number: r.remittance_number,
        recipient_name: r.recipient_name,
        expected_amount: Number(r.expected_amount ?? 0),
        actual_amount: r.actual_amount != null ? Number(r.actual_amount) : null,
        difference_amount:
          r.difference_amount != null ? Number(r.difference_amount) : null,
        retained_cash: Number(r.retained_cash ?? 0),
        status: r.status,
        prepared_by: r.prepared_by,
        confirmed_by: r.confirmed_by,
        prepared_at: r.prepared_at,
        confirmed_at: r.confirmed_at,
        notes: r.notes,
        from_shift_id: r.from_shift_id,
        to_shift_id: r.to_shift_id,
        drawer_name: r.drawer_id ? (drawerMap.get(r.drawer_id) ?? null) : null,
        branch_name: branchMap.get(r.branch_id) ?? null,
        from_shift_number: shift?.shift_number ?? null,
        from_shift_variance: shift?.variance ?? null,
        from_shift_actual_cash: shift?.actual_cash ?? null,
      };
    });

    return { success: true, data: rows };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to load remittance history",
    };
  }
}

export async function confirmRemittance(
  input: z.infer<typeof confirmRemittanceSchema>,
): Promise<{
  success: boolean;
  data?: CashRemittance;
  error?: string;
}> {
  try {
    const validated = confirmRemittanceSchema.parse(input);
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, error: staff.error };
    }

    const supabase = createPosAdminClient();

    const { data: existing, error: loadErr } = await supabase
      .from("cash_remittances")
      .select("*")
      .eq("id", validated.id)
      .maybeSingle();

    if (loadErr) return { success: false, error: loadErr.message };
    if (!existing) return { success: false, error: "Remittance not found" };
    if (!["draft", "prepared"].includes(existing.status)) {
      return {
        success: false,
        error: `Remittance is already ${existing.status}`,
      };
    }

    const expected = Number(existing.expected_amount ?? 0);
    const actual = Number(validated.actual_amount);
    const difference = Number((actual - expected).toFixed(2));
    const confirmedAt = new Date().toISOString();

    const { data: updated, error: updateErr } = await supabase
      .from("cash_remittances")
      .update({
        status: difference === 0 ? "confirmed" : "adjusted",
        actual_amount: actual,
        difference_amount: difference,
        recipient_name:
          validated.recipient_name?.trim() || existing.recipient_name,
        confirmed_by: staff.user.id,
        confirmed_at: confirmedAt,
        to_shift_id: validated.to_shift_id ?? existing.to_shift_id,
        notes:
          [existing.notes, validated.notes?.trim()]
            .filter(Boolean)
            .join("\n") || null,
      })
      .eq("id", validated.id)
      .select("*")
      .single();

    if (updateErr) return { success: false, error: updateErr.message };

    // Optional ledger entry for the physical remittance (no drawer dependency)
    await supabase.from("cash_ledger").upsert(
      {
        branch_id: existing.branch_id,
        drawer_id: null,
        shift_id: existing.from_shift_id,
        movement_type: "remittance_out",
        amount: actual,
        source_type: "cash_remittance",
        source_id: existing.id,
        idempotency_key: `remittance-confirm-${existing.id}`,
        recorded_by: staff.user.id,
        occurred_at: confirmedAt,
      },
      { onConflict: "idempotency_key", ignoreDuplicates: true },
    );

    // CRITICAL: Remittance confirmation must NEVER update the previous shift's
    // turnover_status. Retained-float acknowledgement is a separate process
    // performed only by the incoming cashier via openPosShift(acknowledge_turnover).

    return {
      success: true,
      data: {
        id: updated.id,
        branch_id: updated.branch_id,
        drawer_id: updated.drawer_id,
        remittance_number: updated.remittance_number,
        recipient_name: updated.recipient_name,
        expected_amount: Number(updated.expected_amount ?? 0),
        actual_amount:
          updated.actual_amount != null ? Number(updated.actual_amount) : null,
        difference_amount:
          updated.difference_amount != null
            ? Number(updated.difference_amount)
            : null,
        retained_cash: Number(updated.retained_cash ?? 0),
        status: updated.status,
        prepared_by: updated.prepared_by,
        confirmed_by: updated.confirmed_by,
        prepared_at: updated.prepared_at,
        confirmed_at: updated.confirmed_at,
        notes: updated.notes,
        from_shift_id: updated.from_shift_id,
        to_shift_id: updated.to_shift_id,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation failed",
      };
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to confirm remittance",
    };
  }
}

export async function getShiftHandoverStatus(branchId?: string): Promise<{
  success: boolean;
  data: ShiftHandoverRow[];
  error?: string;
}> {
  try {
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, data: [], error: staff.error };
    }

    const supabase = createPosAdminClient();

    // Active terminals (primary first, or all)
    let terminalsQuery = supabase
      .from("pos_terminals")
      .select("id, name, branch_id")
      .eq("is_active", true)
      .order("name");

    if (branchId) terminalsQuery = terminalsQuery.eq("branch_id", branchId);

    const { data: terminals, error: tErr } = await terminalsQuery;
    if (tErr) return { success: false, data: [], error: tErr.message };
    if (!terminals?.length) return { success: true, data: [] };

    const terminalIds = terminals.map((t) => t.id);
    const branchIds = [...new Set(terminals.map((t) => t.branch_id))];

    const { data: branches } = await supabase
      .from("pos_branches")
      .select("id, name")
      .in("id", branchIds);
    const branchMap = new Map((branches ?? []).map((b) => [b.id, b.name]));

    // Latest closed shift per terminal
    const { data: closedShiftsData } = await supabase
      .from("pos_shifts")
      .select(
        "id, shift_number, terminal_id, retained_cash, closed_at, turnover_status, status",
      )
      .in("terminal_id", terminalIds)
      .eq("status", "closed")
      .order("closed_at", { ascending: false });

    const closedShifts = (closedShiftsData ?? []) as ClosedShiftLite[];

    const lastClosedByTerminal = new Map<string, ClosedShiftLite>();
    for (const s of closedShifts) {
      if (s.terminal_id && !lastClosedByTerminal.has(s.terminal_id)) {
        lastClosedByTerminal.set(s.terminal_id, s);
      }
    }

    // same for open shifts
    const { data: openShiftsData } = await supabase
      .from("pos_shifts")
      .select(
        "id, shift_number, terminal_id, starting_cash, opening_counted_cash, cashier_user_id, status",
      )
      .in("terminal_id", terminalIds)
      .eq("status", "open");

    const openShifts = (openShiftsData ?? []) as OpenShiftLite[];

    const openByTerminal = new Map<string, OpenShiftLite>();
    for (const s of openShifts) {
      if (s.terminal_id) openByTerminal.set(s.terminal_id, s);
    }

    const rows: ShiftHandoverRow[] = terminals.map((t) => {
      const last = lastClosedByTerminal.get(t.id) ?? null;
      const open = openByTerminal.get(t.id) ?? null;

      const retained = last != null ? Number(last.retained_cash ?? 0) : null;

      const counted =
        open?.opening_counted_cash != null
          ? Number(open.opening_counted_cash)
          : open?.starting_cash != null
            ? Number(open.starting_cash)
            : null;

      let match_status: ShiftHandoverRow["match_status"] = "no_prior_retained";
      let difference: number | null = null;

      if (retained != null && retained > 0) {
        if (!open) {
          match_status = "no_open_shift";
        } else if (counted == null) {
          match_status = "mismatch";
        } else {
          difference = Number((counted - retained).toFixed(2));
          match_status = difference === 0 ? "matched" : "mismatch";
        }
      }

      return {
        terminal_id: t.id,
        terminal_name: t.name,
        branch_id: t.branch_id,
        branch_name: branchMap.get(t.branch_id) ?? "—",
        last_closed_shift_id: last?.id ?? null,
        last_closed_shift_number: last?.shift_number ?? null,
        last_retained_cash: retained,
        last_closed_at: last?.closed_at ?? null,
        last_turnover_status: last?.turnover_status ?? null,
        open_shift_id: open?.id ?? null,
        open_shift_number: open?.shift_number ?? null,
        open_starting_cash:
          open?.starting_cash != null ? Number(open.starting_cash) : null,
        open_opening_counted_cash:
          open?.opening_counted_cash != null
            ? Number(open.opening_counted_cash)
            : null,
        open_cashier_user_id: open?.cashier_user_id ?? null,
        match_status,
        difference,
      };
    });

    return { success: true, data: rows };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to load handover status",
    };
  }
}

export async function getClosedShiftsWithCashSummary(params?: {
  branchId?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  data: ClosedShiftCashRow[];
  error?: string;
}> {
  try {
    const staff = await requirePosStaff();
    if (!staff.authorized) {
      return { success: false, data: [], error: staff.error };
    }

    const supabase = createPosAdminClient();
    const limit = Math.min(params?.limit ?? 40, 100);

    let query = supabase
      .from("pos_shifts")
      .select(
        `
    id, shift_number, branch_id, terminal_id, cashier_user_id, status,
    opened_at, closed_at, starting_cash, opening_counted_cash,
    expected_cash, actual_cash, variance, retained_cash, turnover_status,
    drawer_id,
    pos_branches:branch_id ( name ),
    pos_terminals:terminal_id ( name )
  `,
      )
      .eq("status", "closed")
      .order("closed_at", { ascending: false })
      .limit(limit);

    if (params?.branchId) query = query.eq("branch_id", params.branchId);

    const { data: shifts, error } = await query;
    if (error) return { success: false, data: [], error: error.message };

    const shiftIds = (shifts ?? []).map((s) => s.id);

    const remittanceByShift = new Map<
      string,
      { id: string; status: string; expected_amount: number }
    >();
    if (shiftIds.length > 0) {
      const { data: rems } = await supabase
        .from("cash_remittances")
        .select("id, from_shift_id, status, expected_amount")
        .in("from_shift_id", shiftIds);

      for (const r of rems ?? []) {
        if (r.from_shift_id && !remittanceByShift.has(r.from_shift_id)) {
          remittanceByShift.set(r.from_shift_id, {
            id: r.id,
            status: r.status,
            expected_amount: Number(r.expected_amount ?? 0),
          });
        }
      }
    }

    const drawerIds = [
      ...new Set(
        (shifts ?? [])
          .map((s) => s.drawer_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const drawerMap = new Map<string, string>();
    if (drawerIds.length > 0) {
      const { data: drawers } = await supabase
        .from("cash_drawers")
        .select("id, name")
        .in("id", drawerIds);
      for (const d of drawers ?? []) {
        drawerMap.set(d.id, d.name);
      }
    }

    const rows: ClosedShiftCashRow[] = (
      (shifts ?? []) as unknown as ClosedShiftJoinRow[]
    ).map((s) => {
      const branch = firstJoin(s.pos_branches);
      const terminal = firstJoin(s.pos_terminals);
      const rem = remittanceByShift.get(s.id);

      return {
        id: s.id,
        shift_number: s.shift_number,
        branch_id: s.branch_id,
        branch_name: branch?.name ?? null,
        terminal_id: s.terminal_id,
        terminal_name: terminal?.name ?? null,
        drawer_id: s.drawer_id,
        drawer_name: s.drawer_id ? (drawerMap.get(s.drawer_id) ?? null) : null,
        cashier_user_id: s.cashier_user_id,
        status: s.status,
        opened_at: s.opened_at,
        closed_at: s.closed_at,
        starting_cash: Number(s.starting_cash ?? 0),
        opening_counted_cash:
          s.opening_counted_cash != null
            ? Number(s.opening_counted_cash)
            : null,
        expected_cash: Number(s.expected_cash ?? 0),
        actual_cash: s.actual_cash != null ? Number(s.actual_cash) : null,
        variance: s.variance != null ? Number(s.variance) : null,
        retained_cash: Number(s.retained_cash ?? 0),
        turnover_status: s.turnover_status,
        remittance_id: rem?.id ?? null,
        remittance_status: rem?.status ?? null,
        remittance_expected: rem?.expected_amount ?? null,
      };
    });

    return { success: true, data: rows };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error ? error.message : "Failed to load closed shifts",
    };
  }
}
