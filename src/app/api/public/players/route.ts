import { db } from "@/db";
import { players } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameIdParam = searchParams.get("gameId");

    let allPlayers;
    if (gameIdParam) {
      const gameId = Number(gameIdParam);
      if (isNaN(gameId)) {
        return NextResponse.json({ message: "Invalid game ID." }, { status: 400 });
      }
      allPlayers = await db.select().from(players).where(eq(players.gameId, gameId));
    } else {
      // For public access, it's generally safer to require a gameId
      // or return an empty array if no gameId is provided.
      // Returning all players without a gameId might expose too much data.
      // For now, let's return an empty array if no gameId is provided for public.
      return NextResponse.json([], { status: 200 });
    }
    
    return NextResponse.json(allPlayers, { status: 200 });
  } catch (error) {
    console.error("Error fetching players in /api/public/players:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching players." },
      { status: 500 }
    );
  }
}