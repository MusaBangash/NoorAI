"use client";

import { useMemo, useState, type CSSProperties } from "react";
import "@/styles/attendance.css";
import { classes } from "@/lib/mock/teacher-dashboard";
import {
  addDays,
  ANALYTICS_DAYS,
  BACKFILL_DAYS,
  dateKey,
  formatDateLong,
  parseDateKey,
  rosters,
  seedAttendanceStore,
  STATUS_LABEL,
  type AttendanceStatus,
} from "@/lib/mock/attendance";
import {
  buildStudentSummaries,
  currentStreak,
  dailyPercents,
  RISK_THRESHOLD,
  sectionOverall,
  type DayMark,
  type StudentSummary,
} from "@/lib/attendance-analytics";
import { exportAttendance, type ExportFormat, type ExportScope } from "@/lib/attendance-export";
import {
  IconActivity,
  IconAlertCircle,
  IconBarChart,
  IconCheckCircle,
  IconChevronRight,
  IconClock,
  IconDownload,
  IconSearch,
} from "@/components/shell/Icons";

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

const MONTH_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

function ringColor(percent: number | null): string {
  if (percent === null) return "var(--line-2)";
  if (percent >= 75) return "var(--deep-teal)";
  if (percent >= 60) return "var(--dawn-gold)";
  return "#c65c3b";
}

