"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type Submission = {
  id: number;
  playerId: number;
  questionId: number;
  teamId: number;
  answerText: string | null;
  submission_type: "photo" | "text" | "video";
  video_url: string | null;
  status: "draft" | "pending" | "graded";
  score: number | null;
  submittedAt: string;
  gradedBy: string | null;
  gradedAt: string | null;
};

type Player = {
  id: number;
  name: string;
  teamId: number;
  gameId: number;
};

type Team = {
  id: number;
  name: string;
  gameId: number;
};

type Question = {
  id: number;
  questionText: string;
  categoryId: number | null;
  expectedAnswer?: string;
  gameId: number;
  points: number;
};

type Game = {
  id: number;
  name: string;
};

type Category = {
  id: number;
  name: string;
  gameId: number;
};

export default function GameSummaryPage() {
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // New state for categories
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {


      try {
        // Fetch games
        const gamesResponse = await fetch("/api/admin/games");
        if (!gamesResponse.ok) throw new Error("Failed to fetch games.");
        const gamesData = await gamesResponse.json();
        setGames(gamesData);

        // Set initial selected game if available
        if (gamesData.length > 0 && !selectedGameId) {
          setSelectedGameId(gamesData[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session, selectedGameId]);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!selectedGameId) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch submissions for the selected game
        const submissionsResponse = await fetch(`/api/admin/submissions?gameId=${selectedGameId}`);
        if (!submissionsResponse.ok) throw new Error("Failed to fetch submissions.");
        const submissionsData = await submissionsResponse.json();
        setSubmissions(submissionsData);

        // Fetch players for the selected game
        const playersResponse = await fetch(`/api/admin/players?gameId=${selectedGameId}`);
        if (!playersResponse.ok) throw new Error("Failed to fetch players.");
        const playersData = await playersResponse.json();
        setPlayers(playersData);

        // Fetch teams for the selected game
        const teamsResponse = await fetch(`/api/admin/teams?gameId=${selectedGameId}`);
        if (!teamsResponse.ok) throw new Error("Failed to fetch teams.");
        const teamsData = await teamsResponse.json();
        setTeams(teamsData);

        // Fetch questions for the selected game
        const questionsResponse = await fetch(`/api/admin/questions?gameId=${selectedGameId}`);
        if (!questionsResponse.ok) throw new Error("Failed to fetch questions.");
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData);

        // Fetch categories for the selected game
        const categoriesResponse = await fetch(`/api/admin/categories?gameId=${selectedGameId}`);
        if (!categoriesResponse.ok) throw new Error("Failed to fetch categories.");
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGameData();
  }, [selectedGameId]);

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "judge")) {
    return <div className="text-center p-4 text-red-500">You are not authorized to view this page.</div>;
  }

  const getPlayerName = (playerId: number) => players.find(p => p.id === playerId)?.name || "Unknown Player";
  const getTeamName = (teamId: number) => teams.find(t => t.id === teamId)?.name || "Unknown Team";
  const getQuestionText = (questionId: number) => questions.find(q => q.id === questionId)?.questionText || "Unknown Question";
  const getQuestionPoints = (questionId: number) => questions.find(q => q.id === questionId)?.points || 0;
  const getCategoryName = (categoryId: number | null) => {
    if (categoryId === null) return "No Category";
    return categories.find(cat => cat.id === categoryId)?.name || "Unknown Category";
  };

  return (
    <div className="flex flex-col h-full bg-card text-foreground p-4">
      <h1 className="text-2xl font-permanent-marker mb-4 text-center">Game Submissions Summary</h1>

      <div className="mb-4">
        <label htmlFor="game-select" className="block text-sm font-medium text-gray-300 mb-1">Select Game:</label>
        <select
          id="game-select"
          value={selectedGameId || ""}
          onChange={(e) => setSelectedGameId(Number(e.target.value))}
          className="w-full bg-input text-card-foreground border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="" disabled>Select a Game</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
      </div>

      {selectedGameId && (
        <div className="flex-1 overflow-y-auto">
          {submissions.length === 0 ? (
            <p className="text-center text-gray-500 mt-8">No submissions found for this game.</p>
          ) : (
            <div className="space-y-6">
              {submissions.map((submission) => (
                <div key={submission.id} className="bg-secondary p-4 rounded-lg shadow-md">
                  <p className="text-lg font-bold">{getQuestionText(submission.questionId)} ({getQuestionPoints(submission.questionId)} points)</p>
                  <p className="text-sm text-gray-300">Category: {getCategoryName(questions.find(q => q.id === submission.questionId)?.categoryId || null)}</p>
                  <p className="text-sm text-gray-300">Team: {getTeamName(submission.teamId)} | Player: {getPlayerName(submission.playerId)}</p>
                  <p className="text-sm text-gray-300">Status: {submission.status} | Score: {submission.score !== null ? submission.score : "N/A"}</p>
                  {submission.answerText && <p className="mt-2">Answer: {submission.answerText}</p>}
                  {submission.submission_type === "photo" && submission.answerText && (
                    <div className="mt-2">
                      <p>Photo Submission:</p>
                      <img src={submission.answerText} alt="Submission" className="max-w-full h-auto rounded-md mt-1" />
                    </div>
                  )}
                  {submission.submission_type === "video" && submission.video_url && (
                    <div className="mt-2">
                      <p>Video Submission:</p>
                      <video controls src={submission.video_url} className="max-w-full h-auto rounded-md mt-1" />
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">Submitted: {new Date(submission.submittedAt).toLocaleString()}</p>
                  {submission.gradedBy && <p className="text-xs text-gray-400">Graded By: {submission.gradedBy} at {new Date(submission.gradedAt!).toLocaleString()}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
