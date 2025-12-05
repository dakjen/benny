"use client";

import { useState, useEffect } from "react";

type Team = {
  id: number;
  name: string;
  score: number;
};

export function GameScore({
  gameId,
  onClose,
}: {
  gameId: number;
  onClose: () => void;
}) {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    if (gameId) {
      fetch(`/api/admin/teams?gameId=${gameId}`)
        .then((res) => res.json())
        .then((data) => {
          const promises = data.map((team: any) =>
            fetch(`/api/admin/points/total?teamId=${team.id}`).then((res) =>
              res.json()
            )
          );
          Promise.all(promises).then((scores) => {
            const teamsWithScores = data.map((team: any, index: number) => ({
              ...team,
              score: scores[index].totalPoints,
            }));
            teamsWithScores.sort((a: Team, b: Team) => b.score - a.score);
            setTeams(teamsWithScores);
          });
        });
    }
  }, [gameId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg text-[#476c2e]" style={{ fontFamily: 'var(--font-permanent-marker)' }}>
        <h2 className="text-6xl font-bold mb-4">Game Score</h2>
        <div className="space-y-4">
          {teams.map((team) => (
            <div key={team.id} className="flex justify-between text-5xl">
              <div className="font-bold">{team.name}</div>
              <div>{team.score}</div>
            </div>
          ))}
        </div>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
