import { db } from "@/db";
import { playerAdminMessages, users, players } from "@/db/schema";
import { eq, or, and, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  let senderId = searchParams.get("senderId");
  let recipientId = searchParams.get("recipientId");
  const adminFilterId = searchParams.get("adminFilterId"); // New: for admin's view to filter by specific admin

  if (!senderId || !recipientId) {
    return NextResponse.json({ message: "senderId and recipientId are required" }, { status: 400 });
  }

  try {
    const adminUsers = await db.select().from(users).where(eq(users.role, "admin"));
    const adminIds = adminUsers.map(admin => admin.id);

    let messages;
    if (session?.user?.role === "admin" || session?.user?.role === "judge") {
      // Admin/Judge view: fetch messages between selected player and (all or specific) admin(s)
      const playerToAdminId = recipientId; // This is the player's ID

      let conditions = [];
      if (adminFilterId && adminFilterId !== "all") {
        // Filter by a specific admin
        conditions.push(
          or(
            and(eq(playerAdminMessages.senderId, adminFilterId), eq(playerAdminMessages.recipientId, playerToAdminId)),
            and(eq(playerAdminMessages.senderId, playerToAdminId), eq(playerAdminMessages.recipientId, adminFilterId))
          )
        );
      } else {
        // Fetch messages involving the player and ANY admin, or player to "all_admins"
        conditions.push(
          or(
            // Messages from player to specific admin
            and(eq(playerAdminMessages.recipientId, playerToAdminId), inArray(playerAdminMessages.senderId, adminIds)),
            // Messages from specific admin to player
            and(eq(playerAdminMessages.senderId, playerToAdminId), inArray(playerAdminMessages.recipientId, adminIds)),
            // Messages from player to all admins
            and(eq(playerAdminMessages.senderId, playerToAdminId), eq(playerAdminMessages.recipientId, "all_admins")),
            // Messages from all admins to player (this case is unlikely as admins respond as specific admin)
            and(eq(playerAdminMessages.recipientId, playerToAdminId), eq(playerAdminMessages.senderId, "all_admins"))
          )
        );
      }
      messages = await db
        .select()
        .from(playerAdminMessages)
        .where(and(...conditions))
        .orderBy(playerAdminMessages.createdAt);

    } else {
      // Player view: fetch messages between player and "all_admins" or specific admin responses
      let playerConditions = [];
      // Messages from player to "all_admins"
      playerConditions.push(and(eq(playerAdminMessages.senderId, senderId), eq(playerAdminMessages.recipientId, "all_admins")));
      // Messages from any admin to this player
      playerConditions.push(and(inArray(playerAdminMessages.senderId, adminIds), eq(playerAdminMessages.recipientId, senderId)));

      messages = await db
        .select()
        .from(playerAdminMessages)
        .where(or(...playerConditions))
        .orderBy(playerAdminMessages.createdAt);
    }

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
    // If recipientId is not provided, assume it's a player sending to all admins
    if (!recipientId) {
      recipientId = "all_admins";
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
