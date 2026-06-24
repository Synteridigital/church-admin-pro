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
 */
export async function resolveShell(): Promise<ShellData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Parallel fetches — all go through RLS
  const [profileRes, orgRes, modulesRes, userRolesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, org_id, is_super_admin")
      .eq("id", user.id)
      .single(),
    supabase.from("orgs").select("name, slug, brand_color").single(),
    supabase.from("org_modules").select("module_key"),
    supabase
      .from("user_roles")
      .select("role_key, roles!inner(module_key)")
      .eq("user_id", user.id),
  ]);

  const profile = profileRes.data;
  const org = orgRes.data;
  if (!profile || !org) return null;

  const enabledModuleKeys = new Set(
    (modulesRes.data ?? []).map((m) => m.module_key)
  );

  // Build a set of module_keys the user has roles in
  const userModuleKeys = new Set<string>();
  for (const ur of userRolesRes.data ?? []) {
    // roles is joined as an object (single row via !inner)
    const roles = ur.roles as unknown as { module_key: string };
    if (roles?.module_key) userModuleKeys.add(roles.module_key);
  }

  // Filter module groups: org must have enabled it AND (super-admin OR user has a matching role)
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
