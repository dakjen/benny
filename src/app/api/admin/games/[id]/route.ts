import { db } from "@/db";
import { games } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const { name, accessCode } = await request.json();

    if (!name) {
      return NextResponse.json(
        { message: "Game name is required." },
        { status: 400 }
      );
    }

    // Ensure accessCode is either a valid string or null
    const finalAccessCode = accessCode === "" ? null : accessCode;

    const updatedGame = await db
      .update(games)
      .set({
        name,
        accessCode: finalAccessCode,
      })
      .where(eq(games.id, Number(id)))
      .returning();

    if (updatedGame.length === 0) {
      return NextResponse.json({ message: "Game not found." }, { status: 404 });
    }

    return NextResponse.json(updatedGame[0], { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while updating the game." },
      { status: 500 }
    );
  }
}
