"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { GameScore } from "@/components/GameScore";

type Submission = {
  submission: {
    id: number;
    answerText: string | null;
    photo_url: string | null;
    status: string;
  };
  player: {
    name: string;
  };
  question: {
    questionText: string;
  };
  team: {
    name: string;
  };
};

type Game = {
  id: number;
  name: string;
};

export default function AdminDashboardPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState(0);
  const [totalPointsGranted, setTotalPointsGranted] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [showGameScore, setShowGameScore] = useState(false);

  useEffect(() => {
    if (selectedGameId) {
      fetch(`/api/admin/questions?gameId=${selectedGameId}`)
        .then((res) => res.json())
        .then((data) => setQuestions(data));
    }
  }, [selectedGameId]);

  useEffect(() => {
    fetch("/api/admin/games")
      .then((res) => res.json())
      .then((data) => {
        setGames(data);
      });
  }, []);

  useEffect(() => {
    if (selectedGameId) {
      fetch(`/api/admin/submissions?gameId=${selectedGameId}`)
        .then((res) => res.json())
        .then((data) => setSubmissions(data));

      fetch(`/api/admin/submissions/count?gameId=${selectedGameId}`)
        .then((res) => res.json())
        .then((data) => setPendingSubmissionsCount(data.count));

      fetch(`/api/admin/points/total?gameId=${selectedGameId}`)
        .then((res) => res.json())
        .then((data) => setTotalPointsGranted(data.totalPoints));
    }
  }, [selectedGameId]);

  return (
    <div className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8 font-permanent-marker">Admin Dashboard</h1>

      <div className="mb-8">
        <Image
          src="/assets/benfunnyhs.jpg"
          alt="Ben Funny"
          width={500}
          height={300}
          className="rounded-lg shadow-md"
        />
      </div>
      <div className="w-full max-w-6xl mb-8">
        <label htmlFor="game-select" className="block text-lg font-medium mb-2">
          Select a game:
        </label>
        <select
          id="game-select"
          className="w-full bg-input text-[#476c2e] border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
          value={selectedGameId || ""}
          onChange={(e) => setSelectedGameId(Number(e.target.value))}
        >
          <option value="" disabled>
            Select a game
          </option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl">
        <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: "#7fab61" }}>
          <h2 className="text-2xl font-bold mb-4">Submissions</h2>
          <p className="text-lg">Pending for grading: {pendingSubmissionsCount}</p>
          <Link href={selectedGameId ? `/admin/submissions?gameId=${selectedGameId}` : "/admin/submissions"}>
            <p className="text-primary hover:underline">Grade Submissions</p>
          </Link>
        </div>
        <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: "#7fab61" }}>
          <h2 className="text-2xl font-bold mb-4">Games</h2>
          <Link href={selectedGameId ? `/admin/games?gameId=${selectedGameId}` : "/admin/games"}>
            <p className="text-primary hover:underline">Manage Games & Teams</p>
          </Link>
        </div>
        <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: "#7fab61" }}>
          <h2 className="text-2xl font-bold mb-4">Users</h2>
          <Link href="/admin/users">
            <p className="text-primary hover:underline">Manage Users</p>
          </Link>
        </div>
        <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: "#7fab61" }}>
          <h2 className="text-2xl font-bold mb-4">Points</h2>
          <p className="text-lg">Total granted: {totalPointsGranted}</p>
        </div>
        <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: "#7fab61" }}>
          <h2 className="text-2xl font-bold mb-4">Game Score</h2>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={() => setShowGameScore(true)}
          >
            View Scores
          </button>
        </div>
        <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: "#7fab61" }}>
          <h2 className="text-2xl font-bold mb-4">Game Over</h2>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={() => setShowGameScore(true)}
          >
            End Game & View Final Scores
          </button>
        </div>
      </div>
      {showGameScore && selectedGameId && (
        <GameScore
          gameId={selectedGameId}
          onClose={() => setShowGameScore(false)}
        />
      )}
    </div>
  );
}
