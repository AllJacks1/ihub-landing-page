"use server";

import { createSupabaseClient } from "@/lib/actions";
import crypto from "crypto";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
export type ActionResult<T = unknown> =
  | { success: true; data?: T; user?: T }
  | { success: false; error: string };

// ────────────────────────────────────────────────
// 1. Fetch Customer Details
// ────────────────────────────────────────────────
export async function fetchCustomerDetails(userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const supabase = await createSupabaseClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("userId", userId)
      .maybeSingle();

    if (error) throw new Error(`Supabase error: ${error.message}`);
    if (!user) {
      throw new Error(`No account found for this user ID: ${userId}`);
    }

    return { success: true, user };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error fetching customer details:", message);
    return { success: false, error: message };
  }
}

// ────────────────────────────────────────────────
// 2. Fetch Customer Points
// ────────────────────────────────────────────────
export async function fetchCustomerPoints(userId: string): Promise<number> {
  try {
    if (!userId) return 0;

    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from("transactions")
      .select("points, transactionType")
      .eq("userId", userId);

    if (error) throw new Error(`Supabase error: ${error.message}`);

    if (!data || data.length === 0) {
      console.warn(`No transactions found for userId: ${userId}`);
      return 0;
    }

    const totalPoints = data.reduce((sum, item) => {
      const pointsValue = Number(item.points) || 0;

      if (item.transactionType === "earn") return sum + pointsValue;
      if (item.transactionType === "redeem") return sum - pointsValue;

      return sum;
    }, 0);

    return totalPoints;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("❌ Error fetching customer points:", message);
    return 0; // safe fallback
  }
}

