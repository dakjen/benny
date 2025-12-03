import { db } from "@/db";
import { games } from "@/db/schema";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allGames = await db.select().from(games);
    return NextResponse.json(allGames, { status: 200 });
  } catch (error) {
    console.error("Error fetching games for players:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching games." },
      { status: 500 }
    );
  }
}
