/**
 * Mock attendance data — UI-first phase, no DB yet. Section ids match
 * `classes` in teacher-dashboard.ts. Seeded deterministically (not
 * Math.random) so server-render and client-hydration agree, and so
 * screenshots/tests are reproducible.
 */

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};

export type Student = { id: string; name: string; rollNo: string };

export const rosters: Record<string, Student[]> = {
  c1: [
    "Ali Raza",
    "Ahmed Khan",
    "Hassan Sheikh",
    "Bilal Ahmad",
    "Usman Tariq",
    "Zain Malik",
    "Hamza Iqbal",
    "Talha Farooq",
    "Saad Rafiq",
    "Danish Aziz",
    "Fahad Nawaz",
    "Imran Yousaf",
    "Kashif Mehmood",
    "Rizwan Sadiq",
    "Waqas Anjum",
    "Adeel Hayat",
    "Asad Bhatti",
    "Farhan Siddiqui",
  ].map((name, i) => ({ id: `c1-${i + 1}`, name, rollNo: String(i + 1).padStart(2, "0") })),
  c2: [
    "Ayesha Noor",
    "Fatima Zahra",
    "Zainab Bibi",
    "Maryam Yasin",
    "Sana Parveen",
    "Amna Kausar",
    "Hira Shahid",
    "Sadia Rasheed",
    "Nida Farooq",
    "Rabia Aslam",
    "Sobia Naz",
    "Iqra Latif",
    "Mahnoor Riaz",
    "Areeba Saleem",
    "Laiba Younis",
    "Zoya Hameed",
  ].map((name, i) => ({ id: `c2-${i + 1}`, name, rollNo: String(i + 1).padStart(2, "0") })),
  c3: [
    "Umar Farooq",
    "Faizan Butt",
    "Junaid Chaudhry",
    "Kamran Ilyas",
    "Nabeel Shafiq",
    "Owais Qureshi",
    "Qasim Raza",
    "Salman Javed",
    "Tariq Mehmood",
    "Yasir Habib",
    "Zeeshan Akram",
    "Arslan Naseer",
    "Bilawal Rana",
    "Daniyal Ashraf",
    "Ehtisham Ali",
    "Ghulam Rasool",
    "Haris Bashir",
    "Ibrahim Saleem",
    "Moiz Anwar",
    "Shayan Khalid",
  ].map((name, i) => ({ id: `c3-${i + 1}`, name, rollNo: String(i + 1).padStart(2, "0") })),
  c4: [
    "Hafsa Tariq",
    "Warda Shakeel",
    "Komal Yasir",
    "Sumbal Iqbal",
    "Anum Zafar",
    "Bushra Hanif",
    "Farah Deeba",
    "Ghazala Kausar",
    "Huma Naz",
    "Javeria Sultan",
    "Kiran Aslam",
    "Lubna Rafiq",
    "Mahwish Ali",
    "Noreen Akhtar",
    "Rimsha Younis",
    "Sidra Bano",
    "Tahira Rashid",
  ].map((name, i) => ({ id: `c4-${i + 1}`, name, rollNo: String(i + 1).padStart(2, "0") })),
  c5: [
    "Hamid Sarwar",
    "Rehan Qadir",
    "Shahzaib Butt",
    "Waleed Chaudhry",
    "Ammar Siddiqui",
    "Bilal Sarfraz",
  ].map((name, i) => ({ id: `c5-${i + 1}`, name, rollNo: String(i + 1).padStart(2, "0") })),
  c6: [
    "Aiman Fayyaz",
    "Zara Nawab",
    "Alina Mansoor",
    "Fizza Ilyas",
    "Rida Hussain",
    "Mehak Tabassum",
  ].map((name, i) => ({ id: `c6-${i + 1}`, name, rollNo: String(i + 1).padStart(2, "0") })),
  c7: [
    "Sarmad Yousuf",
    "Hassan Baig",
    "Taimoor Aslam",
    "Faraz Iqbal",
    "Salar Khan",
    "Danyal Waseem",
    "Zohaib Anjum",
  ].map((name, i) => ({ id: `c7-${i + 1}`, name, rollNo: String(i + 1).padStart(2, "0") })),
  c8: [
    "Anaya Rafique",
    "Wajiha Noor",
    "Sehrish Kamal",
    "Ayat Zahra",
    "Mishal Riaz",
    "Aleena Farooq",
    "Nimra Shabbir",
  ].map((name, i) => ({ id: `c8-${i + 1}`, name, rollNo: String(i + 1).padStart(2, "0") })),
};

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateShort(key: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parseDateKey(key));
}

export function formatDateLong(key: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
    parseDateKey(key),
  );
}

/** Every date from `daysBack` days ago through today, oldest first. */
export function rangeDates(today: Date, daysBack: number): string[] {
  const dates: string[] = [];
  for (let offset = daysBack; offset >= 0; offset--) dates.push(dateKey(addDays(today, -offset)));
  return dates;
}

/** How many days back a teacher may still edit — Phase 8 spec. */
export const BACKFILL_DAYS = 7;

/** How many days of read-only history the analytics view can show —
 * viewing past data isn't the same commitment as allowing edits, so
 * this is intentionally longer than BACKFILL_DAYS. */
export const ANALYTICS_DAYS = 30;

function seededStatus(seed: number): AttendanceStatus {
  const r = seed % 20;
  if (r === 0) return "absent";
  if (r === 1) return "late";
  if (r === 2) return "excused";
  return "present";
}

/**
 * Deterministic mock history for the last `days`+1 days per section —
 * defaults to the full analytics window so one store backs both the
 * marking screen (which only lets you edit within BACKFILL_DAYS) and
 * the history/analytics view (which reads further back).
 */
export function seedAttendanceStore(
  today: Date,
  days: number = ANALYTICS_DAYS,
): Record<string, Record<string, Record<string, AttendanceStatus>>> {
  const store: Record<string, Record<string, Record<string, AttendanceStatus>>> = {};
  for (const sectionId of Object.keys(rosters)) {
    store[sectionId] = {};
    for (let dayOffset = 0; dayOffset <= days; dayOffset++) {
      const day = addDays(today, -dayOffset);
      const key = dateKey(day);
      const dayRecord: Record<string, AttendanceStatus> = {};
      rosters[sectionId].forEach((student, i) => {
        dayRecord[student.id] = seededStatus(i * 7 + dayOffset * 3);
      });
      store[sectionId][key] = dayRecord;
    }
  }
  return store;
}
