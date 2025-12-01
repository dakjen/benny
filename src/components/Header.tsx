"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export function Header() {
  const pathname = usePathname();
  const [playerName, setPlayerName] = useState("");
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    setPlayerName(localStorage.getItem("playerName") || "");
    setTeamName(localStorage.getItem("teamName") || "");
  }, []);

  const title = pathname.split("/").pop();
  const formattedTitle = title ? title.charAt(0).toUpperCase() + title.slice(1) : "Benny";

  return (
    <header className="bg-background p-4 z-10 shadow-md flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold font-permanent-marker">{formattedTitle}</h1>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold">{playerName}</p>
        <p className="text-xs text-gray-400">{teamName}</p>
      </div>
    </header>
  );
}
