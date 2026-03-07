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
    if (!token) return NextResponse.json([]);

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    await connectDB();

    const student = await User.findById(decoded.userId);
    if (!student) return NextResponse.json([]);

    /* ---------- GET DIVISION ---------- */

    const division = await Division.findById(student.divisionId);
    if (!division) return NextResponse.json([]);

    /* ---------- GET CURRENT SEM SUBJECTS ---------- */

    const subjects = await Subject.find({
      batchId: division.batchId,
      semester: division.semester,
      isActive: true
    });

    const subjectIds = subjects.map(s => s._id);

    /* ---------- GET SESSIONS ---------- */

    const sessions = await AttendanceSession.find({
      divisionId: student.divisionId,
      subjectId: { $in: subjectIds }
    }).populate("subjectId");

    const report: any = {};

    for (const session of sessions) {

      const subject = session.subjectId?.name || "Unknown";

      if (!report[subject]) {
        report[subject] = { total: 0, attended: 0 };
      }

      report[subject].total++;

      const attended = await Attendance.findOne({
        sessionId: session._id,
        studentId: student._id,
        status: "present",
      });

      if (attended) {
        report[subject].attended++;
      }

    }

    const result = Object.keys(report).map((subject) => {

      const total = report[subject].total;
      const attended = report[subject].attended;

      return {
        subject,
        total,
        attended,
        percentage:
          total > 0
            ? Number(((attended / total) * 100).toFixed(2))
            : 0,
      };

    });

    return NextResponse.json(result);

  } catch (error) {

    console.error(error);
    return NextResponse.json([]);

  }
}