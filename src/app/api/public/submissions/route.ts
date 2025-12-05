import { db } from "@/db";
import { submissions, submissionPhotos, players } from "@/db/schema";
import { eq, and } from "drizzle-orm"; // Import 'and' for multiple conditions
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
    const photos = formData.getAll("photos") as File[];
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
      if (photos.length === 0) {
        return NextResponse.json(
          { message: "At least one photo is required for photo submissions" },
          { status: 400 }
        );
      }

      const [submission] = await db.insert(submissions).values({
        playerId,
        questionId: parseInt(questionId),
        answerText: null,
        submission_type: "photo",
      }).returning();

      for (const photo of photos) {
        const photoName = `${Date.now()}-${photo.name}`;
        const submissionsDir = path.join(process.cwd(), "public/submissions");
        await fs.mkdir(submissionsDir, { recursive: true });
        const photoPath = path.join(submissionsDir, photoName);
        const bytes = await photo.arrayBuffer();
        const buffer = Buffer.from(bytes);

        await fs.writeFile(photoPath, buffer);

        const photoUrl = `/submissions/${photoName}`;

        await db.insert(submissionPhotos).values({
          submissionId: submission.id,
          photo_url: photoUrl,
        });
      }
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
  const questionId = searchParams.get("questionId"); // New
  const playerId = searchParams.get("playerId");     // New

  if (!gameId) {
    return NextResponse.json(
      { message: "gameId is required" },
      { status: 400 }
    );
  }

  let whereClause: any[] = [eq(players.gameId, parseInt(gameId))];

  if (questionId) {
    whereClause.push(eq(submissions.questionId, parseInt(questionId)));
  }
  if (playerId) {
    whereClause.push(eq(submissions.playerId, parseInt(playerId)));
  }

  const gameSubmissions = await db
    .select({
      id: submissions.id,
      playerId: submissions.playerId,
      questionId: submissions.questionId,
      teamId: players.teamId,
      status: submissions.status,
      score: submissions.score,
      submissionType: submissions.submission_type, // Include submissionType
      answerText: submissions.answerText,         // Include answerText
      video_url: submissions.video_url,           // Include video_url
      photo_url: submissionPhotos.photo_url,      // Select photo_url from submissionPhotos
      submissionPhotoId: submissionPhotos.id,     // Select id from submissionPhotos
    })
    .from(submissions)
    .leftJoin(players, eq(submissions.playerId, players.id))
    .leftJoin(submissionPhotos, eq(submissions.id, submissionPhotos.submissionId)) // Join submissionPhotos
    .where(and(...whereClause)); // Apply all conditions

  // Group submissions by their ID to handle multiple photos per submission
  const groupedSubmissions = gameSubmissions.reduce((acc: any, row: any) => {
    const existingSubmission = acc.find((s: any) => s.id === row.id);
    if (existingSubmission) {
      if (row.submissionPhotoId) { // Check if photo data exists
        existingSubmission.submission_photos.push({
          id: row.submissionPhotoId,
          url: row.photo_url,
        });
      }
    } else {
      acc.push({
        id: row.id,
        playerId: row.playerId,
        questionId: row.questionId,
        teamId: row.teamId,
        status: row.status,
        score: row.score,
        submissionType: row.submissionType,
        answerText: row.answerText,
        video_url: row.video_url,
        submission_photos: row.submissionPhotoId ? [{ id: row.submissionPhotoId, url: row.photo_url }] : [],
      });
    }
    return acc;
  }, []);


  return NextResponse.json(groupedSubmissions);
}