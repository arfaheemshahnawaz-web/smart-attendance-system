"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DivisionDetails(){

const { id } = useParams();
const router = useRouter();

const [data,setData] = useState<any>(null);

useEffect(()=>{

const token = localStorage.getItem("token");

fetch(`/api/admin/divisions/${id}`,{
headers:{ Authorization:`Bearer ${token}` }
})
.then(async(res)=>{

if(!res.ok){
const err = await res.text();
console.error("API ERROR:", err);
throw new Error("Failed to load division");
}

return res.json();

})
.then(setData)
.catch(err=>{
console.error("FETCH ERROR:",err);
});


},[id]);

if(!data){
return <p className="p-10 text-white">Loading...</p>;
}

return(

<div className="min-h-screen bg-[#0f172a] text-white p-10 space-y-6">

<button
onClick={()=>router.back()}
className="text-sm text-blue-400 hover:underline"
>
← Back
</button>

<h1 className="text-2xl font-bold">
Division {data.name}
</h1>

<p className="text-gray-400">
Class Teacher: {data.classTeacher || "Not Assigned"}
</p>

<div className="bg-[#1e293b] p-6 rounded-xl">

<h2 className="text-lg font-semibold mb-4">
Students ({data.students.length})
</h2>

<div className="grid md:grid-cols-2 gap-3">

{data.students.map((s:any)=>(
<div key={s._id} className="bg-white/5 p-3 rounded">

<p className="font-medium">{s.name}</p>
<p className="text-sm text-gray-400">{s.email}</p>

</div>
))}

</div>

</div>

</div>

);

console.log("PARAM ID:", id);
}