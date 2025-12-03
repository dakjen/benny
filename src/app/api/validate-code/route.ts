import { NextResponse } from "next/server";
import { db } from "@/db";
import { games } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ valid: false, message: "Code is required." }, { status: 400 });
    }

    const game = await db.select().from(games).where(eq(games.accessCode, code)).limit(1);

    if (game.length > 0) {
      return NextResponse.json({ valid: true, gameId: game[0].id }, { status: 200 });
    } else {
      return NextResponse.json({ valid: false, message: "Invalid code." }, { status: 401 });
    }
  } catch (error) {
    console.error("Error validating code:", error);
    return NextResponse.json(
      { valid: false, message: "An error occurred during code validation." },
      { status: 500 }
    );
  }
}
