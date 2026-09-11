/**
 * Attendance history & analytics — read-only views over the same mock
 * store the marking screen writes to. Distinct from export: this
 * feeds on-screen charts (heatmap, per-student ranking), not files.
 */

import { attendancePercent, STATUS_SHORT } from "./attendance-export";
import { rosters, type AttendanceStatus, type Student } from "./mock/attendance";

type AttendanceStore = Record<string, Record<string, Record<string, AttendanceStatus>>>;
type NoClassMap = Record<string, boolean>;

export type DayMark = "present" | "absent" | "late" | "excused" | "no-class" | "unmarked";

function dayMark(sectionId: string, studentId: string, date: string, store: AttendanceStore, noClassDays: NoClassMap): DayMark {
  if (noClassDays[`${sectionId}|${date}`]) return "no-class";
  const status = store[sectionId]?.[date]?.[studentId];
  return status ?? "unmarked";
}

export type StudentSummary = {
  student: Student;
  marks: DayMark[];
  percent: number | null;
  counts: Record<AttendanceStatus, number>;
};

export function buildStudentSummaries(
  sectionId: string,
  store: AttendanceStore,
  noClassDays: NoClassMap,
  dates: string[],
): StudentSummary[] {
  return rosters[sectionId].map((student) => {
    const marks = dates.map((date) => dayMark(sectionId, student.id, date, store, noClassDays));
    const counts: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 };
    marks.forEach((m) => {
      if (m !== "no-class" && m !== "unmarked") counts[m]++;
    });
    const percent = attendancePercent(marks.map((m) => (m === "no-class" || m === "unmarked" ? "" : STATUS_SHORT[m])));
    return { student, marks, percent, counts };
  });
}

export function sectionOverall(summaries: StudentSummary[]): {
  percent: number | null;
  counts: Record<AttendanceStatus, number>;
} {
  const counts: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 };
  const allCells: string[] = [];
  summaries.forEach((s) => {
    (["present", "absent", "late", "excused"] as AttendanceStatus[]).forEach((k) => (counts[k] += s.counts[k]));
    s.marks.forEach((m) => allCells.push(m === "no-class" || m === "unmarked" ? "" : STATUS_SHORT[m]));
  });
  return { percent: attendancePercent(allCells), counts };
}

/** Longest current run of Present/Late days, counting back from the most recent marked day. */
export function currentStreak(marks: DayMark[]): number {
  let streak = 0;
  for (let i = marks.length - 1; i >= 0; i--) {
    const m = marks[i];
    if (m === "no-class") continue;
    if (m === "present" || m === "late") {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export const RISK_THRESHOLD = 75;

/** Per-day attendance % across every student in a section, aligned to `dates`. */
export function dailyPercents(summaries: StudentSummary[], dates: string[]): (number | null)[] {
  return dates.map((_, dayIdx) => {
    const cells = summaries.map((s) => {
      const m = s.marks[dayIdx];
      return m === "no-class" || m === "unmarked" ? "" : STATUS_SHORT[m];
    });
    return attendancePercent(cells);
  });
}
