import { createClient } from "@/lib/supabase/server";
import { BookOpen } from "lucide-react";

/**
 * Server component. Renders a scripture verse at the bottom of a page.
 * Only renders if the org has show_scripture = true and scripture_text set.
 * Usage: drop <ScriptureFooter /> at the bottom of any (app) page.
 */
export async function ScriptureFooter() {
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("orgs")
    .select("show_scripture, scripture_text")
    .single();

  if (!org?.show_scripture || !org.scripture_text) return null;

  return (
    <footer className="mt-12 border-t border-gray-200 pt-6 pb-4">
      <div className="flex items-start gap-3 max-w-lg mx-auto text-center">
        <div className="flex-1">
          <BookOpen
            size={18}
            className="mx-auto mb-2"
            style={{ color: "var(--gold)" }}
            aria-hidden="true"
          />
          <p className="text-sm italic text-gray-500 leading-relaxed">
            {org.scripture_text}
          </p>
        </div>
      </div>
    </footer>
  );
}
