import React, { useEffect, useState } from "react";
import axios from "axios";
import { Folder, ArrowLeft, Clock, FileText, Download, Loader2, Play, Lock, Eye, ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { toast } from "sonner";
import PDFJSViewer from "../PDFJSViewer";

/* -------------------------------------------------------
   TOKEN HANDLING
------------------------------------------------------- */
const getToken = () => {
  return localStorage.getItem("token") || null;
};

export default function UserStudyResources({ onNavigate }: { onNavigate: (section: string, id?: any) => void }) {
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
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [answerText, setAnswerText] = useState("");

  const [countdowns, setCountdowns] = useState<Record<number, string>>({});
  
  const [loading, setLoading] = useState({
    folders: true,
    submissions: false,
    submitting: false,
    viewing: false,
    preview: false
  });

  const [showPreview, setShowPreview] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* -------------------------------------------------------
     FETCH FOLDERS
  ------------------------------------------------------- */
  const loadFolders = async () => {
    if (!token) return;

    try {
      setLoading((prev: any) => ({ ...prev, folders: true }));
      const res = await axios.get(`${(import.meta as any).env.VITE_API_URL}/api/exams/folders`, {
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
    } finally {
      setLoading((prev: any) => ({ ...prev, folders: false }));
    }
  };

  /* -------------------------------------------------------
     FETCH USER SUBMISSIONS
  ------------------------------------------------------- */
  const loadMySubmissions = async () => {
    if (!token) return;

    try {
      setLoading((prev: any) => ({ ...prev, submissions: true }));
      const res = await axios.get(
        `${(import.meta as any).env.VITE_API_URL}/api/exams/submissions/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error("loadMySubmissions error:", err);
    } finally {
      setLoading((prev: any) => ({ ...prev, submissions: false }));
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

  const handleViewPDF = async (file: string, item: any) => {
    const url = typeof item === "string" ? item : normalizeFileUrl(item);
    if (!url) return alert("File not available");
    
    setLoading((prev: any) => ({ ...prev, viewing: true }));
    setViewPDF(file);
    setViewFileURL(url);
    
    // Small delay to ensure iframe loads
    setTimeout(() => {
      setLoading((prev: any) => ({ ...prev, viewing: false }));
    }, 500);
  };

  /* -------------------------------------------------------
     PREVIEW & PURCHASE
  ------------------------------------------------------- */
  const handlePreview = async (item: any, type: "study_note" | "exam") => {
    setSelectedItem({ ...item, type });
    setShowPreview(true);
    setCurrentPage(1);
  };

  const buyNow = (item: any, type: "study_note" | "exam") => {
    if (!token) return onNavigate("login");

    const purchaseItem = {
      type,
      id: item.id,
      title: item.name,
      price: item.price,
    };

    localStorage.setItem("purchaseType", type);
    localStorage.setItem("purchaseId", String(item.id));
    localStorage.setItem(
      "purchaseItems",
      JSON.stringify([{ ...purchaseItem, [type === 'study_note' ? 'note' : 'exam']: item }])
    );
    localStorage.setItem("previousSection", "exams");

    onNavigate("purchase", String(item.id));
  };

  /* -------------------------------------------------------
     SUBMIT EXAM
  ------------------------------------------------------- */
  const submitExam = async () => {
    if (!attendExamId || !token) return;

    if (!answerFile && !answerText.trim()) {
      return alert("Please upload a file or write an answer");
    }

    try {
      setLoading((prev: any) => ({ ...prev, submitting: true }));
      const form = new FormData();
      if (answerFile) form.append("answer_file", answerFile);
      if (answerText.trim()) form.append("answer_text", answerText);

      await axios.post(
        `${(import.meta as any).env.VITE_API_URL}/api/exams/${attendExamId}/attend`,
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

      // Refresh data
      await Promise.all([loadMySubmissions(), loadFolders()]);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit exam");
      console.error("Submit exam error:", err);
    } finally {
      setLoading((prev: any) => ({ ...prev, submitting: false }));
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
     RENDER LOADING SPINNER
  ------------------------------------------------------- */
  const renderSpinner = (text: string = "Loading...") => (
    <div className="flex justify-center items-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a] mb-3"></div>
        <p className="text-gray-500">{text}</p>
      </div>
    </div>
  );

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */
  return (
    <div className="space-y-4 p-4 sm:p-0">
      {/* Header */}
      <div>
        <h2 className="text-[#1d4d6a] text-xl sm:text-2xl font-bold mb-1">
          Study Resources
        </h2>
        <p className="text-sm text-gray-500">
          Access notes, exams, and track your submissions
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 sm:gap-4 border-b pb-2 overflow-x-auto">
        <button
          className={`px-3 sm:px-4 py-2 text-sm sm:text-base whitespace-nowrap ${
            tab === "resources"
              ? "font-semibold border-b-2 border-[#1d4d6a] text-[#1d4d6a]"
              : "text-gray-500"
          }`}
          onClick={() => setTab("resources")}
        >
          Study Resources
        </button>

        <button
          className={`px-3 sm:px-4 py-2 text-sm sm:text-base whitespace-nowrap ${
            tab === "submissions"
              ? "font-semibold border-b-2 border-[#1d4d6a] text-[#1d4d6a]"
              : "text-gray-500"
          }`}
          onClick={() => setTab("submissions")}
        >
          My Submissions
          {loading.submissions && (
            <Loader2 className="w-3 h-3 ml-2 inline-block animate-spin" />
          )}
        </button>
      </div>

      {/* =====================================================
          RESOURCES TAB
      ===================================================== */}
      {tab === "resources" && (
        <>
          {/* FOLDER LIST - SHOW LOADING */}
          {!selectedFolder && loading.folders ? (
            renderSpinner("Loading subjects...")
          ) : !selectedFolder ? (
            folders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No subjects available yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-4 sm:mt-6">
                {folders.map((folder: any) => (
                  <div
                    key={folder.subjectId}
                    onClick={() => {
                      setSelectedFolder(folder);
                      setInsideSub(null);
                    }}
                    className="bg-white rounded-xl flex flex-col items-center justify-center p-4 shadow hover:shadow-lg cursor-pointer transition h-32 sm:h-36"
                  >
                    <Folder className="w-10 h-10 sm:w-12 sm:h-12 text-[#bf2026] mb-2 sm:mb-3" />
                    <p className="font-medium text-xs sm:text-sm text-center">
                      {folder.label}
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : null}

          {/* NOTE/EXAM SELECTION */}
          {selectedFolder && !insideSub && (
            <div className="space-y-4">
              <button 
                onClick={goBack} 
                className="px-3 sm:px-4 py-2 bg-gray-100 rounded text-sm sm:text-base flex items-center gap-2 hover:bg-gray-200 transition"
                disabled={loading.folders}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Subjects
              </button>

              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#1d4d6a]">
                  {selectedFolder.label}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Choose what you want to access
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div
                  className="bg-white p-4 sm:p-6 rounded-xl shadow cursor-pointer hover:shadow-md transition flex flex-col items-center justify-center"
                  onClick={() => setInsideSub("notes")}
                >
                  <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-[#bf2026] mb-3" />
                  <span className="font-medium text-sm sm:text-base">Notes</span>
                  <span className="text-xs sm:text-sm text-gray-500 mt-1">
                    ({selectedFolder.notes.length} files)
                  </span>
                </div>

                <div
                  className="bg-white p-4 sm:p-6 rounded-xl shadow cursor-pointer hover:shadow-md transition flex flex-col items-center justify-center"
                  onClick={() => setInsideSub("exam")}
                >
                  <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-[#bf2026] mb-3" />
                  <span className="font-medium text-sm sm:text-base">Exams</span>
                  <span className="text-xs sm:text-sm text-gray-500 mt-1">
                    ({selectedFolder.exams.length} exams)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* NOTES */}
          {insideSub === "notes" && (
            <div className="space-y-4">
              <button 
                onClick={goBack} 
                className="px-3 sm:px-4 py-2 bg-gray-100 rounded text-sm sm:text-base flex items-center gap-2 hover:bg-gray-200 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Options
              </button>
              
              <h3 className="text-lg sm:text-xl font-semibold text-[#1d4d6a]">
                Notes - {selectedFolder.label}
              </h3>

              {selectedFolder.notes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No notes available for this subject.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {selectedFolder.notes.map((note: any) => (
                    <div
                      key={note.id}
                      className="p-4 bg-white rounded-xl shadow hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm sm:text-base line-clamp-2">
                            {note.name}
                          </p>
                          {note.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {note.description}
                            </p>
                          )}
                        </div>
                        <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {note.isPurchased ? (
                          <button
                            onClick={() => handleViewPDF(note.name, note)}
                            disabled={loading.viewing}
                            className="bg-green-600 text-white px-3 py-1.5 rounded text-xs sm:text-sm flex-1 hover:bg-green-700 transition flex items-center justify-center gap-2"
                          >
                            {loading.viewing ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              "View Note"
                            )}
                          </button>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-xs"
                              onClick={() => handlePreview(note, "study_note")}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              className="bg-[#bf2026] text-white hover:bg-[#a01c22] flex-1 text-xs"
                              onClick={() => buyNow(note, "study_note")}
                            >
                              Buy ₹{note.price}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}          {/* EXAMS */}
          {insideSub === "exam" && (
            <div className="space-y-4">
              <button 
                onClick={goBack} 
                className="px-3 sm:px-4 py-2 bg-gray-100 rounded text-sm sm:text-base flex items-center gap-2 hover:bg-gray-200 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Options
              </button>
              
              <h3 className="text-lg sm:text-xl font-semibold text-[#1d4d6a]">
                Exams - {selectedFolder.label}
              </h3>

              {selectedFolder.exams.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No exams available for this subject.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {selectedFolder.exams.map((ex: any) => {
                    const countdown = countdowns[ex.id];

                    return (
                      <div
                        key={ex.id}
                        className="bg-white rounded-xl p-4 border shadow hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <p className="font-semibold text-[#1d4d6a] text-sm sm:text-base line-clamp-2">
                            {ex.name}
                          </p>
                          {ex.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {ex.description}
                            </p>
                          )}
                          {ex.duration && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {ex.duration} min
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          {ex.isPurchased ? (
                            <>
                              <button
                                className="bg-green-600 text-white px-3 py-1.5 rounded text-xs sm:text-sm flex-1 hover:bg-green-700 transition flex items-center justify-center gap-1"
                                onClick={() => handleViewPDF(ex.name, ex)}
                                disabled={loading.viewing}
                              >
                                {loading.viewing ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  "View PDF"
                                )}
                              </button>
                              <button
                                onClick={() => setAttendExamId(ex.id)}
                                disabled={!ex.unlocked}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded font-bold transition-all text-sm ${
                                  ex.unlocked
                                    ? "bg-[#bf2026] text-white hover:bg-[#a51c22] shadow-sm"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                              >
                                {ex.unlocked ? (
                                  <>
                                    <Play className="w-4 h-4 fill-current" />
                                    Attend
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-4 h-4" />
                                    Locked
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <div className="flex gap-2 w-full">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs"
                                onClick={() => handlePreview(ex, "exam")}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Preview
                              </Button>
                              <Button
                                size="sm"
                                className="bg-[#bf2026] text-white hover:bg-[#a01c22] flex-1 text-xs"
                                onClick={() => buyNow(ex, "exam")}
                              >
                                Buy ₹{ex.price}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SUBMIT EXAM PANEL */}
          {attendExamId && (
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg shadow mt-4">
              <button 
                onClick={goBack} 
                className="px-3 sm:px-4 py-2 bg-gray-200 rounded text-sm sm:text-base flex items-center gap-2 mb-4 hover:bg-gray-300 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Exams
              </button>

              <h3 className="text-lg sm:text-xl font-semibold text-[#bf2026]">
                Submit Your Exam
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Upload your answer or write it below
              </p>

              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-medium">
                    Upload Answer PDF
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setAnswerFile(e.target.files?.[0] || null)}
                    className="w-full text-sm sm:text-base p-2 border rounded"
                    disabled={loading.submitting}
                  />
                  {answerFile && (
                    <p className="text-green-600 text-sm">
                      Selected: {answerFile.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm sm:text-base font-medium">
                    Or Write Text Answer
                  </label>
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    rows={4}
                    className="w-full p-3 border rounded text-sm sm:text-base"
                    placeholder="Type your answer here..."
                    disabled={loading.submitting}
                  />
                </div>

                <button
                  onClick={submitExam}
                  disabled={loading.submitting}
                  className="bg-[#bf2026] text-white px-4 py-2.5 rounded text-sm sm:text-base font-medium w-full sm:w-auto hover:bg-[#a51c22] transition flex items-center justify-center gap-2"
                >
                  {loading.submitting ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    "Submit Exam"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PDF VIEWER */}
          {viewPDF && viewFileURL && (
            <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
              <div className="bg-white w-full max-w-4xl h-full max-h-[90vh] rounded-lg p-4 relative">
                <button
                  onClick={() => {
                    setViewPDF(null);
                    setViewFileURL(null);
                  }}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded text-sm z-10"
                >
                  Close
                </button>

                <h3 className="font-semibold text-lg sm:text-xl mb-3 pr-16 line-clamp-1">
                  {viewPDF}
                </h3>
                {loading.viewing ? (
                  <div className="h-[calc(100%-4rem)] flex items-center justify-center">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a] mb-3"></div>
                      <p className="text-gray-500">Loading document...</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-[calc(100%-4rem)]">
                    <iframe 
                      className="w-full h-full border-0" 
                      src={viewFileURL}
                      title={viewPDF}
                      onLoad={() => setLoading((prev: any) => ({ ...prev, viewing: false }))}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* =====================================================
          SUBMISSIONS TAB
      ===================================================== */}
      {tab === "submissions" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-[#1d4d6a]">
              My Exam Results
            </h3>
            <p className="text-sm text-gray-500">
              View all your submitted exams and scores
            </p>
          </div>

          {loading.submissions ? (
            renderSpinner("Loading submissions...")
          ) : submissions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No submissions yet. Submit an exam to see results here.
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {submissions.map((s: any) => (
                <div
                  key={s.id}
                  className="bg-white p-4 sm:p-5 rounded-xl border shadow hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold text-[#1d4d6a] text-base sm:text-lg">
                        Exam #{s.exam_id}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Submitted: {new Date(s.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    
                    {s.score !== null ? (
                      <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg">
                        <p className="font-bold text-base sm:text-lg">
                          Score: {s.score}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-lg">
                        <p className="text-sm sm:text-base">Awaiting grading</p>
                      </div>
                    )}
                  </div>

                  {s.admin_message && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                      <p className="text-green-700 text-sm sm:text-base">
                        <span className="font-semibold">Feedback:</span> {s.admin_message}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {s.answer_file_url && (
                      <button
                        className="px-3 py-1.5 bg-[#bf2026] text-white rounded text-xs sm:text-sm flex items-center gap-1 hover:bg-[#a51c22] transition"
                        onClick={() =>
                          handleViewPDF(
                            s.answer_file_name || "Submission",
                            s.answer_file_url
                          )
                        }
                        disabled={loading.viewing}
                      >
                        {loading.viewing ? (
                          <>
                            <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                            View PDF
                          </>
                        )}
                      </button>
                    )}

                    {s.answer_text && (
                      <button
                        className="px-3 py-1.5 bg-[#1d4d6a] text-white rounded text-xs sm:text-sm hover:bg-[#163d55] transition"
                        onClick={() => alert(s.answer_text)}
                      >
                        View Text Answer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PDF viewer also used here */}
          {viewPDF && viewFileURL && (
            <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
              <div className="bg-white w-full max-w-4xl h-full max-h-[90vh] rounded-lg p-4 relative">
                <button
                  onClick={() => {
                    setViewPDF(null);
                    setViewFileURL(null);
                  }}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded text-sm z-10"
                >
                  Close
                </button>

                <h3 className="font-semibold text-lg sm:text-xl mb-3 pr-16 line-clamp-1">
                  {viewPDF}
                </h3>
                {loading.viewing ? (
                  <div className="h-[calc(100%-4rem)] flex items-center justify-center">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a] mb-3"></div>
                      <p className="text-gray-500">Loading document...</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-[calc(100%-4rem)]">
                    <iframe 
                      className="w-full h-full border-0" 
                      src={viewFileURL || undefined}
                      title={viewPDF || undefined}
                      onLoad={() => setLoading((prev: any) => ({ ...prev, viewing: false }))}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          PREVIEW MODAL
      ===================================================== */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#1d4d6a] text-lg sm:text-xl font-bold">
              Preview: {selectedItem?.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Viewing sample pages. Purchase to access full content.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 border rounded-lg bg-white h-[60vh] overflow-auto">
            {selectedItem?.id && (
              <>
                <PDFJSViewer
                  url={`${(import.meta as any).env.VITE_API_URL}/api/exams/${selectedItem.type === 'study_note' ? 'notes/' : ''}${selectedItem.id}/preview-stream`}
                  page={currentPage}
                  scale={1.1}
                  purchased={false}
                  isLocked={true}
                  previewPages={2}
                  bookId={selectedItem.id}
                  onBuyClick={() => buyNow(selectedItem, selectedItem.type)}
                  onTotalPages={setTotalPages}
                  onPageChange={setCurrentPage}
                />

                {/* PAGINATION */}
                <div className="flex items-center justify-between mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>

                  <p className="text-sm text-gray-500 font-medium">
                    Page {currentPage} / {totalPages}
                  </p>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= totalPages || currentPage >= 2}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t pt-4">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button
              className="bg-[#bf2026] text-white hover:bg-[#a01c22] px-6 shadow-md"
              onClick={() => buyNow(selectedItem, selectedItem.type)}
            >
              Buy Now ₹{selectedItem?.price}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}