import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // These reads go THROUGH RLS — proof the whole chain works.
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, org_id")
    .eq("id", user!.id)
    .single();

  const { data: org } = await supabase
    .from("orgs")
    .select("name, slug, brand_color")
    .single();

  const { data: modules } = await supabase
    .from("org_modules")
    .select("module_key");

  return (
    <main style={{ fontFamily: "system-ui", padding: "3rem", maxWidth: 640 }}>
      <div
        style={{
          height: 6,
          width: 60,
          borderRadius: 3,
          background: org?.brand_color ?? "#7A1E2B",
          marginBottom: 20,
        }}
      />
      <h1 style={{ fontSize: 22, fontWeight: 600 }}>
        Welcome, {profile?.full_name ?? "there"}
      </h1>
      <p style={{ color: "#666", marginTop: 6 }}>
        {org?.name} &middot; {org?.slug}
      </p>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 10,
          background: "#f7f7f7",
          fontSize: 14,
        }}
      >
        <strong>Enabled modules ({modules?.length ?? 0}):</strong>{" "}
        {modules?.map((m) => m.module_key).join(", ") || "none"}
      </div>

      <p style={{ marginTop: 20, fontSize: 13, color: "#999" }}>
        Phase 1c-i — auth core verified. Shell &amp; navigation arrive in Phase 2.
      </p>

      <form action="/auth/signout" method="post" style={{ marginTop: 24 }}>
        <button
          style={{
            padding: "8px 14px",
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "#fff",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
