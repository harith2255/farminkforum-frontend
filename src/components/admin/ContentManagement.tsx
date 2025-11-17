import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Upload, FileText, Plus, Edit, Trash2, Trash  } from "lucide-react";

type ContentType = "E-Book" | "Notes" | "Mock Test";

type MCQ = {
  id: string; // uuid-like unique id
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  answer: "A" | "B" | "C" | "D" | "";
};

export function ContentManagement(): JSX.Element {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  const [contentType, setContentType] = useState<ContentType>("E-Book");

  const [currentIndex, setCurrentIndex] = useState(0);


  // MCQ questions state with unique ids
  const [questions, setQuestions] = useState<MCQ[]>(() => [
    { id: cryptoSafeId(), question: "", optionA: "", optionB: "", optionC: "", optionD: "", answer: "" },
  ]);

  // refs for autofocus (question input of each MCQ)
  const questionInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const dragItemId = useRef<string | null>(null);

  // Sample data (unchanged semantics)
  const books = [
  { 
    id: 1, 
    title: "Advanced Calculus", 
    category: "Mathematics", 
    author: "Dr. Smith", 
    pages: 450, 
    sales: 1240, 
    status: "Published",
    price: "Free"
  },
  { 
    id: 2, 
    title: "Quantum Physics", 
    category: "Physics", 
    author: "Prof. Johnson", 
    pages: 520, 
    sales: 980, 
    status: "Published",
    price: "₹999"
  },
  { 
    id: 3, 
    title: "Machine Learning", 
    category: "CS", 
    author: "Dr. Chen", 
    pages: 380, 
    sales: 2150, 
    status: "Published",
    price: "₹1199"
  },
];


  const notes = [
    { id: 1, title: "Calculus Quick Reference", category: "Mathematics", author: "Prof. Smith", downloads: 2450, price: "Free" },
    { id: 2, title: "Quantum Mechanics Notes", category: "Physics", author: "Dr. Johnson", downloads: 1890, price: "$4.99" },
  ];

  // Helpers
function cryptoSafeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}


const handleAddQuestion = () => {
  const newQ: MCQ = {
    id: cryptoSafeId(),
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    answer: ""
  };

  setQuestions(prev => {
    const next = [...prev, newQ];
    setCurrentIndex(next.length - 1);   // move to new question
    return next;
  });
};

