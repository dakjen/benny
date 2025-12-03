import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const questionId = parseInt(id);

    const question = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId));

    if (question.length === 0) {
      return NextResponse.json({ message: "Question not found." }, { status: 404 });
    }

    return NextResponse.json(question[0], { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while fetching the question." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { questionText, categoryId, expectedAnswer } = await request.json();
    const { id } = await context.params;
    const questionId = parseInt(id);

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
        categoryId, // Changed from category
        expectedAnswer,
      })
      .where(eq(questions.id, questionId))
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
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const questionId = parseInt(id);

    const deletedQuestion = await db
      .delete(questions)
      .where(eq(questions.id, questionId))
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
