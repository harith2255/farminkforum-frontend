import { useState, useEffect,useRef } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Search, Eye, Star, BookOpen } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);



  const getToken = () => localStorage.getItem("token");

  /* ----------------------------------------
     ⭐ ADD TO CART FOR NOTES
  ---------------------------------------- */
  const addToCart = async (noteId: number) => {
    const token = getToken();
    if (!token) return onNavigate("login");

    try {
      await axios.post(
        "https://ebook-backend-lxce.onrender.com/api/cart/add",
        { note_id: noteId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Note added to cart ✓");
      window.dispatchEvent(new CustomEvent("cart:changed"));
    } catch (err) {
      console.error("addToCart error:", err);
      toast.error("Failed to add note to cart");
    }
  };

const prevOpen = useRef(false);

useEffect(() => {
  if (showPreview && !prevOpen.current) {
    setCurrentPage(1);
  }
  prevOpen.current = showPreview;
}, [showPreview]);



  /* ----------------------------------------
     ⭐ BUY NOW
  ---------------------------------------- */
  const buyNow = (noteId: number) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) {
      toast.error("Note not found");
      return;
    }

    localStorage.setItem("purchaseType", "note");
    localStorage.setItem("purchaseId", String(noteId));
    localStorage.setItem(
      "purchaseItems",
      JSON.stringify([
        {
          type: "note",
          id: noteId,
          note,
        },
      ])
    );
    localStorage.setItem("previousSection", "notes");

    onNavigate("purchase", String(noteId));
  };

  /* ----------------------------------------
     Fetch Notes + Downloaded Notes + Purchased Notes
  ---------------------------------------- */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const notesRes = await axios.get("https://ebook-backend-lxce.onrender.com/api/notes", {
          params: {
            category: activeCategory !== "All" ? activeCategory : undefined,
            search: searchText || undefined,
          },
        });

        setNotes(Array.isArray(notesRes.data) ? notesRes.data : []);

        const token = getToken();
        if (token) {
          try {
            const downloadedRes = await axios.get(
              "https://ebook-backend-lxce.onrender.com/api/notes/downloaded",
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const ids = Array.isArray(downloadedRes.data)
              ? downloadedRes.data
                  .map((d: any) => d.note?.id)
                  .filter((id: any) => typeof id === "number")
              : [];

            setDownloaded(ids);
          } catch (err) {
            console.error("Failed to load downloaded notes:", err);
          }

          try {
            const purchasedRes = await axios.get(
              "https://ebook-backend-lxce.onrender.com/api/purchase/purchased/note-ids",
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            let purchasedIds: number[] = [];

            if (Array.isArray(purchasedRes.data)) {
              purchasedIds = purchasedRes.data.map((id) => Number(id));
            } else if (Array.isArray(purchasedRes.data?.ids)) {
              purchasedIds = purchasedRes.data.ids.map((id: any) =>
                Number(id)
              );
            }

            setPurchased(purchasedIds.filter((id) => !Number.isNaN(id)));
          } catch (err) {
            console.error("Failed to load purchased notes:", err);
          }
        } else {
          setDownloaded([]);
          setPurchased([]);
        }
      } catch (err) {
        console.error("Failed to load notes:", err);
        toast.error("Failed to load notes");
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const handleRefresh = () => loadData();
    window.addEventListener("refresh-purchased", handleRefresh);

    return () => {
      window.removeEventListener("refresh-purchased", handleRefresh);
    };
  }, [activeCategory, searchText]);

  /* ----------------------------------------
     ⭐ READ NOTE
  ---------------------------------------- */
  const readNote = async (noteId: number) => {
    const token = getToken();
    if (!token) return onNavigate("login");

    onNavigate("reader-note", String(noteId));
  };

  /* ----------------------------------------
     ⭐ DOWNLOAD NOTE
  ---------------------------------------- */
  const downloadNote = async (noteId: number) => {
    const token = getToken();
    if (!token) return onNavigate("login");

    try {
      const res = await axios.post(
        `https://ebook-backend-lxce.onrender.com/api/notes/${noteId}/download`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.data?.file_url) {
        toast.error("Download not available");
        return;
      }

      window.open(res.data.file_url, "_blank");

      if (!downloaded.includes(noteId)) {
        setDownloaded((prev) => [...prev, noteId]);
      }

      toast.success("Download started");
    } catch (err: any) {
      console.error("Download failed:", err);
      toast.error(err?.response?.data?.error || "Download failed");
    }
  };

  /* ----------------------------------------
     ⭐ PREVIEW NOTE (PDF)
  ---------------------------------------- */
 const handlePreview = async (note: any) => {
  try {
    setCurrentPage(1);
    setTotalPages(null);
    

    const previewUrl = `https://ebook-backend-lxce.onrender.com/api/notes/${note.id}/preview-pdf`;

    setSelectedNote({
      ...note,
      previewUrl,
    });

    setShowPreview(true);
  } catch (err) {
    console.error("Preview load failed:", err);
    toast.error("Preview not available");
  }
};

  if (loading) return <p className="p-6 text-center">Loading notes...</p>;

  const categories = ["All", ...new Set(notes.map((n) => n.category))];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-[#1d4d6a] mb-1">Notes Repository</h2>
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
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category}
            variant="outline"
            onClick={() => setActiveCategory(category)}
            className={
              activeCategory === category ? "bg-[#bf2026] text-white" : ""
            }
          >
            {category}
          </Button>
        ))}
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {notes.map((note) => (
          <Card key={note.id} className="shadow-md">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-20 h-24 bg-gradient-to-br from-[#1d4d6a] to-[#2a5f7f] rounded flex items-center justify-center text-3xl">
                  📝
                </div>

                <div className="flex-1">
                  <h4 className="text-[#1d4d6a]">{note.title}</h4>
                  <p className="text-sm text-gray-500">by {note.author}</p>

                  <div className="flex gap-4 text-xs mt-2">
                    <span>{note.pages} pages</span>
                    {/* <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" /> {note.rating}
                    </span>
                    <span>{note.purchased} purchased</span> */}
                  </div>

                  {/* ⭐ ACTION BUTTONS */}
                  <div className="flex gap-2 mt-3">
                    {/* PREVIEW */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(note)}
                    >
                      <Eye className="w-3 h-3 mr-2" /> Preview
                    </Button>

                    {/* PURCHASED */}
                    {purchased.includes(note.id) ? (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => readNote(note.id)}
                      >
                        <BookOpen className="w-3 h-3 mr-1" /> Read
                      </Button>
                    ) : note.price === "Free" || note.price === 0 ? (
                      <Button
                        size="sm"
                        className="bg-[#bf2026] text-white"
                        onClick={() => downloadNote(note.id)}
                      >
                        Download Free
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToCart(note.id)}
                        >
                          Add to Cart
                        </Button>

                        <Button
                          size="sm"
                          className="bg-[#bf2026] text-white"
                          onClick={() => buyNow(note.id)}
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

     {/* Preview Modal */}
<Dialog open={showPreview} onOpenChange={setShowPreview}>
  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>{selectedNote?.title}</DialogTitle>
      <DialogDescription>
        {selectedNote?.author} • {selectedNote?.category}
      </DialogDescription>
    </DialogHeader>

    <div className="p-4 border rounded-lg">
      {!selectedNote ? (
        <p>Loading preview...</p>
      ) : selectedNote.previewUrl ? (
        <>
          {/* PDF VIEWER */}
          <PDFJSViewer
            url={selectedNote.previewUrl}
            page={currentPage}
            scale={1.2}
            onTotalPages={setTotalPages}
            onPageChange={setCurrentPage}
            previewPages={2}
            isLocked={true}
            bookId={selectedNote.id}
            onBuyClick={() => buyNow(selectedNote.id)}
          />

          {/* PAGINATION */}
      <div className="flex items-center justify-between mt-3">
  <Button
  size="sm"
  variant="outline"
  disabled={currentPage <= 1}
  onClick={() => setCurrentPage((p) => p - 1)}
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
  onClick={() => setCurrentPage((p) => p + 1)}
>
  Next
</Button>

</div>

        </>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">No preview available.</p>

          {selectedNote.price > 0 && (
            <Button
              className="bg-[#bf2026] text-white"
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