"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, LogOut, ChevronDown } from "lucide-react";

type Props = {
  orgName: string;
  brandColor: string;
  userName: string;
  userEmail: string;
  onMenuToggle: () => void;
};

export function Topbar({
  orgName,
  brandColor,
  userName,
  userEmail,
  onMenuToggle,
}: Props) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:pl-64">
      {/* Left: hamburger (mobile) + workspace name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
          className="inline-flex items-center justify-center h-11 w-11 rounded-lg text-gray-600 hover:bg-gray-100 md:hidden focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: brandColor }}
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
            {orgName}
          </span>
        </div>
      </div>

      {/* Right: user menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setUserMenuOpen((o) => !o)}
          aria-expanded={userMenuOpen}
          aria-haspopup="true"
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
            style={{ backgroundColor: brandColor }}
            aria-hidden="true"
          >
            {(userName || userEmail).charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline truncate max-w-[140px]">
            {userName || userEmail}
          </span>
          <ChevronDown size={14} aria-hidden="true" className="text-gray-400" />
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userName}
              </p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <LogOut size={16} aria-hidden="true" className="text-gray-400" />
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
