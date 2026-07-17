"use server";

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

type BookingFormData = {
  type: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  pax: number;
  room?: string;
  tableType?: string;
  notes?: string;
};

export async function submitBooking(data: BookingFormData) {
  const { type, name, email, phone, date, time, pax, room, tableType, notes } =
    data;

  const bookingTypeLabel =
    type === "coworking"
      ? "Coworking / Study"
      : type === "conference"
        ? "Conference Room"
        : "Bistro Table";

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

  try {
    // 1. Email to iHub Team
    await transporter.sendMail({
      from: `"iHub Reservations" <${process.env.GMAIL_USER}>`,
      to: "webdev.astra01@gmail.com",
      subject: `🔔 New Reservation Request — ${bookingTypeLabel} | ${name}`,
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
                  
                  <!-- Header -->
                  <tr>
                    <td style="${emailStyles.header}">
                      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                        <span style="color:#ffffff;font-size:28px;">📅</span>
                      </div>
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.02em;font-family:Georgia,'Times New Roman',serif;">New Booking Request</h1>
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">iHub Coworking Bistro • Davao City</p>
                    </td>
                  </tr>
                  
                  <!-- Badge -->
                  <tr>
                    <td style="padding:24px 40px 0;">
                      <span style="${emailStyles.badge}">${bookingTypeLabel}</span>
                    </td>
                  </tr>
                  
                  <!-- Guest Info -->
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
                  
                  <!-- Booking Details -->
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
                                  <p style="${emailStyles.value}">${date}</p>
                                </td>
                                <td width="33%" style="padding:8px 0;vertical-align:top;">
                                  <span style="${emailStyles.label}">Time</span>
                                  <p style="${emailStyles.value}">${time}</p>
                                </td>
                                <td width="33%" style="padding:8px 0;vertical-align:top;">
                                  <span style="${emailStyles.label}">Guests</span>
                                  <p style="${emailStyles.value}">${pax} pax</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  ${
                    room
                      ? `
                  <!-- Preferred Room -->
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
                  </tr>
                  `
                      : ""
                  }
                  
                  ${
                    tableType
                      ? `
                  <!-- Preferred Table -->
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
                  </tr>
                  `
                      : ""
                  }
                  
                  ${
                    notes
                      ? `
                  <!-- Notes -->
                  <tr>
                    <td style="padding:0 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">Additional Notes</h2>
                      <div style="background:#fafaf9;border-radius:12px;padding:20px;color:#57534e;font-size:15px;line-height:1.6;font-style:italic;">
                        "${notes}"
                      </div>
                    </td>
                  </tr>
                  `
                      : ""
                  }
                  
                  <!-- Action Required -->
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
                                    Contact the guest within <strong style="color:#F36509;">2–4 hours</strong> to confirm. Collect <strong style="color:#F36509;">50% reservation fee</strong> via GCash or Bank Transfer.
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
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
      subject: `✨ We received your reservation, ${name}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reservation Confirmed — iHub</title>
        </head>
        <body style="${emailStyles.container}">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="padding:40px 20px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.card}">
                  
                  <!-- Header -->
                  <tr>
                    <td style="${emailStyles.header}">
                      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                        <span style="color:#ffffff;font-size:28px;">✨</span>
                      </div>
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.02em;font-family:Georgia,'Times New Roman',serif;">Thank You, ${name}!</h1>
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Your reservation request has been received.</p>
                    </td>
                  </tr>
                  
                  <!-- What's Next -->
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
                                  <p style="margin:0;color:#1c1917;font-size:15px;font-weight:600;">We'll Contact You</p>
                                  <p style="margin:4px 0 0;color:#78716c;font-size:14px;line-height:1.5;">Our team will call or message you within <strong style="color:#F36509;">2–4 hours</strong> to confirm your booking details.</p>
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
                                  <p style="margin:0;color:#1c1917;font-size:15px;font-weight:600;">Secure Your Spot</p>
                                  <p style="margin:4px 0 0;color:#78716c;font-size:14px;line-height:1.5;">Pay the <strong style="color:#F36509;">50% reservation fee</strong> via GCash or Bank Transfer to lock in your booking.</p>
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
                                  <p style="margin:0;color:#1c1917;font-size:15px;font-weight:600;">You're All Set!</p>
                                  <p style="margin:4px 0 0;color:#78716c;font-size:14px;line-height:1.5;">Arrive on your booked date and time. We'll have everything ready for you.</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
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
                                  <p style="${emailStyles.value}">${bookingTypeLabel}</p>
                                </td>
                                <td width="50%" style="padding:8px 0;vertical-align:top;">
                                  <span style="${emailStyles.label}">Date</span>
                                  <p style="${emailStyles.value}">${date}</p>
                                </td>
                              </tr>
                              <tr>
                                <td width="50%" style="padding:8px 0;vertical-align:top;">
                                  <span style="${emailStyles.label}">Time</span>
                                  <p style="${emailStyles.value}">${time}</p>
                                </td>
                                <td width="50%" style="padding:8px 0;vertical-align:top;">
                                  <span style="${emailStyles.label}">Guests</span>
                                  <p style="${emailStyles.value}">${pax} pax</p>
                                </td>
                              </tr>
                              ${
                                room
                                  ? `
                              <tr>
                                <td colspan="2" style="padding:8px 0;">
                                  <span style="${emailStyles.label}">Preferred Room</span>
                                  <p style="${emailStyles.value}">${room}</p>
                                </td>
                              </tr>
                              `
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
                              </tr>
                              `
                                  : ""
                              }
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  ${
                    notes
                      ? `
                  <!-- Notes -->
                  <tr>
                    <td style="padding:0 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">Your Notes</h2>
                      <div style="background:#fafaf9;border-radius:12px;padding:20px;color:#57534e;font-size:15px;line-height:1.6;font-style:italic;">
                        "${notes}"
                      </div>
                    </td>
                  </tr>
                  `
                      : ""
                  }
                  
                  <!-- Contact Info -->
                  <tr>
                    <td style="padding:0 40px 32px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF4ED;border-radius:16px;padding:24px;">
                        <tr>
                          <td style="text-align:center;">
                            <p style="margin:0 0 12px;color:#F36509;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Need to make changes?</p>
                            <p style="margin:0;color:#57534e;font-size:14px;line-height:1.6;">
                              Call or message us at <a href="tel:09855713768" style="${emailStyles.link}">0985 571 3768</a><br>
                              or email <a href="mailto:ihubdavao@gmail.com" style="${emailStyles.link}">ihubdavao@gmail.com</a>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Tagline -->
                  <tr>
                    <td style="padding:0 40px 32px;text-align:center;">
                      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-style:italic;color:#d6d3d1;letter-spacing:-0.01em;">
                        Create your future. Celebrate your now.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
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
