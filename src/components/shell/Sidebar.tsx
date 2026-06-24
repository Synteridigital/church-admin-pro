"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { icons } from "lucide-react";
import type { ResolvedNav, NavLink, NavGroup } from "@/lib/navigation";

type Props = {
  nav: ResolvedNav;
  orgName: string;
  brandColor: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

const STORAGE_KEY = "cap:sidebar-collapsed";

function getIcon(name: string) {
  return icons[name as keyof typeof icons] ?? icons.Circle;
}

function NavItem({
  link,
  active,
  brandColor,
  onClick,
}: {
  link: NavLink;
  active: boolean;
  brandColor: string;
  onClick?: () => void;
}) {
  const Icon = getIcon(link.icon);
  return (
    <a
      href={link.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      style={
        active
          ? { backgroundColor: brandColor + "14", color: brandColor }
          : { color: "#374151" }
      }
    >
      <Icon
        size={18}
        aria-hidden="true"
        style={active ? { color: brandColor } : { color: "#6b7280" }}
      />
      <span>{link.label}</span>
    </a>
  );
}

function GroupSection({
  group,
  brandColor,
  pathname,
  onNavigate,
  defaultOpen,
  onToggle,
}: {
  group: NavGroup;
  brandColor: string;
  pathname: string;
  onNavigate?: () => void;
  defaultOpen: boolean;
  onToggle: (moduleKey: string, open: boolean) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = getIcon(group.icon);
  const Chevron = icons.ChevronRight;

  const hasActiveChild = group.links.some((l) => pathname === l.href);

  function toggle() {
    const next = !open;
    setOpen(next);
    onToggle(group.moduleKey, next);
  }

  return (
    <div>
      <button
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        style={
          hasActiveChild && !open
            ? { backgroundColor: brandColor + "14", color: brandColor }
            : undefined
        }
      >
        <Icon
          size={18}
          aria-hidden="true"
          className="shrink-0"
          style={
            hasActiveChild ? { color: brandColor } : { color: "#6b7280" }
          }
        />
        <span className="flex-1 text-left">{group.label}</span>
        <Chevron
          size={14}
          aria-hidden="true"
          className="shrink-0 text-gray-400 transition-transform motion-reduce:transition-none"
          style={open ? { transform: "rotate(90deg)" } : undefined}
        />
      </button>
      {open && (
        <div className="ml-5 mt-0.5 space-y-0.5 border-l border-gray-200 pl-3">
          {group.links.map((link) => (
            <NavItem
              key={link.href}
              link={link}
              active={pathname === link.href}
              brandColor={brandColor}
              onClick={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  nav,
  orgName,
  brandColor,
  mobileOpen,
  onMobileClose,
}: Props) {
  const pathname = usePathname();

  // Persist collapsed state per group
  const [collapsedState, setCollapsedState] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCollapsedState(JSON.parse(raw));
    } catch {}
  }, []);

  const handleToggle = useCallback(
    (moduleKey: string, open: boolean) => {
      setCollapsedState((prev) => {
        const next = { ...prev, [moduleKey]: open };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  // Close mobile drawer on route change
  useEffect(() => {
    onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand header */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-200">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ backgroundColor: brandColor }}
          aria-hidden="true"
        >
          {orgName.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-semibold text-gray-900 truncate">
          {orgName}
        </span>
      </div>

      {/* Scrollable nav */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
        aria-label="Main navigation"
      >
        {/* Pinned top */}
        {nav.pinnedTop.map((link) => (
          <NavItem
            key={link.href}
            link={link}
            active={pathname === link.href}
            brandColor={brandColor}
            onClick={onMobileClose}
          />
        ))}

        {/* Module groups */}
        {nav.groups.length > 0 && (
          <>
            <div className="my-2 border-t border-gray-200" />
            {nav.groups.map((group) => (
              <GroupSection
                key={group.moduleKey}
                group={group}
                brandColor={brandColor}
                pathname={pathname}
                onNavigate={onMobileClose}
                defaultOpen={collapsedState[group.moduleKey] ?? false}
                onToggle={handleToggle}
              />
            ))}
          </>
        )}

        {/* Pinned bottom */}
        <div className="my-2 border-t border-gray-200" />
        {nav.pinnedBottom.map((link) => (
          <NavItem
            key={link.href}
            link={link}
            active={pathname === link.href}
            brandColor={brandColor}
            onClick={onMobileClose}
          />
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-60 md:border-r md:border-gray-200 md:bg-white">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg md:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
