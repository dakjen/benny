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

  // Group submissions by team and question
  const groupedByTeamAndQuestion = rawSubmissions.reduce((acc, row) => {
    if (!row.team || !row.question || !row.submission) {
      // Skip rows where team, question, or submission data is incomplete
      return acc;
    }
    const teamQuestionKey = `${row.team.id}-${row.question.id}`;
    let existingTeamQuestionSubmission = acc.get(teamQuestionKey);

    if (!existingTeamQuestionSubmission) {
      existingTeamQuestionSubmission = {
        team: row.team,
        question: row.question,
        submissions: [], // Array to hold individual player submissions
        aggregatedAnswerText: [],
        aggregatedPhotos: [],
        aggregatedVideos: [],
        status: "pending", // Default status for aggregated submission
        score: null, // Default score
      };
      acc.set(teamQuestionKey, existingTeamQuestionSubmission);
    }

    // Add individual submission details
    existingTeamQuestionSubmission.submissions.push({
      id: row.submission.id,
      playerId: row.submission.playerId,
      answerText: row.submission.answerText,
      video_url: row.submission.video_url,
      submission_type: row.submission.submission_type,
      status: row.submission.status,
      score: row.submission.score,
      photo_id: row.photo_id,
      photo_url: row.photo_url,
    });

    // Aggregate answer text
    if (row.submission.answerText) {
      existingTeamQuestionSubmission.aggregatedAnswerText.push(row.submission.answerText);
    }

    // Aggregate photos
    if (row.photo_url && row.photo_id) {
      const photoExists = existingTeamQuestionSubmission.aggregatedPhotos.some(
        (photo: { id: number; url: string }) => photo.id === row.photo_id
      );
      if (!photoExists) {
        existingTeamQuestionSubmission.aggregatedPhotos.push({ id: row.photo_id, url: row.photo_url });
      }
    }

    // Aggregate videos
    if (row.submission.video_url) {
      const videoExists = existingTeamQuestionSubmission.aggregatedVideos.some(
        (videoUrl: string) => videoUrl === row.submission.video_url
      );
      if (!videoExists) {
        existingTeamQuestionSubmission.aggregatedVideos.push(row.submission.video_url);
      }
    }

    // Determine overall status and score (simple logic for now, can be refined)
    // If any submission is graded, the aggregated submission is graded.
    // If all are pending, it's pending.
    if (row.submission.status === "graded") {
      existingTeamQuestionSubmission.status = "graded";
      if (row.submission.score !== null) {
        // Simple sum for now, can be averaged or other logic
        existingTeamQuestionSubmission.score = (existingTeamQuestionSubmission.score || 0) + row.submission.score;
      }
    }

    return acc;
  }, new Map());

  const finalGroupedSubmissions = Array.from(groupedByTeamAndQuestion.values()).map(
    (group: any) => {
      // Combine aggregated answer texts into a single string or array
      group.aggregatedAnswerText = group.aggregatedAnswerText.join(" | "); // Or format as needed

      // Map aggregated photos to the expected submission_photos structure
      group.submission.submission_photos = group.aggregatedPhotos;
      group.submission.video_url = group.aggregatedVideos.length > 0 ? group.aggregatedVideos[0] : null; // For simplicity, take the first video

      // Remove temporary aggregation fields
      delete group.aggregatedAnswerText;
      delete group.aggregatedPhotos;
      delete group.aggregatedVideos;
      delete group.submissions; // Remove individual submissions if not needed on frontend

      return {
        submission: {
          id: group.submissions[0]?.id || null, // Use the ID of the first submission for the group
          questionId: group.question.id,
          answerText: group.aggregatedAnswerText,
          submission_photos: group.submission.submission_photos,
          video_url: group.submission.video_url,
          status: group.status,
          score: group.score,
        },
        player: { name: "Team Aggregated" }, // Placeholder player for aggregated view
        question: group.question,
        team: group.team,
        category: group.category,
      };
    }
  );

  console.log("Fetched and grouped submissions by team and question:", finalGroupedSubmissions);

  return NextResponse.json(finalGroupedSubmissions);
}