import { db } from "@/db";
import { submissions, players, questions, teams, categories, submissionPhotos } from "@/db/schema"; // Added submissionPhotos
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

console.log("Is db defined after import in /api/admin/submissions/route.ts?", !!db);

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

  try {
    const rawSubmissions = await db
      .select({
        submission: submissions,
        player: players,
        question: questions,
        team: teams,
        category: categories,
        photo_id: submissionPhotos.id, // Select photo ID
        photo_data: submissionPhotos.photo_data, // Select photo data
      })
      .from(submissions)
      .leftJoin(players, eq(submissions.playerId, players.id))
      .leftJoin(questions, eq(submissions.questionId, questions.id))
      .leftJoin(teams, eq(players.teamId, teams.id))
      .leftJoin(categories, eq(questions.categoryId, categories.id))
      .leftJoin(submissionPhotos, eq(submissions.id, submissionPhotos.submissionId)) // Join with submissionPhotos
      .where(eq(questions.gameId, parseInt(gameId)));

    console.log("Raw submissions from DB:", rawSubmissions.length);

    // Group submissions by team and question
    console.log("Before reduce");
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
          category: row.category,
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
        photo_data: row.photo_data,
      });

      // Aggregate answer text
      if (row.submission.answerText) {
        existingTeamQuestionSubmission.aggregatedAnswerText.push(row.submission.answerText);
      }

      // Aggregate photos
      if (row.photo_data && row.photo_id) {
        const photoExists = existingTeamQuestionSubmission.aggregatedPhotos.some(
          (photo: { id: number; photo_data: string }) => photo.id === row.photo_id
        );
        if (!photoExists) {
          existingTeamQuestionSubmission.aggregatedPhotos.push({ id: row.photo_id, photo_data: row.photo_data });
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
    console.log("After reduce");

    console.log("Before map");
    const finalGroupedSubmissions = Array.from(groupedByTeamAndQuestion.values()).map(
      (group: any) => {
        // Combine aggregated answer texts into a single string or array
        const aggregatedAnswerText = group.aggregatedAnswerText.join(" | "); // Or format as needed

        // Map aggregated photos to the expected submission_photos structure
        const submissionPhotos = group.aggregatedPhotos;
        const videoUrl = group.aggregatedVideos.length > 0 ? group.aggregatedVideos[0] : null; // For simplicity, take the first video

        // Remove temporary aggregation fields
        delete group.aggregatedAnswerText;
        delete group.aggregatedPhotos;
        delete group.aggregatedVideos;
        // delete group.submissions; // Removed this line to fix the error

        return {
          submission: {
            id: group.submissions[0]?.id || null, // Use the ID of the first submission for the group
            questionId: group.question.id,
            answerText: aggregatedAnswerText,
            submission_photos: submissionPhotos,
            video_url: videoUrl,
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
    console.log("After map");

    console.log("Fetched and grouped submissions by team and question:", finalGroupedSubmissions.length);

    return NextResponse.json(finalGroupedSubmissions);
  } catch (error) {
    console.error("Error fetching admin submissions:", error);
    return NextResponse.json(
      { message: "Error fetching admin submissions", error: (error as Error).message },
      { status: 500 }
    );
  }
}