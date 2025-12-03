import { db } from "@/db";
import { teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse, NextRequest } from "next/server"; // Import NextRequest
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function PUT(

  request: NextRequest,

  context: any // Use 'any' to bypass strict type checking for context

) {

  const { params } = context; // Destructure params from context



  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "admin") {

    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  }



  try {

    const teamId = Number(params.id);

    const { name, gameId } = await request.json(); // Re-inserted this line and added gameId



    if (!name || !gameId) {

      return NextResponse.json({ message: "Team name and gameId are required." }, { status: 400 });

    }



    const updatedTeam = await db

      .update(teams)

      .set({ name, gameId })

      .where(eq(teams.id, teamId))

      .returning();



    if (updatedTeam.length === 0) {

      return NextResponse.json({ message: "Team not found." }, { status: 404 });

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
