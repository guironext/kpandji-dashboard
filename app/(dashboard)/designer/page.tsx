import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getOrCreateUser } from "@/lib/actions/user";
import { getRedirectForRole } from "@/lib/role-redirects";

export default async function DesignerPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const result = await getOrCreateUser(userId);
  const role = result.data?.role;

  if (role && role !== UserRole.DESIGNER) {
    const redirectPath = getRedirectForRole(role);
    if (redirectPath) {
      redirect(redirectPath);
    }
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 px-8 py-10 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Espace Designer</h1>
        <p className="mt-2 text-sm text-slate-600">
          Bienvenue sur votre tableau de bord designer.
        </p>
      </div>
    </div>
  );
}
