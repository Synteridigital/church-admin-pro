import { redirect } from "next/navigation";
import { resolveShell } from "@/lib/navigation-resolver";
import { AppShell } from "@/components/shell/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shell = await resolveShell();
  if (!shell) redirect("/login");

  return (
    <AppShell
      nav={shell.nav}
      orgName={shell.org.name}
      orgSlug={shell.org.slug}
      brandColor={shell.org.brandColor}
      userName={shell.user.fullName}
      userEmail={shell.user.email}
    >
      {children}
    </AppShell>
  );
}
