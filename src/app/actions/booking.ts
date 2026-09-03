"use server";

import { createSupabaseClient } from "@/lib/actions";
import { revalidatePath } from "next/cache";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export type BillLineItem = {
  label: string;
  detail?: string;
  amount: number;
};

export type BookingPayload = {
  type: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  endDate: string;
  endTime: string;
  pax: number;
  room?: string;
  tableType?: string;
  notes?: string;
  packageId?: string;
  packageLabel?: string;
  // Event order fields
  orderNotes?: string;
  dietaryRestrictions?: string;
  occasion?: string;
  addOnProjector?: boolean;
  addOnSpeaker?: boolean;
  addOnExtension?: boolean;
  addOnSoundSystem?: boolean;
  // Bill (computed client-side, re-validated conceptually)
  billLines?: BillLineItem[];
  billTotal?: number;
  billDeposit?: number;
  billHours?: number;
};

function bookingTypeToZone(type: string) {
  if (type === "conference") return "room";
  if (type === "bistro") return "bistro";
  if (type === "events") return "events";
  return "study";
}

function bookingTypeLabel(type: string) {
  if (type === "coworking") return "Coworking / Study";
  if (type === "conference") return "Conference Room";
  if (type === "bistro") return "Bistro Table";
  if (type === "events") return "Events / Hub a Blast";
  return type;
}

function formatPHP(amount: number): string {
  return `₱${Number(amount).toLocaleString("en-PH")}`;
}

