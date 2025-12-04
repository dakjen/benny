"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; // Import useSession
import { signOutAndClearLocalStorage } from "@/auth"; // Import signOutAndClearLocalStorage

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession(); // Use useSession hook
  const [playerName, setPlayerName] = useState("");
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    setPlayerName(localStorage.getItem("playerName") || "");
    setTeamName(localStorage.getItem("teamName") || "");
  }, []);

  const title = pathname.split("/").pop();
  const formattedTitle = title ? title.charAt(0).toUpperCase() + title.slice(1) : "Benny";

  const isAdminOrJudge = session?.user?.role === "admin" || session?.user?.role === "judge";

  return (
    <header className="bg-background p-4 z-10 shadow-md flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold font-permanent-marker">{formattedTitle}</h1>
      </div>
      <div className="text-right flex items-center">
        {isAdminOrJudge && (
          <button
            onClick={() => signOutAndClearLocalStorage()}
            className="ml-4 px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        )}
        <div className="ml-4">
          <p className="text-sm font-bold">{playerName}</p>
          <p className="text-xs text-gray-400">{teamName}</p>
        </div>
      </div>
    </header>
  );
}
