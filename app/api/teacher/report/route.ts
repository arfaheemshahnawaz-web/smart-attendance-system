export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { Attendance } from "@/models/Attendance";
import { AttendanceSession } from "@/models/AttendanceSession";
import { User } from "@/models/User";
import { Subject } from "@/models/Subject";
import { SubjectTeacher } from "@/models/SubjectTeacher"; // ✅ YOUR MODEL

export async function GET(req: Request) {

try {

const token = req.headers.get("authorization")?.split(" ")[1];

if (!token) {
return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const decoded:any = jwt.verify(
token,
process.env.JWT_SECRET as string
);

await connectDB();

const { searchParams } = new URL(req.url);

const subjectFilter = searchParams.get("subject");
const monthFilter = searchParams.get("month");
const batchId = searchParams.get("batchId");
const divisionId = searchParams.get("divisionId");


/* 🚨 REQUIRE BATCH + DIVISION */

if(!batchId){
return NextResponse.json({
role:"subject-teacher",
reports:[],
subjects:[],
totalSessions:0,
totalAttendanceRecords:0
});
}


/* ✅ GET SUBJECTS FROM MAPPING (NOT SESSIONS) */

const subjectTeacher = await SubjectTeacher.find({
teacherId: decoded.userId,
batchId: batchId
});

const subjectIds = subjectTeacher.map((s:any)=>s.subjectId.toString());

const allSubjects = await Subject.find({
_id:{ $in:subjectIds },
isActive:true
});




/* 🎯 SUBJECT FILTER */

let filteredSubjectIds = subjectIds;

if(subjectFilter){

const subjectDoc = allSubjects.find(
(s:any)=>s.name === subjectFilter
);

if(subjectDoc){
filteredSubjectIds = [subjectDoc._id.toString()];
}

}


/* 📚 GET SESSIONS */

const sessionQuery:any = {
  teacherId: decoded.userId,
  batchId: batchId,
  subjectId: { $in: filteredSubjectIds }
};

if(divisionId){
  sessionQuery.divisionId = divisionId;
}

let sessions = await AttendanceSession.find(sessionQuery);



/* 📅 MONTH FILTER */

if(monthFilter){

sessions = sessions.filter((s:any)=>{

if(!s.date) return false;

const month = new Date(s.date).getMonth()+1;

return month === Number(monthFilter);

});

}


/* 👨‍🎓 STUDENTS */

/* 👨‍🎓 STUDENTS (UPDATED — division optional) */

const studentQuery:any = {
role:"student",
status:"approved"
};

if(divisionId){
studentQuery.divisionId = divisionId;
}else{
const divisionIds = [...new Set(
sessions.map((s:any)=>s.divisionId.toString())
)];

studentQuery.divisionId = { $in: divisionIds };
}
const students = await User.find(studentQuery);


/* 📊 ATTENDANCE */

const sessionIds = sessions.map((s:any)=>s._id);

const attendance = await Attendance.find({
sessionId:{ $in:sessionIds }
});


/* 🧠 BUILD REPORT */

const reportMap:any = {};

students.forEach((student:any)=>{

reportMap[student._id] = {
studentName:student.name,
studentEmail:student.email,
subjects:{}
};

});


/* SUBJECT WISE CALCULATION */

for(const subject of allSubjects){

if(!filteredSubjectIds.includes(subject._id.toString())) continue;

const subjectSessions = sessions.filter(
(s:any)=>s.subjectId.toString() === subject._id.toString()
);

const subjectSessionIds = subjectSessions.map((s:any)=>s._id);


students.forEach((student:any)=>{

const present = attendance.filter((a:any)=>

a.studentId.toString() === student._id.toString() &&
a.status === "present" &&
subjectSessionIds.some(id=>id.toString()===a.sessionId.toString())

).length;


const percent = Math.round(
(present / (subjectSessions.length || 1)) * 100
);

reportMap[student._id].subjects[subject.name] = percent;

});

}


/* FINAL */

const reports = Object.values(reportMap);

return NextResponse.json({

role:"subject-teacher",
reports,
subjects: allSubjects.map((s:any)=>s.name),
totalSessions: sessions.length,
totalAttendanceRecords: attendance.length,

});

}catch(error){

console.error("REPORT ERROR:",error);

return NextResponse.json(
{error:"Failed to fetch reports"},
{status:500}
);

}

}