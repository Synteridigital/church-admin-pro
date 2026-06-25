import { notFound } from "next/navigation";
import { createClient as createSBClient } from "@supabase/supabase-js";
import { BookOpen } from "lucide-react";
import PublicIntakeForm from "../../public-intake-form";

export default async function PublicHouseholdBySlugPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  // Use service-role to look up org (no auth needed, no RLS leaking — we only read name/brand/scripture)
  const supabase = createSBClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: org } = await supabase
    .from("orgs")
    .select("id, name, slug, brand_color, show_scripture, scripture_text")
    .eq("slug", orgSlug)
    .single();

  if (!org) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Branded header */}
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

      {/* Form */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <PublicIntakeForm
          churchName={org.name}
          brandColor={org.brand_color}
          slug={org.slug}
        />
      </main>

      {/* Scripture footer */}
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
