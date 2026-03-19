export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";

import { Division } from "@/models/Division";
import { Subject } from "@/models/Subject";
import { AttendanceSession } from "@/models/AttendanceSession";
import { Attendance } from "@/models/Attendance";
import { User } from "@/models/User";

export async function GET(req: Request) {

try {

const token = req.headers.get("authorization")?.split(" ")[1];

if(!token){
return NextResponse.json({error:"Unauthorized"}, {status:401});
}

const decoded:any = jwt.verify(token, process.env.JWT_SECRET!);

if(decoded.role !== "admin"){
return NextResponse.json({error:"Access denied"}, {status:403});
}

await connectDB();

const { searchParams } = new URL(req.url);

const divisionId = searchParams.get("divisionId");
const subjectFilter = searchParams.get("subject");
const monthFilter = searchParams.get("month");

if(!divisionId){
return NextResponse.json({error:"divisionId required"}, {status:400});
}


/* ===============================
   GET DIVISION
================================ */

const division:any = await Division.findById(divisionId);

if(!division){
return NextResponse.json({error:"Division not found"}, {status:404});
}

const semester = division.semester;


/* ===============================
   GET SUBJECTS
================================ */

let subjects:any = await Subject.find({
batchId: division.batchId,
semester,
isActive:true
});

if(subjectFilter){
subjects = subjects.filter((s:any)=>s.name === subjectFilter);
}


/* ===============================
   GET STUDENTS
================================ */

const students:any = await User.find({
divisionId,
role:"student",
status:"approved"
});


/* ===============================
   GET SESSIONS
================================ */

let sessions:any = await AttendanceSession.find({
divisionId
});


/* MONTH FILTER */

if(monthFilter){

sessions = sessions.filter((s:any)=>{

if(!s.date) return false;

const month = new Date(s.date).getMonth()+1;

return month === Number(monthFilter);

});

}


/* SUBJECT FILTER ON SESSIONS */

if(subjectFilter){

const subjectDoc = subjects[0];

if(subjectDoc){
sessions = sessions.filter(
(s:any)=>s.subjectId?.toString() === subjectDoc._id.toString()
);
}

}


const sessionIds = sessions.map((s:any)=>s._id);


/* ===============================
   GET ATTENDANCE
================================ */

const attendance:any = await Attendance.find({
sessionId:{ $in: sessionIds }
});


/* ===============================
   BUILD REPORT
================================ */

const report:any[] = [];

for(const student of students){

const studentData:any = {
studentName:student.name,
subjects:{},
overall:0
};

let totalPresent = 0;
let totalClasses = 0;

for(const subject of subjects){

const subjectSessions = sessions.filter(
(s:any)=>s.subjectId?.toString() === subject._id.toString()
);

const subjectSessionIds = subjectSessions.map((s:any)=>s._id);

const subjectAttendance = attendance.filter(
(a:any)=>
a.studentId.toString() === student._id.toString() &&
subjectSessionIds.some((id: any) => id.toString() === a.sessionId.toString())&&
a.status==="present"
);

const present = subjectAttendance.length;
const total = subjectSessions.length;

const percent = total>0
? Math.round((present/total)*100)
:0;

studentData.subjects[subject.name] = percent;

totalPresent += present;
totalClasses += total;

}

studentData.overall = totalClasses>0
? Math.round((totalPresent/totalClasses)*100)
:0;

report.push(studentData);

}


return NextResponse.json({
division:division.name,
semester,
subjects:subjects.map((s:any)=>s.name),
report
});

}catch(error){

console.error("ADMIN REPORT ERROR:",error);

return NextResponse.json(
{error:"Failed to fetch reports"},
{status:500}
);

}

}