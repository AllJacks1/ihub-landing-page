"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

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
  qr_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  table_number?: string | null;
  room_name?: string | null;
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
      console.log("DEBUG getPosProducts: productsError =", productsError);
      console.log(
        "DEBUG getPosProducts: env SUPABASE_SERVICE_ROLE_KEY =",
        process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "NOT SET",
      );
      console.log(
        "DEBUG getPosProducts: env keys =",
        Object.keys(process.env)
          .filter((k) => k.includes("SUPABASE") || k.includes("DATABASE"))
          .join(", "),
      );
      return {
        success: false,
        data: [],
        error: productsError.message,
      };
    }

    console.log("DEBUG getPosProducts: products =", products?.length, "items");
    console.log(
      "DEBUG getPosProducts: categories =",
      categories?.length,
      "items",
    );
    if (products && products.length > 0) {
      console.log(
        "DEBUG getPosProducts: first product =",
        JSON.stringify(products[0]),
      );
    } else {
      console.log(
        "DEBUG getPosProducts: products is null/empty, checking count...",
      );
      console.log("DEBUG getPosProducts: products raw =", products);
    }

    const categoryMap = new Map(
      (categories ?? []).map((category) => [category.id, category.name]),
    );

    const mappedProducts: PosProduct[] = (products ?? []).map((product) => ({
      ...product,
      price: Number(product.price),
      category_name: product.category_id
        ? (categoryMap.get(product.category_id) ?? "Uncategorized")
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
    const supabase = await createPosSupabaseClient();

    const { data, error } = await supabase
      .from("pos_sessions")
      .select(
        `
        id,
        table_id,
        room_id,
        qr_token,
        expires_at,
        created_at,
        updated_at,
        is_active,
        tables:table_id (table_number),
        rooms:room_id (name)
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

    const mappedSessions: PosSession[] = (data ?? []).map((session) => ({
      ...session,
      table_number: (session as any).tables?.table_number ?? null,
      room_name: (session as any).rooms?.name ?? null,
    }));

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
}): Promise<{
  success: boolean;
  data?: PosSession;
  error?: string;
}> {
  try {
    if (!input.table_id && !input.room_id) {
      return {
        success: false,
        error: "Either table_id or room_id must be provided",
      };
    }

    if (input.table_id && input.room_id) {
      return {
        success: false,
        error: "Cannot specify both table_id and room_id",
      };
    }

    const supabase = await createPosSupabaseClient();

    const qr_token = generateQrToken();
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("pos_sessions")
      .insert({
        table_id: input.table_id ?? null,
        room_id: input.room_id ?? null,
        qr_token,
        expires_at,
        is_active: true,
      })
      .select(
        `
        id,
        table_id,
        room_id,
        qr_token,
        expires_at,
        created_at,
        updated_at,
        is_active,
        tables:table_id (table_number),
        rooms:room_id (name)
      `,
      )
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const mappedSession: PosSession = {
      ...data,
      table_number: (data as any).tables?.table_number ?? null,
      room_name: (data as any).rooms?.name ?? null,
    };

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
    const supabase = await createPosSupabaseClient();

    const { error } = await supabase
      .from("pos_sessions")
      .update({ is_active: false })
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
    const supabase = await createPosSupabaseClient();

    const { data, error } = await supabase
      .from("pos_sessions")
      .select(
        `
        id,
        table_id,
        room_id,
        qr_token,
        expires_at,
        created_at,
        updated_at,
        is_active,
        tables:table_id (table_number),
        rooms:room_id (name)
      `,
      )
      .eq("qr_token", qr_token)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return {
          success: true,
          data: { valid: false, expired: false } as any,
        };
      }
      return {
        success: false,
        data: undefined,
        error: error.message,
      };
    }

    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    const expired = expiresAt <= now;
    const valid = data.is_active && !expired;

    const mappedSession: PosSession & { valid: boolean; expired: boolean } = {
      ...data,
      table_number: (data as any).tables?.table_number ?? null,
      room_name: (data as any).rooms?.name ?? null,
      valid,
      expired,
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
