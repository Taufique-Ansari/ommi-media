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

    const formattedTime = startDateTime.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
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
      const fontStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

      // Client Confirmation Email — minimal, monochrome, table-based (bulletproof)
      const clientEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>Discovery Call Confirmed</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F4F4F2; -webkit-font-smoothing: antialiased; font-family: ${fontStack};">
        <!-- Hidden preheader -->
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
          Your call is confirmed — ${formattedDate} at ${formattedTime} IST.
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F4F4F2;">
          <tr>
            <td align="center" style="padding: 48px 16px;">
              <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width: 480px; max-width: 480px; background-color: #FFFFFF; border: 1px solid #E8E8E6; border-radius: 14px;">

                <!-- WORDMARK -->
                <tr>
                  <td style="padding: 32px 40px 0 40px;">
                    <p style="margin: 0; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1A1A1A; letter-spacing: 0.02em;">Ommi Media</p>
                  </td>
                </tr>

                <!-- HEADING -->
                <tr>
                  <td style="padding: 28px 40px 0 40px;">
                    <p style="margin: 0 0 10px 0; font-family: ${fontStack}; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #9B9B9B;">Booking confirmed</p>
                    <h1 style="margin: 0 0 12px 0; font-family: ${fontStack}; font-size: 22px; line-height: 1.3; font-weight: 600; color: #1A1A1A; letter-spacing: -0.01em;">Your call is confirmed</h1>
                    <p style="margin: 0; font-family: ${fontStack}; font-size: 15px; line-height: 1.65; color: #6B6B6B;">
                      Hi ${firstName}, your discovery call is booked. Here are the details — we're looking forward to speaking with you.
                    </p>
                  </td>
                </tr>

                <!-- DETAILS -->
                <tr>
                  <td style="padding: 28px 40px 0 40px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 14px 0; border-top: 1px solid #EDEDEB; font-family: ${fontStack}; font-size: 14px; color: #9B9B9B; width: 96px; vertical-align: top;">Date</td>
                        <td style="padding: 14px 0; border-top: 1px solid #EDEDEB; font-family: ${fontStack}; font-size: 14px; color: #1A1A1A; font-weight: 500; vertical-align: top;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 0; border-top: 1px solid #EDEDEB; font-family: ${fontStack}; font-size: 14px; color: #9B9B9B; vertical-align: top;">Time</td>
                        <td style="padding: 14px 0; border-top: 1px solid #EDEDEB; font-family: ${fontStack}; font-size: 14px; color: #1A1A1A; font-weight: 500; vertical-align: top;">${formattedTime} IST</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 0; border-top: 1px solid #EDEDEB; border-bottom: 1px solid #EDEDEB; font-family: ${fontStack}; font-size: 14px; color: #9B9B9B; vertical-align: top;">Session</td>
                        <td style="padding: 14px 0; border-top: 1px solid #EDEDEB; border-bottom: 1px solid #EDEDEB; font-family: ${fontStack}; font-size: 14px; color: #1A1A1A; font-weight: 500; vertical-align: top;">${service} &middot; 30 min</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding: 28px 40px 0 40px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" bgcolor="#1A1A1A" style="border-radius: 8px;">
                          <a href="${googleMeetUrl}" target="_blank" style="display: block; padding: 14px 24px; font-family: ${fontStack}; font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 8px;">
                            Join Google Meet
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- PREPARE -->
                <tr>
                  <td style="padding: 32px 40px 0 40px;">
                    <p style="margin: 0 0 14px 0; font-family: ${fontStack}; font-size: 14px; font-weight: 600; color: #1A1A1A;">Before the call</p>
                    <p style="margin: 0 0 9px 0; font-family: ${fontStack}; font-size: 14px; line-height: 1.6; color: #6B6B6B;">Have a rough sense of your current reach and where leads come from today.</p>
                    <p style="margin: 0 0 9px 0; font-family: ${fontStack}; font-size: 14px; line-height: 1.6; color: #6B6B6B;">Think about the growth or pipeline you want over the next 90 days.</p>
                    <p style="margin: 0; font-family: ${fontStack}; font-size: 14px; line-height: 1.6; color: #6B6B6B;">Join a couple of minutes early to check your camera and mic.</p>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="padding: 32px 40px 32px 40px;">
                    <div style="border-top: 1px solid #EDEDEB; padding-top: 20px;">
                      <p style="margin: 0 0 6px 0; font-family: ${fontStack}; font-size: 13px; line-height: 1.6; color: #9B9B9B;">
                        Need to reschedule? Reply to this email or write to <a href="mailto:ommimedia.in@gmail.com" style="color: #1A1A1A; text-decoration: none; font-weight: 500;">ommimedia.in@gmail.com</a>.
                      </p>
                      <p style="margin: 0; font-family: ${fontStack}; font-size: 12px; color: #B5B5B5;">&copy; 2026 Ommi Media</p>
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

      // Admin Notification Email — minimal lead brief, matching client system
      const adminEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="x-apple-disable-message-reformatting" />
        <title>New Booking</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F4F4F2; -webkit-font-smoothing: antialiased; font-family: ${fontStack};">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
          New booking — ${name} &middot; ${service} &middot; ${formattedDate} at ${formattedTime} IST.
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F4F4F2;">
          <tr>
            <td align="center" style="padding: 48px 16px;">
              <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width: 480px; max-width: 480px; background-color: #FFFFFF; border: 1px solid #E8E8E6; border-radius: 14px;">

                <!-- WORDMARK -->
                <tr>
                  <td style="padding: 32px 40px 0 40px;">
                    <p style="margin: 0; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1A1A1A; letter-spacing: 0.02em;">Ommi Media</p>
                  </td>
                </tr>

                <!-- HEADING -->
                <tr>
                  <td style="padding: 28px 40px 0 40px;">
                    <p style="margin: 0 0 10px 0; font-family: ${fontStack}; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #9B9B9B;">New booking</p>
                    <h1 style="margin: 0 0 12px 0; font-family: ${fontStack}; font-size: 22px; line-height: 1.3; font-weight: 600; color: #1A1A1A; letter-spacing: -0.01em;">${name} booked a call</h1>
                    <p style="margin: 0; font-family: ${fontStack}; font-size: 15px; line-height: 1.65; color: #6B6B6B;">${formattedDate} at ${formattedTime} IST</p>
                  </td>
                </tr>

                <!-- DETAILS -->
                <tr>
                  <td style="padding: 28px 40px 0 40px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 14px 0; border-top: 1px solid #EDEDEB; font-family: ${fontStack}; font-size: 14px; color: #9B9B9B; width: 96px; vertical-align: top;">Name</td>
                        <td style="padding: 14px 0; border-top: 1px solid #EDEDEB; font-family: ${fontStack}; font-size: 14px; color: #1A1A1A; font-weight: 500; vertical-align: top;">${name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 0; border-top: 1px solid #EDEDEB; font-family: ${fontStack}; font-size: 14px; color: #9B9B9B; vertical-align: top;">Email</td>
                        <td style="padding: 14px 0; border-top: 1px solid #EDEDEB; font-family: ${fontStack}; font-size: 14px; vertical-align: top;"><a href="mailto:${email}" style="color: #1A1A1A; text-decoration: none; font-weight: 500;">${email}</a></td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 0; border-top: 1px solid #EDEDEB; font-family: ${fontStack}; font-size: 14px; color: #9B9B9B; vertical-align: top;">Service</td>
                        <td style="padding: 14px 0; border-top: 1px solid #EDEDEB; font-family: ${fontStack}; font-size: 14px; color: #1A1A1A; font-weight: 500; vertical-align: top;">${service}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 0; border-top: 1px solid #EDEDEB; border-bottom: 1px solid #EDEDEB; font-family: ${fontStack}; font-size: 14px; color: #9B9B9B; vertical-align: top;">Meet</td>
                        <td style="padding: 14px 0; border-top: 1px solid #EDEDEB; border-bottom: 1px solid #EDEDEB; font-family: ${fontStack}; font-size: 13px; vertical-align: top;"><a href="${googleMeetUrl}" style="color: #1A1A1A; text-decoration: none; font-weight: 500; word-break: break-all;">${googleMeetUrl}</a></td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- MESSAGE -->
                <tr>
                  <td style="padding: 28px 40px 0 40px;">
                    <p style="margin: 0 0 10px 0; font-family: ${fontStack}; font-size: 14px; font-weight: 600; color: #1A1A1A;">Project notes</p>
                    <p style="margin: 0; font-family: ${fontStack}; font-size: 14px; line-height: 1.65; color: #6B6B6B;">${details ? details.replace(/\n/g, "<br/>") : "<span style='color: #B5B5B5;'>No additional details provided.</span>"}</p>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="padding: 28px 40px 0 40px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center" bgcolor="#1A1A1A" style="border-radius: 8px;">
                          <a href="mailto:${email}" target="_blank" style="display: block; padding: 14px 24px; font-family: ${fontStack}; font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 8px;">
                            Reply to ${firstName}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="padding: 32px 40px 32px 40px;">
                    <div style="border-top: 1px solid #EDEDEB; padding-top: 20px;">
                      <p style="margin: 0; font-family: ${fontStack}; font-size: 12px; color: #B5B5B5;">Ommi Media &middot; Automated notification</p>
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
