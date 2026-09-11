"use client";

import { useMemo, useState } from "react";
import "@/styles/attendance.css";
import { classes } from "@/lib/mock/teacher-dashboard";
import {
  addDays,
  ANALYTICS_DAYS,
  BACKFILL_DAYS,
  dateKey,
  formatDateLong,
  parseDateKey,
  rangeDates,
  rosters,
  seedAttendanceStore,
  STATUS_LABEL,
  type AttendanceStatus,
} from "@/lib/mock/attendance";
import {
  buildStudentSummaries,
  currentStreak,
  dailyPercents,
  sectionOverall,
  type DayMark,
} from "@/lib/attendance-analytics";
import { IconActivity, IconAlertCircle, IconBarChart, IconCheckCircle, IconClock } from "@/components/shell/Icons";

const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

const DAY_MARK_COLOR: Record<DayMark, string> = {
  present: "color-mix(in srgb, var(--deep-teal) 70%, var(--bg))",
  late: "color-mix(in srgb, var(--dawn-gold) 60%, var(--bg))",
  absent: "color-mix(in srgb, #c65c3b 60%, var(--bg))",
  // Not var(--indigo-night) — that token *is* --bg in dark mode, so
  // mixing it into --bg is a no-op and the cell disappears into the
  // background. A muted violet reads as "excused" without being
  // confusable with the gold used for Late.
  excused: "color-mix(in srgb, #7c6fa8 60%, var(--bg))",
  "no-class": "var(--line-2)",
  unmarked: "var(--surface)",
};
const DAY_MARK_LABEL: Record<DayMark, string> = {
  present: "Present",
  late: "Late",
  absent: "Absent",
  excused: "Excused",
  "no-class": "No class",
  unmarked: "Not marked",
};

