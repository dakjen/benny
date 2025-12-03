import { db } from "@/db";
import { categories } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");

    let allCategories;
    if (gameId) {
      allCategories = await db.select().from(categories).where(eq(categories.gameId, Number(gameId)));
    } else {
      allCategories = await db.select().from(categories);
    }
    
    return NextResponse.json(allCategories, { status: 200 });
  } catch (error) {
    console.error("Error fetching categories for players:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching categories." },
      { status: 500 }
    );
  }
}
