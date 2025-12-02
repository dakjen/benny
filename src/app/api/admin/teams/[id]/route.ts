import { db } from "@/db";
import { teams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const teamId = Number(params.id);
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ message: "Team name is required." }, { status: 400 });
    }

    const updatedTeam = await db
      .update(teams)
      .set({ name })
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
