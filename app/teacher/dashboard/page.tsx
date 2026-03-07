"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { motion } from "framer-motion";
import {
BarChart,
Bar,
XAxis,
YAxis,
Tooltip,
ResponsiveContainer
} from "recharts";

import {
LayoutDashboard,
Calendar,
BarChart3,
LogOut
} from "lucide-react";

export default function TeacherDashboard(){

const router = useRouter();

const [currentSlot,setCurrentSlot] = useState<any>(null);
const [schedule,setSchedule] = useState<any[]>([]);
const [selectedClass,setSelectedClass] = useState<any>(null);

const [report,setReport] = useState<any>(null);
const [loadingReport,setLoadingReport] = useState(false);

const [sessionId,setSessionId] = useState("");
const [qrImage,setQrImage] = useState("");

const [qrTimer,setQrTimer] = useState<any>(null);

const token =
typeof window !== "undefined" ? localStorage.getItem("token") : null;

const role =
typeof window !== "undefined" ? localStorage.getItem("role") : null;


/* ================= LOAD DATA ================= */

useEffect(()=>{

if(!token || role !== "teacher"){
router.replace("/login");
return;
}

fetch("/api/teacher/current-slot",{
headers:{Authorization:`Bearer ${token}`}
})
.then(async(res)=>{

if(!res.ok) throw new Error("Failed current slot");

const text = await res.text();
return text ? JSON.parse(text) : {};

})
.then(data=>{
if(data?.active) setCurrentSlot(data);
})
.catch(console.error);


fetch("/api/teacher/today-schedule",{
headers:{Authorization:`Bearer ${token}`}
})
.then(async(res)=>{

if(!res.ok) throw new Error("Failed schedule");

const text = await res.text();
return text ? JSON.parse(text) : [];

})
.then(data=>setSchedule(data))
.catch(console.error);

},[token]);


/* ================= QR GENERATE ================= */

const generateQR = async(sessionId:string,qrToken:string)=>{

const qrData = JSON.stringify({sessionId,qrToken});
const qrUrl = await QRCode.toDataURL(qrData);

setQrImage(qrUrl);

};


/* ================= START ATTENDANCE ================= */

const startAttendance = async()=>{

const res = await fetch("/api/attendance/start",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization:`Bearer ${token}`
}
});

const data = await res.json();

setSessionId(data.sessionId);

generateQR(data.sessionId,data.qrToken);


/* START AUTO QR REFRESH */

const timer = setInterval(async()=>{

try{

const res = await fetch("/api/attendance/refresh-qr",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization:`Bearer ${token}`
},
body:JSON.stringify({sessionId:data.sessionId})
});

const refresh = await res.json();

generateQR(data.sessionId,refresh.qrToken);

}catch(err){
console.error("QR refresh error",err);
}

},10000);

setQrTimer(timer);

};


/* ================= STOP ATTENDANCE ================= */

const stopAttendance = async()=>{

await fetch("/api/attendance/stop",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization:`Bearer ${token}`
},
body:JSON.stringify({sessionId})
});

if(qrTimer){
clearInterval(qrTimer);
}

setSessionId("");
setQrImage("");

};


/* ================= STATUS ================= */

const getStatus=(slot:any)=>{

if(currentSlot &&
slot.hourSlot === currentSlot.hourSlot &&
slot.division === currentSlot.division)
return "active";

const hour = new Date().getHours();
const start = parseInt(slot.hourSlot.split(":")[0]);

if(start < hour) return "completed";

return "upcoming";

};


/* ================= LOAD REPORT ================= */

const loadReport = async(slot:any)=>{

setLoadingReport(true);

const res = await fetch("/api/teacher/report",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization:`Bearer ${token}`
},
body:JSON.stringify(slot)
});

const text = await res.text();
const data = text ? JSON.parse(text) : {};

setReport(data);
setLoadingReport(false);

};


/* ================= SLOT CLICK ================= */

const handleClassClick = async(slot:any)=>{

const status = getStatus(slot);

setSelectedClass({...slot,status});

if(status==="completed"){
await loadReport(slot);
}

};


/* ================= GROUP BY BATCH ================= */

const grouped = schedule.reduce((acc:any,slot:any)=>{

if(!acc[slot.batch]) acc[slot.batch]=[];

acc[slot.batch].push(slot);

return acc;

},{});


/* ================= GRAPH DATA ================= */

const chartData = [
{
name:"Classes",
value:schedule.length
},
{
name:"Completed",
value:schedule.filter(s=>getStatus(s)==="completed").length
},
{
name:"Active",
value:currentSlot?1:0
}
];


