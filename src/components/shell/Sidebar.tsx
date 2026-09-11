"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { useAvatar } from "@/lib/useAvatar";

export type NavItem = { href: string; label: string; icon: ComponentType<{ className?: string }> };

export function Sidebar({
  items,
  userName,
  userRole,
  settingsHref,
}: {
  items: NavItem[];
  userName: string;
  userRole: string;
  settingsHref: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [avatar] = useAvatar();
  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <Image src="/noorai-mark.svg" alt="" width={26} height={26} aria-hidden />
        <span>
          <span className="brand-noor">Noor</span>
          <span className="brand-ai">AI</span>
        </span>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`nav-link${isActive ? " active" : ""}`}>
              <Icon className="nav-icon" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <Link href={settingsHref} className="sidebar-user">
          <div className="sidebar-avatar">
            {avatar ? <img src={avatar} alt="" /> : initials}
          </div>
          <div>
            <div className="sidebar-user-name">{userName}</div>
            <div className="sidebar-user-role">{userRole} (demo)</div>
          </div>
        </Link>
        <button type="button" className="btn ghost block" onClick={() => router.push("/login")}>
          Log out
        </button>
      </div>
    </aside>
  );
}
