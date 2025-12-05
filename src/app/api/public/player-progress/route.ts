import { db } from "@/db";
import { players, categories, questions } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic'; // Opt out of static rendering

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get("playerId");

    if (!playerId) {
      return NextResponse.json({ message: "Player ID is required." }, { status: 400 });
    }

    const playerProgress = await db
      .select({
        currentCategoryId: players.currentCategoryId,
        completedCategories: players.completedCategories,
        completedQuestions: players.completedQuestions,
      })
      .from(players)
      .where(eq(players.id, Number(playerId)));

    if (playerProgress.length === 0) {
      return NextResponse.json({ message: "Player not found." }, { status: 404 });
    }

    return NextResponse.json(playerProgress[0], { status: 200 });
  } catch (error) {
    console.error("Error fetching player progress:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching player progress." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { playerId, completedCategoryId } = await request.json();

    if (!playerId || !completedCategoryId) {
      return NextResponse.json(
        { message: "Player ID and completed Category ID are required." },
        { status: 400 }
      );
    }

    const playerRecord = await db
      .select()
      .from(players)
      .where(eq(players.id, Number(playerId)));

    if (playerRecord.length === 0) {
      return NextResponse.json({ message: "Player not found." }, { status: 404 });
    }

    const player = playerRecord[0];
    let completedCategoriesArray: number[] = JSON.parse(player.completedCategories || "[]");

    if (!completedCategoriesArray.includes(completedCategoryId)) {
      completedCategoriesArray.push(completedCategoryId);
    }

    let nextCategoryId = player.currentCategoryId;

    // Logic to determine the next sequential category
    const gameCategories = await db
      .select()
      .from(categories)
      .where(and(eq(categories.gameId, player.gameId), eq(categories.isSequential, true)))
      .orderBy(asc(categories.order));

    const currentCategoryIndex = gameCategories.findIndex(
      (cat) => cat.id === completedCategoryId
    );

    if (currentCategoryIndex !== -1 && currentCategoryIndex < gameCategories.length - 1) {
      // If the completed category is sequential and not the last one, set the next sequential category
      nextCategoryId = gameCategories[currentCategoryIndex + 1].id;
    } else if (currentCategoryIndex === gameCategories.length - 1) {
      // If it's the last sequential category, set currentCategoryId to null or a default non-sequential category
      nextCategoryId = null; // Or handle completion of all sequential categories
    } else if (player.currentCategoryId === completedCategoryId) {
        // If the completed category was the current one, but not sequential, or not found in sequential flow,
        // just clear the currentCategoryId to allow player to pick next
        nextCategoryId = null;
    }


    const updatedPlayer = await db
      .update(players)
      .set({
        completedCategories: JSON.stringify(completedCategoriesArray),
        currentCategoryId: nextCategoryId,
      })
      .where(eq(players.id, Number(playerId)))
      .returning();

    return NextResponse.json(updatedPlayer[0], { status: 200 });
  } catch (error) {
    console.error("Error updating player progress:", error);
    return NextResponse.json(
      { message: "An error occurred while updating player progress." },
      { status: 500 }
    );
  }
}
