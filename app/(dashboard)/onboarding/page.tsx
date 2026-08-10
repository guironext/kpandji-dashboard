import OnboardingForm from "@/components/Onboarding";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const userEmail = user.emailAddresses[0]?.emailAddress ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-400 p-4 sm:p-6">
      <div className="grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="KPANDJI logo"
            width={280}
            height={90}
            priority
            className="dark:invert"
          />
        </div>

        <OnboardingForm
          userEmail={userEmail}
          firstName={user.firstName ?? ""}
          lastName={user.lastName ?? ""}
        />
      </div>
    </div>
  );
}
