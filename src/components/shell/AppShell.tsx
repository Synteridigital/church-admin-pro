"use client";

import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { ResolvedNav } from "@/lib/navigation";

type Props = {
  nav: ResolvedNav;
  orgName: string;
  orgSlug: string;
  brandColor: string;
  userName: string;
  userEmail: string;
  children: ReactNode;
};

export function AppShell({
  nav,
  orgName,
  brandColor,
  userName,
  userEmail,
  children,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ "--brand-color": brandColor } as React.CSSProperties}
    >
      <Sidebar
        nav={nav}
        orgName={orgName}
        brandColor={brandColor}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Topbar
        orgName={orgName}
        brandColor={brandColor}
        userName={userName}
        userEmail={userEmail}
        onMenuToggle={() => setMobileOpen((o) => !o)}
      />

      <main className="md:pl-60">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          className: "text-sm",
          duration: 4000,
        }}
        richColors
        closeButton
      />
    </div>
  );
}
