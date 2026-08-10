import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    let userId = (await auth()).userId;
    const bodyUserId = request.nextUrl.searchParams.get("userId");
    if (!userId && bodyUserId) userId = bodyUserId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Non authentifié. Reconnectez-vous." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const clients = await prisma.client.findMany({
      where: { userId: user.id },
      include: { User: true },
      orderBy: { createdAt: "desc" },
    });

    const data = clients.map((c) => ({
      ...c,
      user: (c as { User?: unknown }).User,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("API getClients error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors du chargement",
      },
      { status: 500 }
    );
  }
}
