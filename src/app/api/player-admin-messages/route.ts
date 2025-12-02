import { db } from "@/db";
import { playerAdminMessages, users, players } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const senderId = searchParams.get("senderId");
  const recipientId = searchParams.get("recipientId");

  if (!senderId || !recipientId) {
    return NextResponse.json({ message: "senderId and recipientId are required" }, { status: 400 });
  }

  try {
    const messages = await db
      .select()
      .from(playerAdminMessages)
      .where(
        or(
          and(
            eq(playerAdminMessages.senderId, senderId),
            eq(playerAdminMessages.recipientId, recipientId)
          ),
          and(
            eq(playerAdminMessages.senderId, recipientId),
            eq(playerAdminMessages.recipientId, senderId)
          )
        )
      )
      .orderBy(playerAdminMessages.createdAt);

    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while fetching messages." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const { senderId, recipientId, message } = await request.json();

  if (!senderId || !recipientId || !message) {
    return NextResponse.json(
      { message: "senderId, recipientId, and message are required" },
      { status: 400 }
    );
  }

  try {
    const newMessage = await db
      .insert(playerAdminMessages)
      .values({
        senderId,
        recipientId,
        message,
      })
      .returning();

    return NextResponse.json(newMessage[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while sending the message." },
      { status: 500 }
    );
  }
}
