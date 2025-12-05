"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

type Submission = {
  submission: {
    id: number;
    questionId: number;
    answerText: string | null;
    submission_photos: { id: number; url: string }[]; // Changed from photo_url: string | null;
    video_url: string | null;
    status: string;
    score: number | null;
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
  category: {
    id: number;
    name: string;
  };
};

type Game = {
  id: number;
  name: string;
};

type Team = {
  id: number;
  name: string;
};

type Category = {
  id: number;
  name: string;
};

export default function SubmissionsPage() {
  const searchParams = useSearchParams();
  const gameIdFromUrl = searchParams.get("gameId");

  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(
    gameIdFromUrl ? parseInt(gameIdFromUrl) : null
  );
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [scores, setScores] = useState<{ [key: number]: number }>({});
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/games")
      .then((res) => res.json())
      .then((data) => {
        setGames(data);
        if (!selectedGameId && data.length > 0) {
          setSelectedGameId(data[0].id);
        }
      });
  }, [selectedGameId]);

  useEffect(() => {
    if (selectedGameId) {
      fetch(`/api/admin/teams?gameId=${selectedGameId}`)
        .then((res) => res.json())
        .then((data) => setTeams(data));

      fetch(`/api/admin/categories?gameId=${selectedGameId}`)
        .then((res) => res.json())
        .then((data) => setCategories(data));

      fetch(`/api/admin/submissions?gameId=${selectedGameId}`)
        .then((res) => res.json())
        .then((data) => setSubmissions(data));
    }
  }, [selectedGameId]);

  useEffect(() => {
    if (selectedGameId) {
      fetch(`/api/admin/questions?gameId=${selectedGameId}`)
        .then((res) => res.json())
        .then((data) => setQuestions(data));
    }
  }, [selectedGameId]);

  const handleGrade = (submissionId: number) => {
    const score = scores[submissionId];
    if (score === undefined) {
      return;
    }

    fetch(`/api/admin/submissions/${submissionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ score }),
    }).then(() => {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.submission.id === submissionId
            ? {
                ...s,
                submission: { ...s.submission, status: "graded", score },
              }
            : s
        )
      );
    });
  };

  const filteredSubmissions = submissions
    .filter(
      (submission) =>
        !selectedTeam || submission.team.name === selectedTeam
    )
    .filter(
      (submission) =>
        !selectedCategory || submission.category.name === selectedCategory
    );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 font-permanent-marker">Submissions</h1>
      <div className="flex space-x-4 mb-4">
        <select
          className="w-full bg-input text-[#476c2e] border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
          value={selectedGameId || ""}
          onChange={(e) => setSelectedGameId(Number(e.target.value))}
        >
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
        <select
          className="w-full bg-input text-[#476c2e] border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
          value={selectedTeam || ""}
          onChange={(e) => setSelectedTeam(e.target.value)}
        >
          <option value="">All Teams</option>
          {teams.map((team) => (
            <option key={team.id} value={team.name}>
              {team.name}
            </option>
          ))}
        </select>
        <select
          className="w-full bg-input text-[#476c2e] border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
          value={selectedCategory || ""}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-4">
        {filteredSubmissions.map(
          ({ submission, player, question, team, category }) => (
            <div key={submission.id} className="border p-4 rounded-lg">
              <div className="font-bold">
                {team.name} - {player.name}
              </div>
              <div>
                {category.name} - {question.questionText}
              </div>
              <div style={{ color: "#476c2e" }}>
                {questions.find((q) => q.id === submission.questionId)?.points} points
              </div>
              {submission.answerText && <div>{submission.answerText}</div>}
              {submission.submission_photos && submission.submission_photos.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {submission.submission_photos.map((photo) => (
                    <Image
                      key={photo.id}
                      src={photo.url}
                      alt="submission"
                      width={600}
                      height={600}
                      className="max-w-xs cursor-pointer"
                      onClick={() => setEnlargedPhoto(photo.url)}
                    />
                  ))}
                </div>
              )}
              {submission.video_url && (
                <video
                  src={submission.video_url}
                  controls
                  className="max-w-xs"
                />
              )}
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-20 text-[#476c2e]"
                  placeholder="Score"
                  defaultValue={submission.score || ""}
                  onChange={(e) =>
                    setScores({
                      ...scores,
                      [submission.id]: parseInt(e.target.value),
                    })
                  }
                />
                <button
                  className="bg-blue-500 text-white px-4 py-1 rounded"
                  onClick={() => handleGrade(submission.id)}
                >
                  {submission.status === "graded" ? "Update" : "Grade"}
                </button>
              </div>
            </div>
          )
        )}
      </div>
      {enlargedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setEnlargedPhoto(null)}
        >
          <Image
            src={enlargedPhoto}
            alt="enlarged submission"
            width={1200}
            height={1200}
            className="max-w-full max-h-full"
          />
        </div>
      )}
    </div>
  );
}
