import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { CheckCircle } from "lucide-react";
import axios from "axios";

interface Question {
  id: number;
  question: string;
  options: string[];
  answer?: string;
    explanation?: string; // <-- NEW
}

export default function TestPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showResult, setShowResult] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const questionsPerPage = 5;

  const testId = window.location.pathname.split("/").pop();
  const attemptId = localStorage.getItem("active_attempt_id");
  const token = localStorage.getItem("token");

  const API_TEST = "https://ebook-backend-lxce.onrender.com/api/mock-tests";
  const API_ACTION = "https://ebook-backend-lxce.onrender.com/api/test";

  /* ==========================================================
     Load Test
  ===========================================================*/
  const loadTest = useCallback(async () => {
    if (!attemptId || !testId) return;

    try {
     const res = await axios.get(`${API_ACTION}/questions/${testId}`, {

        headers: { Authorization: `Bearer ${token}` },
      });

      const test = res.data;

      if (!test || !test.mock_test_questions) {
        alert("This test has no questions");
        window.location.href = "/user-dashboard";
        return;
      }
console.log("🔥 Loaded questions:", test.mock_test_questions);

      const mcqs = test.mock_test_questions;

  const formatted = mcqs.map((q: any) => ({
  id: q.id,
  question: q.question,
  options: q.options || [],   // <-- correct
  answer: q.correct_option,
  explanation: q.explanation || ""
}));




      setQuestions(formatted);

      // timeLeft
      const duration = Number(test.duration_minutes);
      const defaultTime = duration > 0 ? duration * 60 : 15 * 60;

      setTimeLeft(defaultTime);

      // load saved answers
      const saved = localStorage.getItem(`attempt_${attemptId}_answers`);
      if (saved) setAnswers(JSON.parse(saved));

      // load saved page
      const savedPage = localStorage.getItem(`attempt_${attemptId}_page`);
      if (savedPage) setCurrentPage(Number(savedPage));

      setInitialized(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load test");
      window.location.href = "/user-dashboard";
    }
  }, [attemptId, testId, token]);

  useEffect(() => {
    loadTest();
  }, [loadTest]);

  /* ==========================================================
     Timer
  ===========================================================*/
  useEffect(() => {
    if (!initialized || showResult) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [initialized, showResult]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
  };

  /* ==========================================================
     Save Answer
  ===========================================================*/
  const saveAnswerToServer = async (question_id: number, answer: string) => {
    if (!attemptId) return;

    try {
      await axios.post(
        `${API_ACTION}/save-answer`,
        { attempt_id: attemptId, question_id, answer },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      console.warn("Failed to save answer");
    }
  };

  const handleAnswer = (id: number, option: string) => {
    setAnswers((prev) => {
      const updated = { ...prev, [id]: option };

      localStorage.setItem(
        `attempt_${attemptId}_answers`,
        JSON.stringify(updated)
      );

      saveAnswerToServer(id, option);

      return updated;
    });
  };

  /* ==========================================================
     Submit
  ===========================================================*/
  const handleSubmit = async (auto = false) => {
    if (submitting || !attemptId) return;
    setSubmitting(true);

    try {
      await axios.post(
        `${API_ACTION}/finish`,
        { attempt_id: attemptId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.removeItem(`attempt_${attemptId}_answers`);
      localStorage.removeItem(`attempt_${attemptId}_page`);

      localStorage.setItem("test_finished", "yes");

      setShowResult(true);

      if (auto) alert("Time up! Test auto-submitted.");
    } catch (err) {
      console.error("Failed to submit:", err);
      alert("Failed to submit test");
    } finally {
      setSubmitting(false);
    }
  };

  /* ==========================================================
     Pagination
  ===========================================================*/
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const start = (currentPage - 1) * questionsPerPage;
  const current = questions.slice(start, start + questionsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    localStorage.setItem(`attempt_${attemptId}_page`, String(page));
  };

  /* ==========================================================
     UI
  ===========================================================*/
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      {/* TIMER */}
      <div className="bg-[#1d4d6a] text-white px-6 py-2 rounded-full mb-6 shadow-md text-lg font-semibold">
        ⏰ Time Left: {formatTime(timeLeft)}
      </div>

      {/* QUESTIONS */}
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-4xl">
        {current.map((q, idx) => (
          <div key={q.id} className="mb-6 border-b pb-4">
            <h3 className="font-semibold text-lg text-[#1d4d6a] mb-2">
              {start + idx + 1}. {q.question}
            </h3>

            <div className="grid gap-2">
              {q.options.map((option) => (
                <label
                  key={`${q.id}-${option}`}
                  className="flex items-center gap-2 text-gray-700"
                >
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
              {answers[q.id] && (
  <p className="mt-2 text-sm text-blue-700 bg-blue-50 p-2 rounded">
    <strong>Explanation:</strong> {q.explanation}
  </p>
)}
            </div>
          </div>
        ))}

        {/* NAV */}
        <div className="flex justify-between items-center mt-6">
          <Button
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            Previous
          </Button>

          {currentPage < totalPages ? (
            <Button onClick={() => goToPage(currentPage + 1)}>
              Next
            </Button>
          ) : (
            <Button
              className="bg-[#bf2026]"
              disabled={submitting}
              onClick={() => handleSubmit(false)}
            >
              Submit Test
            </Button>
          )}
        </div>
      </div>

      {/* RESULT */}
      {showResult && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center w-96">
            <CheckCircle className="text-green-500 w-16 h-16 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-[#1d4d6a] mb-2">
              ✅ Test Submitted!
            </h2>
            <p className="text-lg text-gray-700 mb-3">
              Your test has been submitted successfully.
            </p>

            <Button
              onClick={() => (window.location.href = "/user-dashboard")}
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