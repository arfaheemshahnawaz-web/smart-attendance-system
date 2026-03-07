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

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    await connectDB();

    const student = await User.findById(decoded.userId);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    /* ---------------- GET DIVISION ---------------- */

    const division = await Division.findById(student.divisionId);

    if (!division) {
      return NextResponse.json({ error: "Division not found" }, { status: 404 });
    }

    const semester = division.semester;

    /* ---------------- GET SUBJECTS OF CURRENT SEM ---------------- */

    const subjects = await Subject.find({
      batchId: division.batchId,
      semester,
      isActive: true
    });

    const subjectIds = subjects.map(s => s._id);

    const today = new Date().toISOString().split("T")[0];

    /* ---------------- GET SESSIONS ---------------- */

    const sessions = await AttendanceSession.find({
      divisionId: student.divisionId,
      subjectId: { $in: subjectIds },
      date: { $lte: today },
    });

    const sessionIds = sessions.map((s) => s._id);

    /* ---------------- ATTENDED SESSIONS ---------------- */

    const attendedSessions = await Attendance.countDocuments({
      studentId: student._id,
      sessionId: { $in: sessionIds },
      status: "present",
    });

    const totalSessions = sessions.length;

    const overallPercentage =
      totalSessions > 0
        ? Number(((attendedSessions / totalSessions) * 100).toFixed(2))
        : 0;

    /* ---------- SMART REPORT CALCULATIONS ---------- */

    const REQUIRED = 75;

    let requiredClasses = 0;

    let futureAttended = attendedSessions;
    let futureTotal = totalSessions;

    while (futureTotal > 0 && (futureAttended / futureTotal) * 100 < REQUIRED) {
      requiredClasses++;
      futureAttended++;
      futureTotal++;
    }

    let safeMiss = 0;

    if (overallPercentage >= REQUIRED) {
      const maxAllowed = (attendedSessions * 100) / REQUIRED;
      safeMiss = Math.floor(maxAllowed - totalSessions);
    }

    return NextResponse.json({
      totalSessions,
      attendedSessions,
      overallPercentage,
      requiredClasses,
      safeMiss,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );

  }
}