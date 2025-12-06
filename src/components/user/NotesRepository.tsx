import { useState, useEffect,useMemo } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Search, Eye, Star, CheckCircle, BookOpen } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import * as React from "react";

export default function NotesRepository({ onNavigate }: any) {
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [notes, setNotes] = useState<any[]>([]);
  const [downloaded, setDownloaded] = useState<number[]>([]);
  const [purchased, setPurchased] = useState<number[]>([]); // ✅ NEW: Track purchased notes
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

const token = localStorage.getItem("token");



  /* ----------------------------------------
     ⭐ ADD TO CART FOR NOTES
  ---------------------------------------- */
  const addToCart = async (noteId: number) => {
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
      console.error(err);
      toast.error("Failed to add note to cart");
    }
  };

  /* ----------------------------------------
     ⭐ BUY NOW - FIXED VERSION
     - Sets ALL required purchase data
     - Navigates to purchase page
  ---------------------------------------- */
const buyNow = (noteId: number) => {
  const note = notes.find((n) => n.id === noteId);
  if (!note) {
    toast.error("Note not found");
    return;
  }

  // store purchase info
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

  // 👇 Correct navigation + URL management
  onNavigate("purchase", String(noteId));
};



  /* ----------------------------------------
     Fetch Notes + Downloaded Notes + Purchased Notes
  ---------------------------------------- */
  useEffect(() => {
    const loadData = async () => {
      try {
        const notesRes = await axios.get("https://ebook-backend-lxce.onrender.com/api/notes", {
          params: {
            category: activeCategory !== "All" ? activeCategory : undefined,
            search: searchText || undefined,
          },
        });
        setNotes(notesRes.data);

        if (token) {
          // Get downloaded notes
          const downloadedRes = await axios.get(
            "https://ebook-backend-lxce.onrender.com/api/notes/downloaded",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const downloadedIds = downloadedRes.data.map((d: any) => d.note.id);
          setDownloaded(downloadedIds);

        
          // ✅ NEW: Get purchased notes
        // Get purchased notes
// purchased notes
const purchasedRes = await axios.get(
  "https://ebook-backend-lxce.onrender.com/api/purchase/purchased/note-ids",
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

console.log("Purchased Raw:", purchasedRes.data);

let purchasedIds: number[] = [];

// case: [1,2,3]
if (Array.isArray(purchasedRes.data)) {
  purchasedIds = purchasedRes.data.map((id) => Number(id));
}

// case: { ids: [1,2,3] }
else if (Array.isArray(purchasedRes.data?.ids)) {
  purchasedIds = purchasedRes.data.ids.map((id) => Number(id));
}

// fallback
setPurchased(purchasedIds);


        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // ✅ NEW: Listen for purchase events to refresh
    const handleRefresh = () => loadData();
    window.addEventListener("refresh-purchased", handleRefresh);

    return () => {
      window.removeEventListener("refresh-purchased", handleRefresh);
    };
  }, [activeCategory, searchText, token]);

  /* ----------------------------------------
     ⭐ READ NOTE (for purchased notes)
     Opens the note in a new tab or modal
  ---------------------------------------- */
 const readNote = async (noteId: number) => {
  if (!token) return onNavigate("login");

  try {
    // (optional) you can even skip this fetch, because ReadNotePage
    // will call /api/notes/:id again anyway – but it's fine to keep
    const res = await axios.get(`https://ebook-backend-lxce.onrender.com/api/notes/${noteId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const noteData = res.data?.note || res.data;

    if (!noteData?.file_url) {
      toast.error("Note file not found");
      return;
    }

    // optional – if you want to reuse cached data
    localStorage.setItem("currentNoteData", JSON.stringify(noteData));

    // ✅ CORRECT: let App handle route + history
    onNavigate("reader-note", String(noteId));
    // ❌ remove this manual pushState, App already does it:
    // window.history.pushState({}, "", `/notes/read/${noteId}`);
  } catch (err: any) {
    console.error("Read note error:", err);
    toast.error(err?.response?.data?.error || "Failed to read note");
  }
};

  /* ----------------------------------------
     ⭐ DOWNLOAD NOTE
  ---------------------------------------- */
  const downloadNote = async (noteId: number) => {
    try {
      const res = await axios.post(
        `https://ebook-backend-lxce.onrender.com/api/notes/${noteId}/download`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      window.open(res.data.file_url, "_blank");

      if (!downloaded.includes(noteId)) {
        setDownloaded((prev) => [...prev, noteId]);
      }

      toast.success("Download started");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Download failed");
    }
  };

 const handlePreview = async (note: any) => {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.get(
      `https://ebook-backend-lxce.onrender.com/api/notes/${note.id}`,
      token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined
    );

    setSelectedNote({
      ...note,
      preview_content: res.data.preview_content
    });

    setShowPreview(true);

  } catch (err) {
    console.error("Preview load failed:", err);
    toast.error("Failed to load preview");
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

      {/* Category Buttons */}
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

      {/* Notes List */}
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
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" /> {note.rating}
                    </span>
                    <span>{note.downloads} downloads</span>
                  </div>

                  {/* ⭐ ACTION BUTTONS */}
                  <div className="flex gap-2 mt-3">
                    {/* Preview */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(note)}
                    >
                      <Eye className="w-3 h-3 mr-2" /> Preview
                    </Button>

                    {/* ✅ PURCHASED - Show Read button */}
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
) : selectedNote.preview_content ? (
  <div
    className="prose max-w-none text-sm leading-relaxed"
    dangerouslySetInnerHTML={{
     __html: selectedNote?.preview_content?.trim()
  ? selectedNote.preview_content
  : "<p>No preview available.</p>"

    }}
  />
) : (
  <p className="text-gray-500">No preview available.</p>
)}
</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}