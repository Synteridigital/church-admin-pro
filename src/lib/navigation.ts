// ─── Nav structure for the app shell ───
// Adding a department later = adding one NavGroup entry to MODULE_GROUPS.

export type NavLink = {
  label: string;
  href: string;
  /** lucide-react icon name (PascalCase) */
  icon: string;
};

export type NavGroup = {
  moduleKey: string;
  label: string;
  icon: string;
  links: NavLink[];
};

export type ResolvedNav = {
  pinnedTop: NavLink[];
  groups: NavGroup[];
  pinnedBottom: NavLink[];
};

/** Always visible to every logged-in user, not module-gated. */
export const PINNED_TOP: NavLink[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Announcements", href: "/announcements", icon: "Megaphone" },
  { label: "Members", href: "/members", icon: "Users" },
];

/** Always visible at the bottom. */
export const PINNED_BOTTOM: NavLink[] = [
  { label: "My Profile", href: "/profile", icon: "CircleUser" },
  { label: "Resource Center", href: "/resources", icon: "BookOpen" },
  { label: "Support", href: "/support", icon: "LifeBuoy" },
];

/** Module-gated groups. Visible only if the org enabled the module AND the user has a role in it (or is super-admin). */
export const MODULE_GROUPS: NavGroup[] = [
  {
    moduleKey: "sabbath_ops",
    label: "Sabbath Operations",
    icon: "Church",
    links: [
      { label: "Order of Service", href: "/sabbath/order-of-service", icon: "ListOrdered" },
      { label: "Duty Schedule", href: "/sabbath/duty-schedule", icon: "CalendarClock" },
      { label: "Service Log", href: "/sabbath/service-log", icon: "ClipboardList" },
    ],
  },
  {
    moduleKey: "treasury",
    label: "Treasury",
    icon: "Landmark",
    links: [
      { label: "Fund Requests", href: "/treasury/fund-requests", icon: "HandCoins" },
      { label: "Budgets", href: "/treasury/budgets", icon: "ChartPie" },
    ],
  },
];
