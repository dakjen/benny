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
  const [selectedGameId, setSelectedGameId] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const storedGameId = localStorage.getItem('selectedGameId');
      return storedGameId ? Number(storedGameId) : null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null); // State for editing team
  const [editedTeamName, setEditedTeamName] = useState(""); // State for edited team name

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

  // Effect to save selectedGameId to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (selectedGameId !== null) {
        localStorage.setItem('selectedGameId', selectedGameId.toString());
      } else {
        localStorage.removeItem('selectedGameId');
      }
    }
  }, [selectedGameId]);

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

  const handleEditTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setEditedTeamName(team.name);
  };

  const handleSaveTeam = async (teamId: number) => {
    try {
      const response = await fetch(`/api/admin/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editedTeamName }),
      });

      if (!response.ok) {
        throw new Error("Failed to update team name");
      }

      setEditingTeamId(null);
      setEditedTeamName("");
      fetchGamesAndTeams();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingTeamId(null);
    setEditedTeamName("");
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
            onChange={(e) => {
              setSelectedGameId(Number(e.target.value));
              setNewTeamName(""); // Clear team name when game changes
            }}
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
                  <li key={team.id} className="flex justify-between items-center py-1">
                    {editingTeamId === team.id ? (
                      <div className="flex items-center w-full">
                        <input
                          type="text"
                          value={editedTeamName}
                          onChange={(e) => setEditedTeamName(e.target.value)}
                          className="flex-1 bg-input text-card-foreground border border-border rounded-lg py-1 px-2 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button
                          onClick={() => handleSaveTeam(team.id)}
                          className="ml-2 bg-green-500 text-white rounded-lg px-3 py-1 hover:bg-green-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="ml-2 bg-gray-500 text-white rounded-lg px-3 py-1 hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span>{team.name}</span>
                        <button
                          onClick={() => handleEditTeam(team)}
                          className="ml-4 bg-blue-500 text-white rounded-lg px-3 py-1 hover:bg-blue-600"
                        >
                          Edit
                        </button>
                      </>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
