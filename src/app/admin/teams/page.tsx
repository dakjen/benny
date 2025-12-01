"use client";

import { useState, useEffect } from "react";

type Team = {
  id: number;
  name: string;
};

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const fetchTeams = async () => {
    const response = await fetch("/api/teams");
    const data = await response.json();
    setTeams(data);
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName) return;

    await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: teamName }),
    });

    fetchTeams();
    setTeamName("");
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    await fetch(`/api/teams/${editingTeam.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: teamName }),
    });

    fetchTeams();
    setEditingTeam(null);
    setTeamName("");
  };

  const handleDeleteTeam = async (id: number) => {
    await fetch(`/api/teams/${id}`, {
      method: "DELETE",
    });
    fetchTeams();
  };

  return (
    <div className="p-4">
      <header className="bg-background p-4 text-center z-10 shadow-md">
        <h1 className="text-2xl font-permanent-marker">Manage Teams</h1>
      </header>

      <div className="mt-8">
        <form onSubmit={editingTeam ? handleUpdateTeam : handleAddTeam} className="space-y-4 max-w-lg mx-auto">
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team Name"
            className="w-full bg-input text-card-foreground border border-border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
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
    </div>
  );
}
