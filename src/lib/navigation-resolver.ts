import { createClient } from "@/lib/supabase/server";
import {
  PINNED_TOP,
  PINNED_BOTTOM,
  MODULE_GROUPS,
  type ResolvedNav,
} from "@/lib/navigation";

export type ShellData = {
  nav: ResolvedNav;
  user: { id: string; fullName: string; email: string; isSuperAdmin: boolean };
  org: { name: string; slug: string; brandColor: string };
};

/**
 * Server-only: resolves the nav + user/org data for the app shell.
 * Returns null if the user is not authenticated.
 *
 * Access source: positions table (via members.profile_id → positions.module_key).
 * Super-admins see all enabled modules regardless of positions.
 */
export async function resolveShell(): Promise<ShellData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Parallel fetches — all go through RLS
  const [profileRes, orgRes, modulesRes, memberRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, org_id, is_super_admin")
      .eq("id", user.id)
      .single(),
    supabase.from("orgs").select("name, slug, brand_color").single(),
    supabase.from("org_modules").select("module_key"),
    // Fetch the user's member record + their positions in one query
    supabase
      .from("members")
      .select("id, positions(module_key)")
      .eq("profile_id", user.id)
      .single(),
  ]);

  const profile = profileRes.data;
  const org = orgRes.data;
  if (!profile || !org) return null;

  const enabledModuleKeys = new Set(
    (modulesRes.data ?? []).map((m) => m.module_key)
  );

  // Build a set of module_keys the user has positions in
  const userModuleKeys = new Set<string>();
  if (memberRes.data) {
    const positions = memberRes.data.positions as
      | { module_key: string }[]
      | null;
    for (const pos of positions ?? []) {
      userModuleKeys.add(pos.module_key);
    }
  }

  // Filter module groups: org enabled it AND (super-admin OR user has a position in that module)
  const visibleGroups = MODULE_GROUPS.filter(
    (g) =>
      enabledModuleKeys.has(g.moduleKey) &&
      (profile.is_super_admin || userModuleKeys.has(g.moduleKey))
  );

  return {
    nav: {
      pinnedTop: PINNED_TOP,
      groups: visibleGroups,
      pinnedBottom: PINNED_BOTTOM,
    },
    user: {
      id: user.id,
      fullName: profile.full_name ?? "",
      email: profile.email ?? user.email ?? "",
      isSuperAdmin: profile.is_super_admin,
    },
    org: {
      name: org.name,
      slug: org.slug,
      brandColor: org.brand_color,
    },
  };
}
