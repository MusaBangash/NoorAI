/**
 * Attendance export — CSV / Excel / PDF, generated entirely client-side
 * from the same mock store the marking screen uses.
 *
 * Scope is a resolved list of section ids plus an optional single
 * student — the Export tab derives that list from independent filters
 * (course, time, gender, month, student) rather than exposing a scope
 * picker of its own, so exporting always matches exactly what the
 * filters say on screen. One section, several, or all of them are all
 * just "a list of section ids" here — there's no separate "all" case
 * to keep in sync.
 *
 * Section/multi-section exports use a register-grid (one row per
 * student, one column per date) since that's the paper form teachers
 * already know. A single student's export is a plain day-by-day list
 * instead — a grid with one data row doesn't help anyone.
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { classes } from "./mock/teacher-dashboard";
import { formatDateLong, formatDateShort, rosters, STATUS_LABEL, type AttendanceStatus } from "./mock/attendance";

type AttendanceStore = Record<string, Record<string, Record<string, AttendanceStatus>>>;
type NoClassMap = Record<string, boolean>;

/** `studentId` is only honored when `sectionIds` resolves to exactly one section. */
export type ExportScope = { sectionIds: string[]; studentId?: string };

export type ExportFormat = "csv" | "xlsx" | "pdf";

export const STATUS_SHORT: Record<AttendanceStatus, string> = {
  present: "P",
  absent: "A",
  late: "L",
  excused: "E",
};

const BRAND_TEAL: [number, number, number] = [30, 74, 66];
const BRAND_GOLD: [number, number, number] = [166, 124, 0];
const BRAND_RED: [number, number, number] = [198, 92, 59];
const SCHOOL_NAME = "Aisha Cahn College of Computer Science & Design Technology";

const NO_CLASS_MARK = "—";

