export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
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

    /* GET SESSIONS */

    const sessions = await AttendanceSession.find({
      teacherId: decoded.userId
    });

    if(!sessions.length){
      return NextResponse.json({
        role:"subject-teacher",
        reports:[],
        totalSessions:0,
        totalAttendanceRecords:0,
        latestPresent:0,
        latestAbsent:0
      });
    }

    const divisionIds = sessions.map((s:any)=>s.divisionId);

    /* GET DIVISIONS */

    const divisions = await Division.find({
      _id: { $in: divisionIds }
    });

    const semesterMap:any = {};

    divisions.forEach((d:any)=>{
      semesterMap[d._id] = d.semester;
    });

    /* FILTER SESSIONS BY SEMESTER */

    const validSessions:any[] = [];

    for(const s of sessions){

      const subject = await Subject.findById(s.subjectId);

      if(subject && subject.semester === semesterMap[s.divisionId]){
        validSessions.push(s);
      }

    }

    const sessionIds = validSessions.map((s:any)=>s._id);

    /* STUDENTS */

    const students = await User.find({
      divisionId: { $in: divisionIds },
      role: "student",
      status: "approved"
    });

    /* ATTENDANCE */

    const attendance = await Attendance.find({
      sessionId: { $in: sessionIds }
    });

    /* STUDENT MAP */

    const studentMap:any = {};

    students.forEach((s:any)=>{
      studentMap[s._id] = {
        studentName:s.name,
        studentEmail:s.email,
        present:0
      };
    });

    attendance.forEach((a:any)=>{
      const id = a.studentId.toString();
      if(studentMap[id] && a.status==="present"){
        studentMap[id].present++;
      }
    });

    const reports = Object.values(studentMap).map((s:any)=>({

      studentName:s.studentName,
      studentEmail:s.studentEmail,

      status:`${Math.round(
        (s.present / (validSessions.length || 1)) * 100
      )}%`

    }));

    return NextResponse.json({

      role:"subject-teacher",

      reports,

      totalSessions:validSessions.length,

      totalAttendanceRecords:attendance.length,

      latestPresent:0,
      latestAbsent:0

    });

  } catch(error){

    console.error("REPORT ERROR:",error);

    return NextResponse.json(
      { error:"Failed to fetch reports" },
      { status:500 }
    );

  }

}