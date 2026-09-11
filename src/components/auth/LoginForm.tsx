"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

/**
 * UI-only for now — this build phase is UI first, real auth (NextAuth +
 * the User model) comes next. DEMO_ACCOUNTS is a placeholder so the
 * login flow (including the error state) can be clicked through before
 * that lands — delete this map once real auth is wired up.
 */
const DEMO_ACCOUNTS: Record<string, { password: string; role: string; landing: string }> = {
  teacher: { password: "demo1234", role: "Teacher", landing: "/teacher/dashboard" },
  student: { password: "demo1234", role: "Student", landing: "/student/dashboard" },
};

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(false);
    setTimeout(() => {
      const account = DEMO_ACCOUNTS[username.trim().toLowerCase()];
      if (account && account.password === password) {
        router.push(account.landing);
        return;
      }
      setPending(false);
      setError(true);
    }, 700);
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error ? <div className="field-error">Incorrect username or password.</div> : null}
      <button type="submit" className="btn block" disabled={pending} style={{ marginTop: "6px" }}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
