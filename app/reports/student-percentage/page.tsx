"use client";

import { useState } from "react";

export default function StudentPercentageReport() {
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const fetchPercentageReport = async () => {
    if (!className) {
      alert("Enter class name");
      return;
    }

    setLoading(true);

    const res = await fetch(
      `/api/reports/student-percentage?className=${className}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();
    setStudents(data);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-white p-10">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">
          Student Attendance Percentage
        </h1>
        <p className="text-white/70">
          Overall attendance performance per student
        </p>
      </div>

      {/* Filter */}
      <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6 mb-10 shadow-lg max-w-xl">
        <div className="flex gap-4">
          <input
            placeholder="Class Name (e.g. MCA S4)"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/60 outline-none"
          />

          <button
            onClick={fetchPercentageReport}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 transition rounded-lg px-6 font-semibold"
          >
            {loading ? "Loading..." : "Fetch"}
          </button>
        </div>
      </div>

      {/* Table */}
      {students.length > 0 && (
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">
            Attendance Summary
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-white/70">
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Attended</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Percentage</th>
                </tr>
              </thead>

              <tbody>
                {students.map((s) => (
                  <tr
                    key={s.studentId}
                    className="border-t border-white/10 hover:bg-white/5"
                  >
                    <td className="p-3 font-semibold">
                      {s.name}
                    </td>
                    <td className="p-3 text-white/70">
                      {s.email}
                    </td>
                    <td className="p-3">{s.attended}</td>
                    <td className="p-3">{s.total}</td>
                    <td
                      className={`p-3 font-bold ${
                        s.percentage < 75
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      {s.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
