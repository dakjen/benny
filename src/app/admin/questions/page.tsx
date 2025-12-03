"use client";

import { useState, useEffect } from "react";

type Question = {
  id: number;
  questionText: string;
  categoryId: number | null; // Changed from category: string
  expectedAnswer: string | null;
  gameId: number; // Added gameId
  points: number; // Added points
};

type Category = {
  id: number;
  name: string;
  gameId: number;
};

type Game = {
  id: number;
  name: string;
};

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // New state for categories
  const [games, setGames] = useState<Game[]>([]); // New state for games
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null); // New state for selected game
  const [questionText, setQuestionText] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null); // New state for selected category
  const [expectedAnswer, setExpectedAnswer] = useState("");
  const [points, setPoints] = useState<number>(0); // New state for points
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // State for managing categories
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchGames = async () => {
    const response = await fetch("/api/admin/games");
    const data = await response.json();
    setGames(data);
    if (data.length > 0) {
      setSelectedGameId(data[0].id); // Select the first game by default
    }
  };

  const fetchCategories = async (gameId: number) => {
    const response = await fetch("/api/admin/categories"); // Assuming API returns all categories, filter by gameId later
    const data = await response.json();
    setCategories(data.filter((cat: Category) => cat.gameId === gameId));
  };

  const fetchQuestions = async (gameId: number) => {
    const response = await fetch(`/api/admin/questions?gameId=${gameId}`);
    const data = await response.json();
    setQuestions(data);
  };

  useEffect(() => {
    fetchGames();
  }, []);

  useEffect(() => {
    if (selectedGameId) {
      fetchCategories(selectedGameId);
      fetchQuestions(selectedGameId);
    }
  }, [selectedGameId]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText || selectedGameId === null || points === 0) return;

    await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionText,
        categoryId: selectedCategoryId,
        expectedAnswer,
        gameId: selectedGameId,
        points,
      }),
    });

    fetchQuestions(selectedGameId);
    setQuestionText("");
    setSelectedCategoryId(null);
    setExpectedAnswer("");
    setPoints(0);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionText(question.questionText);
    setSelectedCategoryId(question.categoryId);
    setExpectedAnswer(question.expectedAnswer || "");
    setPoints(question.points);
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || selectedGameId === null || points === 0) return;

    await fetch(`/api/questions/${editingQuestion.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionText,
        categoryId: selectedCategoryId,
        expectedAnswer,
        gameId: selectedGameId, // Ensure gameId is passed for consistency, though not used in PUT route currently
        points,
      }),
    });

    fetchQuestions(selectedGameId);
    setEditingQuestion(null);
    setQuestionText("");
    setSelectedCategoryId(null);
    setExpectedAnswer("");
    setPoints(0);
  };

  const handleDeleteQuestion = async (id: number) => {
    if (selectedGameId === null) return;
    await fetch(`/api/questions/${id}`, {
      method: "DELETE",
    });
    fetchQuestions(selectedGameId);
  };

  // Category Management Handlers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName || selectedGameId === null) return;

    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName, gameId: selectedGameId }),
    });

    fetchCategories(selectedGameId);
    setNewCategoryName("");
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || selectedGameId === null) return;

    await fetch(`/api/admin/categories/${editingCategory.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName }),
    });

    fetchCategories(selectedGameId);
    setEditingCategory(null);
    setNewCategoryName("");
  };

  const handleDeleteCategory = async (id: number) => {
    if (selectedGameId === null) return;
    await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });
    fetchCategories(selectedGameId);
  };

  const getCategoryName = (categoryId: number | null) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : "N/A";
  };

  return (
    <div className="p-4">
      <header className="bg-background p-4 text-center z-10 shadow-md">
        <h1 className="text-2xl font-permanent-marker">Manage Questions & Categories</h1>
      </header>

      <div className="mt-8 max-w-lg mx-auto">
        <h2 className="text-xl font-bold mb-4">Select Game</h2>
        <select
          value={selectedGameId || ""}
          onChange={(e) => setSelectedGameId(Number(e.target.value))}
          className="w-full bg-input text-card-foreground border border-border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring mb-8"
        >
          <option value="" disabled>Select a Game</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
      </div>

      {selectedGameId && (
        <>
          {/* Category Management */}
          <div className="mt-8 max-w-lg mx-auto">
            <h2 className="text-xl font-bold mb-4">Manage Categories</h2>
            <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="space-y-4 mb-4">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category Name"
                className="w-full bg-input text-card-foreground border border-border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-bold hover:bg-primary/90 transition-colors"
              >
                {editingCategory ? "Update Category" : "Add Category"}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setNewCategoryName("");
                  }}
                  className="w-full bg-gray-500 text-white rounded-lg py-3 font-bold hover:bg-gray-600 transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </form>

            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id} className="p-3 bg-secondary rounded-lg shadow-sm flex justify-between items-center">
                  <span>{cat.name}</span>
                  <div className="space-x-2">
                    <button onClick={() => handleEditCategory(cat)} className="text-blue-400 hover:text-blue-600">Edit</button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 hover:text-red-600">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Question Management */}
          <div className="mt-8 max-w-lg mx-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingQuestion ? "Edit Question" : "Add New Question"}
            </h2>
            <form onSubmit={editingQuestion ? handleUpdateQuestion : handleAddQuestion} className="space-y-4">
              <input
                type="text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Question Text"
                className="w-full bg-input text-card-foreground border border-border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <select
                value={selectedCategoryId || ""}
                onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                className="w-full bg-input text-card-foreground border border-border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">No Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={expectedAnswer}
                onChange={(e) => setExpectedAnswer(e.target.value)}
                placeholder="Expected Answer (optional)"
                className="w-full bg-input text-card-foreground border border-border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                placeholder="Points"
                className="w-full bg-input text-card-foreground border border-border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-bold hover:bg-primary/90 transition-colors"
              >
                {editingQuestion ? "Update Question" : "Add Question"}
              </button>
              {editingQuestion && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingQuestion(null);
                    setQuestionText("");
                    setSelectedCategoryId(null);
                    setExpectedAnswer("");
                    setPoints(0);
                  }}
                  className="w-full bg-gray-500 text-white rounded-lg py-3 font-bold hover:bg-gray-600 transition-colors"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          <div className="mt-8 max-w-lg mx-auto">
            <h2 className="text-xl font-bold mb-4">Existing Questions</h2>
            <ul className="space-y-4">
              {questions.map((q) => (
                <li key={q.id} className="p-4 bg-card rounded-lg shadow-md flex justify-between items-center">
                  <div>
                    <p className="font-bold">{q.questionText}</p>
                    <p className="text-sm text-gray-400">Category: {getCategoryName(q.categoryId)} | Points: {q.points}</p>
                  </div>
                  <div className="space-x-2">
                    <button onClick={() => handleEditQuestion(q)} className="text-blue-500 hover:text-blue-700">Edit</button>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:text-red-700">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}