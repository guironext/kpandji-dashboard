import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider, ClerkFailed } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { ClerkFailedOverlay } from "@/components/ClerkFailedOverlay";
import FloatingNotifications from "@/components/FloatingNotifications";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KPANDJI Management Board",
  description: "Tableau de bord de gestion de KPANDJI",
};

/** Root layout reads cookies (dev bypass); avoid static prerender errors on child routes. */
export const dynamic = "force-dynamic";

// Get Clerk publishable key
// During build, if key is missing, Clerk will throw an error
// Make sure to set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env.local file
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let devBypass = false;
  try {
    const cookieStore = await cookies();
    devBypass = process.env.NODE_ENV === "development" && cookieStore.get("__clerk_dev_bypass")?.value === "1";
  } catch (e) {
    console.warn("[Layout] Could not read cookies:", e);
  }

  if (!clerkPublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. Add it to .env.local and restart the dev server."
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      appearance={{
        elements: {
          rootBox: "w-full",
        },
      }}
      localization={{
        locale: "fr",
        signIn: {
          start: {
            title: "Se connecter",
            subtitle: "Connectez-vous à votre compte",
          },
          password: {
            title: "Entrez votre mot de passe",
            subtitle: "Votre compte est protégé par un mot de passe",
          },
        },
        signUp: {
          start: {
            title: "S'inscrire",
            subtitle: "Créez votre compte",
          },
        },
        formFieldLabel__emailAddress: "Adresse e-mail",
        formFieldLabel__password: "Mot de passe",
        formFieldLabel__confirmPassword: "Confirmer le mot de passe",
        formFieldInputPlaceholder__emailAddress: "Entrez votre adresse e-mail",
        formFieldInputPlaceholder__password: "Entrez votre mot de passe",
        formButtonPrimary: "Continuer",
      }}
    >
      <html lang="fr">
        <body
          className={`${inter.variable} font-sans antialiased`}
          suppressHydrationWarning={true}
        >
          {!devBypass && (
            <ClerkFailed>
              <ClerkFailedOverlay />
            </ClerkFailed>
          )}
          {children}
          
          <FloatingNotifications />
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