/* ================= UI ================= */

return(

<div className="flex min-h-screen bg-[#0f172a] text-white">


{/* SIDEBAR */}

<div className="w-64 bg-[#020617] border-r border-white/10 p-6 space-y-6">

<h1 className="text-xl font-bold">Teacher</h1>

<div className="space-y-3">

<button className="flex items-center gap-3 w-full hover:bg-white/10 p-3 rounded-lg">
<LayoutDashboard size={18}/> Dashboard
</button>

<button
onClick={()=>router.push("/teacher/timetable")}
className="flex items-center gap-3 w-full hover:bg-white/10 p-3 rounded-lg"
>
<Calendar size={18}/> Timetable
</button>

<button
onClick={()=>router.push("/teacher/reports")}
className="flex items-center gap-3 w-full hover:bg-white/10 p-3 rounded-lg"
>
<BarChart3 size={18}/> Reports
</button>
<button
onClick={()=>router.push("/teacher/class-report")}
className="flex items-center gap-3 w-full hover:bg-white/10 p-3 rounded-lg"
>
<BarChart3 size={18}/> Class Report
</button>

<button
onClick={()=>{localStorage.clear();router.replace("/login")}}
className="flex items-center gap-3 w-full hover:bg-red-500/20 p-3 rounded-lg text-red-400"
>
<LogOut size={18}/> Logout
</button>

</div>

</div>


{/* MAIN */}

<div className="flex-1 p-10 space-y-10">


{/* STATS */}

<div className="grid md:grid-cols-3 gap-6">

<motion.div whileHover={{scale:1.05}} className="bg-white/5 p-6 rounded-xl border border-white/10">
<p className="text-gray-400 text-sm">Active Class</p>
<p className="text-2xl font-bold mt-2">
{currentSlot?.subject || "None"}
</p>
</motion.div>

<motion.div whileHover={{scale:1.05}} className="bg-white/5 p-6 rounded-xl border border-white/10">
<p className="text-gray-400 text-sm">Today's Classes</p>
<p className="text-2xl font-bold mt-2">
{schedule.length}
</p>
</motion.div>

<motion.div whileHover={{scale:1.05}} className="bg-white/5 p-6 rounded-xl border border-white/10">
<p className="text-gray-400 text-sm">Completed</p>
<p className="text-2xl font-bold mt-2">
{schedule.filter(s=>getStatus(s)==="completed").length}
</p>
</motion.div>

</div>


{/* GRAPH */}

<div className="bg-white/5 border border-white/10 rounded-xl p-6">

<h2 className="mb-6 font-semibold">Class Overview</h2>

<ResponsiveContainer width="100%" height={250}>

<BarChart data={chartData}>
<XAxis dataKey="name"/>
<YAxis/>
<Tooltip/>
<Bar dataKey="value"/>
</BarChart>

</ResponsiveContainer>

</div>


{/* CLASSES */}

<div>

<h2 className="text-lg font-semibold mb-6">
Today's Classes
</h2>

<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

{Object.keys(grouped).map(batch=>(

<div key={batch} className="bg-white/5 border border-white/10 p-6 rounded-xl">

<p className="text-emerald-400 font-semibold mb-4">
{batch}
</p>

<div className="space-y-3">

{grouped[batch].map((slot:any,i:number)=>{

return(

<motion.div
key={i}
whileHover={{scale:1.03}}
onClick={()=>handleClassClick(slot)}
className="cursor-pointer p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex justify-between items-center"
>

<div>
<p className="text-emerald-400 text-sm font-semibold">
{slot.subject}
</p>

<p className="text-xs text-white/60">
Division {slot.division}
</p>
</div>

<p className="text-xs">{slot.hourSlot}</p>

</motion.div>

)

})}

</div>

</div>

))}

</div>

</div>


{/* QR PANEL */}

{selectedClass && (

<div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center max-w-lg mx-auto">

<h2 className="text-xl font-bold">
{selectedClass.subject}
</h2>

<p className="text-white/60 mb-6">
Division {selectedClass.division} • {selectedClass.hourSlot}
</p>

{selectedClass.status==="active" && !sessionId && (
<button onClick={startAttendance} className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg">
Start Attendance
</button>
)}

{qrImage && (

<div className="mt-6">

<p className="text-sm mb-4">
QR changes every 10 seconds
</p>

<img src={qrImage} className="w-60 mx-auto bg-white p-3 rounded"/>

<button onClick={stopAttendance} className="mt-6 bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
Stop Session
</button>

</div>

)}

</div>

)}

</div>

</div>

);

}