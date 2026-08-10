import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await executeWithRetry(() =>
      prisma.user.findMany({
      where: { role: UserRole.COMMERCIAL },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    })
    );

    const data = users.map((u) => ({
      id: u.id,
      fullName: `${u.firstName} ${u.lastName}`.trim(),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching commercial users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users", data: [] },
      { status: 500 }
    );
  }
}
