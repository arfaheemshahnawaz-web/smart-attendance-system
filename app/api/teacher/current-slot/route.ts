export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { Timetable } from "@/models/Timetable";
import "@/models/Division";
import "@/models/Subject";


// 🕒 Utility: current day & hour slot
function getCurrentDayAndSlot() {
  const now = new Date(
  new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
);


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

  return { day, hourSlot };
}

export async function GET(req: Request) {
  try {
    // 🔐 Auth
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    if (decoded.role !== "teacher") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    const { day, hourSlot } = getCurrentDayAndSlot();
    

    // 🔎 Find current timetable slot
    const timetable = await Timetable.findOne({
      teacherId: decoded.userId,
      day,
      hourSlot,
      isActive: true,
    })
      .populate("divisionId", "name semester")
      .populate("subjectId", "name");

    // ❌ No class now
    if (!timetable) {
      return NextResponse.json({ active: false });
    }

    // ✅ Active class
    return NextResponse.json({
      active: true,
      subject: timetable.subjectId.name,
      division: timetable.divisionId.name,
      day: timetable.day,
      hourSlot: timetable.hourSlot,
    });
  } catch (error) {
    console.error("CURRENT SLOT ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load current slot" },
      { status: 500 }
    );
  }
}
