import { db } from "@/db";
import { games } from "@/db/schema";
import { getServerSession } from "next-auth/next";
import authOptions from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  console.log("GET /api/admin/games called");
  const session = await getServerSession(authOptions);
  console.log("Session in /api/admin/games:", session);
  console.log("Session user role in /api/admin/games:", session?.user?.role);

  if (!session || session.user?.role !== "admin") {
    console.log("Unauthorized access to /api/admin/games");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Attempting to fetch all games from DB...");
    const allGames = await db.select().from(games);
    console.log("Successfully fetched games:", allGames);
    return NextResponse.json(allGames, { status: 200 });
  } catch (error) {
    console.error("Error fetching games in /api/admin/games:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching games." },
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
    const { name, accessCode } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: "Game name is required." },
        { status: 400 }
      );
    }

    const newGame = await db
      .insert(games)
      .values({
        name,
        accessCode: accessCode || null, // Store as null if not provided
      })
      .returning();

    return NextResponse.json(newGame[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while creating the game." },
      { status: 500 }
    );
  }
}
