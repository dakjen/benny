"use client";

import { useState, useEffect, useCallback } from "react"; // Import useCallback
import { useSession } from "next-auth/react";
import { ChevronDown, ChevronUp } from "lucide-react"; // Import icons for accordion
import { SubmissionForm } from "@/components/SubmissionForm";
import Image from "next/image"; // Import Image component

type Game = {
  id: number;
  name: string;
};

type Category = {
  id: number;
  name: string;
  gameId: number;
  isSequential: boolean; // New
  order: number; // New
};

type Question = {
  id: number;
  questionText: string;
  categoryId: number | null; // Ensure categoryId is present
  expectedAnswer?: string;
  gameId: number;
  points: number;
};

type Submission = {
  id: number;
  playerId: number;
  questionId: number;
  teamId: number;
  status: "pending" | "graded";
  score: number | null;
};

export default function QuestionsPage() {
  const { data: session } = useSession();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [displayableCategories, setDisplayableCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [localGameId, setLocalGameId] = useState<number | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<number | null>(null); // New state for player ID from localStorage
  const [localTeamId, setLocalTeamId] = useState<number | null>(null);

  // New states for player progress
  const [playerCompletedCategories, setPlayerCompletedCategories] = useState<
    number[]
  >([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [playerProgress, setPlayerProgress] = useState<any>(null);

  // Function to refetch submissions and player progress
  const refetchPlayerProgressAndSubmissions = useCallback(async () => {
    console.log("Refetching player progress and submissions...");
    if (!localPlayerId || !selectedGameId) {
      console.log("Skipping refetch: localPlayerId or selectedGameId is null.");
      return;
    }

    try {
      const playerProgressResponse = await fetch(
        `/api/public/player-progress?playerId=${localPlayerId}`
      );
      if (playerProgressResponse.ok) {
        const playerProgressData = await playerProgressResponse.json();
        setPlayerProgress(playerProgressData);
        const completedCatIds = JSON.parse(playerProgressData.completedCategories || "[]");
        setPlayerCompletedCategories(completedCatIds);
        console.log("Updated playerCompletedCategories:", completedCatIds);
      } else {
        console.error("Failed to fetch player progress.");
      }

      const submissionsResponse = await fetch(
        `/api/public/submissions?gameId=${selectedGameId}`
      );
      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json();
        setAllSubmissions(submissionsData);
        console.log("Updated allSubmissions:", submissionsData);
      } else {
        console.error("Failed to fetch submissions.");
      }
    } catch (error) {
      console.error("Error during refetchPlayerProgressAndSubmissions:", error);
    }
  }, [localPlayerId, selectedGameId]);

  // Get localGameId and localPlayerId from localStorage for players
  useEffect(() => {
    if (!session?.user) {
      // Only for players not logged in via session
      const storedGameId = localStorage.getItem("gameId");
      const storedPlayerId = localStorage.getItem("playerId");
      const storedTeamId = localStorage.getItem("teamId");
      // Only update state if the value has actually changed
      if (storedGameId && Number(storedGameId) !== localGameId) {
        setLocalGameId(Number(storedGameId));
      }
      if (storedPlayerId && Number(storedPlayerId) !== localPlayerId) {
        setLocalPlayerId(Number(storedPlayerId));
      }
      if (storedTeamId && Number(storedTeamId) !== localTeamId) {
        setLocalTeamId(Number(storedTeamId));
      }
    }
  }, [session, localGameId, localPlayerId, localTeamId]);

  useEffect(() => {
    const fetchGamesAndSetSelected = async () => {
      try {
        const isAdmin = session?.user?.role === "admin";
        const apiUrl = isAdmin ? "/api/admin/games" : "/api/public/games";
        const response = await fetch(apiUrl);
        const data = await response.json();
        setGames(data);

        let newSelectedGameId: number | null = null;
        if (session?.user?.role === "admin") {
          if (data.length === 1) {
            newSelectedGameId = data[0].id;
          }
        } else if (localGameId) {
          newSelectedGameId = localGameId;
        }
        
        if (newSelectedGameId !== null && newSelectedGameId !== selectedGameId) {
          setSelectedGameId(newSelectedGameId);
        } else if (newSelectedGameId === null && selectedGameId !== null) {
          setSelectedGameId(null);
        }
      } catch (error) {
        console.error("Error fetching games data:", error);
      }
    };
    fetchGamesAndSetSelected();
  }, [session, localGameId]);

  // Fetch categories and questions when selectedGameId changes
  useEffect(() => {
    if (selectedGameId) {
      const fetchCategoriesAndQuestions = async () => {
        try {
          const isAdmin = session?.user?.role === "admin";
          const categoriesApiUrl = isAdmin
            ? `/api/admin/categories?gameId=${selectedGameId}`
            : `/api/public/categories?gameId=${selectedGameId}`;
          const questionsApiUrl = isAdmin
            ? `/api/admin/questions?gameId=${selectedGameId}`
            : `/api/public/questions?gameId=${selectedGameId}`;

          const [categoriesResponse, questionsResponse] = await Promise.all([
            fetch(categoriesApiUrl),
            fetch(questionsApiUrl),
          ]);

          const categoriesData = await categoriesResponse.json();
          const questionsData = await questionsResponse.json();

          setAllCategories(categoriesData);
          setQuestions(questionsData);

          if (!isAdmin && localPlayerId) {
            refetchPlayerProgressAndSubmissions(); // Initial fetch
          }
        } catch (error) {
          console.error("Error fetching categories or questions:", error);
        }
      };
      fetchCategoriesAndQuestions();
    }
  }, [selectedGameId, session, localPlayerId, refetchPlayerProgressAndSubmissions]); // Added refetchPlayerProgressAndSubmissions to dependencies

  useEffect(() => {
    console.log("Calculating displayableCategories...");
    console.log("allCategories:", allCategories);
    console.log("playerCompletedCategories:", playerCompletedCategories);
    console.log("session.user.role:", session?.user?.role);

    const nonSequentialCategories = allCategories.filter(
      (cat) => !cat.isSequential
    );
    const sequentialCategories = allCategories
      .filter((cat) => cat.isSequential)
      .sort((a, b) => a.order - b.order);

    if (session?.user?.role === "admin" || sequentialCategories.length === 0) {
      setDisplayableCategories(allCategories);
      console.log("Admin view or no sequential categories. Displaying all:", allCategories);
      return;
    }

    const firstUncompletedSequentialCategory = sequentialCategories.find(
      (cat) => !playerCompletedCategories.includes(cat.id)
    );
    console.log("firstUncompletedSequentialCategory:", firstUncompletedSequentialCategory);

    let categoriesToShow = [...nonSequentialCategories];
    if (firstUncompletedSequentialCategory) {
      categoriesToShow.push(firstUncompletedSequentialCategory);
    }
    console.log("categoriesToShow:", categoriesToShow);
    setDisplayableCategories(categoriesToShow);
  }, [allCategories, playerCompletedCategories, session]);


  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const isCategoryComplete = (categoryId: number) => {
    console.log(`Checking if category ${categoryId} is complete...`);
    const questionsInCategory = questions.filter(
      (q) => q.categoryId === categoryId
    );
    if (questionsInCategory.length === 0) {
      console.log(`Category ${categoryId} has no questions.`);
      return false;
    }

    const allQuestionsSubmitted = questionsInCategory.every((q) =>
      allSubmissions.some(
        (s) => s.questionId === q.id && s.teamId === localTeamId
      )
    );
    console.log(`Category ${categoryId} all questions submitted: ${allQuestionsSubmitted}`);
    return allQuestionsSubmitted;
  };

  const handleCompleteCategory = async (categoryId: number) => {
    console.log(`Attempting to complete category ${categoryId}...`);
    if (!localPlayerId || !selectedGameId) {
      console.error("Cannot complete category: localPlayerId or selectedGameId is null.");
      return;
    }

    const response = await fetch("/api/public/player-progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: localPlayerId,
        completedCategoryId: categoryId,
      }),
    });

    if (response.ok) {
      console.log(`Category ${categoryId} marked as completed successfully.`);
      const data = await response.json();
      setPlayerProgress(data);
      refetchPlayerProgressAndSubmissions(); // Refetch after completing a category
    } else {
      console.error("Failed to complete category.");
    }
  };

  const isAdmin = session?.user?.role === "admin";
  const isJudge = session?.user?.role === "judge";
  const isPlayer = localGameId !== null && !isAdmin && !isJudge;

  if (isAdmin || isJudge) {
    // Admin/Judge view remains the same
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
              className="w-full bg-input text-[#476c2e] border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring mb-4"
            >
              <option value="" disabled>
                Select a Game
              </option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
  
            {selectedGameId && (
              <>
                <h3 className="text-lg font-bold mb-2">Existing Questions</h3>
                <ul className="space-y-2">
                  {questions.map((q) => (
                    <li
                      key={q.id}
                      className="p-3 bg-secondary rounded-lg shadow-sm"
                    >
                      {q.questionText} ({q.points} points)
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      );
  } else if (isPlayer) {
    return (
      <div className="flex flex-col h-full bg-card text-foreground">
        <div className="p-2 sm:p-4 flex-1 overflow-y-auto max-h-full"> {/* Added max-h-full */}
          {selectedGameId ? (
            <div className="space-y-4">
              <p className="text-center text-lg font-bold mb-4">
                Have fun, be safe, and answer as many questions as you can.
              </p>
              <Image
                src="/assets/oldben.png"
                alt="Old Ben"
                width={200}
                height={200}
                className="mx-auto mb-4 rounded-lg shadow-md"
              />
              {displayableCategories.length > 0 ? (
                displayableCategories.map((category) => (
                  <div
                    key={category.id}
                    className={`rounded-lg shadow-md ${
                      !category.isSequential ? "bg-[#476c2e]" : "bg-secondary"
                    }`}
                  >
                    <button
                      className="w-full flex justify-between items-center p-4 font-bold text-lg"
                      onClick={() => toggleCategory(category.id)}
                    >
                      {category.name}
                      {expandedCategories.includes(category.id) ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                    {expandedCategories.includes(category.id) && (
                      <ul className="p-4 border-t border-border space-y-2">
                        {questions
                          .filter((q) => q.categoryId === category.id)
                          .map((question) => (
                            <li
                              key={question.id}
                              className="p-3 bg-[#0b2d65] rounded-lg shadow-sm" // Changed bg-card to bg-[#0b2d65]
                            >
                              <p className="font-bold">
                                {question.questionText}
                              </p>
                              <p className="text-sm text-gray-400">
                                {question.points} points
                              </p>
                              {selectedGameId && (
                                <SubmissionForm
                                  questionId={question.id}
                                  gameId={selectedGameId}
                                  onSubmissionSuccess={refetchPlayerProgressAndSubmissions} // Pass callback
                                />
                              )}
                            </li>
                          ))}
                      </ul>
                    )}
                    {isCategoryComplete(category.id) && (
                      <button
                        onClick={() => handleCompleteCategory(category.id)}
                        className="w-full bg-green-500 text-white rounded-b-lg py-3 font-bold hover:bg-green-600 transition-colors mt-2"
                      >
                        Complete Category & Next
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 mt-8">
                  No categories available at this time.
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 mt-8">
              Loading questions or no game selected.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full items-center justify-center bg-card text-foreground p-4">
      <h1 className="text-2xl font-permanent-marker mb-4">Questions</h1>
      <p className="text-center text-gray-500">
        Please join a game to access questions.
      </p>
    </div>
  );
}