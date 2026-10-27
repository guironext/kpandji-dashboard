import { SignOutButton } from "@clerk/nextjs";

export default function CompteDesactivePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Compte désactivé</h1>
        <p className="mt-2 text-sm text-gray-600">
          Votre compte a été désactivé par un administrateur. Contactez votre administrateur si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
        </p>
        <SignOutButton redirectUrl="/sign-in">
          <button className="mt-6 rounded-lg bg-black px-5 py-2 text-sm font-medium text-amber-400 hover:bg-gray-800">Se déconnecter</button>
        </SignOutButton>
      </div>
    </main>
  );
}
