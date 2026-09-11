"use client";

import { useMemo, useState } from "react";
import "@/styles/attendance.css";
import { classes } from "@/lib/mock/teacher-dashboard";
import {
  addDays,
  BACKFILL_DAYS,
  dateKey,
  rosters,
  seedAttendanceStore,
  STATUS_LABEL,
  type AttendanceStatus,
} from "@/lib/mock/attendance";
import { exportAttendance, exportableDates, type ExportFormat, type ExportScope } from "@/lib/attendance-export";

const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];
const EXPORT_FORMATS: { format: ExportFormat; label: string }[] = [
  { format: "csv", label: "CSV" },
  { format: "xlsx", label: "Excel" },
  { format: "pdf", label: "PDF" },
];

export default function TeacherAttendancePage() {
  const today = useMemo(() => new Date(), []);
  const minDate = useMemo(() => addDays(today, -BACKFILL_DAYS), [today]);
  const [store, setStore] = useState(() => seedAttendanceStore(today));

  // A teacher can cover more than one subject — tabs below only show
  // up when that's actually true, so the common one-subject case stays
  // exactly as simple as before.
  const subjects = useMemo(() => Array.from(new Set(classes.map((c) => c.subject))), []);
  const [subject, setSubject] = useState(subjects[0]);
  const sectionsForSubject = classes.filter((c) => c.subject === subject);

  const [sectionId, setSectionId] = useState(sectionsForSubject[0].id);
  const [selectedDate, setSelectedDate] = useState(() => dateKey(today));
  const [noClassDays, setNoClassDays] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  const [exportScope, setExportScope] = useState<"section" | "all" | "student">("section");
  const [exportStudentId, setExportStudentId] = useState(rosters[sectionsForSubject[0].id][0].id);

  function selectSubject(nextSubject: string) {
    const nextSectionId = classes.find((c) => c.subject === nextSubject)!.id;
    setSubject(nextSubject);
    setSectionId(nextSectionId);
    setExportStudentId(rosters[nextSectionId][0].id);
    setSaved(false);
  }

  function selectSection(nextSectionId: string) {
    setSectionId(nextSectionId);
    setExportStudentId(rosters[nextSectionId][0].id);
    setSaved(false);
  }

  const exportDates = useMemo(() => exportableDates(today), [today]);
  const exportRangeLabel = useMemo(() => {
    const fmt = (key: string) => {
      const [y, m, d] = key.split("-").map(Number);
      return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(y, m - 1, d));
    };
    return `${fmt(exportDates[0])} – ${fmt(exportDates[exportDates.length - 1])}`;
  }, [exportDates]);

  function doExport(format: ExportFormat) {
    const scope: ExportScope =
      exportScope === "all"
        ? { kind: "all" }
        : exportScope === "student"
          ? { kind: "student", sectionId, studentId: exportStudentId }
          : { kind: "section", sectionId };
    exportAttendance(scope, format, store, noClassDays, today);
  }

  const roster = rosters[sectionId];
  const currentSection = classes.find((c) => c.id === sectionId);
  const dayRecord = store[sectionId]?.[selectedDate] ?? {};
  const noClassKey = `${sectionId}|${selectedDate}`;
  const isNoClass = noClassDays[noClassKey] ?? false;

  const counts = useMemo(() => {
    const c: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 };
    roster.forEach((student) => {
      const status = dayRecord[student.id];
      if (status) c[status]++;
    });
    return c;
  }, [roster, dayRecord]);

  function setStatus(studentId: string, status: AttendanceStatus) {
    setSaved(false);
    setStore((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [selectedDate]: { ...prev[sectionId][selectedDate], [studentId]: status },
      },
    }));
  }

  function markAll(status: AttendanceStatus) {
    setSaved(false);
    setStore((prev) => {
      const next: Record<string, AttendanceStatus> = {};
      roster.forEach((student) => (next[student.id] = status));
      return { ...prev, [sectionId]: { ...prev[sectionId], [selectedDate]: next } };
    });
  }

  function toggleNoClass() {
    setSaved(false);
    setNoClassDays((prev) => ({ ...prev, [noClassKey]: !prev[noClassKey] }));
  }

  function onSave() {
    setPending(true);
    setTimeout(() => {
      setPending(false);
      setSaved(true);
    }, 600);
  }

  return (
    <>
      <div className="page-header">
        <h1>Attendance</h1>
        <p>Mark today&apos;s attendance, or fix the last {BACKFILL_DAYS} days.</p>
      </div>

      {subjects.length > 1 ? (
        <div className="pill-tabs subject-tabs">
          {subjects.map((s) => (
            <button
              key={s}
              type="button"
              className={`pill-tab${subject === s ? " active" : ""}`}
              onClick={() => selectSubject(s)}
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <div className="attendance-controls">
        <div className="pill-tabs">
          {sectionsForSubject.map((cls) => (
            <button
              key={cls.id}
              type="button"
              className={`pill-tab${sectionId === cls.id ? " active" : ""}`}
              onClick={() => selectSection(cls.id)}
            >
              {cls.section}
            </button>
          ))}
        </div>

        <div className="date-control">
          <input
            type="date"
            value={selectedDate}
            min={dateKey(minDate)}
            max={dateKey(today)}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSaved(false);
            }}
          />
        </div>

        <label className={`holiday-toggle${isNoClass ? " active" : ""}`}>
          <input type="checkbox" checked={isNoClass} onChange={toggleNoClass} />
          No class today
        </label>
      </div>

      {isNoClass ? (
        <div className="holiday-banner">
          No class marked for {currentSection?.section} on this day — excluded from attendance calculations.
        </div>
      ) : (
        <>
          <div className="attendance-summary">
            {STATUSES.map((status) => (
              <span key={status} className={`summary-chip ${status}`}>
                <span className="dot" aria-hidden />
                {counts[status]} {STATUS_LABEL[status]}
              </span>
            ))}
          </div>

          <div className="card panel">
            <div className="bulk-actions">
              <button type="button" className="btn ghost" onClick={() => markAll("present")}>
                Mark all present
              </button>
              <button type="button" className="btn ghost" onClick={() => markAll("absent")}>
                Mark all absent
              </button>
            </div>

            <div className="roster-table-wrap">
              <table className="roster-table">
                <thead>
                  <tr>
                    <th className="col-roll">Roll</th>
                    <th className="col-name">Name</th>
                    <th className="col-status">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((student) => {
                    const status = dayRecord[student.id] ?? "present";
                    return (
                      <tr key={student.id}>
                        <td className="col-roll">{student.rollNo}</td>
                        <td className="col-name">{student.name}</td>
                        <td className="col-status">
                          <div className="status-group">
                            {STATUSES.map((s) => (
                              <button
                                key={s}
                                type="button"
                                className={`status-btn ${s}${status === s ? " active" : ""}`}
                                onClick={() => setStatus(student.id, s)}
                              >
                                {STATUS_LABEL[s]}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="save-row">
        <button type="button" className="btn" disabled={pending} onClick={onSave}>
          {pending ? "Saving…" : "Save attendance"}
        </button>
        {saved ? <span className="field-hint">Saved (demo only — not persisted to a server yet).</span> : null}
      </div>

      <h2 className="section-title">Export attendance</h2>
      <div className="card export-panel">
        <div className="export-row">
          <div className="pill-tabs">
            <button
              type="button"
              className={`pill-tab${exportScope === "section" ? " active" : ""}`}
              onClick={() => setExportScope("section")}
            >
              This section
            </button>
            <button
              type="button"
              className={`pill-tab${exportScope === "all" ? " active" : ""}`}
              onClick={() => setExportScope("all")}
            >
              All my sections
            </button>
            <button
              type="button"
              className={`pill-tab${exportScope === "student" ? " active" : ""}`}
              onClick={() => setExportScope("student")}
            >
              Single student
            </button>
          </div>
          {exportScope === "student" ? (
            <select
              className="export-student-select"
              value={exportStudentId}
              onChange={(e) => setExportStudentId(e.target.value)}
            >
              {roster.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="export-row">
          <span className="export-range">
            {exportRangeLabel} ({exportDates.length} days) ·{" "}
            {exportScope === "all" ? "every section you teach" : currentSection?.section}
          </span>
          <div className="export-formats">
            {EXPORT_FORMATS.map(({ format, label }) => (
              <button key={format} type="button" className="btn ghost export-btn" onClick={() => doExport(format)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
