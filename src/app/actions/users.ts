"use server";

import { createSupabaseClient } from "@/lib/actions";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { cookies } from "next/headers";

/* ── types ── */
export type MembershipStatus = "active" | "expired" | "none";

export interface UserRow {
  userId: string;
  firstname: string | null;
  surname: string | null;
  email: string | null;
  memberSince: string | null;
  memberUntil: string | null;
  contactNumber: string | null;
  totalPoints: number;
}

export interface UserDetails extends UserRow {
  transactions: {
    transactionId?: string;
    points: number;
    transactionType: "earn" | "redeem" | string;
    created_at?: string;
    description?: string | null;
  }[];
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SignUpPayload {
  userId: string;
  firstname: string;
  surname: string;
  birthday: string;
  contactNumber: string;
  address: string;
  email: string;
  referralCode?: string | null;
}

export interface SignUpSponsoredPayload {
  userId: string;
  firstname: string;
  surname: string;
  birthday: string;
  contactNumber: string;
  address: string;
  email: string;
  sponsorshipVoucher: string;
  voucherCode: string;
  referralCode?: string | null;
}

export interface SignUpResult {
  success: boolean;
  account?: {
    email: string;
    secret: string;
  };
  error?: string;
}

export interface LogEntry {
  logsId: string | number;
  activity: string | null;
  created_at: string;
  // add any other columns you have in the logs table
}

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SignInPayload {
  email: string;
  secret: string;
}

export interface SignInResult {
  success: boolean;
  user?: {
    userId: string;
  };
  error?: string;
}

/* ── helpers ── */
function calculatePoints(
  transactions: { points: number; transactionType: string }[],
): number {
  return transactions.reduce((sum, item) => {
    const value = Number(item.points) || 0;
    if (item.transactionType === "earn") return sum + value;
    if (item.transactionType === "redeem") return sum - value;
    return sum;
  }, 0);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendMemberEmail(
  toEmail: string,
  password: string,
  name: string,
) {
  const year = new Date().getFullYear();

  const htmlContent = `
    <!-- HTML email: iAccess member welcome -->
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Welcome to iAccess</title>
</head>
<body style="margin:0;padding:0;background:#f5efe0;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color:#333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:800px;margin:24px auto;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.08);border:1px solid #eee;">
          <!-- Header / Brand -->
          <tr>
            <td style="background:#f5630e; background:linear-gradient(90deg,#f5630e,#ff8a3d); padding:22px 20px; text-align:left;">
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:28px 22px 8px;">
              <h1 style="margin:0 0 8px;font-size:22px;color:#313131;font-weight:700;">Welcome to iHub: iAccess, ${name} 🎉</h1>
              <p style="margin:0;color:#666;font-size:14px;line-height:1.5;">
                Your membership is active. Below are your sign-in details for the membership portal.
              </p>
            </td>
          </tr>

          <!-- Credentials -->
          <tr>
            <td style="padding:10px 22px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f5;border-radius:8px;padding:12px;border:1px dashed #f0d9cc;">
                <tr>
                  <td style="padding:8px 12px;">
                    <strong style="display:block;font-size:13px;color:#333;margin-bottom:6px;">Email</strong>
                    <div style="font-size:15px;color:#111;background:#fff;padding:10px;border-radius:6px;border:1px solid #eee;">
                      ${toEmail}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 12px;">
                    <strong style="display:block;font-size:13px;color:#333;margin-bottom:6px;">Temporary Password</strong>
                    <div style="font-size:15px;color:#111;background:#fff;padding:10px;border-radius:6px;border:1px solid #eee;">
                      ${password}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:6px 22px 22px;text-align:center;">
              <a href="https://ihub-iaccess.vercel.app/" style="display:inline-block;background:#f5630e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;font-size:15px;">
                Go to iAccess Portal
              </a>
              <p style="margin:12px 0 0;color:#777;font-size:13px;">Tip: For security, change your password after first login.</p>
            </td>
          </tr>

          <!-- Extra info -->
          <tr>
            <td style="padding:0 22px 22px;">
              <hr style="border:none;border-top:1px solid #f0e6e0;margin:12px 0;">
              <p style="margin:0;color:#666;font-size:13px;line-height:1.5;">
                If you didn’t request this account or need help, contact support at
                <a href="mailto:support@your-domain.example.com" style="color:#f5630e;text-decoration:none;">+639855713768</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#faf7f5;padding:16px 22px;text-align:center;color:#999;font-size:12px;">
              © <span>${year}</span> iHub: iAccess Davao<br/>
              iHub at Pines Place, Pioneer Dr, Bajada, Davao City, 8000 Davao del Sur<br/>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `"iAccess" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Your iAccess Membership Details",
    html: htmlContent,
  });
}

