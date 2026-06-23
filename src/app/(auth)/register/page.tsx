"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [churchName, setChurchName] = useState("");
  const [brandColor, setBrandColor] = useState("#7A1E2B");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = slugify(churchName);

  async function handleSubmit() {
    setError(null);

    if (!churchName || !fullName || !email || password.length < 8) {
      setError("Fill in all fields. Password must be at least 8 characters.");
      return;
    }

    setPending(true);
    try {
      // 1. Create the auth user (triggers verification email)
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
          },
        });

      if (signUpError) throw signUpError;
      const userId = signUpData.user?.id;
      if (!userId) throw new Error("No user returned from sign up.");

      // 2. Atomically create church + super-admin profile + core modules
      const { error: orgError } = await supabase.rpc("handle_new_org", {
        p_user_id: userId,
        p_org_name: churchName,
        p_slug: slug,
        p_brand_color: brandColor,
        p_full_name: fullName,
        p_email: email,
      });

      if (orgError) throw orgError;

      router.push("/verify-email");
    } catch (e) {
      setError((e as Error).message);
      setPending(false);
    }
  }

  return (
    <div style={card}>
      <h2 style={h2}>Create your church account</h2>

      <label style={label}>Church name</label>
      <input
        style={input}
        value={churchName}
        onChange={(e) => setChurchName(e.target.value)}
        placeholder="Mt. Olive SDA Church"
      />
      {slug && (
        <p style={hint}>
          Your address: <strong>{slug}</strong>
        </p>
      )}

      <label style={label}>Brand color</label>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="color"
          value={brandColor}
          onChange={(e) => setBrandColor(e.target.value)}
          style={{ width: 44, height: 38, padding: 2, cursor: "pointer" }}
        />
        <span style={{ fontSize: 13, color: "#666" }}>{brandColor}</span>
      </div>

      <div style={{ borderTop: "1px solid #eee", margin: "16px 0" }} />

      <label style={label}>Your name</label>
      <input
        style={input}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Pastor John Grant"
      />

      <label style={label}>Email</label>
      <input
        style={input}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@church.org"
      />

      <label style={label}>Password</label>
      <input
        style={input}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
      />

      {error && <p style={errorText}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={pending}
        style={{ ...button, background: brandColor, opacity: pending ? 0.7 : 1 }}
      >
        {pending ? "Creating account…" : "Create church account"}
      </button>

      <p style={hint}>
        Already have an account?{" "}
        <a href="/login" style={{ color: brandColor }}>
          Sign in
        </a>
      </p>
    </div>
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
