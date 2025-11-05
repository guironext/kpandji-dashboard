import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KPANDJI Management Board",
  description: "Tableau de bord de gestion de KPANDJI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
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
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning={true}
        >
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
