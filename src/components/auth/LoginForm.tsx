"use client";

import { useState, type FormEvent } from "react";

/**
 * UI-only for now — this build phase is UI first, auth wiring (NextAuth +
 * the User model) comes next. Submitting just previews the pending/notice
 * states the real flow will use.
 */
export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setSubmitted(false);
    setTimeout(() => {
      setPending(false);
      setSubmitted(true);
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
      {submitted ? (
        <div className="field-hint">Sign-in isn&apos;t wired up yet — this screen is UI only for now.</div>
      ) : null}
      <button type="submit" className="btn block" disabled={pending} style={{ marginTop: "6px" }}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