/* ─────────────────────────────────────────────
   GET ALL USERS (with total points)
───────────────────────────────────────────── */
export async function getUsers(): Promise<ActionResult<UserRow[]>> {
  try {
    const supabase = await createSupabaseClient();

    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select(
        "userId, firstname, surname, email, memberSince, memberUntil, contactNumber",
      )
      .order("firstname", { ascending: true });

    if (usersError) {
      console.error("getUsers error:", usersError);
      return { success: false, error: usersError.message };
    }

    if (!usersData || usersData.length === 0) {
      return { success: true, data: [] };
    }

    // Fetch all transactions in one go (much better than N+1)
    const userIds = usersData.map((u) => u.userId);

    const { data: allTransactions, error: txError } = await supabase
      .from("transactions")
      .select("userId, points, transactionType")
      .in("userId", userIds);

    if (txError) {
      console.error("getUsers transactions error:", txError);
      // still return users with 0 points rather than failing completely
    }

    const pointsMap = new Map<string, number>();

    (allTransactions ?? []).forEach((tx) => {
      const current = pointsMap.get(tx.userId) ?? 0;
      const value = Number(tx.points) || 0;

      if (tx.transactionType === "earn") {
        pointsMap.set(tx.userId, current + value);
      } else if (tx.transactionType === "redeem") {
        pointsMap.set(tx.userId, current - value);
      }
    });

    const usersWithPoints: UserRow[] = usersData.map((user) => ({
      ...user,
      totalPoints: pointsMap.get(user.userId) ?? 0,
    }));

    return { success: true, data: usersWithPoints };
  } catch (err) {
    console.error("getUsers unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load users",
    };
  }
}

/* ─────────────────────────────────────────────
   GET SINGLE USER + TRANSACTIONS
───────────────────────────────────────────── */
export async function getUserById(
  userId: string,
): Promise<ActionResult<UserDetails>> {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const supabase = await createSupabaseClient();

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(
        "userId, firstname, surname, email, memberSince, memberUntil, contactNumber",
      )
      .eq("userId", userId)
      .single();

    if (userError) {
      console.error("getUserById error:", userError);
      return { success: false, error: userError.message };
    }

    if (!userData) {
      return { success: false, error: "User not found" };
    }

    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("transactionId, points, transactionType, created_at, description")
      .eq("userId", userId)
      .order("created_at", { ascending: false });

    if (txError) {
      console.error("getUserById transactions error:", txError);
      return { success: false, error: txError.message };
    }

    const txs = transactions ?? [];
    const totalPoints = calculatePoints(txs);

    return {
      success: true,
      data: {
        ...userData,
        totalPoints,
        transactions: txs,
      },
    };
  } catch (err) {
    console.error("getUserById unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load user",
    };
  }
}

