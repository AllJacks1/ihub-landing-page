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
  starting_cash?: number;
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

    // Only the current user may open a shift for themselves
    if (staff.user.id !== params.cashier_user_id) {
      return { success: false, error: "Cannot open a shift for another user" };
    }

    const supabase = createPosAdminClient();

    // Guard: one open shift per (terminal + cashier)
    const existing = await getOpenShift(params);
    if (existing.success && existing.data) {
      return { success: true, data: existing.data };
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
        starting_cash: params.starting_cash ?? 0,
        expected_cash: params.starting_cash ?? 0,
      })
      .select("*")
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data: data as PosShift };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to open shift",
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
    shift: PosShift;
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

    let shiftResult = await getOpenShift({
      branch_id: branch.id,
      terminal_id: terminalResult.data.id,
      cashier_user_id: staff.user.id,
    });

    if (!shiftResult.success || !shiftResult.data) {
      shiftResult = await openPosShift({
        branch_id: branch.id,
        terminal_id: terminalResult.data.id,
        cashier_user_id: staff.user.id,
        starting_cash: 0,
      });
    }

    if (!shiftResult.success || !shiftResult.data) {
      return {
        success: false,
        error: shiftResult.error ?? "Could not open a shift",
      };
    }

    return {
      success: true,
      data: {
        branch,
        terminal: terminalResult.data,
        shift: shiftResult.data,
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
