import { createClient } from "@/lib/supabase/server";
import { ScriptureFooter } from "@/components/ui/ScriptureFooter";
import { ErrorState } from "@/components/ui/states/ErrorState";
import { EmptyState } from "@/components/ui/states/EmptyState";
import MemberDirectoryClient from "./member-directory-client";

export type MemberRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  membership_status: string;
  profile_id: string | null;
  photo_url: string | null;
  positions: { module_key: string; type: string; title: string | null }[];
};

export default async function MembersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user!.id)
    .single();

  const isSuperAdmin = profile?.is_super_admin ?? false;

  const { data: members, error } = await supabase
    .from("members")
    .select("id, full_name, email, phone, gender, membership_status, profile_id, photo_url, positions(module_key, type, title)")
    .order("full_name");

  if (error) {
    return <ErrorState message="Could not load members. Please try again." />;
  }

  if (!members || members.length === 0) {
    return (
      <>
        <EmptyState
          icon="Users"
          headline="No members yet"
          description="Add your first church member to get started."
          actionLabel={isSuperAdmin ? "Add member" : undefined}
          actionHref={isSuperAdmin ? "/members/intake" : undefined}
        />
        <ScriptureFooter />
      </>
    );
  }

  const rows: MemberRow[] = members.map((m) => ({
    ...m,
    positions: (m.positions ?? []) as MemberRow["positions"],
  }));

  return (
    <>
      <MemberDirectoryClient
        members={rows}
        isSuperAdmin={isSuperAdmin}
      />
      <ScriptureFooter />
    </>
  );
}
