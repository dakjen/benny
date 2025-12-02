"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // Import Image component

type Team = {
  id: number;
  name: string;
  gameId: number; // Added gameId
};

export default function HomePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null); // Changed to selectedTeamId
  const [playerName, setPlayerName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchTeams = async () => {
      const response = await fetch("/api/teams");
      const data = await response.json();
      console.log("teams data", data);
      setTeams(data);
    };
    fetchTeams();
  }, []);

  const handleEnterGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeamId === null || playerName.trim() === "") {
      // Basic validation
      return;
    }

    const selectedTeam = teams.find(team => team.id === selectedTeamId);
    if (!selectedTeam) {
      // Handle error: selected team not found
      return;
    }

    // Create player in the database
    const response = await fetch("/api/players", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: playerName,
        teamId: selectedTeam.id,
        gameId: selectedTeam.gameId,
      }),
    });

    if (response.ok) {
      const newPlayer = await response.json();
      // Store player info in localStorage to persist across pages
      localStorage.setItem("playerId", newPlayer.id); // Store player ID
      localStorage.setItem("playerName", newPlayer.name);
      localStorage.setItem("teamId", newPlayer.teamId);
      localStorage.setItem("gameId", newPlayer.gameId);
      router.push("/chat");
    } else {
      // Handle error
      console.error("Failed to create player");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background text-foreground p-4 text-center">
      <Image
        src="/assets/oldben.png"
        alt="Old Ben"
        width={200}
        height={200}
        className="mb-4 rounded-full" // Added some styling
      />
      <h1 className="text-4xl font-permanent-marker mb-2">Benjamin's 25th Birthday</h1>
      <p className="text-lg font-manrope italic">the frontal lobe develops.</p>
      <p className="text-lg font-manrope italic mb-8">The scavenger hunt begins.</p>

      <form onSubmit={handleEnterGame} className="w-full max-w-sm space-y-4">
        <select
          value={selectedTeamId || ""}
          onChange={(e) => setSelectedTeamId(Number(e.target.value))}
          className="w-full bg-input text-card-foreground border border-border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
          required
        >
          <option value="" disabled>Select a team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
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
