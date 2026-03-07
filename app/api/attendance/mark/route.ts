export const runtime = "nodejs";

import { connectDB } from "@/lib/db";
import { AttendanceSession } from "@/models/AttendanceSession";
import { Attendance } from "@/models/Attendance";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { FaceProfile } from "@/models/FaceProfile";

// Classroom configuration (temporary hardcoded)
const CLASSROOM_LAT = 12.9716;
const CLASSROOM_LNG = 77.5946;
const ALLOWED_RADIUS_METERS = 50;
const ALLOWED_WIFI = "COLLEGE_WIFI";

// Distance calculator (Haversine)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: Request) {
  try {
    /* =========================
       🔐 AUTH
       ========================= */
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as any;

    if (decoded.role !== "student") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    /* =========================
       🧠 FACE CHECK
       ========================= */
    const faceProfile = await FaceProfile.findOne({
      userId: decoded.userId,
      isVerified: true,
    });

    if (!faceProfile) {
      return NextResponse.json(
        { error: "Face not registered" },
        { status: 403 }
      );
    }

    /* =========================
       📥 BODY
       ========================= */
    const {
      sessionId,
      qrToken,
      latitude,
      longitude,
      wifiName,
    } = await req.json();

    if (!sessionId || !qrToken || !latitude || !longitude || !wifiName) {
      return NextResponse.json(
        { error: "Missing required data" },
        { status: 400 }
      );
    }

    await connectDB();

    /* =========================
       🟢 SESSION CHECK
       ========================= */
    const session = await AttendanceSession.findById(sessionId);

    if (!session || !session.isActive) {
      return NextResponse.json(
        { error: "Invalid or inactive session" },
        { status: 400 }
      );
    }

    /* =========================
       ⏰ AUTO END SESSION
       ========================= */
    if (session.endedAt && session.endedAt < new Date()) {
      session.isActive = false;
      await session.save();

      return NextResponse.json(
        { error: "Attendance session has ended" },
        { status: 403 }
      );
    }

   

    /* =========================
       📍 LOCATION VALIDATION (kept for later)
       ========================= */
    // const distance = getDistance(
    //   CLASSROOM_LAT,
    //   CLASSROOM_LNG,
    //   latitude,
    //   longitude
    // );

    // if (distance > ALLOWED_RADIUS_METERS) {
    //   return NextResponse.json(
    //     { error: "Outside classroom area" },
    //     { status: 400 }
    //   );
    // }

    /* =========================
       📶 WIFI VALIDATION
       ========================= */
    if (wifiName !== ALLOWED_WIFI) {
      return NextResponse.json(
        { error: "Not connected to college Wi-Fi" },
        { status: 400 }
      );
    }

    /* =========================
       🚫 DUPLICATE CHECK
       ========================= */
    const existing = await Attendance.findOne({
      studentId: decoded.userId,
      sessionId,
    });

    if (existing) {
      return NextResponse.json(
        { error: "Attendance already marked" },
        { status: 409 }
      );
    }

    /* =========================
       ✅ MARK ATTENDANCE
       ========================= */
    await Attendance.create({
      studentId: decoded.userId,
      sessionId,
      status: "present",
    });

    return NextResponse.json({
      message: "Attendance marked successfully",
    });
  } catch (error) {
    console.error("MARK ATTENDANCE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to mark attendance" },
      { status: 500 }
    );
  }
}