"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type FormValues = z.infer<typeof schema>;

export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [sessionOk, setSessionOk] = useState<boolean | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    // First try to exchange any hash fragment (recovery token) via onAuthStateChange,
    // then verify with getUser() which hits the Supabase server.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
          setSessionOk(true);
        }
      }
    );

    // Fallback: if no auth event fires (e.g. session already established from
    // /auth/confirm redirect), check directly.
    const timeout = setTimeout(() => {
      supabase.auth.getUser().then(({ data }) => {
        // Only update if we haven't already resolved via onAuthStateChange
        setSessionOk((prev) => prev ?? !!data.user);
      });
    }, 500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase]);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });
    if (error) {
      setSubmitError(error.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  // Loading — checking session
  if (sessionOk === null) {
    return (
      <div style={card}>
        <p style={{ fontSize: 14, color: "#666", textAlign: "center" }}>
          Verifying your link…
        </p>
      </div>
    );
  }

  // No valid session
  if (!sessionOk) {
    return (
      <div style={card}>
        <h2 style={h2}>Link expired</h2>
        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.5 }}>
          This password-reset link has expired or is invalid. Please ask your
          administrator to resend the invitation.
        </p>
        <a href="/login" style={{ ...linkStyle, marginTop: 16, display: "inline-block" }}>
          Go to sign in
        </a>
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div style={card}>
        <h2 style={h2}>Password set!</h2>
        <p style={{ fontSize: 14, color: "#666" }}>
          Redirecting you to the dashboard…
        </p>
      </div>
    );
  }

  return (
    <div style={card}>
      <h2 style={h2}>Set your password</h2>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
        Choose a password to complete your account setup.
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <label style={label}>New password</label>
        <input style={input} type="password" {...register("password")} />
        {errors.password && <p style={errorText}>{errors.password.message}</p>}

        <label style={label}>Confirm password</label>
        <input style={input} type="password" {...register("confirm")} />
        {errors.confirm && <p style={errorText}>{errors.confirm.message}</p>}

        {submitError && <p style={errorText}>{submitError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ ...button, opacity: isSubmitting ? 0.7 : 1 }}
        >
          {isSubmitting ? "Setting password…" : "Set password"}
        </button>
      </form>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eaeaea",
  borderRadius: 12,
  padding: 24,
};
const h2: React.CSSProperties = { fontSize: 16, fontWeight: 600, marginBottom: 8 };
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
const errorText: React.CSSProperties = {
  fontSize: 13,
  color: "#b42318",
  marginTop: 6,
  background: "#fef3f2",
  padding: "8px 10px",
  borderRadius: 6,
};
const linkStyle: React.CSSProperties = { fontSize: 14, color: "#7A1E2B" };
