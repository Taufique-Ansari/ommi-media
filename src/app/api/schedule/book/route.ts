import { NextResponse } from "next/server";
import { google } from "googleapis";
import nodemailer from "nodemailer";
import { z } from "zod";

const bookingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  service: z.string().min(1, "Service type is required"),
  details: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = bookingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Validation failed", details: validation.error.format() }, { status: 400 });
    }

    const { name, email, date, time, service, details } = validation.data;

    const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
    const offset = process.env.GOOGLE_CALENDAR_OFFSET || "+05:30";
    const gmailUser = process.env.GMAIL_USER || "ommimedia.in@gmail.com";
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "ommimedia.in@gmail.com";

    // Enforce environment configurations for production readiness
    if (!serviceEmail || !rawPrivateKey) {
      return NextResponse.json(
        { error: "Google Calendar service credentials (GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY) are not configured in backend environment." },
        { status: 500 }
      );
    }

    if (!gmailAppPassword) {
      return NextResponse.json(
        { error: "Gmail SMTP email credentials (GMAIL_APP_PASSWORD) are not configured in backend environment." },
        { status: 500 }
      );
    }

    // Format start and end date times in target timezone
    const startDateTime = new Date(`${date}T${time}:00${offset}`);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30 mins

    const staticMeetUrl = process.env.GOOGLE_MEET_URL?.trim();
    const isStaticMeet = !!staticMeetUrl;

    let googleMeetUrl = isStaticMeet ? staticMeetUrl : "";
    let calendarEventId = "";

    // 1. Google Calendar Booking
    try {
      // Clean and decode the private key
      let privateKey = rawPrivateKey.trim();
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.trim();

      // Replace literal '\n' characters first to convert text representation of newlines back to actual newlines
      privateKey = privateKey.replace(/\\n/g, "\n");

      // If it starts with standard Base64 DER private key prefix "MII" and doesn't contain "BEGIN",
      // it means only the base64-encoded payload was pasted. Wrap it with standard PEM headers!
      if (privateKey.startsWith("MII") && !privateKey.includes("-----BEGIN")) {
        privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
      }

      if (privateKey.startsWith("ey") || (!privateKey.includes("-----BEGIN PRIVATE KEY-----") && !privateKey.includes("-----BEGIN RSA PRIVATE KEY-----"))) {
        try {
          const decoded = Buffer.from(privateKey, "base64").toString("utf-8");
          if (decoded.includes("-----BEGIN") && decoded.includes("PRIVATE KEY-----")) {
            privateKey = decoded;
          }
        } catch (err) {
          console.error("Failed to decode base64 key:", err);
        }
      }

      const auth = new google.auth.JWT({
        email: serviceEmail,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/calendar"],
      });

      const calendar = google.calendar({ version: "v3", auth });

      const eventDescription = [
        `Client Name: ${name}`,
        `Client Email: ${email}`,
        `Selected Service: ${service}`,
        isStaticMeet ? `Google Meet Link: ${staticMeetUrl}` : "",
        `\nClient Project Notes:\n${details || "None provided"}`
      ].filter(Boolean).join("\n");

      const event: any = {
        summary: `Discovery Call: ${name} (${service})`,
        description: eventDescription,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: "Asia/Kolkata", // default target timezone label
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: "Asia/Kolkata",
        },
      };

      if (isStaticMeet) {
        event.location = staticMeetUrl;
      } else {
        event.conferenceData = {
          createRequest: {
            requestId: `booking-${Date.now()}`,
          },
        };
      }

      try {
        const result = await calendar.events.insert({
          calendarId,
          requestBody: event,
          conferenceDataVersion: isStaticMeet ? undefined : 1, // Crucial parameter to generate Google Meet link when dynamic
        });
        calendarEventId = result.data.id || "";
        if (!isStaticMeet) {
          googleMeetUrl = result.data.conferenceData?.entryPoints?.[0]?.uri || "";
        }
      } catch (err: any) {
        console.error("Google Calendar API Insertion Error:", err);
        throw err;
      }
    } catch (err: any) {
      console.error("Critical Google Calendar booking failure:", err);
      // Throw error to propagate to outer API catch block and return 500 status to the client
      throw new Error(`Google Calendar booking failed: ${err.message}`);
    }

    // Standard fallback Meet link if none generated
    if (!googleMeetUrl) {
      googleMeetUrl = "https://meet.google.com/ommimedia-discovery";
    }

    const formattedDate = startDateTime.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Kolkata",
    });

    const formattedTime = startDateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });

    // 2. Email Notifications (Nodemailer Gmail SMTP)
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || undefined,
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
        secure: process.env.SMTP_SECURE !== "false", // default to true for port 465 (SSL/TLS)
        service: process.env.SMTP_HOST ? undefined : "gmail",
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      });

      const firstName = name.split(" ")[0];
      const fontStack = "'Helvetica Neue', Helvetica, Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      const monoStack = "'SF Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace";

      // Client Confirmation Email — premium agency aesthetic (bulletproof, table-based)
      const clientEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>Discovery Call Confirmed</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #ECE8DF; -webkit-font-smoothing: antialiased; font-family: ${fontStack};">
        <!-- Hidden preheader -->
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
          You're confirmed, ${firstName} — ${formattedDate} at ${formattedTime} IST. Your private video room is ready.
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ECE8DF;">
          <tr>
            <td align="center" style="padding: 40px 16px;">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width: 600px; max-width: 600px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 18px 50px -12px rgba(20,18,14,0.18);">

                <!-- LETTERHEAD -->
                <tr>
                  <td style="background-color: #111110; padding: 34px 40px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="left" style="font-family: ${fontStack}; color: #F6F3EC; font-size: 17px; font-weight: 700; letter-spacing: 0.32em;">
                          OMMI&nbsp;MEDIA
                        </td>
                        <td align="right" style="font-family: ${monoStack}; color: #B8946A; font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;">
                          Confirmed
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Accent hairline -->
                <tr><td style="height: 3px; background: linear-gradient(90deg, #B8946A 0%, #D8C29A 50%, #B8946A 100%); font-size: 0; line-height: 0;">&nbsp;</td></tr>

                <!-- GREETING -->
                <tr>
                  <td style="padding: 44px 40px 8px 40px;">
                    <p style="margin: 0 0 14px 0; font-family: ${monoStack}; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #B8946A; font-weight: 600;">
                      Discovery Call &middot; Secured
                    </p>
                    <h1 style="margin: 0 0 16px 0; font-family: ${fontStack}; font-size: 30px; line-height: 1.15; font-weight: 700; color: #141310; letter-spacing: -0.02em;">
                      See you soon, ${firstName}.
                    </h1>
                    <p style="margin: 0; font-family: ${fontStack}; font-size: 15px; line-height: 1.7; color: #5F5C53; font-weight: 400;">
                      Your seat is reserved on our calendar. Below is everything you need — the moment, the room, and a short way to make the call count. We're looking forward to building with you.
                    </p>
                  </td>
                </tr>

                <!-- APPOINTMENT TICKET -->
                <tr>
                  <td style="padding: 32px 40px 8px 40px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF8F3; border: 1px solid #E9E3D6; border-radius: 16px;">
                      <tr>
                        <td style="padding: 26px 28px 22px 28px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="50%" style="vertical-align: top;">
                                <p style="margin: 0 0 6px 0; font-family: ${monoStack}; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #9C988C; font-weight: 600;">Date</p>
                                <p style="margin: 0; font-family: ${fontStack}; font-size: 18px; line-height: 1.3; font-weight: 700; color: #141310;">${formattedDate}</p>
                              </td>
                              <td width="50%" style="vertical-align: top; padding-left: 16px;">
                                <p style="margin: 0 0 6px 0; font-family: ${monoStack}; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #9C988C; font-weight: 600;">Time</p>
                                <p style="margin: 0; font-family: ${fontStack}; font-size: 18px; line-height: 1.3; font-weight: 700; color: #141310;">${formattedTime} <span style="font-size: 12px; color: #9C988C; font-weight: 600;">IST</span></p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Perforation divider -->
                      <tr>
                        <td style="padding: 0 28px;">
                          <div style="border-top: 1px dashed #D8D1C1; font-size: 0; line-height: 0;">&nbsp;</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 28px 24px 28px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align: top;">
                                <p style="margin: 0 0 6px 0; font-family: ${monoStack}; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #9C988C; font-weight: 600;">Session</p>
                                <p style="margin: 0; font-family: ${fontStack}; font-size: 14px; line-height: 1.4; font-weight: 600; color: #2C2A24;">${service} &middot; 30 minutes</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA BUTTON (bulletproof) -->
                <tr>
                  <td style="padding: 26px 40px 8px 40px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" bgcolor="#141310" style="border-radius: 50px;">
                          <a href="${googleMeetUrl}" target="_blank" style="display: block; padding: 16px 24px; font-family: ${fontStack}; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #F6F3EC; text-decoration: none; border-radius: 50px;">
                            Join Google Meet Room &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 12px 0 0 0; text-align: center; font-family: ${monoStack}; font-size: 11px; color: #9C988C; letter-spacing: 0.04em; word-break: break-all;">
                      ${googleMeetUrl}
                    </p>
                  </td>
                </tr>

                <!-- PREPARE -->
                <tr>
                  <td style="padding: 26px 40px 8px 40px;">
                    <div style="border-top: 1px solid #ECE7DC; padding-top: 28px;">
                      <p style="margin: 0 0 18px 0; font-family: ${monoStack}; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #B8946A; font-weight: 600;">
                        Make the call count
                      </p>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 16px; vertical-align: top;">
                            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                              <td width="34" style="vertical-align: top;"><span style="font-family: ${monoStack}; font-size: 13px; font-weight: 700; color: #141310;">01</span></td>
                              <td style="font-family: ${fontStack}; font-size: 14px; line-height: 1.6; color: #5F5C53;"><strong style="color: #2C2A24;">Know your numbers.</strong> Have a rough sense of your current reach, audience, and where the leads come from today.</td>
                            </tr></table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom: 16px; vertical-align: top;">
                            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                              <td width="34" style="vertical-align: top;"><span style="font-family: ${monoStack}; font-size: 13px; font-weight: 700; color: #141310;">02</span></td>
                              <td style="font-family: ${fontStack}; font-size: 14px; line-height: 1.6; color: #5F5C53;"><strong style="color: #2C2A24;">Name the goal.</strong> The growth, authority, or pipeline you want over the next 90 days — even a loose target sharpens the plan.</td>
                            </tr></table>
                          </td>
                        </tr>
                        <tr>
                          <td style="vertical-align: top;">
                            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                              <td width="34" style="vertical-align: top;"><span style="font-family: ${monoStack}; font-size: 13px; font-weight: 700; color: #141310;">03</span></td>
                              <td style="font-family: ${fontStack}; font-size: 14px; line-height: 1.6; color: #5F5C53;"><strong style="color: #2C2A24;">Arrive ready.</strong> Hop into the room a couple of minutes early to check your camera and mic.</td>
                            </tr></table>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="padding: 36px 40px 40px 40px;">
                    <div style="border-top: 1px solid #ECE7DC; padding-top: 26px;">
                      <p style="margin: 0 0 10px 0; font-family: ${fontStack}; font-size: 13px; line-height: 1.7; color: #5F5C53;">
                        Need to reschedule? Just reply to this email or reach us at
                        <a href="mailto:ommimedia.in@gmail.com" style="color: #141310; text-decoration: underline; font-weight: 600;">ommimedia.in@gmail.com</a>.
                      </p>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 18px;">
                        <tr>
                          <td align="left" style="font-family: ${monoStack}; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #A8A498;">
                            &copy; 2026 Ommi Media
                          </td>
                          <td align="right" style="font-family: ${monoStack}; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;">
                            <a href="https://www.instagram.com/ommimedia.in/" target="_blank" style="color: #B8946A; text-decoration: none;">Instagram</a>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;

      // Admin Notification Email — matching premium system, dashboard-style lead brief
      const adminEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>New Booking</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #ECE8DF; -webkit-font-smoothing: antialiased; font-family: ${fontStack};">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
          New booking — ${name} &middot; ${service} &middot; ${formattedDate} at ${formattedTime} IST.
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #ECE8DF;">
          <tr>
            <td align="center" style="padding: 40px 16px;">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width: 600px; max-width: 600px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 18px 50px -12px rgba(20,18,14,0.18);">

                <!-- HEADER -->
                <tr>
                  <td style="background-color: #111110; padding: 30px 40px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="left">
                          <p style="margin: 0 0 6px 0; font-family: ${monoStack}; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #B8946A; font-weight: 600;">Leads Engine</p>
                          <p style="margin: 0; font-family: ${fontStack}; font-size: 19px; font-weight: 700; color: #F6F3EC; letter-spacing: -0.01em;">New strategy call booked</p>
                        </td>
                        <td align="right" style="vertical-align: top;">
                          <span style="display: inline-block; padding: 6px 12px; background-color: rgba(184,148,106,0.16); border: 1px solid rgba(184,148,106,0.4); border-radius: 50px; font-family: ${monoStack}; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #D8C29A; font-weight: 600;">New</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- WHEN STRIP -->
                <tr>
                  <td style="background-color: #FAF8F3; border-bottom: 1px solid #ECE7DC; padding: 18px 40px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-family: ${monoStack}; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #9C988C; font-weight: 600;">When</td>
                        <td align="right" style="font-family: ${fontStack}; font-size: 14px; font-weight: 700; color: #141310;">${formattedDate} &middot; ${formattedTime} IST</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- LEAD PROFILE -->
                <tr>
                  <td style="padding: 32px 40px 8px 40px;">
                    <p style="margin: 0 0 18px 0; font-family: ${monoStack}; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #B8946A; font-weight: 600;">Lead Profile</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 11px 0; border-bottom: 1px solid #F0ECE2; font-family: ${fontStack}; font-size: 13px; color: #9C988C; width: 110px;">Name</td>
                        <td style="padding: 11px 0; border-bottom: 1px solid #F0ECE2; font-family: ${fontStack}; font-size: 14px; color: #141310; font-weight: 700;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 11px 0; border-bottom: 1px solid #F0ECE2; font-family: ${fontStack}; font-size: 13px; color: #9C988C;">Email</td>
                        <td style="padding: 11px 0; border-bottom: 1px solid #F0ECE2; font-family: ${fontStack}; font-size: 14px; font-weight: 700;"><a href="mailto:${email}" style="color: #141310; text-decoration: underline;">${email}</a></td>
                      </tr>
                      <tr>
                        <td style="padding: 11px 0; border-bottom: 1px solid #F0ECE2; font-family: ${fontStack}; font-size: 13px; color: #9C988C;">Service</td>
                        <td style="padding: 11px 0; border-bottom: 1px solid #F0ECE2; font-family: ${fontStack}; font-size: 14px; color: #141310; font-weight: 700;">${service}</td>
                      </tr>
                      <tr>
                        <td style="padding: 11px 0; font-family: ${fontStack}; font-size: 13px; color: #9C988C;">Meet Room</td>
                        <td style="padding: 11px 0; font-family: ${monoStack}; font-size: 12px; font-weight: 600;"><a href="${googleMeetUrl}" style="color: #B8946A; text-decoration: underline; word-break: break-all;">${googleMeetUrl}</a></td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- MESSAGE -->
                <tr>
                  <td style="padding: 20px 40px 8px 40px;">
                    <p style="margin: 0 0 12px 0; font-family: ${monoStack}; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #B8946A; font-weight: 600;">Project Notes</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF8F3; border: 1px solid #E9E3D6; border-radius: 14px;">
                      <tr>
                        <td style="padding: 18px 20px; font-family: ${fontStack}; font-size: 14px; line-height: 1.65; color: #5F5C53;">
                          ${details ? details.replace(/\n/g, "<br/>") : "<em style='color: #A8A498;'>No additional details provided.</em>"}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding: 24px 40px 8px 40px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" bgcolor="#141310" style="border-radius: 50px;">
                          <a href="mailto:${email}" target="_blank" style="display: block; padding: 15px 24px; font-family: ${fontStack}; font-size: 13px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #F6F3EC; text-decoration: none; border-radius: 50px;">
                            Reply to ${firstName} &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="padding: 30px 40px 36px 40px;">
                    <div style="border-top: 1px solid #ECE7DC; padding-top: 22px; text-align: center;">
                      <p style="margin: 0; font-family: ${monoStack}; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #A8A498;">
                        Ommi Media &middot; Automated Leads Engine
                      </p>
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `;

      // Send to Client
      await transporter.sendMail({
        from: `"Ommi Media" <${gmailUser}>`,
        to: email,
        subject: `Confirmed: Discovery Call with Ommi Media`,
        html: clientEmailHtml,
      });

      // Send to Admin (Ommi Media owner)
      await transporter.sendMail({
        from: `"Ommi Media Strategy Alerts" <${gmailUser}>`,
        to: adminEmail,
        subject: `New Booking: ${name} - ${service}`,
        html: adminEmailHtml,
      });

    } catch (err: any) {
      console.error("Failed to send booking emails via Nodemailer SMTP:", err);
      throw new Error(`Email delivery failed: ${err.message}`);
    }

    return NextResponse.json({
      success: true,
      googleMeetUrl,
      eventId: calendarEventId,
      message: "Appointment successfully booked",
    });

  } catch (error: any) {
    console.error("Error in POST /api/schedule/book:", error);
    return NextResponse.json({ error: "Booking submission failed", details: error.message }, { status: 500 });
  }
}
