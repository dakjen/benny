import { db } from "@/db";
import { questions } from "@/db/schema";
import { getServerSession } from "next-auth/next";
import authOptions from "@/auth";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm"; // Import eq

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json([], { status: 200 }); // Return empty array for unauthorized
  }

  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");

    let allQuestions;
    if (gameId) {
      allQuestions = await db.select().from(questions).where(eq(questions.gameId, Number(gameId)));
    } else {
      allQuestions = await db.select().from(questions);
    }
    
    return NextResponse.json(allQuestions || [], { status: 200 }); // Ensure array is returned
  } catch (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 }); // Return empty array on server error
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

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
        categoryId, // Changed from category
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
