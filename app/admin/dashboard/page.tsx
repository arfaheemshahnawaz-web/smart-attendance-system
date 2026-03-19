"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
Users,
UserCheck,
GraduationCap,
CalendarDays,
Settings,
BookOpen
} from "lucide-react";

import {
ResponsiveContainer,
LineChart,
Line,
XAxis,
YAxis,
Label,
Tooltip
} from "recharts";

export default function AdminDashboard(){

const router = useRouter();
const [stats,setStats] = useState<any>(null);

const token =
typeof window !== "undefined"
? localStorage.getItem("token")
: null;

useEffect(()=>{

if(!token){
router.push("/login");
return;
}
fetch("/api/admin/activity",{
headers:{Authorization:`Bearer ${token}`}
})
.then(res=>res.json())
.then(setActivityData);

fetch("/api/admin/stats",{
headers:{ Authorization:`Bearer ${token}` }
})
.then(res=>res.json())
.then(setStats);

},[]);


/* Example system activity */
const [activityData,setActivityData] = useState([]);

return(

<div className="flex min-h-screen bg-[#0f172a] text-white">

{/* SIDEBAR */}

<div className="w-64 bg-[#020617] border-r border-white/10 p-6 flex flex-col">

<h2 className="text-xl font-bold mb-8">
Admin
</h2>

<nav className="space-y-2">

<SidebarItem label="Dashboard" onClick={()=>router.push("/admin/dashboard")} />
<SidebarItem label="User Approvals" onClick={()=>router.push("/admin/users")} />
<SidebarItem label="Manage Batches" onClick={()=>router.push("/admin/batches")} />
<SidebarItem label="Manage Divisions" onClick={()=>router.push("/admin/divisions")} />
<SidebarItem label="Class Teachers" onClick={()=>router.push("/admin/class-teachers")} />
<SidebarItem label="Subjects" onClick={()=>router.push("/admin/subjects")} />
<SidebarItem label="Subject Teachers" onClick={()=>router.push("/admin/subject-teachers")} />
<SidebarItem label="Timetable" onClick={()=>router.push("/admin/timetable")} />
<SidebarItem label="Student Mapping" onClick={()=>router.push("/admin/student-division")} />
<SidebarItem label="Reports" onClick={()=>router.push("/admin/reports")} />

</nav>

<button
onClick={()=>{
localStorage.clear();
router.push("/login");
}}
className="mt-auto text-red-400 hover:text-red-500"
>
Logout
</button>

</div>


{/* MAIN CONTENT */}

<div className="flex-1 p-10 space-y-10">

{/* HEADER */}

<div>

<h1 className="text-3xl font-bold">
Admin Dashboard
</h1>

<p className="text-gray-400">
College attendance system control panel
</p>

</div>


{/* STAT CARDS */}

<div className="grid md:grid-cols-4 gap-6">

<StatCard icon={<Users size={20}/>} label="Total Users" value={stats?.users}/>
<StatCard icon={<UserCheck size={20}/>} label="Pending Approvals" value={stats?.pending}/>
<StatCard icon={<GraduationCap size={20}/>} label="Batches" value={stats?.batches}/>
<StatCard icon={<CalendarDays size={20}/>} label="Active Classes" value={stats?.activeSessions}/>

</div>


{/* CHART + WIDGET */}

<div className="grid md:grid-cols-2 gap-6">

{/* SYSTEM ACTIVITY */}

<motion.div
whileHover={{scale:1.02}}
className="bg-[#1e293b] border border-white/10 rounded-xl p-6"
>

<h2 className="text-lg font-semibold mb-6">
System Activity
</h2>

<ResponsiveContainer width="100%" height={250}>

<LineChart data={activityData}>

<XAxis dataKey="day">
  <Label value="Day of Month" position="insideBottom" offset={-5} />
</XAxis>
<YAxis>
  <Label value="Activity Count" angle={-90} position="insideLeft" />
</YAxis><Tooltip/>

<Line
type="monotone"
dataKey="sessions"
stroke="#22c55e"
strokeWidth={3}
/>

</LineChart>

</ResponsiveContainer>

</motion.div>


{/* PENDING APPROVAL WIDGET */}

<motion.div
whileHover={{scale:1.02}}
className="bg-[#1e293b] border border-white/10 rounded-xl p-6"
>

<h2 className="text-lg font-semibold mb-6">
Pending Approvals
</h2>

<p className="text-4xl font-bold mb-4">
{stats?.pending ?? 0}
</p>

<button
onClick={()=>router.push("/admin/users")}
className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg"
>

Review Users

</button>

</motion.div>

</div>


{/* QUICK ACTION CARDS */}

<div className="grid md:grid-cols-3 gap-6">

<ActionCard title="User Approvals" icon={<Users size={24}/>} onClick={()=>router.push("/admin/users")} />

<ActionCard title="Manage Batches" icon={<GraduationCap size={24}/>} onClick={()=>router.push("/admin/batches")} />

<ActionCard title="Manage Divisions" icon={<Settings size={24}/>} onClick={()=>router.push("/admin/divisions")} />

<ActionCard title="Subjects" icon={<BookOpen size={24}/>} onClick={()=>router.push("/admin/subjects")} />

<ActionCard title="Timetable" icon={<CalendarDays size={24}/>} onClick={()=>router.push("/admin/timetable")} />

<ActionCard title="Reports" icon={<CalendarDays size={24}/>} onClick={()=>router.push("/admin/reports")} />

</div>


{/* RECENT ACTIVITY */}

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
className="bg-[#1e293b] border border-white/10 rounded-xl p-6"
>

<h2 className="text-lg font-semibold mb-6">
Recent Activity
</h2>

<ul className="space-y-3 text-gray-400 text-sm">

<li>Batch MCA 2024-2026 created</li>
<li>Division S3-A added</li>
<li>Teacher assigned to DBMS</li>
<li>Timetable updated</li>

</ul>

</motion.div>

</div>

</div>

);

}



/* SIDEBAR ITEM */

function SidebarItem({label,onClick}:{label:string,onClick:any}){

return(

<button
onClick={onClick}
className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition"
>
{label}
</button>

);

}



/* STAT CARD */

function StatCard({icon,label,value}:{icon:any,label:string,value:any}){

return(

<motion.div
whileHover={{scale:1.05}}
className="bg-[#1e293b] border border-white/10 rounded-xl p-6"
>

<div className="flex items-center gap-2 text-gray-400">

{icon}

<p className="text-sm">
{label}
</p>

</div>

<h2 className="text-3xl font-bold mt-3">
{value ?? "-"}
</h2>

</motion.div>

);

}



/* ACTION CARD */

function ActionCard({title,icon,onClick}:{title:string,icon:any,onClick:any}){

return(

<motion.button
whileHover={{scale:1.05}}
onClick={onClick}
className="bg-[#1e293b] border border-white/10 rounded-xl p-6 text-left"
>

<div className="flex items-center gap-3 mb-3">

{icon}

<h3 className="text-lg font-semibold">
{title}
</h3>

</div>

<p className="text-gray-400 text-sm">
Manage {title.toLowerCase()}
</p>

</motion.button>

);

}