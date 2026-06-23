import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );

  let connection = "unknown";
  try {
    const { error } = await supabase.auth.getSession();
    connection = error ? `error: ${error.message}` : "connected ✓";
  } catch (e) {
    connection = `failed: ${(e as Error).message}`;
  }

  return (
    <main style={{ fontFamily: "system-ui", padding: "3rem", maxWidth: 560 }}>
      <h1 style={{ fontSize: 22, fontWeight: 500 }}>Church Admin Pro</h1>
      <p style={{ color: "#666", marginTop: 8 }}>Phase 0 — foundation</p>
      <div style={{ marginTop: 24, padding: 16, borderRadius: 8, background: "#f4f4f4" }}>
        <strong>Supabase:</strong> {connection}
      </div>
    </main>
  );
}
