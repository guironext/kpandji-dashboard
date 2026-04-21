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
    const { content, receiverId, receiverIds } = body as {
      content?: unknown;
      receiverId?: unknown;
      receiverIds?: unknown;
    };

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
        : typeof receiverId === "string"
          ? receiverId
          : null;

    const finalReceiverIds =
      Array.isArray(receiverIds) ? receiverIds.filter((id) => typeof id === "string") : [];

    if (!prisma.message) {
      return NextResponse.json(
        {
          error: "Failed to send message",
          details: "Prisma client is outdated. Stop the dev server and Prisma Studio, then run: npx prisma generate",
        },
        { status: 503 }
      );
    }

    // Create messages (one per recipient, or a broadcast message with receiverId = null)
    const trimmed = content.trim();

    const createdMessages = await (async () => {
      if (finalReceiverId) {
        const one = await prisma.message.create({
          data: { senderId, receiverId: finalReceiverId, content: trimmed },
          include: { sender: { select: { id: true, firstName: true, lastName: true, email: true } } },
        });
        return [one];
      }

      if (finalReceiverIds.length > 0) {
        const list = await prisma.$transaction(
          finalReceiverIds.map((rid) =>
            prisma.message.create({
              data: { senderId, receiverId: rid, content: trimmed },
              include: { sender: { select: { id: true, firstName: true, lastName: true, email: true } } },
            })
          )
        );
        return list;
      }

      const broadcast = await prisma.message.create({
        data: { senderId, receiverId: null, content: trimmed },
        include: { sender: { select: { id: true, firstName: true, lastName: true, email: true } } },
      });
      return [broadcast];
    })();

    // Persist notifications for recipients
    const senderName =
      `${createdMessages[0]!.sender.firstName} ${createdMessages[0]!.sender.lastName}`.trim() ||
      createdMessages[0]!.sender.email;

    const first20Words = (text: string) => {
      const words = text.trim().split(/\s+/).filter(Boolean);
      const out = words.slice(0, 20).join(" ");
      return words.length > 20 ? `${out}…` : out;
    };

    const preview = first20Words(trimmed);

    const roleToMessagesPath = (role: string | null | undefined) => {
      switch (role) {
        case "COMMUNICATION":
          return "/communication/messages";
        case "COMPTABLE":
          return "/comptable/messages";
        case "RESPONSABLE_COMMERCIAL":
          return "/responsablecommercial/messages";
        default:
          return "/communication/messages";
      }
    };

    // Recipients: per-message receiverId if present, otherwise broadcast to all except sender
    const directRecipientIds = Array.from(
      new Set(createdMessages.map((m) => m.receiverId).filter((id): id is string => typeof id === "string" && id.length > 0))
    );

    if (directRecipientIds.length > 0) {
      const recipients = await prisma.user.findMany({
        where: { id: { in: directRecipientIds } },
        select: { id: true, role: true, firstName: true, lastName: true, email: true },
      });

      const receiverNameById = new Map(
        recipients.map((u) => [
          u.id,
          (`${u.firstName} ${u.lastName}`.trim() || u.email) as string,
        ])
      );
      const roleById = new Map(recipients.map((u) => [u.id, u.role as unknown as string]));

      await prisma.notification.createMany({
        data: directRecipientIds.map((rid) => {
          const msg = createdMessages.find((m) => m.receiverId === rid) ?? createdMessages[0]!;
          const receiverName = receiverNameById.get(rid) ?? rid;
          const href = `${roleToMessagesPath(roleById.get(rid))}?messageId=${encodeURIComponent(msg.id)}`;
          return {
            type: "MESSAGE",
            title: "Nouveau message",
            message: preview,
            href,
            senderId,
            receiverId: rid,
            read: false,
          };
        }),
      });
    } else {
      const recipients = await prisma.user.findMany({
        where: { id: { not: senderId } },
        select: { id: true, role: true, firstName: true, lastName: true, email: true },
      });
      if (recipients.length > 0) {
        await prisma.notification.createMany({
          data: recipients.map((u) => {
            const href = `${roleToMessagesPath(u.role as unknown as string)}?messageId=${encodeURIComponent(createdMessages[0]!.id)}`;
            return {
              type: "MESSAGE",
              title: "Nouveau message",
              message: preview,
              href,
              senderId,
              receiverId: u.id,
              read: false,
            };
          }),
        });
      }
    }

    return NextResponse.json({ success: true, senderName, messagePreview: preview });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
