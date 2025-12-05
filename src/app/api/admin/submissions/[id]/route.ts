import { db } from "@/db";
import { submissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { score } = await req.json();

  await db
    .update(submissions)
    .set({
      score,
      status: "graded",
      gradedAt: new Date(),
    })
    .where(eq(submissions.id, parseInt(id)));

  return NextResponse.json({ message: "Submission graded successfully" });
}