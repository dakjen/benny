"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ChevronDown, ChevronUp } from "lucide-react"; // Import icons for accordion
import { SubmissionForm } from "@/components/SubmissionForm";
import Image from "next/image";

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
  const [categories, setCategories] = useState<Category[]>([]);
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
  const [allCategories, setAllCategories] = useState<Category[]>([]); // Renamed from allGameCategories
  const [displayableCategories, setDisplayableCategories] = useState<Category[]>([]);

  // Admin-specific states
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionPoints, setNewQuestionPoints] = useState(0);

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
      console.log("fetchGamesAndSetSelected useEffect running...");
      console.log("  Current session:", session);
      console.log("  Current localGameId:", localGameId);
      console.log("  Current selectedGameId:", selectedGameId);
      try {
        const isAdmin = session?.user?.role === "admin";
        const apiUrl = isAdmin ? "/api/admin/games" : "/api/public/games";
        const response = await fetch(apiUrl);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            "Failed to fetch games:",
            response.status,
            response.statusText,
            errorText
          );
          throw new Error(`Failed to fetch games: ${response.statusText}`);
        }
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const errorText = await response.text();
          console.error("Games API did not return JSON:", errorText);
          throw new Error("Games API did not return JSON.");
        }
        const data = await response.json();
        setGames(data);

        let newSelectedGameId: number | null = null;
        if (session?.user?.role === "admin") {
          if (data.length === 1) {
            newSelectedGameId = data[0].id;
          }
        } else if (localGameId) {
          // For players, use localGameId
          newSelectedGameId = localGameId;
        }
        console.log("  Calculated newSelectedGameId:", newSelectedGameId);

        // Only update selectedGameId if it has actually changed
        if (newSelectedGameId !== null && newSelectedGameId !== selectedGameId) {
          console.log("  Setting selectedGameId to:", newSelectedGameId);
          setSelectedGameId(newSelectedGameId);
        } else if (newSelectedGameId === null && selectedGameId !== null) {
          console.log("  Clearing selectedGameId (setting to null).");
          setSelectedGameId(null);
        } else {
          console.log("  selectedGameId remains unchanged.");
        }
      } catch (error) {
        console.error("Error fetching games data:", error);
      }
    };
    fetchGamesAndSetSelected();
  }, [session, localGameId]);

  const handleSubmissionSuccess = useCallback(() => {
    if (selectedGameId) {
      const fetchCategoriesAndQuestions = async () => {
        try {
          const isAdmin = session?.user?.role === "admin";
          const categoriesApiUrl = isAdmin
            ? "/api/admin/categories"
            : "/api/public/categories";
          const questionsApiUrl = isAdmin
            ? `/api/admin/questions?gameId=${selectedGameId}`
            : `/api/public/questions?gameId=${selectedGameId}`;

          // Fetch categories
          const categoriesResponse = await fetch(categoriesApiUrl);
          if (!categoriesResponse.ok) {
            const errorText = await categoriesResponse.text();
            console.error(
              "Failed to fetch categories:",
              categoriesResponse.status,
              categoriesResponse.statusText,
              errorText
            );
            throw new Error(
              `Failed to fetch categories: ${categoriesResponse.statusText}`
            );
          }
          const categoriesContentType =
            categoriesResponse.headers.get("content-type");
          if (
            !categoriesContentType ||
            !categoriesContentType.includes("application/json")
          ) {
            const errorText = await categoriesResponse.text();
            console.error("Categories API did not return JSON:", errorText);
            throw new Error("Categories API did not return JSON.");
          }
          let categoriesData = await categoriesResponse.json();

          // Fetch questions
          const questionsResponse = await fetch(questionsApiUrl);
          if (!questionsResponse.ok) {
            const errorText = await questionsResponse.text();
            console.error(
              "Failed to fetch questions:",
              questionsResponse.status,
              questionsResponse.statusText,
              errorText
            );
            throw new Error(
              `Failed to fetch questions: ${questionsResponse.statusText}`
            );
          }
          const questionsContentType =
            questionsResponse.headers.get("content-type");
          if (
            !questionsContentType ||
            !questionsContentType.includes("application/json")
          ) {
            const errorText = await questionsResponse.text();
            console.error("Questions API did not return JSON:", errorText);
            throw new Error("Questions API did not return JSON.");
          }
          let questionsData = await questionsResponse.json();

          // Filter categories and questions based on gameId
          categoriesData = categoriesData.filter(
            (cat: Category) => cat.gameId === selectedGameId
          );
          questionsData = questionsData.filter(
            (q: Question) => q.gameId === selectedGameId
          );

          setAllCategories(categoriesData); // Store all categories for the game
          setQuestions(questionsData);

          // Player-specific logic for fetching progress and submissions
          if (!isAdmin && localPlayerId) {
            // Fetch player progress
            const playerProgressResponse = await fetch(
              `/api/public/player-progress?playerId=${localPlayerId}`
            );
            if (playerProgressResponse.ok) {
              const playerProgressData = await playerProgressResponse.json();
              setPlayerProgress(playerProgressData);
              setPlayerCompletedCategories(
                JSON.parse(playerProgressData.completedCategories || "[]")
              );
            } else {
              console.error("Failed to fetch player progress.");
              setPlayerCompletedCategories([]);
            }

            // Fetch all submissions for the game
            const submissionsResponse = await fetch(
              `/api/public/submissions?gameId=${selectedGameId}`
            );
            if (submissionsResponse.ok) {
              const submissionsData = await submissionsResponse.json();
              setAllSubmissions(submissionsData);
            } else {
              console.error("Failed to fetch submissions.");
              setAllSubmissions([]);
            }
          }
        } catch (error) {
          console.error("Error fetching categories or questions:", error);
        }
      };
      fetchCategoriesAndQuestions();
    }
  }, [selectedGameId, session, localPlayerId, localTeamId, setAllCategories, setQuestions, setPlayerProgress, setPlayerCompletedCategories, setAllSubmissions]);

  // Fetch categories and questions when selectedGameId changes
  useEffect(() => {
    if (selectedGameId) {
      handleSubmissionSuccess(); // Initial fetch
    }
  }, [selectedGameId, session, localPlayerId, localTeamId, handleSubmissionSuccess]);

  useEffect(() => {
    if (!allCategories.length) return;

    const isAdmin = session?.user?.role === "admin";
    const nonSequentialCategories = allCategories.filter(
      (cat) => !cat.isSequential
    );
    const sequentialCategories = allCategories
      .filter((cat) => cat.isSequential)
      .sort((a, b) => a.order - b.order);

    if (isAdmin || sequentialCategories.length === 0) {
      setDisplayableCategories(allCategories);
      return;
    }

    const firstUncompletedSequentialCategory = sequentialCategories.find(
      (cat) => !playerCompletedCategories.includes(cat.id)
    );

    let categoriesToShow = [...nonSequentialCategories];
    if (firstUncompletedSequentialCategory) {
      categoriesToShow.push(firstUncompletedSequentialCategory);
    }

    setDisplayableCategories(categoriesToShow);
  }, [allCategories, playerCompletedCategories, session]);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Helper to check if all questions in a category are graded
  const isCategoryComplete = (categoryId: number) => {
    const questionsInCategory = questions.filter(
      (q) => q.categoryId === categoryId
    );
    if (questionsInCategory.length === 0) return false; // A category with no questions isn't "complete"

    return questionsInCategory.every((q) =>
      allSubmissions.some(
        (s) => s.questionId === q.id && s.teamId === localTeamId
      )
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
      const data = await response.json();
      setPlayerProgress(data);
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
      const questionsResponse = await fetch(
        `/api/admin/questions?gameId=${selectedGameId}`
      );
      const questionsData = await questionsResponse.json();
      setQuestions(questionsData);
    } else {
      console.error("Failed to add question");
    }
  };

  const isAdmin = session?.user?.role === "admin";
  const isJudge = session?.user?.role === "judge";
  const isPlayer = localGameId !== null && !isAdmin && !isJudge;

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
              <h3 className="text-lg font-bold mb-2">Add New Question</h3>
              <form onSubmit={handleAddQuestion} className="space-y-4 mb-8">
                <input
                  type="text"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Question Text"
                  className="w-full bg-input text-[#476c2e] border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
                <input
                  type="number"
                  value={newQuestionPoints}
                  onChange={(e) =>
                    setNewQuestionPoints(Number(e.target.value))
                  }
                  placeholder="Points"
                  className="w-full bg-input text-[#476c2e] border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-ring"
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
<div className="p-2 sm:p-4 flex-1 overflow-y-auto max-h-full">
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
                      !category.isSequential ? "bg-[#98abff]" : "bg-[#476c2e]"
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
                              className="p-3 bg-[#0b2d65] rounded-lg shadow-sm"
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
                                  onSubmissionSuccess={handleSubmissionSuccess}
                                />
                              )}
                            </li>
                          ))}
                      </ul>
                    )}
                    {category.isSequential && isCategoryComplete(category.id) && (
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
                  No categories found for this game.
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