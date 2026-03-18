import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { CheckCircle, Clock, Maximize2, Minimize2, ChevronLeft, ChevronRight, Bookmark, Circle, HelpCircle, AlertTriangle } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface Question {
  id: number;
  question: string;
  options: string[];
  answer?: string;
    explanation?: string; // <-- NEW
}

export default function TestPage({
  testId,
  onNavigate,
  onLogout,
}: {
  testId?: any;
  onNavigate?: (page: any, param?: any) => void;
  onLogout?: () => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showResult, setShowResult] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visitedQuestions, setVisitedQuestions] = useState<Record<number, boolean>>({});

  const questionsPerPage = 5;

  const urlTestId = window.location.pathname.split("/").pop();
  const activeTestId = testId || urlTestId;
  const attemptId = localStorage.getItem("active_attempt_id");
  const token = localStorage.getItem("token");

  const API_TEST = `${import.meta.env.VITE_API_URL}/api/mock-tests`;
  const API_ACTION = `${import.meta.env.VITE_API_URL}/api/test`;

  /* ==========================================================
     Load Test
  ===========================================================*/
 const loadTest = useCallback(async () => {
  if (!attemptId || !activeTestId) return;

  try {
    /* 1️⃣ Fetch attempt metadata */
    const attemptRes = await axios.get(
      `${API_ACTION}/attempt/${attemptId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const attempt = attemptRes.data.attempt || attemptRes.data;

    console.log("====== ATTEMPT DEBUG ======");
    console.log("duration:", attempt.duration_minutes);
    console.log("started_at:", attempt.started_at);
    console.log("attemptId:", attemptId);
    console.log("===========================");

    if (!attempt || !attempt.duration_minutes || !attempt.started_at) {
      alert("Invalid attempt state");
      window.location.href = "/user-dashboard";
      return;
    }

    /* 2️⃣ Fetch questions (also contains duration + started_at now) */
    const res = await axios.get(`${API_ACTION}/questions/${activeTestId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-attempt-id": attemptId
      }
    });

    const test = res.data;

    if (!test || !test.mock_test_questions) {
      alert("This test has no questions");
      window.location.href = "/user-dashboard";
      return;
    }

    /* 3️⃣ Prepare questions */
    const formatted = test.mock_test_questions.map((q: any) => ({
      id: q.id,
      question: q.question,
      options: q.options || [],
      answer: q.correct_option,
      explanation: q.explanation || "",
    }));

    setQuestions(formatted);

    /* 🧩 IMPORTANT TIMER FIX:
       Read duration & started_at from QUESTIONS RESPONSE first,
       fallback to attempt if missing
    */
    const duration = Number(test.duration_minutes || attempt.duration_minutes);
    const startedAt = new Date(test.started_at || attempt.started_at).getTime();

    const expiresAt = startedAt + duration * 60 * 1000;
    const now = Date.now();

    const remainingSeconds = Math.max(
      0,
      Math.floor((expiresAt - now) / 1000)
    );

    console.log("==== TIMER DEBUG ====");
    console.log({
      duration,
      startedAt: new Date(startedAt),
      expiresAt: new Date(expiresAt),
      now: new Date(now),
      remainingSeconds
    });
    console.log("====================");

    setTimeLeft(remainingSeconds);

    /* 4️⃣ Restore local saved progress */
    const savedAnswers = localStorage.getItem(`attempt_${attemptId}_answers`);
    if (savedAnswers) setAnswers(JSON.parse(savedAnswers));

    const savedPage = localStorage.getItem(`attempt_${attemptId}_page`);
    if (savedPage) setCurrentPage(Number(savedPage));

    const savedMarked = localStorage.getItem(`attempt_${attemptId}_marked`);
    if (savedMarked) setMarkedForReview(JSON.parse(savedMarked));

    const savedVisited = localStorage.getItem(`attempt_${attemptId}_visited`);
    if (savedVisited) setVisitedQuestions(JSON.parse(savedVisited));

    setInitialized(true);
  } catch (err) {
    console.error("❌ Load test failed:", err);
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

  const toggleMarkForReview = (id: number) => {
    setMarkedForReview((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem(
        `attempt_${attemptId}_marked`,
        JSON.stringify(updated)
      );
      return updated;
    });
  };

  const toggleExplanation = (id: number) => {
    setShowExplanation(prev => ({ ...prev, [id]: !prev[id] }));
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
    
    // Mark questions on the new page as visited
    const newStart = (page - 1) * questionsPerPage;
    const questionsOnPage = questions.slice(newStart, newStart + questionsPerPage);
    setVisitedQuestions(prev => {
      const updated = { ...prev };
      questionsOnPage.forEach(q => { updated[q.id] = true; });
      localStorage.setItem(`attempt_${attemptId}_visited`, JSON.stringify(updated));
      return updated;
    });
  };

  /* ==========================================================
     UI
  ===========================================================*/
  return (
    <div className={`min-h-screen bg-[#f8fafc] flex flex-col md:flex-row p-4 md:p-6 gap-6 transition-all duration-500 ${isFullscreen ? "fixed inset-0 z-[100] p-0 md:p-0 overflow-y-auto" : ""}`}>
      {/* PROFESSIONAL TIMER CARD */}
      <div className="fixed bottom-6 right-6 md:top-6 md:bottom-auto z-50">
        <div className={`
          flex items-center gap-4 px-6 py-3 rounded-2xl shadow-2xl border-2 transition-all duration-300
          ${timeLeft < 300 ? "bg-red-50 border-red-200 animate-pulse" : 
            timeLeft < 600 ? "bg-amber-50 border-amber-200" : 
            "bg-white border-blue-100"}
        `}>
          <div className={`p-2 rounded-full ${timeLeft < 300 ? "bg-red-100 text-red-600" : "bg-blue-50 text-blue-600"}`}>
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Time Remaining</p>
            <p className={`text-2xl font-mono font-bold tabular-nums ${timeLeft < 300 ? "text-red-600" : "text-[#1d4d6a]"}`}>
              {formatTime(timeLeft)}
            </p>
          </div>
          {timeLeft < 300 && (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      {/* LEFT SIDE: QUESTIONS */}
      <div className={`flex-1 flex flex-col items-center transition-all ${isFullscreen ? "max-w-5xl mx-auto w-full py-8 px-4" : ""}`}>
        {/* HEADER BAR FOR FULLSCREEN */}
        <div className="w-full max-w-4xl flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1d4d6a]">Mock Examination</h2>
            <p className="text-sm text-gray-500">ID: {activeTestId} • Attempt: {attemptId?.slice(-6)}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-gray-500 hover:text-[#1d4d6a]"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5 mr-2" /> : <Maximize2 className="w-5 h-5 mr-2" />}
            {isFullscreen ? "Exit Fullscreen" : "Distraction-Free"}
          </Button>
        </div>

        <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-4xl">
          {current.map((q, idx) => (
            <div key={q.id} className="mb-8 border-b pb-6 last:border-b-0">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-xl text-[#1d4d6a] leading-tight">
                  <span className="text-blue-600 mr-2">Q{start + idx + 1}.</span>
                  {q.question}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`whitespace-nowrap rounded-lg transition-all ${markedForReview[q.id] ? "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100" : "hover:border-[#1d4d6a] hover:text-[#1d4d6a]"}`}
                    onClick={() => toggleMarkForReview(q.id)}
                  >
                    <Bookmark className={`w-4 h-4 mr-1.5 ${markedForReview[q.id] ? "fill-purple-600" : ""}`} />
                    {markedForReview[q.id] ? "Review Marked" : "Mark for Review"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 pl-4 border-l-2 border-transparent hover:border-blue-50 transition-all">
                {q.options.map((option) => (
                  <label
                    key={`${q.id}-${option}`}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      answers[q.id] === option
                        ? "bg-blue-50 border-blue-200"
                        : "hover:bg-gray-50 border-gray-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === option}
                      onChange={() => handleAnswer(q.id, option)}
                      className="w-4 h-4 accent-[#bf2026]"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}

                {(showExplanation[q.id] || showResult) && q.explanation && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <p className="text-sm text-green-800">
                      <strong className="block mb-1">Explanation:</strong> 
                      {q.explanation}
                    </p>
                  </div>
                )}
                
                {!showResult && q.explanation && !showExplanation[q.id] && answers[q.id] && (
                   <button 
                     onClick={() => toggleExplanation(q.id)}
                     className="text-xs text-[#1d4d6a] hover:underline mt-2 w-fit"
                   >
                     Show Explanation
                   </button>
                )}
              </div>
            </div>
          ))}

          {/* NAV */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              Previous
            </Button>

            <div className="text-sm text-gray-500 font-medium">
              Page {currentPage} of {totalPages}
            </div>

            {currentPage < totalPages ? (
              <Button onClick={() => goToPage(currentPage + 1)}>
                Next Question
              </Button>
            ) : (
              <Button
                className="bg-[#bf2026] hover:bg-[#a01c22] text-white px-8"
                disabled={submitting}
                onClick={() => handleSubmit(false)}
              >
                {submitting ? "Submitting..." : "Finish Test"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: PALETTE (Sticky on Desktop) */}
      <div className="w-full md:w-80 shrink-0">
        <div className="bg-white shadow-lg rounded-2xl p-6 sticky top-4">
          <h4 className="font-bold text-[#1d4d6a] mb-4 flex items-center gap-2">
            Question Palette
          </h4>
          
          <div className="grid grid-cols-5 gap-2 mb-8">
            {questions.map((q, i) => {
              const qId = q.id;
              const isCurrent = currentPage === Math.ceil((i + 1) / questionsPerPage);
              const isAnswered = !!answers[qId];
              const isMarked = !!markedForReview[qId];
              const isVisited = !!visitedQuestions[qId] || isAnswered;
              
              let bgColor = "bg-gray-100 text-gray-400"; // Not Visited
              let border = "border-transparent";
              
              if (isVisited && !isAnswered && !isMarked) {
                bgColor = "bg-red-50 text-red-500"; // Visited but not answered
                border = "border-red-200";
              } else if (isAnswered && !isMarked) {
                bgColor = "bg-green-500 text-white shadow-sm shadow-green-200"; // Answered
              } else if (isMarked && !isAnswered) {
                bgColor = "bg-purple-500 text-white shadow-sm shadow-purple-200"; // Marked for review
              } else if (isAnswered && isMarked) {
                bgColor = "bg-indigo-600 text-white shadow-sm shadow-indigo-200"; // Answered & Marked
              }
              
              return (
                <button
                  key={qId}
                  onClick={() => goToPage(Math.ceil((i + 1) / questionsPerPage))}
                  className={`w-full aspect-square text-sm font-bold rounded-xl border flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${bgColor} ${border} ${
                    isCurrent ? "ring-2 ring-[#bf2026] ring-offset-2 scale-105" : ""
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="space-y-3 text-xs border-t pt-5">
            <h5 className="font-bold text-gray-400 uppercase tracking-tighter mb-2">Legend</h5>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-green-500 rounded-lg flex items-center justify-center shadow-sm shadow-green-200">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
              <span className="text-gray-600 font-medium">Answered</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-purple-500 rounded-lg flex items-center justify-center shadow-sm shadow-purple-200">
                <Bookmark className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="text-gray-600 font-medium">Marked for Review</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shadow-indigo-200 text-[8px] text-white">AM</div>
              <span className="text-gray-600 font-medium">Answered & Marked</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
                <Circle className="w-3 h-3 text-red-400 fill-red-400" />
              </div>
              <span className="text-gray-600 font-medium">Visited but Unanswered</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-100 rounded-lg flex items-center justify-center">
                <HelpCircle className="w-3 h-3 text-gray-400" />
              </div>
              <span className="text-gray-600 font-medium">Not Visited</span>
            </div>
          </div>

          <Button 
            className="w-full mt-6 bg-[#1d4d6a] text-white"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
          >
            Submit Entire Test
          </Button>
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