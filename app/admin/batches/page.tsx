"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminBatchesPage() {

const router = useRouter();

const [batches,setBatches] = useState<any[]>([]);
const [selectedBatch,setSelectedBatch] = useState("");

const [name,setName] = useState("");
const [academicYear,setAcademicYear] = useState("");

const [loading,setLoading] = useState(false);

const [error,setError] = useState("");
const [success,setSuccess] = useState("");

/* ================= AUTH ================= */

useEffect(()=>{

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if(!token || role !== "admin"){
router.replace("/login");
return;
}

loadBatches();

},[router]);

/* ================= LOAD BATCHES ================= */

const loadBatches = async()=>{

const token = localStorage.getItem("token");

const res = await fetch("/api/admin/batches",{
headers:{ Authorization:`Bearer ${token}` }
});

const data = await res.json();

if(Array.isArray(data)){
setBatches(data);
}

};

/* ================= CREATE BATCH ================= */

const createBatch = async()=>{

setError("");
setSuccess("");

if(!name || !academicYear){
setError("All fields are required");
return;
}

setLoading(true);

try{

const token = localStorage.getItem("token");

const res = await fetch("/api/admin/batches",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization:`Bearer ${token}`
},
body:JSON.stringify({ name,academicYear })
});

const data = await res.json();

if(!res.ok){
throw new Error(data.error || "Failed to create batch");
}

setSuccess("Batch created successfully");

setName("");
setAcademicYear("");

loadBatches();

}catch(err:any){

setError(err.message);

}finally{

setLoading(false);

}

};

/* ================= PROMOTE SEMESTER ================= */

const promoteSemester = async()=>{

setError("");
setSuccess("");

if(!selectedBatch){
setError("Please select a batch");
return;
}

try{

const token = localStorage.getItem("token");

const res = await fetch("/api/admin/promote-semester",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization:`Bearer ${token}`
},
body:JSON.stringify({ batchId:selectedBatch })
});

const data = await res.json();

if(!res.ok){
throw new Error(data.error || "Failed to promote semester");
}

setSuccess(`Semester promoted to ${data.newSemester}`);

}catch(err:any){

setError(err.message);

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
Manage Batches
</h1>

<p className="text-gray-400">
Create batches and promote semesters
</p>

</motion.div>



{/* CREATE BATCH CARD */}

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
whileHover={{scale:1.01}}
className="max-w-xl bg-[#1e293b] border border-white/10 rounded-xl p-6 shadow-lg"
>

<h2 className="text-lg font-semibold mb-5">
Create Batch
</h2>

<div className="space-y-4">

<input
placeholder="Batch Name (e.g. MCA)"
value={name}
onChange={(e)=>setName(e.target.value)}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 outline-none focus:border-cyan-400"
/>

<input
placeholder="Academic Year (e.g. 2024-2026)"
value={academicYear}
onChange={(e)=>setAcademicYear(e.target.value)}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 outline-none focus:border-cyan-400"
/>

<motion.button
whileHover={{scale:1.03}}
whileTap={{scale:0.96}}
onClick={createBatch}
disabled={loading}
className="w-full bg-cyan-500 hover:bg-cyan-600 transition rounded-lg p-3 font-semibold"
>

{loading ? "Creating..." : "Create Batch"}

</motion.button>

</div>

</motion.div>



{/* PROMOTE SEMESTER CARD */}

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
whileHover={{scale:1.01}}
className="max-w-xl bg-[#1e293b] border border-white/10 rounded-xl p-6 shadow-lg"
>

<h2 className="text-lg font-semibold mb-5">
Promote Semester
</h2>

<select
value={selectedBatch}
onChange={(e)=>setSelectedBatch(e.target.value)}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 mb-4 outline-none focus:border-cyan-400"
>

<option value="">Select Batch</option>

{batches.map((b)=>(
<option key={b._id} value={b._id}>
{b.name} ({b.academicYear})
</option>
))}

</select>

<motion.button
whileHover={{scale:1.03}}
whileTap={{scale:0.96}}
onClick={promoteSemester}
className="w-full bg-green-500 hover:bg-green-600 transition rounded-lg p-3 font-semibold"
>

Promote Semester

</motion.button>

</motion.div>



{/* MESSAGES */}

{error && (

<motion.p
initial={{opacity:0}}
animate={{opacity:1}}
className="text-red-400 font-semibold"
>

{error}

</motion.p>

)}

{success && (

<motion.p
initial={{opacity:0}}
animate={{opacity:1}}
className="text-green-400 font-semibold"
>

{success}

</motion.p>

)}

</div>

);

}