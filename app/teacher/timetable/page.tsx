"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ArrowLeft } from "lucide-react";

const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export default function TeacherTimetablePage() {

  const router = useRouter();

  const [classes,setClasses] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("role")
      : null;


  useEffect(()=>{

    if(!token || role!=="teacher"){
      router.replace("/login");
      return;
    }

    fetch("/api/teacher/my-classes",{
      headers:{
        Authorization:`Bearer ${token}`
      }
    })
    .then(res=>res.json())
    .then(data=>setClasses(data))
    .finally(()=>setLoading(false));

  },[router,token,role]);


  if(loading) return null;


  return(

<div className="min-h-screen bg-[#0f172a] text-white p-10 space-y-10">


{/* HEADER */}

<div className="flex justify-between items-center">

<div>

<h1 className="text-3xl font-bold flex items-center gap-3">
<CalendarDays className="text-emerald-400"/>
My Timetable
</h1>

<p className="text-gray-400">
Weekly class schedule
</p>

</div>

<button
onClick={()=>router.push("/teacher/dashboard")}
className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg"
>

<ArrowLeft size={16}/>
Dashboard

</button>

</div>



{/* BATCHES */}

{classes.map((batch:any,index:number)=>{

/* collect all time slots */

const slots: string[] = Array.from(
  new Set(
    batch.divisions.map((d:any)=>d.hourSlot)
  )
) as string[];


return(

<div
key={index}
className="bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-lg"
>

<h2 className="text-xl font-semibold text-emerald-400 mb-6">
{batch.batch}
</h2>



{/* TABLE */}

<div className="overflow-x-auto">

<table className="w-full text-sm">

<thead>

<tr className="border-b border-white/10 text-gray-400">

<th className="py-3 px-4 text-left">Time</th>

{days.map(day=>(
<th key={day} className="py-3 px-4 text-left">
{day}
</th>
))}

</tr>

</thead>


<tbody>

{slots.map((slot:string,i:number)=>(

<tr key={i} className="border-b border-white/5">

<td className="py-4 px-4 text-gray-400 font-medium">
{slot}
</td>


{days.map(day=>{

const cls = batch.divisions.find(
(d:any)=>d.day===day && d.hourSlot===slot
);

return(

<td key={day} className="px-4 py-4">

{cls ? (

<div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">

<p className="text-emerald-400 font-semibold">
{cls.subject}
</p>

<p className="text-xs text-gray-400">
Division {cls.division}
</p>

</div>

) : (

<span className="text-gray-600">—</span>

)}

</td>

);

})}

</tr>

))}

</tbody>

</table>

</div>

</div>

);

})}

</div>

);

}