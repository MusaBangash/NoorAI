/**
 * Attendance export — CSV / Excel / PDF, generated entirely client-side
 * from the same mock store the marking screen uses. The date range is
 * whatever the caller passes in — it's driven by the same week/month +
 * period-nav the History & analytics view uses, so exporting always
 * matches exactly what's on screen (no separate, disconnected range).
 *
 * Three scopes (Phase 8 spec): a single section, a single student, or
 * every section a teacher covers. Section/whole exports use a
 * register-grid (one row per student, one column per date) since
 * that's the paper form teachers already know. A single student's
 * export is a plain day-by-day list instead — a grid with one data row
 * doesn't help anyone.
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { classes } from "./mock/teacher-dashboard";
import { formatDateLong, formatDateShort, rosters, STATUS_LABEL, type AttendanceStatus } from "./mock/attendance";

type AttendanceStore = Record<string, Record<string, Record<string, AttendanceStatus>>>;
type NoClassMap = Record<string, boolean>;

export type ExportScope =
  | { kind: "section"; sectionId: string }
  | { kind: "all" }
  | { kind: "student"; sectionId: string; studentId: string };

export type ExportFormat = "csv" | "xlsx" | "pdf";

export const STATUS_SHORT: Record<AttendanceStatus, string> = {
  present: "P",
  absent: "A",
  late: "L",
  excused: "E",
};

const NO_CLASS_MARK = "—";

function slug(text: string): string {
  return text
    .trim()
    .replace(/[()]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function attendancePercent(cells: string[]): number | null {
  let attended = 0;
  let counted = 0;
  cells.forEach((mark) => {
    if (mark === STATUS_SHORT.present || mark === STATUS_SHORT.late) {
      attended++;
      counted++;
    } else if (mark === STATUS_SHORT.absent) {
      counted++;
    }
    // excused and no-class/unmarked days are left out of the denominator entirely.
  });
  return counted === 0 ? null : Math.round((attended / counted) * 100);
}

type GridRow = {
  subject: string;
  section: string;
  rollNo: string;
  name: string;
  cells: string[];
  percent: number | null;
};

function buildGridRows(sectionIds: string[], store: AttendanceStore, noClassDays: NoClassMap, dates: string[]): GridRow[] {
  const rows: GridRow[] = [];
  sectionIds.forEach((sectionId) => {
    const cls = classes.find((c) => c.id === sectionId);
    if (!cls) return;
    rosters[sectionId].forEach((student) => {
      const cells = dates.map((date) => {
        if (noClassDays[`${sectionId}|${date}`]) return NO_CLASS_MARK;
        const status = store[sectionId]?.[date]?.[student.id];
        return status ? STATUS_SHORT[status] : "";
      });
      rows.push({
        subject: cls.subject,
        section: cls.section,
        rollNo: student.rollNo,
        name: student.name,
        cells,
        percent: attendancePercent(cells),
      });
    });
  });
  return rows;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function scopeFilenamePart(scope: ExportScope): string {
  if (scope.kind === "all") return "All-Sections";
  if (scope.kind === "section") {
    const cls = classes.find((c) => c.id === scope.sectionId)!;
    return `${slug(cls.subject)}_${slug(cls.section)}`;
  }
  const cls = classes.find((c) => c.id === scope.sectionId)!;
  const student = rosters[scope.sectionId].find((s) => s.id === scope.studentId)!;
  return `${slug(cls.subject)}_${slug(cls.section)}_${slug(student.name)}`;
}

function buildFilename(scope: ExportScope, dates: string[], ext: string): string {
  const range = `${dates[0]}_to_${dates[dates.length - 1]}`;
  return `NoorAI_Attendance_${scopeFilenamePart(scope)}_${range}.${ext}`;
}

// ---------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function rowsToCsv(header: string[], rows: string[][]): string {
  return [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

// ---------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------

export function exportAttendance(
  scope: ExportScope,
  format: ExportFormat,
  store: AttendanceStore,
  noClassDays: NoClassMap,
  dates: string[],
) {
  const dateLabels = dates.map(formatDateShort);
  const rangeLabel = `${formatDateLong(dates[0])} – ${formatDateLong(dates[dates.length - 1])}`;

  if (scope.kind === "student") {
    exportStudent(scope, format, store, noClassDays, dates, dateLabels, rangeLabel);
    return;
  }

  const sectionIds = scope.kind === "all" ? classes.map((c) => c.id) : [scope.sectionId];
  const rows = buildGridRows(sectionIds, store, noClassDays, dates);
  const showSectionColumns = scope.kind === "all";

  if (format === "csv") {
    const header = [
      ...(showSectionColumns ? ["Subject", "Section"] : []),
      "Roll No",
      "Name",
      ...dateLabels,
      "% Attendance",
    ];
    const body = rows.map((r) => [
      ...(showSectionColumns ? [r.subject, r.section] : []),
      r.rollNo,
      r.name,
      ...r.cells,
      r.percent === null ? "—" : `${r.percent}%`,
    ]);
    triggerDownload(
      new Blob([rowsToCsv(header, body)], { type: "text/csv;charset=utf-8" }),
      buildFilename(scope, dates, "csv"),
    );
    return;
  }

  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();
    if (scope.kind === "all") {
      // One sheet per section, plus a summary sheet — easier for a
      // coordinator to file than one giant undifferentiated table.
      classes.forEach((cls) => {
        const sectionRows = rows.filter((r) => r.subject === cls.subject && r.section === cls.section);
        if (sectionRows.length === 0) return;
        const sheetData = [
          ["Roll No", "Name", ...dateLabels, "% Attendance"],
          ...sectionRows.map((r) => [r.rollNo, r.name, ...r.cells, r.percent === null ? "—" : r.percent / 100]),
        ];
        const sheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, sheet, slug(`${cls.subject} ${cls.section}`).slice(0, 31));
      });
      const summarySheet = XLSX.utils.aoa_to_sheet([
        ["Subject", "Section", "Roll No", "Name", "% Attendance"],
        ...rows.map((r) => [r.subject, r.section, r.rollNo, r.name, r.percent === null ? "—" : r.percent / 100]),
      ]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    } else {
      const sheetData = [
        ["Roll No", "Name", ...dateLabels, "% Attendance"],
        ...rows.map((r) => [r.rollNo, r.name, ...r.cells, r.percent === null ? "—" : r.percent / 100]),
      ];
      const sheet = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, sheet, "Attendance");
    }
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    triggerDownload(
      new Blob([buffer], { type: "application/octet-stream" }),
      buildFilename(scope, dates, "xlsx"),
    );
    return;
  }

  // PDF — one branded, formatted table per section (own page when there's more than one).
  const doc = new jsPDF({ orientation: "landscape" });
  const sectionGroups =
    scope.kind === "all"
      ? classes.map((cls) => ({ cls, rows: rows.filter((r) => r.subject === cls.subject && r.section === cls.section) }))
      : [{ cls: classes.find((c) => c.id === scope.sectionId)!, rows }];

  sectionGroups.forEach((group, i) => {
    if (i > 0) doc.addPage();
    drawPdfLetterhead(doc, `${group.cls.subject} — ${group.cls.section}`, rangeLabel);
    autoTable(doc, {
      startY: 44,
      head: [["Roll No", "Name", ...dateLabels, "% Attendance"]],
      body: group.rows.map((r) => [r.rollNo, r.name, ...r.cells, r.percent === null ? "—" : `${r.percent}%`]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [30, 74, 66] },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index >= 2 && data.column.index < 2 + dates.length) {
          const value = String(data.cell.raw ?? "");
          if (value === "A") data.cell.styles.textColor = [198, 92, 59];
          if (value === "L") data.cell.styles.textColor = [166, 124, 0];
        }
      },
    });
  });
  triggerDownload(doc.output("blob"), buildFilename(scope, dates, "pdf"));
}

function exportStudent(
  scope: Extract<ExportScope, { kind: "student" }>,
  format: ExportFormat,
  store: AttendanceStore,
  noClassDays: NoClassMap,
  dates: string[],
  dateLabels: string[],
  rangeLabel: string,
) {
  const cls = classes.find((c) => c.id === scope.sectionId)!;
  const student = rosters[scope.sectionId].find((s) => s.id === scope.studentId)!;
  const marks = dates.map((date) => {
    if (noClassDays[`${scope.sectionId}|${date}`]) return NO_CLASS_MARK;
    const status = store[scope.sectionId]?.[date]?.[scope.studentId];
    return status ? STATUS_SHORT[status] : "";
  });
  const percent = attendancePercent(marks);
  const statusText = (mark: string) =>
    mark === NO_CLASS_MARK
      ? "No class"
      : mark
        ? STATUS_LABEL[(Object.keys(STATUS_SHORT) as AttendanceStatus[]).find((k) => STATUS_SHORT[k] === mark)!]
        : "Not marked";

  if (format === "csv") {
    const header = ["Date", "Status"];
    const body = dates.map((date, i) => [formatDateLong(date), statusText(marks[i])]);
    body.push(["% Attendance", percent === null ? "—" : `${percent}%`]);
    triggerDownload(
      new Blob([rowsToCsv(header, body)], { type: "text/csv;charset=utf-8" }),
      buildFilename(scope, dates, "csv"),
    );
    return;
  }

  if (format === "xlsx") {
    const sheetData = [
      ["Date", "Status"],
      ...dates.map((date, i) => [formatDateLong(date), statusText(marks[i])]),
      [],
      ["% Attendance", percent === null ? "—" : percent / 100],
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(sheetData), "Attendance");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    triggerDownload(new Blob([buffer], { type: "application/octet-stream" }), buildFilename(scope, dates, "xlsx"));
    return;
  }

  const doc = new jsPDF({ orientation: "portrait" });
  drawPdfLetterhead(doc, `${student.name} — ${cls.subject} (${cls.section})`, rangeLabel);
  autoTable(doc, {
    startY: 44,
    head: [["Date", "Status"]],
    body: dates.map((date, i) => [formatDateLong(date), statusText(marks[i])]),
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [30, 74, 66] },
    foot: [["% Attendance", percent === null ? "—" : `${percent}%`]],
    footStyles: { fillColor: [245, 240, 230], textColor: [20, 20, 20], fontStyle: "bold" },
  });
  triggerDownload(doc.output("blob"), buildFilename(scope, dates, "pdf"));
}

function drawPdfLetterhead(doc: jsPDF, title: string, rangeLabel: string) {
  doc.setFontSize(16);
  doc.setTextColor(30, 74, 66);
  doc.text("NoorAI", 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text("Attendance Register", 14, 22);
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(title, 14, 30);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(rangeLabel, 14, 36);
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 39, doc.internal.pageSize.getWidth() - 14, 39);
}
