import { db } from "@/db";
import { teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const teamId = parseInt(id);

    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId));

    if (team.length === 0) {
      return NextResponse.json({ message: "Team not found." }, { status: 404 });
    }

    return NextResponse.json(team[0], { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while fetching the team." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { name } = await request.json();
    const { id } = await context.params;
    const teamId = parseInt(id);

    if (!name) {
      return NextResponse.json(
        { message: "Team name is required." },
        { status: 400 }
      );
    }

    const updatedTeam = await db
      .update(teams)
      .set({
        name,
      })
      .where(eq(teams.id, teamId))
      .returning();

    if (updatedTeam.length === 0) {
      return NextResponse.json(
        { message: "Team not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTeam[0], { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while updating the team." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const teamId = parseInt(id);

    const deletedTeam = await db
      .delete(teams)
      .where(eq(teams.id, teamId))
      .returning();

    if (deletedTeam.length === 0) {
      return NextResponse.json(
        { message: "Team not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Team deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while deleting the team." },
      { status: 500 }
    );
  }
}
