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
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    /* -------- GET DIVISION -------- */

    const division = await Division.findById(student.divisionId);
    if (!division) {
      return NextResponse.json({ error: "Division not found" }, { status: 404 });
    }

    /* -------- GET CURRENT SEM SUBJECTS -------- */

    const subjects = await Subject.find({
      batchId: division.batchId,
      semester: division.semester,
      isActive: true
    });

    const subjectIds = subjects.map(s => s._id);

    /* -------- GET SESSIONS -------- */

    const sessions = await AttendanceSession.find({
      divisionId: student.divisionId,
      subjectId: { $in: subjectIds }
    });

    const report: any = {};

    for (const session of sessions) {

      const month = session.date.slice(0, 7); // YYYY-MM

      if (!report[month]) {
        report[month] = { total: 0, attended: 0 };
      }

      report[month].total++;

      const attended = await Attendance.findOne({
        studentId: student._id,
        sessionId: session._id,
        status: "present",
      });

      if (attended) report[month].attended++;
    }

    const result = Object.keys(report).map((month) => {

      const total = report[month].total;
      const attended = report[month].attended;

      return {
        month,
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

    return NextResponse.json({ error: "Server error" }, { status: 500 });

  }
}