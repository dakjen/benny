import { db } from "@/db";
import { submissions, submissionPhotos, players } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import authOptions from "@/auth";

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

    // Fetch teamId for the player
    const playerRecord = await db.select({ teamId: players.teamId }).from(players).where(eq(players.id, playerId)).limit(1);
    if (!playerRecord || playerRecord.length === 0 || !playerRecord[0].teamId) {
      return NextResponse.json({ message: "Player or team not found" }, { status: 400 });
    }
    const teamId = playerRecord[0].teamId;

    // Find existing draft submission for this question and team
    let existingSubmission = await db.query.submissions.findFirst({
      where: and(
        eq(submissions.questionId, parseInt(questionId)),
        eq(submissions.teamId, teamId),
        eq(submissions.status, "draft")
      ),
    });

    let submissionId: number;

    if (existingSubmission) {
      submissionId = existingSubmission.id;
    } else {
      // Create a new draft submission if none exists
      const [newSubmission] = await db.insert(submissions).values({
        playerId, // The player who initiated the draft
        questionId: parseInt(questionId),
        teamId: teamId,
        submission_type: submissionType, // Initial type, can be updated
        status: "draft",
      }).returning();
      submissionId = newSubmission.id;
    }

    if (submissionType === "text") {
      if (!answerText) {
        return NextResponse.json(
          { message: "Answer text is required for text submissions" },
          { status: 400 }
        );
      }
      await db.update(submissions).set({ answerText, submission_type: "text" }).where(eq(submissions.id, submissionId));
    } else if (submissionType === "photo") {
      if (photos.length === 0) {
        return NextResponse.json(
          { message: "At least one photo is required for photo submissions" },
          { status: 400 }
        );
      }

      // Delete existing photos for this submission if we are replacing them (or adding to them)
      // For now, let's assume new photos are added, not replaced.
      // If replacement is desired, we'd delete all submissionPhotos for submissionId here.

      for (const photo of photos) {
        const bytes = await photo.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Data = buffer.toString("base64");
        const photoDataUrl = `data:${photo.type};base64,${base64Data}`;

        await db.insert(submissionPhotos).values({
          submissionId: submissionId,
          photo_data: photoDataUrl,
        });
      }
      await db.update(submissions).set({ submission_type: "photo" }).where(eq(submissions.id, submissionId));
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

      await db.update(submissions).set({ video_url: videoUrl, submission_type: "video" }).where(eq(submissions.id, submissionId));
    } else {
      return NextResponse.json(
        { message: "Invalid submission type" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Submission successful", submissionId });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { message: "Error creating submission", error },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("gameId");
  const questionId = searchParams.get("questionId");

  console.log("Session in GET /api/public/submissions:", session);

  if (!session || !session.user || !session.user.id) {
    console.log("Unauthorized: Session or user ID missing.");
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const authenticatedUserId = session.user.id;
  console.log("Authenticated User ID:", authenticatedUserId);

  // Find the player associated with the authenticated user ID
  const playerRecord = await db.query.players.findFirst({
    where: eq(players.userId, authenticatedUserId),
  });

  console.log("Player Record found:", playerRecord);

  if (!playerRecord) {
    console.log("Player not found for this user:", authenticatedUserId);
    return NextResponse.json({ message: "Player not found for this user" }, { status: 404 });
  }

  const authenticatedPlayerId = playerRecord.id;
  console.log("Authenticated Player ID:", authenticatedPlayerId);

  if (!gameId) {
    console.log("gameId is missing.");
    return NextResponse.json(
      { message: "gameId is required" },
      { status: 400 }
    );
  }

  let whereConditions: any[] = [
    eq(players.gameId, parseInt(gameId)),
    eq(submissions.playerId, authenticatedPlayerId) // Filter by the authenticated player's ID
  ];

  if (questionId) {
    whereConditions.push(eq(submissions.questionId, parseInt(questionId)));
  }

  const rawSubmissions = await db
    .select({
      id: submissions.id,
      playerId: submissions.playerId,
      questionId: submissions.questionId,
      teamId: players.teamId,
      status: submissions.status,
      score: submissions.score,
      answerText: submissions.answerText,
      video_url: submissions.video_url,
      submissionType: submissions.submission_type,
      photo_data: submissionPhotos.photo_data,
      photo_id: submissionPhotos.id,
    })
    .from(submissions)
    .leftJoin(players, eq(submissions.playerId, players.id))
    .leftJoin(submissionPhotos, eq(submissions.id, submissionPhotos.submissionId))
    .where(and(...whereConditions));

  // Group photos by submission
  const groupedSubmissions = rawSubmissions.reduce((acc, row) => {
    let existingSubmission = acc.find((s) => s.id === row.id);

    if (!existingSubmission) {
      existingSubmission = {
        id: row.id,
        playerId: row.playerId,
        questionId: row.questionId,
        teamId: row.teamId,
        status: row.status,
        score: row.score,
        answerText: row.answerText,
        video_url: row.video_url,
        submissionType: row.submissionType,
        submission_photos: [],
        _photoIds: new Set(), // Internal set to track photo IDs for uniqueness
      };
      acc.push(existingSubmission);
    }

    if (row.photo_data && row.photo_id && !existingSubmission._photoIds.has(row.photo_id)) {
      existingSubmission.submission_photos.push({ id: row.photo_id, photo_data: row.photo_data });
      existingSubmission._photoIds.add(row.photo_id);
    }
    return acc;
  }, [] as any[]);

  // Clean up the internal _photoIds set before returning
  groupedSubmissions.forEach((sub) => {
    delete sub._photoIds;
  });

  return NextResponse.json(groupedSubmissions);
}