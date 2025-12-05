import { db } from "@/db";
import { submissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const questionId = formData.get("questionId") as string;
    const gameId = formData.get("gameId") as string;
    const submissionType = formData.get("submissionType") as "text" | "photo" | "video";
    let answerText = formData.get("answerText");
    if (typeof answerText !== "string") {
      answerText = null;
    }
    const photo = formData.get("photo") as File | null;
    const video = formData.get("video") as File | null;

    const playerId = parseInt(formData.get("playerId") as string);

    if (submissionType === "text") {
      if (!answerText) {
        return NextResponse.json(
          { message: "Answer text is required for text submissions" },
          { status: 400 }
        );
      }

      await db.insert(submissions).values({
        playerId,
        questionId: parseInt(questionId),
        answerText,
        submission_type: "text",
      });
    } else if (submissionType === "photo") {
      if (!photo) {
        return NextResponse.json(
          { message: "Photo is required for photo submissions" },
          { status: 400 }
        );
      }

      const photoName = `${Date.now()}-${photo.name}`;
      const submissionsDir = path.join(process.cwd(), "public/submissions");
      await fs.mkdir(submissionsDir, { recursive: true });
      const photoPath = path.join(submissionsDir, photoName);
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);

      await fs.writeFile(photoPath, buffer);

      const photoUrl = `/submissions/${photoName}`;

      await db.insert(submissions).values({
        playerId,
        questionId: parseInt(questionId),
        answerText: null,
        photo_url: photoUrl,
        submission_type: "photo",
      });
    } else if (submissionType === "video") {
      if (!video) {
        return NextResponse.json(
          { message: "Video is required for video submissions" },
          { status: 400 }
        );
      }

      const videoName = `${Date.now()}-${video.name}`;
      const submissionsDir = path.join(process.cwd(), "public/submissions");
      await fs.mkdir(submissionsDir, { recursive: true });
      const videoPath = path.join(submissionsDir, videoName);
      const bytes = await video.arrayBuffer();
      const buffer = Buffer.from(bytes);

      await fs.writeFile(videoPath, buffer);

      const videoUrl = `/submissions/${videoName}`;

      await db.insert(submissions).values({
        playerId,
        questionId: parseInt(questionId),
        answerText: null,
        photo_url: null,
        video_url: videoUrl,
        submission_type: "video",
      });
    } else {
      return NextResponse.json(
        { message: "Invalid submission type" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Submission successful" });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { message: "Error creating submission", error },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("gameId");

  if (!gameId) {
    return NextResponse.json(
      { message: "gameId is required" },
      { status: 400 }
    );
  }

  const gameSubmissions = await db
    .select({
      id: submissions.id,
      playerId: submissions.playerId,
      questionId: submissions.questionId,
      teamId: players.teamId,
      status: submissions.status,
      score: submissions.score,
    })
    .from(submissions)
    .leftJoin(players, eq(submissions.playerId, players.id))
    .where(eq(players.gameId, parseInt(gameId)));

  return NextResponse.json(gameSubmissions);
}