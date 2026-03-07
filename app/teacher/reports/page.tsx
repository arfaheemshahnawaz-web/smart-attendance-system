"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
PieChart,
Pie,
Cell,
Tooltip,
ResponsiveContainer,
BarChart,
Bar,
XAxis,
YAxis
} from "recharts";

type Report = {
  studentName: string;
  studentEmail: string;
  status: string;
};

export default function AttendanceReportsPage() {

  const [reports,setReports] = useState<Report[]>([]);
  const [roleView,setRoleView] = useState<
    "class-teacher" | "subject-teacher"
  >("subject-teacher");

  const [latestPresent,setLatestPresent] = useState(0);
  const [latestAbsent,setLatestAbsent] = useState(0);

  const [stats,setStats] = useState({
    totalSessions:0,
    totalAttendanceRecords:0,
  });

  const [loading,setLoading] = useState(true);

  useEffect(()=>{

    const token = localStorage.getItem("token");

    fetch("/api/teacher/report",{
      headers:{
        Authorization:`Bearer ${token}`
      }
    })

    .then(async(res)=>{

      if(!res.ok){
        throw new Error("Failed to fetch report");
      }

      const text = await res.text();
      return text ? JSON.parse(text) : {};

    })

    .then((data)=>{

      setReports(data?.reports || []);

      setRoleView(data?.role || "subject-teacher");

      setStats({
        totalSessions:data?.totalSessions || 0,
        totalAttendanceRecords:data?.totalAttendanceRecords || 0
      });

      setLatestPresent(data.latestPresent || 0);
      setLatestAbsent(data.latestAbsent || 0);

      setLoading(false);

    })

    .catch((err)=>{
      console.error("REPORT ERROR",err);
      setLoading(false);
    });

  },[]);



  const pieData = [
    { name:"Present", value:latestPresent },
    { name:"Absent", value:latestAbsent }
  ];

  const barData = reports.map(r=>({
    name:r.studentName,
    attendance:parseInt(r.status)
  }));



  return(

<div className="min-h-screen bg-[#0f172a] text-white p-10 space-y-10">


{/* HEADER */}

<div>

<h1 className="text-3xl font-bold">
Attendance Reports
</h1>

<p className="text-gray-400 mt-1">

{roleView==="class-teacher"
? "Class Teacher View – Full batch attendance overview"
: "Subject Teacher View – Your subject attendance only"}

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

</div>



{/* CHARTS */}

<div className="grid md:grid-cols-2 gap-6">


{/* PIE CHART */}

<div className="bg-white/5 border border-white/10 rounded-xl p-6">

<h2 className="text-lg font-semibold mb-6">
Latest Class Attendance
</h2>

<ResponsiveContainer width="100%" height={300}>

<PieChart>

<Pie
data={pieData}
dataKey="value"
nameKey="name"
outerRadius={100}
label
>

<Cell fill="#10b981"/>
<Cell fill="#ef4444"/>

</Pie>

<Tooltip/>

</PieChart>

</ResponsiveContainer>

</div>



{/* BAR CHART */}

<div className="bg-white/5 border border-white/10 rounded-xl p-6">

<h2 className="text-lg font-semibold mb-6">
Student Attendance %
</h2>

<ResponsiveContainer width="100%" height={300}>

<BarChart data={barData}>

<XAxis dataKey="name"/>
<YAxis domain={[0,100]}/>
<Tooltip/>

<Bar dataKey="attendance" fill="#10b981"/>

</BarChart>

</ResponsiveContainer>

</div>

</div>



{/* TABLE */}

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-lg"
>

<h2 className="text-lg font-semibold mb-6">
Student Attendance
</h2>



{loading && (
<p className="text-gray-400">Loading reports...</p>
)}



{!loading && (

<div className="overflow-x-auto">

<table className="w-full">

<thead>

<tr className="text-left text-gray-400 border-b border-white/10">

<th className="py-3">Student</th>
<th>Email</th>
<th>Status</th>

</tr>

</thead>

<tbody>

{reports.map((r,i)=>{

const percent = parseInt(r.status);

return(

<tr
key={i}
className="border-b border-white/5 hover:bg-white/5 transition"
>

<td className="py-3 font-medium">
{r.studentName}
</td>

<td className="text-gray-400">
{r.studentEmail}
</td>

<td>

<span className={`px-3 py-1 rounded-full text-xs font-semibold
${percent >= 75
? "bg-emerald-500/20 text-emerald-400"
: "bg-red-500/20 text-red-400"
}`}>

{r.status}

</span>

</td>

</tr>

);

})}

</tbody>

</table>



{reports.length===0 && (

<p className="text-gray-400 mt-6">
No attendance data available
</p>

)}

</div>

)}

</motion.div>

</div>

  );

}



function StatCard({label,value}:{label:string,value:any}){

return(

<motion.div
whileHover={{scale:1.04}}
className="bg-white/5 border border-white/10 p-6 rounded-xl backdrop-blur-lg"
>

<p className="text-gray-400 text-sm">
{label}
</p>

<h2 className="text-2xl font-bold mt-2">
{value}
</h2>

</motion.div>

);

}