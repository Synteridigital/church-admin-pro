import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddPersonForm from "../add-person-form";

export default async function AddSpousePage({
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
        <p className="mt-1 text-sm text-gray-500">Only church administrators can add family members.</p>
        <a href={`/members/${id}`} className="mt-3 inline-block text-sm hover:underline" style={{ color: "var(--brand)" }}>Back to profile</a>
      </div>
    );
  }

  const { data: member } = await supabase
    .from("members")
    .select("id, full_name")
    .eq("id", id)
    .single();

  if (!member) notFound();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Add spouse</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Create a new member record and link them as {member.full_name}&rsquo;s spouse.
        </p>
      </div>
      <AddPersonForm memberId={id} role="spouse" />
    </>
  );
}
