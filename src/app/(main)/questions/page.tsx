"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ChevronDown, ChevronUp } from "lucide-react"; // Import icons for accordion

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
  status: "pending" | "graded";
  score: number | null;
};

export default function QuestionsPage() {
  const { data: session } = useSession();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [localGameId, setLocalGameId] = useState<number | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<number | null>(null); // New state for player ID from localStorage

  // New states for player progress
  const [playerCurrentCategoryId, setPlayerCurrentCategoryId] = useState<number | null>(null);
  const [playerCompletedCategories, setPlayerCompletedCategories] = useState<number[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);

  // Admin-specific states (kept for now, will be moved or removed later if needed)
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionPoints, setNewQuestionPoints] = useState(0);

  // Get localGameId and localPlayerId from localStorage for players
  useEffect(() => {
    if (!session?.user) { // Only for players not logged in via session
      const storedGameId = localStorage.getItem("gameId");
      const storedPlayerId = localStorage.getItem("playerId");
      if (storedGameId) {
        setLocalGameId(Number(storedGameId));
      }
      if (storedPlayerId) {
        setLocalPlayerId(Number(storedPlayerId));
      }
    }
  }, [session]);

  // Fetch games for all users and set selectedGameId
  useEffect(() => {
    const fetchGamesAndSetSelected = async () => {
      try {
        const isAdmin = session?.user?.role === "admin";
        const apiUrl = isAdmin ? "/api/admin/games" : "/api/public/games";
        const response = await fetch(apiUrl); // Assuming this API is accessible
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch games:", response.status, response.statusText, errorText);
          throw new Error(`Failed to fetch games: ${response.statusText}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const errorText = await response.text();
          console.error("Games API did not return JSON:", errorText);
          throw new Error("Games API did not return JSON.");
        }
        const data = await response.json();
        setGames(data);

        if (session?.user?.role === "admin") {
          if (data.length === 1) {
            setSelectedGameId(data[0].id);
          }
        } else if (localGameId) { // For players, use localGameId
          setSelectedGameId(localGameId);
        }
      } catch (error) {
        console.error("Error fetching games data:", error);
      }
    };
    fetchGamesAndSetSelected();
  }, [session, localGameId]); // Add localGameId to dependencies

  // Fetch categories and questions when selectedGameId changes
  useEffect(() => {
    if (selectedGameId) {
      const fetchCategoriesAndQuestions = async () => {
        try {
          const isAdmin = session?.user?.role === "admin";
          const categoriesApiUrl = isAdmin ? "/api/admin/categories" : "/api/public/categories";
          const questionsApiUrl = isAdmin ? `/api/admin/questions?gameId=${selectedGameId}` : `/api/public/questions?gameId=${selectedGameId}`;

          // Fetch categories
          const categoriesResponse = await fetch(categoriesApiUrl);
          if (!categoriesResponse.ok) {
            const errorText = await categoriesResponse.text();
            console.error("Failed to fetch categories:", categoriesResponse.status, categoriesResponse.statusText, errorText);
            throw new Error(`Failed to fetch categories: ${categoriesResponse.statusText}`);
          }
          const categoriesContentType = categoriesResponse.headers.get('content-type');
          if (!categoriesContentType || !categoriesContentType.includes('application/json')) {
            const errorText = await categoriesResponse.text();
            console.error("Categories API did not return JSON:", errorText);
            throw new Error("Categories API did not return JSON.");
          }
          let categoriesData = await categoriesResponse.json();

          // Fetch questions
          const questionsResponse = await fetch(questionsApiUrl);
          if (!questionsResponse.ok) {
            const errorText = await questionsResponse.text();
            console.error("Failed to fetch questions:", questionsResponse.status, questionsResponse.statusText, errorText);
            throw new Error(`Failed to fetch questions: ${questionsResponse.statusText}`);
          }
          const questionsContentType = questionsResponse.headers.get('content-type');
          if (!questionsContentType || !questionsContentType.includes('application/json')) {
            const errorText = await questionsResponse.text();
            console.error("Questions API did not return JSON:", errorText);
            throw new Error("Questions API did not return JSON.");
          }
          let questionsData = await questionsResponse.json();

          // Filter categories and questions based on gameId
          categoriesData = categoriesData.filter((cat: Category) => cat.gameId === selectedGameId);
          questionsData = questionsData.filter((q: Question) => q.gameId === selectedGameId);

          // Player-specific logic for sequential categories
          if (!isAdmin && localPlayerId) {
            let playerProgressData = { currentCategoryId: null, completedCategories: "[]" }; // Initialize with default

            // Fetch player progress
            const playerProgressResponse = await fetch(`/api/public/player-progress?playerId=${localPlayerId}`);
            if (playerProgressResponse.ok) {
              playerProgressData = await playerProgressResponse.json();
              setPlayerCurrentCategoryId(playerProgressData.currentCategoryId);
              setPlayerCompletedCategories(JSON.parse(playerProgressData.completedCategories || "[]"));
            } else {
              console.error("Failed to fetch player progress.");
              setPlayerCurrentCategoryId(null);
              setPlayerCompletedCategories([]);
            }

            // Fetch player submissions
            const submissionsResponse = await fetch(`/api/public/submissions?playerId=${localPlayerId}`);
            if (submissionsResponse.ok) {
              const submissionsData = await submissionsResponse.json();
              setAllSubmissions(submissionsData);
            } else {
              console.error("Failed to fetch player submissions.");
              setAllSubmissions([]);
            }

            // Determine if there are any sequential categories in this game
            const gameHasSequentialCategories = categoriesData.some((cat: Category) => cat.isSequential);

            if (gameHasSequentialCategories) {
              console.log("Player-specific logic: gameHasSequentialCategories is true");
              console.log("Current playerCurrentCategoryId:", playerCurrentCategoryId);
              console.log("playerProgressData.currentCategoryId:", playerProgressData.currentCategoryId);

              // If playerCurrentCategoryId is null, find the first uncompleted sequential category
              if (playerProgressData.currentCategoryId === null) {
                console.log("playerProgressData.currentCategoryId is null, attempting to find first uncompleted sequential category.");
                const firstUncompletedSequentialCategory = categoriesData
                  .filter((cat: Category) => cat.isSequential && !playerCompletedCategories.includes(cat.id))
                  .sort((a: Category, b: Category) => a.order - b.order)[0];

                if (firstUncompletedSequentialCategory) {
                  console.log("Found firstUncompletedSequentialCategory:", firstUncompletedSequentialCategory.id);
                  setPlayerCurrentCategoryId(firstUncompletedSequentialCategory.id);
                  // Also update the backend to set this as the current category
                  await fetch("/api/public/player-progress", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      playerId: localPlayerId,
                      currentCategoryId: firstUncompletedSequentialCategory.id,
                    }),
                  });
                } else {
                  console.log("No uncompleted sequential category found.");
                }
              }

              // Filter categories to only show the current one if sequential
              if (playerCurrentCategoryId !== null) {
                console.log("Filtering categories for current playerCurrentCategoryId:", playerCurrentCategoryId);
                categoriesData = categoriesData.filter((cat: Category) => cat.id === playerCurrentCategoryId);
                questionsData = questionsData.filter((q: Question) => q.categoryId === playerCurrentCategoryId);
              } else {
                // If no current category is set, and there are sequential categories, show nothing
                console.log("No playerCurrentCategoryId set, showing nothing for sequential categories.");
                categoriesData = [];
                questionsData = [];
              }
            }
          }

          setCategories(categoriesData);
          setQuestions(questionsData);
        } catch (error) {
          console.error("Error fetching categories or questions:", error);
        }
      };
      fetchCategoriesAndQuestions();
    }
  }, [selectedGameId, session, localPlayerId, playerCurrentCategoryId, playerCompletedCategories]); // Added dependencies

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Helper to check if all questions in a category are graded
  const isCategoryComplete = (categoryId: number) => {
    const questionsInCategory = questions.filter(q => q.categoryId === categoryId);
    if (questionsInCategory.length === 0) return false; // A category with no questions isn't "complete"

    return questionsInCategory.every(q =>
      allSubmissions.some(s => s.questionId === q.id && s.status === "graded")
    );
  };

  const handleCompleteCategory = async (categoryId: number) => {
    if (!localPlayerId || !selectedGameId) return;

    // Call the API to update player progress
    const response = await fetch("/api/public/player-progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: localPlayerId,
        completedCategoryId: categoryId,
      }),
    });

    if (response.ok) {
      // Re-fetch categories and questions to update the UI with the next category
      // This will trigger the useEffect that fetches categories and questions
      // and update playerCurrentCategoryId and playerCompletedCategories
      // based on the response from the player-progress API.
      // For now, we can just re-trigger the fetch.
      // This will be handled by the useEffect that depends on playerCurrentCategoryId and playerCompletedCategories
    } else {
      console.error("Failed to complete category.");
    }
  };

  // Admin-specific logic (kept for now)
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameId || newQuestionText.trim() === "") {
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

  const isAdmin = session?.user?.role === "admin";
  const isJudge = session?.user?.role === "judge";
  const isPlayer = session?.user?.role === "player" && localGameId !== null;

  if (isAdmin || isJudge) {
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
  } else if (isPlayer) {
    const currentCategory = categories.find(cat => cat.id === playerCurrentCategoryId);
    const isCurrentCategoryComplete = currentCategory ? isCategoryComplete(currentCategory.id) : false;

    return (
      <div className="flex flex-col h-full bg-card text-foreground">
        <header className="bg-background p-4 text-center z-10 shadow-md">
          <h1 className="text-2xl font-permanent-marker">Questions</h1>
        </header>

        <div className="p-4">
          {selectedGameId ? (
            <div className="space-y-4">
              {currentCategory ? (
                <div key={currentCategory.id} className="bg-secondary rounded-lg shadow-md">
                  <button
                    className="w-full flex justify-between items-center p-4 font-bold text-lg"
                    onClick={() => toggleCategory(currentCategory.id)}
                  >
                    {currentCategory.name}
                    {expandedCategories.includes(currentCategory.id) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                  {expandedCategories.includes(currentCategory.id) && (
                    <ul className="p-4 border-t border-border space-y-2">
                      {questions
                        .filter((q) => q.categoryId === currentCategory.id)
                        .map((question) => (
                          <li key={question.id} className="p-3 bg-card rounded-lg shadow-sm">
                            <p className="font-bold">{question.questionText}</p>
                            <p className="text-sm text-gray-400">{question.points} points</p>
                          </li>
                        ))}
                    </ul>
                  )}
                  {isCurrentCategoryComplete && (
                    <button
                      onClick={() => handleCompleteCategory(currentCategory.id)}
                      className="w-full bg-green-500 text-white rounded-b-lg py-3 font-bold hover:bg-green-600 transition-colors mt-2"
                    >
                      Complete Category & Next
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-center text-gray-500 mt-8">No active category or all categories completed.</p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 mt-8">Loading questions or no game selected.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full items-center justify-center bg-card text-foreground p-4">
      <h1 className="text-2xl font-permanent-marker mb-4">Questions</h1>
      <p className="text-center text-gray-500">Please join a game to access questions.</p>
    </div>
  );
}