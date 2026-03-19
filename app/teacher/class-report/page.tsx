"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function ClassReportPage(){

const [reports,setReports] = useState<any[]>([]);
const [subjects,setSubjects] = useState<string[]>([]);
const [lowStudents,setLowStudents] = useState<any[]>([]);

const [subjectFilter,setSubjectFilter] = useState("");
const [monthFilter,setMonthFilter] = useState("");

const [stats,setStats] = useState({
sessions:0,
records:0,
students:0
});


useEffect(()=>{

const token = localStorage.getItem("token");

fetch(`/api/teacher/class-report?subject=${subjectFilter}&month=${monthFilter}`,{
headers:{Authorization:`Bearer ${token}`}
})
.then(res=>res.json())
.then(data=>{

setReports(data.reports || []);
setSubjects(data.subjects || []);
setLowStudents(data.lowAttendanceStudents || []);

setStats({
sessions:data.totalSessions || 0,
records:data.totalAttendanceRecords || 0,
students:data.students || 0
});


});

},[subjectFilter,monthFilter]);



/* EXCEL DOWNLOAD */

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

const ws = XLSX.utils.json_to_sheet(excelData);
const wb = XLSX.utils.book_new();

XLSX.utils.book_append_sheet(wb,ws,"Attendance");

const buffer = XLSX.write(wb,{bookType:"xlsx",type:"array"});

const blob = new Blob([buffer],{type:"application/octet-stream"});

saveAs(blob,"class_attendance_report.xlsx");

};


return(

<div className="min-h-screen bg-[#0f172a] text-white p-10 space-y-10">


{/* HEADER */}

<div className="flex justify-between items-center">

<h1 className="text-3xl font-bold">
Class Attendance Report
</h1>

<button
onClick={downloadExcel}
className="bg-emerald-500 px-4 py-2 rounded-lg"
>
Download Excel
</button>

</div>



{/* FILTERS */}

<div className="flex gap-4">

<select
value={subjectFilter}
onChange={(e)=>setSubjectFilter(e.target.value)}
className="bg-white/10 border px-4 py-2 rounded"
>

<option value="">All Subjects</option>

{subjects.map((s,i)=>(
<option key={i} value={s}>{s}</option>
))}

</select>


<select
value={monthFilter}
onChange={(e)=>setMonthFilter(e.target.value)}
className="bg-white/10 border px-4 py-2 rounded"
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

</div>



{/* LOW ATTENDANCE ALERT */}



{lowStudents.length>0 &&(
<div className="bg-red-500/10 border border-red-500/30 p-6 rounded-xl">

<h2 className="text-red-400 mb-4 font-semibold">
Low Attendance Students
</h2>

<table className="w-full table-fixed">

<thead>
<tr className="border-b border-white/10 text-left">

<th className="py-2 w-1/4">Student</th>
<th className="py-2">Subjects with Low Attendance</th>

</tr>
</thead>

<tbody>

{lowStudents.map((s,i)=>(

<tr key={i} className="border-b border-white/5">

<td className="py-3 font-medium">
{s.studentName}
</td>

<td>

<div className="flex flex-wrap gap-2">

{s.subjects.map((sub:any,j:number)=>(
<span
key={j}
className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs"
>
{sub.subject} ({sub.percentage}%)
</span>
))}

</div>

</td>

</tr>

))}

</tbody>

</table>

</div>

)}




{/* STAT CARDS */}

<div className="grid md:grid-cols-3 gap-6">

<StatCard label="Sessions" value={stats.sessions}/>
<StatCard label="Records" value={stats.records}/>
<StatCard label="Students" value={stats.students}/>

</div>




{/* TABLE */}

<div className="bg-white/5 border border-white/10 rounded-xl p-6">

<table className="w-full table-fixed text-center">

<thead>

<tr className="border-b border-white/10">

<th className="py-3 text-left w-1/5">Student</th>
<th className="text-left w-1/5">Email</th>

{subjects.map((s,i)=>(
<th key={i} className="w-[80px]">
{s}
</th>
))}

</tr>

</thead>

<tbody>

{reports.map((r,i)=>(

<tr key={i} className="border-b border-white/5">

<td className="text-left py-3 font-medium">
{r.studentName}
</td>

<td className="text-left text-gray-400">
{r.studentEmail}
</td>

{subjects.map((s,j)=>{

const p = r.subjects?.[s] ?? 0;

return(

<td key={j}>

<span className={`px-2 py-1 rounded text-xs font-semibold
${p < 75
? "bg-red-500/20 text-red-400"
: "bg-emerald-500/20 text-emerald-400"
}`}>

{p}%

</span>

</td>

);

})}

</tr>

))}

</tbody>

</table>

</div>


</div>

);

}



function StatCard({label,value}:{label:string,value:any}){

return(

<div className="bg-white/5 border border-white/10 p-6 rounded-xl">

<p className="text-gray-400 text-sm">{label}</p>

<h2 className="text-2xl font-bold mt-2">{value}</h2>

</div>

);

}