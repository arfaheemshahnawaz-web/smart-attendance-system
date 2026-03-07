export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { Timetable } from "@/models/Timetable";

import "@/models/Division";
import "@/models/Subject";
import "@/models/Batch";

/* IST DAY */
function getCurrentDay() {
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

  return days[now.getDay()];
}

/* "09:00-10:00" -> 9 */
function getStartHour(hourSlot: string) {
  return parseInt(hourSlot.split(":")[0]);
}

export async function GET(req: Request) {
  try {
    /* AUTH */
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    if (decoded.role !== "teacher") {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    await connectDB();

    const day = getCurrentDay();

    /* FIND TODAY CLASSES */
    const classes = await Timetable.find({
      teacherId: decoded.userId,
      day,
      isActive: true,
    })
      .populate({
        path: "divisionId",
        select: "name semester batchId",
        populate: {
          path: "batchId",
          select: "name academicYear",
        },
      })
      .populate("subjectId", "name");

    /* SORT BY TIME */
    classes.sort(
      (a: any, b: any) =>
        getStartHour(a.hourSlot) - getStartHour(b.hourSlot)
    );

    /* FORMAT RESPONSE */
    const result = classes.map((c: any) => ({
      subject: c.subjectId.name,
      division: c.divisionId.name,
      semester: c.divisionId.semester,
      batch: `${c.divisionId.batchId.name} ${c.divisionId.batchId.academicYear}`,
      hourSlot: c.hourSlot,
      day: c.day,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("TODAY SCHEDULE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load schedule" },
      { status: 500 }
    );
  }
}