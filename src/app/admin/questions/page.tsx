"use client";

import { useState, useEffect } from "react";

type Question = {
  id: number;
  questionText: string;
  category: string | null;
  expectedAnswer: string | null;
};

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [category, setCategory] = useState("");
  const [expectedAnswer, setExpectedAnswer] = useState("");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const fetchQuestions = async () => {
    const response = await fetch("/api/questions");
    const data = await response.json();
    setQuestions(data);
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText) return;

    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionText, category, expectedAnswer }),
    });

    fetchQuestions();
    setQuestionText("");
    setCategory("");
    setExpectedAnswer("");
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionText(question.questionText);
    setCategory(question.category || "");
    setExpectedAnswer(question.expectedAnswer || "");
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    await fetch(`/api/questions/${editingQuestion.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionText, category, expectedAnswer }),
    });

    fetchQuestions();
    setEditingQuestion(null);
    setQuestionText("");
    setCategory("");
    setExpectedAnswer("");
  };

  const handleDeleteQuestion = async (id: number) => {
    await fetch(`/api/questions/${id}`, {
      method: "DELETE",
    });
    fetchQuestions();
  };

  return (
    <div className="p-4">
      <header className="bg-background p-4 text-center z-10 shadow-md">
        <h1 className="text-2xl font-permanent-marker">Manage Questions</h1>
      </header>

      <div className="mt-8">
        <form onSubmit={editingQuestion ? handleUpdateQuestion : handleAddQuestion} className="space-y-4 max-w-lg mx-auto">
          <input
            type="text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Question Text"
            className="w-full bg-input text-card-foreground border border-border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="w-full bg-input text-card-foreground border border-border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="text"
            value={expectedAnswer}
            onChange={(e) => setExpectedAnswer(e.target.value)}
            placeholder="Expected Answer"
            className="w-full bg-input text-card-foreground border border-border rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-ring"
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
                setCategory("");
                setExpectedAnswer("");
              }}
              className="w-full bg-gray-500 text-white rounded-lg py-3 font-bold hover:bg-gray-600 transition-colors"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Existing Questions</h2>
        <ul className="space-y-4">
          {questions.map((q) => (
            <li key={q.id} className="p-4 bg-card rounded-lg shadow-md flex justify-between items-center">
              <div>
                <p className="font-bold">{q.questionText}</p>
                <p className="text-sm text-gray-400">{q.category}</p>
              </div>
              <div className="space-x-2">
                <button onClick={() => handleEditQuestion(q)} className="text-blue-500 hover:text-blue-700">Edit</button>
                <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:text-red-700">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
