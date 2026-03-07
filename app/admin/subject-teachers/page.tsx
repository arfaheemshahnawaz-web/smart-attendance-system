"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function SubjectTeacherPage() {

const token =
typeof window !== "undefined"
? localStorage.getItem("token")
: null;

const [batches,setBatches] = useState<any[]>([]);
const [subjects,setSubjects] = useState<any[]>([]);
const [teachers,setTeachers] = useState<any[]>([]);

const [batchId,setBatchId] = useState("");
const [subjectId,setSubjectId] = useState("");
const [teacherId,setTeacherId] = useState("");

const [error,setError] = useState("");
const [success,setSuccess] = useState("");



/* ================= LOAD BATCHES + TEACHERS ================= */

useEffect(()=>{

fetch("/api/admin/batches",{
headers:{ Authorization:`Bearer ${token}` }
})
.then(res=>res.json())
.then(setBatches);

fetch("/api/admin/teachers",{
headers:{ Authorization:`Bearer ${token}` }
})
.then(res=>res.json())
.then(setTeachers);

},[]);



/* ================= LOAD SUBJECTS ================= */

useEffect(()=>{

if(!batchId) return;

fetch(`/api/admin/subjects?batchId=${batchId}`,{
headers:{ Authorization:`Bearer ${token}` }
})
.then(res=>res.json())
.then(setSubjects);

},[batchId]);



/* ================= ASSIGN SUBJECT ================= */

const assignSubject = async()=>{

setError("");
setSuccess("");

if(!batchId || !subjectId || !teacherId){
setError("All fields are required");
return;
}

const res = await fetch("/api/admin/subject-teacher",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization:`Bearer ${token}`
},
body:JSON.stringify({
batchId,
subjectId,
teacherId
})
});

const data = await res.json();

if(!res.ok){
setError(data.error || "Assignment failed");
}else{
setSuccess("Subject assigned successfully");
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
Subject–Teacher Assignment
</h1>

<p className="text-gray-400">
Assign teachers to subjects
</p>

</motion.div>



{/* CARD */}

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
whileHover={{scale:1.01}}
className="max-w-lg bg-[#1e293b] border border-white/10 rounded-xl p-6 shadow-lg"
>


{/* BATCH */}

<select
value={batchId}
onChange={(e)=>setBatchId(e.target.value)}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 mb-4 outline-none focus:border-cyan-400"
>

<option value="">
Select Batch
</option>

{batches.map((b)=>(
<option key={b._id} value={b._id}>
{b.name} ({b.academicYear})
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

{subjects.map((s)=>(
<option key={s._id} value={s._id}>
{s.name} (Sem {s.semester})
</option>
))}

</select>



{/* TEACHER */}

<select
value={teacherId}
onChange={(e)=>setTeacherId(e.target.value)}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 mb-4 outline-none focus:border-cyan-400"
>

<option value="">
Select Teacher
</option>

{teachers.map((t)=>(
<option key={t._id} value={t._id}>
{t.name}
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
onClick={assignSubject}
className="w-full bg-cyan-500 hover:bg-cyan-600 transition rounded-lg p-3 font-semibold"
>

Assign Subject

</motion.button>

</motion.div>

</div>

);

}