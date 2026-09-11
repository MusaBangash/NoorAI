/**
 * Mock data for the teacher dashboard — UI-first phase, no DB yet.
 * Shape here previews what Attendance/Classes/Quiz queries will
 * eventually return; replace with real fetches once those land.
 *
 * Reflects the real class structure: a teacher can cover more than
 * one subject, each split into sections by shift (Morning/Evening)
 * and, where relevant, gender (Boys/Girls) — not grade-school-style
 * single classes. The mock teacher below teaches two subjects to show
 * that the UI actually supports it, not just the common one-subject
 * case.
 */

export const teacherName = "Ayesha Khan";

export const stats = [
  { label: "Sections today", value: "4" },
  { label: "Total students", value: "97" },
  { label: "Today's attendance", value: "40 / 71 marked" },
  { label: "Pending quiz entries", value: "5" },
];

export const schedule = [
  { id: "s1", time: "8:00 – 9:30 AM", subject: "AI Engineering", section: "Morning (Boys)", room: "Lab 1" },
  { id: "s2", time: "9:30 – 11:00 AM", subject: "AI Engineering", section: "Morning (Girls)", room: "Lab 1" },
  { id: "s3", time: "2:00 – 3:30 PM", subject: "AI Engineering", section: "Evening (Boys)", room: "Lab 1" },
  { id: "s4", time: "3:30 – 5:00 PM", subject: "AI Engineering", section: "Evening (Girls)", room: "Lab 1" },
];

export type TodoType = "attendance" | "quiz" | "meeting" | "document" | "other";

export const todos: { id: string; text: string; type: TodoType }[] = [
  { id: "t1", text: "Mark attendance — Morning (Boys)", type: "attendance" },
  { id: "t2", text: "Mark attendance — Evening (Girls)", type: "attendance" },
  { id: "t3", text: "Enter Week 6 quiz marks — Morning (Girls)", type: "quiz" },
  { id: "t4", text: "Staff meeting with Program Coordinator — 1:00 PM", type: "meeting" },
  { id: "t5", text: "Submit Foundation batch progress report", type: "document" },
  { id: "t6", text: "Prepare Week 7 lecture slides", type: "other" },
];

export const reminders = [
  { id: "r1", text: "Ali Raza (Morning Boys) — attendance dropped to 61% this month", weight: "urgent" as const },
  { id: "r2", text: "Evening (Girls) — Week 6 quiz average below 50%", weight: "urgent" as const },
  { id: "r3", text: "Diploma renewal paperwork due for 3 students this week", weight: "important" as const },
];

/** One row per section — `subject` groups sections the way the
 * Attendance page's subject tabs do. Every subject follows the same
 * Morning/Evening × Boys/Girls structure for consistency, even if a
 * teacher's course load differs subject to subject. `time`/`gender`
 * are broken out as their own fields (not just parsed from `section`)
 * so the Export filters can query each dimension independently. */
export const classes: {
  id: string;
  subject: string;
  section: string;
  time: "Morning" | "Evening";
  gender: "Boys" | "Girls";
  students: number;
}[] = [
  { id: "c1", subject: "AI Engineering", section: "Morning (Boys)", time: "Morning", gender: "Boys", students: 18 },
  { id: "c2", subject: "AI Engineering", section: "Morning (Girls)", time: "Morning", gender: "Girls", students: 16 },
  { id: "c3", subject: "AI Engineering", section: "Evening (Boys)", time: "Evening", gender: "Boys", students: 20 },
  { id: "c4", subject: "AI Engineering", section: "Evening (Girls)", time: "Evening", gender: "Girls", students: 17 },
  { id: "c5", subject: "AI Powered Graphic Designing", section: "Morning (Boys)", time: "Morning", gender: "Boys", students: 6 },
  { id: "c6", subject: "AI Powered Graphic Designing", section: "Morning (Girls)", time: "Morning", gender: "Girls", students: 6 },
  { id: "c7", subject: "AI Powered Graphic Designing", section: "Evening (Boys)", time: "Evening", gender: "Boys", students: 7 },
  { id: "c8", subject: "AI Powered Graphic Designing", section: "Evening (Girls)", time: "Evening", gender: "Girls", students: 7 },
];

export const activity = [
  { id: "a1", text: "Attendance marked for Morning (Boys)", when: "2 hours ago" },
  { id: "a2", text: "Week 5 quiz marks entered for Evening (Girls)", when: "yesterday" },
  { id: "a3", text: "New student added to Morning (Girls)", when: "2 days ago" },
];
