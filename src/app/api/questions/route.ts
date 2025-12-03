import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allQuestions = await db.select().from(questions);
    return NextResponse.json(allQuestions, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while fetching questions." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { questionText, categoryId, expectedAnswer, gameId, points } = await request.json();

    if (!questionText || !gameId || points === undefined) {
      return NextResponse.json(
        { message: "Question text, gameId, and points are required." },
        { status: 400 }
      );
    }

    const newQuestion = await db
      .insert(questions)
      .values({
        questionText,
        categoryId,
        expectedAnswer,
        gameId,
        points,
      })
      .returning();

    return NextResponse.json(newQuestion[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while creating the question." },
      { status: 500 }
    );
  }
}
