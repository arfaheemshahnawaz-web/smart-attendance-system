"use client";

import { useEffect,useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminReportsPage(){

const token = typeof window!=="undefined"
? localStorage.getItem("token")
: null;

const [batches,setBatches] = useState<any[]>([]);
const [divisions,setDivisions] = useState<any[]>([]);

const [batchId,setBatchId] = useState("");
const [divisionId,setDivisionId] = useState("");

const [report,setReport] = useState<any>(null);



/* LOAD BATCHES */

useEffect(()=>{

fetch("/api/admin/batches",{
headers:{ Authorization:`Bearer ${token}` }
})
.then(res=>res.json())
.then(setBatches);

},[]);


/* LOAD DIVISIONS */

useEffect(()=>{

if(!batchId) return;

fetch(`/api/admin/divisions?batchId=${batchId}`,{
headers:{ Authorization:`Bearer ${token}` }
})
.then(res=>res.json())
.then(setDivisions);

},[batchId]);


/* LOAD REPORT */

const loadReport = async()=>{

const res = await fetch(
`/api/admin/reports?divisionId=${divisionId}`,
{
headers:{ Authorization:`Bearer ${token}` }
}
);

const data = await res.json();

setReport(data);

};



/* PDF DOWNLOAD */

const downloadPDF = ()=>{

const doc = new jsPDF();

doc.text("Attendance Report",14,15);

const tableData = report.report.map((s:any)=>[
s.studentName,
...report.subjects.map((sub:string)=>s.subjects[sub] + "%"),
s.overall+"%"
]);

autoTable(doc,{
head:[
[
"Student",
...report.subjects,
"Overall"
]
],
body:tableData,
startY:20
});

doc.save("attendance-report.pdf");

};



return(

<div className="min-h-screen bg-[#0f172a] text-white p-10 space-y-10">

<h1 className="text-3xl font-bold">
Admin Reports
</h1>


<div className="max-w-lg bg-[#1e293b] p-6 rounded-xl border border-white/10 space-y-4">

<select
className="w-full p-3 rounded bg-[#0f172a]"
onChange={(e)=>setBatchId(e.target.value)}
>

<option value="">Select Batch</option>

{batches.map(b=>(
<option key={b._id} value={b._id}>
{b.name} ({b.academicYear})
</option>
))}

</select>


<select
className="w-full p-3 rounded bg-[#0f172a]"
onChange={(e)=>setDivisionId(e.target.value)}
>

<option value="">Select Division</option>

{divisions.map(d=>(
<option key={d._id} value={d._id}>
{d.name}
</option>
))}

</select>


<button
onClick={loadReport}
className="w-full bg-cyan-500 p-3 rounded font-semibold"
>
Generate Report
</button>

</div>



{/* TABLE */}

{report && (

<div className="overflow-x-auto">

<table className="w-full border border-white/10">

<thead>

<tr className="border-b border-white/10">

<th className="p-3">Student</th>

{report.subjects.map((s:string)=>(
<th key={s}>{s}</th>
))}

<th>Overall</th>

</tr>

</thead>

<tbody>

{report.report.map((s:any,i:number)=>(

<tr key={i} className="border-b border-white/10">

<td className="p-3">{s.studentName}</td>

{report.subjects.map((sub:string)=>{

const val = s.subjects[sub];

return(
<td
key={sub}
className={`text-center
${val<75?"text-red-400":"text-green-400"}
`}
>
{val}%
</td>
);

})}

<td className="text-center font-bold">
{s.overall}%
</td>

</tr>

))}

</tbody>

</table>


<button
onClick={downloadPDF}
className="mt-6 bg-green-500 px-6 py-2 rounded"
>
Download PDF
</button>

</div>

)}

</div>

);

}