"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ManageDivisionsPage() {

const router = useRouter();

const [batches,setBatches] = useState<any[]>([]);
const [divisions,setDivisions] = useState<any[]>([]);

const [batchId,setBatchId] = useState("");
const [name,setName] = useState("");
const [semester,setSemester] = useState<number | "">("");

const [error,setError] = useState("");
const [success,setSuccess] = useState("");

const token =
typeof window !== "undefined"
? localStorage.getItem("token")
: null;


/* ================= AUTH ================= */

useEffect(()=>{

if(!token || localStorage.getItem("role") !== "admin"){
router.replace("/login");
return;
}

fetch("/api/admin/batches",{
headers:{ Authorization:`Bearer ${token}` }
})
.then(res=>res.json())
.then(setBatches);

},[router,token]);


/* ================= LOAD DIVISIONS ================= */

useEffect(()=>{

if(!batchId) return;

fetch(`/api/admin/divisions?batchId=${batchId}`,{
headers:{ Authorization:`Bearer ${token}` }
})
.then(res=>res.json())
.then(setDivisions);

},[batchId,token]);


/* ================= CREATE DIVISION ================= */

const createDivision = async()=>{

setError("");
setSuccess("");

if(!name || !semester || !batchId){
setError("All fields are required");
return;
}

const res = await fetch("/api/admin/divisions",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization:`Bearer ${token}`
},
body:JSON.stringify({name,semester,batchId})
});

const data = await res.json();

if(!res.ok){
setError(data.error);
return;
}

setName("");
setSemester("");

setDivisions(prev=>[...prev,data.division]);

setSuccess("Division created successfully");

};


return(

<div className="min-h-screen bg-[#0f172a] text-white p-10 space-y-10">


{/* HEADER */}

<motion.div
initial={{opacity:0,y:-20}}
animate={{opacity:1,y:0}}
>

<h1 className="text-3xl font-bold">
Manage Divisions
</h1>

<p className="text-gray-400">
Create and manage batch divisions
</p>

</motion.div>



{/* CREATE DIVISION CARD */}

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
whileHover={{scale:1.01}}
className="max-w-xl bg-[#1e293b] border border-white/10 rounded-xl p-6 shadow-lg"
>

<h2 className="text-lg font-semibold mb-5">
Create Division
</h2>

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


<input
placeholder="Division name (e.g. S3-A)"
value={name}
onChange={(e)=>setName(e.target.value)}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 mb-4 outline-none focus:border-cyan-400"
/>


<input
type="number"
placeholder="Semester (e.g. 3)"
value={semester}
onChange={(e)=>setSemester(Number(e.target.value))}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 mb-4 outline-none focus:border-cyan-400"
/>


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


<motion.button
whileHover={{scale:1.03}}
whileTap={{scale:0.96}}
onClick={createDivision}
className="w-full bg-cyan-500 hover:bg-cyan-600 transition rounded-lg p-3 font-semibold"
>

Create Division

</motion.button>

</motion.div>



{/* EXISTING DIVISIONS */}

{divisions.length>0 &&(

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
className="max-w-xl"
>

<h2 className="text-xl font-semibold mb-4">
Existing Divisions
</h2>

<div className="space-y-3">

{divisions.map((d)=>(
<motion.div
key={d._id}
whileHover={{scale:1.02}}
className="bg-[#1e293b] border border-white/10 rounded-lg p-4"
>

<div className="flex justify-between">

<span className="font-semibold">
{d.name}
</span>

<span className="text-gray-400 text-sm">
Semester {d.semester}
</span>

</div>

</motion.div>
))}

</div>

</motion.div>

)}

</div>

);

}