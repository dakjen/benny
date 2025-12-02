"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Team = {
  id: number;
  name: string;
};

export default function HomePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [playerName, setPlayerName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchTeams = async () => {
      const response = await fetch("/api/teams");
      const data = await response.json();
      console.log("teams data", data); // Add this line
      setTeams(data);
    };
    fetchTeams();
  }, []);

  const handleEnterGame = (e: React.FormEvent) => {.
    e.preventDefault();
    if (selectedTeam.trim() === "" || playerName.trim() === "") {
      // Basic validation
      return;
    }
    // Store user info in localStorage to persist across pages
    localStorage.setItem("teamName", selectedTeam);
    localStorage.setItem("playerName", playerName);
    router.push("/chat");
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background text-foreground p-4 text-center">
      <h1 className="text-4xl font-permanent-marker mb-2">Benjamin's 25th Birthday</h1>
      <p className="text-lg font-manrope italic">the frontal lobe develops.</p>
      <p className="text-lg font-manrope italic mb-8">The scavenger hunt begins.</p>

      <form onSubmit={handleEnterGame} className="w-full max-w-sm space-y-4">
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="w-full bg-input text-card-foreground border border-border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
          required
        >
          <option value="" disabled>Select a team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.name}>
              {team.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Your Name"
          className="w-full bg-input text-card-foreground border border-border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-bold hover:bg-primary/90 transition-colors"
        >
          Enter Game
        </button>
      </form>

      <div className="mt-8">
        <Link href="/login">
          <p className="text-sm text-gray-400 hover:text-white">
            Admin Login
          </p>
        </Link>
      </div>
    </div>
  );
}
