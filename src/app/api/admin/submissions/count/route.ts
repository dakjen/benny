import { db } from "@/db";
import { submissions, players } from "@/db/schema"; // Import players
import { eq, and } from "drizzle-orm"; // Import and
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId");

  try {
    if (gameId) {
      // Join with players table to filter by gameId
      const pendingSubmissions = await db
        .select()
        .from(submissions)
        .innerJoin(players, eq(submissions.playerId, players.id))
        .where(and(eq(submissions.status, "pending"), eq(players.gameId, Number(gameId))));

      return NextResponse.json({ count: pendingSubmissions.length }, { status: 200 });
    }

    // Original query if no gameId is provided
    const pendingSubmissions = await db
      .select()
      .from(submissions)
      .where(eq(submissions.status, "pending"));

    return NextResponse.json({ count: pendingSubmissions.length }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while fetching submission count." },
      { status: 500 }
    );
  }
}
