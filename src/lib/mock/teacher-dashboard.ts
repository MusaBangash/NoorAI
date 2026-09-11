/**
 * Mock data for the teacher dashboard — UI-first phase, no DB yet.
 * Shape here previews what Attendance/Classes/Quiz queries will
 * eventually return; replace with real fetches once those land.
 *
 * Reflects the real class structure: one teacher covers one subject
 * across up to four sections split by shift (Morning/Evening) and
 * gender (Boys/Girls) — not grade-school-style single classes.
 */

export const teacherName = "Ayesha Khan";
export const teacherSubject = "AI Engineering";

export const stats = [
  { label: "Sections today", value: "4" },
  { label: "Total students", value: "71" },
  { label: "Today's attendance", value: "40 / 71 marked" },
  { label: "Pending quiz entries", value: "5" },
];

export const schedule = [
  { id: "s1", time: "8:00 – 9:30 AM", section: "Morning (Boys)", room: "Lab 1" },
  { id: "s2", time: "9:30 – 11:00 AM", section: "Morning (Girls)", room: "Lab 1" },
  { id: "s3", time: "2:00 – 3:30 PM", section: "Evening (Boys)", room: "Lab 1" },
  { id: "s4", time: "3:30 – 5:00 PM", section: "Evening (Girls)", room: "Lab 1" },
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

export const classes = [
  { id: "c1", name: "AI Engineering", section: "Morning (Boys)", students: 18 },
  { id: "c2", name: "AI Engineering", section: "Morning (Girls)", students: 16 },
  { id: "c3", name: "AI Engineering", section: "Evening (Boys)", students: 20 },
  { id: "c4", name: "AI Engineering", section: "Evening (Girls)", students: 17 },
];

export const activity = [
  { id: "a1", text: "Attendance marked for Morning (Boys)", when: "2 hours ago" },
  { id: "a2", text: "Week 5 quiz marks entered for Evening (Girls)", when: "yesterday" },
  { id: "a3", text: "New student added to Morning (Girls)", when: "2 days ago" },
];
