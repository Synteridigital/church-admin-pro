import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, org_id")
    .eq("id", user!.id)
    .single();

  const { data: org } = await supabase
    .from("orgs")
    .select("name, brand_color")
    .single();

  const { data: modules } = await supabase
    .from("org_modules")
    .select("module_key");

  return (
    <>
      <div
        className="h-1.5 w-14 rounded-full mb-5"
        style={{ backgroundColor: org?.brand_color ?? "#7A1E2B" }}
      />
      <h1 className="text-xl font-semibold text-gray-900">
        Welcome, {profile?.full_name ?? "there"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">{org?.name}</p>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-sm">
        <strong>Enabled modules ({modules?.length ?? 0}):</strong>{" "}
        {modules?.map((m) => m.module_key).join(", ") || "none"}
      </div>
    </>
  );
}
