import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { questionText, category, expectedAnswer } = await request.json();
    const id = parseInt(params.id);

    if (!questionText) {
      return NextResponse.json(
        { message: "Question text is required." },
        { status: 400 }
      );
    }

    const updatedQuestion = await db
      .update(questions)
      .set({
        questionText,
        category,
        expectedAnswer,
      })
      .where(eq(questions.id, id))
      .returning();

    if (updatedQuestion.length === 0) {
      return NextResponse.json(
        { message: "Question not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedQuestion[0], { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while updating the question." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    const deletedQuestion = await db
      .delete(questions)
      .where(eq(questions.id, id))
      .returning();

    if (deletedQuestion.length === 0) {
      return NextResponse.json(
        { message: "Question not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Question deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while deleting the question." },
      { status: 500 }
    );
  }
}
