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

export default function QuestionsPage() {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      // Fetch all users for the admin
      const fetchUsers = async () => {
        const response = await fetch("/api/admin/users");
        const data = await response.json();
        setUsers(data);
      };
      fetchUsers();
    }
  }, [session]);

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

  if (session?.user?.role === "admin") {
    return (
      <div className="flex flex-col h-full bg-card text-foreground">
        <header className="bg-background p-4 text-center z-10 shadow-md">
          <h1 className="text-2xl font-permanent-marker">Questions</h1>
        </header>
        <div className="flex flex-1">
          <div className="w-1/3 border-r border-border">
            <h2 className="text-lg font-bold p-4">Users</h2>
            <ul>
              {users.map((user) => (
                <li
                  key={user.id}
                  className={`p-4 cursor-pointer ${
                    selectedUser?.id === user.id ? "bg-secondary" : ""
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  {user.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-2/3 flex flex-col">
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
        <h1 className="text-2xl font-permanent-marker">Questions</h1>
      </header>
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