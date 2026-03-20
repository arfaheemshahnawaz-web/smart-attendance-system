"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminOverview(){

const [data,setData] = useState<any>(null);
const router = useRouter();

useEffect(()=>{

const token = localStorage.getItem("token");

fetch("/api/admin/overview",{
headers:{
Authorization:`Bearer ${token}`
}
})
.then(res=>res.json())
.then(setData)
.catch(err=>console.error("Overview error:",err));

},[]);

if(!data){
return <p className="p-10 text-white">Loading...</p>;
}

return(

<div className="min-h-screen bg-[#0f172a] text-white p-10 space-y-10">

{/* HEADER */}

<h1 className="text-3xl font-bold">
System Overview
</h1>


{/* ================= TEACHERS ================= */}

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
className="bg-[#1e293b] p-6 rounded-xl border border-white/10"
>

<h2 className="text-xl font-semibold mb-6">
Teachers & Subjects
</h2>

<div className="space-y-4">

{data.teachers.map((t:any)=>(
<motion.div
key={t._id}
whileHover={{scale:1.02}}
className="bg-white/5 p-4 rounded-lg border border-white/5"
>

<p className="font-semibold text-lg">
{t.name}
</p>

{t.subjects.length > 0 ? (

<ul className="text-sm text-gray-400 mt-2 space-y-1">

{t.subjects.map((s:any,i:number)=>(
<li key={i}>
{s.subjectName} <span className="text-gray-500">({s.batchName})</span>
</li>
))}

</ul>

) : (

<p className="text-gray-500 text-sm mt-2">
No subjects assigned
</p>

)}

</motion.div>
))}

</div>

</motion.div>


{/* ================= BATCHES ================= */}

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
className="bg-[#1e293b] p-6 rounded-xl border border-white/10"
>

<h2 className="text-xl font-semibold mb-6">
Batches & Divisions
</h2>

<div className="space-y-6">

{data.batches.map((b:any)=>(

<div key={b._id}>

<h3 className="font-semibold text-lg mb-3">
{b.name} <span className="text-gray-400">({b.academicYear})</span>
</h3>

<div className="grid md:grid-cols-2 gap-3">

{b.divisions.map((d:any,i:number)=>(

<motion.div
key={i}
whileHover={{scale:1.03}}
onClick={()=>router.push(`/admin/divisions/${d._id}`)}
className="bg-white/5 p-4 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition"
>

<p className="font-medium">
Division {d.name}
</p>

<p className="text-sm text-gray-400 mt-1">
Class Teacher: {d.classTeacher || "Not Assigned"}
</p>

<p className="text-xs text-gray-500 mt-1">
{d.students.length} Students
</p>

</motion.div>

))}

</div>

</div>

))}

</div>

</motion.div>

</div>

);
}