import { db } from "@/db";
import { submissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic'; // Opt out of static rendering

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId");

    if (!playerId) {
      return NextResponse.json({ message: "Player ID is required." }, { status: 400 });
    }

    const playerSubmissions = await db
      .select()
      .from(submissions)
      .where(eq(submissions.playerId, Number(playerId)));

    return NextResponse.json(playerSubmissions, { status: 200 });
  } catch (error) {
    console.error("Error fetching player submissions:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching player submissions." },
      { status: 500 }
    );
  }
}
