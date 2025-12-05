"use client";

import { useState, useEffect } from "react";

type User = {
  id: string; // Changed to string
  name: string;
  email: string;
  role: string;
};

type Team = {
  id: number;
  name: string;
  gameId: number;
};

type Game = {
  id: number;
  name: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerTeamId, setNewPlayerTeamId] = useState<number | null>(null);
  const [newPlayerGameId, setNewPlayerGameId] = useState<number | null>(null); // Initialize with default game if only one exists

  const fetchUsersAndTeamsAndGames = async () => {
    try {
      const usersResponse = await fetch("/api/admin/users");
      const usersData = await usersResponse.json();
      setUsers(usersData);

      const teamsResponse = await fetch("/api/teams");
      const teamsData = await teamsResponse.json();
      setTeams(teamsData);

      const gamesResponse = await fetch("/api/admin/games");
      const gamesData = await gamesResponse.json();
      setGames(gamesData);

      if (gamesData.length === 1) {
        setNewPlayerGameId(gamesData[0].id); // Set default game if only one exists
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndTeamsAndGames();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => { // userId is string
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user role");
      }

      // Optimistically update UI or refetch
      fetchUsersAndTeamsAndGames();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName || !newPlayerTeamId || !newPlayerGameId) {
      setError("Player name, team, and game are required.");
      return;
    }
    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPlayerName,
          teamId: newPlayerTeamId,
          gameId: newPlayerGameId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add player");
      }

      setNewPlayerName("");
      setNewPlayerTeamId(null);
      setNewPlayerGameId(null);
      // No need to refetch users, as players are separate
    } catch (err: any) {
      setError(err.message);
    }
  };


  if (loading) {
    return <div className="p-4">Loading users...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <header className="bg-background p-4 text-center z-10 shadow-md">
        <h1 className="text-2xl font-permanent-marker">Manage Users & Players</h1>
      </header>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Add New Player</h2>
        <form onSubmit={handleAddPlayer} className="space-y-4 mb-8">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Player Name"
            className="w-full bg-input text-[#476c2e] border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <select
            value={newPlayerGameId || ""}
            onChange={(e) => {
              setNewPlayerGameId(Number(e.target.value));
              setNewPlayerTeamId(null); // Reset team when game changes
            }}
            className="w-full bg-input text-[#476c2e] border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
            required
          >
            <option value="" disabled>Select a Game</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
          <select
            value={newPlayerTeamId || ""}
            onChange={(e) => setNewPlayerTeamId(Number(e.target.value))}
            className="w-full bg-input text-[#476c2e] border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
            required
            disabled={!newPlayerGameId}
          >
            <option value="" disabled>Select a Team</option>
            {teams
              .filter((team) => team.gameId === newPlayerGameId)
              .map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
          </select>
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-bold hover:bg-primary/90 transition-colors"
          >
            Add Player
          </button>
        </form>

        <h2 className="text-xl font-bold mb-4">Manage Users (Admins & Judges)</h2>
        <ul className="space-y-4">
          {users.map((user) => (
            <li
              key={user.id}
              className="p-4 bg-card rounded-lg shadow-md flex justify-between items-center"
            >
              <div>
                <p className="font-bold">{user.name}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
                <p className="text-sm text-gray-400">Role: {user.role}</p>
              </div>
              <div className="space-x-2">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="bg-input text-[#476c2e] border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="judge">Judge</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}