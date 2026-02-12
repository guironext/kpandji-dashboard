"use server";

import { prisma } from "../prisma";
import { getOrCreateUser } from "./user";

export type MessageWithParticipants = {
  id: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
  senderId: string;
  receiverId: string | null;
  sender: { id: string; firstName: string; lastName: string; email: string };
  receiver: { id: string; firstName: string; lastName: string; email: string } | null;
};

export async function getMessagesForUser(clerkId: string) {
  const userResult = await getOrCreateUser(clerkId);
  if (!userResult.success || !userResult.data) {
    return { success: false, error: userResult.error, data: null };
  }
  const userId = userResult.data.id;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId },
        { receiverId: null }, // broadcast to all
      ],
    },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, email: true } },
      receiver: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, data: messages };
}

export async function sendMessage(
  senderClerkId: string,
  content: string,
  receiverId: string | null
) {
  const userResult = await getOrCreateUser(senderClerkId);
  if (!userResult.success || !userResult.data) {
    return { success: false, error: userResult.error };
  }
  const senderId = userResult.data.id;

  if (receiverId === null) {
    // Broadcast: create one message with receiverId = null
    await prisma.message.create({
      data: { senderId, receiverId: null, content },
    });
  } else {
    // Send to specific user
    await prisma.message.create({
      data: { senderId, receiverId, content },
    });
  }
  return { success: true };
}

export async function markMessageAsRead(messageId: string, clerkId: string) {
  const userResult = await getOrCreateUser(clerkId);
  if (!userResult.success || !userResult.data) {
    return { success: false, error: userResult.error };
  }
  const userId = userResult.data.id;

  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) return { success: false, error: "Message not found" };
  if (message.receiverId !== userId && message.receiverId !== null) {
    return { success: false, error: "Unauthorized" };
  }
  if (message.senderId === userId) return { success: true }; // sender doesn't need to mark as read

  await prisma.message.update({
    where: { id: messageId },
    data: { readAt: new Date() },
  });
  return { success: true };
}
