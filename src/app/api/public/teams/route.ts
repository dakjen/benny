import { db } from "@/db";
import { teams } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic'; // Opt out of static rendering

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");

    let allTeams;
    if (gameId) {
      allTeams = await db.select().from(teams).where(eq(teams.gameId, Number(gameId)));
    } else {
      allTeams = await db.select().from(teams);
    }
    
    return NextResponse.json(allTeams, { status: 200 });
  } catch (error) {
    console.error("Error fetching teams for players:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching teams." },
      { status: 500 }
    );
  }
}
