import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const allCategories = await db.select().from(categories);
    return NextResponse.json(allCategories, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while fetching categories." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, gameId, isSequential, order } = await request.json();

    if (!name || !gameId) {
      return NextResponse.json(
        { message: "Category name and gameId are required." },
        { status: 400 }
      );
    }

    const newCategory = await db
      .insert(categories)
      .values({
        name,
        gameId,
        isSequential: isSequential ?? false, // Default to false if not provided
        order: order ?? 0, // Default to 0 if not provided
      })
      .returning();

    return NextResponse.json(newCategory[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while creating the category." },
      { status: 500 }
    );
  }
}
