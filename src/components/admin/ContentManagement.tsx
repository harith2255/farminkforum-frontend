import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Upload, Edit, Trash2, ImageIcon, Plus, X } from "lucide-react";

type Book = any;
type Note = any;
type Test = any;

const API = import.meta.env.VITE_API_URL || "https://e-book-backend-production.up.railway.app/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function ContentManagementGrid() {
  const [books, setBooks] = useState<Book[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  const [mcqs, setMcqs] = useState([
    { question: "", options: ["", "", "", ""], answer: "", explanation: "" },
  ]);

  const [mcqPage, setMcqPage] = useState(0);

  // Add this missing function
  const setAsCorrectAnswer = (qIndex: number, optionIndex: number) => {
    const updated = [...mcqs];
    updated[qIndex].answer = updated[qIndex].options[optionIndex];
    setMcqs(updated);
  };

  const addQuestion = () => {
    setMcqs(prev => [
      ...prev,
      {
        question: "",
        options: ["", "", "", ""],
        answer: "",
        explanation: "",
      }
    ]);
    setMcqPage(prevPage => prevPage + 1);
  };

  useEffect(() => {
    setTestForm(prev => ({
      ...prev,
      total_questions: mcqs.length.toString()
    }));
  }, [mcqs]);

  const removeQuestion = (index: number) => {
    const updated = [...mcqs];
    updated.splice(index, 1);
    setMcqs(updated);
    setMcqPage(Math.max(0, index - 1));
  };

  const updateQuestion = (index: number, field: string, value: string) => {
    const updated = [...mcqs];
    // @ts-ignore
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
    category: "",
    price: "",
    description: "",
    tags: "",
    file: null as File | null,
    cover: null as File | null,
  });

  const [noteForm, setNoteForm] = useState({
    title: "",
    author: "",
    category: "",
    price: "",
    description: "",
    file: null as File | null,
  });

  const [testForm, setTestForm] = useState({
    title: "",
    subject: "",
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
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    type: "book" | "note" | "test";
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const headers = getAuthHeaders();

  const extract = (res: any) => {
    if (!res) return [];
    if (Array.isArray(res.data)) return res.data;
    if (res.data?.contents && Array.isArray(res.data.contents)) return res.data.contents;
    if (res.data?.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
  };

  async function fetchBooks() {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/content?type=books`, { headers });
      setBooks(extract(res));
    } catch (err) {
      console.error("fetchBooks error", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchNotes() {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/content?type=notes`, { headers });
      const data = extract(res);
      console.log("Fetched Notes:", data); // Debug log
      setNotes(data);
    } catch (err) {
      console.error("fetchNotes error", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTests() {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/content?type=tests`, { headers });
      const data = extract(res);
      console.log("Fetched Tests:", data); // Debug log
      setTests(data);
    } catch (err) {
      console.error("fetchTests error", err);
    } finally {
      setLoading(false);
    }
  }

  const [activeTab, setActiveTab] = useState<"books" | "notes" | "tests">("books");

  useEffect(() => {
    if (activeTab === "books") fetchBooks();
    if (activeTab === "notes") fetchNotes();
    if (activeTab === "tests") fetchTests();
  }, [activeTab]);

  const addOption = (qIndex: number) => {
    setMcqs(prev => {
      const copy = [...prev];
      if (copy[qIndex].options.length < 6) {
        copy[qIndex].options.push("");
      }
      return copy;
    });
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    setMcqs(prev => {
      const copy = [...prev];
      if (copy[qIndex].options.length > 2) {
        copy[qIndex].options.splice(optIndex, 1);
      }
      return copy;
    });
  };

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
      
      // Refetch current tab data
      if (activeTab === "books") fetchBooks();
      if (activeTab === "notes") fetchNotes();
      if (activeTab === "tests") fetchTests();

    } catch (err) {
      console.error("Delete error:", err);
      alert("Delete failed");
    }
  };

  const handleEditSave = async () => {
    if (!editItem || !editType) return;

    try {
      setEditSaving(true);

      const headers = {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      };

      let payload: any = {};
      let endpoint = "";

      if (editType === "book") {
        payload = {
          title: editItem.title,
          author: editItem.author,
          category: editItem.category,
          price: Number(editItem.price || 0),
          description: editItem.description,
          tags: editItem.tags,
        };
        endpoint = `${API}/admin/content/book/${editItem.id}`;
      }

      if (editType === "note") {
        payload = {
          title: editItem.title,
          author: editItem.author,
          category: editItem.category,
          price: Number(editItem.price || 0),
          description: editItem.description,
        };
        endpoint = `${API}/admin/content/note/${editItem.id}`;
      }

      if (editType === "test") {
        payload = {
          title: editItem.title,
          subject: editItem.subject,
          difficulty: editItem.difficulty,
          total_questions: Number(editItem.total_questions),
          duration_minutes: Number(editItem.duration_minutes),
          description: editItem.description,
        };

        if (editItem.start_time) {
          payload.start_time = editItem.start_time;
        }

        endpoint = `${API}/admin/content/test/${editItem.id}`;
      }

      console.log("📝 EDIT PAYLOAD:", payload);

      await axios.put(endpoint, payload, { headers });

      alert("✅ Updated successfully!");
      setShowEditDialog(false);
      
      // Refetch current tab data
      if (activeTab === "books") fetchBooks();
      if (activeTab === "notes") fetchNotes();
      if (activeTab === "tests") fetchTests();

    } catch (err) {
      console.error("Edit error:", err);
      alert("❌ Failed to update content");
    } finally {
      setEditSaving(false);
    }
  };

  // Upload Handlers
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
      if (bookForm.cover) data.append("cover", bookForm.cover as Blob);

      const headers = { ...getAuthHeaders() };

      await axios.post(`${API}/admin/content/upload`, data, { headers });

      alert("✅ E-Book uploaded successfully!");
      setShowUploadBook(false);
      setBookForm({
        title: "",
        author: "",
        category: "Agriculture",
        price: "",
        description: "",
        tags: "",
        file: null,
        cover: null,
      });
      fetchBooks(); // Refresh books list

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

      const headers = {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      };
      await axios.post(`${API}/admin/content/upload`, data, { headers });

      alert("✅ Note uploaded successfully!");
      setShowUploadNote(false);
      setNoteForm({
        title: "",
        author: "",
        category: "Agriculture",
        price: "",
        description: "",
        file: null,
      });
      fetchNotes(); // Refresh notes list

    } catch (err: any) {
      console.error("uploadNote error", err);
      alert(err?.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const uploadTest = async () => {
    try {
      setUploading(true);

      const data = new FormData();
      data.append("type", "Mock Test");
      data.append("title", testForm.title);
      data.append("subject", testForm.subject || "");
      data.append("difficulty", testForm.difficulty || "");
      data.append("total_questions", testForm.total_questions || "");
      data.append("duration_minutes", testForm.duration_minutes || "");
      data.append("scheduled_date", testForm.scheduled_date || "");
      data.append("description", testForm.description || "");

      if (testForm.file) {
        data.append("file", testForm.file);
      }

      data.append("mcqs", JSON.stringify(mcqs));

      const headers = {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      };

      await axios.post(`${API}/admin/content/upload`, data, { headers });

      alert("✅ Mock Test uploaded successfully!");

      // Reset forms
      setTestForm({
        title: "",
        subject: "Agriculture",
        difficulty: "Easy",
        total_questions: "",
        duration_minutes: "",
        scheduled_date: "",
        description: "",
        file: null,
      });
      
      setMcqs([{ question: "", options: ["", "", "", ""], answer: "", explanation: "" }]);
      setMcqPage(0);
      
      fetchTests(); // Refresh tests list

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

  // Helper to render cover/image
  const renderCover = (item: any) => {
    const url = item?.cover_url || item?.file_url;
    const isTest = item?.total_questions !== undefined && item?.duration_minutes !== undefined;

    if (url && !isTest) {
      return (
        <img
          src={url}
          alt={item.title}
          className="w-full h-44 object-cover"
        />
      );
    }

    if (isTest) {
      return (
        <div className="w-full h-44 bg-blue-50 flex items-center justify-center">
          <span className="text-blue-600 font-semibold">Mock Test</span>
        </div>
      );
    }

    return (
      <div className="w-full h-44 bg-gray-100 flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Section */}
        <div>
          <h2 className="text-[#1d4d6a] mb-1">Content Management</h2>
          <p className="text-sm text-gray-500">Upload and manage E-Books, Notes and Mock Tests</p>
        </div>

        {/* Right Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:w-auto">
          <Button
            className="bg-[#1d4d6a] text-white sm:w-auto py-2 text-base"
            onClick={() => setShowUploadBook(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Upload E-Book
          </Button>

          <Button
            className="bg-[#bf2026] text-white sm:w-auto"
            onClick={() => setShowUploadNote(true)}
          >
            <Upload className="w-4 h-4 mr-2" /> Upload Notes
          </Button>

          <Button
            className="bg-[#153a4f] text-white sm:w-auto"
            onClick={() => setShowUploadTest(true)}
          >
            <Upload className="w-4 h-4 mr-2" /> Upload Mock Test
          </Button>
        </div>
      </div>

      <Tabs defaultValue="books" onValueChange={(value) => setActiveTab(value as "books" | "notes" | "tests")}>
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="books">E-Books</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="tests">Mock Tests</TabsTrigger>
        </TabsList>

        {/* BOOKS GRID */}
        <TabsContent value="books">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading books...</div>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No books found</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
              {books.map((book) => (
                <Card key={book.id} className="overflow-hidden shadow-sm">
                  {renderCover(book)}
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-[#1d4d6a]">{book.title}</h3>
                        <p className="text-xs text-gray-500">{book.author}</p>
                        <p className="text-xs text-gray-400 mt-1">{book.categories?.name || "—"}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{book.price ? `₹${book.price}` : "Free"}</div>
                        <Badge className="mt-2">{book.pages ? `${book.pages} pages` : "—"}</Badge>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(book, "book")}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => {
                          setDeleteTarget({ id: book.id, type: "book" });
                          setDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {book.file_url && (
                        <a
                          href={book.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto text-sm text-blue-600 underline"
                        >
                          View
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* NOTES GRID */}
        <TabsContent value="notes">
  {loading ? (
    <div className="flex justify-center items-center h-64">
      <div className="text-gray-500">Loading notes...</div>
    </div>
  ) : notes.length === 0 ? (
    <div className="text-center py-8 text-gray-500">No notes found</div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
      {notes.map((note) => (
        <Card key={note.id} className="overflow-hidden shadow-sm">
          {/* Remove or comment out this line to remove the cover image */}
          {/* {renderCover(note)} */}
          
          <CardContent>
            <div className="flex items-start justify-between pt-2">
              <div>
                <h3 className="text-sm font-semibold text-[#1d4d6a]">{note.title}</h3>
                <p className="text-xs text-gray-500">{note.author}</p>
                <p className="text-xs text-gray-400 mt-1">{note.category || "—"}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{note.price ? `₹${note.price}` : "Free"}</div>
                <Badge className="mt-2">{note.pages ? `${note.pages} pages` : "—"}</Badge>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => openEditModal(note, "note")}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600"
                onClick={() => {
                  setDeleteTarget({ id: note.id, type: "note" });
                  setDeleteModalOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              {note.file_url && (
                <a
                  href={note.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto text-sm text-blue-600 underline"
                >
                  Download
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )}
</TabsContent>

        {/* TESTS GRID */}
        <TabsContent value="tests">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading tests...</div>
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No tests found</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
              {tests.map((test) => (
                <Card key={test.id} className="overflow-hidden shadow-sm">
                    {/* {renderCover(test)} */}
                  <CardContent>
                    <div className="flex items-start justify-between pt-2">
                      <div>
                        <h3 className="text-sm font-semibold text-[#1d4d6a]">{test.title}</h3>
                        <p className="text-xs text-gray-500">{test.subject}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {test.difficulty} • {test.total_questions} Qs
                        </p>
                        {(test.start_time || test.scheduled_date) && (
                          <p className="text-xs text-blue-600 mt-1">
                            Starts: {new Date(test.start_time || test.scheduled_date).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge>{test.attempts?.[0]?.count ?? 0} participants</Badge>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(test, "test")}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => {
                          setDeleteTarget({ id: test.id, type: "test" });
                          setDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {test.file_url && (
                        <a
                          href={test.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto text-sm text-blue-600 underline"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* DELETE MODAL */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this item? This action cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* UPLOAD BOOK DIALOG */}
      <Dialog open={showUploadBook} onOpenChange={setShowUploadBook}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload E-Book</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div><Label>Title</Label><Input value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} /></div>
            <div><Label>Author</Label><Input value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} /></div>
            <div><Label>Category</Label><Input value={bookForm.category} onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })} placeholder="Agriculture, Adult Education...." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Price</Label><Input value={bookForm.price} onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })} /></div>
              <div><Label>Tags</Label><Input value={bookForm.tags} onChange={(e) => setBookForm({ ...bookForm, tags: e.target.value })} /></div>
            </div>
            <div><Label>Description</Label><Textarea value={bookForm.description} onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Upload File</Label><input type="file" accept=".pdf,.epub" onChange={(e: any) => setBookForm({ ...bookForm, file: e.target.files?.[0] ?? null })} /></div>
              <div><Label>Cover Image</Label><input type="file" accept="image/*" onChange={(e: any) => setBookForm({ ...bookForm, cover: e.target.files?.[0] ?? null })} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowUploadBook(false)}>Cancel</Button>
              <Button className="bg-[#bf2026] text-white flex-1" onClick={uploadBook} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload E-Book"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* UPLOAD NOTE DIALOG */}
      <Dialog open={showUploadNote} onOpenChange={setShowUploadNote}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div><Label>Title</Label><Input value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} /></div>
            <div><Label>Author</Label><Input value={noteForm.author} onChange={(e) => setNoteForm({ ...noteForm, author: e.target.value })} /></div>
            <div><Label>Category</Label><Input value={noteForm.category} onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })} /></div>
            <div><Label>Price</Label><Input value={noteForm.price} onChange={(e) => setNoteForm({ ...noteForm, price: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={noteForm.description} onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })} /></div>
            <div><Label>Upload File</Label><input type="file" accept=".pdf" onChange={(e: any) => setNoteForm({ ...noteForm, file: e.target.files?.[0] ?? null })} /></div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowUploadNote(false)}>Cancel</Button>
              <Button className="bg-[#bf2026] text-white flex-1" onClick={uploadNote} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Notes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* UPLOAD TEST DIALOG */}
      <Dialog open={showUploadTest} onOpenChange={setShowUploadTest}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Mock Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div><Label>Title</Label><Input value={testForm.title} onChange={(e) => setTestForm({ ...testForm, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Subject</Label><Input value={testForm.subject} onChange={(e) => setTestForm({ ...testForm, subject: e.target.value })} /></div>
              <div><Label>Difficulty</Label><select value={testForm.difficulty} onChange={(e) => setTestForm({ ...testForm, difficulty: e.target.value })} className="w-full border p-2 rounded"><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Total Questions</Label><Input type="number" value={mcqs.length} readOnly className="bg-gray-50" /></div>
              <div><Label>Duration (minutes)</Label><Input type="number" value={testForm.duration_minutes} onChange={(e) => setTestForm({ ...testForm, duration_minutes: e.target.value })} /></div>
            </div>
            <div><Label>Scheduled Date</Label><Input type="datetime-local" value={testForm.scheduled_date} onChange={(e) => setTestForm({ ...testForm, scheduled_date: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={testForm.description} onChange={(e) => setTestForm({ ...testForm, description: e.target.value })} /></div>
            
            {/* MCQ Section */}
            <div className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div><h2 className="text-lg font-semibold">MCQ Section</h2><p className="text-sm text-gray-500">Add multiple choice questions</p></div>
                <Button variant="outline" size="sm" onClick={addQuestion}><Plus className="w-4 h-4 mr-2" />Add Question</Button>
              </div>
              
              {mcqs.length > 0 && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-base">Question {mcqPage + 1}</Label>
                    {mcqs.length > 1 && <Button variant="outline" size="sm" className="text-red-600" onClick={() => removeQuestion(mcqPage)}><X className="w-4 h-4 mr-2" />Remove Question</Button>}
                  </div>
                  
                  <div><Label>Question Text</Label><Textarea value={mcqs[mcqPage].question} onChange={(e) => updateQuestion(mcqPage, "question", e.target.value)} rows={2} /></div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <Label>Options</Label>
                      <Button variant="outline" size="sm" onClick={() => addOption(mcqPage)} disabled={mcqs[mcqPage].options.length >= 6}><Plus className="w-3 h-3 mr-1" />Add Option</Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {mcqs[mcqPage].options.map((opt, i) => (
                        <div key={i} className="relative">
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-sm">Option {i + 1}</Label>
                            {mcqs[mcqPage].options.length > 2 && <button onClick={() => removeOption(mcqPage, i)} className="text-gray-400 hover:text-red-600"><X className="w-3 h-3" /></button>}
                          </div>
                          <div className="flex gap-2">
                            <Input value={opt} onChange={(e) => updateOption(mcqPage, i, e.target.value)} />
                            <button onClick={() => setAsCorrectAnswer(mcqPage, i)} className={`px-3 py-2 rounded border ${mcqs[mcqPage].answer === opt ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>✓</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4"><Label>Correct Answer</Label><Input value={mcqs[mcqPage].answer} onChange={(e) => updateQuestion(mcqPage, "answer", e.target.value)} /></div>
                  <div className="mt-4"><Label>Explanation</Label><Textarea value={mcqs[mcqPage].explanation} onChange={(e) => updateQuestion(mcqPage, "explanation", e.target.value)} rows={3} /></div>
                  
                  <div className="flex justify-between items-center mt-6">
                    <Button variant="outline" disabled={mcqPage === 0} onClick={() => setMcqPage(mcqPage - 1)}>Previous</Button>
                    <span className="text-sm text-gray-600">Question {mcqPage + 1} of {mcqs.length}</span>
                    <Button variant="outline" disabled={mcqPage === mcqs.length - 1} onClick={() => setMcqPage(mcqPage + 1)}>Next</Button>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowUploadTest(false)}>Cancel</Button>
              <Button className="bg-[#bf2026] text-white flex-1" onClick={uploadTest} disabled={uploading || mcqs.length === 0}>
                {uploading ? "Uploading..." : `Upload Mock Test (${mcqs.length} questions)`}
              </Button>
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
          {editItem && (
            <div className="space-y-4 p-4">
              <div><Label>Title</Label><Input value={editItem.title || ""} onChange={(e) => setEditItem({ ...editItem, title: e.target.value })} /></div>
              
              {editType !== "test" ? (
                <>
                  <div><Label>Author</Label><Input value={editItem.author || ""} onChange={(e) => setEditItem({ ...editItem, author: e.target.value })} /></div>
                  <div><Label>Category</Label><Input value={editItem.category || ""} onChange={(e) => setEditItem({ ...editItem, category: e.target.value })} /></div>
                  <div><Label>Price</Label><Input value={editItem.price || ""} onChange={(e) => setEditItem({ ...editItem, price: e.target.value })} /></div>
                  <div><Label>Description</Label><Textarea value={editItem.description || ""} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} /></div>
                  <div><Label>Tags</Label><Input value={Array.isArray(editItem.tags) ? editItem.tags.join(",") : editItem.tags || ""} onChange={(e) => setEditItem({ ...editItem, tags: e.target.value })} /></div>
                </>
              ) : (
                <>
                  <div><Label>Subject</Label><Input value={editItem.subject || ""} onChange={(e) => setEditItem({ ...editItem, subject: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Difficulty</Label><select value={editItem.difficulty || "Easy"} onChange={(e) => setEditItem({ ...editItem, difficulty: e.target.value })} className="w-full border p-2 rounded"><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
                    <div><Label>Total Questions</Label><Input type="number" value={editItem.total_questions || ""} onChange={(e) => setEditItem({ ...editItem, total_questions: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Duration (minutes)</Label><Input type="number" value={editItem.duration_minutes || ""} onChange={(e) => setEditItem({ ...editItem, duration_minutes: e.target.value })} /></div>
                    <div><Label>Scheduled Date</Label><Input type="datetime-local" value={editItem.start_time ? new Date(editItem.start_time).toISOString().slice(0, 16) : ""} onChange={(e) => setEditItem({ ...editItem, start_time: new Date(e.target.value).toISOString() })} /></div>
                  </div>
                  <div><Label>Description</Label><Textarea value={editItem.description || ""} onChange={(e) => setEditItem({ ...editItem, description: e.target.value })} /></div>
                </>
              )}
              
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                <Button className="bg-[#bf2026] text-white flex-1" onClick={handleEditSave} disabled={editSaving}>
                  {editSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ContentManagementGrid;