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

try{

const token = req.headers.get("authorization")?.split(" ")[1];

if(!token){
return NextResponse.json({error:"Unauthorized"},{status:401});
}

const decoded:any = jwt.verify(
token,
process.env.JWT_SECRET as string
);

await connectDB();

const {searchParams} = new URL(req.url);

const subjectFilter = searchParams.get("subject");
const monthFilter = searchParams.get("month");



/* CHECK CLASS TEACHER */

const assignment = await ClassTeacherAssignment.findOne({
teacherId:decoded.userId
});

if(!assignment){
return NextResponse.json(
{error:"You are not assigned as class teacher"},
{status:403}
);
}



const division = await Division.findById(assignment.divisionId);

if(!division){
return NextResponse.json(
{error:"Division not found"},
{status:404}
);
}

const semester = division.semester;



/* STUDENTS */

const students = await User.find({
divisionId:division._id,
role:"student",
status:"approved"
});



/* SUBJECTS */

const subjects = await Subject.find({
batchId:division.batchId,
semester,
isActive:true
});

let selectedSubjects = subjects;

if(subjectFilter && subjectFilter !== ""){

selectedSubjects = subjects.filter(
(s:any)=>s.name === subjectFilter
);

}



/* SESSIONS */

const sessions = await AttendanceSession.find({
divisionId:division._id,
subjectId:{$in:selectedSubjects.map((s:any)=>s._id)}
});



/* MONTH FILTER */

let filteredSessions = sessions;

if(monthFilter && monthFilter !== ""){

filteredSessions = sessions.filter((s:any)=>{

if(!s.date) return false;

const month = new Date(s.date).getMonth()+1;

return month === Number(monthFilter);

});

}



const sessionIds = filteredSessions.map((s:any)=>s._id);



/* ATTENDANCE */

const attendance = await Attendance.find({
sessionId:{$in:sessionIds}
});



/* BUILD STUDENT REPORT MAP */

const reportMap:any = {};

students.forEach((student:any)=>{

reportMap[student._id] = {
studentName:student.name,
studentEmail:student.email,
subjects:{}
};

});



/* SUBJECT-WISE ATTENDANCE */

for(const subject of selectedSubjects){

const subjectSessions = filteredSessions.filter(
(s:any)=>s.subjectId.toString() === subject._id.toString()
);

const subjectSessionIds = subjectSessions.map((s:any)=>s._id);

students.forEach((student:any)=>{

const present = attendance.filter((a:any)=>

a.studentId.toString() === student._id.toString() &&
a.status === "present" &&
subjectSessionIds.includes(a.sessionId)

).length;

const percentage = Math.round(
(present / (subjectSessions.length || 1)) * 100
);

reportMap[student._id].subjects[subject.name] = percentage;

});

}



/* FINAL REPORT */

const reports = Object.values(reportMap);



/* LOW ATTENDANCE */

const lowAttendanceStudents:{
studentName:string,
subjects:{subject:string,percentage:number}[]
}[] = [];

reports.forEach((r:any)=>{

const lowSubjects:{subject:string,percentage:number}[] = [];

Object.entries(r.subjects).forEach(([subject,p]:any)=>{

if(p < 75){
lowSubjects.push({
subject,
percentage:p
});
}

});

if(lowSubjects.length > 0){
lowAttendanceStudents.push({
studentName:r.studentName,
subjects:lowSubjects
});
}

});




return NextResponse.json({

reports,

subjects:selectedSubjects.map((s:any)=>s.name),

lowAttendanceStudents,

totalSessions:filteredSessions.length,

totalAttendanceRecords:attendance.length,

students:students.length,


});

}catch(error){

console.error("CLASS REPORT ERROR:",error);

return NextResponse.json(
{error:"Failed to fetch class report"},
{status:500}
);

}

}