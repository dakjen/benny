import { db } from "@/db";
import { submissions, players, questions, teams, categories, submissionPhotos } from "@/db/schema"; // Added submissionPhotos
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("gameId");

  if (!gameId) {
    return NextResponse.json(
      { message: "gameId is required" },
      { status: 400 }
    );
  }

  console.log("Fetching submissions for gameId:", gameId);

  const rawSubmissions = await db
    .select({
      submission: submissions,
      player: players,
      question: questions,
      team: teams,
      category: categories,
      photo_id: submissionPhotos.id, // Select photo ID
      photo_url: submissionPhotos.photo_url, // Select photo URL
    })
    .from(submissions)
    .leftJoin(players, eq(submissions.playerId, players.id))
    .leftJoin(questions, eq(submissions.questionId, questions.id))
    .leftJoin(teams, eq(players.teamId, teams.id))
    .leftJoin(categories, eq(questions.categoryId, categories.id))
    .leftJoin(submissionPhotos, eq(submissions.id, submissionPhotos.submissionId)) // Join with submissionPhotos
    .where(eq(questions.gameId, parseInt(gameId)));

  // Group photos by submission
  const groupedSubmissions = rawSubmissions.reduce((acc, row) => {
    let existingSubmission = acc.find((s) => s.submission.id === row.submission.id);

    if (!existingSubmission) {
      existingSubmission = {
        submission: {
          ...row.submission,
          submission_photos: [], // Initialize submission_photos array
        },
        player: row.player,
        question: row.question,
        team: row.team,
        category: row.category,
      };
      acc.push(existingSubmission);
    }

    if (row.photo_url && row.photo_id) {
      // Ensure uniqueness of photos within a submission
      const photoExists = existingSubmission.submission.submission_photos.some(
        (photo: { id: number; url: string }) => photo.id === row.photo_id
      );
      if (!photoExists) {
        existingSubmission.submission.submission_photos.push({ id: row.photo_id, url: row.photo_url });
      }
    }
    return acc;
  }, [] as any[]);

  console.log("Fetched and grouped submissions:", groupedSubmissions);

  return NextResponse.json(groupedSubmissions);
}