function renderBillRows(
  lines: BillLineItem[],
  total: number,
  deposit: number,
  hours?: number,
) {
  const lineRows = lines
    .map(
      (line) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;vertical-align:top;">
          <p style="margin:0;color:#1c1917;font-size:14px;font-weight:600;">${line.label}</p>
          ${
            line.detail
              ? `<p style="margin:4px 0 0;color:#78716c;font-size:12px;">${line.detail}</p>`
              : ""
          }
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f5f5f4;text-align:right;vertical-align:top;white-space:nowrap;">
          <p style="margin:0;color:#1c1917;font-size:14px;font-weight:600;">${
            line.amount > 0 ? formatPHP(line.amount) : "—"
          }</p>
        </td>
      </tr>`,
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafaf9;border-radius:16px;padding:4px 20px 16px;">
      ${
        hours != null && hours > 0
          ? `<tr>
              <td colspan="2" style="padding:12px 0 4px;">
                <span style="color:#78716c;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.04em;">Duration</span>
                <p style="margin:4px 0 0;color:#1c1917;font-size:15px;font-weight:600;">${hours} hour${hours !== 1 ? "s" : ""}</p>
              </td>
            </tr>`
          : ""
      }
      ${lineRows}
      <tr>
        <td style="padding:14px 0 6px;">
          <p style="margin:0;color:#57534e;font-size:14px;font-weight:600;">Total</p>
        </td>
        <td style="padding:14px 0 6px;text-align:right;">
          <p style="margin:0;color:#1c1917;font-size:18px;font-weight:700;">${formatPHP(total)}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:6px 0 12px;">
          <p style="margin:0;color:#F36509;font-size:14px;font-weight:700;">50% reservation fee due now</p>
        </td>
        <td style="padding:6px 0 12px;text-align:right;">
          <p style="margin:0;color:#F36509;font-size:18px;font-weight:700;">${formatPHP(deposit)}</p>
        </td>
      </tr>
    </table>
  `;
}

export async function submitBooking(data: BookingPayload) {
  const {
    type,
    name,
    email,
    phone,
    date,
    time,
    endDate,
    endTime,
    pax,
    room,
    tableType,
    notes,
    packageLabel,
    orderNotes,
    dietaryRestrictions,
    occasion,
    billLines = [],
    billTotal = 0,
    billDeposit = 0,
    billHours,
  } = data;

  const zone = bookingTypeToZone(type);
  const start_at = new Date(`${date}T${time}:00`).toISOString();
  const end_at = new Date(`${endDate}T${endTime}:00`).toISOString();

  // Build richer notes for DB
  const metaBits: string[] = [];
  if (packageLabel)
    metaBits.push(`<p><strong>Package:</strong> ${packageLabel}</p>`);
  if (room) metaBits.push(`<p><strong>Room:</strong> ${room}</p>`);
  if (tableType)
    metaBits.push(`<p><strong>Table preference:</strong> ${tableType}</p>`);
  if (occasion) metaBits.push(`<p><strong>Occasion:</strong> ${occasion}</p>`);
  if (dietaryRestrictions)
    metaBits.push(
      `<p><strong>Dietary / allergies:</strong> ${dietaryRestrictions}</p>`,
    );
  if (orderNotes)
    metaBits.push(`<p><strong>Order notes:</strong> ${orderNotes}</p>`);
  if (billTotal > 0) {
    metaBits.push(
      `<p><strong>Estimated total:</strong> ${formatPHP(billTotal)} · <strong>50% deposit:</strong> ${formatPHP(billDeposit)}</p>`,
    );
  }

  const notesHtml = [...metaBits, notes].filter(Boolean).join("") || undefined;

  // 1. Save to DB
  const supabase = await createSupabaseClient();
  const { error } = await supabase.from("reservations").insert({
    full_name: name,
    email,
    phone: phone || null,
    pax,
    zone,
    start_at,
    end_at,
    notes: notesHtml,
    status: "pending",
    // Optional: store bill snapshot if your schema has JSON columns
    // bill_total: billTotal,
    // bill_deposit: billDeposit,
  });

  if (error) {
    console.error("Reservation insert error:", error);
    return {
      success: false,
      message: error.message || "Failed to save reservation.",
    };
  }

  revalidatePath("/admin/reservations");
  revalidatePath("/admin/reservations/calendar");
  revalidatePath("/");

  const typeLabel = bookingTypeLabel(type);

  const emailStyles = {
    container:
      "margin:0;padding:0;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;",
    card: "max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);",
    header:
      "background:linear-gradient(135deg,#F36509 0%,#e05a00 100%);padding:40px 40px 32px;text-align:center;",
    badge:
      "display:inline-block;background:#FFF4ED;color:#F36509;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:8px 16px;border-radius:100px;border:1px solid #F36509;",
    sectionTitle:
      "margin:0 0 20px;color:#1c1917;font-size:18px;font-weight:600;",
    label:
      "color:#78716c;font-size:13px;font-weight:500;text-transform:uppercase;letter-spacing:0.04em;",
    value: "margin:4px 0 0;color:#1c1917;font-size:16px;font-weight:600;",
    row: "padding:12px 0;border-bottom:1px solid #f5f5f4;",
    detailCard: "background:#fafaf9;border-radius:16px;padding:20px;",
    highlightCard:
      "background:#FFF4ED;border-radius:12px;border-left:4px solid #F36509;padding:16px 20px;",
    actionBox: "background:#1c1917;border-radius:16px;padding:28px;",
    footer:
      "background:#fafaf9;padding:24px 40px;text-align:center;border-top:1px solid #f5f5f4;",
    link: "color:#F36509;text-decoration:none;font-weight:500;",
  };

  const billHtml =
    billLines.length > 0
      ? renderBillRows(billLines, billTotal, billDeposit, billHours)
      : `<p style="color:#78716c;font-size:14px;">Bill details will be confirmed by our team.</p>`;

  const eventOrderBlock =
    type === "events" && (occasion || dietaryRestrictions || orderNotes)
      ? `
        <tr>
          <td style="padding:0 40px 24px;">
            <h2 style="${emailStyles.sectionTitle}">Event / Order Details</h2>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.detailCard}">
              ${
                occasion
                  ? `<tr><td style="padding:8px 0;"><span style="${emailStyles.label}">Occasion</span><p style="${emailStyles.value}">${occasion}</p></td></tr>`
                  : ""
              }
              ${
                dietaryRestrictions
                  ? `<tr><td style="padding:8px 0;"><span style="${emailStyles.label}">Dietary / Allergies</span><p style="${emailStyles.value}">${dietaryRestrictions}</p></td></tr>`
                  : ""
              }
              ${
                orderNotes
                  ? `<tr><td style="padding:8px 0;"><span style="${emailStyles.label}">Order notes</span><p style="margin:4px 0 0;color:#57534e;font-size:15px;line-height:1.5;">${orderNotes}</p></td></tr>`
                  : ""
              }
            </table>
          </td>
        </tr>`
      : "";

  try {
    // 1. Email to iHub Team
    await transporter.sendMail({
      from: `"iHub Reservations" <${process.env.GMAIL_USER}>`,
      to: "ihubdavao@gmail.com, avarissales@gmail.com",
      subject: `🔔 New Reservation Request — ${typeLabel} | ${name}${billTotal > 0 ? ` · ${formatPHP(billTotal)}` : ""}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Booking Request — iHub</title>
        </head>
        <body style="${emailStyles.container}">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="padding:40px 20px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.card}">
                  
                  <tr>
                    <td style="${emailStyles.header}">
                      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                        <span style="color:#ffffff;font-size:28px;">📅</span>
                      </div>
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.02em;font-family:Georgia,'Times New Roman',serif;">New Booking Request</h1>
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">iHub Coworking Bistro • Davao City</p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding:24px 40px 0;">
                      <span style="${emailStyles.badge}">${typeLabel}</span>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding:32px 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">Guest Information</h2>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="${emailStyles.row}">
                            <span style="${emailStyles.label}">Name</span>
                            <p style="${emailStyles.value}">${name}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="${emailStyles.row}">
                            <span style="${emailStyles.label}">Email</span>
                            <p style="${emailStyles.value}"><a href="mailto:${email}" style="${emailStyles.link}">${email}</a></p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:12px 0;">
                            <span style="${emailStyles.label}">Phone</span>
                            <p style="${emailStyles.value}"><a href="tel:${phone}" style="${emailStyles.link}">${phone}</a></p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding:0 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">Booking Details</h2>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.detailCard}">
                        <tr>
                          <td>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td width="33%" style="padding:8px 0;vertical-align:top;">
                                  <span style="${emailStyles.label}">Date</span>
                                  <p style="${emailStyles.value}">${date}${endDate && endDate !== date ? ` → ${endDate}` : ""}</p>
                                </td>
                                <td width="33%" style="padding:8px 0;vertical-align:top;">
                                  <span style="${emailStyles.label}">Time</span>
                                  <p style="${emailStyles.value}">${time}${endTime ? ` – ${endTime}` : ""}</p>
                                </td>
                                <td width="33%" style="padding:8px 0;vertical-align:top;">
                                  <span style="${emailStyles.label}">Guests</span>
                                  <p style="${emailStyles.value}">${pax} pax</p>
                                </td>
                              </tr>
                              ${
                                packageLabel
                                  ? `<tr>
                                      <td colspan="3" style="padding:8px 0;">
                                        <span style="${emailStyles.label}">Package</span>
                                        <p style="${emailStyles.value}">${packageLabel}</p>
                                      </td>
                                    </tr>`
                                  : ""
                              }
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  ${
                    room
                      ? `
                  <tr>
                    <td style="padding:0 40px 16px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.highlightCard}">
                        <tr>
                          <td>
                            <span style="color:#F36509;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Preferred Room</span>
                            <p style="margin:4px 0 0;color:#1c1917;font-size:16px;font-weight:600;">${room}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>`
                      : ""
                  }
                  
                  ${
                    tableType
                      ? `
                  <tr>
                    <td style="padding:0 40px 16px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.highlightCard}">
                        <tr>
                          <td>
                            <span style="color:#F36509;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Preferred Table</span>
                            <p style="margin:4px 0 0;color:#1c1917;font-size:16px;font-weight:600;">${tableType}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>`
                      : ""
                  }

                  ${eventOrderBlock}

                  <tr>
                    <td style="padding:0 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">Bill Breakdown</h2>
                      ${billHtml}
                    </td>
                  </tr>
                  
                  ${
                    notes
                      ? `
                  <tr>
                    <td style="padding:0 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">Additional Notes</h2>
                      <div style="background:#fafaf9;border-radius:12px;padding:20px;color:#57534e;font-size:15px;line-height:1.6;">
                        ${notes}
                      </div>
                    </td>
                  </tr>`
                      : ""
                  }
                  
                  <tr>
                    <td style="padding:0 40px 40px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.actionBox}">
                        <tr>
                          <td>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td width="40" style="vertical-align:top;">
                                  <div style="width:32px;height:32px;background:#F36509;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                                    <span style="color:#ffffff;font-size:16px;">⚡</span>
                                  </div>
                                </td>
                                <td style="vertical-align:top;padding-left:16px;">
                                  <h3 style="margin:0 0 8px;color:#ffffff;font-size:16px;font-weight:700;">Action Required</h3>
                                  <p style="margin:0;color:#a8a29e;font-size:14px;line-height:1.6;">
                                    Contact the guest within <strong style="color:#F36509;">10–30 minutes</strong> to confirm.
                                    Collect <strong style="color:#F36509;">${billDeposit > 0 ? formatPHP(billDeposit) : "50% reservation fee"}</strong> via GCash or Bank Transfer.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="${emailStyles.footer}">
                      <p style="margin:0;color:#a8a29e;font-size:13px;">iHub Coworking Bistro • Pines Place, Pioneer Drive, Bajada, Davao City</p>
                      <p style="margin:8px 0 0;color:#d6d3d1;font-size:12px;">Open 24/7 • <a href="tel:09855713768" style="${emailStyles.link}">0985 571 3768</a></p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    // 2. Confirmation Email to Client
    await transporter.sendMail({
      from: `"iHub Davao" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `✨ We received your reservation, ${name}!${billDeposit > 0 ? ` · Pay ${formatPHP(billDeposit)}` : ""}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reservation Received — iHub</title>
        </head>
        <body style="${emailStyles.container}">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="padding:40px 20px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.card}">
                  
                  <tr>
                    <td style="${emailStyles.header}">
                      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                        <span style="color:#ffffff;font-size:28px;">✨</span>
                      </div>
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.02em;font-family:Georgia,'Times New Roman',serif;">Thank You, ${name}!</h1>
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Your reservation request has been received.</p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding:32px 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">What Happens Next?</h2>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding:16px 0;border-bottom:1px solid #f5f5f4;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td width="36" style="vertical-align:top;">
                                  <div style="width:28px;height:28px;background:#F36509;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:14px;font-weight:700;">1</div>
                                </td>
                                <td style="vertical-align:top;padding-left:12px;">
                                  <p style="margin:0;color:#1c1917;font-size:15px;font-weight:600;">Pay the reservation fee</p>
                                  <p style="margin:4px 0 0;color:#78716c;font-size:14px;line-height:1.5;">
                                    Use the payment details and QR code below to pay
                                    <strong style="color:#F36509;">${billDeposit > 0 ? formatPHP(billDeposit) : "50% of the total"}</strong>
                                    (50% of your estimated bill).
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:16px 0;border-bottom:1px solid #f5f5f4;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td width="36" style="vertical-align:top;">
                                  <div style="width:28px;height:28px;background:#F36509;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:14px;font-weight:700;">2</div>
                                </td>
                                <td style="vertical-align:top;padding-left:12px;">
                                  <p style="margin:0;color:#1c1917;font-size:15px;font-weight:600;">We confirm &amp; verify</p>
                                  <p style="margin:4px 0 0;color:#78716c;font-size:14px;line-height:1.5;">After we receive your payment, our team will call or message you to confirm the details and verify the payment.</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:16px 0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td width="36" style="vertical-align:top;">
                                  <div style="width:28px;height:28px;background:#F36509;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:14px;font-weight:700;">3</div>
                                </td>
                                <td style="vertical-align:top;padding-left:12px;">
                                  <p style="margin:0;color:#1c1917;font-size:15px;font-weight:600;">You're locked in</p>
                                  <p style="margin:4px 0 0;color:#78716c;font-size:14px;line-height:1.5;">Once verified, your reservation is confirmed. Arrive on your booked date and time — we'll have everything ready.</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Bill Breakdown -->
                  <tr>
                    <td style="padding:0 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">Your Bill Breakdown</h2>
                      ${billHtml}
                      <p style="margin:12px 0 0;color:#78716c;font-size:13px;line-height:1.5;">
                        This is an estimate based on your selected package and duration. Final amount may be adjusted if details change. The remaining balance is due on the day of your reservation (or earlier, by agreement).
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Payment Instructions -->
                  <tr>
                    <td style="padding:0 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">Payment Instructions</h2>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF4ED;border-radius:16px;border:1px solid #F36509;overflow:hidden;">
                        <tr>
                          <td style="padding:24px;">
                            <p style="margin:0 0 16px;color:#1c1917;font-size:15px;line-height:1.6;">
                              Please send the <strong>50% reservation fee${billDeposit > 0 ? ` of ${formatPHP(billDeposit)}` : ""}</strong> via GCash or Bank Transfer. Include your full name in the reference/notes.
                            </p>
                            
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                              <tr>
                                <td style="background:#ffffff;border-radius:12px;padding:16px;">
                                  <p style="margin:0 0 4px;color:#F36509;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;">GCash</p>
                                  <p style="margin:0;color:#1c1917;font-size:18px;font-weight:700;">0912 967 6049</p>
                                  <p style="margin:4px 0 0;color:#78716c;font-size:13px;">Account Name: Mares Mae Nuera</p>
                                </td>
                              </tr>
                            </table>
                            
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td align="center">
                                  <p style="margin:0 0 12px;color:#78716c;font-size:13px;">Scan to pay via GCash</p>
                                  <img src="https://gasrncdfxphcxiwjevzl.supabase.co/storage/v1/object/public/announcemet_attachments/760938713_1614840956643997_6791671717786918740_n.jpg" alt="GCash QR Code" width="280" style="display:block;max-width:100%;height:auto;border-radius:12px;border:1px solid #e7e5e4;margin:0 auto;" />
                                  <p style="margin:16px 0 0;color:#57534e;font-size:13px;line-height:1.5;">
                                    Once paid, upload your receipt here so we can verify and confirm your booking:
                                  </p>
                                  <p style="margin:12px 0 0;">
                                    <a href="https://ihubcoworking.astragroupph.com/submit-receipt"
                                      style="display:inline-block;background:#F36509;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:999px;">
                                      Submit payment receipt
                                    </a>
                                  </p>
                                  <p style="margin:12px 0 0;color:#a8a29e;font-size:12px;">
                                    Or message a screenshot to us at 0985 571 3768 / ihubdavao@gmail.com
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:12px 0 0;color:#78716c;font-size:13px;line-height:1.5;">
  After payment, <a href="https://ihubcoworking.astragroupph.com/submit-receipt" style="color:#F36509;text-decoration:none;font-weight:600;">submit your receipt here</a>
  so our team can verify and confirm your booking.
</p>
                    </td>
                  </tr>
                  
                  <!-- Booking Summary -->
                  <tr>
                    <td style="padding:0 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">Your Booking Summary</h2>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.detailCard}">
                        <tr>
                          <td>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td width="50%" style="padding:8px 0;vertical-align:top;">
                                  <span style="${emailStyles.label}">Type</span>
                                  <p style="${emailStyles.value}">${typeLabel}</p>
                                </td>
                                <td width="50%" style="padding:8px 0;vertical-align:top;">
                                  <span style="${emailStyles.label}">Date</span>
                                  <p style="${emailStyles.value}">${date}${endDate && endDate !== date ? ` → ${endDate}` : ""}</p>
                                </td>
                              </tr>
                              <tr>
                                <td width="50%" style="padding:8px 0;vertical-align:top;">
                                  <span style="${emailStyles.label}">Time</span>
                                  <p style="${emailStyles.value}">${time}${endTime ? ` – ${endTime}` : ""}</p>
                                </td>
                                <td width="50%" style="padding:8px 0;vertical-align:top;">
                                  <span style="${emailStyles.label}">Guests</span>
                                  <p style="${emailStyles.value}">${pax} pax</p>
                                </td>
                              </tr>
                              ${
                                packageLabel
                                  ? `
                              <tr>
                                <td colspan="2" style="padding:8px 0;">
                                  <span style="${emailStyles.label}">Package</span>
                                  <p style="${emailStyles.value}">${packageLabel}</p>
                                </td>
                              </tr>`
                                  : ""
                              }
                              ${
                                room
                                  ? `
                              <tr>
                                <td colspan="2" style="padding:8px 0;">
                                  <span style="${emailStyles.label}">Preferred Room</span>
                                  <p style="${emailStyles.value}">${room}</p>
                                </td>
                              </tr>`
                                  : ""
                              }
                              ${
                                tableType
                                  ? `
                              <tr>
                                <td colspan="2" style="padding:8px 0;">
                                  <span style="${emailStyles.label}">Preferred Table</span>
                                  <p style="${emailStyles.value}">${tableType}</p>
                                </td>
                              </tr>`
                                  : ""
                              }
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  ${eventOrderBlock}
                  
                  ${
                    notes
                      ? `
                  <tr>
                    <td style="padding:0 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">Your Notes</h2>
                      <div style="background:#fafaf9;border-radius:12px;padding:20px;color:#57534e;font-size:15px;line-height:1.6;">
                        ${notes}
                      </div>
                    </td>
                  </tr>`
                      : ""
                  }
                  
                  <!-- Cancellation & Rescheduling Policy -->
                  <tr>
                    <td style="padding:0 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">Cancellation &amp; Rescheduling Policy</h2>
                      <div style="background:#fafaf9;border-radius:16px;padding:20px;font-size:13px;line-height:1.6;color:#57534e;">
                        <p style="margin:0 0 12px;font-weight:600;color:#1c1917;">Cancellations</p>
                        <ul style="margin:0 0 16px;padding-left:18px;">
                          <li style="margin-bottom:6px;"><strong>14 days or more before:</strong> FREE — full refund.</li>
                          <li style="margin-bottom:6px;"><strong>7–13 days before:</strong> ₱500 fee deducted; remaining balance refunded.</li>
                          <li style="margin-bottom:6px;"><strong>1–6 days before:</strong> 50% of total or ₱500 (whichever is higher).</li>
                          <li style="margin-bottom:6px;"><strong>Same-day / No-show:</strong> 100% non-refundable.</li>
                        </ul>
                        <p style="margin:0 0 12px;font-weight:600;color:#1c1917;">Rescheduling</p>
                        <ul style="margin:0 0 16px;padding-left:18px;">
                          <li style="margin-bottom:6px;">May be rescheduled once, subject to availability.</li>
                          <li style="margin-bottom:6px;">≥ 7 days before: no fee.</li>
                          <li style="margin-bottom:6px;">1–6 days before: ₱500 rescheduling fee may apply.</li>
                          <li style="margin-bottom:6px;">Same-day rescheduling is generally treated as a cancellation.</li>
                          <li style="margin-bottom:6px;">New date must be within 30 days of the original date.</li>
                        </ul>
                        <p style="margin:0;font-size:12px;color:#a8a29e;">
                          All requests must be made through an official iHub channel and are effective upon acknowledgment. Late arrival does not automatically extend your reserved time. Approved refunds are based on the amount received by iHub, less applicable charges and third-party fees.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding:0 40px 32px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF4ED;border-radius:16px;padding:24px;">
                        <tr>
                          <td style="text-align:center;">
                            <p style="margin:0 0 12px;color:#F36509;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Questions or need to change something?</p>
                            <p style="margin:0;color:#57534e;font-size:14px;line-height:1.6;">
                              Call or message us at <a href="tel:09855713768" style="${emailStyles.link}">0985 571 3768</a><br>
                              or email <a href="mailto:ihubdavao@gmail.com" style="${emailStyles.link}">ihubdavao@gmail.com</a>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding:0 40px 32px;text-align:center;">
                      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-style:italic;color:#d6d3d1;letter-spacing:-0.01em;">
                        Create your future. Celebrate your now.
                      </p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="${emailStyles.footer}">
                      <p style="margin:0;color:#a8a29e;font-size:13px;text-align:center;">iHub Coworking Bistro • Pines Place, Pioneer Drive, Bajada, Davao City</p>
                      <p style="margin:8px 0 0;color:#d6d3d1;font-size:12px;text-align:center;">Open 24/7 • <a href="tel:09855713768" style="${emailStyles.link}">0985 571 3768</a></p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return {
      success: true,
      message: "Reservation request submitted successfully!",
    };
  } catch (error) {
    console.error("Booking email error:", error);
    return {
      success: false,
      message:
        "Failed to submit reservation. Please try again or contact us directly.",
    };
  }
}

export type PaymentReceiptPayload = {
  name: string;
  email: string;
  phone?: string;
  amountPaid: string;
  paymentMethod: string;
  notes?: string;
};

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

function formatPHPLabel(amount: string): string {
  const n = Number(String(amount).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return amount || "—";
  return `₱${n.toLocaleString("en-PH")}`;
}

export async function submitPaymentReceipt(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const amountPaid = String(formData.get("amountPaid") || "").trim();
  const paymentMethod = String(formData.get("paymentMethod") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const receipt = formData.get("receipt") as File | null;

  if (!name || !email) {
    return { success: false, message: "Name and email are required." };
  }
  if (!amountPaid) {
    return { success: false, message: "Please enter the amount you paid." };
  }
  if (!paymentMethod) {
    return { success: false, message: "Please select a payment method." };
  }
  if (!receipt || !(receipt instanceof File) || receipt.size === 0) {
    return {
      success: false,
      message: "Please attach a photo or PDF of your payment receipt.",
    };
  }
  if (receipt.size > MAX_FILE_BYTES) {
    return {
      success: false,
      message: "Receipt file is too large. Max size is 8 MB.",
    };
  }
  const mime = receipt.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime)) {
    return {
      success: false,
      message: "Please upload a JPG, PNG, WEBP, HEIC, or PDF file.",
    };
  }

  const buffer = Buffer.from(await receipt.arrayBuffer());
  const safeName = receipt.name.replace(/[^\w.\-()+ ]+/g, "_") || "receipt";
  const amountLabel = formatPHPLabel(amountPaid);

  const emailStyles = {
    container:
      "margin:0;padding:0;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;",
    card: "max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);",
    header:
      "background:linear-gradient(135deg,#F36509 0%,#e05a00 100%);padding:40px 40px 32px;text-align:center;",
    badge:
      "display:inline-block;background:#FFF4ED;color:#F36509;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:8px 16px;border-radius:100px;border:1px solid #F36509;",
    sectionTitle:
      "margin:0 0 20px;color:#1c1917;font-size:18px;font-weight:600;",
    label:
      "color:#78716c;font-size:13px;font-weight:500;text-transform:uppercase;letter-spacing:0.04em;",
    value: "margin:4px 0 0;color:#1c1917;font-size:16px;font-weight:600;",
    row: "padding:12px 0;border-bottom:1px solid #f5f5f4;",
    detailCard: "background:#fafaf9;border-radius:16px;padding:20px;",
    highlightCard:
      "background:#FFF4ED;border-radius:12px;border-left:4px solid #F36509;padding:16px 20px;",
    actionBox: "background:#1c1917;border-radius:16px;padding:28px;",
    footer:
      "background:#fafaf9;padding:24px 40px;text-align:center;border-top:1px solid #f5f5f4;",
    link: "color:#F36509;text-decoration:none;font-weight:500;",
  };

  const detailRow = (label: string, value: string) =>
    value
      ? `<tr>
          <td style="${emailStyles.row}">
            <span style="${emailStyles.label}">${label}</span>
            <p style="${emailStyles.value}">${value}</p>
          </td>
        </tr>`
      : "";

  try {
    // 1. Email to iHub Team (with receipt attached)
    await transporter.sendMail({
      from: `"iHub Reservations" <${process.env.GMAIL_USER}>`,
      to: "ihubdavao@gmail.com, avarissales@gmail.com",
      subject: `🧾 Payment Receipt — ${name} · ${amountLabel}`,
      attachments: [
        {
          filename: safeName,
          content: buffer,
          contentType: mime,
        },
      ],
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Receipt — iHub</title>
        </head>
        <body style="${emailStyles.container}">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="padding:40px 20px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.card}">
                  
                  <tr>
                    <td style="${emailStyles.header}">
                      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                        <span style="color:#ffffff;font-size:28px;">🧾</span>
                      </div>
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.02em;font-family:Georgia,'Times New Roman',serif;">Payment Receipt Submitted</h1>
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">iHub Coworking Bistro • Davao City</p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding:24px 40px 0;">
                      <span style="${emailStyles.badge}">Receipt verification</span>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding:32px 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">Guest Information</h2>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        ${detailRow("Name", name)}
                        <tr>
                          <td style="${emailStyles.row}">
                            <span style="${emailStyles.label}">Email</span>
                            <p style="${emailStyles.value}"><a href="mailto:${email}" style="${emailStyles.link}">${email}</a></p>
                          </td>
                        </tr>
                        ${
                          phone
                            ? `<tr>
                                <td style="padding:12px 0;">
                                  <span style="${emailStyles.label}">Phone</span>
                                  <p style="${emailStyles.value}"><a href="tel:${phone}" style="${emailStyles.link}">${phone}</a></p>
                                </td>
                              </tr>`
                            : ""
                        }
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">Payment Details</h2>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.detailCard}">
                        <tr>
                          <td>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td width="50%" style="padding:8px 0;vertical-align:top;">
                                  <span style="${emailStyles.label}">Amount paid</span>
                                  <p style="margin:4px 0 0;color:#F36509;font-size:20px;font-weight:700;">${amountLabel}</p>
                                </td>
                                <td width="50%" style="padding:8px 0;vertical-align:top;">
                                  <span style="${emailStyles.label}">Method</span>
                                  <p style="${emailStyles.value}">${paymentMethod}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  ${
                    notes
                      ? `
                  <tr>
                    <td style="padding:0 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">Notes from guest</h2>
                      <div style="background:#fafaf9;border-radius:12px;padding:20px;color:#57534e;font-size:15px;line-height:1.6;">
                        ${notes.replace(/\n/g, "<br>")}
                      </div>
                    </td>
                  </tr>`
                      : ""
                  }

                  <tr>
                    <td style="padding:0 40px 16px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.highlightCard}">
                        <tr>
                          <td>
                            <span style="color:#F36509;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Attachment</span>
                            <p style="margin:4px 0 0;color:#1c1917;font-size:15px;font-weight:600;">${safeName}</p>
                            <p style="margin:4px 0 0;color:#78716c;font-size:13px;">Receipt file is attached to this email — open it to verify payment.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding:0 40px 40px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.actionBox}">
                        <tr>
                          <td>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td width="40" style="vertical-align:top;">
                                  <div style="width:32px;height:32px;background:#F36509;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                                    <span style="color:#ffffff;font-size:16px;">⚡</span>
                                  </div>
                                </td>
                                <td style="vertical-align:top;padding-left:16px;">
                                  <h3 style="margin:0 0 8px;color:#ffffff;font-size:16px;font-weight:700;">Action Required</h3>
                                  <p style="margin:0;color:#a8a29e;font-size:14px;line-height:1.6;">
                                    Verify the attached receipt against GCash / bank records, then contact the guest to <strong style="color:#F36509;">confirm the booking</strong>.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="${emailStyles.footer}">
                      <p style="margin:0;color:#a8a29e;font-size:13px;">iHub Coworking Bistro • Pines Place, Pioneer Drive, Bajada, Davao City</p>
                      <p style="margin:8px 0 0;color:#d6d3d1;font-size:12px;">Open 24/7 • <a href="tel:09855713768" style="${emailStyles.link}">0985 571 3768</a></p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    // 2. Confirmation to guest
    await transporter.sendMail({
      from: `"iHub Davao" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `✅ We received your payment receipt, ${name}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Receipt Received — iHub</title>
        </head>
        <body style="${emailStyles.container}">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="padding:40px 20px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.card}">
                  
                  <tr>
                    <td style="${emailStyles.header}">
                      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                        <span style="color:#ffffff;font-size:28px;">✅</span>
                      </div>
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.02em;font-family:Georgia,'Times New Roman',serif;">Receipt Received</h1>
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Thank you, ${name}. We're verifying your payment.</p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding:32px 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">What happens next?</h2>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding:16px 0;border-bottom:1px solid #f5f5f4;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td width="36" style="vertical-align:top;">
                                  <div style="width:28px;height:28px;background:#F36509;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:14px;font-weight:700;">1</div>
                                </td>
                                <td style="vertical-align:top;padding-left:12px;">
                                  <p style="margin:0;color:#1c1917;font-size:15px;font-weight:600;">We verify your receipt</p>
                                  <p style="margin:4px 0 0;color:#78716c;font-size:14px;line-height:1.5;">
                                    Our team will match your payment (${amountLabel} via ${paymentMethod}) against our records.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:16px 0;border-bottom:1px solid #f5f5f4;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td width="36" style="vertical-align:top;">
                                  <div style="width:28px;height:28px;background:#F36509;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:14px;font-weight:700;">2</div>
                                </td>
                                <td style="vertical-align:top;padding-left:12px;">
                                  <p style="margin:0;color:#1c1917;font-size:15px;font-weight:600;">We confirm your booking</p>
                                  <p style="margin:4px 0 0;color:#78716c;font-size:14px;line-height:1.5;">Once verified, we'll call or message you to lock in your reservation.</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:16px 0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td width="36" style="vertical-align:top;">
                                  <div style="width:28px;height:28px;background:#F36509;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:14px;font-weight:700;">3</div>
                                </td>
                                <td style="vertical-align:top;padding-left:12px;">
                                  <p style="margin:0;color:#1c1917;font-size:15px;font-weight:600;">You're all set</p>
                                  <p style="margin:4px 0 0;color:#78716c;font-size:14px;line-height:1.5;">Arrive on your booked date and time — we'll have everything ready.</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">Submission summary</h2>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.detailCard}">
                        <tr>
                          <td>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td width="50%" style="padding:8px 0;vertical-align:top;">
                                  <span style="${emailStyles.label}">Amount</span>
                                  <p style="margin:4px 0 0;color:#F36509;font-size:18px;font-weight:700;">${amountLabel}</p>
                                </td>
                                <td width="50%" style="padding:8px 0;vertical-align:top;">
                                  <span style="${emailStyles.label}">Method</span>
                                  <p style="${emailStyles.value}">${paymentMethod}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:12px 0 0;color:#78716c;font-size:13px;line-height:1.5;">
                        Your receipt file was delivered to our team. You do not need to resend it unless we ask.
                      </p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding:0 40px 32px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF4ED;border-radius:16px;padding:24px;">
                        <tr>
                          <td style="text-align:center;">
                            <p style="margin:0 0 12px;color:#F36509;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Questions?</p>
                            <p style="margin:0;color:#57534e;font-size:14px;line-height:1.6;">
                              Call or message us at <a href="tel:09855713768" style="${emailStyles.link}">0985 571 3768</a><br>
                              or email <a href="mailto:ihubdavao@gmail.com" style="${emailStyles.link}">ihubdavao@gmail.com</a>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding:0 40px 32px;text-align:center;">
                      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-style:italic;color:#d6d3d1;letter-spacing:-0.01em;">
                        Create your future. Celebrate your now.
                      </p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="${emailStyles.footer}">
                      <p style="margin:0;color:#a8a29e;font-size:13px;text-align:center;">iHub Coworking Bistro • Pines Place, Pioneer Drive, Bajada, Davao City</p>
                      <p style="margin:8px 0 0;color:#d6d3d1;font-size:12px;text-align:center;">Open 24/7 • <a href="tel:09855713768" style="${emailStyles.link}">0985 571 3768</a></p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    return {
      success: true,
      message: "Payment receipt submitted successfully.",
    };
  } catch (error) {
    console.error("Payment receipt email error:", error);
    return {
      success: false,
      message:
        "Failed to submit receipt. Please try again or message us at 0985 571 3768.",
    };
  }
}