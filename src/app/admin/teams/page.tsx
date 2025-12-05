"use client";

import { useState, useEffect } from "react";

type Team = {
  id: number;
  name: string;
  gameId: number; // Add gameId to Team type
};

type Game = {
  id: number;
  name: string;
};

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]); // New state for games
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null); // New state for selected game
  const [teamName, setTeamName] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const fetchGames = async () => {
    const response = await fetch("/api/admin/games");
    const data = await response.json();
    setGames(data);
    if (data.length === 1) { // Only select if there's exactly one game
      setSelectedGameId(data[0].id);
    }
  };

  const fetchTeams = async (gameId: number) => {
    const response = await fetch(`/api/teams?gameId=${gameId}`);
    const data = await response.json();
    setTeams(data);
  };

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    if (selectedGameId) {
      fetchTeams(selectedGameId);
    }
  }, [selectedGameId]);

    const handleAddTeam = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!teamName || selectedGameId === null) return;
  
      await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName, gameId: selectedGameId }),
      });
  
      fetchTeams(selectedGameId);
      setTeamName("");
    };
  
    const handleEditTeam = (team: Team) => {
      setEditingTeam(team);
      setTeamName(team.name);
    };
  
    const handleUpdateTeam = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingTeam || selectedGameId === null) return;
  
      await fetch(`/api/teams/${editingTeam.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName, gameId: selectedGameId }), // Pass gameId for consistency
      });
  
      fetchTeams(selectedGameId);
      setEditingTeam(null);
      setTeamName("");
    };
  
    const handleDeleteTeam = async (id: number) => {
      if (selectedGameId === null) return;
      await fetch(`/api/teams/${id}`, {
        method: "DELETE",
      });
      fetchTeams(selectedGameId);
    };
  
    return (
      <div className="p-4">
        <header className="bg-background p-4 text-center z-10 shadow-md">
          <h1 className="text-2xl font-permanent-marker">Manage Teams</h1>
        </header>
  
        <div className="mt-8 max-w-lg mx-auto">
          <h2 className="text-xl font-bold mb-4">Select Game</h2>
          <select
            value={selectedGameId || ""}
            onChange={(e) => setSelectedGameId(Number(e.target.value))}
            className="w-full bg-input text-[#476c2e] border border-border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring mb-8"
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
          <>
            <div className="mt-8">
              <form onSubmit={editingTeam ? handleUpdateTeam : handleAddTeam} className="space-y-4 max-w-lg mx-auto">
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Team Name"
                  className="w-full bg-input text-[#476c2e] border border-border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-bold hover:bg-primary/90 transition-colors"
                >
                  {editingTeam ? "Update Team" : "Add Team"}
                </button>
                {editingTeam && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeam(null);
                      setTeamName("");
                    }}
                    className="w-full bg-gray-500 text-white rounded-lg py-3 font-bold hover:bg-gray-600 transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
              </form>
            </div>
  
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">Existing Teams</h2>
              <ul className="space-y-4">
                {teams.map((t) => (
                  <li key={t.id} className="p-4 bg-card rounded-lg shadow-md flex justify-between items-center">
                    <p className="font-bold">{t.name}</p>
                    <div className="space-x-2">
                      <button onClick={() => handleEditTeam(t)} className="text-blue-500 hover:text-blue-700">Edit</button>
                      <button onClick={() => handleDeleteTeam(t.id)} className="text-red-500 hover:text-red-700">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    );
  }