"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function AssignClassTeacherPage() {

const token =
typeof window !== "undefined"
? localStorage.getItem("token")
: null;

const [batches,setBatches] = useState<any[]>([]);
const [divisions,setDivisions] = useState<any[]>([]);
const [teachers,setTeachers] = useState<any[]>([]);

const [batchId,setBatchId] = useState("");
const [divisionId,setDivisionId] = useState("");
const [teacherId,setTeacherId] = useState("");

const [message,setMessage] = useState("");
const [loading,setLoading] = useState(false);


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


/* LOAD TEACHERS */

useEffect(()=>{

fetch("/api/admin/users?role=teacher",{
headers:{ Authorization:`Bearer ${token}` }
})
.then(res=>res.json())
.then(setTeachers);

},[]);


/* ASSIGN TEACHER */

const assignTeacher = async()=>{

setMessage("");

if(!divisionId || !teacherId){
setMessage("Please select division and teacher");
return;
}

setLoading(true);

const res = await fetch("/api/admin/class-teacher",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization:`Bearer ${token}`
},
body:JSON.stringify({divisionId,teacherId})
});

const data = await res.json();

if(!res.ok){
setMessage(data.error || "Failed to assign");
}else{
setMessage("✅ Class teacher assigned successfully");
setTeacherId("");
}

setLoading(false);

};



return(

<div className="min-h-screen bg-[#0f172a] text-white p-10 space-y-10">


{/* HEADER */}

<motion.div
initial={{opacity:0,y:-20}}
animate={{opacity:1,y:0}}
>

<h1 className="text-3xl font-bold">
Assign Class Teacher
</h1>

<p className="text-gray-400">
Assign teachers to manage divisions
</p>

</motion.div>



{/* CARD */}

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
whileHover={{scale:1.01}}
className="max-w-xl bg-[#1e293b] border border-white/10 rounded-xl p-6 shadow-lg space-y-4"
>

{/* Batch */}

<select
value={batchId}
onChange={(e)=>setBatchId(e.target.value)}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 outline-none focus:border-cyan-400"
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



{/* Division */}

<select
value={divisionId}
onChange={(e)=>setDivisionId(e.target.value)}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 outline-none focus:border-cyan-400"
>

<option value="">
Select Division
</option>

{divisions.map((d)=>(
<option key={d._id} value={d._id}>
{d.name} (Sem {d.semester})
</option>
))}

</select>



{/* Teacher */}

<select
value={teacherId}
onChange={(e)=>setTeacherId(e.target.value)}
className="w-full bg-[#0f172a] border border-white/10 rounded-lg p-3 outline-none focus:border-cyan-400"
>

<option value="">
Select Teacher
</option>

{teachers.map((t)=>(
<option key={t._id} value={t._id}>
{t.name} ({t.email})
</option>
))}

</select>



{/* BUTTON */}

<motion.button
whileHover={{scale:1.03}}
whileTap={{scale:0.95}}
onClick={assignTeacher}
disabled={loading}
className="w-full bg-cyan-500 hover:bg-cyan-600 transition rounded-lg p-3 font-semibold"
>

{loading ? "Assigning..." : "Assign Class Teacher"}

</motion.button>



{/* MESSAGE */}

{message && (

<motion.p
initial={{opacity:0}}
animate={{opacity:1}}
className="text-center text-sm text-gray-300"
>

{message}

</motion.p>

)}

</motion.div>

</div>

);

}