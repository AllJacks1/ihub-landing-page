"use server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export type PassRequestData = {
  name: string;
  email: string;
  phone: string;
  packageId: string;
  packageName: string;
  packagePrice: string;
  packageNote?: string;
  notes?: string;
};

const emailStyles = {
  container:
    "margin:0;padding:0;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;",
  card: "max-width:600px;width:100%;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);",
  header:
    "background:linear-gradient(135deg,#F36509 0%,#e05a00 100%);padding:40px 40px 32px;text-align:center;",
  badge:
    "display:inline-block;background:#FFF4ED;color:#F36509;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:8px 16px;border-radius:100px;border:1px solid #F36509;",
  sectionTitle: "margin:0 0 20px;color:#1c1917;font-size:18px;font-weight:600;",
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

/** Email-only: client confirmation + admin alert for pass / package requests */
export async function submitPassRequest(data: PassRequestData) {
  const { name, email, phone, packageName, packagePrice, packageNote, notes } =
    data;

  try {
    // ── 1. Admin ───────────────────────────────────────────────────────────
    await transporter.sendMail({
      from: `"iHub Passes" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || "webdev.astra01@gmail.com",
      subject: `🎫 New Pass Request — ${packageName} | ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="${emailStyles.container}">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="padding:40px 20px;">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.card}">
                  
                  <tr>
                    <td style="${emailStyles.header}">
                      <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                        <span style="color:#ffffff;font-size:28px;">🎫</span>
                      </div>
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.02em;font-family:Georgia,'Times New Roman',serif;">New Pass Request</h1>
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">iHub Coworking Bistro • Davao City</p>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding:24px 40px 0;">
                      <span style="${emailStyles.badge}">iStudy Pass</span>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding:32px 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">Customer</h2>
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
                            <p style="${emailStyles.value}"><a href="tel:${phone}" style="${emailStyles.link}">${phone || "—"}</a></p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding:0 40px 24px;">
                      <h2 style="${emailStyles.sectionTitle}">Requested Pass</h2>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.highlightCard}">
                        <tr>
                          <td>
                            <span style="color:#F36509;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Package</span>
                            <p style="margin:4px 0 0;color:#1c1917;font-size:18px;font-weight:700;">${packageName}</p>
                            <p style="margin:6px 0 0;color:#1c1917;font-size:16px;font-weight:600;">${packagePrice}</p>
                            ${
                              packageNote
                                ? `<p style="margin:8px 0 0;color:#78716c;font-size:14px;">${packageNote}</p>`
                                : ""
                            }
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
                      <h2 style="${emailStyles.sectionTitle}">Notes</h2>
                      <div style="background:#fafaf9;border-radius:12px;padding:20px;color:#57534e;font-size:15px;line-height:1.6;">
                        ${notes}
                      </div>
                    </td>
                  </tr>
                  `
                      : ""
                  }
                  
                  <tr>
                    <td style="padding:0 40px 40px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.actionBox}">
                        <tr>
                          <td>
                            <h3 style="margin:0 0 8px;color:#ffffff;font-size:16px;font-weight:700;">Action Required</h3>
                            <p style="margin:0;color:#a8a29e;font-size:14px;line-height:1.6;">
                              Contact the customer within <strong style="color:#F36509;">10–30 minutes</strong> to confirm the pass and send payment details (GCash / Bank Transfer).
                            </p>
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

    // ── 2. Client ──────────────────────────────────────────────────────────
    await transporter.sendMail({
      from: `"iHub Davao" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `✨ We received your pass request, ${name}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Your pass request has been received.</p>
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
                                  <p style="margin:0;color:#1c1917;font-size:15px;font-weight:600;">We'll Contact You</p>
                                  <p style="margin:4px 0 0;color:#78716c;font-size:14px;line-height:1.5;">Our team will reach out within <strong style="color:#F36509;">10–30 minutes</strong> to confirm your pass.</p>
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
                                  <p style="margin:0;color:#1c1917;font-size:15px;font-weight:600;">Payment Details</p>
                                  <p style="margin:4px 0 0;color:#78716c;font-size:14px;line-height:1.5;">We'll send GCash or Bank Transfer instructions so you can complete your purchase.</p>
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
                                  <p style="margin:0;color:#1c1917;font-size:15px;font-weight:600;">You're Ready</p>
                                  <p style="margin:4px 0 0;color:#78716c;font-size:14px;line-height:1.5;">Once payment is confirmed, your pass is activated and you can start using iHub.</p>
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
                      <h2 style="${emailStyles.sectionTitle}">Your Request</h2>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${emailStyles.detailCard}">
                        <tr>
                          <td>
                            <span style="${emailStyles.label}">Pass</span>
                            <p style="${emailStyles.value}">${packageName}</p>
                            <p style="margin:4px 0 0;color:#78716c;font-size:15px;">${packagePrice}</p>
                            ${
                              packageNote
                                ? `<p style="margin:8px 0 0;color:#78716c;font-size:13px;">${packageNote}</p>`
                                : ""
                            }
                          </td>
                        </tr>
                      </table>
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
                      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-style:italic;color:#d6d3d1;">
                        Create your future. Celebrate your now.
                      </p>
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

    return {
      success: true,
      message: "Pass request sent successfully!",
    };
  } catch (error) {
    console.error("Pass request email error:", error);
    return {
      success: false,
      message:
        "Failed to send request. Please try again or contact us at 0985 571 3768.",
    };
  }
}
