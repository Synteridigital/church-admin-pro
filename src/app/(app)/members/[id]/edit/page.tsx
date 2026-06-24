import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MemberEditForm from "./member-edit-form";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_super_admin) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900">Not authorized</h2>
        <p className="mt-1 text-sm text-gray-500">Only church administrators can edit members.</p>
        <a href="/members" className="mt-3 inline-block text-sm hover:underline" style={{ color: "var(--brand)" }}>Back to directory</a>
      </div>
    );
  }

  const { data: member } = await supabase
    .from("members")
    .select(`id, first_name, last_name, full_name, gender, email, church_email, phone, birth_month, birth_day, birth_year, marital_status, anniversary_date, education_level, education_other, preferred_communication, address_street, address_unit, address_city, address_state, address_zip, membership_status, photo_url`)
    .eq("id", id)
    .single();

  if (!member) notFound();

  // Fetch existing relationships
  const { data: relationships } = await supabase
    .from("member_relationships")
    .select("id, relationship_type, related_member_id, related_member:members!member_relationships_related_member_id_fkey(id, full_name, photo_url)")
    .eq("member_id", id);

  type RelRow = {
    id: string;
    relationship_type: string;
    related_member_id: string;
    related_member: { id: string; full_name: string; photo_url: string | null } | null;
  };

  const rels = (relationships ?? []) as unknown as RelRow[];
  const existingSpouse = rels
    .filter((r) => r.relationship_type === "spouse")
    .map((r) => ({ id: r.related_member_id, fullName: r.related_member?.full_name ?? "Unknown", photoUrl: r.related_member?.photo_url ?? null }));
  const existingChildren = rels
    .filter((r) => r.relationship_type === "parent")
    .map((r) => ({ id: r.related_member_id, fullName: r.related_member?.full_name ?? "Unknown", photoUrl: r.related_member?.photo_url ?? null }));

  // Org members for linking picker
  const { data: orgMembersRaw } = await supabase
    .from("members")
    .select("id, full_name")
    .neq("id", id)
    .order("full_name");

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit member</h1>
        <p className="mt-0.5 text-sm text-gray-500">{member.full_name}</p>
      </div>
      <MemberEditForm
        member={member}
        existingSpouse={existingSpouse}
        existingChildren={existingChildren}
        orgMembers={orgMembersRaw ?? []}
      />
    </>
  );
}