function slug(text: string): string {
  return text
    .trim()
    .replace(/[()]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Excel sheet names are capped at 31 chars and must be unique per
 * workbook. Two sections that only differ after char 31 (e.g. "AI
 * Powered Graphic Designing — Morning (Boys)" vs "...Morning (Girls)")
 * truncate to the same string, so a straight slice collides — fall
 * back to the section's own id, which is always unique, when that happens.
 */
function uniqueSheetName(cls: { id: string; subject: string; section: string }, used: Set<string>): string {
  const base = slug(`${cls.subject} ${cls.section}`);
  const candidate = base.slice(0, 31);
  if (!used.has(candidate)) {
    used.add(candidate);
    return candidate;
  }
  const suffix = `-${cls.id}`;
  const fallback = `${base.slice(0, 31 - suffix.length)}${suffix}`;
  used.add(fallback);
  return fallback;
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

function averagePercent(rows: GridRow[]): number | null {
  const withData = rows.filter((r): r is GridRow & { percent: number } => r.percent !== null);
  if (withData.length === 0) return null;
  return Math.round(withData.reduce((sum, r) => sum + r.percent, 0) / withData.length);
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
  if (scope.studentId && scope.sectionIds.length === 1) {
    const cls = classes.find((c) => c.id === scope.sectionIds[0])!;
    const student = rosters[scope.sectionIds[0]].find((s) => s.id === scope.studentId)!;
    return `${slug(cls.subject)}_${slug(cls.section)}_${slug(student.name)}`;
  }
  if (scope.sectionIds.length === 1) {
    const cls = classes.find((c) => c.id === scope.sectionIds[0])!;
    return `${slug(cls.subject)}_${slug(cls.section)}`;
  }
  if (scope.sectionIds.length === classes.length) return "All-Sections";
  return `${scope.sectionIds.length}-Sections`;
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

  if (scope.studentId && scope.sectionIds.length === 1) {
    exportStudent(scope.sectionIds[0], scope.studentId, format, store, noClassDays, dates, dateLabels, rangeLabel);
    return;
  }

  const sectionGroups = classes
    .filter((c) => scope.sectionIds.includes(c.id))
    .map((cls) => ({ cls, rows: buildGridRows([cls.id], store, noClassDays, dates) }));
  const rows = sectionGroups.flatMap((g) => g.rows);
  const showSectionColumns = sectionGroups.length > 1;

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
    if (showSectionColumns) {
      // One sheet per section, plus a summary sheet up front — easier
      // for a coordinator to file than one giant undifferentiated table.
      const summarySheet = XLSX.utils.aoa_to_sheet([
        ["NoorAI — Attendance Summary"],
        [rangeLabel],
        [],
        ["Subject", "Section", "Students", "Avg. Attendance"],
        ...sectionGroups.map((g) => [
          g.cls.subject,
          g.cls.section,
          g.rows.length,
          averagePercent(g.rows) === null ? "—" : (averagePercent(g.rows) as number) / 100,
        ]),
      ]);
      summarySheet["!cols"] = [{ wch: 28 }, { wch: 16 }, { wch: 10 }, { wch: 16 }];
      summarySheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      ];
      applyPercentFormat(summarySheet, 4, sectionGroups.length, 3);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      const usedSheetNames = new Set(["Summary"]);
      sectionGroups.forEach((g) => {
        const sheetData = [
          [`${g.cls.subject} — ${g.cls.section}`],
          [rangeLabel],
          [],
          ["Roll No", "Name", ...dateLabels, "% Attendance"],
          ...g.rows.map((r) => [r.rollNo, r.name, ...r.cells, r.percent === null ? "—" : r.percent / 100]),
        ];
        const sheet = XLSX.utils.aoa_to_sheet(sheetData);
        sheet["!merges"] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: dateLabels.length + 2 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: dateLabels.length + 2 } },
        ];
        sheet["!cols"] = [{ wch: 9 }, { wch: 20 }, ...dateLabels.map(() => ({ wch: 6 })), { wch: 12 }];
        applyPercentFormat(sheet, 4, g.rows.length, dateLabels.length + 2);
        XLSX.utils.book_append_sheet(workbook, sheet, uniqueSheetName(g.cls, usedSheetNames));
      });
    } else {
      const cls = sectionGroups[0].cls;
      const sheetData = [
        [`${cls.subject} — ${cls.section}`],
        [rangeLabel],
        [],
        ["Roll No", "Name", ...dateLabels, "% Attendance"],
        ...rows.map((r) => [r.rollNo, r.name, ...r.cells, r.percent === null ? "—" : r.percent / 100]),
      ];
      const sheet = XLSX.utils.aoa_to_sheet(sheetData);
      sheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: dateLabels.length + 2 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: dateLabels.length + 2 } },
      ];
      sheet["!cols"] = [{ wch: 9 }, { wch: 20 }, ...dateLabels.map(() => ({ wch: 6 })), { wch: 12 }];
      applyPercentFormat(sheet, 4, rows.length, dateLabels.length + 2);
      XLSX.utils.book_append_sheet(workbook, sheet, "Attendance");
    }
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    triggerDownload(
      new Blob([buffer], { type: "application/octet-stream" }),
      buildFilename(scope, dates, "xlsx"),
    );
    return;
  }

  // PDF — a branded letterhead per section, one page each, with a
  // summary cover page up front when more than one section is included.
  const doc = new jsPDF({ orientation: "landscape" });
  let needsPage = false;

  if (sectionGroups.length > 1) {
    drawPdfLetterhead(doc, "Attendance Summary", rangeLabel);
    autoTable(doc, {
      startY: 46,
      head: [["Subject", "Section", "Students", "Avg. Attendance"]],
      body: sectionGroups.map((g) => {
        const avg = averagePercent(g.rows);
        return [g.cls.subject, g.cls.section, String(g.rows.length), avg === null ? "—" : `${avg}%`];
      }),
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: BRAND_TEAL },
      alternateRowStyles: { fillColor: [247, 245, 240] },
    });
    needsPage = true;
  }

  sectionGroups.forEach((group) => {
    if (needsPage) doc.addPage();
    needsPage = true;
    drawPdfLetterhead(doc, `${group.cls.subject} — ${group.cls.section}`, rangeLabel);
    autoTable(doc, {
      startY: 46,
      head: [["Roll No", "Name", ...dateLabels, "% Attendance"]],
      body: group.rows.map((r) => [r.rollNo, r.name, ...r.cells, r.percent === null ? "—" : `${r.percent}%`]),
      styles: { fontSize: 8, cellPadding: 2, lineColor: [225, 220, 210], lineWidth: 0.1 },
      headStyles: { fillColor: BRAND_TEAL },
      alternateRowStyles: { fillColor: [250, 248, 244] },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index >= 2 && data.column.index < 2 + dates.length) {
          const value = String(data.cell.raw ?? "");
          if (value === "A") data.cell.styles.textColor = BRAND_RED;
          if (value === "L") data.cell.styles.textColor = BRAND_GOLD;
        }
        if (data.section === "body" && data.column.index === 2 + dates.length) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
  });

  drawPdfFooter(doc);
  triggerDownload(doc.output("blob"), buildFilename(scope, dates, "pdf"));
}

