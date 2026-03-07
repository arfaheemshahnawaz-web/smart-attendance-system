"use client";

import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import {
PieChart,
Pie,
Cell,
Tooltip,
ResponsiveContainer
} from "recharts";

export default function ClassReportPage(){

const router = useRouter();

const [reports,setReports] = useState<any[]>([]);
const [stats,setStats] = useState<any>({
totalSessions:0,
totalAttendanceRecords:0
});

const [presentCount,setPresentCount] = useState(0);
const [absentCount,setAbsentCount] = useState(0);

const [loading,setLoading] = useState(true);

const token =
typeof window !== "undefined"
? localStorage.getItem("token")
: null;



useEffect(()=>{

fetch("/api/teacher/class-report",{
headers:{
Authorization:`Bearer ${token}`
}
})
.then(async(res)=>{

if(!res.ok){
throw new Error("Failed to load class report");
}

const text = await res.text();
return text ? JSON.parse(text) : {};

})
.then((data)=>{

setReports(data?.reports || []);

setStats({
totalSessions:data?.totalSessions || 0,
totalAttendanceRecords:data?.totalAttendanceRecords || 0
});

setPresentCount(data?.presentCount || 0);
setAbsentCount(data?.absentCount || 0);

setLoading(false);

})
.catch((err)=>{
console.error("CLASS REPORT ERROR",err);
setLoading(false);
});

},[]);



const pieData = [
{ name:"Present",value:presentCount },
{ name:"Absent",value:absentCount }
];



return(

<div className="min-h-screen bg-[#0f172a] text-white p-10 space-y-10">


{/* HEADER */}

<div>

<h1 className="text-3xl font-bold">
Class Attendance Report
</h1>

<p className="text-gray-400 mt-1">
All subjects attendance for your division
</p>

</div>



{/* STATS */}

<div className="grid md:grid-cols-3 gap-6">

<StatCard
label="Total Sessions"
value={stats.totalSessions}
/>

<StatCard
label="Attendance Records"
value={stats.totalAttendanceRecords}
/>

<StatCard
label="Students"
value={reports.length}
/>

</div>



{/* PIE CHART */}

<div className="bg-white/5 border border-white/10 rounded-xl p-6">

<h2 className="text-lg font-semibold mb-6">
Attendance Distribution
</h2>

<ResponsiveContainer width="100%" height={300}>

<PieChart>

<Pie
data={pieData}
dataKey="value"
nameKey="name"
outerRadius={110}
label
>

<Cell fill="#10b981"/>
<Cell fill="#ef4444"/>

</Pie>

<Tooltip/>

</PieChart>

</ResponsiveContainer>

</div>



{/* TABLE */}

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
className="bg-white/5 border border-white/10 rounded-xl p-6"
>

<h2 className="text-lg font-semibold mb-6">
Division Students
</h2>


{loading && (
<p className="text-gray-400">
Loading report...
</p>
)}



{!loading && (

<div className="overflow-x-auto">

<table className="w-full">

<thead>

<tr className="text-left text-gray-400 border-b border-white/10">

<th className="py-3">Student</th>
<th>Email</th>
<th>Attendance %</th>

</tr>

</thead>


<tbody>

{reports.map((r,i)=>{

const low = r.attendancePercentage < 75;

return(

<tr
key={i}
className="border-b border-white/5 hover:bg-white/5"
>

<td className="py-3 font-medium">
{r.studentName}
</td>

<td className="text-gray-400">
{r.studentEmail}
</td>

<td>

<span className={`px-3 py-1 rounded-full text-xs font-semibold
${low
? "bg-red-500/20 text-red-400"
: "bg-emerald-500/20 text-emerald-400"
}`}>

{r.attendancePercentage}%

</span>

</td>

</tr>

)

})}

</tbody>

</table>

</div>

)}

</motion.div>

</div>

)

}



function StatCard({label,value}:{label:string,value:any}){

return(

<div className="bg-white/5 border border-white/10 p-6 rounded-xl">

<p className="text-gray-400 text-sm">
{label}
</p>

<h2 className="text-2xl font-bold mt-2">
{value}
</h2>

</div>

)

}