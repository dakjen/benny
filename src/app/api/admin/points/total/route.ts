import { db } from "@/db";
import { submissions } from "@/db/schema";
import { eq, sum } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await db
      .select({
        totalPoints: sum(submissions.score),
      })
      .from(submissions)
      .where(eq(submissions.status, "graded"));

    const totalPointsGranted = result[0]?.totalPoints ? Number(result[0].totalPoints) : 0;

    return NextResponse.json({ totalPoints: totalPointsGranted }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while fetching total points." },
      { status: 500 }
    );
  }
}
