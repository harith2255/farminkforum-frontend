import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Upload, Edit, Trash2, ImageIcon, Plus, X } from "lucide-react";

type Book = any;
type Note = any;
type Test = any;

const API = import.meta.env.VITE_API_BASE || "https://ebook-backend-lxce.onrender.com/api";


function getAuthHeaders() {
  const token = localStorage.getItem("token");  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function ContentManagementGrid() {
  const [books, setBooks] = useState<Book[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);



const [mcqs, setMcqs] = useState([
  { question: "", options: ["", "", "", ""], answer: "" }
]);

const [mcqPage, setMcqPage] = useState(0);

const addQuestion = () => {
  setMcqs([...mcqs, { question: "", options: ["", "", "", ""], answer: "" }]);
  setMcqPage(mcqs.length);
};

const removeQuestion = (index: number) => {
  const updated = [...mcqs];
  updated.splice(index, 1);
  setMcqs(updated);
  setMcqPage(Math.max(0, index - 1));
};

const updateQuestion = (index: number, field: string, value: string) => {
  const updated = [...mcqs];
  updated[index][field] = value;
  setMcqs(updated);
};

const updateOption = (qIndex: number, optionIndex: number, value: string) => {
  const updated = [...mcqs];
  updated[qIndex].options[optionIndex] = value;
  setMcqs(updated);
};




  // Upload dialogs
  const [showUploadBook, setShowUploadBook] = useState(false);
  const [showUploadNote, setShowUploadNote] = useState(false);
  const [showUploadTest, setShowUploadTest] = useState(false);

  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editType, setEditType] = useState<"book" | "note" | "test" | null>(null);

  // Forms
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    category: "Agriculture",
    price: "",
    description: "",
    tags: "",
    file: null as File | null,
    cover: null as File | null, // cover image
  });

  const [noteForm, setNoteForm] = useState({
    title: "",
    author: "",
    category: "Agriculture",
    price: "",
    description: "",
    file: null as File | null,
  });

  const [testForm, setTestForm] = useState({
    title: "",
    subject: "Agriculture",
    difficulty: "Easy",
    total_questions: "",
    duration_minutes: "",
    scheduled_date: "",
    description: "",
    file: null as File | null,
  });

  const [uploading, setUploading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: "book" | "note" | "test" } | null>(null);


  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function fetchContent() {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const [booksRes, notesRes, testsRes] = await Promise.all([
        axios.get(`${API}/admin/content?type=books`, { headers }),
        axios.get(`${API}/admin/content?type=notes`, { headers }),
        axios.get(`${API}/admin/content?type=tests`, { headers }),
      ]);

      setBooks(booksRes.data?.contents || []);
      setNotes(notesRes.data?.contents || []);
      setTests(testsRes.data?.contents || []);
    } catch (err) {
      console.error("fetchContent error", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContent();
  }, []);

  const handleDelete = async () => {
  if (!deleteTarget) return;
console.log("Deleting:", deleteTarget);

  const { id, type } = deleteTarget;

  const typeMap: Record<string, string> = {
    book: "book",
    note: "note",
    test: "test",
  };

  const mappedType = typeMap[type];

  try {
    const token = localStorage.getItem("token");
    await axios.delete(`${API}/admin/content/${mappedType}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
console.log("🔥 Sending DELETE:", `${API}/admin/content/${mappedType}/${id}`);

    setDeleteModalOpen(false);
    setDeleteTarget(null);
    fetchContent();

  } catch (err) {
    console.error("Delete error:", err);
    alert("Delete failed");
  }
};
const handleEditSave = async () => {
  if (!editItem || !editType) return;

  try {
    setEditSaving(true);

    const formData = new FormData();
    formData.append("title", editItem.title || "");
    formData.append("description", editItem.description || "");
    formData.append("category", editItem.category || "Agriculture");
    formData.append("price", editItem.price || "0");

    if (editItem.tags) {
      formData.append(
        "tags",
        Array.isArray(editItem.tags) ? editItem.tags.join(",") : editItem.tags
      );
    }

    // For test type only
    if (editType === "test") {
      formData.append("subject", editItem.subject);
      formData.append("difficulty", editItem.difficulty);
      formData.append("total_questions", editItem.total_questions);
      formData.append("duration_minutes", editItem.duration_minutes);
      if (editItem.scheduled_date) {
        formData.append("scheduled_date", editItem.scheduled_date);
      }
    }

    // Replace file if changed
    if (editItem.newFile) {
      formData.append("file", editItem.newFile);
    }

    const headers = {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    };

    await axios.put(
      `${API}/admin/content/${editType}/${editItem.id}`,
      formData,
      { headers }
    );

    alert("Updated successfully!");
    setShowEditDialog(false);
    fetchContent();
  } catch (err) {
    console.error("Edit error:", err);
    alert("Failed to update.");
  } finally {
    setEditSaving(false);
  }
};


  // ---------- Upload Handlers ----------
  const uploadBook = async () => {
    if (!bookForm.title || !bookForm.author || !bookForm.file) {
      return alert("Please fill title, author and upload a file.");
    }

    try {
      setUploading(true);
      const data = new FormData();
      data.append("type", "E-Book");
      data.append("title", bookForm.title);
      data.append("author", bookForm.author);
      data.append("category", bookForm.category);
      data.append("price", bookForm.price || "0");
      data.append("description", bookForm.description || "");
      data.append("tags", bookForm.tags || "");
      data.append("file", bookForm.file as Blob);
      // optional cover image
      if (bookForm.cover) data.append("cover", bookForm.cover as Blob);

      const headers = { ...getAuthHeaders() };

      await axios.post(`${API}/admin/content/upload`, data, { headers });

      alert("✅ E-Book uploaded successfully!");
      setShowUploadBook(false);
      setBookForm({ title: "", author: "", category: "Agriculture", price: "", description: "", tags: "", file: null, cover: null });
      fetchContent();
    } catch (err: any) {
      console.error("uploadBook error", err);
      alert(err?.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const uploadNote = async () => {
    if (!noteForm.title || !noteForm.author || !noteForm.file) {
      return alert("Please fill title, author and upload a file.");
    }

    try {
      setUploading(true);
      const data = new FormData();
      data.append("type", "Notes");
      data.append("title", noteForm.title);
      data.append("author", noteForm.author);
      data.append("category", noteForm.category);
      data.append("price", noteForm.price || "0");
      data.append("description", noteForm.description || "");
      data.append("file", noteForm.file as Blob);

      const headers = { ...getAuthHeaders(), "Content-Type": "multipart/form-data" };
      await axios.post(`${API}/admin/content/upload`, data, { headers });

      alert("✅ Note uploaded successfully!");
      setShowUploadNote(false);
      setNoteForm({ title: "", author: "", category: "Agriculture", price: "", description: "", file: null });
      fetchContent();
    } catch (err: any) {
      console.error("uploadNote error", err);
      alert(err?.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const uploadTest = async () => {
 if (!testForm.title || !testForm.total_questions || !testForm.duration_minutes) {
  return alert("Please fill title, total questions and duration.");
}

    try {
      setUploading(true);
      const data = new FormData();
      data.append("type", "Mock Test");
      data.append("title", testForm.title);
      data.append("subject", testForm.subject || "Agriculture");
      data.append("difficulty", testForm.difficulty || "Easy");
      data.append("total_questions", testForm.total_questions || "0");
      data.append("duration_minutes", testForm.duration_minutes || "0");
      if (testForm.scheduled_date) data.append("scheduled_date", new Date(testForm.scheduled_date).toISOString());
      data.append("description", testForm.description || "");
      data.append("file", testForm.file as Blob);
      data.append("mcqs", JSON.stringify(mcqs));


      const headers = { ...getAuthHeaders(), "Content-Type": "multipart/form-data" };
      await axios.post(`${API}/admin/content/upload`, data, { headers });

      alert("✅ Mock test uploaded successfully!");
      setShowUploadTest(false);
      setTestForm({ title: "", subject: "Agriculture", difficulty: "Easy", total_questions: "", duration_minutes: "", scheduled_date: "", description: "", file: null });
      fetchContent();
    } catch (err: any) {
      console.error("uploadTest error", err);
      alert(err?.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const openEditModal = (item: any, type: "book" | "note" | "test") => {
  setEditItem(item);
  setEditType(type);
  setShowEditDialog(true);
};



  // ---------- Helpers ----------
  const renderCover = (item: any, fallbackText = "No Cover") => {
    const url = item?.cover_url || item?.file_url ;
    if (url) return (
      <img src={url} alt={item.title} className="w-full h-44 object-cover rounded-t-md" />
    );

    return (
      <div className="w-full h-44 bg-gray-100 flex items-center justify-center rounded-t-md">
        <ImageIcon className="w-8 h-8 text-gray-400" />      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1d4d6a] mb-1 text-xl font-semibold">Content Management — Grid</h2>
          <p className="text-sm text-gray-500">Upload and manage E-Books, Notes and Mock Tests</p>
        </div>

        <div className="flex gap-2">
          <Button className="bg-[#1d4d6a] text-white" onClick={() => setShowUploadBook(true)}>
            <Plus className="w-4 h-4 mr-2" /> Upload E-Book
          </Button>
          <Button className="bg-[#bf2026] text-white" onClick={() => setShowUploadNote(true)}>
            <Upload className="w-4 h-4 mr-2" /> Upload Notes
          </Button>
          <Button className="bg-[#153a4f] text-white" onClick={() => setShowUploadTest(true)}>
            <Upload className="w-4 h-4 mr-2" /> Upload Mock Test
          </Button>
        </div>
      </div>

      <Tabs defaultValue="books">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="books">E-Books</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="tests">Mock Tests</TabsTrigger>
        </TabsList>

        {/* BOOKS GRID */}
        <TabsContent value="books">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
            {books.map((book) => (
              <Card key={book.id} className="overflow-hidden shadow-sm">
                {renderCover(book)}
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#1d4d6a]">{book.title}</h3>
                      <p className="text-xs text-gray-500">{book.author}</p>
                      <p className="text-xs text-gray-400 mt-1">{book.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{book.price ? `₹${book.price}` : "Free"}</div>
                      <Badge className="mt-2">{book.pages ? `${book.pages} pages` : "—"}</Badge>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(book, "book") }>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => {
  setDeleteTarget({ id: book.id, type: "book" });
  setDeleteModalOpen(true);
}}
>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {book.file_url && (
                      <a href={book.file_url} target="_blank" rel="noreferrer" className="ml-auto text-sm text-blue-600 underline">View</a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* NOTES GRID */}
        <TabsContent value="notes">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
            {notes.map((note) => (
              <Card key={note.id} className="overflow-hidden shadow-sm">
                {renderCover(note)}
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#1d4d6a]">{note.title}</h3>
                      <p className="text-xs text-gray-500">{note.author}</p>
                      <p className="text-xs text-gray-400 mt-1">{note.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{note.price ? `₹${note.price}` : "Free"}</div>
                      <Badge className="mt-2">{note.pages ? `${note.pages} pages` : "—"}</Badge>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(note, "note") }>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => {
  setDeleteTarget({ id: note.id, type: "note" });
  setDeleteModalOpen(true);
}}
>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {note.file_url && (
                      <a href={note.file_url} target="_blank" rel="noreferrer" className="ml-auto text-sm text-blue-600 underline">Download</a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TESTS GRID */}
        <TabsContent value="tests">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
            {tests.map((t) => (
              <Card key={t.id} className="overflow-hidden shadow-sm">
                {renderCover(t)}
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#1d4d6a]">{t.title}</h3>
                      <p className="text-xs text-gray-500">{t.subject}</p>
                      <p className="text-xs text-gray-400 mt-1">{t.difficulty} • {t.total_questions} Qs</p>
                    </div>
                    <div className="text-right">
                      <Badge>{t.attempts?.[0]?.count ?? 0} participants</Badge>

                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => {
  setDeleteTarget({ id: t.id, type: "test" });
  setDeleteModalOpen(true);
}}
>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {t.file_url && (
                      <a href={t.file_url} target="_blank" rel="noreferrer" className="ml-auto text-sm text-blue-600 underline">Download</a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
  <DialogContent className="max-w-sm">
    <DialogHeader>
      <DialogTitle>Delete Content</DialogTitle>
    </DialogHeader>

    <p className="text-sm text-gray-600">
      Are you sure you want to delete this item? This action cannot be undone.
    </p>

    <div className="mt-4 flex justify-end gap-3">
      <Button
        variant="outline"
        onClick={() => setDeleteModalOpen(false)}
      >
        Cancel
      </Button>

      <Button
        className="bg-red-600 hover:bg-red-700 text-white"
        onClick={handleDelete}
      >
        Delete
      </Button>
    </div>
  </DialogContent>
</Dialog>


      {/* UPLOAD DIALOGS (BOOK / NOTE / TEST) */}
      <Dialog open={showUploadBook} onOpenChange={setShowUploadBook}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload E-Book</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-4">
            <div>
              <Label>Title</Label>
              <Input value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} />
            </div>

            <div>
              <Label>Author</Label>
              <Input value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} />
            </div>

            <div>
              <Label>Category</Label>
              <select value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })} className="w-full border p-2 rounded">
                <option>Agriculture</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price</Label>
                <Input value={bookForm.price} onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })} />
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input value={bookForm.tags} onChange={(e) => setBookForm({ ...bookForm, tags: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={bookForm.description} onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Upload File (PDF / EPUB)</Label>
                <input type="file" accept=".pdf,.epub" onChange={(e: any) => setBookForm({ ...bookForm, file: e.target.files?.[0] ?? null })} />
              </div>

              <div>
                <Label>Cover Image (optional)</Label>
                <input type="file" accept="image/*" onChange={(e: any) => setBookForm({ ...bookForm, cover: e.target.files?.[0] ?? null })} />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowUploadBook(false)}>Cancel</Button>
              <Button className="bg-[#bf2026] text-white flex-1" onClick={uploadBook} disabled={uploading}>{uploading ? "Uploading..." : "Upload E-Book"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadNote} onOpenChange={setShowUploadNote}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Notes</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-4">
            <div>
              <Label>Title</Label>
              <Input value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} />
            </div>

            <div>
              <Label>Author</Label>
              <Input value={noteForm.author} onChange={(e) => setNoteForm({ ...noteForm, author: e.target.value })} />
            </div>

            <div>
              <Label>Category</Label>
              <select value={noteForm.category} onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })} className="w-full border p-2 rounded">
                <option>Agriculture</option>
              </select>
            </div>

            <div>
              <Label>Price</Label>
              <Input value={noteForm.price} onChange={(e) => setNoteForm({ ...noteForm, price: e.target.value })} />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={noteForm.description} onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })} />
            </div>

            <div>
              <Label>Upload File (PDF)</Label>
              <input type="file" accept=".pdf" onChange={(e: any) => setNoteForm({ ...noteForm, file: e.target.files?.[0] ?? null })} />
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowUploadNote(false)}>Cancel</Button>
              <Button className="bg-[#bf2026] text-white flex-1" onClick={uploadNote} disabled={uploading}>{uploading ? "Uploading..." : "Upload Notes"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadTest} onOpenChange={setShowUploadTest}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Mock Test</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-4">
            <div>
              <Label>Title</Label>
              <Input value={testForm.title} onChange={(e) => setTestForm({ ...testForm, title: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subject</Label>
                <select value={testForm.subject} onChange={(e) => setTestForm({ ...testForm, subject: e.target.value })} className="w-full border p-2 rounded">
                  <option>Agriculture</option>
                </select>
              </div>

              <div>
                <Label>Difficulty</Label>
                <select value={testForm.difficulty} onChange={(e) => setTestForm({ ...testForm, difficulty: e.target.value })} className="w-full border p-2 rounded">
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Questions</Label>
                <Input type="number" value={testForm.total_questions} onChange={(e) => setTestForm({ ...testForm, total_questions: e.target.value })} />
              </div>

              <div>
                <Label>Duration (minutes)</Label>
                <Input type="number" value={testForm.duration_minutes} onChange={(e) => setTestForm({ ...testForm, duration_minutes: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Scheduled Date</Label>
              <Input type="datetime-local" value={testForm.scheduled_date} onChange={(e) => setTestForm({ ...testForm, scheduled_date: e.target.value })} />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={testForm.description} onChange={(e) => setTestForm({ ...testForm, description: e.target.value })} />
            </div>

            {/* MCQ SECTION WITH PAGINATION */}
            <div className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold">MCQ Section</h2>
                  <p className="text-sm text-gray-500">Add multiple choice questions for the test</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addQuestion}
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </Button>
                </div>
              </div>

              {mcqs.length > 0 && (
                <div className="space-y-4">
                  {/* Question Header with Remove Button */}
                  <div className="flex justify-between items-center">
                    <Label className="text-base">Question {mcqPage + 1}</Label>
                    {mcqs.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => removeQuestion(mcqPage)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove Question
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label>Question Text</Label>
                    <Textarea
                      value={mcqs[mcqPage].question}
                      onChange={(e) => updateQuestion(mcqPage, "question", e.target.value)}
                      placeholder="Enter question"
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {mcqs[mcqPage].options.map((opt, i) => (
                      <div key={i} className="relative">
                        <Label>Option {i + 1}</Label>
                        <Input
                          value={opt}
                          onChange={(e) => updateOption(mcqPage, i, e.target.value)}
                          placeholder={`Option ${i + 1}`}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label>Correct Answer</Label>
                    <Input
                      value={mcqs[mcqPage].answer}
                      onChange={(e) => updateQuestion(mcqPage, "answer", e.target.value)}
                      placeholder="Enter correct answer (must match one of the options)"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  disabled={mcqPage === 0}
                  onClick={() => setMcqPage(mcqPage - 1)}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Question {mcqPage + 1} of {mcqs.length}
                  </span>
                </div>

                <Button
                  variant="outline"
                  disabled={mcqPage === mcqs.length - 1}
                  onClick={() => setMcqPage(mcqPage + 1)}
                >
                  Next
                </Button>
              </div>

              {/* Questions Summary */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Questions Summary:</h4>
                <div className="flex flex-wrap gap-1">
                  {mcqs.map((mcq, index) => (
                    <Badge
                      key={index}
                      variant={index === mcqPage ? "default" : "outline"}
                      className={`cursor-pointer ${index === mcqPage
                        ? "bg-[#1d4d6a] text-white"
                        : mcq.question ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                        }`}
                      onClick={() => setMcqPage(index)}
                    >
                      Q{index + 1}
                      {mcq.question && " ✓"}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>


            {/* <div>
              <Label>Upload File (PDF / DOCX)</Label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e: any) => setTestForm({ ...testForm, file: e.target.files?.[0] ?? null })} />
            </div> */}

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowUploadTest(false)}>Cancel</Button>
              <Button className="bg-[#bf2026] text-white flex-1" onClick={uploadTest} disabled={uploading}>{uploading ? "Uploading..." : "Upload Mock Test"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
          </DialogHeader>

          {editItem ? (
            <div className="space-y-4 p-4">
              <div>
                <Label>Title</Label>
                <Input value={editItem.title || ""} onChange={(e) => setEditItem({ ...editItem, title: e.target.value })} />
              </div>

              {editType !== "test" ? (
                <>
                  <div>
                    <Label>Author</Label>
                    <Input value={editItem.author || ""} onChange={(e) => setEditItem({ ...editItem, author: e.target.value })} />
                  </div>

                  <div>
                    <Label>Category</Label>
                    <select value={editItem.category || "Agriculture"} onChange={(e) => setEditItem({ ...editItem, category: e.target.value })} className="w-full border p-2 rounded">
                      <option>Agriculture</option>
                    </select>
                  </div>

                  <div>
                    <Label>Price</Label>
                    <Input value={editItem.price || ""} onChange={(e) => setEditItem({ ...editItem, price: e.target.value })} />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea value={editItem.description || ""} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} />
                  </div>

                  <div>
                    <Label>Tags (comma separated)</Label>
                    <Input value={Array.isArray(editItem.tags) ? editItem.tags.join(",") : (editItem.tags || "")} onChange={(e) => setEditItem({ ...editItem, tags: e.target.value })} />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Subject</Label>
                    <select value={editItem.subject || "Agriculture"} onChange={(e) => setEditItem({ ...editItem, subject: e.target.value })} className="w-full border p-2 rounded">
                      <option>Agriculture</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Difficulty</Label>
                      <select value={editItem.difficulty || "Easy"} onChange={(e) => setEditItem({ ...editItem, difficulty: e.target.value })} className="w-full border p-2 rounded">
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </select>
                    </div>

                    <div>
                      <Label>Total Questions</Label>
                      <Input type="number" value={editItem.total_questions || ""} onChange={(e) => setEditItem({ ...editItem, total_questions: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Duration (minutes)</Label>
                      <Input type="number" value={editItem.duration_minutes || ""} onChange={(e) => setEditItem({ ...editItem, duration_minutes: e.target.value })} />
                    </div>

                    <div>
                      <Label>Scheduled Date</Label>
                      <Input type="datetime-local" value={editItem.scheduled_date ? new Date(editItem.scheduled_date).toISOString().slice(0,16) : ""} onChange={(e) => setEditItem({ ...editItem, scheduled_date: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea value={editItem.description || ""} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} />
                  </div>
                </>
              )}

              {/* <div>
                <Label>Replace File</Label>
                <input type="file" onChange={(e: any) => setEditItem({ ...editItem, newFile: e.target.files?.[0] ?? null })} />
              </div> */}

              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                <Button className="bg-[#bf2026] text-white flex-1" onClick={handleEditSave} disabled={editSaving}>{editSaving ? "Saving..." : "Save Changes"}</Button>
              </div>
            </div>
          ) : (
            <div className="p-4">No item selected</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ContentManagementGrid;