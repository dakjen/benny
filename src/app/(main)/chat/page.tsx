"use client";

import { useState, useEffect, useCallback } from "react";
import { Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase"; // Import Supabase client

type Message = {
  id: number;
  sender: number; // This will be player ID
  message: string;
  teamId: number | null;
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
};

// Helper to get player name from ID (moved outside component)
const getPlayerNameByIdHelper = (
  playerId: number,
  localPlayerId: number | null,
  localPlayerName: string | null,
  allPlayers: Player[]
) => {
  if (playerId === localPlayerId && localPlayerName) {
    return localPlayerName;
  }
  const player = allPlayers.find((p) => p.id === playerId);
  return player ? player.name : "Unknown";
};

export default function ChatPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"team" | "game">("game"); // Default to game chat for admin
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
  const [selectedTeamForAdminChat, setSelectedTeamForAdminChat] = useState<Team | null>(null);


  useEffect(() => {
    // For regular players, get info from localStorage
    if (!session?.user) {
      setLocalPlayerId(Number(localStorage.getItem("playerId")));
      setLocalPlayerName(localStorage.getItem("playerName"));
      setLocalTeamId(Number(localStorage.getItem("teamId")));
      setLocalGameId(Number(localStorage.getItem("gameId")));
    }
  }, [session]);

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new as Message;
        setChatMessages((prevMessages) => [...prevMessages, newMessage]);
      })
      .subscribe();

    // Fetch initial messages
    const fetchInitialMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching initial messages:', error);
      } else {
        setChatMessages(data as Message[]);
      }
    };

    fetchInitialMessages();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);




  useEffect(() => {
    const fetchData = async () => {
      try {
        const isAdminOrJudge = session?.user?.role === "admin" || session?.user?.role === "judge";
        const currentActiveGameId = isAdminOrJudge ? selectedAdminGameId : localGameId;

        const playersApiUrl = isAdminOrJudge ? `/api/admin/players?gameId=${currentActiveGameId}` : `/api/public/players?gameId=${currentActiveGameId}`;
        const teamsApiUrl = isAdminOrJudge ? `/api/admin/teams?gameId=${currentActiveGameId}` : `/api/public/teams?gameId=${currentActiveGameId}`;
        const gamesApiUrl = isAdminOrJudge ? "/api/admin/games" : "/api/public/games"; // Games API for public doesn't need gameId for all games

        // Only fetch players and teams if a game is selected or if it's a player
        if (currentActiveGameId || !isAdminOrJudge) {
          const playersResponse = await fetch(playersApiUrl);
          if (!playersResponse.ok) {
            const errorText = await playersResponse.text();
            console.error("Failed to fetch players:", playersResponse.status, playersResponse.statusText, errorText);
            throw new Error(`Failed to fetch players: ${playersResponse.statusText}`);
          }
          const playersContentType = playersResponse.headers.get('content-type');
          if (!playersContentType || !playersContentType.includes('application/json')) {
            const errorText = await playersResponse.text();
            console.error("Players API did not return JSON:", errorText);
            throw new Error("Players API did not return JSON.");
          }
          const playersData = await playersResponse.json();
          console.log("Fetched players data:", playersData);
          setAllPlayers(playersData);

          const teamsResponse = await fetch(teamsApiUrl);
          if (!teamsResponse.ok) {
            const errorText = await teamsResponse.text();
            console.error("Failed to fetch teams:", teamsResponse.status, teamsResponse.statusText, errorText);
            throw new Error(`Failed to fetch teams: ${teamsResponse.statusText}`);
          }
          const teamsContentType = teamsResponse.headers.get('content-type');
          if (!teamsContentType || !teamsContentType.includes('application/json')) {
            const errorText = await teamsResponse.text();
            console.error("Teams API did not return JSON:", errorText);
            throw new Error("Teams API did not return JSON.");
          }
          const teamsData = await teamsResponse.json();
          console.log("Fetched teams data:", teamsData);
          setAllTeams(teamsData);
        } else {
          // Clear players and teams if no game is selected for admin
          setAllPlayers([]);
          setAllTeams([]);
        }

        // Always fetch all games for admin/judge
        const gamesResponse = await fetch(gamesApiUrl);
        if (!gamesResponse.ok) {
          const errorText = await gamesResponse.text();
          console.error("Failed to fetch games:", gamesResponse.status, gamesResponse.statusText, errorText);
          throw new Error(`Failed to fetch games: ${gamesResponse.statusText}`);
        }
        const gamesContentType = gamesResponse.headers.get('content-type');
        if (!gamesContentType || !gamesContentType.includes('application/json')) {
          const errorText = await gamesResponse.text();
          console.error("Games API did not return JSON:", errorText);
          throw new Error("Games API did not return JSON.");
        }
        const gamesData = await gamesResponse.json();
        console.log("Fetched games data:", gamesData);
        setAllGames(gamesData);
        console.log("allGames after fetch:", gamesData);
      } catch (error) {
        console.error("Error fetching chat data:", error);
      }
    };
    fetchData();
  }, [session, localGameId, selectedAdminGameId]);

  console.log("allGames in render:", allGames);

  const getPlayerNameById = useCallback(
    (playerId: number) =>
      getPlayerNameByIdHelper(playerId, localPlayerId, localPlayerName, allPlayers),
    [localPlayerId, localPlayerName, allPlayers]
  );

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (message.trim() === "") return;

      let senderId: number | string | null = localPlayerId; // Can be player ID (number) or admin/judge user ID (string)
      let senderName = localPlayerName;
      let currentTeamId = localTeamId;
      let currentGameId = localGameId;
      let messageType = activeTab;

      if (session?.user?.role === "admin" || session?.user?.role === "judge") {
        senderId = session.user.id; // Use user ID for admin/judge
        senderName = session.user.name ?? "";
        currentGameId = selectedAdminGameId;
        if (activeTab === "team" && selectedTeamForAdminChat) {
          currentTeamId = selectedTeamForAdminChat.id;
        } else if (activeTab === "game") {
          currentTeamId = null;
        }
      }

      if (!senderId || !senderName || !currentGameId || (messageType === "team" && !currentTeamId)) {
        console.error("Missing sender info or game/team ID to send message.");
        return;
      }

      const messageData = {
        sender: senderId, // Send sender ID
        sender_name: senderName, // Send sender name for display
        message_text: message, // Message content
        team_id: currentTeamId,
        game_id: currentGameId,
        type: messageType,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('messages').insert([messageData]);

      if (error) {
        console.error('Error sending message:', error);
      } else {
        setMessage("");
      }
    },
    [
      message,
      localPlayerId,
      localPlayerName,
      localTeamId,
      localGameId,
      activeTab,
      session,
      selectedAdminGameId,
      selectedTeamForAdminChat,
      setMessage,
    ]
  );

  const isAdminOrJudge = session?.user?.role === "admin" || session?.user?.role === "judge";
  const isPlayer = localPlayerId !== null && !isAdminOrJudge;

  if (isAdminOrJudge) {
    const filteredTeams = allTeams.filter(team => team.gameId === selectedAdminGameId);

    return (
      <div className="flex flex-col h-full bg-card text-foreground">
        <header className="bg-background p-4 text-center z-10 shadow-md">
          <h1 className="text-2xl font-permanent-marker">Chat (Admin/Judge View)</h1>
        </header>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Select Game</h2>
          <div className="flex space-x-4 mb-4">
            <select
              value={selectedAdminGameId || ""}
              onChange={(e) => {
                setSelectedAdminGameId(Number(e.target.value));
                setSelectedTeamForAdminChat(null); // Reset team when game changes
                setActiveTab("game"); // Default to game chat when game changes
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
          </div>

          {selectedAdminGameId ? (
            <>
              <div className="bg-card z-10 shadow-md">
                <div className="flex">
                  <button
                    className={`flex-1 py-3 text-center font-bold ${
                      activeTab === "game"
                        ? "border-b-2 border-primary text-primary"
                        : "text-gray-500"
                    }`}
                    onClick={() => {
                      setActiveTab("game");
                      setSelectedTeamForAdminChat(null); // Clear selected team when viewing game chat
                    }}
                  >
                    Game Chat
                  </button>
                  <button
                    className={`flex-1 py-3 text-center font-bold ${
                      activeTab === "team"
                        ? "border-b-2 border-primary text-primary"
                        : "text-gray-500"
                    }`}
                    onClick={() => setActiveTab("team")}
                  >
                    Team Chats
                  </button>
                </div>
              </div>

              {activeTab === "team" && (
                <div className="mt-4 border-b border-border pb-4">
                  <h3 className="text-lg font-bold mb-2">Teams in this Game:</h3>
                  <div className="flex flex-wrap gap-2">
                    {filteredTeams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeamForAdminChat(team)}
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          selectedTeamForAdminChat?.id === team.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {team.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(activeTab === "game" || (activeTab === "team" && selectedTeamForAdminChat)) ? (
                <>
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
                            <p className="font-bold text-sm">{getPlayerNameById(msg.sender)}</p>
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
                <p className="text-center text-gray-500 mt-8">
                  {activeTab === "team" ? "Please select a team to view their chat." : "Select a game to view chats."}
                </p>
              )}
            </>
          ) : (
            <p className="text-center text-gray-500 mt-8">Please select a game to view chats.</p>
          )}
        </div>
      </div>
    );
  } else if (isPlayer) {
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
          {activeTab === "team" && (
            <p className="text-center text-gray-500 mb-4">This chat holds only your team members</p>
          )}
          {activeTab === "game" && (
            <p className="text-center text-gray-500 mb-4">This chat is with all game players</p>
          )}
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
                  <p className="font-bold text-sm">{getPlayerNameById(msg.sender)}</p>
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

  return (
    <div className="flex flex-col h-full items-center justify-center bg-card text-foreground p-4">
      <h1 className="text-2xl font-permanent-marker mb-4">Chat</h1>
      <p className="text-center text-gray-500">Please join a game to access chat.</p>
    </div>
  );
}