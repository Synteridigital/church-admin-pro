export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fafafa",
        padding: "1rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "24rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "#7A1E2B",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 600,
              fontSize: 18,
            }}
          >
            ⛪
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginTop: 10 }}>
            Church Admin Pro
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