function sectionDayColor(percent: number | null): string {
  if (percent === null) return "var(--line-2)";
  if (percent >= 90) return "color-mix(in srgb, var(--deep-teal) 75%, var(--bg))";
  if (percent >= 75) return "color-mix(in srgb, var(--deep-teal) 40%, var(--bg))";
  if (percent >= 60) return "color-mix(in srgb, var(--dawn-gold) 55%, var(--bg))";
  return "color-mix(in srgb, #c65c3b 55%, var(--bg))";
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const WEEK_SPAN_DAYS = 6; // 7 dates per week period
const MONTH_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

function rankBarColor(percent: number | null): string {
  if (percent === null) return "var(--line-2)";
  if (percent >= 75) return "var(--deep-teal)";
  if (percent >= 60) return "var(--dawn-gold)";
  return "#c65c3b";
}

export default function TeacherAttendancePage() {
  const today = useMemo(() => new Date(), []);
  const minDate = useMemo(() => addDays(today, -BACKFILL_DAYS), [today]);
  const [store, setStore] = useState(() => seedAttendanceStore(today));

  const [mode, setMode] = useState<"mark" | "analytics">("mark");

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

  const [analyticsRange, setAnalyticsRange] = useState<"week" | "month">("week");
  const [focusStudentId, setFocusStudentId] = useState<string>("all");
  const [periodOffset, setPeriodOffset] = useState(0);

  function selectSubject(nextSubject: string) {
    const nextSectionId = classes.find((c) => c.subject === nextSubject)!.id;
    setSubject(nextSubject);
    setSectionId(nextSectionId);
    setFocusStudentId("all");
    setPeriodOffset(0);
    setSaved(false);
  }

  function selectSection(nextSectionId: string) {
    setSectionId(nextSectionId);
    setFocusStudentId("all");
    setPeriodOffset(0);
    setSaved(false);
  }

  function selectAnalyticsRange(next: "week" | "month") {
    setAnalyticsRange(next);
    setPeriodOffset(0);
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

  // ---- Analytics ----
  // periodOffset steps back one whole period at a time — a week for
  // "Week" (rolling 7-day window), or a real calendar month for
  // "Month" (the 1st through the 28th/30th/31st, not just "the last
  // 31 days," which used to straddle two different months).
  const maxPeriodOffset =
    analyticsRange === "week" ? Math.floor(ANALYTICS_DAYS / 7) : Math.floor(ANALYTICS_DAYS / 30);

  const monthAnchor = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() - periodOffset, 1),
    [today, periodOffset],
  );

  const analyticsDates = useMemo(() => {
    if (analyticsRange === "week") {
      const periodEnd = addDays(today, -7 * periodOffset);
      return rangeDates(periodEnd, WEEK_SPAN_DAYS);
    }
    const year = monthAnchor.getFullYear();
    const month = monthAnchor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => dateKey(new Date(year, month, i + 1)));
  }, [analyticsRange, today, periodOffset, monthAnchor]);

  const periodRangeLabel = useMemo(() => {
    if (analyticsRange === "month") return MONTH_FORMAT.format(monthAnchor);
    return `${formatDateLong(analyticsDates[0])} – ${formatDateLong(analyticsDates[analyticsDates.length - 1])}`;
  }, [analyticsRange, monthAnchor, analyticsDates]);
  const summaries = useMemo(
    () => buildStudentSummaries(sectionId, store, noClassDays, analyticsDates),
    [sectionId, store, noClassDays, analyticsDates],
  );
  const overall = useMemo(() => sectionOverall(summaries), [summaries]);
  const focusSummary = focusStudentId === "all" ? null : (summaries.find((s) => s.student.id === focusStudentId) ?? null);
  const dailyPct = useMemo(() => dailyPercents(summaries, analyticsDates), [summaries, analyticsDates]);
  const rankedSummaries = useMemo(
    () => [...summaries].sort((a, b) => (a.percent ?? 100) - (b.percent ?? 100)),
    [summaries],
  );

  const analyticsStats = focusSummary
    ? [
        {
          label: "Attendance",
          value: focusSummary.percent === null ? "—" : `${focusSummary.percent}%`,
          Icon: IconActivity,
        },
        { label: "Current streak", value: `${currentStreak(focusSummary.marks)} days`, Icon: IconClock },
        { label: "Present days", value: String(focusSummary.counts.present), Icon: IconCheckCircle },
        { label: "Absent days", value: String(focusSummary.counts.absent), Icon: IconAlertCircle },
      ]
    : [
        { label: "Section attendance", value: overall.percent === null ? "—" : `${overall.percent}%`, Icon: IconActivity },
        { label: "Present days", value: String(overall.counts.present), Icon: IconCheckCircle },
        { label: "Absent days", value: String(overall.counts.absent), Icon: IconAlertCircle },
        { label: "Late / Excused", value: `${overall.counts.late} / ${overall.counts.excused}`, Icon: IconClock },
      ];

  return (
    <>
      <div className="page-header">
        <h1>Attendance</h1>
        <p>Mark today&apos;s attendance, fix the last {BACKFILL_DAYS} days, or review the term so far.</p>
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

      <div className="pill-tabs mode-tabs">
        <button
          type="button"
          className={`pill-tab${mode === "mark" ? " active" : ""}`}
          onClick={() => setMode("mark")}
        >
          Mark attendance
        </button>
        <button
          type="button"
          className={`pill-tab${mode === "analytics" ? " active" : ""}`}
          onClick={() => setMode("analytics")}
        >
          History &amp; analytics
        </button>
      </div>

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

        {mode === "mark" ? (
          <>
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
          </>
        ) : (
          <>
            <div className="pill-tabs">
              <button
                type="button"
                className={`pill-tab${analyticsRange === "week" ? " active" : ""}`}
                onClick={() => selectAnalyticsRange("week")}
              >
                Week
              </button>
              <button
                type="button"
                className={`pill-tab${analyticsRange === "month" ? " active" : ""}`}
                onClick={() => selectAnalyticsRange("month")}
              >
                Month
              </button>
            </div>

            <div className="period-nav">
              <button
                type="button"
                className="period-nav-btn"
                onClick={() => setPeriodOffset((p) => Math.min(p + 1, maxPeriodOffset))}
                disabled={periodOffset >= maxPeriodOffset}
                aria-label={`Earlier ${analyticsRange}`}
              >
                ‹
              </button>
              <span className="period-nav-label">{periodRangeLabel}</span>
              <button
                type="button"
                className="period-nav-btn"
                onClick={() => setPeriodOffset((p) => Math.max(p - 1, 0))}
                disabled={periodOffset === 0}
                aria-label={`Later ${analyticsRange}`}
              >
                ›
              </button>
              {periodOffset > 0 ? (
                <button type="button" className="period-nav-today" onClick={() => setPeriodOffset(0)}>
                  Jump to current
                </button>
              ) : null}
            </div>

            <select
              className="inline-select"
              value={focusStudentId}
              onChange={(e) => setFocusStudentId(e.target.value)}
            >
              <option value="all">Whole section</option>
              {roster.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {mode === "mark" ? (
        <>
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
        </>
      ) : (
        <>
          <div className="stat-row dash-block">
            {analyticsStats.map(({ label, value, Icon }) => (
              <div key={label} className="card stat-tile">
                <div className="stat-icon">
                  <Icon />
                </div>
                <div>
                  <div className="stat-value">{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="panel card dash-block">
            <div className="panel-title">
              <span className="panel-title-icon">
                <IconActivity />
              </span>
              <h2>
                {focusSummary ? `${focusSummary.student.name} — daily record` : `${currentSection?.section} — daily attendance`}
              </h2>
            </div>

            <div className="heatmap-weekdays">
              {WEEKDAY_LABELS.map((d) => (
                <span key={d} className="heatmap-weekday">
                  {d}
                </span>
              ))}
            </div>
            <div className="heatmap-grid">
              {Array.from({ length: parseDateKey(analyticsDates[0]).getDay() }).map((_, i) => (
                <div key={`blank-${i}`} className="heatmap-cell heatmap-cell-empty" aria-hidden />
              ))}
              {analyticsDates.map((date, i) => {
                const bg = focusSummary ? DAY_MARK_COLOR[focusSummary.marks[i]] : sectionDayColor(dailyPct[i]);
                const label = focusSummary
                  ? DAY_MARK_LABEL[focusSummary.marks[i]]
                  : dailyPct[i] === null
                    ? "No data"
                    : `${dailyPct[i]}% present`;
                return (
                  <div
                    key={date}
                    className="heatmap-cell"
                    style={{ background: bg }}
                    title={`${formatDateLong(date)} — ${label}`}
                  >
                    <span className="heatmap-day">{parseDateKey(date).getDate()}</span>
                  </div>
                );
              })}
            </div>

            <div className="heatmap-legend">
              {focusSummary
                ? (["present", "late", "absent", "excused", "no-class"] as DayMark[]).map((m) => (
                    <span key={m} className="legend-item">
                      <span className="legend-swatch" style={{ background: DAY_MARK_COLOR[m] }} />
                      {DAY_MARK_LABEL[m]}
                    </span>
                  ))
                : [
                    { label: "90%+", color: sectionDayColor(95) },
                    { label: "75–89%", color: sectionDayColor(80) },
                    { label: "60–74%", color: sectionDayColor(65) },
                    { label: "Below 60%", color: sectionDayColor(40) },
                    { label: "No data", color: sectionDayColor(null) },
                  ].map((item) => (
                    <span key={item.label} className="legend-item">
                      <span className="legend-swatch" style={{ background: item.color }} />
                      {item.label}
                    </span>
                  ))}
            </div>
          </div>

          {!focusSummary ? (
            <div className="panel card dash-block">
              <div className="panel-title">
                <span className="panel-title-icon">
                  <IconBarChart />
                </span>
                <h2>Attendance by student</h2>
              </div>
              <div className="panel-body student-rank-list">
                {rankedSummaries.map((s) => (
                  <button
                    key={s.student.id}
                    type="button"
                    className="rank-row"
                    onClick={() => setFocusStudentId(s.student.id)}
                  >
                    <span className="rank-name">{s.student.name}</span>
                    <span className="rank-bar-track">
                      <span
                        className="rank-bar-fill"
                        style={{ width: `${s.percent ?? 0}%`, background: rankBarColor(s.percent) }}
                      />
                    </span>
                    <span className="rank-percent">{s.percent === null ? "—" : `${s.percent}%`}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
