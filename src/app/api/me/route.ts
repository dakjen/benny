import { db } from "@/db";
import { players } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import authOptions from "@/auth";

export const dynamic = 'force-dynamic'; // Opt out of static rendering

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const player = await db.query.players.findFirst({
      where: eq(players.userId, userId),
    });

    if (!player) {
      return NextResponse.json({ message: "Player not found" }, { status: 404 });
    }

    return NextResponse.json(player, { status: 200 });
  } catch (error) {
    console.error("Error fetching current player:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching the current player." },
      { status: 500 }
    );
  }
}
