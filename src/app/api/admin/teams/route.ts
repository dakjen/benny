import { db } from "@/db";
import { teams } from "@/db/schema";
import { getServerSession } from "next-auth/next";
import authOptions from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const allTeams = await db.select().from(teams);
    return NextResponse.json(allTeams, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while fetching teams." },
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
    const { name, gameId } = await request.json();

    if (!name || !gameId) {
      return NextResponse.json(
        { message: "Team name and gameId are required." },
        { status: 400 }
      );
    }

    const newTeam = await db
      .insert(teams)
      .values({
        name,
        gameId,
      })
      .returning();

    return NextResponse.json(newTeam[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while creating the team." },
      { status: 500 }
    );
  }
}
