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
    "Aiman Fayyaz",
    "Rehan Qadir",
    "Zara Nawab",
    "Shahzaib Butt",
    "Alina Mansoor",
    "Waleed Chaudhry",
    "Fizza Ilyas",
    "Ammar Siddiqui",
    "Rida Hussain",
    "Bilal Sarfraz",
    "Mehak Tabassum",
  ].map((name, i) => ({ id: `c5-${i + 1}`, name, rollNo: String(i + 1).padStart(2, "0") })),
  c6: [
    "Sarmad Yousuf",
    "Anaya Rafique",
    "Hassan Baig",
    "Wajiha Noor",
    "Taimoor Aslam",
    "Sehrish Kamal",
    "Faraz Iqbal",
    "Ayat Zahra",
    "Salar Khan",
    "Mishal Riaz",
    "Danyal Waseem",
    "Aleena Farooq",
    "Zohaib Anjum",
    "Nimra Shabbir",
  ].map((name, i) => ({ id: `c6-${i + 1}`, name, rollNo: String(i + 1).padStart(2, "0") })),
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

/** How many days back a teacher may still edit — Phase 8 spec. */
export const BACKFILL_DAYS = 7;

function seededStatus(seed: number): AttendanceStatus {
  const r = seed % 20;
  if (r === 0) return "absent";
  if (r === 1) return "late";
  if (r === 2) return "excused";
  return "present";
}

/**
 * Deterministic mock history for the last BACKFILL_DAYS+1 days per
 * section, so the marking screen has something to show/edit instead
 * of opening empty every time.
 */
export function seedAttendanceStore(today: Date): Record<string, Record<string, Record<string, AttendanceStatus>>> {
  const store: Record<string, Record<string, Record<string, AttendanceStatus>>> = {};
  for (const sectionId of Object.keys(rosters)) {
    store[sectionId] = {};
    for (let dayOffset = 0; dayOffset <= BACKFILL_DAYS; dayOffset++) {
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
