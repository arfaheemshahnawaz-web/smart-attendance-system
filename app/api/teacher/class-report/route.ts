export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";

import { ClassTeacherAssignment } from "@/models/ClassTeacherAssignment";
import { Attendance } from "@/models/Attendance";
import { AttendanceSession } from "@/models/AttendanceSession";
import { User } from "@/models/User";
import { Division } from "@/models/Division";
import { Subject } from "@/models/Subject";

export async function GET(req: Request) {

  try {

    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    );

    await connectDB();

    /* CHECK CLASS TEACHER */

    const assignment = await ClassTeacherAssignment.findOne({
      teacherId: decoded.userId
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "You are not assigned as class teacher" },
        { status: 403 }
      );
    }

    const division = await Division.findById(assignment.divisionId);

    if (!division) {
      return NextResponse.json(
        { error: "Division not found" },
        { status: 404 }
      );
    }

    const semester = division.semester;

    /* STUDENTS */

    const students = await User.find({
      divisionId: division._id,
      role: "student",
      status: "approved"
    });

    const totalStudents = students.length;

    /* SUBJECTS OF CURRENT SEMESTER */

    const subjects = await Subject.find({
      batchId: division.batchId,
      semester,
      isActive: true
    });

    const subjectIds = subjects.map(s => s._id);

    /* SESSIONS OF CURRENT SEMESTER */

    const sessions = await AttendanceSession.find({
      divisionId: division._id,
      subjectId: { $in: subjectIds }
    });

    const sessionIds = sessions.map((s:any)=>s._id);

    /* ATTENDANCE */

    const attendance = await Attendance.find({
      sessionId: { $in: sessionIds }
    });

    /* BUILD STUDENT MAP */

    const studentMap:any = {};

    students.forEach((s:any)=>{
      studentMap[s._id] = {
        studentName: s.name,
        studentEmail: s.email,
        present: 0
      };
    });

    attendance.forEach((r:any)=>{
      const id = r.studentId.toString();
      if(studentMap[id] && r.status === "present"){
        studentMap[id].present++;
      }
    });

    /* TOTAL PRESENT / ABSENT */

    const totalPossibleAttendance =
      sessions.length * totalStudents;

    const presentCount = attendance.filter(
      (r:any)=>r.status === "present"
    ).length;

    const absentCount =
      totalPossibleAttendance - presentCount;

    /* STUDENT REPORT */

    const reports = Object.values(studentMap).map((s:any)=>({

      studentName: s.studentName,
      studentEmail: s.studentEmail,

      attendancePercentage:
        Math.round(
          (s.present / (sessions.length || 1)) * 100
        )

    }));

    return NextResponse.json({

      role: "class-teacher",

      reports,

      totalSessions: sessions.length,

      totalAttendanceRecords: attendance.length,

      students: totalStudents,

      presentCount,

      absentCount

    });

  } catch (error) {

    console.error("CLASS REPORT ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch class report" },
      { status: 500 }
    );

  }

}