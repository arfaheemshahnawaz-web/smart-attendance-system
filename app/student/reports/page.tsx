//students/reports/ 

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {

  const router = useRouter();

  const [summary, setSummary] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  useEffect(() => {

    if (!token) return;

    Promise.all([
      fetch("/api/reports/summary", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),

      fetch("/api/reports/subject-wise", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),

    ]).then(([s, sub]) => {
      setSummary(s);
      setSubjects(sub);
    });

  }, [token]);

  if (!summary) return null;

  /* ================= PDF ================= */

  const downloadPDF = () => {

    if (!Array.isArray(subjects)) {
      alert("Report data is still loading.");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Student Attendance Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Total Sessions: ${summary.totalSessions}`, 14, 35);
    doc.text(`Attended Sessions: ${summary.attendedSessions}`, 14, 45);
    doc.text(`Attendance: ${summary.overallPercentage}%`, 14, 55);

    const subjectRows = subjects.map((s) => [
      s.subject,
      s.total,
      s.attended,
      `${s.percentage}%`,
    ]);

    autoTable(doc, {
      startY: 70,
      head: [["Subject", "Total", "Attended", "Percentage"]],
      body: subjectRows,
    });

    doc.save("attendance-report.pdf");
  };

  return (

    <div className="min-h-screen bg-gradient-to-br from-black via-emerald-950 to-black text-white px-10 py-12">

      <h1 className="text-4xl font-bold mb-10">
        Attendance Reports
      </h1>

      {/* 🔥 NAVIGATION BUTTONS */}

      <div className="flex gap-4 mb-10">

        <button
          onClick={() => router.push("/student/reports")}
          className="px-4 py-2 rounded-lg bg-emerald-600"
        >
          Subject Wise
        </button>

        <button
          onClick={() => router.push("/student/reports/history")}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
        >
          Attendance History
        </button>

      </div>

      {/* ================= SUMMARY ================= */}

      <div className="grid md:grid-cols-3 gap-6 mb-16">

        <div className="bg-white/5 p-6 rounded-xl">
          <p>Total Classes</p>
          <h2 className="text-3xl font-bold">
            {summary.totalSessions}
          </h2>
        </div>

        <div className="bg-white/5 p-6 rounded-xl">
          <p>Attended</p>
          <h2 className="text-3xl font-bold">
            {summary.attendedSessions}
          </h2>
        </div>

        <div className="bg-white/5 p-6 rounded-xl">
          <p>Attendance</p>
          <h2 className="text-3xl font-bold">
            {summary.overallPercentage}%
          </h2>
        </div>

      </div>

      {/* REQUIRED */}

      {summary.overallPercentage < 75 && (
        <div className="bg-red-500/10 border border-red-400/20 p-6 rounded-xl mb-10">
          You must attend{" "}
          <b>{summary.requiredClasses}</b> consecutive
          classes to reach 75%.
        </div>
      )}

      {/* ================= SUBJECT TABLE ================= */}

      <h2 className="text-2xl font-semibold mb-6">
        Subject Wise Report
      </h2>

      <table className="w-full table-fixed border-collapse mb-16">

        <thead className="bg-white/10">
          <tr>
            <th className="p-3 text-left w-1/3">Subject</th>
            <th className="p-3 text-left w-1/6">Total</th>
            <th className="p-3 text-left w-1/6">Attended</th>
            <th className="p-3 text-left w-1/6">%</th>
          </tr>
        </thead>

        <tbody>

          {subjects.map((s, i) => (
            <tr key={i} className="border-t border-white/10">
              <td className="p-3">{s.subject}</td>
              <td className="p-3">{s.total}</td>
              <td className="p-3">{s.attended}</td>
              <td className="p-3">{s.percentage}%</td>
            </tr>
          ))}

        </tbody>

      </table>

      {/* DOWNLOAD */}

      <button
        onClick={downloadPDF}
        className="mt-6 bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-lg font-semibold shadow-lg"
      >
        Download PDF
      </button>

    </div>
  );
}