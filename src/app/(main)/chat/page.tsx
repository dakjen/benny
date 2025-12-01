"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs"; // Import useUser from Clerk
import { Send } from "lucide-react";

export default function ChatPage() {
  const { user, isSignedIn } = useUser(); // Use Clerk's useUser hook
  const [activeTab, setActiveTab] = useState("team");
  const [message, setMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === "") return;
    // Add message sending logic here
    console.log(`Sending message to ${activeTab}: ${message}`);
    setMessage("");
  };

  // Conditionally render admin chat view
  if (isSignedIn && user?.publicMetadata?.role === "admin") {
    return (
      <div className="flex flex-col h-full bg-card text-foreground">
        <header className="bg-background p-4 text-center z-10 shadow-md">
          <h1 className="text-2xl font-permanent-marker">Admin Chat View</h1>
        </header>
        <div className="p-4">
          <p>As an admin, you can see all messages.</p>
          {/* Placeholder for all messages */}
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
        {activeTab === "team" && (
          <div className="space-y-4">
            <div className="flex items-end space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-500 flex-shrink-0"></div>
              <div className="bg-secondary p-3 rounded-2xl rounded-bl-none shadow">
                <p className="font-bold text-sm">Team Member 1</p>
                <p>This is a message in the team chat.</p>
              </div>
            </div>
             <div className="flex items-end space-x-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0"></div>
              <div className="bg-primary p-3 rounded-2xl rounded-br-none shadow">
                <p className="font-bold text-sm">You</p>
                <p>This is your message.</p>
              </div>
            </div>
          </div>
        )}
        {activeTab === "game" && (
          <div className="space-y-4">
            <div className="flex items-end space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-500 flex-shrink-0"></div>
              <div className="bg-accent p-3 rounded-2xl rounded-bl-none shadow">
                <p className="font-bold text-sm">Player 1</p>
                <p>This is a message in the game chat.</p>
              </div>
            </div>
          </div>
        )}
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
