"use server";

import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { z } from "zod";

import {
  getLocationNameColumn,
  getLocationTableName,
  LOCATION_TYPE_LABELS,
  mapRowToLocation,
  type LocationType,
  type PosLocation,
  type RawRoomRow,
  type RawTableRow,
} from "./pos-locations";

export type { LocationType, PosLocation } from "./pos-locations";

type PosCategory = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
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
};

export type PosSession = {
  id: string;
  table_id: string | null;
  room_id: string | null;
  cubicle_id: string | null;
  qr_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  table_number?: string | null;
  room_name?: string | null;
  cubicle_name?: string | null;
};

type PosSessionRow = {
  id: string;
  table_id: string | null;
  room_id: string | null;
  cubicle_id: string | null;
  qr_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  tables: { table_number: string } | null;
  rooms: { name: string } | null;
  cubicles: { name: string } | null;
};

function mapSessionRow(row: PosSessionRow): PosSession {
  return {
    id: row.id,
    table_id: row.table_id,
    room_id: row.room_id,
    cubicle_id: row.cubicle_id,
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

// ==================== LOCATION MANAGEMENT ====================

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

const createSessionInputSchema = z.object({
  table_id: z.string().uuid().optional(),
  room_id: z.string().uuid().optional(),
  cubicle_id: z.string().uuid().optional(),
});

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

// Server-only privileged client for staff-side operations (session +
// location management). Every query runs as the service role, which
// bypasses RLS, so this client must never run in the browser and must
// only be used after the requester has passed staff authorization
// (see requirePosStaff). Auth persistence and refresh are disabled so
// no user session or JWT is ever attached — queries execute with the
// service key itself, not with the signed-in user's JWT (a user JWT
// would be blocked by RLS on pos_sessions). The service-role key is
// a server-side secret and is never sent to the browser.
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

// Staff authorization for privileged POS operations. Mirrors the
// project's existing trusted admin mechanism (createPost() and
// getCurrentUser() in src/lib/actions.ts):
//   1. identify the requester from their Supabase Auth session, and
//   2. verify the account exists in the profiles staff directory.
//
// auth.getUser() alone is NOT treated as sufficient — any
// authenticated Supabase account passes it — so the profiles
// directory check is what restricts these operations to known
// staff accounts. The adminId cookie gate in src/app/admin/layout.tsx
// is a route convenience, not a security boundary, and is not
// relied on here.
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
        error instanceof Error
          ? error.message
          : "Failed to load categories",
    };
  }
}

export async function getPosProducts(): Promise<{
  success: boolean;
  data: PosProduct[];
  error?: string;
}> {
  try {
    const supabase = await createPosSupabaseClient();

    const [{ data: products, error: productsError }, { data: categories }] =
      await Promise.all([
        supabase
          .from("pos_products")
          .select(
            "id, category_id, name, description, price, image_url, is_active",
          )
          .order("name", { ascending: true }),

        supabase
          .from("pos_categories")
          .select("id, name")
          .order("name", { ascending: true }),
      ]);

    if (productsError) {
      return {
        success: false,
        data: [],
        error: productsError.message,
      };
    }

    const categoryMap = new Map(
      (categories ?? []).map((category) => [category.id, category.name]),
    );

    const mappedProducts: PosProduct[] = (products ?? []).map((product) => ({
      ...product,
      price: Number(product.price),
      category_name: product.category_id
        ? categoryMap.get(product.category_id) ?? "Uncategorized"
        : "Uncategorized",
    }));

    return {
      success: true,
      data: mappedProducts,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error ? error.message : "Failed to load products",
    };
  }
}

export async function getPosSessions(): Promise<{
  success: boolean;
  data: PosSession[];
  error?: string;
}> {
  try {
    // Staff-only: session rows embed QR tokens, so listing is
    // restricted to authorized staff and runs through the
    // service-role client (see requirePosStaff).
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
      .select(`
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
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }

    const mappedSessions: PosSession[] = ((data ?? []) as unknown as PosSessionRow[]).map(
      mapSessionRow,
    );

    return {
      success: true,
      data: mappedSessions,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error ? error.message : "Failed to load sessions",
    };
  }
}

export async function createPosSession(input: {
  table_id?: string;
  room_id?: string;
  cubicle_id?: string;
}): Promise<{
  success: boolean;
  data?: PosSession;
  error?: string;
}> {
  try {
    const validated = createSessionInputSchema.parse(input);

    // A QR session must reference exactly one location.
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

    // Staff authorization (see requirePosStaff).
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
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("pos_sessions")
      .insert({
        table_id: locationType === "table" ? locationId : null,
        room_id: locationType === "room" ? locationId : null,
        cubicle_id: locationType === "cubicle" ? locationId : null,
        qr_token,
        expires_at,
        is_active: true,
      })
      .select(`
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
      `)
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

    const payload = data as
      | {
          found?: boolean;
          valid?: boolean;
          expired?: boolean;
          table_number?: string | null;
          room_name?: string | null;
          cubicle_name?: string | null;
        }
      | null;

    const mappedSession: PosSession & { valid: boolean; expired: boolean } = {
      id: "",
      table_id: null,
      room_id: null,
      cubicle_id: null,
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

// ==================== LOCATION MANAGEMENT ====================

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

    const mappedLocations: PosLocation[] = ((data ?? []) as Array<
      RawTableRow | RawRoomRow
    >).map((row) => mapRowToLocation(type, row));

    return {
      success: true,
      data: mappedLocations,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to load locations",
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
        ? await duplicateQuery.eq("zone", validated.zone ?? "bistro").maybeSingle()
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
      data: mapRowToLocation(
        validated.type,
        data as RawTableRow | RawRoomRow,
      ),
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
      data: mapRowToLocation(
        validated.type,
        data as RawTableRow | RawRoomRow,
      ),
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