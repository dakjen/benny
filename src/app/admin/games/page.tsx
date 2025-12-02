"use client";

import { useState, useEffect } from "react";

type Game = {
  id: number;
  name: string;
};

type Team = {
  id: number;
  name: string;
  gameId: number;
};

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [newGameName, setNewGameName] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGamesAndTeams = async () => {
    try {
      const gamesResponse = await fetch("/api/admin/games");
      const gamesData = await gamesResponse.json();
      setGames(gamesData);

      const teamsResponse = await fetch("/api/admin/teams");
      const teamsData = await teamsResponse.json();
      setTeams(teamsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGamesAndTeams();
  }, []);

  const handleAddGame = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGameName }),
      });

      if (!response.ok) {
        throw new Error("Failed to add game");
      }

      setNewGameName("");
      fetchGamesAndTeams();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGameId === null) {
      setError("Please select a game first.");
      return;
    }
    try {
      const response = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName, gameId: selectedGameId }),
      });

      if (!response.ok) {
        throw new Error("Failed to add team");
      }

      setNewTeamName("");
      fetchGamesAndTeams();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="p-4">Loading games and teams...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <header className="bg-background p-4 text-center z-10 shadow-md">
        <h1 className="text-2xl font-permanent-marker">Manage Games & Teams</h1>
      </header>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Add New Game</h2>
        <form onSubmit={handleAddGame} className="space-y-4 mb-8">
          <input
            type="text"
            value={newGameName}
            onChange={(e) => setNewGameName(e.target.value)}
            placeholder="Game Name"
            className="w-full bg-input text-card-foreground border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-bold hover:bg-primary/90 transition-colors"
          >
            Add Game
          </button>
        </form>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Add New Team to Game</h2>
        <form onSubmit={handleAddTeam} className="space-y-4 mb-8">
          <select
            value={selectedGameId || ""}
            onChange={(e) => setSelectedGameId(Number(e.target.value))}
            className="w-full bg-input text-card-foreground border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="" disabled>Select a Game</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Team Name"
            className="w-full bg-input text-card-foreground border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-bold hover:bg-primary/90 transition-colors"
          >
            Add Team
          </button>
        </form>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Existing Games & Teams</h2>
        {games.map((game) => (
          <div key={game.id} className="mb-6 p-4 bg-card rounded-lg shadow-md">
            <h3 className="text-lg font-bold mb-2">{game.name}</h3>
            <ul className="list-disc pl-5">
              {teams
                .filter((team) => team.gameId === game.id)
                .map((team) => (
                  <li key={team.id}>{team.name}</li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