// ────────────────────────────────────────────────
// 3. Fetch Transactions
// ────────────────────────────────────────────────
export async function fetchTransactions(userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("userId", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((t) => ({
      id: t.receiptNumber || t.id || t.created_at,
      description: t.description || "No description",
      created_at: new Date(t.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      // Keep the raw number + the type so the UI can decide the color
      points: Number(t.points) || 0,
      transactionType: t.transactionType as "earn" | "redeem",
    }));

    return { success: true, data: formatted };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error fetching transactions:", message);
    return { success: false, error: message };
  }
}

// ────────────────────────────────────────────────
// 4. Update User Password
// ────────────────────────────────────────────────
export async function updateUserPassword({
  userId,
  currentPassword,
  newPassword,
}: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  try {
    if (!userId || !currentPassword || !newPassword) {
      throw new Error("Missing required fields");
    }

    const supabase = await createSupabaseClient();

    // 1. Fetch current secret
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("secret")
      .eq("userId", userId)
      .single();

    if (fetchError) throw fetchError;
    if (!userData) throw new Error("User not found");

    // 2. Verify current password
    const hashedCurrent = crypto
      .createHash("sha256")
      .update(currentPassword)
      .digest("hex");

    if (hashedCurrent !== userData.secret) {
      throw new Error("Current password is incorrect");
    }

    // 3. Hash new password
    const hashedNew = crypto
      .createHash("sha256")
      .update(newPassword)
      .digest("hex");

    // 4. Update
    const { error: updateError } = await supabase
      .from("users")
      .update({ secret: hashedNew })
      .eq("userId", userId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error updating password:", message);
    return { success: false, error: message };
  }
}

// ────────────────────────────────────────────────
// 5. Fetch available voucher code for a reward group
// ────────────────────────────────────────────────
export async function fetchAvailableVoucher(voucherGroupId: string) {
  try {
    if (!voucherGroupId) {
      return { success: false, error: "voucherGroupId is required" };
    }

    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from("rewards")
      .select("voucherCode")
      .eq("voucherGroupId", voucherGroupId)
      .eq("unused", true)
      .limit(1);

    if (error) throw error;

    const code = data?.[0]?.voucherCode ?? null;

    return {
      success: true,
      voucherCode: code ?? "No voucher available",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error fetching voucher code:", message);
    return { success: false, error: message };
  }
}

// ────────────────────────────────────────────────
// 6. Fetch Rewards + redeemed status for a user
// ────────────────────────────────────────────────
export async function fetchRewards(userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const supabase = await createSupabaseClient();

    // 1. All regular reward groups
    const { data: rewardsData, error: rewardsError } = await supabase
      .from("rewardsGroup")
      .select(
        "voucherGroupId, name, description, neededPoints, image, perCustomer",
      )
      .eq("type", "regular");

    if (rewardsError) throw rewardsError;

    // 2. Which ones this user already redeemed
    const { data: redeemedData, error: redeemedError } = await supabase
      .from("transactions")
      .select("voucherGroupId")
      .eq("userId", userId)
      .not("voucherGroupId", "is", null);

    if (redeemedError) throw redeemedError;

    const redeemedSet = new Set(
      (redeemedData || []).map((t) => t.voucherGroupId),
    );

    const merged = (rewardsData || []).map((group) => ({
      ...group,
      alreadyRedeemed: redeemedSet.has(group.voucherGroupId),
    }));

    return { success: true, data: merged };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error fetching rewards:", message);
    return { success: false, error: message };
  }
}

// ────────────────────────────────────────────────
// 7. Load Home data (user + points + exclusive check)
// ────────────────────────────────────────────────
export async function loadHomeData(userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const supabase = await createSupabaseClient();

    // Parallel fetch where possible
    const [userResult, points, exclusiveGroupsRes] = await Promise.all([
      fetchCustomerDetails(userId),
      fetchCustomerPoints(userId),
      supabase
        .from("rewardsGroup")
        .select("voucherGroupId")
        .eq("type", "exclusive"),
    ]);

    if (!userResult.success) {
      return { success: false, error: userResult.error };
    }

    if (exclusiveGroupsRes.error) throw exclusiveGroupsRes.error;

    const exclusiveIds = (exclusiveGroupsRes.data || []).map(
      (r) => r.voucherGroupId,
    );

    let showExclusiveModal = false;

    if (exclusiveIds.length > 0) {
      const { data: redeemedData, error: redeemedError } = await supabase
        .from("transactions")
        .select("voucherGroupId")
        .eq("userId", userId)
        .in("voucherGroupId", exclusiveIds)
        .limit(1);

      if (redeemedError) throw redeemedError;

      // Show modal only if the user has never redeemed any exclusive reward
      showExclusiveModal = !redeemedData || redeemedData.length === 0;
    }

    return {
      success: true,
      user: userResult.user,
      totalPoints: points ?? 0,
      showExclusiveModal,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error loading home data:", message);
    return { success: false, error: message };
  }
}

// ────────────────────────────────────────────────
// 8. Fetch Exclusive Rewards + check if already redeemed
// ────────────────────────────────────────────────
export async function fetchExclusiveRewards(userId: string) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const supabase = await createSupabaseClient();

    // 1. All exclusive groups
    const { data: exclusiveGroups, error } = await supabase
      .from("rewardsGroup")
      .select("voucherGroupId, name, description, image")
      .eq("type", "exclusive");

    if (error) throw error;

    if (!exclusiveGroups || exclusiveGroups.length === 0) {
      return {
        success: true,
        exclusiveRewards: [],
        redeemedVoucherId: null,
      };
    }

    const exclusiveGroupIds = exclusiveGroups.map((g) => g.voucherGroupId);

    // 2. Check if user already redeemed any exclusive reward
    const { data: redeemed, error: redeemedError } = await supabase
      .from("transactions")
      .select("voucherGroupId")
      .eq("userId", userId)
      .in("voucherGroupId", exclusiveGroupIds)
      .limit(1);

    if (redeemedError) throw redeemedError;

    return {
      success: true,
      exclusiveRewards: exclusiveGroups,
      redeemedVoucherId: redeemed?.[0]?.voucherGroupId ?? null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error fetching exclusive rewards:", message);
    return { success: false, error: message };
  }
}

// ────────────────────────────────────────────────
// 9. Redeem an exclusive reward
// ────────────────────────────────────────────────
export async function redeemExclusiveReward({
  userId,
  reward,
}: {
  userId: string;
  reward: {
    voucherGroupId: string;
    name: string;
    // voucherCode is optional – you can generate one server-side if needed
    voucherCode?: string;
  };
}) {
  try {
    if (!userId || !reward?.voucherGroupId) {
      return { success: false, error: "Missing required fields" };
    }

    const supabase = await createSupabaseClient();

    // Safety: double-check the user hasn’t already redeemed any exclusive reward
    const { data: existing, error: checkError } = await supabase
      .from("transactions")
      .select("voucherGroupId")
      .eq("userId", userId)
      .not("voucherGroupId", "is", null)
      .limit(1);

    if (checkError) throw checkError;

    // You may want a stricter check against exclusive groups only.
    // For now we keep it simple.
    if (existing && existing.length > 0) {
      return {
        success: false,
        error: "You already redeemed an exclusive reward.",
      };
    }

    const { error } = await supabase.from("transactions").insert({
      userId,
      points: 0,
      receiptNumber: reward.voucherCode ?? `EXCL-${Date.now()}`,
      description: `Redeemed exclusive reward: ${reward.name}`,
      transactionType: "redeem",
      voucherGroupId: reward.voucherGroupId,
    });

    if (error) throw error;

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error redeeming exclusive reward:", message);
    return { success: false, error: message };
  }
}
