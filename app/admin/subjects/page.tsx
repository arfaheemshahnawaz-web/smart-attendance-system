"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function AdminSubjectsPage() {

const [batches,setBatches] = useState<any[]>([]);
const [semesters,setSemesters] = useState<number[]>([]);

const [batchId,setBatchId] = useState("");
const [semester,setSemester] = useState<number | "">("");

const [name,setName] = useState("");
const [code,setCode] = useState("");

const [error,setError] = useState("");
const [success,setSuccess] = useState("");


/* ================= LOAD BATCHES ================= */

useEffect(()=>{

const token = localStorage.getItem("token");
if(!token) return;

fetch("/api/admin/batches",{
headers:{ Authorization:`Bearer ${token}` }
})
.then(async(res)=>{

if(!res.ok){
setBatches([]);
return;
}

const data = await res.json();

if(Array.isArray(data)){
setBatches(data);
}else{
setBatches([]);
}

});

},[]);



/* ================= LOAD SEMESTERS ================= */

useEffect(()=>{

if(!batchId) return;

const token = localStorage.getItem("token");

fetch(`/api/admin/divisions?batchId=${batchId}`,{
headers:{ Authorization:`Bearer ${token}` }
})
.then(res=>res.json())
.then((data)=>{

if(!Array.isArray(data)){
setSemesters([]);
return;
}

const uniqueSemesters = [
...new Set(data.map((d:any)=>d.semester))
].sort((a:any,b:any)=>a-b);

setSemesters(uniqueSemesters);

});

},[batchId]);



/* ================= CREATE SUBJECT ================= */

const createSubject = async()=>{

const token = localStorage.getItem("token");

setError("");
setSuccess("");

if(!batchId || !semester || !name || !code){
setError("All fields are required");
return;
}

const res = await fetch("/api/admin/subjects",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization:`Bearer ${token}`
},
body:JSON.stringify({
batchId,
semester,
name,
code
})
});

const data = await res.json();

if(!res.ok){
setError(data.error || "Failed to create subject");
return;
}

setSuccess("Subject created successfully");

setName("");
setCode("");
setSemester("");

};



return(

<div className="min-h-screen bg-[#0f172a] text-white p-10 space-y-10">


{/* HEADER */}

<motion.div
initial={{opacity:0,y:-20}}
animate={{opacity:1,y:0}}
>

<h1 className="text-3xl font-bold">
Manage Subjects
</h1>

<p className="text-gray-400">
Create subjects for each semester
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



{/* SEMESTER */}

<select
value={semester}
onChange={(e)=>setSemester(Number(e.target.value))}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 mb-4 outline-none focus:border-cyan-400"
>

<option value="">
Select Semester
</option>

{semesters.map((s)=>(
<option key={s} value={s}>
Semester {s}
</option>
))}

</select>



{/* SUBJECT NAME */}

<input
placeholder="Subject name (e.g. DBMS)"
value={name}
onChange={(e)=>setName(e.target.value)}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 mb-4 outline-none focus:border-cyan-400"
/>



{/* SUBJECT CODE */}

<input
placeholder="Subject code (e.g. MCA301)"
value={code}
onChange={(e)=>setCode(e.target.value)}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 mb-4 outline-none focus:border-cyan-400"
/>



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
onClick={createSubject}
className="w-full bg-cyan-500 hover:bg-cyan-600 transition rounded-lg p-3 font-semibold"
>

Create Subject

</motion.button>

</motion.div>

</div>

);

}