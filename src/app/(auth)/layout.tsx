import "@/styles/login.css";
import { ThemeToggle } from "@/components/shell/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <ThemeToggle />
      {children}
    </div>
  );
}
