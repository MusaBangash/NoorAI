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

const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

export default function TeacherAttendancePage() {
  const today = useMemo(() => new Date(), []);
  const minDate = useMemo(() => addDays(today, -BACKFILL_DAYS), [today]);
  const [store, setStore] = useState(() => seedAttendanceStore(today));
  const [sectionId, setSectionId] = useState(classes[0].id);
  const [selectedDate, setSelectedDate] = useState(() => dateKey(today));
  const [noClassDays, setNoClassDays] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

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

      <div className="attendance-controls">
        <div className="section-tabs">
          {classes.map((cls) => (
            <button
              key={cls.id}
              type="button"
              className={`section-tab${sectionId === cls.id ? " active" : ""}`}
              onClick={() => {
                setSectionId(cls.id);
                setSaved(false);
              }}
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

            <div className="roster-list">
              {roster.map((student) => {
                const status = dayRecord[student.id] ?? "present";
                return (
                  <div key={student.id} className="roster-row">
                    <span className="roster-roll">{student.rollNo}</span>
                    <span className="roster-name">{student.name}</span>
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
                  </div>
                );
              })}
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
    </>
  );
}
