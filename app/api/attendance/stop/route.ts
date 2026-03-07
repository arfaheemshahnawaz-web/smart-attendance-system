export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { AttendanceSession } from "@/models/AttendanceSession";

export async function POST(req: Request) {

try {

const token = req.headers.get("authorization")?.split(" ")[1];

if(!token){
return NextResponse.json({error:"Unauthorized"},{status:401});
}

const decoded:any = jwt.verify(
token,
process.env.JWT_SECRET as string
);

if(decoded.role !== "teacher"){
return NextResponse.json({error:"Access denied"},{status:403});
}

const {sessionId} = await req.json();

await connectDB();

await AttendanceSession.findByIdAndUpdate(
sessionId,
{
isActive:false,
endedAt:new Date()
}
);

return NextResponse.json({
message:"Attendance stopped"
});

}
catch(err){

console.error("STOP ATTENDANCE ERROR:",err);

return NextResponse.json(
{error:"Failed to stop attendance"},
{status:500}
);

}

}