"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


type Report = {
studentName: string;
studentEmail: string;
subjects: Record<string, number>;
};


export default function AttendanceReportsPage(){

const [reports,setReports] = useState<Report[]>([]);
const [subjects,setSubjects] = useState<string[]>([]);
const [batches,setBatches] = useState<any[]>([]);
const [divisions,setDivisions] = useState<any[]>([]);
const [readyToFetch,setReadyToFetch] = useState(false);

const [subjectFilter,setSubjectFilter] = useState("");
const [monthFilter,setMonthFilter] = useState("");
const [batch,setBatch] = useState("");
const [division,setDivision] = useState("");




const [roleView,setRoleView] = useState<
"class-teacher" | "subject-teacher"
>("subject-teacher");

const [stats,setStats] = useState({
totalSessions:0,
totalAttendanceRecords:0
});

const [loading,setLoading] = useState(true);


useEffect(()=>{

const token = localStorage.getItem("token");

fetch("/api/teacher/meta",{
headers:{
Authorization:`Bearer ${token}`
}
})
.then(res=>res.json())
.then(data=>{
setBatches(data.batches || []);
setDivisions(data.divisions || []);
})
.catch(err=>{
console.error("META ERROR:",err);
});

},[]);
/* FETCH REPORTS */

const fetchReports = ()=>{

const token = localStorage.getItem("token");

fetch(`/api/teacher/report?batchId=${batch}&divisionId=${division || ""}&subject=${subjectFilter}&month=${monthFilter}`,{
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
setSubjects(data?.subjects || []);

setRoleView(data?.role || "subject-teacher");

setStats({
totalSessions:data?.totalSessions || 0,
totalAttendanceRecords:data?.totalAttendanceRecords || 0
});


setLoading(false);

})

.catch((err)=>{
console.error("REPORT ERROR:",err);
setLoading(false);
});

};


useEffect(()=>{

if(!batch) return;

const token = localStorage.getItem("token");

fetch(`/api/teacher/subjects?batchId=${batch}`,{
headers:{
Authorization:`Bearer ${token}`
}
})
.then(res=>res.json())
.then(data=>{
setSubjects(data.subjects || []);
});

},[batch]);




/* DOWNLOAD EXCEL */

const downloadExcel = ()=>{

const excelData = reports.map((r)=>{

const row:any = {
Student:r.studentName,
Email:r.studentEmail
};

subjects.forEach((s)=>{
row[s] = r.subjects?.[s] ?? 0;
});

return row;

});

const worksheet = XLSX.utils.json_to_sheet(excelData);

const workbook = XLSX.utils.book_new();

XLSX.utils.book_append_sheet(
workbook,
worksheet,
"Attendance"
);

const excelBuffer = XLSX.write(
workbook,
{bookType:"xlsx",type:"array"}
);

const data = new Blob(
[excelBuffer],
{type:"application/octet-stream"}
);

saveAs(data,"attendance_report.xlsx");

};


const handleGenerate = ()=>{
if(!batch){
alert("Please select batch");
return;
}

setLoading(true);
fetchReports();
};


return(

<div className="min-h-screen bg-[#0f172a] text-white p-10 space-y-10">


{/* HEADER */}

<div className="flex justify-between items-center">

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


<button
onClick={downloadExcel}
className="bg-emerald-500 px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600"
>
Download Excel
</button>

</div>



{/* FILTERS */}

<div className="flex gap-4">


<select
value={batch}
onChange={(e)=>setBatch(e.target.value)}
className="bg-white/10 border px-4 py-2 rounded"
>
<option value="">Select Batch</option>

{batches.map((b)=>(
<option key={b._id} value={b._id}>
{b.name} ({b.academicYear})
</option>
))}

</select>

<select
value={subjectFilter}
onChange={(e)=>setSubjectFilter(e.target.value)}
className="bg-white/10 border border-white/20 px-4 py-2 rounded"
>

<option value="">All Subjects</option>

{subjects.map((s,i)=>(
<option key={i} value={s}>
{s}
</option>
))}

</select>


<select
value={division}
onChange={(e)=>setDivision(e.target.value)}
className="bg-white/10 border px-4 py-2 rounded"
>
<option value="">Select Division</option>

{divisions
.filter(d=>d.batchId.toString() === batch)
.map((d)=>(
<option key={d._id} value={d._id}>
{d.name}
</option>
))}

</select>

<select
value={monthFilter}
onChange={(e)=>setMonthFilter(e.target.value)}
className="bg-white/10 border border-white/20 px-4 py-2 rounded"
>

<option value="">All Months</option>

<option value="1">Jan</option>
<option value="2">Feb</option>
<option value="3">Mar</option>
<option value="4">Apr</option>
<option value="5">May</option>
<option value="6">Jun</option>
<option value="7">Jul</option>
<option value="8">Aug</option>
<option value="9">Sep</option>
<option value="10">Oct</option>
<option value="11">Nov</option>
<option value="12">Dec</option>

</select>






<button
onClick={handleGenerate}
className="bg-blue-500 px-4 py-2 rounded-lg font-semibold hover:bg-blue-600"
>
Generate Report
</button>

</div>



{/* STAT CARDS */}

<div className="grid md:grid-cols-2 gap-6">

<StatCard
label="Total Sessions"
value={stats.totalSessions}
/>

<StatCard
label="Attendance Records"
value={stats.totalAttendanceRecords}
/>

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
<p className="text-gray-400">
Loading reports...
</p>
)}


{!loading && (

<div className="overflow-x-auto">

<table className="w-full">

<thead>

<tr className="text-left text-gray-400 border-b border-white/10">

<th className="py-3">Student</th>
<th>Email</th>

{subjects.map((s,i)=>(
<th key={i}>{s}</th>
))}

</tr>

</thead>



<tbody>

{reports.map((r,i)=>(

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

{subjects.map((s,j)=>{

const p = r.subjects?.[s] ?? 0;

return(

<td key={j}>

<span
className={`px-3 py-1 rounded-full text-xs font-semibold
${p>=75
? "bg-emerald-500/20 text-emerald-400"
: "bg-red-500/20 text-red-400"
}`}
>

{p}%

</span>

</td>

);

})}

</tr>

))}

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