/* ─────────────────────────────────────────────
   UPDATE USER
───────────────────────────────────────────── */
export async function updateUser(
  userId: string,
  payload: {
    firstname?: string | null;
    surname?: string | null;
    email?: string | null;
    contactNumber?: string | null;
  },
): Promise<ActionResult> {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const supabase = await createSupabaseClient();

    const { error } = await supabase
      .from("users")
      .update({
        firstname: payload.firstname?.trim() || null,
        surname: payload.surname?.trim() || null,
        email: payload.email?.trim() || null,
        contactNumber: payload.contactNumber?.trim() || null,
      })
      .eq("userId", userId);

    if (error) {
      console.error("updateUser error:", error);
      return { success: false, error: error.message };
    }

    // Revalidate the users page
    revalidatePath("/users"); // adjust path if different

    return { success: true };
  } catch (err) {
    console.error("updateUser unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update user",
    };
  }
}

export async function signUpUser({
  userId,
  firstname,
  surname,
  birthday,
  contactNumber,
  address,
  email,
  referralCode,
}: SignUpPayload): Promise<SignUpResult> {
  const secret = "ihubdavao123";

  try {
    // Basic validation
    if (
      !userId?.trim() ||
      !firstname?.trim() ||
      !surname?.trim() ||
      !birthday ||
      !contactNumber?.trim() ||
      !address?.trim() ||
      !email?.trim()
    ) {
      return { success: false, error: "All required fields must be filled." };
    }

    if (typeof secret !== "string" || !secret.trim()) {
      throw new Error("Invalid password format");
    }

    // Hash the password
    const hashedPassword = crypto
      .createHash("sha256")
      .update(secret)
      .digest("hex");

    // Set membership dates
    const memberSince = new Date();
    const memberUntil = new Date();
    memberUntil.setFullYear(memberUntil.getFullYear() + 1);

    const supabase = await createSupabaseClient();

    // Insert user
    const { error } = await supabase.from("users").insert([
      {
        userId: userId.trim(),
        firstname: firstname.trim(),
        surname: surname.trim(),
        birthday,
        contactNumber: contactNumber.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        secret: hashedPassword,
        referralCode: referralCode?.trim() || null,
        memberSince,
        memberUntil,
      },
    ]);

    if (error) throw error;

    // Optional: Welcome points (currently commented out in original)
    /*
    try {
      const { error: pointsError } = await supabase.from("transactions").insert({
        userId: userId.trim(),
        points: 25,
        receiptNumber: userId.trim(),
        description: "Earned 25 Welcome iAccess points",
        transactionType: "earn",
      });
      if (pointsError) throw pointsError;
    } catch (err) {
      console.error("Failed to add welcome points:", err);
    }
    */

    // Send credentials email
    try {
      await sendMemberEmail(
        email.trim().toLowerCase(),
        secret,
        firstname.trim(),
      );
    } catch (err) {
      console.log(
        "⚠️ Error sending email:",
        err instanceof Error ? err.message : err,
      );
      // Don't fail the whole signup if email fails
    }

    revalidatePath("/users");

    return {
      success: true,
      account: {
        email: email.trim().toLowerCase(),
        secret,
      },
    };
  } catch (err) {
    console.error(
      "Error signing up:",
      err instanceof Error ? err.message : err,
    );
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong",
    };
  }
}

