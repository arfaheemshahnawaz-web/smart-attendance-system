"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { s } from "framer-motion/client";

export default function StudentDivisionPage() {

const token =
typeof window !== "undefined"
? localStorage.getItem("token")
: null;

const [batches,setBatches] = useState<any[]>([]);
const [divisions,setDivisions] = useState<any[]>([]);
const [students,setStudents] = useState<any[]>([]);

const [batchId,setBatchId] = useState("");
const [divisionId,setDivisionId] = useState("");
const [studentId,setStudentId] = useState("");

const [error,setError] = useState("");
const [success,setSuccess] = useState("");



/* LOAD BATCHES + STUDENTS */

useEffect(()=>{

fetch("/api/admin/batches",{
headers:{ Authorization:`Bearer ${token}` }
})
.then(res=>res.json())
.then(setBatches);

fetch("/api/admin/students",{
headers:{ Authorization:`Bearer ${token}` }
})
.then(res=>res.json())
.then(setStudents);

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



/* ASSIGN STUDENT */

const assignStudent = async()=>{

setError("");
setSuccess("");

if(!studentId || !divisionId){
setError("Select student and division");
return;
}

const res = await fetch("/api/admin/student-division",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization:`Bearer ${token}`
},
body:JSON.stringify({ studentId,divisionId })
});

const data = await res.json();

if(!res.ok){
setError(data.error);
}else{

setSuccess("Student assigned successfully");

setStudents(prev =>
prev.filter(s => s._id !== studentId)
);

setStudentId("");

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
Student → Division Mapping
</h1>

<p className="text-gray-400">
Assign students to their divisions
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
onChange={e=>setBatchId(e.target.value)}
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
onChange={e=>setDivisionId(e.target.value)}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 mb-4 outline-none focus:border-cyan-400"
>

<option value="">
Select Division
</option>

{divisions.map(d=>(
<option key={d._id} value={d._id}>
{d.name}
</option>
))}

</select>



{/* STUDENT */}

<select
value={studentId}
onChange={e=>setStudentId(e.target.value)}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 mb-4 outline-none focus:border-cyan-400"
>

<option value="">
Select Student
</option>


{Array.isArray(students) &&
students.map((s)=>(
<option key={s._id} value={s._id}>
{s.name} ({s.collegeId})
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
onClick={assignStudent}
className="w-full bg-cyan-500 hover:bg-cyan-600 transition rounded-lg p-3 font-semibold"
>

Assign Student

</motion.button>

</motion.div>

</div>

);

}