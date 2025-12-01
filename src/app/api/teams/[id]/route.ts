import { db } from "@/db";
import { teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name } = await request.json();
    const id = parseInt(params.id);

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
      .where(eq(teams.id, id))
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
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    const deletedTeam = await db
      .delete(teams)
      .where(eq(teams.id, id))
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
