// src/components/admin/ContentManagement.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Upload,
  FileText,
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Download,
  Eye,
  Calendar,
  Clock,
  BookOpen,
  File,
  Users,
} from "lucide-react";

export function ContentManagement() {
  const [books, setBooks] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showUploadBook, setShowUploadBook] = useState(false);
  const [showUploadNote, setShowUploadNote] = useState(false);
  const [showUploadTest, setShowUploadTest] = useState(false);

  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editType, setEditType] = useState<"E-Book" | "Notes" | "Mock Test" | null>(null);

  // Upload form states
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    category: "Agriculture",
    price: "",
    description: "",
    tags: "",
    file: null as File | null,
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

  // MCQ SECTION
  const [mcqs, setMcqs] = useState([
    { question: "", options: ["", "", "", ""], answer: "" },
  ]);
  const [mcqPage, setMcqPage] = useState(0);

  const addQuestion = () => {
    setMcqs([
      ...mcqs,
      { question: "", options: ["", "", "", ""], answer: "" },
    ]);
    setMcqPage(mcqs.length);
  };

  const removeQuestion = (index: number) => {
    if (mcqs.length <= 1) {
      alert("At least one question is required");
      return;
    }

    const updated = mcqs.filter((_, i) => i !== index);
    setMcqs(updated);

    if (mcqPage >= updated.length) {
      setMcqPage(updated.length - 1);
    }
  };

  const updateQuestion = (index: number, key: string, value: string) => {
    const updated = [...mcqs];
    updated[index][key] = value;
    setMcqs(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...mcqs];
    updated[qIndex].options[optIndex] = value;
    setMcqs(updated);
  };

  const [uploading, setUploading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Fetch content
  const fetchContent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [booksRes, notesRes, testsRes] = await Promise.all([
        axios.get("https://ebook-backend-lxce.onrender.com/api/admin/content?type=books", { headers }),
        axios.get("https://ebook-backend-lxce.onrender.com/api/admin/content?type=notes", { headers }),
        axios.get("https://ebook-backend-lxce.onrender.com/api/admin/content?type=tests", { headers }),
      ]);

      setBooks(booksRes.data.contents || []);
      setNotes(notesRes.data.contents || []);
      setTests(testsRes.data.contents || []);
    } catch (err) {
      console.error("❌ Error fetching content:", err);
      alert("Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  // File changes
  const onBookFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBookForm({ ...bookForm, file: e.target.files?.[0] ?? null });
  };
  const onNoteFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNoteForm({ ...noteForm, file: e.target.files?.[0] ?? null });
  };
  const onTestFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestForm({ ...testForm, file: e.target.files?.[0] ?? null });
  };

  // Helper to build headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Upload handlers
  const uploadBook = async () => {
    try {
      if (!bookForm.title || !bookForm.author || !bookForm.file) {
        return alert("Please fill title, author and upload a file.");
      }
      setUploading(true);

      const data = new FormData();
      data.append("type", "E-Book");
      data.append("title", bookForm.title);
      data.append("author", bookForm.author);
      data.append("category", bookForm.category);
      data.append("price", bookForm.price || "0");
      data.append("description", bookForm.description || "");
      data.append("tags", bookForm.tags || "");
      if (bookForm.file) data.append("file", bookForm.file);

      await axios.post("https://ebook-backend-lxce.onrender.com/api/admin/content/upload", data, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

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
      });
      fetchContent();
    } catch (err: any) {
      console.error("Upload book error:", err);
      alert(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const uploadNote = async () => {
    try {
      if (!noteForm.title || !noteForm.author || !noteForm.file) {
        return alert("Please fill title, author and upload a file.");
      }
      setUploading(true);

      const data = new FormData();
      data.append("type", "Notes");
      data.append("title", noteForm.title);
      data.append("author", noteForm.author);
      data.append("category", noteForm.category);
      data.append("price", noteForm.price || "0");
      data.append("description", noteForm.description || "");
      if (noteForm.file) data.append("file", noteForm.file);

      await axios.post("https://ebook-backend-lxce.onrender.com/api/admin/content/upload", data, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

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
      fetchContent();
    } catch (err: any) {
      console.error("Upload note error:", err);
      alert(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const uploadTest = async () => {
    try {
      if (!testForm.title || !testForm.total_questions || !testForm.duration_minutes || !testForm.file) {
        return alert("Please fill title, total questions, duration and upload file.");
      }
      setUploading(true);

      const data = new FormData();
      data.append("type", "Mock Test");
      data.append("title", testForm.title);
      data.append("subject", testForm.subject || "Agriculture");
      data.append("difficulty", testForm.difficulty || "Easy");
      data.append("total_questions", testForm.total_questions || "0");
      data.append("duration_minutes", testForm.duration_minutes || "0");

      // Include MCQ data in the upload
      data.append("mcq_data", JSON.stringify(mcqs));

      if (testForm.scheduled_date) {
        const iso = new Date(testForm.scheduled_date).toISOString();
        data.append("scheduled_date", iso);
      }

      data.append("description", testForm.description || "");
      if (testForm.file) data.append("file", testForm.file);

      await axios.post("https://ebook-backend-lxce.onrender.com/api/admin/content/upload", data, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      alert("✅ Mock test uploaded successfully!");
      setShowUploadTest(false);
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
      // Reset MCQ data after upload
      setMcqs([{ question: "", options: ["", "", "", ""], answer: "" }]);
      setMcqPage(0);
      fetchContent();
    } catch (err: any) {
      console.error("Upload test error:", err);
      alert(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // Delete handler
  const handleDelete = async (id: string, type: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`https://ebook-backend-lxce.onrender.com/api/admin/content/${type}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchContent();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Delete failed");
    }
  };

  // Edit handlers
  const openEditModal = (item: any, type: "E-Book" | "Notes" | "Mock Test") => {
    if (type === "Mock Test") {
      const mcqData = item.mcq_data || [];
      setEditItem({
        ...item,
        mcq_data: mcqData,
        mcq_page: 0
      });
    } else {
      setEditItem(item);
    }
    setEditType(type);
    setShowEditDialog(true);
  };

  const handleEditSave = async () => {
    if (!editItem || !editType) return;
    try {
      setEditSaving(true);
      const token = localStorage.getItem("token");
      const data = new FormData();

      data.append("title", editItem.title || "");

      if (editType === "E-Book" || editType === "Notes") {
        data.append("author", editItem.author || "");
        data.append("category", editItem.category || "Agriculture");
        data.append("price", editItem.price?.toString?.() || "0");
        data.append("description", editItem.description || "");
        if (Array.isArray(editItem.tags)) {
          data.append("tags", editItem.tags.join(","));
        } else {
          data.append("tags", editItem.tags || "");
        }
      } else {
        data.append("subject", editItem.subject || "Agriculture");
        data.append("difficulty", editItem.difficulty || "Easy");
        data.append("total_questions", editItem.total_questions?.toString?.() || "0");
        data.append("duration_minutes", editItem.duration_minutes?.toString?.() || "0");
        if (editItem.scheduled_date) data.append("scheduled_date", new Date(editItem.scheduled_date).toISOString());

        if (editItem.mcq_data) {
          data.append("mcq_data", JSON.stringify(editItem.mcq_data));
        }
      }

      if (editItem.newFile instanceof File) {
        data.append("file", editItem.newFile);
      }

      const backendType = editType.toLowerCase().replace(" ", "-");
      await axios.put(`https://ebook-backend-lxce.onrender.com/api/admin/content/${backendType}/${editItem.id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Updated successfully!");
      setShowEditDialog(false);
      fetchContent();
    } catch (err) {
      console.error("Edit save error:", err);
      alert("Update failed");
    } finally {
      setEditSaving(false);
    }
  };

  // Reset forms when dialogs close
  useEffect(() => {
    if (!showUploadTest) {
      setMcqs([{ question: "", options: ["", "", "", ""], answer: "" }]);
      setMcqPage(0);
    }
  }, [showUploadTest]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1d4d6a] mb-1">Content Management</h2>
          <p className="text-sm text-gray-500">Upload and manage E-Books, Notes and Mock Tests</p>
        </div>

        <div className="flex gap-2">
          <Button className="bg-[#1d4d6a] text-white hover:bg-[#153a4f]" onClick={() => setShowUploadBook(true)}>
            <Plus className="w-4 h-4 mr-2" /> Upload E-Book
          </Button>
          <Button className="bg-[#bf2026] text-white hover:bg-[#a61b1f]" onClick={() => setShowUploadNote(true)}>
            <Upload className="w-4 h-4 mr-2" /> Upload Notes
          </Button>
          <Button className="bg-[#153a4f] text-white hover:bg-[#0f2a3a]" onClick={() => setShowUploadTest(true)}>
            <FileText className="w-4 h-4 mr-2" /> Upload Mock Test
          </Button>
        </div>
      </div>

      {/* Tabs listing */}
      <Tabs defaultValue="books" className="w-full">
        <TabsList className="bg-white border border-gray-200 w-full grid grid-cols-3">
          <TabsTrigger value="books" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            E-Books ({books.length})
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <File className="w-4 h-4" />
            Notes ({notes.length})
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Mock Tests ({tests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#1d4d6a]" />
            </div>
          ) : books.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No E-Books Found</h3>
              <p className="text-gray-500 mb-4">Get started by uploading your first E-Book</p>
              <Button onClick={() => setShowUploadBook(true)} className="bg-[#1d4d6a] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Upload E-Book
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map(book => (
                <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-0">
                    <div className="p-4 bg-gradient-to-r from-[#1d4d6a] to-[#2c6c91] text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold line-clamp-2">{book.title}</h4>
                          <p className="text-sm opacity-90 mt-1">{book.author}</p>
                        </div>
                        <Badge variant="secondary" className="bg-white text-[#1d4d6a]">
                          {book.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{book.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span>₹{book.price || "Free"}</span>
                        <span>{book.downloads || 0} downloads</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(book, "E-Book")}>
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(book.id, "book")}>
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#1d4d6a]" />
            </div>
          ) : notes.length === 0 ? (
            <Card className="p-8 text-center">
              <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Notes Found</h3>
              <p className="text-gray-500 mb-4">Get started by uploading your first Notes</p>
              <Button onClick={() => setShowUploadNote(true)} className="bg-[#bf2026] text-white">
                <Upload className="w-4 h-4 mr-2" />
                Upload Notes
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map(note => (
                <Card key={note.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-0">
                    <div className="p-4 bg-gradient-to-r from-[#bf2026] to-[#d9363c] text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold line-clamp-2">{note.title}</h4>
                          <p className="text-sm opacity-90 mt-1">{note.author}</p>
                        </div>
                        <Badge variant="secondary" className="bg-white text-[#bf2026]">
                          {note.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{note.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span>₹{note.price || "Free"}</span>
                        <span>{note.downloads || 0} downloads</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(note, "Notes")}>
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(note.id, "note")}>
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="tests" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#1d4d6a]" />
            </div>
          ) : tests.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Mock Tests Found</h3>
              <p className="text-gray-500 mb-4">Get started by uploading your first Mock Test</p>
              <Button onClick={() => setShowUploadTest(true)} className="bg-[#153a4f] text-white">
                <FileText className="w-4 h-4 mr-2" />
                Upload Mock Test
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tests.map(test => (
                <Card key={test.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-0">
                    <div className="p-4 bg-gradient-to-r from-[#153a4f] to-[#2c6c91] text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold line-clamp-2">{test.title}</h4>
                          <p className="text-sm opacity-90 mt-1">{test.subject}</p>
                        </div>
                        <Badge variant="secondary" className={`${test.difficulty === 'Easy' ? 'bg-green-500' :
                          test.difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                          } text-white`}>
                          {test.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3 text-gray-500" />
                          <span>{test.total_questions} Qs</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span>{test.duration_minutes} min</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-gray-500" />
                          <span>{test.attendees_count || 0} attended</span>
                        </div>
                        {test.scheduled_date && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(test.scheduled_date)}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{test.description}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(test, "Mock Test")}>
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(test.id, "test")}>
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* UPLOAD DIALOG: E-BOOK */}
      <Dialog open={showUploadBook} onOpenChange={setShowUploadBook}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1d4d6a] flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Upload E-Book
            </DialogTitle>
            <DialogDescription>
              Add a new E-Book to your content library
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  placeholder="Enter book title"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Author *</Label>
                <Input
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  placeholder="Enter author name"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <select
                  value={bookForm.category}
                  onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                  className="w-full border p-2 rounded mt-1"
                >
                  <option>Agriculture</option>
                  <option>Science</option>
                  <option>Mathematics</option>
                  <option>Technology</option>
                </select>
              </div>
              <div>
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  value={bookForm.price}
                  onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })}
                  placeholder="Enter price"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={bookForm.description}
                onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                placeholder="Enter book description"
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Tags (comma separated)</Label>
              <Input
                value={bookForm.tags}
                onChange={(e) => setBookForm({ ...bookForm, tags: e.target.value })}
                placeholder="e.g., agriculture, farming, crops"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Upload File (PDF / EPUB) *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-1">
                <input
                  type="file"
                  accept=".pdf,.epub"
                  onChange={onBookFileChange}
                  className="hidden"
                  id="book-upload"
                />
                <label htmlFor="book-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {bookForm.file ? bookForm.file.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF, EPUB up to 10MB</p>
                </label>
              </div>
              {bookForm.file && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">{bookForm.file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBookForm({ ...bookForm, file: null })}
                    className="ml-auto"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowUploadBook(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                className="bg-[#1d4d6a] text-white flex-1"
                onClick={uploadBook}
                disabled={uploading || !bookForm.title || !bookForm.author || !bookForm.file}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                {uploading ? "Uploading..." : "Upload E-Book"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* UPLOAD DIALOG: NOTES */}
      <Dialog open={showUploadNote} onOpenChange={setShowUploadNote}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#bf2026] flex items-center gap-2">
              <File className="w-5 h-5" />
              Upload Notes
            </DialogTitle>
            <DialogDescription>
              Add new study notes to your content library
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  placeholder="Enter notes title"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Author *</Label>
                <Input
                  value={noteForm.author}
                  onChange={(e) => setNoteForm({ ...noteForm, author: e.target.value })}
                  placeholder="Enter author name"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <select
                  value={noteForm.category}
                  onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                  className="w-full border p-2 rounded mt-1"
                >
                  <option>Agriculture</option>
                  <option>Science</option>
                  <option>Mathematics</option>
                  <option>Technology</option>
                </select>
              </div>
              <div>
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  value={noteForm.price}
                  onChange={(e) => setNoteForm({ ...noteForm, price: e.target.value })}
                  placeholder="Enter price"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={noteForm.description}
                onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                placeholder="Enter notes description"
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Upload File (PDF) *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-1">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={onNoteFileChange}
                  className="hidden"
                  id="note-upload"
                />
                <label htmlFor="note-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {noteForm.file ? noteForm.file.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF up to 10MB</p>
                </label>
              </div>
              {noteForm.file && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">{noteForm.file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setNoteForm({ ...noteForm, file: null })}
                    className="ml-auto"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowUploadNote(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                className="bg-[#bf2026] text-white flex-1"
                onClick={uploadNote}
                disabled={uploading || !noteForm.title || !noteForm.author || !noteForm.file}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                {uploading ? "Uploading..." : "Upload Notes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* UPLOAD DIALOG: MOCK TEST */}
      <Dialog open={showUploadTest} onOpenChange={setShowUploadTest}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#153a4f] flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Upload Mock Test
            </DialogTitle>
            <DialogDescription>
              Create a new mock test with questions and timing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 p-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={testForm.title}
                  onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                  placeholder="Enter test title"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Subject</Label>
                <select
                  value={testForm.subject}
                  onChange={(e) => setTestForm({ ...testForm, subject: e.target.value })}
                  className="w-full border p-2 rounded mt-1"
                >
                  <option>Agriculture</option>
                  <option>Science</option>
                  <option>Mathematics</option>
                  <option>General Knowledge</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Difficulty</Label>
                <select
                  value={testForm.difficulty}
                  onChange={(e) => setTestForm({ ...testForm, difficulty: e.target.value })}
                  className="w-full border p-2 rounded mt-1"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
              <div>
                <Label>Total Questions *</Label>
                <Input
                  type="number"
                  value={testForm.total_questions}
                  onChange={(e) => setTestForm({ ...testForm, total_questions: e.target.value })}
                  placeholder="Number of questions"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Duration (minutes) *</Label>
                <Input
                  type="number"
                  value={testForm.duration_minutes}
                  onChange={(e) => setTestForm({ ...testForm, duration_minutes: e.target.value })}
                  placeholder="Test duration"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Scheduled Date</Label>
                <Input
                  type="datetime-local"
                  value={testForm.scheduled_date}
                  onChange={(e) => setTestForm({ ...testForm, scheduled_date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={testForm.description}
                onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                placeholder="Enter test description"
                rows={3}
                className="mt-1"
              />
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

            <div>
              <Label>Upload File (PDF / DOCX)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-1">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={onTestFileChange}
                  className="hidden"
                  id="test-upload"
                />
                <label htmlFor="test-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {testForm.file ? testForm.file.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX up to 10MB</p>
                </label>
              </div>
              {testForm.file && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">{testForm.file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTestForm({ ...testForm, file: null })}
                    className="ml-auto"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowUploadTest(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                className="bg-[#153a4f] text-white flex-1"
                onClick={uploadTest}
                disabled={uploading || !testForm.title || !testForm.total_questions || !testForm.duration_minutes || !testForm.file}
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                {uploading ? "Uploading..." : "Upload Mock Test"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG - Keep the existing edit dialog structure but apply similar UI improvements */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1d4d6a]">Edit Content</DialogTitle>
          </DialogHeader>

          {editItem ? (
            <div className="space-y-4 p-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editItem.title || ""}
                  onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                  className="mt-1"
                />
              </div>

              {editType !== "Mock Test" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Author</Label>
                      <Input
                        value={editItem.author || ""}
                        onChange={(e) => setEditItem({ ...editItem, author: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <select
                        value={editItem.category || "Agriculture"}
                        onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                        className="w-full border p-2 rounded mt-1"
                      >
                        <option>Agriculture</option>
                        <option>Science</option>
                        <option>Mathematics</option>
                        <option>Technology</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Price (₹)</Label>
                      <Input
                        type="number"
                        value={editItem.price || ""}
                        onChange={(e) => setEditItem({ ...editItem, price: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={editItem.description || ""}
                      onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Tags (comma separated)</Label>
                    <Input
                      value={Array.isArray(editItem.tags) ? editItem.tags.join(",") : (editItem.tags || "")}
                      onChange={(e) => setEditItem({ ...editItem, tags: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              {editType === "Mock Test" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Subject</Label>
                      <select
                        value={editItem.subject || "Agriculture"}
                        onChange={(e) => setEditItem({ ...editItem, subject: e.target.value })}
                        className="w-full border p-2 rounded mt-1"
                      >
                        <option>Agriculture</option>
                        <option>Science</option>
                        <option>Mathematics</option>
                        <option>General Knowledge</option>
                      </select>
                    </div>
                    <div>
                      <Label>Difficulty</Label>
                      <select
                        value={editItem.difficulty || "Easy"}
                        onChange={(e) => setEditItem({ ...editItem, difficulty: e.target.value })}
                        className="w-full border p-2 rounded mt-1"
                      >
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Total Questions</Label>
                      <Input
                        type="number"
                        value={editItem.total_questions || ""}
                        onChange={(e) => setEditItem({ ...editItem, total_questions: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={editItem.duration_minutes || ""}
                        onChange={(e) => setEditItem({ ...editItem, duration_minutes: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Scheduled Date</Label>
                    <Input
                      type="datetime-local"
                      value={editItem.scheduled_date ? new Date(editItem.scheduled_date).toISOString().slice(0, 16) : ""}
                      onChange={(e) => setEditItem({ ...editItem, scheduled_date: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={editItem.description || ""}
                      onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                      rows={3}
                      className="mt-1"
                    />
                  </div>

                  {/* MCQ SECTION FOR EDITING */}
                  <div className="border rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-lg font-semibold">MCQ Section</h2>
                        <p className="text-sm text-gray-500">Edit multiple choice questions</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentMcqs = editItem.mcq_data || [];
                            setEditItem({
                              ...editItem,
                              mcq_data: [...currentMcqs, { question: "", options: ["", "", "", ""], answer: "" }]
                            });
                          }}
                          className="flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add Question
                        </Button>
                      </div>
                    </div>

                    {editItem.mcq_data?.length > 0 ? (
                      <div className="space-y-4">
                        {/* Question Header with Remove Button */}
                        <div className="flex justify-between items-center">
                          <Label className="text-base">Question {(editItem.mcq_page || 0) + 1}</Label>
                          {editItem.mcq_data.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => {
                                const updatedMcqs = editItem.mcq_data.filter((_: any, i: number) => i !== (editItem.mcq_page || 0));
                                setEditItem({
                                  ...editItem,
                                  mcq_data: updatedMcqs,
                                  mcq_page: Math.min(editItem.mcq_page || 0, updatedMcqs.length - 1)
                                });
                              }}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Remove Question
                            </Button>
                          )}
                        </div>

                        <div>
                          <Label>Question Text</Label>
                          <Textarea
                            value={editItem.mcq_data[editItem.mcq_page || 0]?.question || ""}
                            onChange={(e) => {
                              const updatedMcqs = [...editItem.mcq_data];
                              updatedMcqs[editItem.mcq_page || 0] = {
                                ...updatedMcqs[editItem.mcq_page || 0],
                                question: e.target.value
                              };
                              setEditItem({ ...editItem, mcq_data: updatedMcqs });
                            }}
                            placeholder="Enter question"
                            className="mt-1"
                            rows={2}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {editItem.mcq_data[editItem.mcq_page || 0]?.options.map((opt: string, i: number) => (
                            <div key={i} className="relative">
                              <Label>Option {i + 1}</Label>
                              <Input
                                value={opt}
                                onChange={(e) => {
                                  const updatedMcqs = [...editItem.mcq_data];
                                  const updatedOptions = [...updatedMcqs[editItem.mcq_page || 0].options];
                                  updatedOptions[i] = e.target.value;
                                  updatedMcqs[editItem.mcq_page || 0] = {
                                    ...updatedMcqs[editItem.mcq_page || 0],
                                    options: updatedOptions
                                  };
                                  setEditItem({ ...editItem, mcq_data: updatedMcqs });
                                }}
                                placeholder={`Option ${i + 1}`}
                                className="mt-1"
                              />
                            </div>
                          ))}
                        </div>

                        <div>
                          <Label>Correct Answer</Label>
                          <Input
                            value={editItem.mcq_data[editItem.mcq_page || 0]?.answer || ""}
                            onChange={(e) => {
                              const updatedMcqs = [...editItem.mcq_data];
                              updatedMcqs[editItem.mcq_page || 0] = {
                                ...updatedMcqs[editItem.mcq_page || 0],
                                answer: e.target.value
                              };
                              setEditItem({ ...editItem, mcq_data: updatedMcqs });
                            }}
                            placeholder="Enter correct answer"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p>No questions added yet.</p>
                        <p className="text-sm">Click "Add Question" to start.</p>
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {editItem.mcq_data?.length > 0 && (
                      <div className="flex justify-between items-center mt-6">
                        <Button
                          variant="outline"
                          disabled={(editItem.mcq_page || 0) === 0}
                          onClick={() => setEditItem({ ...editItem, mcq_page: (editItem.mcq_page || 0) - 1 })}
                        >
                          Previous
                        </Button>

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Question {(editItem.mcq_page || 0) + 1} of {editItem.mcq_data.length}
                          </span>
                        </div>

                        <Button
                          variant="outline"
                          disabled={(editItem.mcq_page || 0) === editItem.mcq_data.length - 1}
                          onClick={() => setEditItem({ ...editItem, mcq_page: (editItem.mcq_page || 0) + 1 })}
                        >
                          Next
                        </Button>
                      </div>
                    )}

                    {/* Questions Summary */}
                    {editItem.mcq_data?.length > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium mb-2">Questions Summary:</h4>
                        <div className="flex flex-wrap gap-1">
                          {editItem.mcq_data.map((mcq: any, index: number) => (
                            <Badge
                              key={index}
                              variant={index === (editItem.mcq_page || 0) ? "default" : "outline"}
                              className={`cursor-pointer ${index === (editItem.mcq_page || 0)
                                ? "bg-[#1d4d6a] text-white"
                                : mcq.question ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                                }`}
                              onClick={() => setEditItem({ ...editItem, mcq_page: index })}
                            >
                              Q{index + 1}
                              {mcq.question && " ✓"}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <Label>Replace File</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mt-1">
                  <input
                    type="file"
                    onChange={(e: any) => setEditItem({ ...editItem, newFile: e.target.files?.[0] ?? null })}
                    className="hidden"
                    id="edit-file-upload"
                  />
                  <label htmlFor="edit-file-upload" className="cursor-pointer">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {editItem.newFile ? editItem.newFile.name : "Click to upload replacement file"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Leave empty to keep current file</p>
                  </label>
                </div>
                {editItem.newFile && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded">
                    <FileText className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">{editItem.newFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditItem({ ...editItem, newFile: null })}
                      className="ml-auto"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  className="bg-[#bf2026] text-white flex-1"
                  onClick={handleEditSave}
                  disabled={editSaving}
                >
                  {editSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">No item selected</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ContentManagement;