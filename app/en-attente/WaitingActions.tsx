"use client";

import { useState } from "react";
import { SignOutButton, useAuth, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function WaitingActions({ showCheck }: { showCheck: boolean }) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    try {
      // Recharge le profil et le jeton de session pour récupérer la validation éventuelle
      await user?.reload();
      await getToken({ skipCache: true });
    } finally {
      window.location.replace("/");
    }
  };

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      {showCheck && (
        <Button
          onClick={handleCheck}
          disabled={checking}
          className="bg-gradient-to-r from-orange-600 to-amber-600 text-white"
        >
          {checking ? "Vérification..." : "Vérifier mon accès"}
        </Button>
      )}
      <SignOutButton redirectUrl="/sign-in">
        <button className="text-sm text-gray-500 underline">Se déconnecter</button>
      </SignOutButton>
    </div>
  );
}
