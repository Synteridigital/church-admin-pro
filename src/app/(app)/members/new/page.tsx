import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MemberForm from "../member-form";

export default async function NewMemberPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin, org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.is_super_admin) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900">
          Not authorized
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Only church administrators can add members.
        </p>
        <a
          href="/members"
          className="mt-3 inline-block text-sm hover:underline"
          style={{ color: "var(--brand)" }}
        >
          Back to directory
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Add member</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Add a new person to your church directory.
        </p>
      </div>
      <MemberForm mode="create" orgId={profile.org_id} />
    </>
  );
}
