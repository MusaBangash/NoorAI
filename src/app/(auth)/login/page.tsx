import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="card login-card">
      <div className="login-logo-row">
        <div className="login-mark">
          <Image src="/noorai-mark.svg" alt="" width={32} height={32} aria-hidden />
        </div>
        <div className="login-brand">
          <span className="brand-noor">Noor</span>
          <span className="brand-ai">AI</span>
        </div>
        <div className="login-sub">AI Lab &amp; Learning Platform</div>
      </div>
      <LoginForm />
      <div className="login-note">Accounts are created by your school admin — there&apos;s no self-signup.</div>
    </div>
  );
}
