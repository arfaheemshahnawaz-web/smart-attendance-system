export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { AttendanceSession } from "@/models/AttendanceSession";
import { Attendance } from "@/models/Attendance";
import { User } from "@/models/User";
import { Division } from "@/models/Division";
import { Subject } from "@/models/Subject";

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    const decoded: any = jwt.verify(token!, process.env.JWT_SECRET!);

    await connectDB();

    const student = await User.findById(decoded.userId);

    const division = await Division.findById(student.divisionId);
    if (!division) return NextResponse.json([]);

    const subjects = await Subject.find({
      batchId: division.batchId,
      semester: division.semester,
      isActive: true,
    });

    const subjectIds = subjects.map((s) => s._id);

    /* ---------- SKIP CANCELLED SESSIONS ---------- */
    const sessions = await AttendanceSession.find({
      divisionId: student.divisionId,
      subjectId: { $in: subjectIds },
      endedAt: { $exists: false }, // ← skip cancelled/replaced sessions
    })
      .populate("subjectId")
      .sort({ date: 1 });

    const attendance = await Attendance.find({
      studentId: student._id,
    });

    const map: any = {};

    for (const s of sessions) {
      if (!map[s.date]) {
        map[s.date] = { date: s.date, day: s.day, slots: {} };
      }

      const present = attendance.find(
        (a) =>
          a.sessionId.toString() === s._id.toString() &&
          a.status === "present"
      );

      map[s.date].slots[s.hourSlot] = {
        subject: s.subjectId?.name || "Unknown",
        status: present ? "present" : "absent",
      };
    }

    return NextResponse.json(Object.values(map));

  } catch (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }
}