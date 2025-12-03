import { db } from "@/db";
import { submissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId");

  try {
    let query = db.select().from(submissions).where(eq(submissions.status, "pending"));

    if (gameId) {
      query = query.where(and(eq(submissions.status, "pending"), eq(submissions.gameId, Number(gameId))));
    }

    const pendingSubmissions = await query;

    return NextResponse.json({ count: pendingSubmissions.length }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while fetching submission count." },
      { status: 500 }
    );
  }
}
