import { db } from "@/db";
import { players } from "@/db/schema";
import { NextResponse } from "next/server";

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
