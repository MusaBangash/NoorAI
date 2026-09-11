"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { IconCamera, IconLock, IconUser } from "@/components/shell/Icons";
import { useAvatar } from "@/lib/useAvatar";
import { teacherName } from "@/lib/mock/teacher-dashboard";

/**
 * UI-only for now, same phase as LoginForm — profile/password edits
 * aren't persisted anywhere real yet (no backend/User model). The
 * avatar is the one exception: it's saved to localStorage via
 * useAvatar so it visibly carries over to the sidebar, previewing the
 * feature end-to-end even before real storage exists.
 */
export default function TeacherSettingsPage() {
  const [avatar, setAvatar] = useAvatar();
  const [name, setName] = useState(teacherName);
  const [email, setEmail] = useState("ayesha.khan@example.com");
  const [language, setLanguage] = useState("en");
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function onPickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordSaved(false);
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }
    setPasswordError(null);
    setPasswordSaved(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Update your profile and password. Nothing here is saved to a server yet — UI only for now.</p>
      </div>

      <div className="panel card dash-block">
        <div className="panel-title">
          <span className="panel-title-icon">
            <IconUser />
          </span>
          <h2>Profile</h2>
        </div>

        <div className="settings-avatar-row">
          <div className="settings-avatar">{avatar ? <img src={avatar} alt="" /> : initials}</div>
          <label className="btn ghost settings-upload-btn">
            <IconCamera />
            Change photo
            <input type="file" accept="image/*" onChange={onPickPhoto} hidden />
          </label>
        </div>

        <form onSubmit={onSaveProfile} className="settings-form">
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" value="ayesha.khan" disabled />
            <div className="field-hint">Set by your school admin — contact them to change it.</div>
          </div>
          <div className="field">
            <label htmlFor="email">Email (optional)</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="language">Language</label>
            <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="ur">Urdu</option>
            </select>
          </div>
          {profileSaved ? <div className="field-hint">Saved (demo only — not persisted yet).</div> : null}
          <button type="submit" className="btn">
            Save changes
          </button>
        </form>
      </div>

      <div className="panel card">
        <div className="panel-title">
          <span className="panel-title-icon">
            <IconLock />
          </span>
          <h2>Change password</h2>
        </div>
        <form onSubmit={onChangePassword} className="settings-form">
          <div className="field">
            <label htmlFor="current-password">Current password</label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {passwordError ? <div className="field-error">{passwordError}</div> : null}
          {passwordSaved ? (
            <div className="field-hint">Password updated (demo only — not persisted yet).</div>
          ) : null}
          <button type="submit" className="btn">
            Update password
          </button>
        </form>
      </div>
    </>
  );
}
