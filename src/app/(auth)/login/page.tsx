"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setPending(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    const redirect = params.get("redirect");
    router.push(redirect && redirect.startsWith("/") ? redirect : "/dashboard");
    router.refresh();
  }

  return (
    <div style={card}>
      <h2 style={h2}>Sign in</h2>

      <label style={label}>Email</label>
      <input
        style={input}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label style={label}>Password</label>
      <input
        style={input}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {(error || params.get("error")) && (
        <p style={errorText}>
          {error ?? "Verification failed. Please try signing in."}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={pending}
        style={{ ...button, opacity: pending ? 0.7 : 1 }}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p style={hint}>
        New church?{" "}
        <a href="/register" style={{ color: "#7A1E2B" }}>
          Create an account
        </a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={card}>Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eaeaea",
  borderRadius: 12,
  padding: 24,
};
const h2: React.CSSProperties = { fontSize: 16, fontWeight: 600, marginBottom: 16 };
const label: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 500,
  margin: "12px 0 4px",
};
const input: React.CSSProperties = {
  width: "100%",
  padding: "9px 11px",
  border: "1px solid #ddd",
  borderRadius: 8,
  fontSize: 14,
  boxSizing: "border-box",
};
const button: React.CSSProperties = {
  width: "100%",
  marginTop: 18,
  padding: "10px 16px",
  background: "#7A1E2B",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};
const hint: React.CSSProperties = { fontSize: 12.5, color: "#888", marginTop: 10 };
const errorText: React.CSSProperties = {
  fontSize: 13,
  color: "#b42318",
  marginTop: 12,
  background: "#fef3f2",
  padding: "8px 10px",
  borderRadius: 6,
};
