import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Search, Eye, BookOpen, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import PDFJSViewer from "../PDFJSViewer";
import * as React from "react";

interface NotesRepositoryProps {
  onNavigate: (view: string, id?: string) => void;
}

export default function NotesRepository({ onNavigate }: NotesRepositoryProps) {
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [notes, setNotes] = useState<any[]>([]);
  const [downloaded, setDownloaded] = useState<number[]>([]);
  const [purchased, setPurchased] = useState<number[]>([]);
  const [loading, setLoading] = useState({
    initial: true,
    notes: false,
    preview: false,
    cart: false,
    download: false,
    purchase: false
  });
  const [searchText, setSearchText] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const previewLimit = 2; // lock after page 2

  const getToken = () => localStorage.getItem("token");

  /* ---------------------------------------------------------
      RESET PAGE WHEN MODAL OPENS
  ----------------------------------------------------------*/
  const wasOpen = useRef(false);

  useEffect(() => {
    if (showPreview && !wasOpen.current) {
      setCurrentPage(1);
    }
    wasOpen.current = showPreview;
  }, [showPreview]);

  /* ---------------------------------------------------------
      ADD TO CART
  ----------------------------------------------------------*/
  const addToCart = async (noteId: number) => {
    const token = getToken();
    if (!token) return onNavigate("login");

    try {
      setLoading(prev => ({ ...prev, cart: true }));
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/cart/add`,
        { note_id: noteId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Note added to cart ✓");
      window.dispatchEvent(new CustomEvent("cart:changed"));
    } catch (err) {
      console.error("addToCart error:", err);
      toast.error("Failed to add note to cart");
    } finally {
      setLoading(prev => ({ ...prev, cart: false }));
    }
  };

  /* ---------------------------------------------------------
      BUY NOW
  ----------------------------------------------------------*/
  const buyNow = (noteId: number) => {
    const token = getToken();
    if (!token) return onNavigate("login");

    const note = notes.find((n) => n.id === noteId);

    if (!note) {
      toast.error("Note not found");
      return;
    }

    // ✅ FREE NOTE (price is 0, "0", or "Free") → open directly in reader
    const isFree =
      !note.price ||
      note.price === "Free" ||
      note.price === "free" ||
      Number(note.price) === 0;

    if (isFree) {
      toast.success("Free note opened 📘");
      onNavigate("reader-note", String(noteId));
      return;
    }

    // 🔒 PAID NOTE → PURCHASE FLOW
    localStorage.setItem("purchaseType", "note");
    localStorage.setItem("purchaseId", String(noteId));
    localStorage.setItem(
      "purchaseItems",
      JSON.stringify([{ type: "note", id: noteId, note }])
    );
    localStorage.setItem("previousSection", "notes");

    onNavigate("purchase", String(noteId));
  };


  /* ---------------------------------------------------------
      FETCH NOTES + PURCHASED + DOWNLOADED
  ----------------------------------------------------------*/
  const loadNotes = async () => {
    try {
      setLoading(prev => ({ ...prev, notes: true }));
      const notesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/notes`, {
        params: {
          category: activeCategory !== "All" ? activeCategory : undefined,
          search: searchText || undefined,
        },
      });

      setNotes(notesRes.data || []);

      const token = getToken();

      if (token) {
        try {
          const purchasedRes = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/purchases/purchased/note-ids`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const ids = Array.isArray(purchasedRes.data)
            ? purchasedRes.data.map(Number)
            : [];

          setPurchased(ids.filter((id) => !Number.isNaN(id)));
        } catch (err) {
          console.error("Failed purchased:", err);
        }
      } else {
        setPurchased([]);
      }
    } catch (err) {
      console.error("Failed to load notes:", err);
      toast.error("Failed to load notes");
    } finally {
      setLoading(prev => ({
        ...prev,
        notes: false,
        initial: false
      }));
    }
  };

  useEffect(() => {
    loadNotes();
  }, [activeCategory]);

  /* ---------------------------------------------------------
      SEARCH WITH DEBOUNCE
  ----------------------------------------------------------*/
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);

    setLoading(prev => ({ ...prev, notes: true }));

    const timeout = setTimeout(() => {
      loadNotes();
    }, 500);

    setSearchTimeout(timeout);

    return () => clearTimeout(timeout);
  }, [searchText]);

  /* ---------------------------------------------------------
      READ NOTE
  ----------------------------------------------------------*/
  const readNote = async (noteId: number) => {
    const token = getToken();
    if (!token) return onNavigate("login");

    onNavigate("reader-note", String(noteId));
  };

  /* ---------------------------------------------------------
      DOWNLOAD NOTE
  ----------------------------------------------------------*/
  const downloadNote = async (noteId: number) => {
    const token = getToken();
    if (!token) return onNavigate("login");

    try {
      setLoading(prev => ({ ...prev, download: true }));
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/notes/${noteId}/download`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.data?.file_url) {
        toast.error("Download not available");
        return;
      }

      window.open(res.data.file_url, "_blank");
      toast.success("Download started");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Download failed");
    } finally {
      setLoading(prev => ({ ...prev, download: false }));
    }
  };

  /* ---------------------------------------------------------
      PREVIEW NOTE
  ----------------------------------------------------------*/
  const handlePreview = async (note: any) => {
    try {
      setShowPreview(true);
      setSelectedNote({
        ...note,
        previewUrl: `${import.meta.env.VITE_API_URL}/api/notes/${note.id}/preview-pdf`,
        purchased:
          purchased.includes(note.id) ||
          note.price === 0 ||
          note.price === "Free",
      });
      setCurrentPage(1);
    } catch (err) {
      console.error("Preview error:", err);
      toast.error("Failed to load preview");
    }
  };

  /* ---------------------------------------------------------
      PAGE CHANGE (ENFORCE LOCK)
  ----------------------------------------------------------*/
  function changePage(pg: number) {
    if (pg < 1 || pg > totalPages) return;

    if (!selectedNote?.purchased && pg > previewLimit) {
      toast.error("Preview limit reached. Purchase to continue.");
      return;
    }

    setCurrentPage(pg);
  }

  /* ---------------------------------------------------------
      RENDER LOADING SPINNER
  ----------------------------------------------------------*/
  const renderSpinner = (text: string = "Loading...") => (
    <div className="flex justify-center items-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a] mb-3"></div>
        <p className="text-gray-500">{text}</p>
      </div>
    </div>
  );

  /* =========================================================
      UI RENDER
  ==========================================================*/
  const categories = ["All", ...new Set(notes.map((n) => n.category))];

  return (
    <div className="space-y-6 p-4">
      {/* HEADER */}
      <div>
        <h2 className="text-[#1d4d6a] text-xl sm:text-2xl font-bold mb-1">Notes Repository</h2>
        <p className="text-sm text-gray-500">
          Access high-quality academic notes
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
          {loading.notes && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category}
            variant="outline"
            onClick={() => setActiveCategory(category)}
            disabled={loading.notes}
            className={
              activeCategory === category
                ? "bg-[#bf2026] text-white hover:bg-[#a01c22]"
                : "hover:bg-gray-100"
            }
          >
            {category}
          </Button>
        ))}
      </div>

      {/* INITIAL LOADING */}
      {loading.initial ? (
        renderSpinner("Loading notes...")
      ) : notes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchText
            ? `No notes found for "${searchText}"`
            : "No notes available yet."}
        </div>
      ) : loading.notes ? (
        renderSpinner("Searching notes...")
      ) : (
        /* LIST */
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id} className="shadow-md hover:shadow-lg transition">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-24 bg-gradient-to-br from-[#1d4d6a] to-[#2a5f7f] rounded flex items-center justify-center text-3xl">
                    📝
                  </div>

                  <div className="flex-1">
                    <h4 className="text-[#1d4d6a] text-base sm:text-lg font-semibold">{note.title}</h4>
                    <p className="text-sm text-gray-500">by {note.author}</p>
                    <span className="text-xs text-gray-500">{note.pages} pages</span>

                    {/* ⭐ ACTION BUTTONS */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {/* PREVIEW */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(note)}
                        disabled={loading.preview}
                        className="flex items-center gap-1"
                      >
                        {loading.preview ? (
                          <>
                            <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            Preview
                          </>
                        )}
                      </Button>

                      {/* PURCHASED */}
                      {purchased.includes(note.id) ? (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                          onClick={() => readNote(note.id)}
                        >
                          <BookOpen className="w-3 h-3" />
                          Read
                        </Button>
                      ) : note.price === "Free" ||
                        note.price === "free" ||
                        Number(note.price) === 0 ? (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => readNote(note.id)}
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          Read Free
                        </Button>

                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => addToCart(note.id)}>
                            Add to Cart
                          </Button>

                          <Button
                            size="sm"
                            className="bg-[#bf2026] text-white hover:bg-[#a01c22] flex items-center gap-1"
                            onClick={() => buyNow(note.id)}
                            disabled={loading.purchase}
                          >
                            Buy ₹{note.price}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1d4d6a] text-lg sm:text-xl">
              {selectedNote?.title || "Preview"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedNote?.author} • {selectedNote?.category}
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 border rounded-lg bg-white h-[55vh] overflow-auto">
            {loading.preview ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a] mb-3"></div>
                  <p className="text-gray-500">Loading preview...</p>
                </div>
              </div>
            ) : !selectedNote ? (
              <p className="text-center py-10 text-gray-600">No preview available</p>
            ) : selectedNote.previewUrl ? (
              <>
                {/* PDF VIEWER */}
                <PDFJSViewer
                  url={selectedNote.previewUrl}
                  page={currentPage}
                  scale={1.1}
                  purchased={selectedNote.purchased}
                  isLocked={!selectedNote.purchased}
                  previewPages={2}
                  bookId={selectedNote.id}
                  onBuyClick={() => buyNow(selectedNote.id)}
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
                    className="flex items-center gap-1"
                  >
                    Prev
                  </Button>

                  <p className="text-sm text-gray-500">
                    Page {currentPage} / {totalPages}
                  </p>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                      const next = currentPage + 1;

                      if (!selectedNote.purchased && next > 2) {
                        setCurrentPage(next);
                        return;
                      }

                      setCurrentPage(next);
                    }}
                    className="flex items-center gap-1"
                  >
                    Next
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">No preview available</p>

                {selectedNote.price > 0 && (
                  <Button
                    className="bg-[#bf2026] text-white hover:bg-[#a01c22]"
                    onClick={() => buyNow(selectedNote.id)}
                  >
                    Buy ₹{selectedNote.price}
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}