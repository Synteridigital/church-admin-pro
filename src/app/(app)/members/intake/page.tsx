import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScriptureFooter } from "@/components/ui/ScriptureFooter";
import { User, Home, Baby } from "lucide-react";

export default async function IntakeModePage() {
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
        <h2 className="text-base font-semibold text-gray-900">Not authorized</h2>
        <p className="mt-1 text-sm text-gray-500">
          Only church administrators can submit intake forms.
        </p>
        <a href="/members" className="mt-3 inline-block text-sm hover:underline" style={{ color: "var(--brand)" }}>
          Back to directory
        </a>
      </div>
    );
  }

  const choices = [
    {
      href: "/members/intake/self",
      icon: User,
      title: "Just me",
      subtitle: "Add a single individual to the directory",
    },
    {
      href: "/members/intake/household",
      icon: Home,
      title: "My household",
      subtitle: "Add yourself, spouse, and children together",
    },
    {
      href: "/members/intake/child",
      icon: Baby,
      title: "A child or teen",
      subtitle: "Add a minor to the directory",
    },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Member Intake</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Choose the type of registration.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {choices.map((c) => (
          <a
            key={c.href}
            href={c.href}
            className="group rounded-2xl border border-gray-200 bg-white p-6 text-center hover:border-gray-300 hover:shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <div
              className="mx-auto mb-3 h-12 w-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "color-mix(in srgb, var(--brand) 10%, transparent)" }}
            >
              <c.icon size={24} style={{ color: "var(--brand)" }} aria-hidden="true" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">{c.title}</h2>
            <p className="mt-1 text-xs text-gray-500">{c.subtitle}</p>
          </a>
        ))}
      </div>

      <div className="mt-6">
        <a href="/members" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to directory
        </a>
      </div>

      <ScriptureFooter />
    </>
  );
}
