"use client";

import "@/styles/shell.css";
import { Sidebar, type NavItem } from "@/components/shell/Sidebar";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { IconBarChart, IconCheckCircle, IconHome, IconSettings, IconUsers } from "@/components/shell/Icons";
import { teacherName } from "@/lib/mock/teacher-dashboard";

const NAV_ITEMS: NavItem[] = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: IconHome },
  { href: "/teacher/attendance", label: "Attendance", icon: IconCheckCircle },
  { href: "/teacher/classes", label: "Classes", icon: IconUsers },
  { href: "/teacher/results", label: "Results", icon: IconBarChart },
  { href: "/teacher/settings", label: "Settings", icon: IconSettings },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar items={NAV_ITEMS} userName={teacherName} userRole="Teacher" settingsHref="/teacher/settings" />
      <main className="app-main">
        <ThemeToggle />
        {children}
      </main>
    </div>
  );
}
