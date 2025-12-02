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
    const fetchAllPlayers = async () => {
      const response = await fetch("/api/players");
      const data = await response.json();
      setAllPlayers(data);
    };
    fetchAllPlayers();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      let currentTeamId = localTeamId;
      let currentGameId = localGameId;

      // If admin or judge, they can see all chats, so we need to decide which team/game to show
      // For now, let's assume they see all messages for all teams/games
      // This logic will need to be refined based on how admin/judge selects which chat to view
      if (session?.user?.role === "admin" || session?.user?.role === "judge") {
        // For now, let's just fetch all messages for all teams/games
        // This will be updated later when we implement admin/judge chat selection
        const response = await fetch(`/api/direct-messages?type=${activeTab}`);
        const data = await response.json();
        setChatMessages(data);
        return;
      }


      if ((activeTab === "team" && currentTeamId) || (activeTab === "game" && currentGameId)) {
        const url = `/api/direct-messages?type=${activeTab}&${activeTab}Id=${activeTab === "team" ? currentTeamId : currentGameId}`;
        const response = await fetch(url);
        const data = await response.json();
        setChatMessages(data);
      }
    };
    fetchMessages();
  }, [activeTab, localTeamId, localGameId, session]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === "") return;

    let senderName = localPlayerName;
    let currentTeamId = localTeamId;
    let currentGameId = localGameId;

    // If admin or judge, they are sending messages as themselves, not as a player
    if (session?.user?.role === "admin" || session?.user?.role === "judge") {
      senderName = session.user.name; // Admin/Judge name
      // For now, we need to decide which team/game they are sending to
      // This will be updated later when we implement admin/judge chat selection
      currentTeamId = 1; // Placeholder
      currentGameId = 1; // Placeholder
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

  // Helper to get player name from ID
  const getPlayerName = (senderId: number) => {
    const player = allPlayers.find(p => p.id === senderId);
    return player ? player.name : "Unknown";
  };

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
                <p className="font-bold text-sm">{getPlayerName(msg.sender)}</p>
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
