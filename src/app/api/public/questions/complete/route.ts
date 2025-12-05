import { db } from "@/db";
import { players } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { playerId, questionId } = await req.json();

    const player = await db.query.players.findFirst({
      where: eq(players.id, playerId),
    });

    if (!player) {
      return NextResponse.json({ message: "Player not found" }, { status: 404 });
    }

    const completedCategories = JSON.parse(player.completedCategories || "[]");
    const question = await db.query.questions.findFirst({
        where: (questions, { eq }) => eq(questions.id, questionId),
        });

    if (!question) {
        return NextResponse.json({ message: "Question not found" }, { status: 404 });
    }

    if (!completedCategories.includes(question.categoryId)) {
      completedCategories.push(question.categoryId);
    }

    await db
      .update(players)
      .set({
        completedCategories: JSON.stringify(completedCategories),
      })
      .where(eq(players.id, playerId));

    return NextResponse.json({ message: "Question marked as completed" });
  } catch (error) {
    console.error("Error marking question as completed:", error);
    return NextResponse.json(
      { message: "Error marking question as completed", error },
      { status: 500 }
    );
  }
}
