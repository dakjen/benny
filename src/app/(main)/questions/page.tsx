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
};

type Question = {
  id: number;
  questionText: string;
  categoryId: number | null; // Ensure categoryId is present
  expectedAnswer?: string;
  gameId: number;
  points: number;
};

export default function QuestionsPage() {
  const { data: session } = useSession();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]); // State to manage expanded categories
  const [localGameId, setLocalGameId] = useState<number | null>(null); // New state for player's game ID

  // Admin-specific states (kept for now, will be moved or removed later if needed)
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionPoints, setNewQuestionPoints] = useState(0);

  // Get localGameId from localStorage for players
  useEffect(() => {
    if (!session?.user) { // Only for players not logged in via session
      const storedGameId = localStorage.getItem("gameId");
      if (storedGameId) {
        setLocalGameId(Number(storedGameId));
      }
    }
  }, [session]);

  // Fetch games for all users and set selectedGameId
  useEffect(() => {
    const fetchGamesAndSetSelected = async () => {
      try {
        const response = await fetch("/api/admin/games"); // Assuming this API is accessible
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch games:", response.status, response.statusText, errorText);
          throw new Error(`Failed to fetch games: ${response.statusText}`);
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
          // Fetch categories
          const categoriesResponse = await fetch("/api/admin/categories"); // Assuming this API is accessible
          if (!categoriesResponse.ok) {
            const errorText = await categoriesResponse.text();
            console.error("Failed to fetch categories:", categoriesResponse.status, categoriesResponse.statusText, errorText);
            throw new Error(`Failed to fetch categories: ${categoriesResponse.statusText}`);
          }
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.filter((cat: Category) => cat.gameId === selectedGameId));

          // Fetch questions
          const questionsResponse = await fetch(`/api/admin/questions?gameId=${selectedGameId}`); // Assuming this API is accessible
          if (!questionsResponse.ok) {
            const errorText = await questionsResponse.text();
            console.error("Failed to fetch questions:", questionsResponse.status, questionsResponse.statusText, errorText);
            throw new Error(`Failed to fetch questions: ${questionsResponse.statusText}`);
          }
          const questionsData = await questionsResponse.json();
          setQuestions(questionsData);
        } catch (error) {
          console.error("Error fetching categories or questions:", error);
        }
      };
      fetchCategoriesAndQuestions();
    }
  }, [selectedGameId]);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
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
  const isPlayer = localGameId !== null && !isAdmin;

  if (isAdmin) {
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
    return (
      <div className="flex flex-col h-full bg-card text-foreground">
        <header className="bg-background p-4 text-center z-10 shadow-md">
          <h1 className="text-2xl font-permanent-marker">Questions</h1>
        </header>

        <div className="p-4">
          {selectedGameId ? (
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="bg-secondary rounded-lg shadow-md">
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
                          <li key={question.id} className="p-3 bg-card rounded-lg shadow-sm">
                            <p className="font-bold">{question.questionText}</p>
                            <p className="text-sm text-gray-400">{question.points} points</p>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ))}
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