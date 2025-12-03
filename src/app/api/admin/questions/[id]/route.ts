import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse, NextRequest } from "next/server";

export async function PUT(
  request: NextRequest,
  context: any
) {
  try {
    const id = Number(context.params.id);
    const body = await request.json();
    const { questionText, categoryId, expectedAnswer, gameId, points } = body;

    if (!id) {
      return NextResponse.json({ message: "Question ID is required." }, { status: 400 });
    }

    const updatedQuestion = await db
      .update(questions)
      .set({
        questionText,
        categoryId: categoryId ? Number(categoryId) : null,
        expectedAnswer,
        gameId: Number(gameId),
        points: Number(points),
      })
      .where(eq(questions.id, id))
      .returning();

    if (updatedQuestion.length === 0) {
      return NextResponse.json({ message: "Question not found." }, { status: 404 });
    }

    return NextResponse.json(updatedQuestion[0], { status: 200 });
  } catch (error) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      { message: "An error occurred while updating the question." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    const id = Number(context.params.id);

    if (!id) {
      return NextResponse.json({ message: "Question ID is required." }, { status: 400 });
    }

    const deletedQuestion = await db
      .delete(questions)
      .where(eq(questions.id, id))
      .returning();

    if (deletedQuestion.length === 0) {
      return NextResponse.json({ message: "Question not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Question deleted successfully." }, { status: 200 });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { message: "An error occurred while deleting the question." },
      { status: 500 }
    );
  }
}
