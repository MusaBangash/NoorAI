import "@/styles/shell.css";
import { Sidebar, type NavItem } from "@/components/shell/Sidebar";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { teacherName } from "@/lib/mock/teacher-dashboard";

const NAV_ITEMS: NavItem[] = [
  { href: "/teacher/dashboard", label: "Dashboard" },
  { href: "/teacher/attendance", label: "Attendance" },
  { href: "/teacher/classes", label: "Classes" },
  { href: "/teacher/results", label: "Results" },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar items={NAV_ITEMS} userName={teacherName} userRole="Teacher" />
      <main className="app-main">
        <ThemeToggle />
        {children}
      </main>
    </div>
  );
}
