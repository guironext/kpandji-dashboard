import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/actions/user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!prisma.message) {
      return NextResponse.json(
        {
          error: "Failed to fetch messages",
          details: "Prisma client is outdated. Stop the dev server and Prisma Studio, then run: npx prisma generate",
        },
        { status: 503 }
      );
    }

    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userId = userResult.data.id;

    const messages = await executeWithRetry(() =>
      prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
          { receiverId: null },
        ],
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      })
    );

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch messages";
    return NextResponse.json(
      { error: "Failed to fetch messages", details: process.env.NODE_ENV === "development" ? message : undefined },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, receiverId } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const senderId = userResult.data.id;

    const finalReceiverId =
      receiverId === "all" || receiverId === null || receiverId === undefined
        ? null
        : receiverId;

    if (!prisma.message) {
      return NextResponse.json(
        {
          error: "Failed to send message",
          details: "Prisma client is outdated. Stop the dev server and Prisma Studio, then run: npx prisma generate",
        },
        { status: 503 }
      );
    }

    await prisma.message.create({
      data: {
        senderId,
        receiverId: finalReceiverId,
        content: content.trim(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
