import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { CheckCircle } from "lucide-react";
import axios from "axios";

interface Question {
  id: number;
  question: string;
  options: string[];
  answer?: string; // backend does NOT send answer
}

export default function TestPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const questionsPerPage = 5;

  const pathParts = window.location.pathname.split("/").filter(Boolean);
// URL: /test/8 → ["test", "8"]
const testId = pathParts[1];


  const attemptId = localStorage.getItem("active_attempt_id");
  const token = localStorage.getItem("token");console.log("Submitting with attemptId:", attemptId);

  /* ---------------------------------------------------
     1️⃣ Fetch Questions from Backend
  -----------------------------------------------------*/
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
       const res = await axios.get(
  `https://ebook-backend-lxce.onrender.com/api/mock-tests/test/${testId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);

setQuestions(res.data.mcqs || []);


      const formatted = res.data.map((q: any) => ({
  id: q.id,
  question: q.question,
  options: [q.option_a, q.option_b, q.option_c, q.option_d],
  answer: q.correct_option // 🔥 correct answer available now
}));
        setQuestions(formatted);
      } catch (err) {
        console.error("❌ Error loading questions:", err);
      }
    };

    fetchQuestions();
  }, []);

  // add stat
const handleAnswer = (id: number, option: string) => {
  // 1) Update UI state
  setAnswers((prev) => {
    const updated = { ...prev, [id]: option };

    // Save in local storage (fallback safety)
    const attemptId = localStorage.getItem("active_attempt_id");
    if (attemptId) {
      const key = `attempt_${attemptId}_answers`;
      localStorage.setItem(key, JSON.stringify(updated));
    }

    return updated;
  });

  // 2) Save to backend
  saveAnswerToServer(id, option);
};


const handleSubmit = async (auto = false) => {
  if (submitting) return;
  setSubmitting(true);

  const attemptId = localStorage.getItem("active_attempt_id");
  if (!attemptId) {
    alert("❌ Attempt ID missing. Cannot submit!");
    setSubmitting(false);
    return;
  }

  try {
    // 1) Flush any answers in localStorage for this attempt (optional fallback)
    const key = `attempt_${attemptId}_answers`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const savedAnswers: Record<number, string> = JSON.parse(saved);
        // send each answer (dedupe by question id)
        const entries = Object.entries(savedAnswers);
        await Promise.all(
          entries.map(([qid, ans]) =>
            axios.post(
              "https://ebook-backend-lxce.onrender.com/api/test/save-answer",
              { attempt_id: attemptId, question_id: Number(qid), answer: ans },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          )
        );
        // optional: remove local cache after flush
        localStorage.removeItem(key);
      } catch (e) {
        console.warn("Failed to flush local answers:", e);
      }
    }

    // 2) Also ensure any in-memory answers not yet saved are saved
    // (this assumes saveAnswerToServer is the same post used above)
    const unsavedRequests: Promise<any>[] = [];
    Object.entries(answers).forEach(([qid, ans]) => {
      // You can add a check to only post if not present in DB, but simple approach:
      unsavedRequests.push(
        axios.post(
          "https://ebook-backend-lxce.onrender.com/api/test/save-answer",
          { attempt_id: attemptId, question_id: Number(qid), answer: ans },
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(err => {
          console.warn("save-answer failed for", qid, err);
        })
      );
    });
    await Promise.all(unsavedRequests);

    // 3) Now call finish (only after answers saved)
    await axios.post(
      "https://ebook-backend-lxce.onrender.com/api/test/finish",
      { attempt_id: attemptId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Local score calculation (optional, UI-only)
    let correct = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.answer) correct++;
    });

    setScore(correct);
    setShowResult(true);

    // Notify dashboard to refresh
    localStorage.setItem("test_finished", "yes");

    if (auto) alert("⏳ Time up! Auto-submitted.");
  } catch (err) {
    console.error("❌ Failed to finish test:", err);
    alert("❌ Failed to submit test. Check backend logs.");
  } finally {
    setSubmitting(false);
  }
};




  /* ---------------------------------------------------
     2️⃣ Auto-Save Answer on Select
  -----------------------------------------------------*/
  const saveAnswerToServer = async (question_id: number, answer: string) => {
  try {
    await axios.post(
      "https://ebook-backend-lxce.onrender.com/api/test/save-answer",
      { attempt_id: attemptId, question_id, answer },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (err) {
    console.error("❌ Failed to save answer:", err);
  }
};



  /* ---------------------------------------------------
     3️⃣ Timer + Auto Submit
  -----------------------------------------------------*/
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit(true); // 🔥 auto submit
      return;
    }
    if (showResult) return;

    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, showResult]);


  


  /* ---------------------------------------------------
     Pagination
  -----------------------------------------------------*/
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const currentQuestions = questions.slice(startIndex, startIndex + questionsPerPage);

  /* ---------------------------------------------------
     Format Timer
  -----------------------------------------------------*/
  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  /* ---------------------------------------------------
     Prevent reopening finished tests
  -----------------------------------------------------*/
  useEffect(() => {
    if (!attemptId) return;

    const checkAttempt = async () => {
      const res = await axios.get(
        `https://ebook-backend-lxce.onrender.com/api/test/attempt/${attemptId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === "completed") {
        alert("This test is already completed!");
        window.location.href = "/dashboard";
      }
    };

    checkAttempt();
  }, []);

  /* ---------------------------------------------------
     Return UI
  -----------------------------------------------------*/
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">

      {/* TIMER */}
      <div className="bg-[#1d4d6a] text-white px-6 py-2 rounded-full mb-6 shadow-md text-lg font-semibold">
        ⏰ Time Left: {formatTime(timeLeft)}
      </div>

      {/* QUESTIONS */}
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-4xl">
        
        {currentQuestions.map((q, index) => (
          <div key={q.id} className="mb-6 border-b pb-4">
            <h3 className="font-semibold text-lg text-[#1d4d6a] mb-2">
              {startIndex + index + 1}. {q.question}
            </h3>

            <div className="grid gap-2">
              {q.options.map((option) => (
                <label key={option} className="flex items-center gap-2 text-gray-700">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={answers[q.id] === option}
                    onChange={() => handleAnswer(q.id, option)}
                    className="w-4 h-4 accent-[#bf2026]"
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        ))}

        {/* NAVIGATION */}
        <div className="flex justify-between items-center mt-6">
          <Button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
            Previous
          </Button>

          {currentPage < totalPages ? (
            <Button onClick={() => setCurrentPage((p) => p + 1)}>
              Next
            </Button>
          ) : (
            <Button className="bg-[#bf2026]" onClick={() => handleSubmit(false)}>
              Submit Test
            </Button>
          )}
        </div>
      </div>

      {/* RESULT POPUP */}
      {showResult && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center w-96">
            <CheckCircle className="text-green-500 w-16 h-16 mx-auto mb-3" />

            <h2 className="text-2xl font-bold text-[#1d4d6a] mb-2">✅ Test Completed!</h2>

            <p className="text-lg text-gray-700 mb-3">
              Your test has been submitted successfully.
            </p>

            <Button
              onClick={() => (window.location.href = "/user/dashboard")}
              className="bg-[#bf2026] text-white"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}