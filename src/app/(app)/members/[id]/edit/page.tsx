import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MemberForm from "../../member-form";

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_super_admin) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-base font-semibold text-gray-900">
          Not authorized
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Only church administrators can edit members.
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

  const { data: member } = await supabase
    .from("members")
    .select("id, full_name, gender, email, phone, birthday, membership_status, photo_url")
    .eq("id", id)
    .single();

  if (!member) notFound();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit member</h1>
        <p className="mt-0.5 text-sm text-gray-500">{member.full_name}</p>
      </div>
      <MemberForm
        mode="edit"
        memberId={member.id}
        defaultValues={{
          full_name: member.full_name,
          gender: (member.gender as "male" | "female" | "") ?? "",
          email: member.email ?? "",
          phone: member.phone ?? "",
          birthday: member.birthday ?? "",
          membership_status: member.membership_status as "active" | "visitor" | "inactive",
          photo_url: member.photo_url ?? "",
        }}
      />
    </>
  );
}
