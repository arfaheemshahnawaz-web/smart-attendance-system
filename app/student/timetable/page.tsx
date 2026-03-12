"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const HOURS = [
  "09:00-10:00","10:00-11:00","11:00-12:00","12:00-13:00",
  "13:00-14:00","14:00-15:00","15:00-16:00","16:00-17:00",
  "17:00-18:00","18:00-19:00","19:00-20:00","20:00-21:00",
  "21:00-22:00","22:00-23:00",
];

export default function StudentTimetablePage() {

  const router = useRouter();

  const [timetable,setTimetable] = useState<any[]>([]);
  const [message,setMessage] = useState("");
  const [loading,setLoading] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("role")
      : null;

  /* =========================
     AUTH + LOAD TIMETABLE
  ========================= */

  useEffect(() => {

    if (!token || role !== "student") {
      router.replace("/login");
      return;
    }

    fetch("/api/student/timetable",{
      headers:{ Authorization:`Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data=>{
        if(Array.isArray(data)){
          setTimetable(data);
        } else {
          setMessage(data.error || "No timetable found");
        }
      })
      .catch(()=>{
        setMessage("Failed to load timetable");
      });

  },[]);


  /* =========================
     CURRENT SLOT
  ========================= */

  const now = new Date();

  const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];

  const currentHourSlot =
    `${now.getHours().toString().padStart(2,"0")}:00-${
      (now.getHours()+1).toString().padStart(2,"0")
    }:00`;


  const getCell = (day:string,hourSlot:string)=>{
    if(!Array.isArray(timetable)) return null;

    return timetable.find(
      t => t.day === day && t.hourSlot === hourSlot
    );
  };


  /* =========================
     CLICK LOGIC
  ========================= */

  const handleCellClick = async (day:string,hourSlot:string)=>{

    setMessage("");

    if(day !== currentDay || hourSlot !== currentHourSlot){
      setMessage("Attendance allowed only during the current hour");
      return;
    }

    setLoading(true);

    try{

      const res = await fetch("/api/attendance/status",{
        headers:{ Authorization:`Bearer ${token}` }
      });

      const data = await res.json();

      if(!data.active){
        setMessage(data.reason || "Attendance not active");
        return;
      }

      router.push("/student/scan");

    }catch{
      setMessage("Failed to check attendance status");
    }
    finally{
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-emerald-950 to-black text-white px-8 py-10">

      {/* HEADER */}

      <div className="mb-10">
        <h1 className="text-4xl font-bold">
          Weekly Timetable
        </h1>

        <p className="text-emerald-400 mt-2">
          Click the current class slot to mark attendance
        </p>
      </div>


      {/* MESSAGE */}

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-400/20 text-yellow-300">
          {message}
        </div>
      )}

      {loading && (
        <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-400/20 text-blue-300">
          Checking attendance status...
        </div>
      )}


      {/* TABLE */}

      <div className="overflow-x-auto rounded-2xl border border-white/10 backdrop-blur-xl bg-white/5">

        <table className="w-full text-sm">

          <thead className="bg-white/5">
            <tr>
              <th className="p-4 border border-white/10">
                Time
              </th>

              {DAYS.map(day=>(
                <th
                  key={day}
                  className="p-4 border border-white/10"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>


          <tbody>

            {HOURS.map(hour=>(
              <tr key={hour}>

                <td className="p-4 border border-white/10 font-semibold text-emerald-300">
                  {hour}
                </td>

                {DAYS.map(day=>{

                  const cell = getCell(day,hour);

                  const isActive =
                    day === currentDay &&
                    hour === currentHourSlot;

                  return (
                    <td
                      key={day+hour}
                      onClick={()=>cell && handleCellClick(day,hour)}
                      className={`p-4 border border-white/10 text-center transition cursor-pointer

                      ${isActive
                        ? "bg-emerald-500/20 border-emerald-400"
                        : "bg-transparent"}

                      ${cell ? "hover:bg-white/10" : ""}
                      `}
                    >

                      {cell ? (
                        <>
                          <div className="font-semibold">
                            {cell.subject.name}
                          </div>

                          <div className="text-xs text-white/60 mt-1">
                            {cell.teacher.name}
                          </div>
                        </>
                      ) : (
                        "-"
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
}