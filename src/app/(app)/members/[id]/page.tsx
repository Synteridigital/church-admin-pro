import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScriptureFooter } from "@/components/ui/ScriptureFooter";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { Mail, Phone, Cake, Shield, UserCheck, BookUser, MapPin } from "lucide-react";
import RelationshipSection from "./relationship-section";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: member } = await supabase
    .from("members")
    .select(`id, full_name, first_name, last_name, gender, email, church_email, phone, birth_month, birth_day, birth_year, membership_status, marital_status, address_formatted, photo_url, profile_id, positions(module_key, type, title)`)
    .eq("id", id)
    .single();

  if (!member) notFound();

  const positions = (member.positions ?? []) as {
    module_key: string;
    type: string;
    title: string | null;
  }[];

  // Fetch relationships with related member info
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
  const spouseRels = rels.filter((r) => r.relationship_type === "spouse");
  const childRels = rels.filter((r) => r.relationship_type === "parent");
  const parentRels = rels.filter((r) => r.relationship_type === "child");

  // Fetch org members for the search picker (only if super admin)
  let orgMembers: { id: string; full_name: string }[] = [];
  if (isSuperAdmin) {
    const { data } = await supabase
      .from("members")
      .select("id, full_name")
      .neq("id", id)
      .order("full_name");
    orgMembers = data ?? [];
  }

  const statusColor =
    member.membership_status === "active"
      ? "bg-emerald-500"
      : member.membership_status === "visitor"
        ? "bg-amber-400"
        : "bg-gray-300";

  // Birthday display
  let bdayText: string | null = null;
  if (member.birth_month && member.birth_day) {
    const monthName = new Date(2000, member.birth_month - 1, 1).toLocaleString("en-US", { month: "long" });
    bdayText = member.birth_year
      ? `${monthName} ${member.birth_day}, ${member.birth_year}`
      : `${monthName} ${member.birth_day}`;
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <MemberAvatar
              fullName={member.full_name}
              photoUrl={member.photo_url}
              size="h-14 w-14"
              textSize="text-lg"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900">
                {member.full_name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 capitalize">
                  <span className={`h-2 w-2 rounded-full ${statusColor}`} aria-hidden="true" />
                  {member.membership_status}
                </span>
                {member.gender && (
                  <span className="text-xs text-gray-400 capitalize">{member.gender}</span>
                )}
                {member.marital_status && (
                  <span className="text-xs text-gray-400 capitalize">{member.marital_status}</span>
                )}
              </div>
              <div className="mt-2">
                {member.profile_id ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    <UserCheck size={12} aria-hidden="true" />
                    Has app access
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                    <BookUser size={12} aria-hidden="true" />
                    Directory only
                  </span>
                )}
              </div>
            </div>
            {isSuperAdmin && (
              <a
                href={`/members/${member.id}/edit`}
                className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ backgroundColor: "var(--brand)", color: "var(--brand-text)" }}
              >
                Edit
              </a>
            )}
          </div>
        </div>

        {/* Contact */}
        <div className="px-6 py-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Contact</h2>
          {member.email && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Mail size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
              <a href={`mailto:${member.email}`} className="hover:underline">{member.email}</a>
            </div>
          )}
          {member.church_email && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Mail size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
              <a href={`mailto:${member.church_email}`} className="hover:underline">{member.church_email}</a>
              <span className="text-xs text-gray-400">(church)</span>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Phone size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
              <a href={`tel:${member.phone}`} className="hover:underline">{member.phone}</a>
            </div>
          )}
          {bdayText && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Cake size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
              {bdayText}
            </div>
          )}
          {member.address_formatted && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <MapPin size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
              {member.address_formatted}
            </div>
          )}
          {!member.email && !member.phone && !bdayText && (
            <p className="text-sm text-gray-400">No contact details on file.</p>
          )}
        </div>

        {/* Family & Relationships */}
        <div className="px-6 py-5 border-t border-gray-100">
          <RelationshipSection
            memberId={member.id}
            spouseRels={spouseRels.map((r) => ({
              id: r.id,
              relatedMemberId: r.related_member_id,
              fullName: r.related_member?.full_name ?? "Unknown",
              photoUrl: r.related_member?.photo_url ?? null,
            }))}
            childRels={childRels.map((r) => ({
              id: r.id,
              relatedMemberId: r.related_member_id,
              fullName: r.related_member?.full_name ?? "Unknown",
              photoUrl: r.related_member?.photo_url ?? null,
            }))}
            parentRels={parentRels.map((r) => ({
              id: r.id,
              relatedMemberId: r.related_member_id,
              fullName: r.related_member?.full_name ?? "Unknown",
              photoUrl: r.related_member?.photo_url ?? null,
            }))}
            orgMembers={orgMembers}
            isSuperAdmin={isSuperAdmin}
          />
        </div>

        {/* Positions */}
        <div className="px-6 py-5 border-t border-gray-100">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Positions</h2>
          {positions.length > 0 ? (
            <div className="space-y-2">
              {positions.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Shield size={16} className="shrink-0" style={{ color: "var(--brand)" }} aria-hidden="true" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{p.title ?? p.type}</span>
                    <span className="text-xs text-gray-500 ml-2 capitalize">
                      {p.module_key.replace(/_/g, " ")} &middot; {p.type.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No positions assigned.</p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <a href="/members" className="text-sm text-gray-500 hover:text-gray-700">&larr; Back to directory</a>
      </div>

      <ScriptureFooter />
    </>
  );
}
