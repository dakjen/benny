"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Send } from "lucide-react";

type Message = {
  id: number;
  senderId: string;
  recipientId: string;
  message: string;
  createdAt: string;
};

type Player = {
  id: number;
  name: string;
  teamId: number;
  gameId: number;
};

export default function HelpPage() {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<number | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]); // State to store all admin users
  const [selectedAdminFilterId, setSelectedAdminFilterId] = useState<string | null>("all"); // State for admin message filter
  const [selectedAdminForSending, setSelectedAdminForSending] = useState<string | null>(null); // State for admin to choose their identity when sending

  useEffect(() => {
    // For regular players, get info from localStorage
    if (typeof window !== "undefined" && !session?.user) {
      setLocalPlayerId(Number(localStorage.getItem("playerId")));
    }

    // Fetch all admin users (for admin dropdown and for resolving designated admin)
    const fetchAdminUsers = async () => {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const usersData = await response.json();
        const admins = usersData.filter((user: any) => user.role === "admin");
        setAdminUsers(admins);
        // Set default selected admin for sending to the logged-in admin's ID
        if (session?.user?.role === "admin" || session?.user?.role === "judge") {
          setSelectedAdminForSending(session.user.id);
        }
      }
    };
    fetchAdminUsers();
  }, [session]);

  // Fetch players for admin messaging (or for all users to resolve names)
  useEffect(() => {
    const fetchPlayers = async () => {
      const response = await fetch("/api/players");
      if (!response.ok) {
        console.error("Failed to fetch players");
        return;
      }
      const data = await response.json();
      setPlayers(data);
    };
    fetchPlayers();
  }, [session]);

  // Fetch messages for chat
  useEffect(() => {
    const fetchMessages = async () => {
      let currentRecipientId: string | null = null;
      let currentSenderId: string | null = null;
      let queryParams = "";

      if (session?.user?.role === "admin" || session?.user?.role === "judge") {
        if (selectedPlayer) {
          currentRecipientId = selectedPlayer.id.toString(); // Player's ID
          currentSenderId = "admin"; // Admin is viewing messages with this player
          queryParams = `&adminFilterId=${selectedAdminFilterId}`;
        }
      } else if (localPlayerId) {
        currentRecipientId = "all_admins"; // Player messages all admins
        currentSenderId = localPlayerId.toString();
      }

      if (!currentRecipientId || !currentSenderId) return;

      const response = await fetch(`/api/player-admin-messages?senderId=${currentSenderId}&recipientId=${currentRecipientId}${queryParams}`);
      if (!response.ok) {
        console.error("Failed to fetch messages");
        return;
      }
      const data = await response.json();
      setMessages(data);
    };
    fetchMessages();
  }, [session, selectedPlayer, localPlayerId, selectedAdminFilterId]); // Add selectedAdminFilterId to dependencies

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === "") return;

    let currentRecipientId: string | null = null;
    let currentSenderId: string | null = null;

    if (session?.user?.role === "admin" || session?.user?.role === "judge") {
      if (!selectedPlayer || !selectedAdminForSending) { // Ensure a player and sender identity are selected
        console.error("Admin/Judge: Please select a player and your sending identity.");
        return;
      }
      currentRecipientId = selectedPlayer.id.toString();
      currentSenderId = selectedAdminForSending; // Admin sends as the selected identity
    } else if (localPlayerId) {
      currentRecipientId = "all_admins"; // Player messages all admins
      currentSenderId = localPlayerId.toString();
    }

    if (!currentSenderId) return;

    const payload: { senderId: string; recipientId?: string; message: string } = {
      senderId: currentSenderId,
      message,
    };

    if (currentRecipientId) {
      payload.recipientId = currentRecipientId;
    }

    const response = await fetch("/api/player-admin-messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const newMessage = await response.json();
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage("");
    } else {
      console.error("Failed to send message");
    }
  };

  // Helper to get sender name
  const getSenderName = (senderId: string) => {
    if (session?.user?.id === senderId) return session.user.name;
    const player = players.find(p => p.id.toString() === senderId);
    if (player) return player.name;
    const admin = adminUsers.find(a => a.id === senderId); // Check if sender is an admin
    if (admin) return admin.name;
    return "Unknown";
  };


  if (session?.user?.role === "admin" || session?.user?.role === "judge") {
    return (
      <div className="flex flex-col h-full bg-card text-foreground">
        <header className="bg-background p-4 text-center z-10 shadow-md">
          <h1 className="text-2xl font-permanent-marker">Admin/Judge Help Chat</h1>
        </header>
        <div className="flex flex-1">
          <div className="w-1/3 border-r border-border">
            <h2 className="text-lg font-bold p-4">Players</h2>
            <ul>
              {players.map((player) => (
                <li
                  key={player.id}
                  className={`p-4 cursor-pointer ${
                    selectedPlayer?.id === player.id ? "bg-secondary" : ""
                  }`}
                  onClick={() => setSelectedPlayer(player)}
                >
                  {player.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-2/3 flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-bold mb-2">Filter by Admin:</h3>
              <select
                value={selectedAdminFilterId || "all"}
                onChange={(e) => setSelectedAdminFilterId(e.target.value)}
                className="w-full bg-input text-card-foreground border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Admins</option>
                {adminUsers.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name}
                  </option>
                ))}
              </select>

              <h3 className="text-lg font-bold mb-2">Respond as:</h3>
              <select
                value={selectedAdminForSending || ""}
                onChange={(e) => setSelectedAdminForSending(e.target.value)}
                className="w-full bg-input text-card-foreground border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {adminUsers.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end space-x-3 ${
                    msg.senderId === session.user.id ? "flex-row-reverse" : ""
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-500 flex-shrink-0"></div>
                  <div
                    className={`p-3 rounded-2xl shadow ${
                      msg.senderId === session.user.id
                        ? "bg-primary rounded-br-none"
                        : "bg-secondary rounded-bl-none"
                    }`}
                  >
                    <p className="font-bold text-sm">{getSenderName(msg.senderId)}</p>
                    <p>{msg.message}</p>
                  </div>
                </div>
              ))}
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
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card text-foreground">
      <header className="bg-background p-4 text-center z-10 shadow-md">
        <h1 className="text-2xl font-permanent-marker">Help Chat</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end space-x-3 ${
              msg.senderId === localPlayerId?.toString() ? "flex-row-reverse" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gray-500 flex-shrink-0"></div>
            <div
              className={`p-3 rounded-2xl shadow ${
                msg.senderId === localPlayerId?.toString()
                  ? "bg-primary rounded-br-none"
                  : "bg-secondary rounded-bl-none"
              }`}
            >
              <p className="font-bold text-sm">{getSenderName(msg.senderId)}</p>
              <p>{msg.message}</p>
            </div>
          </div>
        ))}
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