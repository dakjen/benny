import { db } from "@/db";
import { players } from "@/db/schema";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

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
      allPlayers = await db.select().from(players);
    }
    
    return NextResponse.json(allPlayers, { status: 200 });
  } catch (error) {
    console.error("Error fetching players in /api/admin/players:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching players." },
      { status: 500 }
    );
  }
}
