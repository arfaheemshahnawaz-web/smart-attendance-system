export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { AttendanceSession } from "@/models/AttendanceSession";
import { Timetable } from "@/models/Timetable";

/* =========================
   🕒 Utility: current slot
   ========================= */
function getCurrentDayAndSlot() {
  const now = new Date();

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const day = days[now.getDay()];
  const hour = now.getHours();

  const start = hour.toString().padStart(2, "0");
  const end = (hour + 1).toString().padStart(2, "0");

  const hourSlot = `${start}:00-${end}:00`;
  const date = now.toISOString().split("T")[0]; // YYYY-MM-DD

  return { day, hourSlot, date };
}

/* =========================
   ▶️ START ATTENDANCE
   ========================= */
export async function POST(req: Request) {
  try {
    /* ---------- Auth ---------- */
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

    if (decoded.role !== "teacher") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    /* ---------- Time ---------- */
    const { day, hourSlot, date } = getCurrentDayAndSlot();

    /* ---------- Validate timetable ---------- */
    const timetable = await Timetable.findOne({
      teacherId: decoded.userId,
      day,
      hourSlot,
      isActive: true,
    });

    if (!timetable) {
      return NextResponse.json(
        { error: "No class scheduled for this hour" },
        { status: 403 }
      );
    }

    /* ---------- Prevent duplicate session ---------- */
    const existingSession = await AttendanceSession.findOne({
      divisionId: timetable.divisionId,
      subjectId: timetable.subjectId,
      day,
      hourSlot,
      date,
      isActive: true,
    });

    if (existingSession) {
      return NextResponse.json({
        message: "Attendance already started",
        sessionId: existingSession._id,
        qrToken: existingSession.currentQrToken,
      });
    }

    /* ---------- Create session ---------- */
    const qrToken = Math.random().toString(36).substring(2);

    const session = await AttendanceSession.create({
      teacherId: decoded.userId,
      divisionId: timetable.divisionId,
      subjectId: timetable.subjectId,

      day,
      hourSlot,
      date,

      isActive: true,
      currentQrToken: qrToken,
      qrExpiresAt: new Date(Date.now() + 10 * 1000), // 10 seconds
    });

    return NextResponse.json({
      message: "Attendance started",
      sessionId: session._id,
      qrToken,
    });
  } catch (error) {
    console.error("START ATTENDANCE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to start attendance" },
      { status: 500 }
    );
  }
}