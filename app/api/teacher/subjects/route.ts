import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { SubjectTeacher } from "@/models/SubjectTeacher";
import { Subject } from "@/models/Subject";

export async function GET(req: Request){

const token = req.headers.get("authorization")?.split(" ")[1];

const decoded:any = jwt.verify(token!, process.env.JWT_SECRET!);

await connectDB();

const { searchParams } = new URL(req.url);
const batchId = searchParams.get("batchId");

const mappings = await SubjectTeacher.find({
teacherId: decoded.userId,
batchId
});

const subjectIds = mappings.map((m:any)=>m.subjectId);

const subjects = await Subject.find({
_id:{$in:subjectIds},
isActive:true
});

return NextResponse.json({
subjects: subjects.map((s:any)=>s.name)
});

}