import { db } from "@/db";
import { teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
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
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: "Team name is required." },
        { status: 400 }
      );
    }

    const newTeam = await db
      .insert(teams)
      .values({
        name,
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
