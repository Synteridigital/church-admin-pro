import { notFound } from "next/navigation";
import { createClient as createSBClient } from "@supabase/supabase-js";
import { BookOpen } from "lucide-react";
import PublicIntakeForm from "../../public-intake-form";

export default async function PublicFormByTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = createSBClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Look up token
  const { data: tokenRow } = await supabase
    .from("public_form_tokens")
    .select("id, org_id, form_type, expires_at, used_at")
    .eq("token", token)
    .single();

  if (!tokenRow) notFound();

  // Check expiry
  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center max-w-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Link expired</h2>
          <p className="text-sm text-gray-500">This registration link has expired. Please contact your church for a new link.</p>
        </div>
      </div>
    );
  }

  // Look up the org
  const { data: org } = await supabase
    .from("orgs")
    .select("id, name, slug, brand_color, show_scripture, scripture_text")
    .eq("id", tokenRow.org_id)
    .single();

  if (!org) notFound();

  // Currently only household form type is supported
  if (tokenRow.form_type !== "household") notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: org.brand_color }}
          >
            {org.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">{org.name}</h1>
            <p className="text-xs text-gray-500">Member Registration</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <PublicIntakeForm
          churchName={org.name}
          brandColor={org.brand_color}
          token={token}
        />
      </main>

      {org.show_scripture && org.scripture_text && (
        <footer className="border-t border-gray-200 py-6">
          <div className="max-w-lg mx-auto text-center px-4">
            <BookOpen size={18} className="mx-auto mb-2" style={{ color: "#B8893B" }} aria-hidden="true" />
            <p className="text-sm italic text-gray-500 leading-relaxed">{org.scripture_text}</p>
          </div>
        </footer>
      )}
    </div>
  );
}
