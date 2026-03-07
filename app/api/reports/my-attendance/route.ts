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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET!
    );

    await connectDB();

    /* ===============================
       GET STUDENT
    =============================== */

    const student: any = await User.findById(decoded.userId);

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    /* ===============================
       GET DIVISION
    =============================== */

    const division: any = await Division.findById(
      student.divisionId
    );

    if (!division) {
      return NextResponse.json(
        { error: "Division not found" },
        { status: 404 }
      );
    }

    const semester = division.semester;

    /* ===============================
       GET SUBJECTS OF CURRENT SEM
    =============================== */

    const subjects: any = await Subject.find({
      batchId: division.batchId,
      semester: semester,
      isActive: true,
    });

    const subjectIds = subjects.map((s: any) => s._id);

    /* ===============================
       GET SESSIONS OF CURRENT SEM
    =============================== */

    const today = new Date().toISOString().split("T")[0];

    const sessions: any = await AttendanceSession.find({
      divisionId: division._id,
      subjectId: { $in: subjectIds },
      date: { $lte: today },
    });

    const sessionIds = sessions.map((s: any) => s._id);

    /* ===============================
       GET ATTENDANCE
    =============================== */

    const attendedSessions = await Attendance.countDocuments({
      studentId: student._id,
      sessionId: { $in: sessionIds },
      status: "present",
    });

    const totalSessions = sessions.length;

    const overallPercentage =
      totalSessions > 0
        ? Number(
            ((attendedSessions / totalSessions) * 100).toFixed(2)
          )
        : 0;

    return NextResponse.json({
      totalSessions,
      attendedSessions,
      overallPercentage,
    });

  } catch (error) {

    console.error("STUDENT REPORT ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}