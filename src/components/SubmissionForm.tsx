"use client";

import { useState } from "react";

export function SubmissionForm({
  questionId,
  gameId,
}: {
  questionId: number;
  gameId: number;
}) {
  const [answerText, setAnswerText] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [submissionType, setSubmissionType] = useState<"text" | "photo" | "video">(
    "text"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      if (e.target.files.length > 10) {
        alert("You can only upload a maximum of 10 photos.");
        return;
      }
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration < 2 || video.duration > 60) {
          alert("Video must be between 2 and 60 seconds long.");
          setVideo(null);
        } else {
          setVideo(file);
        }
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    const localPlayerId = localStorage.getItem("playerId");
    if (!localPlayerId) {
      console.error("Player ID not found in local storage");
      setIsSubmitting(false);
      return;
    }
    formData.append("playerId", localPlayerId);
    formData.append("questionId", String(questionId));
    formData.append("gameId", String(gameId));
    formData.append("submissionType", submissionType);

    if (submissionType === "text") {
      formData.append("answerText", answerText);
    } else if (submissionType === "photo" && photos.length > 0) {
      photos.forEach((photo) => {
        formData.append("photos", photo);
      });
    } else if (submissionType === "video" && video) {
      formData.append("video", video);
    }

    try {
      const res = await fetch("/api/public/submissions", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        // Handle successful submission
        console.log("Submission successful");
      } else {
        // Handle error
        console.error("Submission failed");
      }
    } catch (error) {
      console.error("Submission failed with error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinished = async () => {
    const localPlayerId = localStorage.getItem("playerId");
    if (!localPlayerId) {
      console.error("Player ID not found in local storage");
      return;
    }

    try {
      const res = await fetch("/api/public/questions/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: localPlayerId,
          questionId,
        }),
      });

      if (res.ok) {
        // Handle successful completion
        console.log("Question marked as completed");
      } else {
        // Handle error
        console.error("Failed to mark question as completed");
      }
    } catch (error) {
      console.error("Failed to mark question as completed with error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="flex items-center">
          <input
            type="radio"
            name="submissionType"
            value="text"
            checked={submissionType === "text"}
            onChange={() => setSubmissionType("text")}
            className="mr-2"
            disabled={isSubmitting}
          />
          Text Answer
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="submissionType"
            value="photo"
            checked={submissionType === "photo"}
            onChange={() => setSubmissionType("photo")}
            className="mr-2"
            disabled={isSubmitting}
          />
          Photo Submission
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="submissionType"
            value="video"
            checked={submissionType === "video"}
            onChange={() => setSubmissionType("video")}
            className="mr-2"
            disabled={isSubmitting}
          />
          Video Submission
        </label>
      </div>

      {submissionType === "text" ? (
        <div>
          <label htmlFor="answerText" className="block text-sm font-medium">
            Your Answer
          </label>
          <textarea
            id="answerText"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-[#476c2e]"
            disabled={isSubmitting}
          />
        </div>
      ) : submissionType === "photo" ? (
        <div>
          <label htmlFor="photo" className="block text-sm font-medium">
            Upload Photo(s)
          </label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            className="mt-1 block w-full text-sm text-[#476c2e] file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
            disabled={isSubmitting}
          />
        </div>
      ) : (
        <div>
          <label htmlFor="video" className="block text-sm font-medium">
            Upload Video
          </label>
          <input
            id="video"
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="mt-1 block w-full text-sm text-[#476c2e] file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
            disabled={isSubmitting}
          />
        </div>
      )}

      <div className="flex space-x-2">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
        <button
          type="button"
          onClick={handleFinished}
          className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          disabled={isSubmitting}
        >
          Finished
        </button>
      </div>
    </form>
  );
}
