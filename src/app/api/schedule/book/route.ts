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

    let googleMeetUrl = "";
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

      const event = {
        summary: `Discovery Call: ${name} (${service})`,
        description: `Client Name: ${name}\nClient Email: ${email}\nSelected Service: ${service}\n\nClient Project Notes:\n${details || "None provided"}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: "Asia/Kolkata", // default target timezone label
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: "Asia/Kolkata",
        },
        conferenceData: {
          createRequest: {
            requestId: `booking-${Date.now()}`,
          },
        },
      };

      try {
        const result = await calendar.events.insert({
          calendarId,
          requestBody: event,
          conferenceDataVersion: 1, // Crucial parameter to generate Google Meet link
        });
        calendarEventId = result.data.id || "";
        googleMeetUrl = result.data.conferenceData?.entryPoints?.[0]?.uri || "";
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
    });

    const formattedTime = startDateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
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

      // Client Confirmation Email HTML (Sleek Minimal Off-White Agency Theme)
      const clientEmailHtml = `
        <div style="background-color: #FAF9F6; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Outfit', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 35px; border-bottom: 1px solid #EAE6DF; padding-bottom: 25px;">
            <h2 style="font-weight: 800; letter-spacing: 0.2em; font-size: 20px; color: #171717; margin: 0 0 5px 0; text-transform: uppercase;">O M M I  M E D I A</h2>
            <p style="color: #8C8A82; margin: 0; font-size: 10px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase;">Creative Partners • Content Systems</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 18px; font-weight: 700; color: #171717; margin: 0 0 10px 0; tracking: -0.01em;">Let's build your content engine, ${name.split(' ')[0]}.</h3>
            <p style="color: #615F59; font-size: 14px; margin: 0; font-weight: 400; line-height: 1.7;">
              Your video discovery call has been successfully secured in our calendar. Below is your confirmed schedule ticket and video room link.
            </p>
          </div>

          <!-- TICKET INFO -->
          <div style="background: #FFFFFF; border-radius: 16px; border: 1px solid #EAE6DF; padding: 25px 30px; margin-bottom: 35px; box-shadow: 0 4px 20px rgba(0,0,0,0.015);">
            <h4 style="font-size: 11px; font-weight: 700; color: #8C8A82; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 15px 0;">Discovery Details</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #8C8A82; font-size: 13px; font-weight: 500; width: 120px; border-bottom: 1px solid #FAF9F6;">Meeting Type</td>
                <td style="padding: 8px 0; color: #171717; font-weight: 700; font-size: 13px; border-bottom: 1px solid #FAF9F6;">${service}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #8C8A82; font-size: 13px; font-weight: 500; border-bottom: 1px solid #FAF9F6;">Date</td>
                <td style="padding: 8px 0; color: #171717; font-weight: 700; font-size: 13px; border-bottom: 1px solid #FAF9F6;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #8C8A82; font-size: 13px; font-weight: 500; border-bottom: 1px solid #FAF9F6;">Time</td>
                <td style="padding: 8px 0; color: #171717; font-weight: 700; font-size: 13px; border-bottom: 1px solid #FAF9F6;">${formattedTime} (IST)</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #8C8A82; font-size: 13px; font-weight: 500;">Video Room</td>
                <td style="padding: 8px 0; font-size: 13px;"><a href="${googleMeetUrl}" style="color: #171717; font-weight: 700; text-decoration: underline;">Google Meet Room</a></td>
              </tr>
            </table>
          </div>

          <!-- BUTTON CTA -->
          <div style="text-align: center; margin-bottom: 40px;">
            <a href="${googleMeetUrl}" style="display: inline-block; background-color: #171717; color: #FAF9F6; font-weight: 600; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-size: 13px; letter-spacing: 0.05em; box-shadow: 0 10px 25px rgba(0,0,0,0.06); text-transform: uppercase;">Join Google Meet Call</a>
          </div>

          <!-- HOW TO PREPARE BLOCK -->
          <div style="background: rgba(23,23,23,0.02); border: 1px dashed #EAE6DF; border-radius: 16px; padding: 25px 30px; margin-bottom: 35px;">
            <h4 style="font-size: 11px; font-weight: 700; color: #8C8A82; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 12px 0;">How to prepare for the call</h4>
            <ul style="margin: 0; padding: 0; list-style-type: none; font-size: 13px; color: #615F59; line-height: 1.6;">
              <li style="margin-bottom: 10px; padding-left: 20px; position: relative;">
                <span style="position: absolute; left: 0; top: 0; font-weight: bold; color: #171717;">1.</span>
                <strong>Review current metrics:</strong> Think about your primary channels (YouTube/TikTok/Instagram) and current average viewer/leads statistics.
              </li>
              <li style="margin-bottom: 10px; padding-left: 20px; position: relative;">
                <span style="position: absolute; left: 0; top: 0; font-weight: bold; color: #171717;">2.</span>
                <strong>Formulate targets:</strong> Clarify what subscriber growth, view counts, or client acquisition numbers you want to hit in the next 90 days.
              </li>
              <li style="margin: 0; padding-left: 20px; position: relative;">
                <span style="position: absolute; left: 0; top: 0; font-weight: bold; color: #171717;">3.</span>
                <strong>Test video setup:</strong> Join the Google Meet URL 2 minutes early to verify that your camera and microphone are running smoothly.
              </li>
            </ul>
          </div>

          <div style="border-top: 1px solid #EAE6DF; padding-top: 25px; font-size: 11px; color: #8C8A82; text-align: center; line-height: 1.7;">
            <p style="margin: 0; font-weight: 500;">Need to reschedule or adjust? Reply directly to this email or write to <a href="mailto:ommimedia.in@gmail.com" style="color: #171717; text-decoration: underline;">ommimedia.in@gmail.com</a>.</p>
            <p style="margin: 8px 0 0 0; font-weight: 400;">&copy; 2026 Ommi Media. Built for industry authority.</p>
          </div>
        </div>
      `;

      // Admin Notification Email HTML
      const adminEmailHtml = `
        <div style="background-color: #FAF9F6; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #EAE6DF;">
          <div style="border-bottom: 1px solid #EAE6DF; padding-bottom: 20px; margin-bottom: 25px;">
            <h2 style="font-weight: 800; font-size: 18px; color: #171717; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 0.05em;">New Strategy Call Booked</h2>
            <p style="color: #8C8A82; margin: 0; font-size: 12px; font-weight: 500;">A new lead has submitted a scheduling form.</p>
          </div>
          
          <div style="background: #FFFFFF; border-radius: 12px; border: 1px solid #EAE6DF; padding: 25px; margin-bottom: 30px;">
            <h3 style="font-size: 12px; font-weight: 700; color: #8C8A82; letter-spacing: 0.05em; text-transform: uppercase; margin: 0 0 12px 0;">Lead Profile</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 6px 0; color: #8C8A82; font-size: 13px; width: 120px; border-bottom: 1px solid #FAF9F6;">Name:</td>
                <td style="padding: 6px 0; color: #171717; font-weight: 700; font-size: 13px; border-bottom: 1px solid #FAF9F6;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #8C8A82; font-size: 13px; border-bottom: 1px solid #FAF9F6;">Email:</td>
                <td style="padding: 6px 0; font-size: 13px; border-bottom: 1px solid #FAF9F6;"><a href="mailto:${email}" style="color: #171717; font-weight: 700; text-decoration: underline;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #8C8A82; font-size: 13px; border-bottom: 1px solid #FAF9F6;">Service:</td>
                <td style="padding: 6px 0; color: #171717; font-weight: 700; font-size: 13px; border-bottom: 1px solid #FAF9F6;">${service}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #8C8A82; font-size: 13px; border-bottom: 1px solid #FAF9F6;">DateTime:</td>
                <td style="padding: 6px 0; color: #171717; font-weight: 700; font-size: 13px; border-bottom: 1px solid #FAF9F6;">${formattedDate} at ${formattedTime}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #8C8A82; font-size: 13px;">Google Meet:</td>
                <td style="padding: 6px 0; font-size: 13px;"><a href="${googleMeetUrl}" style="color: #171717; font-weight: 700; text-decoration: underline;">${googleMeetUrl}</a></td>
              </tr>
            </table>

            <h3 style="font-size: 12px; font-weight: 700; color: #8C8A82; letter-spacing: 0.05em; text-transform: uppercase; margin: 20px 0 8px 0; border-top: 1px solid #EAE6DF; padding-top: 15px;">Project Details / Message:</h3>
            <p style="background: #FAF9F6; padding: 12px; border-radius: 8px; border: 1px solid #EAE6DF; font-size: 13px; color: #615F59; margin: 0; line-height: 1.6;">${details || "No additional details provided."}</p>
          </div>

          <div style="border-top: 1px solid #EAE6DF; padding-top: 20px; font-size: 11px; color: #8C8A82; text-align: center;">
            <p style="margin: 0;">Ommi Media Leads Engine • Automated Service</p>
          </div>
        </div>
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
