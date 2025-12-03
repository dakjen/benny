import { db } from "@/db";
import { questions } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    const categoryId = searchParams.get("categoryId");

    if (!gameId) {
      return NextResponse.json(
        { message: "Game ID is required." },
        { status: 400 }
      );
    }

    let allQuestions;
    if (categoryId) {
      allQuestions = await db
        .select()
        .from(questions)
        .where(
          and(
            eq(questions.gameId, Number(gameId)),
            eq(questions.categoryId, Number(categoryId))
          )
        );
    } else {
      allQuestions = await db
        .select()
        .from(questions)
        .where(eq(questions.gameId, Number(gameId)));
    }
    
    return NextResponse.json(allQuestions, { status: 200 });
  } catch (error) {
    console.error("Error fetching questions for players:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching questions." },
      { status: 500 }
    );
  }
}
