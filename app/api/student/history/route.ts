export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { Attendance } from "@/models/Attendance";
import { AttendanceSession } from "@/models/AttendanceSession";
import { User } from "@/models/User";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json([], { status: 401 });
    }

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    await connectDB();

    await import("@/models/Subject");

    // ✅ IMPORTANT FIX
    const student = await User.findById(decoded.userId);

    if (!student) {
      return NextResponse.json([], { status: 404 });
    }

    const records = await Attendance.find({
      studentId: student._id,
    })
      .populate({
        path: "sessionId",
        populate: { path: "subjectId", model:"Subject", select: "name" },
      })
      .sort({ createdAt: -1 });

    const formatted = records.map((record: any) => ({
      id: record._id,
      date: record.sessionId?.date || "",
      day: record.sessionId?.day || "",
      subject:
        record.sessionId?.subjectId?.name || "Unknown",
      hourSlot: record.sessionId?.hourSlot || "",
      status: record.status,
      markedAt: record.markedAt,
    }));

    return NextResponse.json(formatted);

  } catch (error) {
    console.error("History API Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}