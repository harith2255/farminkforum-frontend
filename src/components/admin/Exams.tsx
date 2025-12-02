import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";

import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";

import { Calendar } from "../ui/calendar";
import { format } from "date-fns";

import {
  Upload,
  Folder,
  FileText,
  ArrowLeft,
  Plus,
  Calendar as CalendarIcon,
  Edit2,
  Trash2,
} from "lucide-react";

/* -------------------- DateTimeModal (unchanged logic, small safety) -------------------- */
function DateTimeModal({
  open,
  initial,
  title = "Pick Date & Time",
  onClose,
  onSave,
}: {
  open: boolean;
  initial: Date | null;
  title?: string;
  onClose: () => void;
  onSave: (d: Date | null) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(initial);
  const [time, setTime] = useState<string>(
    initial
      ? `${String(initial.getHours()).padStart(2, "0")}:${String(
          initial.getMinutes()
        ).padStart(2, "0")}`
      : ""
  );

  useEffect(() => {
    setSelectedDate(initial);
    setTime(
      initial
        ? `${String(initial.getHours()).padStart(2, "0")}:${String(
            initial.getMinutes()
          ).padStart(2, "0")}`
        : ""
    );
  }, [initial]);

  const apply = () => {
    if (!selectedDate) {
      onSave(null);
      onClose();
      return;
    }
    const d = new Date(selectedDate);
    if (time) {
      const [hh, mm] = time.split(":").map((v) => Number(v || 0));
      d.setHours(hh, mm, 0, 0);
    }
    onSave(d);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => v || onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Calendar
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={(d) => setSelectedDate(d as Date)}
          />
          <div>
            <Label>Time</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                if (selectedDate) {
                  const d = new Date(selectedDate);
                  const [hh, mm] = e.target.value
                    .split(":")
                    .map((n) => Number(n || 0));
                  d.setHours(hh, mm, 0, 0);
                  setSelectedDate(d);
                }
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={apply}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- TOKEN helper (fallbacks) -------------------- */
export function getStoredToken() {
  // try multiple keys so both admin and user flows work (we saw these in your other file)
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("user_token") ||
    localStorage.getItem("sb-access-token") ||
    null
  );
}

/* -------------------- Main Component (fixed) -------------------- */
export default function AdminExamsPage(): JSX.Element {
  const [folders, setFolders] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [screen, setScreen] = useState<"main" | "subject" | "notes" | "exams">(
    "main"
  );
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);

  const [search, setSearch] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadSubject, setUploadSubject] = useState<string>("");

  const [notePDF, setNotePDF] = useState<File | null>(null);
  const [examPDF, setExamPDF] = useState<File | null>(null);

  const [examStart, setExamStart] = useState<Date | null>(null);
  const [examEnd, setExamEnd] = useState<Date | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewPDF, setViewPDF] = useState<string | null>(null);

  const [editExam, setEditExam] = useState<any | null>(null);

  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [dateModalInitial, setDateModalInitial] = useState<Date | null>(null);
  const [dateModalTitle, setDateModalTitle] = useState<string | undefined>(
    undefined
  );
  const [dateModalOnSave, setDateModalOnSave] = useState<
    (d: Date | null) => void
  >(() => () => {});

  const [loading, setLoading] = useState(false);

  // submissions state + dialog
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);

  // mounted ref to avoid state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---------------------------- Utilities ----------------------------
  const normalizeFolderResponse = useCallback((raw: any[]): any[] => {
    return (raw || []).map((f) => ({
      ...f,
      notes: (f.notes || []).map((n: any) => ({
        ...n,
        // backend may return created_at; normalize to createdAt
        createdAt: n.createdAt || n.created_at || n.submitted_at || null,
        url: n.url ?? n.view_url ?? n.signedUrl ?? null,
        name: n.name ?? n.file_name ?? n.title ?? "Untitled",
      })),
      exams: (f.exams || []).map((e: any) => ({
        ...e,
        createdAt: e.createdAt || e.created_at || null,
        url: e.url ?? e.view_url ?? e.signedUrl ?? null,
        name: e.name ?? e.file_name ?? e.title ?? "Untitled",
      })),
    }));
  }, []);

  const sortFiles = useCallback(
    (files: any[] = []) =>
      files.slice().sort((a, b) => {
        const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return sortOrder === "newest" ? tb - ta : ta - tb;
      }),
    [sortOrder]
  );

  // ---------------------------- Loaders ----------------------------
  const loadSubjects = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      console.warn("No token — aborting loadSubjects()");
      return;
    }

    try {
      const res = await axios.get(
        "https://ebook-backend-lxce.onrender.com/api/admin/exams/subjects",
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );
      if (!mountedRef.current) return;
      setSubjects(res.data.subjects || []);
    } catch (err: any) {
      console.error("loadSubjects error", err?.message || err);
      if (mountedRef.current) setSubjects([]);
    }
  }, []);

  const loadFolders = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      console.warn("No token — aborting loadFolders()");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        "https://ebook-backend-lxce.onrender.com/api/admin/exams/folders",
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000,
        }
      );

      if (!mountedRef.current) return;

      const normalized = normalizeFolderResponse(res.data.folders || []);
      setFolders(normalized);

      // keep selectedSubject in sync if open
      if (selectedSubject) {
        const updated =
          normalized.find((x) => x.id === selectedSubject.id) || null;
        setSelectedSubject(updated);
      }
    } catch (err: any) {
      console.error("loadFolders Error:", err?.message || err);
      if (mountedRef.current) setFolders([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [normalizeFolderResponse, selectedSubject]);

  // single initial load (prevent double-calls / infinite loops)
  useEffect(() => {
    // load once on mount
    const token = getStoredToken();
    if (!token) {
      console.warn("No token found on initial load — waiting for login.");
      return;
    }

    // run both in parallel
    (async () => {
      await Promise.all([loadSubjects(), loadFolders()]);
    })();
    // intentionally empty deps to run only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------- Submissions: fetch + grade ----------------------------
  const fetchSubmissions = useCallback(async (examId: number) => {
    const token = getStoredToken();
    if (!token) {
      console.warn("No token — aborting fetchSubmissions()");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `https://ebook-backend-lxce.onrender.com/api/admin/exams/${examId}/submissions`,
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );

      if (!mountedRef.current) return;

      // attach draft fields for grading UI
      const items = (res.data.submissions || []).map((s: any) => ({
        ...s,
        draftScore: s.score ?? null,
        draftMessage: s.admin_message ?? "",
      }));
      setSubmissions(items);
    } catch (err: any) {
      console.error("Failed to load submissions:", err?.message || err);
      if (mountedRef.current) setSubmissions([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const openSubmissions = async (examId: number) => {
    setSelectedExamId(examId);
    await fetchSubmissions(examId);
    setSubmissionsOpen(true);
  };

  const gradeSubmission = async (submissionId: number) => {
    try {
      const token = getStoredToken();
      if (!token) {
        console.warn("No token — aborting gradeSubmission()");
        return;
      }

      // find local submission to read draft values
      const s = submissions.find((x) => x.id === submissionId);
      if (!s) {
        alert("Submission not found");
        return;
      }

      const payload: any = {
        score: s.draftScore ?? null,
        admin_message: s.draftMessage ?? null,
      };

      await axios.post(
        `https://ebook-backend-lxce.onrender.com/api/admin/exams/submissions/${submissionId}/grade`,
        payload,
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );

      alert("Grade saved");

      // refresh list for current exam
      if (selectedExamId) await fetchSubmissions(selectedExamId);
      // refresh folders so counts / graded_count update
      await loadFolders();
    } catch (err) {
      console.error("Grade submission failed:", err);
      alert("Failed to save grade");
    }
  };

  // ---------------------------- Actions ----------------------------
  const deleteSubject = async () => {
    if (!selectedSubject) return;
    try {
      const token = getStoredToken();
      if (!token) {
        console.warn("No token — aborting deleteSubject()");
        return;
      }

      await axios.delete(
        `https://ebook-backend-lxce.onrender.com/api/admin/exams/subject/${selectedSubject.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );
      setDeleteDialogOpen(false);
      setSelectedSubject(null);
      setScreen("main");
      await loadFolders();
      alert("Subject deleted successfully");
    } catch (err: any) {
      console.error("Delete subject error:", err?.message || err);
      alert(err?.response?.data?.error || "Failed to delete subject");
    }
  };

  const handleUpload = async () => {
    try {
      if (!uploadSubject.trim()) return alert("Enter subject name");

      const label = uploadSubject.trim();
      const value = label.toLowerCase().replace(/\s+/g, "-");
      const token = getStoredToken();
      if (!token) {
        console.warn("No token — aborting handleUpload()");
        return;
      }

      // 1️⃣ Upload Note (if provided). Backend will ensure subject exists
      if (notePDF) {
        const form = new FormData();
        form.append("file", notePDF);
        form.append("label", label);
        form.append("value", value);

        await axios.post(
          "https://ebook-backend-lxce.onrender.com/api/admin/exams/notes/upload",
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              // NOTE: axios will set proper multipart boundary if you omit Content-Type here.
              // Setting Content-Type manually sometimes breaks the boundary.
            },
            timeout: 30000,
          }
        );
      }

      // 2️⃣ Create exam (if provided) and upload file
      let examId: number | null = null;
      if (examPDF) {
        const createRes = await axios.post(
          "https://ebook-backend-lxce.onrender.com/api/admin/exams",
          {
            label,
            value,
            title: examPDF.name,
            description: "Uploaded exam",
            start_time: examStart ? examStart.toISOString() : null,
            end_time: examEnd ? examEnd.toISOString() : null,
          },
          { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
        );

        examId = createRes.data.exam?.id ?? null;

        if (examId) {
          const formExam = new FormData();
          formExam.append("file", examPDF);
          // backend route expects file param and req.params.id (we pass examId above)
          await axios.post(
            `https://ebook-backend-lxce.onrender.com/api/admin/exams/${examId}/upload-file`,
            formExam,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                // omit explicit Content-Type to let browser set multipart boundary
              },
              timeout: 30000,
            }
          );
        }
      }

      // small delay to ensure DB/storage consistency (backend writes)
      await new Promise((r) => setTimeout(r, 1000));

      await loadSubjects();
      await loadFolders();

      setScreen("main");
      setSelectedSubject(null);
      setUploadOpen(false);
      setUploadSubject("");
      setNotePDF(null);
      setExamPDF(null);
      setExamStart(null);
      setExamEnd(null);

      alert("Upload successful");
    } catch (err: any) {
      console.error("UPLOAD FAILED:", err?.message || err, err?.response?.data);
      // show server message if available
      const serverMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed — check console";
      alert(serverMsg);
    }
  };

  const saveEditExam = async () => {
    if (!editExam) return;
    try {
      const token = getStoredToken();
      if (!token) {
        console.warn("No token — aborting saveEditExam()");
        return;
      }

      await axios.put(
        `https://ebook-backend-lxce.onrender.com/api/admin/exams/${editExam.id}`,
        {
          title: editExam.title,
          description: editExam.description,
          start_time: editExam.start_time || null,
          end_time: editExam.end_time || null,
        },
        { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
      );
      setEditExam(null);
      await loadFolders();
      alert("Exam updated");
    } catch (err: any) {
      console.error("Update exam failed", err?.message || err);
      alert(err?.response?.data?.error || "Update failed");
    }
  };

  // ---------------------------- Render ----------------------------
  return (
    <div className="space-y-6 p-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#1d4d6a]">
            Exams & Notes
          </h2>
          <p className="text-sm text-gray-600">{folders.length} subjects</p>
        </div>

        <div className="flex gap-3 items-center">
          <Input
            placeholder="Search subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          <select
            className="border px-3 py-2 rounded-lg"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>

          <Button
            className="bg-[#1d4d6a] text-white"
            onClick={() => setUploadOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Upload
          </Button>
        </div>
      </div>

      {/* main grid */}
      {screen === "main" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
         {folders
  .filter((f) =>
    (f.subject || "").toLowerCase().includes(search.toLowerCase())
  )
  .map((folder) => (
    <Card
      key={folder.id} // <-- FIXED: use folder.id (backend returns id)
      className="cursor-pointer hover:shadow-md"
      onClick={() => {
        setSelectedSubject({
          ...folder,
          notes: folder.notes || [],
          exams: folder.exams || [],
        });
        setScreen("subject");
      }}
    >
      <CardContent className="flex flex-col items-center p-6">
        <Folder className="w-12 h-12 text-[#1d4d6a]" />
        <p className="mt-3 font-medium">{folder.subject}</p>
      </CardContent>
    </Card>
  ))}

        </div>
      )}

      {/* subject view */}
      {screen === "subject" && selectedSubject && (
        <>
          <Button variant="ghost" onClick={() => setScreen("main")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <div className="flex justify-between items-center mt-2">
            <h3 className="text-lg font-semibold text-[#1d4d6a]">
              {selectedSubject.subject}
            </h3>

            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="bg-red-600 text-white"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <Card onClick={() => setScreen("notes")} className="cursor-pointer">
              <CardContent className="flex flex-col items-center p-6">
                <Folder className="w-12 h-12 text-[#1d4d6a]" />
                <div>Notes ({(selectedSubject.notes || []).length})</div>
              </CardContent>
            </Card>

            <Card onClick={() => setScreen("exams")} className="cursor-pointer">
              <CardContent className="flex flex-col items-center p-6">
                <Folder className="w-12 h-12 text-[#1d4d6a]" />
                <div>Exams ({(selectedSubject.exams || []).length})</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* notes list */}
      {screen === "notes" && selectedSubject && (
        <>
          <Button variant="ghost" onClick={() => setScreen("subject")}>
            <ArrowLeft /> Back
          </Button>

          <h3 className="text-lg font-semibold mt-2">
            Notes – {selectedSubject.subject}
          </h3>

          <div className="space-y-3 mt-4">
            {sortFiles(selectedSubject.notes || []).map((n) => (
              <Card key={n.id}>
                <CardContent className="flex justify-between items-center p-4">
                  <div className="flex items-center gap-3">
                    <FileText />
                    {n.name}
                  </div>
                  <Button size="sm" onClick={() => setViewPDF(n.url)}>
                    View
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* exams list */}
      {screen === "exams" && selectedSubject && (
        <>
          <Button variant="ghost" onClick={() => setScreen("subject")}>
            <ArrowLeft /> Back
          </Button>

          <h3 className="text-lg font-semibold mt-2">
            Exams – {selectedSubject.subject}
          </h3>

          <div className="space-y-3 mt-4">
            {sortFiles(selectedSubject.exams || []).map((e) => (
              <Card key={e.id}>
                <CardContent className="flex justify-between items-center p-4">
                  <div>
                    <p className="font-medium">{e.name}</p>

                    <p className="text-xs text-gray-500 mt-1">
                      {e.start_time && (
                        <>
                          Starts: {new Date(e.start_time).toLocaleString()}
                          <br />
                        </>
                      )}
                      {e.end_time && (
                        <>Ends: {new Date(e.end_time).toLocaleString()}</>
                      )}
                    </p>

                    {e.unlocked ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        Unlocked
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                        Upcoming
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setViewPDF(e.url)}>
                      View
                    </Button>

                    <Button size="sm" onClick={() => openSubmissions(e.id)}>
                      Submissions
                    </Button>

                    <Button
                      size="sm"
                      className="bg-blue-600 text-white"
                      onClick={() =>
                        setEditExam({
                          ...e,
                          start_time: e.start_time || null,
                          end_time: e.end_time || null,
                        })
                      }
                    >
                      <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* delete subject dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(v) => v || setDeleteDialogOpen(false)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-700">
            This will permanently delete:
            <br />• All Notes
            <br />• All Exams
            <br />• All Submissions
            <br />• All Files
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="bg-red-600 text-white" onClick={deleteSubject}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* upload modal */}
      <Dialog open={uploadOpen} onOpenChange={(v) => v || setUploadOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Exam / Notes</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Subject Name</Label>
              <Input
                placeholder="e.g. English"
                value={uploadSubject}
                onChange={(e) => setUploadSubject(e.target.value)}
              />
            </div>

            <div>
              <Label>Notes PDF</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setNotePDF(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <Label>Exam PDF</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setExamPDF(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <Label>Exam Start</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDateModalInitial(examStart);
                    setDateModalTitle("Select Exam Start");
                    setDateModalOnSave(() => (d) => setExamStart(d));
                    setDateModalOpen(true);
                  }}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {examStart ? format(examStart, "PPP HH:mm") : "Pick start"}
                </Button>
                {examStart && (
                  <Button variant="ghost" onClick={() => setExamStart(null)}>
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label>Exam End</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDateModalInitial(examEnd);
                    setDateModalTitle("Select Exam End");
                    setDateModalOnSave(() => (d) => setExamEnd(d));
                    setDateModalOpen(true);
                  }}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {examEnd ? format(examEnd, "PPP HH:mm") : "Pick end"}
                </Button>
                {examEnd && (
                  <Button variant="ghost" onClick={() => setExamEnd(null)}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload}>
              <Upload className="w-4 h-4 mr-2" /> Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Date modal (reusable) */}
      <DateTimeModal
        open={dateModalOpen}
        initial={dateModalInitial}
        title={dateModalTitle}
        onClose={() => {
          setDateModalOpen(false);
          setDateModalInitial(null);
          setDateModalTitle(undefined);
        }}
        onSave={(d) => {
          try {
            dateModalOnSave(d);
          } catch (err) {
            console.error("date modal onSave handler error", err);
          }
        }}
      />

      {/* edit exam dialog */}
      {editExam && (
        <Dialog open={true} onOpenChange={() => setEditExam(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Exam</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input
                  value={editExam.title || ""}
                  onChange={(e) =>
                    setEditExam({ ...editExam, title: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={editExam.description || ""}
                  onChange={(e) =>
                    setEditExam({ ...editExam, description: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Start</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDateModalInitial(
                        editExam.start_time
                          ? new Date(editExam.start_time)
                          : null
                      );
                      setDateModalTitle("Select Exam Start");
                      setDateModalOnSave(
                        () => (d) =>
                          setEditExam((prev: any) => ({
                            ...prev,
                            start_time: d ? d.toISOString() : null,
                          }))
                      );
                      setDateModalOpen(true);
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editExam.start_time
                      ? format(new Date(editExam.start_time), "PPP HH:mm")
                      : "Pick start"}
                  </Button>
                  {editExam.start_time && (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setEditExam({ ...editExam, start_time: null })
                      }
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label>End</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDateModalInitial(
                        editExam.end_time ? new Date(editExam.end_time) : null
                      );
                      setDateModalTitle("Select Exam End");
                      setDateModalOnSave(
                        () => (d) =>
                          setEditExam((prev: any) => ({
                            ...prev,
                            end_time: d ? d.toISOString() : null,
                          }))
                      );
                      setDateModalOpen(true);
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editExam.end_time
                      ? format(new Date(editExam.end_time), "PPP HH:mm")
                      : "Pick end"}
                  </Button>
                  {editExam.end_time && (
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setEditExam({ ...editExam, end_time: null })
                      }
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditExam(null)}>
                Cancel
              </Button>
              <Button onClick={async () => await saveEditExam()}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* PDF viewer dialog */}
      {viewPDF && (
        <Dialog open={true} onOpenChange={() => setViewPDF(null)}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <iframe src={viewPDF} className="w-full h-full" title="PDF Viewer" />
          </DialogContent>
        </Dialog>
      )}

      {/* Submissions dialog */}
      {submissionsOpen && (
        <Dialog open={true} onOpenChange={() => setSubmissionsOpen(false)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Submissions</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              {submissions.length === 0 && (
                <p className="text-gray-500">No submissions yet.</p>
              )}

              {submissions.map((s) => (
                <Card key={s.id}>
                  <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 gap-4">
                    <div>
                      <p className="font-medium">
                        {s.users?.email || s.user_email || "Unknown user"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Submitted:{" "}
                        {new Date(
                          s.submitted_at || s.createdAt || Date.now()
                        ).toLocaleString()}
                      </p>
                      {s.score !== null && (
                        <p className="text-green-600 font-semibold">
                          Score: {s.score}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      {s.answer_file_url && (
                        <Button
                          size="sm"
                          onClick={() => setViewPDF(s.answer_file_url)}
                        >
                          View File
                        </Button>
                      )}

                      <Input
                        type="number"
                        min={0}
                        placeholder="Score"
                        value={s.draftScore ?? ""}
                        onChange={(e) => {
                          const v =
                            e.target.value === "" ? null : Number(e.target.value);
                          setSubmissions((prev) =>
                            prev.map((x) => (x.id === s.id ? { ...x, draftScore: v } : x))
                          );
                        }}
                        className="w-24"
                      />

                      <Input
                        placeholder="Message (optional)"
                        value={s.draftMessage ?? ""}
                        onChange={(e) =>
                          setSubmissions((prev) =>
                            prev.map((x) =>
                              x.id === s.id ? { ...x, draftMessage: e.target.value } : x
                            )
                          )
                        }
                        className="max-w-xs"
                      />

                      <Button
                        size="sm"
                        className="bg-blue-600 text-white"
                        onClick={() => gradeSubmission(s.id)}
                      >
                        Save Grade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}