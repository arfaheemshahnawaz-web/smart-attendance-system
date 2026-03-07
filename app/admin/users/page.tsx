"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function UserApprovalPage() {

const router = useRouter();
const [users,setUsers] = useState<any[]>([]);
const [loading,setLoading] = useState(true);

const token =
typeof window !== "undefined"
? localStorage.getItem("token")
: null;


/* FETCH USERS */

useEffect(()=>{

if(!token){
router.push("/login");
return;
}

fetch("/api/admin/users/pending",{
headers:{ Authorization:`Bearer ${token}` }
})
.then(async(res)=>{

if(!res.ok){
setUsers([]);
setLoading(false);
return;
}

const data = await res.json();

if(Array.isArray(data)){
setUsers(data);
}else{
setUsers([]);
}

setLoading(false);

})
.catch(()=>{
setUsers([]);
setLoading(false);
});

},[]);



/* UPDATE STATUS */

const updateStatus = async(userId:string,status:"approved"|"rejected")=>{

const res = await fetch("/api/admin/users/approve",{
method:"POST",
headers:{
"Content-Type":"application/json",
Authorization:`Bearer ${token}`
},
body:JSON.stringify({userId,status})
});

if(res.ok){
setUsers(prev=>prev.filter(u=>u._id!==userId));
}

};



return(

<div className="min-h-screen bg-[#0f172a] text-white p-10 space-y-10">


{/* HEADER */}

<div>

<h1 className="text-3xl font-bold">
User Approvals
</h1>

<p className="text-gray-400">
Approve or reject student & teacher registrations
</p>

</div>



{/* CARD */}

<motion.div
initial={{opacity:0,y:20}}
animate={{opacity:1,y:0}}
className="bg-[#1e293b] border border-white/10 rounded-xl p-6 overflow-x-auto"
>

{loading && (

<p className="text-gray-400">
Loading pending users...
</p>

)}


{!loading && users.length===0 && (

<p className="text-gray-400">
No pending approvals 
</p>

)}


{!loading && users.length>0 && (

<table className="w-full">

<thead>

<tr className="text-left text-gray-400 border-b border-white/10">

<th className="py-3">Name</th>
<th>Email</th>
<th>Role</th>
<th>College ID</th>
<th>Actions</th>

</tr>

</thead>


<tbody>

{users.map((user)=>(

<tr
key={user._id}
className="border-b border-white/5 hover:bg-white/5 transition"
>

<td className="py-3 font-medium">
{user.name}
</td>

<td className="text-gray-400">
{user.email}
</td>


<td>

<span
className={`px-3 py-1 rounded-full text-xs font-semibold
${
user.role==="student"
? "bg-blue-500/20 text-blue-400"
: "bg-purple-500/20 text-purple-400"
}`}
>

{user.role}

</span>

</td>


<td className="text-gray-400">
{user.collegeId}
</td>


<td className="space-x-2">

<motion.button
whileHover={{scale:1.05}}
whileTap={{scale:0.95}}
onClick={()=>updateStatus(user._id,"approved")}
className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-sm font-semibold"
>

Approve

</motion.button>


<motion.button
whileHover={{scale:1.05}}
whileTap={{scale:0.95}}
onClick={()=>updateStatus(user._id,"rejected")}
className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-semibold"
>

Reject

</motion.button>

</td>

</tr>

))}

</tbody>

</table>

)}

</motion.div>

</div>

);

}