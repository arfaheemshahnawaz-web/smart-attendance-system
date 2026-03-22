"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const DAYS = [
"Monday",
"Tuesday",
"Wednesday",
"Thursday",
"Friday",
];

const SLOTS = [
"09:00-10:00",
"10:00-11:00",
"11:00-12:00",
"12:00-13:00",
"13:00-14:00",
"14:00-15:00",
"15:00-16:00",
];

export default function AdminTimetablePage() {

const token =
typeof window !== "undefined"
? localStorage.getItem("token")
: null;

const [batches,setBatches] = useState<any[]>([]);
const [divisions,setDivisions] = useState<any[]>([]);
const [subjects,setSubjects] = useState<any[]>([]);

const [batchId,setBatchId] = useState("");
const [divisionId,setDivisionId] = useState("");
const [day,setDay] = useState("");
const [hourSlot,setHourSlot] = useState("");
const [subjectId,setSubjectId] = useState("");

const [error,setError] = useState("");
const [success,setSuccess] = useState("");



/* LOAD BATCHES */

useEffect(()=>{

async function loadBatches(){

try{

const res = await fetch("/api/admin/batches",{
headers:{ Authorization:`Bearer ${token}` }
});

const data = await res.json();

if(!res.ok){
setError(data.error || "Failed to fetch batches");
setBatches([]);
return;
}

if(Array.isArray(data)){
setBatches(data);
}else{
setBatches([]);
}

}catch{
setError("Network error");
setBatches([]);
}

}

loadBatches();

},[]);



/* LOAD DIVISIONS + SUBJECTS */

useEffect(()=>{

if(!batchId) return;

fetch(`/api/admin/divisions?batchId=${batchId}`,{
headers:{ Authorization:`Bearer ${token}` }
})
.then(res=>res.json())
.then(setDivisions);

fetch(`/api/admin/subjects?batchId=${batchId}`,{
headers:{ Authorization:`Bearer ${token}` }
})
.then(res=>res.json())
.then(setSubjects);

},[batchId]);



/* CREATE SLOT */

const createSlot = async()=>{

setError("");
setSuccess("");

if(!batchId || !divisionId || !day || !hourSlot || !subjectId){
setError("All fields are required");
return;
}

const res = await fetch("/api/admin/timetable",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization:`Bearer ${token}`
},
body:JSON.stringify({
batchId,
divisionId,
day,
hourSlot,
subjectId
})
});

const data = await res.json();

if(!res.ok){
setError(data.error || "Failed to create timetable");
}else{
setSuccess("Timetable slot created successfully");
}

};



return(

<div className="min-h-screen bg-[#0f172a] text-white p-10 space-y-10">


{/* HEADER */}

<motion.div
initial={{opacity:0,y:-20}}
animate={{opacity:1,y:0}}
>

<h1 className="text-3xl font-bold">
Timetable Builder
</h1>

<p className="text-gray-400">
Create and manage class schedules
</p>

</motion.div>



{/* CARD */}

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
whileHover={{scale:1.01}}
className="max-w-xl bg-[#1e293b] border border-white/10 rounded-xl p-6 shadow-lg"
>


{/* BATCH */}

<select
value={batchId}
onChange={(e)=>{
setBatchId(e.target.value);
setDivisionId("");
setSubjectId("");
}}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 mb-4 outline-none focus:border-cyan-400"
>

<option value="">
Select Batch
</option>

{Array.isArray(batches) &&
batches.map((b)=>(
<option key={b._id} value={b._id}>
{b.name} ({b.academicYear})
</option>
))}

</select>



{/* DIVISION */}

<select
value={divisionId}
onChange={(e)=>setDivisionId(e.target.value)}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 mb-4 outline-none focus:border-cyan-400"
>

<option value="">
Select Division
</option>

{divisions.map((d)=>(
<option key={d._id} value={d._id}>
{d.name}
</option>
))}

</select>



{/* DAY */}

<select
value={day}
onChange={(e)=>setDay(e.target.value)}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 mb-4 outline-none focus:border-cyan-400"
>

<option value="">
Select Day
</option>

{DAYS.map((d)=>(
<option key={d} value={d}>
{d}
</option>
))}

</select>



{/* SLOT */}

<select
value={hourSlot}
onChange={(e)=>setHourSlot(e.target.value)}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 mb-4 outline-none focus:border-cyan-400"
>

<option value="">
Select Hour Slot
</option>

{SLOTS.map((s)=>(
<option key={s} value={s}>
{s}
</option>
))}

</select>



{/* SUBJECT */}

<select
value={subjectId}
onChange={(e)=>setSubjectId(e.target.value)}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 mb-4 outline-none focus:border-cyan-400"
>

<option value="">
Select Subject
</option>

{Array.isArray(subjects) &&
subjects.map((s)=>(
<option key={s._id} value={s._id}>
{s.name} ({s.semester})
</option>
))}

</select>



{/* MESSAGES */}

{error && (
<motion.p
initial={{opacity:0}}
animate={{opacity:1}}
className="text-red-400 mb-3"
>
{error}
</motion.p>
)}

{success && (
<motion.p
initial={{opacity:0}}
animate={{opacity:1}}
className="text-green-400 mb-3"
>
{success}
</motion.p>
)}



{/* BUTTON */}

<motion.button
whileHover={{scale:1.03}}
whileTap={{scale:0.95}}
onClick={createSlot}
className="w-full bg-cyan-500 hover:bg-cyan-600 transition rounded-lg p-3 font-semibold"
>

Create Timetable Slot

</motion.button>

</motion.div>

</div>

);

}