"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentDivisionMappingPage() {
  const router = useRouter();

  const [students, setStudents] = useState<any[]>([]);
  const [divisions, setDivisions] = useState<any[]>([]);
  const [selectedDivision, setSelectedDivision] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  // 🔐 Load students & divisions
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("/api/admin/students", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setStudents);

    fetch("/api/admin/divisions", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setDivisions);
  }, []);

  // 🎯 Assign division
  const assignDivision = async (
    studentId: string,
    divisionId: string
  ) => {
    if (!divisionId) return;

    await fetch("/api/admin/students/assign-division", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ studentId, divisionId }),
    });

    setStudents((prev) =>
      prev.map((s) =>
        s._id === studentId
          ? {
              ...s,
              divisionId: divisions.find(
                (d) => d._id === divisionId
              ),
            }
          : s
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 text-white p-10">
      <h1 className="text-4xl font-bold mb-8">
        Student → Division Mapping
      </h1>

      <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-xl p-6 shadow-lg overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-white/70 text-left border-b border-white/20">
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">College ID</th>
              <th className="p-4">Division</th>
              <th className="p-4">Assign</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr
                key={student._id}
                className="border-b border-white/10 hover:bg-white/5"
              >
                <td className="p-4">{student.name}</td>
                <td className="p-4">{student.email}</td>
                <td className="p-4">{student.collegeId}</td>

                <td className="p-4">
                  {student.divisionId?.name || (
                    <span className="text-red-400">
                      Not Assigned
                    </span>
                  )}
                </td>

                <td className="p-4">
                  <select
                    defaultValue=""
                    onChange={(e) =>
                      assignDivision(
                        student._id,
                        e.target.value
                      )
                    }
                    className="bg-white/10 border border-white/20 rounded-lg p-2"
                  >
                    <option value="">Select</option>
                    {divisions.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
