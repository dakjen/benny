import { db } from "@/db";
import { directMessages, players, teams, games } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "team" or "game"
  const teamId = searchParams.get("teamId");
  const gameId = searchParams.get("gameId");
  const playerId = searchParams.get("playerId"); // For fetching messages for a specific player

  if (!type) {
    return NextResponse.json({ message: "Chat type is required." }, { status: 400 });
  }

  try {
    let messages;
    if (type === "team" && teamId) {
      messages = await db
        .select()
        .from(directMessages)
        .where(and(eq(directMessages.type, "team"), eq(directMessages.teamId, Number(teamId))))
        .orderBy(directMessages.createdAt);
    } else if (type === "game" && gameId) {
      messages = await db
        .select()
        .from(directMessages)
        .where(and(eq(directMessages.type, "game"), eq(directMessages.gameId, Number(gameId))))
        .orderBy(directMessages.createdAt);
    } else if (type === "player" && playerId) {
      // This is for fetching messages for a specific player (e.g., for admin/judge to view a player's chat)
      messages = await db
        .select()
        .from(directMessages)
        .where(eq(directMessages.sender, playerId)) // Assuming sender is player ID
        .orderBy(directMessages.createdAt);
    } else {
      return NextResponse.json(
        { message: "Invalid chat type or missing ID." },
        { status: 400 }
      );
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
  const { name, message, teamId, gameId, type } = await request.json(); // name is player name

  if (!name || !message || !teamId || !gameId || !type) {
    return NextResponse.json(
      { message: "Sender name, message, teamId, gameId, and type are required." },
      { status: 400 }
    );
  }

  try {
    // Find the player by name and teamId
    const player = await db.query.players.findFirst({
      where: and(eq(players.name, name), eq(players.teamId, teamId)),
    });

    if (!player) {
      return NextResponse.json({ message: "Player not found." }, { status: 404 });
    }

    const newMessage = await db
      .insert(directMessages)
      .values({
        sender: player.id, // Store player ID as sender
        message,
        teamId,
        gameId,
        type,
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