import { db } from "@/db";
import { submissions, players } from "@/db/schema"; // Import players
import { eq, sum, and } from "drizzle-orm"; // Import and
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
    const conditions = [eq(submissions.status, "graded")];

    if (gameId) {
      // Join with players table to filter by gameId
      const result = await db
        .select({
          totalPoints: sum(submissions.score),
        })
        .from(submissions)
        .innerJoin(players, eq(submissions.playerId, players.id))
        .where(and(eq(submissions.status, "graded"), eq(players.gameId, Number(gameId))));

      const totalPointsGranted = result[0]?.totalPoints ? Number(result[0].totalPoints) : 0;
      return NextResponse.json({ totalPoints: totalPointsGranted }, { status: 200 });
    }

    // Original query if no gameId is provided
    const result = await db
      .select({
        totalPoints: sum(submissions.score),
      })
      .from(submissions)
      .where(and(...conditions));

    const totalPointsGranted = result[0]?.totalPoints ? Number(result[0].totalPoints) : 0;

    return NextResponse.json({ totalPoints: totalPointsGranted }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while fetching total points." },
      { status: 500 }
    );
  }
}