function applyPercentFormat(sheet: XLSX.WorkSheet, startRow: number, rowCount: number, col: number) {
  for (let i = 0; i < rowCount; i++) {
    const ref = XLSX.utils.encode_cell({ r: startRow + i, c: col });
    const cell = sheet[ref];
    if (cell && typeof cell.v === "number") cell.z = "0%";
  }
}

function exportStudent(
  sectionId: string,
  studentId: string,
  format: ExportFormat,
  store: AttendanceStore,
  noClassDays: NoClassMap,
  dates: string[],
  dateLabels: string[],
  rangeLabel: string,
) {
  const scope: ExportScope = { sectionIds: [sectionId], studentId };
  const cls = classes.find((c) => c.id === sectionId)!;
  const student = rosters[sectionId].find((s) => s.id === studentId)!;
  const marks = dates.map((date) => {
    if (noClassDays[`${sectionId}|${date}`]) return NO_CLASS_MARK;
    const status = store[sectionId]?.[date]?.[studentId];
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
      [`${student.name} — ${cls.subject} (${cls.section})`],
      [rangeLabel],
      [],
      ["Date", "Status"],
      ...dates.map((date, i) => [formatDateLong(date), statusText(marks[i])]),
      [],
      ["% Attendance", percent === null ? "—" : percent / 100],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(sheetData);
    sheet["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    ];
    sheet["!cols"] = [{ wch: 18 }, { wch: 14 }];
    const percentRow = 5 + dates.length;
    const percentRef = XLSX.utils.encode_cell({ r: percentRow, c: 1 });
    if (sheet[percentRef] && typeof sheet[percentRef].v === "number") sheet[percentRef].z = "0%";
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Attendance");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    triggerDownload(new Blob([buffer], { type: "application/octet-stream" }), buildFilename(scope, dates, "xlsx"));
    return;
  }

  const doc = new jsPDF({ orientation: "portrait" });
  drawPdfLetterhead(doc, `${student.name} — ${cls.subject} (${cls.section})`, rangeLabel);
  autoTable(doc, {
    startY: 46,
    head: [["Date", "Status"]],
    body: dates.map((date, i) => [formatDateLong(date), statusText(marks[i])]),
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: BRAND_TEAL },
    alternateRowStyles: { fillColor: [250, 248, 244] },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 1) {
        const value = String(data.cell.raw ?? "");
        if (value === "Absent") data.cell.styles.textColor = BRAND_RED;
        if (value === "Late") data.cell.styles.textColor = BRAND_GOLD;
      }
    },
    foot: [["% Attendance", percent === null ? "—" : `${percent}%`]],
    footStyles: { fillColor: [245, 240, 230], textColor: [20, 20, 20], fontStyle: "bold" },
  });
  drawPdfFooter(doc);
  triggerDownload(doc.output("blob"), buildFilename(scope, dates, "pdf"));
}

function drawPdfLetterhead(doc: jsPDF, title: string, rangeLabel: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BRAND_TEAL);
  doc.rect(0, 0, pageWidth, 6, "F");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND_TEAL);
  doc.text("NoorAI", 14, 18);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(SCHOOL_NAME, 14, 23.5);

  doc.setFontSize(9);
  doc.text(`Generated ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date())}`, pageWidth - 14, 18, {
    align: "right",
  });

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text(title, 14, 33);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text(rangeLabel, 14, 39);

  doc.setDrawColor(220, 214, 200);
  doc.line(14, 42, pageWidth - 14, 42);
}

function drawPdfFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(230, 226, 216);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(140, 140, 140);
    doc.text("NoorAI Attendance Register — for internal school use", 14, pageHeight - 7);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: "right" });
  }
}
