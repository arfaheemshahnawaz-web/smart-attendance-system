//student/reports/history

"use client";

import { useEffect, useState } from "react";

export default function HistoryPage() {

  const [history, setHistory] = useState<any[]>([]);
  const [allSlots, setAllSlots] = useState<string[]>([]);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  useEffect(() => {

    if (!token) return;

    fetch("/api/reports/history", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {

        setHistory(data);

        /* 🔥 COLLECT ALL UNIQUE SLOTS */
        const slots = new Set<string>();

        data.forEach((d: any) => {
          Object.keys(d.slots || {}).forEach((s) => slots.add(s));
        });

        setAllSlots(Array.from(slots).sort());
      });

  }, [token]);

  return (

    <div className="min-h-screen bg-black text-white p-10">

      <h1 className="text-3xl font-bold mb-6">
        Attendance History
      </h1>

      <table className="w-full table-fixed border-collapse">

        <thead className="bg-white/10">
          <tr>
            <th className="p-3">Date</th>
            <th className="p-3">Day</th>

            {allSlots.map((slot, i) => (
              <th key={i} className="p-3 text-sm">
                {slot}
              </th>
            ))}

          </tr>
        </thead>

        <tbody>

          {history.map((h, i) => (
            <tr key={i} className="border-t border-white/10">

              <td className="p-3">{h.date}</td>
              <td className="p-3">{h.day}</td>

              {allSlots.map((slot, idx) => {

                const cell = h.slots?.[slot];

                return (
                  <td key={idx} className="p-2 text-center">

                    {cell ? (
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold
                        ${
                          cell.status === "present"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {cell.subject}
                      </span>
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
  );
}