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
    const { questionText, category, expectedAnswer } = await request.json();

    if (!questionText) {
      return NextResponse.json(
        { message: "Question text is required." },
        { status: 400 }
      );
    }

    const newQuestion = await db
      .insert(questions)
      .values({
        questionText,
        category,
        expectedAnswer,
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
