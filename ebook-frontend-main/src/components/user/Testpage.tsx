import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { CheckCircle } from "lucide-react";

const sampleQuestions = [
  {
    id: 1,
    question: "Which language is used for web apps?",
    options: ["Python", "JavaScript", "C++", "Java"],
    answer: "JavaScript",
  },
  {
    id: 2,
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "High Text Machine Language",
      "Hyperlink and Text Markup Language",
      "None of the above",
    ],
    answer: "Hyper Text Markup Language",
  },
  {
    id: 3,
    question: "Which CSS property is used to change text color?",
    options: ["font-color", "text-color", "color", "background-color"],
    answer: "color",
  },
  {
    id: 4,
    question: "Which HTML tag is used to link an external CSS file?",
    options: ["<script>", "<link>", "<style>", "<css>"],
    answer: "<link>",
  },
  {
    id: 5,
    question: "Which company developed the React library?",
    options: ["Google", "Facebook", "Microsoft", "Amazon"],
    answer: "Facebook",
  },
  {
    id: 6,
    question: "What does API stand for?",
    options: [
      "Application Programming Interface",
      "Applied Program Internet",
      "Advanced Programming Interaction",
      "Application Protocol Interface",
    ],
    answer: "Application Programming Interface",
  },
  {
    id: 7,
    question: "Which JavaScript keyword is used to declare a constant?",
    options: ["let", "var", "constant", "const"],
    answer: "const",
  },
  {
    id: 8,
    question: "Which of the following is not a JavaScript framework?",
    options: ["React", "Angular", "Django", "Vue"],
    answer: "Django",
  },
  {
    id: 9,
    question: "What does CSS stand for?",
    options: [
      "Computer Style Sheets",
      "Creative Style System",
      "Cascading Style Sheets",
      "Colorful Style Sheets",
    ],
    answer: "Cascading Style Sheets",
  },
  {
    id: 10,
    question: "Which HTML element is used to display a picture?",
    options: ["<photo>", "<pic>", "<img>", "<image>"],
    answer: "<img>",
  },
];

export default function TestPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const questionsPerPage = 5;
  const totalPages = Math.ceil(sampleQuestions.length / questionsPerPage);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || showResult) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, showResult]);

  const handleAnswer = (id: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [id]: option }));
  };

  const startIndex = (currentPage - 1) * questionsPerPage;
  const currentQuestions = sampleQuestions.slice(
    startIndex,
    startIndex + questionsPerPage
  );

  const handleSubmit = () => {
    let correct = 0;
    sampleQuestions.forEach((q) => {
      if (answers[q.id] === q.answer) correct++;
    });
    setScore(correct);
    setShowResult(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      {/* Timer */}
      <div className="bg-[#1d4d6a] text-white px-6 py-2 rounded-full mb-6 shadow-md text-lg font-semibold">
        ⏰ Time Left: {formatTime(timeLeft)}
      </div>

      {/* Questions */}
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-4xl">
        {currentQuestions.map((q, index) => (
          <div key={q.id} className="mb-6 border-b pb-4">
            <h3 className="font-semibold text-lg text-[#1d4d6a] mb-2">
              {startIndex + index + 1}. {q.question}
            </h3>

            <div className="grid gap-2">
              {q.options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 text-gray-700 hover:text-[#bf2026]"
                >
                  <input
                    type="checkbox"
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

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-6">
          <Button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="bg-gray-300 hover:bg-gray-400 text-black"
          >
            Previous
          </Button>

          {currentPage < totalPages ? (
            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="bg-[#1d4d6a] hover:bg-[#153a4f] text-white"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-[#bf2026] hover:bg-[#a01c22] text-white"
            >
              Submit Test
            </Button>
          )}
        </div>

        <div className="text-center text-gray-500 text-sm mt-4">
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* ✅ Test Completed Popup */}
      {showResult && (
        <div className="fixed inset-0  bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center w-96 animate-fadeIn">
            <CheckCircle className="text-green-500 w-16 h-16 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-[#1d4d6a] mb-2">
              ✅ Test Completed!
            </h2>
            <p className="text-lg text-gray-700 mb-3">
              You scored <b>{score}</b> out of <b>{sampleQuestions.length}</b>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Great job! Keep practicing to improve your skills.
            </p>
            <Button
              onClick={() => window.close()}
              className="bg-[#bf2026] hover:bg-[#a01c22] text-white"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
