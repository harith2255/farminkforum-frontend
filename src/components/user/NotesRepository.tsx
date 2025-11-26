import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Search, Eye, Star, CheckCircle } from 'lucide-react';
import axios from "axios";
import { toast } from "sonner";
import * as React from 'react';

export default function NotesRepository({ onNavigate }: any) {
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [notes, setNotes] = useState<any[]>([]);
  const [downloaded, setDownloaded] = useState<number[]>([]);
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
     ⭐ BUY NOW
     - Sets mode to note purchase
     - Navigates to purchase page
  ---------------------------------------- */
 const buyNow = (noteId: number) => {
  localStorage.setItem("purchaseType", "note");
  localStorage.setItem("purchaseId", noteId.toString());

  // Mark previous page so purchase page can go back
  localStorage.setItem("previousSection", "notes");

  // Navigate using your manual routing
  onNavigate("purchase");

  // Update URL to show dynamic ID (visual only)
  window.history.pushState({}, "", `/purchase/${noteId}`);
};

  /* ----------------------------------------
     Fetch Notes + Downloaded Notes
  ---------------------------------------- */
  useEffect(() => {
    const loadData = async () => {
      try {
        const notesRes = await axios.get("https://ebook-backend-lxce.onrender.com/api/notes", {
          params: {
            category: activeCategory !== "All" ? activeCategory : undefined,
            search: searchText || undefined
          }
        });
        setNotes(notesRes.data);

        if (token) {
          const downloadedRes = await axios.get(
            "https://ebook-backend-lxce.onrender.com/api/notes/downloaded",
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const downloadedIds = downloadedRes.data.map((d: any) => d.note.id);
          setDownloaded(downloadedIds);
        }

      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeCategory, searchText]);

  /* ----------------------------------------
     Download note
  ---------------------------------------- */
  const downloadNote = async (noteId: number) => {
    try {
      const res = await axios.get(
        `https://ebook-backend-lxce.onrender.com/api/notes/download/${noteId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      window.open(res.data.file_url, "_blank");

      if (!downloaded.includes(noteId)) {
        setDownloaded(prev => [...prev, noteId]);
      }
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Download failed");
    }
  };

  const handlePreview = (note: any) => {
    setSelectedNote(note);
    setShowPreview(true);
  };

  if (loading) return <p className="p-6 text-center">Loading notes...</p>;

  const categories = ["All", ...new Set(notes.map((n) => n.category))];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-[#1d4d6a] mb-1">Notes Repository</h2>
        <p className="text-sm text-gray-500">Access high-quality academic notes</p>
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
            className={activeCategory === category ? "bg-[#bf2026] text-white" : ""}
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
                    <Button variant="outline" size="sm" onClick={() => handlePreview(note)}>
                      <Eye className="w-3 h-3 mr-2" /> Preview
                    </Button>

                    {/* Already downloaded */}
                    {downloaded.includes(note.id) ? (
                      <Button size="sm" className="bg-green-600 text-white" onClick={() => downloadNote(note.id)}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Download
                      </Button>
                    ) : note.price === "Free" ? (
                      <Button size="sm" className="bg-[#bf2026] text-white" onClick={() => downloadNote(note.id)}>
                        Download Free
                      </Button>
                    ) : (
                      <>
                        {/* ⭐ ADD TO CART */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToCart(note.id)}
                        >
                          Add to Cart
                        </Button>

                        {/* ⭐ BUY NOW */}
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
            {selectedNote?.preview_content || <p>No preview available.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}