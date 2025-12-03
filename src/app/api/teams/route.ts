import { db } from "@/db";
import { teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId");

  try {
    let allTeams;
    if (gameId) {
      allTeams = await db.select().from(teams).where(eq(teams.gameId, Number(gameId)));
    } else {
      allTeams = await db.select().from(teams);
    }
    return NextResponse.json(allTeams, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while fetching teams." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, gameId } = await request.json();

    if (!name || !gameId) {
      return NextResponse.json(
        { message: "Team name and gameId are required." },
        { status: 400 }
      );
    }

    const newTeam = await db
      .insert(teams)
      .values({
        name,
        gameId,
      })
      .returning();

    return NextResponse.json(newTeam[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while creating the team." },
      { status: 500 }
    );
  }
}
