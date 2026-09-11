/**
 * Mock data for the teacher dashboard — UI-first phase, no DB yet.
 * Shape here previews what Attendance/Classes/Quiz queries will
 * eventually return; replace with real fetches once those land.
 */

export const teacherName = "Ayesha Khan";

export const stats = [
  { label: "Active classes", value: "3" },
  { label: "Total students", value: "86" },
  { label: "Today's attendance", value: "62 / 86 marked" },
  { label: "Pending quiz entries", value: "5" },
];

export const todos = [
  { id: "t1", text: "Mark today's attendance — Class 8A", done: false },
  { id: "t2", text: "Mark today's attendance — Class 9C", done: false },
  { id: "t3", text: "Enter Week 6 quiz marks — Class 7B", done: false },
  { id: "t4", text: "Enter Week 6 quiz marks — Class 8A", done: false },
];

export const reminders = [
  { id: "r1", text: "Ali Raza (8A) — attendance dropped to 61% this month", weight: "urgent" as const },
  { id: "r2", text: "Sara Iqbal (7B) — missed the last 3 quizzes", weight: "urgent" as const },
  { id: "r3", text: "Class 9C — average attendance below 70% this week", weight: "important" as const },
];

export const classes = [
  { id: "c1", name: "Class 8A", subject: "Robotics Basics", students: 28 },
  { id: "c2", name: "Class 7B", subject: "Intro to Python", students: 24 },
  { id: "c3", name: "Class 9C", subject: "AI Foundations", students: 34 },
];

export const activity = [
  { id: "a1", text: "Attendance marked for 8A", when: "2 hours ago" },
  { id: "a2", text: "Week 5 quiz marks entered for 9C", when: "yesterday" },
  { id: "a3", text: "New student added to 7B", when: "2 days ago" },
];
