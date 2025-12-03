import { db } from "@/db";
import { playerAdminMessages, users, players } from "@/db/schema";
import { eq, or, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  let senderId = searchParams.get("senderId");
  let recipientId = searchParams.get("recipientId");

  if (!senderId || !recipientId) {
    return NextResponse.json({ message: "senderId and recipientId are required" }, { status: 400 });
  }

  try {
    let actualAdminId: string | null = null;
    const adminUsers = await db.select().from(users).where(eq(users.role, "admin"));
    if (adminUsers.length === 1) {
      actualAdminId = adminUsers[0].id;
    } else {
      // If there's no single admin, we can't resolve "admin" as a recipient
      if (recipientId === "admin" || senderId === "admin") {
        return NextResponse.json(
          { message: "Could not determine admin recipient. Ensure there is exactly one admin user." },
          { status: 400 }
        );
      }
    }

    // Resolve "admin" recipientId to actual admin ID
    if (recipientId === "admin" && actualAdminId) {
      recipientId = actualAdminId;
    }
    // Resolve "admin" senderId to actual admin ID (for fetching messages where admin is sender)
    if (senderId === "admin" && actualAdminId) {
      senderId = actualAdminId;
    }

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
  let { senderId, recipientId, message } = await request.json();

  if (!senderId || !message) {
    return NextResponse.json(
      { message: "senderId and message are required" },
      { status: 400 }
    );
  }

  try {
    // If recipientId is not provided, assume it's a player sending to the main admin
    if (!recipientId) {
      const adminUsers = await db.select().from(users).where(eq(users.role, "admin"));
      if (adminUsers.length === 1) {
        recipientId = adminUsers[0].id;
      } else {
        return NextResponse.json(
          { message: "Could not determine admin recipient. Ensure there is exactly one admin user." },
          { status: 400 }
        );
      }
    }

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
