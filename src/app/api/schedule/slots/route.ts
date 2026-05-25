import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date"); // e.g. "2026-05-25"

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json({ error: "Invalid date format. Expected YYYY-MM-DD" }, { status: 400 });
    }

    const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";
    const offset = process.env.GOOGLE_CALENDAR_OFFSET || "+05:30";

    // If Google credentials are not set, return a 500 error in production
    if (!serviceEmail || !rawPrivateKey) {
      return NextResponse.json({ error: "Google Calendar service credentials are not configured in backend environment." }, { status: 500 });
    }

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
        console.error("Failed to decode base64 Google Private Key:", err);
      }
    }

    const auth = new google.auth.JWT({
      email: serviceEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    // Fetch busy blocks for the selected date range
    // Range covers standard timezone offset hours cleanly
    const timeMin = new Date(`${dateStr}T00:00:00${offset}`).toISOString();
    const timeMax = new Date(`${dateStr}T23:59:59${offset}`).toISOString();

    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];
    
    // Parse busy event intervals
    const busyRanges = events
      .filter((event) => event.start?.dateTime && event.end?.dateTime)
      .map((event) => ({
        start: new Date(event.start!.dateTime!).getTime(),
        end: new Date(event.end!.dateTime!).getTime(),
      }));

    const standardSlots = [
      "16:30", "17:00", "17:30", "18:00", "18:30",
      "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
    ];

    const now = Date.now();

    const availableSlots = standardSlots.filter((timeStr) => {
      const slotStart = new Date(`${dateStr}T${timeStr}:00${offset}`).getTime();
      const slotEnd = slotStart + 30 * 60 * 1000; // 30-minute duration

      // Don't show slots in the past
      if (slotStart <= now) {
        return false;
      }

      // Check if slot overlaps with any busy event
      const isOverlapping = busyRanges.some((range) => {
        return slotStart < range.end && slotEnd > range.start;
      });

      return !isOverlapping;
    });

    return NextResponse.json({ slots: availableSlots });
  } catch (error: any) {
    console.error("Error in GET /api/schedule/slots:", error);
    return NextResponse.json({ error: "Failed to fetch slots", details: error.message }, { status: 500 });
  }
}
