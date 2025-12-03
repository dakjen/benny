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
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [codeValid, setCodeValid] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [validatedGameId, setValidatedGameId] = useState<number | null>(null);
  const [rejoinInfo, setRejoinInfo] = useState<{ playerId: string; playerName: string; teamId: string; gameId: string } | null>(null); // New state for rejoin info
  const router = useRouter();

  useEffect(() => {
    // Check for existing player data in localStorage for rejoin functionality
    const storedPlayerId = localStorage.getItem("playerId");
    const storedPlayerName = localStorage.getItem("playerName");
    const storedTeamId = localStorage.getItem("teamId");
    const storedGameId = localStorage.getItem("gameId");

    if (storedPlayerId && storedPlayerName && storedTeamId && storedGameId) {
      setRejoinInfo({
        playerId: storedPlayerId,
        playerName: storedPlayerName,
        teamId: storedTeamId,
        gameId: storedGameId,
      });
    }
  }, []); // Run once on component mount

  useEffect(() => {
    // Only fetch teams if a game ID is validated
    if (validatedGameId) {
      const fetchTeams = async () => {
        const response = await fetch(`/api/public/teams?gameId=${validatedGameId}`); // Use public API
        const data = await response.json();
        console.log("teams data", data);
        setTeams(data);
      };
      fetchTeams();
    } else {
      setTeams([]); // Clear teams if no game ID is validated
    }
  }, [validatedGameId]); // Dependency on validatedGameId

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.length !== 4) {
      setCodeError("Code must be 4 digits.");
      return;
    }

    try {
      const response = await fetch("/api/validate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: accessCode }),
      });

      if (response.ok) {
        const data = await response.json();
        setValidatedGameId(data.gameId); // Store the validated game ID
        setCodeValid(true);
        setCodeError("");
      } else {
        setCodeValid(false);
        setValidatedGameId(null); // Clear game ID if code is invalid
        setCodeError("Invalid code.");
      }
    } catch (error) {
      console.error("Error validating code:", error);
      setCodeError("Error validating code.");
    }
  };

  const handleEnterGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeValid || !validatedGameId) {
      setCodeError("Please enter a valid code first.");
      return;
    }
    if (selectedTeamId === null || playerName.trim() === "") {
      // Basic validation
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
        teamId: selectedTeamId,
        gameId: validatedGameId, // Use the validated game ID
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
        className="mb-4" // Removed rounded-full
      />
      <h1 className="text-4xl font-permanent-marker mb-2">Benjamin's 25th Birthday</h1>
      <p className="text-lg font-manrope italic">the frontal lobe develops.</p>
      <p className="text-lg font-manrope italic mb-8">The scavenger hunt begins.</p>

      {rejoinInfo ? (
        <div className="w-full max-w-sm space-y-4">
          <p className="text-lg">Welcome back, {rejoinInfo.playerName}!</p>
          <p className="text-md text-gray-400">You were in Game ID: {rejoinInfo.gameId}</p>
          <button
            onClick={() => router.push("/chat")}
            className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-bold hover:bg-primary/90 transition-colors"
          >
            Rejoin Game
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("playerId");
              localStorage.removeItem("playerName");
              localStorage.removeItem("teamId");
              localStorage.removeItem("gameId");
              setRejoinInfo(null); // Clear rejoin info to show the forms
            }}
            className="w-full bg-gray-500 text-white rounded-lg py-3 font-bold hover:bg-gray-600 transition-colors"
          >
            Start New Game
          </button>
        </div>
      ) : (
        <>
          {/* Access Code Input */}
          <form onSubmit={handleValidateCode} className="w-full max-w-sm space-y-4 mb-4">
            <input
              type="text"
              value={accessCode}
              onChange={(e) => {
                setAccessCode(e.target.value);
                setCodeError(""); // Clear error on change
              }}
              placeholder="4-Digit Code"
              maxLength={4}
              className="w-full bg-input text-card-foreground border border-border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
              required
              disabled={codeValid} // Disable if code is already valid
            />
            {!codeValid && (
              <button
                type="submit"
                className="w-full bg-secondary text-secondary-foreground rounded-lg py-3 font-bold hover:bg-secondary/90 transition-colors"
              >
                Validate Code
              </button>
            )}
            {codeError && <p className="text-red-500 text-sm mt-2">{codeError}</p>}
          </form>

          {/* Player Input (only visible if code is valid) */}
          {codeValid && (
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
          )}
        </>
      )}

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
