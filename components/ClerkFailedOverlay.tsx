"use client";

import Link from "next/link";

export function ClerkFailedOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <h1 className="text-lg font-semibold">
        Impossible de charger l&apos;authentification
      </h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Les scripts Clerk sont probablement bloqués. Essayez :
      </p>
      <ul className="text-muted-foreground list-inside list-disc text-left text-sm">
        <li>Désactiver les bloqueurs de publicité (uBlock, AdBlock…)</li>
        <li>Désactiver le VPN si vous en utilisez un</li>
        <li>Vérifier votre connexion internet</li>
      </ul>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Réessayer
        </button>
        <Link
          href="/sign-in"
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Aller à la page de connexion
        </Link>
        <a
          href="/api/dev-bypass"
          className="rounded-lg border border-amber-500 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
        >
          Mode développement (sans auth)
        </a>
      </div>
    </div>
  );
}
