import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { SubjectTeacher } from "@/models/SubjectTeacher";
import { Subject } from "@/models/Subject";
import { Batch } from "@/models/Batch";
import { Division } from "@/models/Division";
import { ClassTeacherAssignment } from "@/models/ClassTeacherAssignment";

export async function GET() {
  try {
    await connectDB();

    /* ================= FETCH ALL ================= */

    const teachers = await User.find({ role: "teacher" });
    const students = await User.find({ role: "student" });

    const subjectMappings = await SubjectTeacher.find();
    const subjects = await Subject.find();
    const batches = await Batch.find();
    const divisions = await Division.find();
    const assignments = await ClassTeacherAssignment.find();

    /* ================= TEACHERS ================= */

    const teacherData = teachers.map((t: any) => {
      const mappings = subjectMappings.filter(
        (m: any) => m.teacherId.toString() === t._id.toString()
      );

      const subjectList = mappings.map((m: any) => {
        const subject = subjects.find(
          (s: any) => s._id.toString() === m.subjectId.toString()
        );

        const batch = batches.find(
          (b: any) => b._id.toString() === m.batchId.toString()
        );

        return {
          subjectName: subject?.name || "Unknown",
          batchName: batch
            ? `${batch.name} (${batch.academicYear})`
            : "Unknown"
        };
      });

      return {
        _id: t._id.toString(),
        name: t.name,
        subjects: subjectList
      };
    });

    /* ================= BATCHES ================= */

    const batchData = batches.map((b: any) => {
      const batchDivisions = divisions
        .filter((d: any) => d.batchId.toString() === b._id.toString())
        .map((d: any) => {
          /* ================= CLASS TEACHER ================= */

          // Option A: via ClassTeacherAssignment (preferred)
          const assignment = assignments.find(
            (a: any) => a.divisionId.toString() === d._id.toString()
          );

          let classTeacher = null;

          if (assignment) {
            const teacher = teachers.find(
              (t: any) =>
                t._id.toString() === assignment.teacherId.toString()
            );
            classTeacher = teacher?.name || null;
          }

          // Option B: fallback (if stored directly in Division)
          if (!classTeacher && d.classTeacherId) {
            const teacher = teachers.find(
              (t: any) =>
                t._id.toString() === d.classTeacherId.toString()
            );
            classTeacher = teacher?.name || null;
          }

          /* ================= STUDENTS ================= */

          const divisionStudents = students.filter(
            (s: any) =>
              s.divisionId?.toString() === d._id.toString()
          );

          return {
            _id: d._id.toString(), // 🔥 CRITICAL FIX
            name: d.name,
            classTeacher,
            students: divisionStudents
          };
        });

      return {
        _id: b._id.toString(),
        name: b.name,
        academicYear: b.academicYear,
        divisions: batchDivisions
      };
    });

    /* ================= RESPONSE ================= */

    return NextResponse.json({
      teachers: teacherData,
      batches: batchData
    });

  } catch (error) {
    console.error("OVERVIEW API ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch overview data" },
      { status: 500 }
    );
  }
}