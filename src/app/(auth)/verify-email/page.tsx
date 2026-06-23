export default function VerifyEmailPage() {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #eaeaea",
        borderRadius: 12,
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>📬</div>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
        Check your email
      </h2>
      <p style={{ fontSize: 14, color: "#666", lineHeight: 1.5 }}>
        We sent a verification link to your inbox. Click it to activate your
        church account, then sign in.
      </p>
      <a href="/login" style={{ display: "inline-block", marginTop: 16, fontSize: 14, color: "#7A1E2B" }}>
        Go to sign in
      </a>
    </div>
  );
}