export async function signUpSponsoredUser({
  userId,
  firstname,
  surname,
  birthday,
  contactNumber,
  address,
  email,
  sponsorshipVoucher,
  voucherCode,
  referralCode,
}: SignUpSponsoredPayload): Promise<SignUpResult> {
  const SECRET = "ihubdavao123";

  const PASSES = [
    {
      slug: "5-hour-iaccess-sponsorship-voucher",
      name: "iStudy Pass: 5 Hour Voucher",
      id: 25,
    },
    {
      slug: "10-hour-iaccess-sponsorship-voucher",
      name: "iStudy Pass: 10 Hour Voucher",
      id: 26,
    },
    {
      slug: "20-hour-iaccess-sponsorship-voucher",
      name: "iStudy Pass: 20 Hour Voucher",
      id: 27,
    },
  ] as const;

  const selectedPass = PASSES.find(
    (pass) =>
      pass.slug === sponsorshipVoucher ||
      String(pass.id) === String(sponsorshipVoucher),
  );

  if (!selectedPass) {
    return { success: false, error: "Invalid sponsorship voucher selected." };
  }

  try {
    // Basic validation
    if (
      !userId?.trim() ||
      !firstname?.trim() ||
      !surname?.trim() ||
      !birthday ||
      !contactNumber?.trim() ||
      !address?.trim() ||
      !email?.trim() ||
      !voucherCode?.trim()
    ) {
      return { success: false, error: "All required fields must be filled." };
    }

    const hashedPassword = crypto
      .createHash("sha256")
      .update(SECRET)
      .digest("hex");

    const memberSince = new Date();
    const memberUntil = new Date();
    memberUntil.setFullYear(memberUntil.getFullYear() + 1);

    const supabase = await createSupabaseClient();

    // 1. Insert User
    const { error: userError } = await supabase.from("users").insert([
      {
        userId: userId.trim(),
        firstname: firstname.trim(),
        surname: surname.trim(),
        birthday,
        contactNumber: contactNumber.trim(),
        email: email.trim().toLowerCase(),
        address: address.trim(),
        secret: hashedPassword,
        referralCode: referralCode?.trim() || null,
        memberSince,
        memberUntil,
      },
    ]);

    if (userError) {
      throw new Error(`User creation failed: ${userError.message}`);
    }

    // 2. Insert Transaction
    const { error: txError } = await supabase.from("transactions").insert({
      userId: userId.trim(),
      points: 0,
      receiptNumber: voucherCode.trim(),
      description: `Redeemed exclusive reward: ${selectedPass.name}`,
      transactionType: "redeem",
      voucherGroupId: selectedPass.id,
    });

    if (txError) {
      console.warn("Failed to create transaction record:", txError.message);
      // Non-blocking — user is already created
    }

    // 3. Send email (non-blocking)
    try {
      await sendMemberEmail(
        email.trim().toLowerCase(),
        SECRET,
        firstname.trim(),
      );
    } catch (emailErr) {
      console.error(
        "Email service error:",
        emailErr instanceof Error ? emailErr.message : emailErr,
      );
    }

    revalidatePath("/users");

    return {
      success: true,
      account: {
        email: email.trim().toLowerCase(),
        secret: SECRET,
      },
    };
  } catch (err) {
    console.error(
      "Error in signUpSponsoredUser:",
      err instanceof Error ? err.message : err,
    );
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong",
    };
  }
}

export async function fetchLogs(): Promise<ActionResult<LogEntry[]>> {
  try {
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from("logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching logs:", error.message);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: (data as LogEntry[]) ?? [],
    };
  } catch (err) {
    console.error("Unexpected error fetching logs:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load logs",
    };
  }
}

export async function signInUser({
  email,
  secret,
}: SignInPayload): Promise<SignInResult> {
  try {
    if (!email?.trim() || !secret?.trim()) {
      return { success: false, error: "Email and password required" };
    }

    // Hash password
    const hashedPassword = crypto
      .createHash("sha256")
      .update(secret)
      .digest("hex");

    const supabase = await createSupabaseClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("userId, secret")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return { success: false, error: "No account found" };
    }

    if (hashedPassword !== user.secret) {
      return { success: false, error: "Incorrect password" };
    }

    // ─── Set cookie ───────────────────────────────────────
    const cookieStore = await cookies();

    cookieStore.set("userId", user.userId, {
      httpOnly: true, // not accessible from JS (more secure)
      //secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return {
      success: true,
      user: { userId: user.userId },
    };
  } catch (err) {
    console.error(
      "signInUser error:",
      err instanceof Error ? err.message : err,
    );
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong",
    };
  }
}

export async function getCurrentUserId() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  return userId ?? null;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("userId");
}
