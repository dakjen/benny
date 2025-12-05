"use client";

import { useState, useRef, useEffect } from "react"; // Import useEffect
import Image from "next/image"; // Import Image for displaying existing existingSubmissions

type ExistingSubmission = {
  id: number;
  submissionType: "text" | "photo" | "video";
  answerText: string | null;
  photo_url: string | null; // For single photo
  video_url: string | null;
  submission_photos: { id: number; url: string }[]; // For multiple photos
};

export function SubmissionForm({
  questionId,
  gameId,
  onSubmissionSuccess, // Accept the callback prop
}: {
  questionId: number;
  gameId: number;
  onSubmissionSuccess: () => void; // Define the callback prop type
}) {
  const [answerText, setAnswerText] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [submissionType, setSubmissionType] = useState<"text" | "photo" | "video">(
    "text"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [existingSubmissions, setExistingSubmissions] = useState<ExistingSubmission[]>([]); // New state for existing existingSubmissions
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  const [localTeamId, setLocalTeamId] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null); // Ref for photo input
  const videoInputRef = useRef<HTMLInputElement>(null); // Ref for video input

  useEffect(() => {
    setLocalPlayerId(localStorage.getItem("playerId"));
    setLocalTeamId(localStorage.getItem("teamId"));
  }, []);

  // Effect to fetch existing existingSubmissions
  useEffect(() => {
    const fetchExistingSubmissions = async () => {
      const localPlayerId = localStorage.getItem("playerId");
      const localTeamId = localStorage.getItem("teamId"); // Fetch teamId
      if (!localPlayerId || !localTeamId || !questionId || !gameId) return;

      try {
        const res = await fetch(
          `/api/public/submissions?questionId=${questionId}&playerId=${localPlayerId}&gameId=${gameId}&teamId=${localTeamId}&status=draft` // Added teamId and status=draft
        );
        if (res.ok) {
          const data = await res.json();
          setExistingSubmissions(data);
        } else {
          console.error("Failed to fetch existing submissions");
        }
      } catch (error) {
        console.error("Error fetching existing submissions:", error);
      }
    };
    fetchExistingSubmissions();
  }, [questionId, gameId, localPlayerId, localTeamId]); // Added localPlayerId and localTeamId to dependencies

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      // Filter out duplicates and combine with existing photos
      const uniqueNewFiles = newFiles.filter(
        (newFile) =>
          !photos.some(
            (existingFile) =>
              existingFile.name === newFile.name &&
              existingFile.size === newFile.size
          )
      );

      const combinedPhotos = [...photos, ...uniqueNewFiles];

      if (combinedPhotos.length > 10) {
        alert("You can only upload a maximum of 10 photos. Excess photos will be ignored.");
        setPhotos(combinedPhotos.slice(0, 10)); // Truncate to 10 photos
      } else {
        setPhotos(combinedPhotos);
      }

      // Clear the input's value so the same file can be selected again if needed
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
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
    const localTeamId = localStorage.getItem("teamId"); // Fetch teamId
    if (!localPlayerId || !localTeamId) {
      console.error("Player ID or Team ID not found in local storage");
      setIsSubmitting(false);
      return;
    }
    formData.append("playerId", localPlayerId);
    formData.append("teamId", localTeamId); // Append teamId
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

    // --- Validation for empty existingSubmissions ---
    if (submissionType === "text" && answerText.trim() === "") {
      alert("Please enter a text answer before submitting.");
      setIsSubmitting(false);
      return;
    }
    if (submissionType === "photo" && photos.length === 0) {
      alert("Please upload at least one photo before submitting.");
      setIsSubmitting(false);
      return;
    }
    if (submissionType === "video" && video === null) {
      alert("Please upload a video before submitting.");
      setIsSubmitting(false);
      return;
    }
    // --- End Validation ---

    try {
      const res = await fetch("/api/public/submissions", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        // Handle successful submission
        console.log("Submission successful");
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
        // Clear text answer only, photos/video persist until "Finished"
        setAnswerText("");
        onSubmissionSuccess(); // Call the callback to refetch parent state
        // Also refetch existing existingSubmissions for this form
        const localPlayerId = localStorage.getItem("playerId");
        if (localPlayerId && questionId && gameId) { // Added gameId
          const res = await fetch(
            `/api/public/submissions?questionId=${questionId}&playerId=${localPlayerId}&gameId=${gameId}` // Added gameId
          );
          if (res.ok) {
            const data = await res.json();
            setExistingSubmissions(data);
          }
        }
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
    const localTeamId = localStorage.getItem("teamId"); // Fetch teamId
    if (!localPlayerId || !localTeamId) {
      console.error("Player ID or Team ID not found in local storage");
      return;
    }

    // --- Validation for empty form before marking as finished ---
    if (answerText.trim() === "" && photos.length === 0 && video === null && existingSubmissions.length === 0) {
      alert("Please submit an answer before marking as finished.");
      return;
    }
    // --- End Validation ---

    try {
      const res = await fetch("/api/public/questions/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: localPlayerId,
          questionId,
          teamId: localTeamId, // Include teamId
        }),
      });

      if (res.ok) {
        // Handle successful completion
        console.log("Question marked as completed");
        // Clear all form fields after "Finished" is clicked
        setAnswerText("");
        setPhotos([]);
        setVideo(null);
        setExistingSubmissions([]); // Clear existing existingSubmissions
        if (photoInputRef.current) photoInputRef.current.value = "";
        if (videoInputRef.current) videoInputRef.current.value = "";
        onSubmissionSuccess(); // Call the callback to refetch parent state
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
      {showSuccessMessage && (
        <div className="text-green-500">Submission successful!</div>
      )}
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
            ref={photoInputRef}
          />
          {photos.length > 0 && (
            <div className="mt-2 text-sm text-gray-500">
              <p>Selected files (to be submitted):</p>
              <ul>
                {photos.map((photo, index) => (
                  <li key={index}>{photo.name}</li>
                ))}
              </ul>
            </div>
          )}
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
            ref={videoInputRef}
          />
        </div>
      )}

      <div className="flex space-x-2">
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-[#7fab61] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#8fb971] focus:outline-none focus:ring-2 focus:ring-[#7fab61] focus:ring-offset-2 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
        <button
          type="button"
          onClick={handleFinished}
          className="inline-flex justify-center rounded-md border border-transparent bg-[#3b3b3d] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#4a4a4d] focus:outline-none focus:ring-2 focus:ring-[#3b3b3d] focus:ring-offset-2 disabled:opacity-50"
          disabled={isSubmitting}
        >
          Finished
        </button>
      </div>

      {/* Display existing existingSubmissions */}
      {existingSubmissions.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <h3 className="text-lg font-bold mb-2">Your Past Submissions:</h3>
          <div className="space-y-3">
            {existingSubmissions.map((sub) => (
              <div key={sub.id} className=""> {/* Removed p-3 bg-gray-100 rounded-lg shadow-sm */}
                {sub.submissionType === "text" && (
                  <p className="text-sm">Text: {sub.answerText}</p>
                )}
                {sub.submissionType === "photo" && sub.submission_photos && sub.submission_photos.length > 0 && (
                  <div>
                    <p className="text-sm">Photo:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {sub.submission_photos.map((photo) => (
                        <Image
                          key={photo.id}
                          src={photo.url}
                          alt="Submission photo"
                          width={50} // Changed from 25
                          height={50} // Changed from 25
                          className="rounded-md object-cover"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {sub.submissionType === "video" && sub.video_url && (
                  <div>
                    <p className="text-sm">Video:</p>
                    <video src={sub.video_url} controls className="w-full max-h-24 rounded-md mt-1" /> {/* Changed max-h-12 to max-h-24 */}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
