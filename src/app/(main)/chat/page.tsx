"use client";

import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { useSession } from "next-auth/react";

type Message = {
  id: number;
  sender: number; // This will be player ID
  message: string;
  teamId: number;
  gameId: number;
  type: "team" | "game";
  createdAt: string;
};

type Player = {
  id: number;
  name: string;
  teamId: number;
};

type Team = {
  id: number;
  name: string;
  gameId: number;
};

type Game = {
  id: number;
  name: string;
  id: number;
};

export default function ChatPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"team" | "game">("team");
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [localPlayerId, setLocalPlayerId] = useState<number | null>(null);
  const [localPlayerName, setLocalPlayerName] = useState<string | null>(null);
  const [localTeamId, setLocalTeamId] = useState<number | null>(null);
  const [localGameId, setLocalGameId] = useState<number | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allGames, setAllGames] = useState<Game[]>([]); // New state for all games

  // Admin/Judge specific states
  const [selectedAdminGameId, setSelectedAdminGameId] = useState<number | null>(null);
  const [selectedAdminTeamId, setSelectedAdminTeamId] = useState<number | null>(null);


  useEffect(() => {
    // For regular players, get info from localStorage
    if (!session?.user) {
      setLocalPlayerId(Number(localStorage.getItem("playerId")));
      setLocalPlayerName(localStorage.getItem("playerName"));
      setLocalTeamId(Number(localStorage.getItem("teamId")));
      setLocalGameId(Number(localStorage.getItem("gameId")));
    }
  }, [session]);

  useEffect(() => {
    const fetchData = async () => {
      const playersResponse = await fetch("/api/players");
      const playersData = await playersResponse.json();
      setAllPlayers(playersData);

      const teamsResponse = await fetch("/api/teams");
      const teamsData = await teamsResponse.json();
      setAllTeams(teamsData);

      const gamesResponse = await fetch("/api/admin/games"); // Fetch all games for admin/judge
      const gamesData = await gamesResponse.json();
      setAllGames(gamesData);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      let currentTeamId = localTeamId;
      let currentGameId = localGameId;

      if (session?.user?.role === "admin" || session?.user?.role === "judge") {
        currentTeamId = selectedAdminTeamId;
        currentGameId = selectedAdminGameId;
      }

      if ((activeTab === "team" && currentTeamId) || (activeTab === "game" && currentGameId)) {
        const url = `/api/direct-messages?type=${activeTab}&${activeTab}Id=${activeTab === "team" ? currentTeamId : currentGameId}`;
        const response = await fetch(url);
        const data = await response.json();
        setChatMessages(data);
      } else {
        setChatMessages([]); // Clear messages if no selection for admin/judge
      }
    };
    fetchMessages();
  }, [activeTab, localTeamId, localGameId, session, selectedAdminGameId, selectedAdminTeamId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === "") return;

    let senderName = localPlayerName;
    let currentTeamId = localTeamId;
    let currentGameId = localGameId;

    if (session?.user?.role === "admin" || session?.user?.role === "judge") {
      senderName = session.user.name; // Admin/Judge name
      currentTeamId = selectedAdminTeamId;
      currentGameId = selectedAdminGameId;
    }

    if (!senderName || !currentTeamId || !currentGameId) return;

    const response = await fetch("/api/direct-messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: senderName,
        message,
        teamId: currentTeamId,
        gameId: currentGameId,
        type: activeTab,
      }),
    });

    if (response.ok) {
      const newMessage = await response.json();
      setChatMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage("");
    } else {
      console.error("Failed to send message");
    }
  };

  // Helper to get player name from ID and format based on chat type
  const getSenderDisplayName = (senderId: number) => {
    const player = allPlayers.find(p => p.id === senderId);
    if (!player) return "Unknown";

    if (activeTab === "team") {
      return player.name; // Display username for team chat
    } else if (activeTab === "game") {
      const team = allTeams.find(t => t.id === player.teamId);
      return team ? `${team.name}: ${player.name}` : player.name; // Display team name: username for game chat
    }
    return player.name;
  };

  if (session?.user?.role === "admin" || session?.user?.role === "judge") {
    return (
      <div className="flex flex-col h-full bg-card text-foreground">
        <header className="bg-background p-4 text-center z-10 shadow-md">
          <h1 className="text-2xl font-permanent-marker">Chat (Admin/Judge View)</h1>
        </header>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Select Chat to View</h2>
          <div className="flex space-x-4 mb-4">
            <select
              value={selectedAdminGameId || ""}
              onChange={(e) => {
                setSelectedAdminGameId(Number(e.target.value));
                setSelectedAdminTeamId(null); // Reset team when game changes
              }}
              className="flex-1 bg-input text-card-foreground border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="" disabled>Select a Game</option>
              {allGames.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
            <select
              value={selectedAdminTeamId || ""}
              onChange={(e) => setSelectedAdminTeamId(Number(e.target.value))}
              className="flex-1 bg-input text-card-foreground border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={!selectedAdminGameId}
            >
              <option value="" disabled>Select a Team</option>
              {allTeams
                .filter((team) => team.gameId === selectedAdminGameId)
                .map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
            </select>
          </div>

          {(selectedAdminGameId && selectedAdminTeamId) ? (
            <>
              <div className="bg-card z-10 shadow-md">
                <div className="flex">
                  <button
                    className={`flex-1 py-3 text-center font-bold ${
                      activeTab === "team"
                        ? "border-b-2 border-primary text-primary"
                        : "text-gray-500"
                    }`}
                    onClick={() => setActiveTab("team")}
                  >
                    Team Chat
                  </button>
                  <button
                    className={`flex-1 py-3 text-center font-bold ${
                      activeTab === "game"
                        ? "border-b-2 border-primary text-primary"
                        : "text-gray-500"
                    }`}
                    onClick={() => setActiveTab("game")}
                  >
                    Game Chat
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-end space-x-3 ${
                        msg.sender === localPlayerId ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-500 flex-shrink-0"></div>
                      <div
                        className={`p-3 rounded-2xl shadow ${
                          msg.sender === localPlayerId
                            ? "bg-primary rounded-br-none"
                            : "bg-secondary rounded-bl-none"
                        }`}
                      >
                        <p className="font-bold text-sm">{getSenderDisplayName(msg.sender)}</p>
                        <p>{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSendMessage} className="bg-card p-4 border-t border-border flex items-center">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-input text-card-foreground border border-border rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="submit"
                  className="ml-4 bg-primary text-primary-foreground rounded-full p-3 hover:bg-primary/90 transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </>
          ) : (
            <p className="text-center text-gray-500 mt-8">Please select a game and a team to view their chat.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card text-foreground">
      <header className="bg-background p-4 text-center z-10 shadow-md">
        <h1 className="text-2xl font-permanent-marker">Chat</h1>
      </header>
      <div className="bg-card z-10 shadow-md">
        <div className="flex">
          <button
            className={`flex-1 py-3 text-center font-bold ${
              activeTab === "team"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("team")}
          >
            Team Chat
          </button>
          <button
            className={`flex-1 py-3 text-center font-bold ${
              activeTab === "game"
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500"
            }`}
            onClick={() => setActiveTab("game")}
          >
            Game Chat
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end space-x-3 ${
                msg.sender === localPlayerId ? "flex-row-reverse" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-500 flex-shrink-0"></div>
              <div
                className={`p-3 rounded-2xl shadow ${
                  msg.sender === localPlayerId
                    ? "bg-primary rounded-br-none"
                    : "bg-secondary rounded-bl-none"
                }`}
              >
                <p className="font-bold text-sm">{getSenderDisplayName(msg.sender)}</p>
                <p>{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSendMessage} className="bg-card p-4 border-t border-border flex items-center">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-input text-card-foreground border border-border rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="ml-4 bg-primary text-primary-foreground rounded-full p-3 hover:bg-primary/90 transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
