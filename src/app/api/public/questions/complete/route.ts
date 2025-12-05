import { db } from "@/db";
import { players, submissions } from "@/db/schema"; // Added submissions
import { eq, and } from "drizzle-orm"; // Added and
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { playerId, questionId, teamId } = await req.json(); // Added teamId

    // Update the status of the draft submission to "pending"
    await db
      .update(submissions)
      .set({ status: "pending" })
      .where(and(
        eq(submissions.questionId, questionId),
        eq(submissions.teamId, teamId),
        eq(submissions.status, "draft")
      ));

    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId),
    });

    if (!player) {
      return NextResponse.json({ message: "Player not found" }, { status: 404 });
    }

    const completedQuestions = JSON.parse(player.completedQuestions || "[]");

    if (!completedQuestions.includes(questionId)) {
      completedQuestions.push(questionId);
    }

    const updatedPlayer = await db
      .update(players)
      .set({
        completedQuestions: JSON.stringify(completedQuestions),
      })
      .where(eq(players.id, playerId))
      .returning();

    return NextResponse.json(updatedPlayer[0]);
  } catch (error) {
    console.error("Error marking question as completed:", error);
    return NextResponse.json(
      { message: "Error marking question as completed", error },
      { status: 500 }
    );
  }
}