export default function TeacherAttendancePage() {
  const today = useMemo(() => new Date(), []);
  const minDate = useMemo(() => addDays(today, -BACKFILL_DAYS), [today]);
  const [store, setStore] = useState(() => seedAttendanceStore(today));

  const [mode, setMode] = useState<"mark" | "analytics" | "export">("mark");

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

  const [focusStudentId, setFocusStudentId] = useState<string>("all");
  const [periodOffset, setPeriodOffset] = useState(0);
  const [studentSearch, setStudentSearch] = useState("");

  // ---- Export — independent filters (course/time/gender/month/student)
  // instead of reusing the Mark/Analytics section pills, so a teacher
  // can pull e.g. "every Evening Girls section across both courses" in
  // one export without switching subject tabs back and forth.
  const [exportCourse, setExportCourse] = useState<string>("all");
  const [exportTime, setExportTime] = useState<"all" | "Morning" | "Evening">("all");
  const [exportGender, setExportGender] = useState<"all" | "Boys" | "Girls">("all");
  const [exportStudentId, setExportStudentId] = useState<string>("all");
  const [exportMonthOffset, setExportMonthOffset] = useState(0);

  function selectSubject(nextSubject: string) {
    const nextSectionId = classes.find((c) => c.subject === nextSubject)!.id;
    setSubject(nextSubject);
    setSectionId(nextSectionId);
    setFocusStudentId("all");
    setPeriodOffset(0);
    setStudentSearch("");
    setSaved(false);
  }

  function selectSection(nextSectionId: string) {
    setSectionId(nextSectionId);
    setFocusStudentId("all");
    setPeriodOffset(0);
    setStudentSearch("");
    setSaved(false);
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
  // periodOffset steps back one real calendar month at a time — the
  // 1st through the actual last day of that month (28/29/30/31), never
  // a rolling window that straddles two different named months.
  const maxPeriodOffset = Math.floor(ANALYTICS_DAYS / 30);

  const monthAnchor = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() - periodOffset, 1),
    [today, periodOffset],
  );

  const analyticsDates = useMemo(() => {
    const year = monthAnchor.getFullYear();
    const month = monthAnchor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => dateKey(new Date(year, month, i + 1)));
  }, [monthAnchor]);

  const periodRangeLabel = MONTH_FORMAT.format(monthAnchor);
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
  const searchedSummaries = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return q ? rankedSummaries.filter((s) => s.student.name.toLowerCase().includes(q)) : rankedSummaries;
  }, [rankedSummaries, studentSearch]);
  // Below-threshold students are surfaced as their own group instead of
  // relying on someone to scroll and eyeball the sort order — that's
  // the whole point of this list.
  const atRiskSummaries = searchedSummaries.filter((s) => s.percent !== null && s.percent < RISK_THRESHOLD);
  const goodStandingSummaries = searchedSummaries
    .filter((s) => s.percent === null || s.percent >= RISK_THRESHOLD)
    .sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1));

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

  // ---- Export ----
  const exportSections = useMemo(
    () =>
      classes.filter(
        (c) =>
          (exportCourse === "all" || c.subject === exportCourse) &&
          (exportTime === "all" || c.time === exportTime) &&
          (exportGender === "all" || c.gender === exportGender),
      ),
    [exportCourse, exportTime, exportGender],
  );
  // The student picker always lists every student the current
  // Course/Shift/Section filters match (grouped by section once more
  // than one matches) — it's never disabled. Picking a name resolves
  // straight to that student's own section for export, regardless of
  // how broad the category filters are, since student ids already
  // encode which section they belong to.
  const exportStudentOptions = useMemo(
    () =>
      exportSections.flatMap((c) =>
        rosters[c.id].map((s) => ({ ...s, sectionId: c.id, subject: c.subject, section: c.section })),
      ),
    [exportSections],
  );
  const exportEffectiveStudentId = exportStudentOptions.some((s) => s.id === exportStudentId) ? exportStudentId : "all";
  const exportSelectedStudent = exportStudentOptions.find((s) => s.id === exportEffectiveStudentId) ?? null;

  const exportMonthAnchor = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() - exportMonthOffset, 1),
    [today, exportMonthOffset],
  );
  const exportDates = useMemo(() => {
    const year = exportMonthAnchor.getFullYear();
    const month = exportMonthAnchor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => dateKey(new Date(year, month, i + 1)));
  }, [exportMonthAnchor]);
  const exportMonthLabel = MONTH_FORMAT.format(exportMonthAnchor);
  const exportTotalStudents = exportSections.reduce((sum, c) => sum + rosters[c.id].length, 0);

  const exportSummary = exportSelectedStudent
    ? `${exportSelectedStudent.name} — ${exportSelectedStudent.subject} · ${exportSelectedStudent.section} · ${exportMonthLabel}`
    : exportSections.length === 0
      ? `No sections match these filters.`
      : exportSections.length === 1
        ? `${exportSections[0].subject} · ${exportSections[0].section} · ${exportMonthLabel} · ${rosters[exportSections[0].id].length} students`
        : `${exportSections.length} sections · ${exportCourse === "all" ? "All courses" : exportCourse} · ${exportMonthLabel} · ${exportTotalStudents} students`;

  function doExport(format: ExportFormat) {
    if (exportSelectedStudent) {
      exportAttendance(
        { sectionIds: [exportSelectedStudent.sectionId], studentId: exportSelectedStudent.id },
        format,
        store,
        noClassDays,
        exportDates,
      );
      return;
    }
    if (exportSections.length === 0) return;
    const scope: ExportScope = { sectionIds: exportSections.map((c) => c.id) };
    exportAttendance(scope, format, store, noClassDays, exportDates);
  }

  function renderRankRow(s: StudentSummary) {
    return (
      <button key={s.student.id} type="button" className="rank-row" onClick={() => setFocusStudentId(s.student.id)}>
        <span className="rank-info">
          <span className="rank-roll">{s.student.rollNo}</span>
          <span className="rank-name">{s.student.name}</span>
        </span>
        <span
          className="rank-ring"
          style={{ "--pct": s.percent ?? 0, "--ring-color": ringColor(s.percent) } as CSSProperties}
        >
          <span className="rank-ring-inner">{s.percent === null ? "—" : `${s.percent}%`}</span>
        </span>
        <IconChevronRight className="rank-chevron" />
      </button>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1>Attendance</h1>
        <p>Mark today&apos;s attendance, fix the last {BACKFILL_DAYS} days, or review the term so far.</p>
      </div>

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
        <button
          type="button"
          className={`pill-tab${mode === "export" ? " active" : ""}`}
          onClick={() => setMode("export")}
        >
          Export records
        </button>
      </div>

      {mode !== "export" && subjects.length > 1 ? (
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

      {mode !== "export" ? (
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
            <div className="period-nav">
              <button
                type="button"
                className="period-nav-btn"
                onClick={() => setPeriodOffset((p) => Math.min(p + 1, maxPeriodOffset))}
                disabled={periodOffset >= maxPeriodOffset}
                aria-label="Previous month"
              >
                ‹
              </button>
              <span className="period-nav-label">{periodRangeLabel}</span>
              <button
                type="button"
                className="period-nav-btn"
                onClick={() => setPeriodOffset((p) => Math.max(p - 1, 0))}
                disabled={periodOffset === 0}
                aria-label="Next month"
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
      ) : null}

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
      ) : mode === "analytics" ? (
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

              <div className="rank-search">
                <span className="rank-search-icon">
                  <IconSearch />
                </span>
                <input
                  type="text"
                  placeholder="Search a student…"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>

              {searchedSummaries.length === 0 ? (
                <p className="rank-empty-note">No students match &ldquo;{studentSearch}&rdquo;.</p>
              ) : (
                <div className="panel-body student-rank-list">
                  <div className="rank-group">
                    <div className="rank-group-title rank-group-title-risk">
                      Needs attention <span className="rank-group-count">{atRiskSummaries.length}</span>
                    </div>
                    {atRiskSummaries.length > 0 ? (
                      atRiskSummaries.map(renderRankRow)
                    ) : (
                      <p className="rank-empty-note">Nobody below {RISK_THRESHOLD}% this period.</p>
                    )}
                  </div>

                  <div className="rank-group">
                    <div className="rank-group-title">
                      Doing well <span className="rank-group-count">{goodStandingSummaries.length}</span>
                    </div>
                    {goodStandingSummaries.map(renderRankRow)}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </>
      ) : (
        <div className="panel card dash-block export-panel">
          <div className="panel-title">
            <span className="panel-title-icon">
              <IconDownload />
            </span>
            <h2>Export records</h2>
          </div>
          <p className="export-intro">
            Filter by course, shift, section and month, then download a branded register — no need to re-pick
            anything you've already selected below.
          </p>

          <div className="export-filters">
            <div className="export-field">
              <span className="export-field-label">Course</span>
              <select className="inline-select" value={exportCourse} onChange={(e) => setExportCourse(e.target.value)}>
                <option value="all">All courses</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="export-field">
              <span className="export-field-label">Shift</span>
              <div className="pill-tabs export-segmented">
                {(["all", "Morning", "Evening"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`pill-tab${exportTime === t ? " active" : ""}`}
                    onClick={() => setExportTime(t)}
                  >
                    {t === "all" ? "All" : t}
                  </button>
                ))}
              </div>
            </div>

            <div className="export-field">
              <span className="export-field-label">Section</span>
              <div className="pill-tabs export-segmented">
                {(["all", "Boys", "Girls"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`pill-tab${exportGender === g ? " active" : ""}`}
                    onClick={() => setExportGender(g)}
                  >
                    {g === "all" ? "All" : g}
                  </button>
                ))}
              </div>
            </div>

            <div className="export-field">
              <span className="export-field-label">Student</span>
              <select
                className="inline-select"
                value={exportEffectiveStudentId}
                disabled={exportStudentOptions.length === 0}
                onChange={(e) => setExportStudentId(e.target.value)}
              >
                <option value="all">Whole section{exportSections.length > 1 ? "s" : ""}</option>
                {exportSections.length > 1
                  ? exportSections.map((c) => (
                      <optgroup key={c.id} label={`${c.subject} — ${c.section}`}>
                        {rosters[c.id].map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                      </optgroup>
                    ))
                  : exportStudentOptions.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
              </select>
              {exportStudentOptions.length === 0 ? (
                <span className="export-field-hint">No students match these filters.</span>
              ) : null}
            </div>
          </div>

          <div className="export-field export-field-month">
            <span className="export-field-label">Month</span>
            <div className="period-nav">
              <button
                type="button"
                className="period-nav-btn"
                onClick={() => setExportMonthOffset((p) => Math.min(p + 1, maxPeriodOffset))}
                disabled={exportMonthOffset >= maxPeriodOffset}
                aria-label="Previous month"
              >
                ‹
              </button>
              <span className="period-nav-label">{exportMonthLabel}</span>
              <button
                type="button"
                className="period-nav-btn"
                onClick={() => setExportMonthOffset((p) => Math.max(p - 1, 0))}
                disabled={exportMonthOffset === 0}
                aria-label="Next month"
              >
                ›
              </button>
            </div>
          </div>

          <div className={`export-summary${exportSections.length === 0 ? " export-summary-empty" : ""}`}>
            {exportSections.length === 0 ? <IconAlertCircle /> : <IconCheckCircle />}
            {exportSummary}
          </div>

          <div className="export-format-row">
            <button
              type="button"
              className="export-format-btn export-format-csv"
              disabled={exportSections.length === 0}
              onClick={() => doExport("csv")}
            >
              <IconDownload className="export-format-icon" />
              <span className="export-format-label">CSV</span>
              <span className="export-format-hint">Plain data, opens anywhere</span>
            </button>
            <button
              type="button"
              className="export-format-btn export-format-xlsx"
              disabled={exportSections.length === 0}
              onClick={() => doExport("xlsx")}
            >
              <IconDownload className="export-format-icon" />
              <span className="export-format-label">Excel</span>
              <span className="export-format-hint">.xlsx, one sheet per section</span>
            </button>
            <button
              type="button"
              className="export-format-btn export-format-pdf"
              disabled={exportSections.length === 0}
              onClick={() => doExport("pdf")}
            >
              <IconDownload className="export-format-icon" />
              <span className="export-format-label">PDF</span>
              <span className="export-format-hint">Branded, ready to print</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
