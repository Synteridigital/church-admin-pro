"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  roleKeys: z.array(z.string()).min(1, "Select at least one role"),
});

type FormValues = z.infer<typeof schema>;

type Role = { key: string; label: string; module_key: string };

export default function CreateStaffForm({ roles }: { roles: Role[] }) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", roleKeys: [] },
  });

  const selectedRoles = watch("roleKeys");

  function toggleRole(key: string) {
    const current = selectedRoles ?? [];
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    setValue("roleKeys", next, { shouldValidate: true });
  }

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    setSuccess(false);

    const res = await fetch("/api/staff/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await res.json();
    if (!data.ok) {
      setSubmitError(data.error ?? "Something went wrong.");
      return;
    }

    setSuccess(true);
    reset();
  }

  return (
    <div style={card}>
      <div
        style={{
          height: 6,
          width: 60,
          borderRadius: 3,
          background: "#7A1E2B",
          marginBottom: 20,
        }}
      />
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
        Add staff member
      </h1>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
        They will receive an email invitation to set their password.
      </p>

      {success && (
        <div style={successBox}>
          Staff member created and invitation email sent.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <label style={label}>Full name</label>
        <input
          style={input}
          placeholder="Jane Doe"
          {...register("fullName")}
        />
        {errors.fullName && (
          <p style={errorText}>{errors.fullName.message}</p>
        )}

        <label style={label}>Email</label>
        <input
          style={input}
          type="email"
          placeholder="jane@example.com"
          {...register("email")}
        />
        {errors.email && <p style={errorText}>{errors.email.message}</p>}

        <label style={{ ...label, marginBottom: 8 }}>Roles</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {roles.map((r) => {
            const active = (selectedRoles ?? []).includes(r.key);
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => toggleRole(r.key)}
                style={{
                  padding: "6px 12px",
                  fontSize: 13,
                  borderRadius: 6,
                  border: active ? "1px solid #7A1E2B" : "1px solid #ddd",
                  background: active ? "#7A1E2B" : "#fff",
                  color: active ? "#fff" : "#333",
                  cursor: "pointer",
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
        {errors.roleKeys && (
          <p style={errorText}>{errors.roleKeys.message}</p>
        )}

        {submitError && <p style={errorText}>{submitError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ ...btnPrimary, opacity: isSubmitting ? 0.7 : 1 }}
        >
          {isSubmitting ? "Creating staff…" : "Create staff member"}
        </button>
      </form>

      <a
        href="/dashboard"
        style={{
          fontSize: 13,
          color: "#7A1E2B",
          marginTop: 16,
          display: "inline-block",
        }}
      >
        Back to dashboard
      </a>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eaeaea",
  borderRadius: 12,
  padding: 24,
};
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
const btnPrimary: React.CSSProperties = {
  width: "100%",
  marginTop: 20,
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
const successBox: React.CSSProperties = {
  fontSize: 14,
  color: "#067647",
  background: "#ecfdf3",
  padding: "10px 12px",
  borderRadius: 8,
  marginBottom: 16,
};
