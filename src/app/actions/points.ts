"use server";
import { createSupabaseClient } from "@/lib/actions";
import { revalidatePath } from "next/cache";

/* ── types ── */
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/* ─────────────────────────────────────────────
   ADD POINTS
   amount (peso) → points = amount / 150
───────────────────────────────────────────── */
export async function addPoints(payload: {
  userId: string;
  amount: number;
  receiptNumber?: string | null;
  description?: string | null;
  adminEmail?: string | null;
}): Promise<ActionResult> {
  try {
    const { userId, amount, receiptNumber, description, adminEmail } = payload;

    if (!userId) {
      return { success: false, error: "User ID is required." };
    }
    if (!amount || amount <= 0) {
      return { success: false, error: "Enter a positive amount." };
    }

    const pointsToAdd = amount / 150;
    const supabase = await createSupabaseClient();

    // Insert transaction
    const { data: txRow, error: txErr } = await supabase
      .from("transactions")
      .insert([
        {
          userId,
          points: pointsToAdd,
          transactionType: "earn",
          receiptNumber: receiptNumber?.trim() || null,
          description: description?.trim() || null,
          voucherGroupId: null,
        },
      ])
      .select()
      .single();

    if (txErr) throw txErr;

    // Fetch user name for the log
    const { data: user } = await supabase
      .from("users")
      .select("firstname, surname")
      .eq("userId", userId)
      .single();

    const fullName = user
      ? `${user.firstname ?? ""} ${user.surname ?? ""}`.trim()
      : userId;

    // Insert log
    await supabase.from("logs").insert([
      {
        transactionId: txRow.transactionId,
        activity: `Admin ${adminEmail ?? "system"}: ${fullName} received ${Number(
          pointsToAdd,
        ).toFixed(2)} points for the amount of ₱${amount.toLocaleString(
          undefined,
          { minimumFractionDigits: 2, maximumFractionDigits: 2 },
        )}`,
      },
    ]);

    revalidatePath("/users");

    return {
      success: true,
      data: { pointsAdded: pointsToAdd, transaction: txRow },
      message: `Added ${pointsToAdd.toFixed(2)} points.`,
    };
  } catch (err) {
    console.error("addPoints error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to add points",
    };
  }
}

/* ─────────────────────────────────────────────
   REDEEM VOUCHER
───────────────────────────────────────────── */
export async function redeemVoucher(payload: {
  userId: string;
  voucherCode: string;
  currentPoints: number;
  adminId?: string | null;
}): Promise<ActionResult> {
  try {
    const { userId, voucherCode, currentPoints, adminId } = payload;
    const code = voucherCode?.trim().toUpperCase();

    if (!userId) {
      return { success: false, error: "User ID is required." };
    }
    if (!code) {
      return { success: false, error: "Please enter a voucher code." };
    }

    const supabase = await createSupabaseClient();

    // 1) Fetch reward + group
    const { data: reward, error } = await supabase
      .from("rewards")
      .select(
        `
        *,
        rewardsGroup:voucherGroupId ( name, neededPoints )
      `,
      )
      .eq("voucherCode", code)
      .single();

    if (error || !reward) {
      return { success: false, error: "Invalid voucher code." };
    }

    // 2) Already used?
    if (!reward.unused) {
      return {
        success: false,
        error: "This voucher has already been redeemed.",
      };
    }

    const neededPoints = reward.rewardsGroup?.neededPoints ?? 0;

    // 3) Enough points?
    if (currentPoints < neededPoints) {
      return {
        success: false,
        error: "Not enough points to redeem this reward.",
      };
    }

    // 4) Mark voucher as used
    const { error: updateErr } = await supabase
      .from("rewards")
      .update({ unused: false })
      .eq("voucherCode", code);

    if (updateErr) throw updateErr;

    // 5) Insert redeem transaction
    const { data: tx, error: txErr } = await supabase
      .from("transactions")
      .insert([
        {
          userId,
          points: neededPoints,
          receiptNumber: code,
          description: `Redeemed ${reward.rewardsGroup.name} with voucher code: ${code}`,
          transactionType: "redeem",
          adminId: adminId ?? null,
          voucherGroupId: reward.voucherGroupId,
        },
      ])
      .select()
      .single();

    if (txErr) throw txErr;

    // 6) Fetch user name for log
    const { data: user } = await supabase
      .from("users")
      .select("firstname, surname, userId")
      .eq("userId", userId)
      .single();

    const fullName = user
      ? `${user.firstname ?? ""} ${user.surname ?? ""}`.trim()
      : userId;

    // 7) Insert log
    await supabase.from("logs").insert([
      {
        transactionId: tx.transactionId,
        activity: `${fullName} (${userId}) redeemed reward: ${reward.rewardsGroup.name} with voucher code: ${code}`,
      },
    ]);

    revalidatePath("/users");

    return {
      success: true,
      data: { transaction: tx, pointsSpent: neededPoints },
      message: `Redeemed voucher ${code} successfully.`,
    };
  } catch (err) {
    console.error("redeemVoucher error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to redeem voucher",
    };
  }
}
