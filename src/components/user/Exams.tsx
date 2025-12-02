import React, { useEffect, useState } from "react";
import axios from "axios";
import { Folder } from "lucide-react";

/* -------------------------------------------------------
   TOKEN HANDLING
------------------------------------------------------- */
const getToken = () => {
  try {
    const raw = localStorage.getItem("supabase.auth.token");
    if (raw) {
      const session = JSON.parse(raw);
      return session?.currentSession?.access_token || null;
    }
  } catch {}

  return localStorage.getItem("token") || null;
};

export default function UserStudyResources() {
  const token = getToken();

  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<any | null>(null);
  const [insideSub, setInsideSub] = useState<"notes" | "exam" | null>(null);

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [tab, setTab] = useState<"resources" | "submissions">("resources");

  const [viewPDF, setViewPDF] = useState<string | null>(null);
  const [viewFileURL, setViewFileURL] = useState<string | null>(null);

  const [attendExamId, setAttendExamId] = useState<number | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [answerText, setAnswerText] = useState("");

  const [countdowns, setCountdowns] = useState<Record<number, string>>({});

  /* -------------------------------------------------------
     FETCH FOLDERS
  ------------------------------------------------------- */
  const loadFolders = async () => {
    if (!token) return;

    try {
      const res = await axios.get("http://localhost:5000/api/exams/folders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFolders(
        (res.data.folders || []).map((f: any) => ({
          ...f,
          notes: Array.isArray(f.notes) ? f.notes : [],
          exams: Array.isArray(f.exams) ? f.exams : [],
        }))
      );
    } catch (err) {
      console.error("loadFolders error:", err);
    }
  };

  /* -------------------------------------------------------
     FETCH USER SUBMISSIONS
  ------------------------------------------------------- */
  const loadMySubmissions = async () => {
    if (!token) return;

    try {
      const res = await axios.get(
        "http://localhost:5000/api/exams/submissions/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error("loadMySubmissions error:", err);
    }
  };

  /* -------------------------------------------------------
     INITIAL LOAD
  ------------------------------------------------------- */
  useEffect(() => {
    if (!token) return;
    loadFolders();
    loadMySubmissions();
  }, [token]);

  /* -------------------------------------------------------
     COUNTDOWN REFRESH
  ------------------------------------------------------- */
  useEffect(() => {
    const timer = setInterval(() => {
      const newCountdowns: Record<number, string> = {};

      folders.forEach((folder: any) => {
        (folder.exams || []).forEach((ex: any) => {
          if (!ex.start_time) return;

          const diff = new Date(ex.start_time).getTime() - Date.now();
          if (diff <= 0) return;

          const hrs = Math.floor(diff / 3600000);
          const mins = Math.floor((diff % 3600000) / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          newCountdowns[ex.id] =
            `${hrs.toString().padStart(2, "0")}:` +
            `${mins.toString().padStart(2, "0")}:` +
            `${secs.toString().padStart(2, "0")}`;
        });
      });

      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(timer);
  }, [folders]);

  /* -------------------------------------------------------
     VIEW PDF
  ------------------------------------------------------- */
  const normalizeFileUrl = (item: any) => item?.url || item?.view_url || null;

  const handleViewPDF = (file: string, item: any) => {
    const url = typeof item === "string" ? item : normalizeFileUrl(item);
    if (!url) return alert("File not available");
    setViewPDF(file);
    setViewFileURL(url);
  };

  /* -------------------------------------------------------
     SUBMIT EXAM
  ------------------------------------------------------- */
  const submitExam = async () => {
    if (!attendExamId || !token) return;

    try {
      const form = new FormData();
      if (answerFile) form.append("answer_file", answerFile);
      if (answerText.trim()) form.append("answer_text", answerText);

      await axios.post(
        `http://localhost:5000/api/exams/${attendExamId}/attend`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Exam submitted!");
      setAttendExamId(null);
      setAnswerText("");
      setAnswerFile(null);

      loadMySubmissions();
      loadFolders();
    } catch (err) {
      console.error("Submit exam error:", err);
    }
  };

  /* -------------------------------------------------------
     NAVIGATION
  ------------------------------------------------------- */
  const goBack = () => {
    if (viewPDF) return setViewPDF(null), setViewFileURL(null);
    if (attendExamId) return setAttendExamId(null);
    if (insideSub) return setInsideSub(null);
    setSelectedFolder(null);
  };

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */
  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-4 border-b pb-2">
        <button
          className={`px-4 py-2 ${
            tab === "resources"
              ? "font-semibold border-b-2 border-[#1d4d6a]"
              : ""
          }`}
          onClick={() => setTab("resources")}
        >
          Study Resources
        </button>

        <button
          className={`px-4 py-2 ${
            tab === "submissions"
              ? "font-semibold border-b-2 border-[#1d4d6a]"
              : ""
          }`}
          onClick={() => setTab("submissions")}
        >
          My Submissions
        </button>
      </div>

      {/* =====================================================
          RESOURCES TAB
      ===================================================== */}
      {tab === "resources" && (
        <>
          {/* FOLDER LIST */}
          {!selectedFolder && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-6">
              {folders.map((folder) => (
                <div
                  key={folder.subjectId}
                  onClick={() => {
                    setSelectedFolder(folder);
                    setInsideSub(null);
                  }}
                  className="w-[200px] h-[150px] bg-white rounded-xl flex flex-col items-center justify-center shadow hover:shadow-lg cursor-pointer transition"
                >
                  <Folder className="w-16 h-16 text-[#bf2026] mb-3" />
                  <p className="font-medium text-sm">{folder.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* NOTE/EXAM SELECTION */}
          {selectedFolder && !insideSub && (
            <div>
              <button onClick={goBack} className="px-4 py-2 bg-gray-200 rounded">
                ← Back
              </button>

              <h3 className="text-xl font-semibold mt-4">
                {selectedFolder.label}
              </h3>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div
                  className="bg-white p-6 rounded-xl shadow cursor-pointer flex flex-col items-center justify-center"
                  onClick={() => setInsideSub("notes")}
                >
                  <Folder className="w-12 h-12 text-[#bf2026]" />
                  Notes ({selectedFolder.notes.length})
                </div>

                <div
                  className="bg-white p-6 rounded-xl shadow cursor-pointer flex flex-col items-center justify-center"
                  onClick={() => setInsideSub("exam")}
                >
                  <Folder className="w-12 h-12 text-[#bf2026]" />
                  Exams ({selectedFolder.exams.length})
                </div>
              </div>
            </div>
          )}

          {/* NOTES */}
          {insideSub === "notes" && (
            <div>
              <button onClick={goBack} className="px-4 py-2 bg-gray-200 rounded">
                ← Back
              </button>
              <h3 className="text-xl font-semibold mt-4">Notes</h3>

              <div className="grid grid-cols-2 gap-6 mt-4">
                {selectedFolder.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 bg-gray-100 rounded-xl shadow text-center"
                  >
                    <p className="font-medium">{note.name}</p>
                    <button
                      onClick={() => handleViewPDF(note.name, note)}
                      className="bg-[#bf2026] text-white px-3 py-1 rounded mt-2"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EXAMS */}
          {insideSub === "exam" && (
            <div>
              <button onClick={goBack} className="px-4 py-2 bg-gray-200 rounded">
                ← Back
              </button>
              <h3 className="text-xl font-semibold mt-4">Exams</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
                {selectedFolder.exams.map((ex) => {
                  const countdown = countdowns[ex.id];

                  return (
                    <div
                      key={ex.id}
                      className="bg-white rounded-xl p-5 border shadow  hover:shadow-md"
                    >
                      <p className="font-semibold text-lg text-[#1d4d6a] mb-2">
                        {ex.name}
                      </p>

                      <button
                        className="bg-[#bf2026] text-white px-3 py-1 mr-3 rounded"
                        onClick={() => handleViewPDF(ex.name, ex)}
                      >
                        View PDF
                      </button>

                      {ex.unlocked ? (
                        <button
                          className="mt-2 bg-[#1d4d6a] text-white  px-3 py-1 rounded"
                          onClick={() => setAttendExamId(ex.id)}
                        >
                          Attend Now
                        </button>
                      ) : countdown ? (
                        <p className="text-yellow-600 mt-3 text-sm">
                          ⏳ Unlocks in <b>{countdown}</b>
                        </p>
                      ) : (
                        <p className="text-gray-400 mt-3 text-sm">
                          Not available yet
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUBMIT EXAM PANEL */}
          {attendExamId && (
            <div className="bg-gray-100 p-6 rounded mt-4 shadow">
              <button onClick={goBack} className="px-4 py-2 bg-gray-200 rounded">
                ← Back
              </button>

              <h3 className="text-lg font-semibold mt-4 text-[#bf2026]">
                Submit Your Exam
              </h3>

              <label className="block mt-4">
                <span>Upload Answer PDF</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setAnswerFile(e.target.files?.[0] || null)}
                  className="mt-2"
                />
              </label>

              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={5}
                className="w-full p-3 border rounded mt-4"
                placeholder="Write text answer..."
              />

              <button
                onClick={submitExam}
                className="bg-[#bf2026] text-white px-4 py-2 rounded mt-4"
              >
                Submit Exam
              </button>
            </div>
          )}

          {/* PDF VIEWER */}
          {viewPDF && viewFileURL && (
            <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
              <div className="bg-white w-11/12 md:w-3/4 h-3/4 rounded p-4 relative">
                <button
                  onClick={() => {
                    setViewPDF(null);
                    setViewFileURL(null);
                  }}
                  className="absolute top-3 right-3 bg-gray-200 px-3 py-1 rounded"
                >
                  Close
                </button>

                <h3 className="font-semibold mb-2">{viewPDF}</h3>
                <iframe className="w-full h-full" src={viewFileURL} />
              </div>
            </div>
          )}
        </>
      )}

      {/* =====================================================
          SUBMISSIONS TAB
      ===================================================== */}
      {tab === "submissions" && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-[#1d4d6a]">
            My Exam Results
          </h3>

          {submissions.length === 0 && (
            <p className="text-gray-500">No submissions yet</p>
          )}

          <div className="space-y-4">
            {submissions.map((s) => (
              <div
                key={s.id}
                className="bg-white p-5 rounded-xl border shadow"
              >
                <p className="font-semibold text-lg">Exam #{s.exam_id}</p>
                <p className="text-gray-500 text-sm">
                  Submitted: {new Date(s.submitted_at).toLocaleString()}
                </p>

                {s.score !== null ? (
                  <p className="mt-2 text-green-700 font-bold text-lg">
                    Score: {s.score}
                  </p>
                ) : (
                  <p className="mt-2 text-yellow-600">Awaiting grading…</p>
                )}

                {s.admin_message && (
                  <p className="mt-2 p-2 bg-green-50 border border-green-300 text-green-700 rounded">
                    <b>Feedback:</b> {s.admin_message}
                  </p>
                )}

                <div className="flex gap-3 mt-3">
                  {s.answer_file_url && (
                    <button
                      className="px-4 py-2 bg-[#bf2026] text-white rounded"
                      onClick={() =>
                        handleViewPDF(
                          s.answer_file_name || "Submission",
                          s.answer_file_url
                        )
                      }
                    >
                      View PDF
                    </button>
                  )}

                  {s.answer_text && (
                    <button
                      className="px-4 py-2 bg-[#1d4d6a] text-white rounded"
                      onClick={() => alert(s.answer_text)}
                    >
                      View Text Answer
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* PDF viewer also used here */}
          {viewPDF && viewFileURL && (
            <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
              <div className="bg-white w-11/12 md:w-3/4 h-3/4 rounded p-4 relative">
                <button
                  onClick={() => {
                    setViewPDF(null);
                    setViewFileURL(null);
                  }}
                  className="absolute top-3 right-3 bg-gray-200 px-3 py-1 rounded"
                >
                  Close
                </button>

                <h3 className="font-semibold mb-2">{viewPDF}</h3>
                <iframe className="w-full h-full" src={viewFileURL} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}