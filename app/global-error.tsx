"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "system-ui, sans-serif",
            backgroundColor: "#fef3c7",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", color: "#92400e", marginBottom: "1rem" }}>
            Une erreur est survenue
          </h1>
          <p style={{ color: "#78350f", marginBottom: "1.5rem", textAlign: "center" }}>
            Le serveur a rencontré une erreur. Vérifiez les variables d&apos;environnement
            (DATABASE_URL, CLERK_*) sur Vercel.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#d97706",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
