// src/app/api/question-messages/route.ts
import { db } from "@/db";
import { questionMessages } from "@/db/schema";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
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
    .from(questionMessages)
    .where(
      or(
        and(
          eq(questionMessages.senderId, session.user.id),
          eq(questionMessages.recipientId, recipientId)
        ),
        and(
          eq(questionMessages.senderId, recipientId),
          eq(questionMessages.recipientId, session.user.id)
        )
      )
    )
    .orderBy(questionMessages.createdAt);

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
    .insert(questionMessages)
    .values({
      senderId: session.user.id,
      recipientId,
      message,
    })
    .returning();

  return NextResponse.json(newMessage[0], { status: 201 });
}
