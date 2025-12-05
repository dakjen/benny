import { db } from "@/db";
import { submissions, players, questions, teams, categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("gameId");

  if (!gameId) {
    return NextResponse.json(
      { message: "gameId is required" },
      { status: 400 }
    );
  }

  console.log("Fetching submissions for gameId:", gameId);

  const gameSubmissions = await db
    .select({
      submission: submissions,
      player: players,
      question: questions,
      team: teams,
      category: categories,
    })
    .from(submissions)
    .leftJoin(players, eq(submissions.playerId, players.id))
    .leftJoin(questions, eq(submissions.questionId, questions.id))
    .leftJoin(teams, eq(players.teamId, teams.id))
    .leftJoin(categories, eq(questions.categoryId, categories.id))
    .where(eq(questions.gameId, parseInt(gameId)));

  console.log("Fetched submissions:", gameSubmissions);

  return NextResponse.json(gameSubmissions);
}