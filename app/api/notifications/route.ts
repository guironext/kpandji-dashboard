import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma, executeWithRetry } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/actions/user";

export const dynamic = "force-dynamic";

function toDbType(type: string) {
  switch (type) {
    case "message":
      return "MESSAGE";
    case "success":
      return "SUCCESS";
    case "warning":
      return "URGENT";
    case "error":
      return "ERROR";
    case "info":
    default:
      return "INFO";
  }
}

function toAppType(type: string) {
  switch (type) {
    case "MESSAGE":
      return "message";
    case "SUCCESS":
      return "success";
    case "URGENT":
      return "warning";
    case "ERROR":
      return "error";
    case "INFO":
    default:
      return "info";
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const url = new URL(req.url);
    const take = Math.min(Math.max(Number(url.searchParams.get("take") ?? 50) || 50, 1), 100);

    const list = await executeWithRetry(() =>
      prisma.notification.findMany({
        where: { receiverId: userResult.data.id },
        orderBy: { createdAt: "desc" },
        take,
      }),
    );

    return NextResponse.json(
      list.map((n) => ({
        id: n.id,
        type: toAppType(n.type),
        title: (n.title ?? n.message) as string,
        href: n.href ?? undefined,
        createdAt: n.createdAt.getTime(),
        read: n.read,
      }))
    );
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { type, title, message, href } = body as {
      type?: string;
      title?: string;
      message?: string;
      href?: string;
    };

    const finalMessage =
      typeof message === "string" && message.trim().length > 0
        ? message.trim()
        : typeof title === "string" && title.trim().length > 0
          ? title.trim()
          : null;

    if (!finalMessage) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const created = await prisma.notification.create({
      data: {
        receiverId: userResult.data.id,
        type: toDbType(type ?? "info"),
        title: typeof title === "string" ? title.trim() : null,
        message: finalMessage,
        href: typeof href === "string" && href.trim().length > 0 ? href.trim() : null,
      },
    });

    return NextResponse.json({ id: created.id, success: true });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userResult = await getOrCreateUser(clerkId);
    if (!userResult.success || !userResult.data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.notification.deleteMany({ where: { receiverId: userResult.data.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return NextResponse.json({ error: "Failed to clear notifications" }, { status: 500 });
  }
}

