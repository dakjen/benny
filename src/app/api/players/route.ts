import { db } from "@/db";
import { players } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");
  const gameId = searchParams.get("gameId");

  try {
    let fetchedPlayers;
    if (teamId) {
      fetchedPlayers = await db.select().from(players).where(eq(players.teamId, Number(teamId)));
    } else if (gameId) {
      fetchedPlayers = await db.select().from(players).where(eq(players.gameId, Number(gameId)));
    } else {
      fetchedPlayers = await db.select().from(players); // Fetch all players if no specific ID is provided
    }
    return NextResponse.json(fetchedPlayers, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while fetching players." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, teamId, gameId } = await request.json();

    if (!name || !teamId || !gameId) {
      return NextResponse.json(
        { message: "Player name, teamId, and gameId are required." },
        { status: 400 }
      );
    }

    const newPlayer = await db
      .insert(players)
      .values({
        name,
        teamId,
        gameId,
      })
      .returning();

    return NextResponse.json(newPlayer[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while creating the player." },
      { status: 500 }
    );
  }
}
