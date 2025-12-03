import { db } from "@/db";
import { players } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    const teamId = searchParams.get("teamId");

    if (!gameId) {
      return NextResponse.json(
        { message: "Game ID is required." },
        { status: 400 }
      );
    }

    let allPlayers;
    if (teamId) {
      allPlayers = await db
        .select()
        .from(players)
        .where(
          and(
            eq(players.gameId, Number(gameId)),
            eq(players.teamId, Number(teamId))
          )
        );
    } else {
      allPlayers = await db
        .select()
        .from(players)
        .where(eq(players.gameId, Number(gameId)));
    }
    
    return NextResponse.json(allPlayers, { status: 200 });
  } catch (error) {
    console.error("Error fetching players for players:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching players." },
      { status: 500 }
    );
  }
}
