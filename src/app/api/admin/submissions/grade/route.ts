import { db } from "@/db";
import { submissions, players } from "@/db/schema"; // Added players
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  try {
    const { teamId, questionId, score } = await req.json();

    if (teamId === undefined || questionId === undefined || score === undefined) {
      return NextResponse.json(
        { message: "teamId, questionId, and score are required" },
        { status: 400 }
      );
    }

    // Find all individual submissions for the given team and question
    const submissionsToUpdate = await db
      .select({ id: submissions.id })
      .from(submissions)
      .leftJoin(players, eq(submissions.playerId, players.id)) // Join with players
      .where(and(
        eq(submissions.questionId, questionId),
        eq(players.teamId, teamId) // Filter by teamId
      ));

    // Update each individual submission
    for (const submission of submissionsToUpdate) {
      await db
        .update(submissions)
        .set({ score, status: "graded" })
        .where(eq(submissions.id, submission.id));
    }

    return NextResponse.json({ message: "Submissions graded successfully" });
  } catch (error) {
    console.error("Error grading submissions:", error);
    return NextResponse.json(
      { message: "Error grading submissions", error },
      { status: 500 }
    );
  }
}
