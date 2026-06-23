import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateStaffForm from "./create-staff-form";

export default async function CreateStaffPage() {
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
      <main style={page}>
        <div style={card}>
          <h2 style={h2}>Not authorized</h2>
          <p style={{ fontSize: 14, color: "#666" }}>
            Only church administrators can add staff members.
          </p>
          <a
            href="/dashboard"
            style={{
              fontSize: 14,
              color: "#7A1E2B",
              marginTop: 12,
              display: "inline-block",
            }}
          >
            Back to dashboard
          </a>
        </div>
      </main>
    );
  }

  // Fetch roles server-side so the form doesn't need a separate request
  const { data: roles } = await supabase
    .from("roles")
    .select("key, label, module_key")
    .order("sort_order");

  return (
    <main style={page}>
      <CreateStaffForm roles={roles ?? []} />
    </main>
  );
}

const page: React.CSSProperties = {
  fontFamily: "system-ui,-apple-system,sans-serif",
  padding: "3rem",
  maxWidth: 560,
};
const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eaeaea",
  borderRadius: 12,
  padding: 24,
};
const h2: React.CSSProperties = { fontSize: 16, fontWeight: 600, marginBottom: 8 };
