import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScriptureFooter } from "@/components/ui/ScriptureFooter";
import { Mail, Phone, Cake, Shield, UserCheck, BookUser } from "lucide-react";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("members")
    .select(
      "id, full_name, gender, email, phone, birthday, membership_status, photo_url, profile_id, positions(module_key, type, title)"
    )
    .eq("id", id)
    .single();

  if (!member) notFound();

  const positions = (member.positions ?? []) as {
    module_key: string;
    type: string;
    title: string | null;
  }[];

  const initials = member.full_name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const statusColor =
    member.membership_status === "active"
      ? "bg-emerald-500"
      : member.membership_status === "visitor"
        ? "bg-amber-400"
        : "bg-gray-300";

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-gray-100">
          <div className="flex items-start gap-4">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
              style={{
                backgroundColor: "var(--brand)",
                color: "var(--brand-text)",
              }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900">
                {member.full_name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 capitalize">
                  <span
                    className={`h-2 w-2 rounded-full ${statusColor}`}
                    aria-hidden="true"
                  />
                  {member.membership_status}
                </span>
                {member.gender && (
                  <span className="text-xs text-gray-400 capitalize">
                    {member.gender}
                  </span>
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
            <a
              href={`/members/${member.id}/edit`}
              className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                backgroundColor: "var(--brand)",
                color: "var(--brand-text)",
              }}
            >
              Edit
            </a>
          </div>
        </div>

        {/* Contact details */}
        <div className="px-6 py-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Contact
          </h2>
          {member.email && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Mail size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
              <a href={`mailto:${member.email}`} className="hover:underline">
                {member.email}
              </a>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Phone size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
              <a href={`tel:${member.phone}`} className="hover:underline">
                {member.phone}
              </a>
            </div>
          )}
          {member.birthday && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Cake size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
              {new Date(member.birthday + "T00:00:00").toLocaleDateString(
                "en-US",
                { month: "long", day: "numeric", year: "numeric" }
              )}
            </div>
          )}
          {!member.email && !member.phone && !member.birthday && (
            <p className="text-sm text-gray-400">No contact details on file.</p>
          )}
        </div>

        {/* Positions */}
        <div className="px-6 py-5 border-t border-gray-100">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Positions
          </h2>
          {positions.length > 0 ? (
            <div className="space-y-2">
              {positions.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Shield
                    size={16}
                    className="shrink-0"
                    style={{ color: "var(--brand)" }}
                    aria-hidden="true"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {p.title ?? p.type}
                    </span>
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
        <a
          href="/members"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to directory
        </a>
      </div>

      <ScriptureFooter />
    </>
  );
}
