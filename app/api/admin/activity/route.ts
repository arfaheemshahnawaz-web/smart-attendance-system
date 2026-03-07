export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { AttendanceSession } from "@/models/AttendanceSession";

export async function GET(req: Request) {

try{

const token = req.headers.get("authorization")?.split(" ")[1];

if(!token){
return NextResponse.json({error:"Unauthorized"},{status:401});
}

jwt.verify(token,process.env.JWT_SECRET!);

await connectDB();

/* last 7 days */

const today = new Date();
const lastWeek = new Date();
lastWeek.setDate(today.getDate()-6);

const sessions = await AttendanceSession.find({
createdAt:{ $gte:lastWeek }
});

const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const activity:any = {
Sun:0,Mon:0,Tue:0,Wed:0,Thu:0,Fri:0,Sat:0
};

sessions.forEach((s:any)=>{

const day = days[new Date(s.createdAt).getDay()];
activity[day]++;

});

const result = Object.keys(activity).map(day=>({
day,
sessions:activity[day]
}));

return NextResponse.json(result);

}catch(err){

return NextResponse.json(
{error:"Failed to load activity"},
{status:500}
);

}

}