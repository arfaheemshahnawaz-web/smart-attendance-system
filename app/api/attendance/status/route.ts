export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Timetable } from "@/models/Timetable";
import { AttendanceSession } from "@/models/AttendanceSession";
import { Subject } from "@/models/Subject";
import { Division } from "@/models/Division";

// 🔧 Force model registration
Subject;
Division;

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
   📡 ATTENDANCE STATUS
   ========================= */
export async function GET(req: Request) {
  try {
    /* ---------- Auth ---------- */
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ active: false }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    if (decoded.role !== "student") {
      return NextResponse.json({ active: false }, { status: 403 });
    }

    await connectDB();

    /* ---------- Student ---------- */
    const student = await User.findById(decoded.userId)
      .select("divisionId status");

    if (!student || student.status !== "approved") {
      return NextResponse.json({ active: false });
    }

    if (!student.divisionId) {
      return NextResponse.json({
        active: false,
        reason: "Student not assigned to division",
      });
    }

    /* ---------- Time ---------- */
    const { day, hourSlot, date } = getCurrentDayAndSlot();

    /* ---------- Timetable ---------- */
    const timetable = await Timetable.findOne({
      divisionId: student.divisionId,
      day,
      hourSlot,
      isActive: true,
    });

    if (!timetable) {
      return NextResponse.json({
        active: false,
        reason: "No class scheduled for this hour",
      });
    }

    /* ---------- Attendance session ---------- */
    const session = await AttendanceSession.findOne({
      divisionId: timetable.divisionId,
      subjectId: timetable.subjectId,
      day,
      hourSlot,
      date,
      isActive: true,
    });

    if (!session) {
      return NextResponse.json({
        active: false,
        reason: "Teacher has not started attendance",
      });
    }

    /* ---------- ACTIVE ---------- */
    return NextResponse.json({
      active: true,
      sessionId: session._id,
      subjectId: timetable.subjectId,
      hourSlot,
    });
  } catch (error) {
    console.error("ATTENDANCE STATUS ERROR:", error);
    return NextResponse.json({ active: false }, { status: 500 });
  }
}