const handleRemoveQuestion = (id: string) => {
  if (questions.length === 1) return; // prevent removing the last question

  const indexToRemove = questions.findIndex(q => q.id === id);
  if (indexToRemove === -1) return;

  setQuestions(prev => {
    const updated = prev.filter(q => q.id !== id);

    if (currentIndex >= updated.length) {
      setCurrentIndex(Math.max(0, updated.length - 1));
    }

    return updated;
  });
};

  const handleChangeQuestion = (id: string, field: keyof MCQ, value: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  // Auto-focus newly added question's input
  useEffect(() => {
    if (questions.length > 0) {
      const last = questions[questions.length - 1];
      // slight timeout to ensure element mounted
      setTimeout(() => {
        const el = questionInputRefs.current[last.id];
        if (el) el.focus();
      }, 80);
    }
  }, [questions.length]);

  // Drag & Drop handlers for reorder (HTML5)
  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragItemId.current = id;
    e.dataTransfer.effectAllowed = "move";
    // subtle drag image
    const crt = document.createElement("div");
    crt.textContent = "";
    e.dataTransfer.setDragImage(crt, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const srcId = dragItemId.current;
    if (!srcId || srcId === targetId) return;
    setQuestions((prev) => {
      const copy = [...prev];
      const srcIndex = copy.findIndex((q) => q.id === srcId);
      const tgtIndex = copy.findIndex((q) => q.id === targetId);
      if (srcIndex === -1 || tgtIndex === -1) return prev;
      const [moved] = copy.splice(srcIndex, 1);
      copy.splice(tgtIndex, 0, moved);
      return copy;
    });
    dragItemId.current = null;
  };

  // minimal validation placeholder for Publish (not changing functionality)
  const handleUploadPublish = () => {
    // you can wire up API here
    console.log("Publish content:", { contentType, questions });
    setShowUploadDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1d4d6a] mb-1">Content Management</h2>
          <p className="text-sm text-gray-500">Upload and manage books, notes, and tests</p>
        </div>

        <Button onClick={() => setShowUploadDialog(true)} className="bg-[#bf2026] hover:bg-[#a01c22] text-white gap-2">
          <Plus className="w-4 h-4" />
          Upload Content
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="books" className="w-full">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="books">E-Books</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="tests">Mock Tests</TabsTrigger>
        </TabsList>

        {/* E-BOOKS */}
        <TabsContent value="books" className="mt-6">
          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="space-y-3">
                {books.map((book) => (
                  <div key={book.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-16 bg-gradient-to-br from-[#1d4d6a] to-[#2a5f7f] rounded flex items-center justify-center text-2xl">
                        📘
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[#1d4d6a] mb-1">{book.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{book.author}</span>
                          <span>•</span>
                          <Badge className="bg-blue-100 text-blue-700">{book.category}</Badge>
                          <span>•</span>
                          <span>{book.pages} pages</span>
                          <span>•</span>
                          <span>{book.sales} sales</span>
                          <span>•</span>
                          <span>{book.price}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-700">{book.status}</Badge>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditItem({ ...book, type: "book" });
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => {
                          setDeleteItem({ ...book, type: "book" });
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTES */}
        <TabsContent value="notes" className="mt-6">
          <Card className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-16 bg-gradient-to-br from-[#1d4d6a] to-[#2a5f7f] rounded flex items-center justify-center text-2xl">📝</div>
                      <div className="flex-1">
                        <h4 className="text-[#1d4d6a] mb-1">{note.title}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{note.author}</span>
                          <span>•</span>
                          <Badge className="bg-blue-100 text-blue-700">{note.category}</Badge>
                          <span>•</span>
                          <span>{note.downloads} downloads</span>
                          <span>•</span>
                          <span>{note.price}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditItem({ ...note, type: "note" });
                          setShowEditDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => {
                          setDeleteItem({ ...note, type: "note" });
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TESTS */}
        <TabsContent value="tests" className="mt-6">
          <Card className="border-none shadow-md">
            <CardContent className="p-6 text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No mock tests created yet</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---------------- Upload Dialog (Premium) ---------------- */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-[#1d4d6a]">Upload New Content</DialogTitle>
          </DialogHeader>

          {/* SCROLLABLE AREA */}
          <div className="space-y-4 p-1 overflow-y-auto pr-2 flex-1">
            {/* Content Type */}
            <div>
              <Label>Content Type</Label>
<select
  value={contentType}
  onChange={(e) => setContentType(e.target.value as ContentType)}
  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
>
  <option value="E-Book">E-Book</option>
  <option value="Notes">Notes</option>
  <option value="Mock Test">Mock Test</option>
</select>

            </div>

            {/* Title & Author */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input placeholder="Enter title" />
              </div>

              <div>
                <Label>Author</Label>
                <Input placeholder="Enter author name" />
              </div>
            </div>

            {/* Category & Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Computer Science</option>
                  <option>Chemistry</option>
                </select>
              </div>

              {contentType !== "Mock Test" && (
                <div>
                  <Label>Price</Label>
                  <Input placeholder="$0.00 (Free)" />
                </div>
              )}
            </div>

{/* MCQ SECTION WITH PAGINATION */}
{contentType === "Mock Test" && (
  <section className="space-y-4 p-4 border rounded-lg bg-gray-50">
    <h3 className="text-lg font-semibold text-[#1d4d6a]">
      MCQ Questions
    </h3>

    {/* Current Question Display */}
    {questions.length > 0 && (
      <div className="bg-white shadow-sm border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-medium text-[#1d4d6a]">
            Question {currentIndex + 1} of {questions.length}
          </p>

<Button
  variant="outline"
  size="sm"
  className="text-red-600"
  onClick={() => handleRemoveQuestion(questions[currentIndex].id)}
>
  Remove
</Button>

        </div>

        {/* Question Input */}
        <div className="mb-4">
          <Label>Question</Label>
          <Input
            placeholder="Enter question text"
            value={questions[currentIndex].question}
            onChange={(e) =>
              handleChangeQuestion(
                questions[currentIndex].id,
                "question",
                e.target.value
              )
            }
          />
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Option A</Label>
            <Input
              value={questions[currentIndex].optionA}
              onChange={(e) =>
                handleChangeQuestion(
                  questions[currentIndex].id,
                  "optionA",
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <Label>Option B</Label>
            <Input
              value={questions[currentIndex].optionB}
              onChange={(e) =>
                handleChangeQuestion(
                  questions[currentIndex].id,
                  "optionB",
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <Label>Option C</Label>
            <Input
              value={questions[currentIndex].optionC}
              onChange={(e) =>
                handleChangeQuestion(
                  questions[currentIndex].id,
                  "optionC",
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <Label>Option D</Label>
            <Input
              value={questions[currentIndex].optionD}
              onChange={(e) =>
                handleChangeQuestion(
                  questions[currentIndex].id,
                  "optionD",
                  e.target.value
                )
              }
            />
          </div>
        </div>

        {/* Correct Answer */}
        <div className="mt-4">
          <Label>Correct Answer</Label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            value={questions[currentIndex].answer}
            onChange={(e) =>
              handleChangeQuestion(
                questions[currentIndex].id,
                "answer",
                e.target.value as MCQ["answer"]
              )
            }
          >
            <option value="">Select an option</option>
            <option value="A">Option A</option>
            <option value="B">Option B</option>
            <option value="C">Option C</option>
            <option value="D">Option D</option>
          </select>
        </div>
      </div>
    )}

    {/* Pagination Buttons */}
    {questions.length > 0 && (
      <div className="flex justify-between mt-2">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((prev) => prev - 1)}
        >
          Previous
        </Button>

        <Button
          variant="outline"
          disabled={currentIndex === questions.length - 1}
          onClick={() => setCurrentIndex((prev) => prev + 1)}
        >
          Next
        </Button>
      </div>
    )}

    {/* Add Question Button */}
    <Button
      onClick={handleAddQuestion}
      className="bg-[#1d4d6a] hover:bg-[#163c52] text-white w-full"
    >
      + Add More Questions
    </Button>
  </section>
)}


            {/* File Upload */}
            <div>
              <Label>Upload File</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#bf2026] transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">PDF, EPUB up to 50MB</p>
              </div>
            </div>
          </div>

          {/* BUTTONS (fixed at bottom) */}
          <div className="flex gap-3 pt-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>

            <Button className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white" onClick={handleUploadPublish}>
              Upload & Publish
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* ---------------- Edit Dialog ---------------- */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1d4d6a]">Edit Content</DialogTitle>
          </DialogHeader>

          {editItem && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input defaultValue={editItem.title} />
              </div>

              <div>
                <Label>Author</Label>
                <Input defaultValue={editItem.author} />
              </div>

              <div>
                <Label>Category</Label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                  <option>{editItem.category}</option>
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>CS</option>
                </select>
              </div>
              <div>
                <Label>Price</Label>
                <Input defaultValue={editItem.price} />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea defaultValue={editItem.description || ""} className="min-h-[100px]" />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>

                <Button className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white">Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------------- Delete Confirmation Dialog ---------------- */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirm Delete</DialogTitle>
          </DialogHeader>

          {deleteItem && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete
                <span className="font-semibold text-[#1d4d6a]"> “{deleteItem.title}” </span>?
                This action cannot be undone.
              </p>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>

                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    console.log("Deleted:", deleteItem);
                    setShowDeleteDialog(false);
                    setDeleteItem(null);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
