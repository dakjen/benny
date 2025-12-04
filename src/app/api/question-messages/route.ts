// src/app/api/question-messages/route.ts
import { db } from "@/db";
import { playerAdminMessages } from "@/db/schema";
import { getServerSession } from "next-auth/next";
import authOptions from "@/auth";
import { eq, or, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const recipientId = searchParams.get("recipientId");

  if (!recipientId) {
    return NextResponse.json({ message: "recipientId is required" }, { status: 400 });
  }

  const messages = await db
    .select()
    .from(playerAdminMessages)
    .where(
      or(
        and(
          eq(playerAdminMessages.senderId, session.user.id),
          eq(playerAdminMessages.recipientId, recipientId)
        ),
        and(
          eq(playerAdminMessages.senderId, recipientId),
          eq(playerAdminMessages.recipientId, session.user.id)
        )
      )
    )
    .orderBy(playerAdminMessages.createdAt);

  return NextResponse.json(messages, { status: 200 });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { recipientId, message } = await request.json();

  if (!recipientId || !message) {
    return NextResponse.json(
      { message: "recipientId and message are required" },
      { status: 400 }
    );
  }

  const newMessage = await db
    .insert(playerAdminMessages)
    .values({
      senderId: session.user.id,
      recipientId,
      message,
    })
    .returning();

  return NextResponse.json(newMessage[0], { status: 201 });
}
