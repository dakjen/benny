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

type Game = {
  id: number;
  name: string;
};

type Question = {
  id: number;
  questionText: string;
  category?: string;
  expectedAnswer?: string;
  gameId: number;
  points: number;
};

export default function QuestionsPage() {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionPoints, setNewQuestionPoints] = useState(0);

  // Fetch users for admin chat
  useEffect(() => {
    if (session?.user?.role === "admin") {
      const fetchUsers = async () => {
        const response = await fetch("/api/admin/users");
        const data = await response.json();
        setUsers(data);
      };
      fetchUsers();
    }
  }, [session]);

  // Fetch messages for chat
  useEffect(() => {
    if (session) {
      const recipientId = session.user.role === "admin" ? selectedUser?.id : "admin";
      if (!recipientId) return;

      const fetchMessages = async () => {
        const response = await fetch(`/api/question-messages?recipientId=${recipientId}`);
        const data = await response.json();
        setMessages(data);
      };
      fetchMessages();
    }
  }, [session, selectedUser]);

  // Fetch games and questions for admin
  useEffect(() => {
    if (session?.user?.role === "admin") {
      const fetchGames = async () => {
        const response = await fetch("/api/admin/games");
        const data = await response.json();
        setGames(data);
      };
      fetchGames();
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.role === "admin" && selectedGameId) {
      const fetchQuestions = async () => {
        const response = await fetch(`/api/admin/questions?gameId=${selectedGameId}`);
        const data = await response.json();
        setQuestions(data);
      };
      fetchQuestions();
    }
  }, [session, selectedGameId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === "") return;

    const recipientId = session?.user?.role === "admin" ? selectedUser?.id : "admin";

    const response = await fetch("/api/question-messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipientId,
        message,
      }),
    });

    if (response.ok) {
      const newMessage = await response.json();
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage("");
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameId || newQuestionText.trim() === "") {
      // Basic validation
      return;
    }

    const response = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionText: newQuestionText,
        gameId: selectedGameId,
        points: newQuestionPoints,
      }),
    });

    if (response.ok) {
      setNewQuestionText("");
      setNewQuestionPoints(0);
      // Refetch questions for the selected game
      const questionsResponse = await fetch(`/api/admin/questions?gameId=${selectedGameId}`);
      const questionsData = await questionsResponse.json();
      setQuestions(questionsData);
    } else {
      console.error("Failed to add question");
    }
  };

  if (session?.user?.role === "admin") {
    return (
      <div className="flex flex-col h-full bg-card text-foreground">
        <header className="bg-background p-4 text-center z-10 shadow-md">
          <h1 className="text-2xl font-permanent-marker">Admin Questions</h1>
        </header>

        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Manage Questions by Game</h2>
          <select
            value={selectedGameId || ""}
            onChange={(e) => setSelectedGameId(Number(e.target.value))}
            className="w-full bg-input text-card-foreground border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring mb-4"
          >
            <option value="" disabled>Select a Game</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>

          {selectedGameId && (
            <>
              <h3 className="text-lg font-bold mb-2">Add New Question</h3>
              <form onSubmit={handleAddQuestion} className="space-y-4 mb-8">
                <input
                  type="text"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Question Text"
                  className="w-full bg-input text-card-foreground border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
                <input
                  type="number"
                  value={newQuestionPoints}
                  onChange={(e) => setNewQuestionPoints(Number(e.target.value))}
                  placeholder="Points"
                  className="w-full bg-input text-card-foreground border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-bold hover:bg-primary/90 transition-colors"
                >
                  Add Question
                </button>
              </form>

              <h3 className="text-lg font-bold mb-2">Existing Questions</h3>
              <ul className="space-y-2">
                {questions.map((q) => (
                  <li key={q.id} className="p-3 bg-secondary rounded-lg shadow-sm">
                    {q.questionText} ({q.points} points)
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card text-foreground">
      <header className="bg-background p-4 text-center z-10 shadow-md">
        <h1 className="text-2xl font-permanent-marker">Questions</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end space-x-3 ${
              session && msg.senderId === session.user.id ? "flex-row-reverse" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gray-500 flex-shrink-0"></div>
            <div
              className={`p-3 rounded-2xl shadow ${
                session && msg.senderId === session.user.id
                  ? "bg-primary rounded-br-none"
                  : "bg-secondary rounded-bl-none"
              }`}
            >
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