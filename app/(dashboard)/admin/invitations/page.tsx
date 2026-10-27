import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import InvitationsClient, { type UserListRow } from "./InvitationsClient";

export const dynamic = "force-dynamic";

export default async function InvitationsPage() {
  const { userId } = await auth();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, department: true, telephone: true, isActive: true, createdAt: true, clerkId: true },
  });
  const rows: UserListRow[] = users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));
  return <InvitationsClient users={rows} currentClerkId={userId} />;
}
