// ---------------------- MyLibrary.tsx ----------------------

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  BookOpen,
  Grid3x3,
  List,
  Search,
  Filter,
  FolderPlus,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import * as React from "react";

interface MyLibraryProps {
  onOpenBook: (book: any) => void;
}

export function MyLibrary({ onOpenBook }: MyLibraryProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [collectionName, setCollectionName] = useState("");

  const [isAddToCollectionOpen, setIsAddToCollectionOpen] = useState(false);
  const [bookToAdd, setBookToAdd] = useState<any>(null);

  const [books, setBooks] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [editCollectionName, setEditCollectionName] = useState("");

  const [openCollectionView, setOpenCollectionView] = useState(null);
  const [collectionBooks, setCollectionBooks] = useState([]);

  const [booksInCollections, setBooksInCollections] = useState<Set<string>>(new Set());

  // AUTH TOKEN
  const getAuthHeaders = () => {
    const token =
      localStorage.getItem("token") ||
      JSON.parse(localStorage.getItem("session") || "{}")?.access_token;

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // LOAD LIBRARY
  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const headers = getAuthHeaders();
        const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/library", {
          headers,
        });

        const formatted = res.data.map((entry) => {
          const e = entry.ebooks || entry;
          return {
            id: e.id,
book_id: entry.book_id,

            title: e.title,
            author: e.author,
            category: e.category,
            cover_url:
              entry.cover_url ||
              e.cover_url ||
              e.cover ||
              e.image ||
              "https://placehold.co/300x400",
            pages: e.pages,
            progress: Number(entry.progress ?? 0),
            purchased: entry.added_at,
          };
        });

        setBooks(formatted);
      } catch {
        toast.error("Failed to load library");
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, []);

 

  // LOAD BOOKS INSIDE A COLLECTION
  const loadCollectionBooks = async (collection) => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(
        `https://ebook-backend-lxce.onrender.com/api/library/collections/${collection.id}/books`,
        { headers }
      );
      setOpenCollectionView(collection);
      setCollectionBooks(res.data);
    } catch {
      toast.error("Failed to load collection books");
    }
  };

  // CREATE COLLECTION
  const handleCreateCollection = async () => {
    if (!collectionName.trim()) return toast.error("Name required");

    try {
      const headers = getAuthHeaders();
      await axios.post(
        "https://ebook-backend-lxce.onrender.com/api/library/collections",
        { name: collectionName },
        { headers }
      );

      toast.success("Collection created");
      setCollectionName("");
      setIsCollectionDialogOpen(false);
    } catch {
      toast.error("Failed to create collection");
    }
  };

  useEffect(() => {
  const loadCollections = async () => {
    try {
      const headers = getAuthHeaders();

      // 1. Load collections
      const res = await axios.get(
        "https://ebook-backend-lxce.onrender.com/api/library/collections",
        { headers }
      );

      setCollections(res.data);

      // 2. Load book ids for all collections
      const idsRes = await axios.get(
        "https://ebook-backend-lxce.onrender.com/api/library/collection/book-ids",
        { headers }
      );

      const ids = Array.isArray(idsRes.data)
        ? idsRes.data.map(String)
        : idsRes.data.bookIds?.map(String) || [];

      // 3. Initialize local state
      setBooksInCollections(new Set(ids.map(String)));


    } catch {
      toast.error("Failed to load collections");
    }
  };

  loadCollections();
}, [isCollectionDialogOpen, isAddToCollectionOpen]);


  // ADD BOOK → COLLECTION
  const handleAddBookToCollection = async (collectionId: string) => {
  try {
    const headers = getAuthHeaders();
    await axios.post(
      `https://ebook-backend-lxce.onrender.com/api/library/collections/${collectionId}/add`,
      { book_id: bookToAdd.id },
      { headers }
    );

    toast.success("Book added!");

    // local UI update
    setBooksInCollections(prev => {
      const updated = new Set(prev);
     updated.add(String(bookToAdd.id));
     window.dispatchEvent(new Event("collections:changed"));


      return updated;
    });

    // close modal
    setIsAddToCollectionOpen(false);
    setBookToAdd(null);

  } catch {
    toast.error("Failed to add book");
  }
};



  // REMOVE BOOK FROM COLLECTION
  const handleRemoveFromCollection = async (collectionId, bookId) => {
    try {
      const headers = getAuthHeaders();
      await axios.delete(
        `https://ebook-backend-lxce.onrender.com/api/library/collections/${collectionId}/remove/${bookId}`,
        { headers }
      );

      setCollectionBooks((prev) => prev.filter((b) => b.id !== bookId));
      toast.success("Removed");
      setBooksInCollections(prev => {
  const updated = new Set(prev);
  updated.delete(String(bookId));
  window.dispatchEvent(new Event("collections:changed"));

  return updated;
});


    } catch {
      toast.error("Remove failed");
    }
  };
// 📌 Reload library & collections together with correct formatting
async function loadLibrary() {
  try {
    const headers = getAuthHeaders();

    // fetch library items
    const libRes = await axios.get("https://ebook-backend-lxce.onrender.com/api/library", { headers });

    const formatted = (libRes.data || []).map((entry: any) => {
      const e = entry.ebooks || entry;
      return {
        id: e.id,
        book_id: entry.book_id,
        title: e.title,
        author: e.author,
        category: e.category,
        cover_url:
          entry.cover_url ||
          e.cover_url ||
          e.cover ||
          e.image ||
          "https://placehold.co/300x400",
        pages: e.pages,
        progress: Number(entry.progress ?? 0),
        purchased: entry.added_at,
      };
    });

    setBooks(formatted);

    // fetch collections
    const colRes = await axios.get("https://ebook-backend-lxce.onrender.com/api/library/collections", { headers });
    setCollections(colRes.data || []);

  } catch {
    console.warn("Failed to reload library");
  }
}




  // EDIT COLLECTION NAME
  const saveEditedCollection = async () => {
    try {
      const headers = getAuthHeaders();
      await axios.put(
        `https://ebook-backend-lxce.onrender.com/api/library/collections/${editingCollection.id}`,
        { name: editCollectionName },
        { headers }
      );

      setCollections((prev) =>
        prev.map((c) =>
          c.id === editingCollection.id
            ? { ...c, name: editCollectionName }
            : c
        )
      );

      setIsEditDialogOpen(false);
    } catch {
      toast.error("Rename failed");
    }
  };
  // ---------------------------------------------------
  // Reader event listeners (start/progress)
  // ---------------------------------------------------
  useEffect(() => {
    const onOpen = (e: any) => {
      const book = e.detail;
      if (!book) return;

      setBooks((prev) => prev);

      (async () => {
        try {
          const headers = getAuthHeaders();
          if (!headers.Authorization) return;
          await axios.post(
            "https://ebook-backend-lxce.onrender.com/api/library/read/start",
            { book_id: book.id },
            { headers }
          );
        } catch (err) {}
      })();
    };

   const onProgress = (e: any) => {
  const { id, page, totalPages } = e.detail || {};
  if (!id || !page || !totalPages) return;

  const percent = Math.min(100, Math.round((page / totalPages) * 100));

  // update UI immediately
  setBooks(prev =>
    prev.map(b =>
      b.id === id ? { ...b, progress: percent } : b
    )
  );

  (async () => {
    try {
      const headers = getAuthHeaders();
      
      // update progress & last page
      await axios.put(
        `https://ebook-backend-lxce.onrender.com/api/library/progress/${id}`,
        { 
          progress: percent,
          last_page: page
        },
        { headers }
      );

      // mark completed
      if (percent === 100) {
        await axios.put(
          `https://ebook-backend-lxce.onrender.com/api/library/complete/${id}`,
          {},
          { headers }
        );
      }

    } catch (err) {
      console.warn("Progress save failed:", err?.response?.data);
    }
  })();
};


    window.addEventListener("reader:open", onOpen);
    window.addEventListener("reader:progress", onProgress);

    // listen for library updates (e.g. from dashboard)
    const onLibraryUpdated = () => {
      // reload library & collections
      (async () => {
        try {
          const headers = getAuthHeaders();
          const [libRes, colRes] = await Promise.all([
            axios.get("https://ebook-backend-lxce.onrender.com/api/library", { headers }),
            axios.get("https://ebook-backend-lxce.onrender.com/api/library/collections", {
              headers,
            }),
          ]);

          const formatted = (libRes.data || []).map((entry: any) => {
            const e = entry.ebooks || entry;
            return {
              id: e.id,
book_id: entry.book_id,

              title: e.title,
              author: e.author,
              category: e.category,
              cover_url:
                entry.cover_url ||
                e.cover_url ||
                e.cover ||
                e.image ||
                "https://placehold.co/300x400",
              pages: e.pages,
              progress: Number(entry.progress ?? 0),
              purchased: entry.added_at,
            };
          });

          setBooks(formatted);
          setCollections(colRes.data || []);
        } catch {}
      })();
    };

    window.addEventListener("library:updated", onLibraryUpdated);

    return () => {
      window.removeEventListener("reader:open", onOpen);
      window.removeEventListener("reader:progress", onProgress);
      window.removeEventListener("library:updated", onLibraryUpdated);
    };
  }, []);

  // ---------------------------------------------------
  // Search
  // ---------------------------------------------------
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearch = (query: string) => {
    if (!query.trim()) {
      // reload original library
      (async () => {
        try {
          const headers = getAuthHeaders();
          const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/library", {
            headers,
          });

          const formatted = (res.data || []).map((entry: any) => {
            const e = entry.ebooks || entry;
            return {
              id: e.id,
book_id: entry.book_id,

              title: e.title,
              author: e.author,
              category: e.category,
              cover_url:
                entry.cover_url ||
                e.cover_url ||
                e.cover ||
                e.image ||
                "https://placehold.co/300x400",
              pages: e.pages,
              progress: Number(entry.progress ?? 0),
              purchased: entry.added_at,
            };
          });

          setBooks(formatted);
        } catch {}
      })();

      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const headers = getAuthHeaders();
        const res = await axios.get(
          `https://ebook-backend-lxce.onrender.com/api/library/search?query=${encodeURIComponent(
            query
          )}`,
          { headers }
        );

        const formatted = (res.data || []).map((entry: any) => {
          const e = entry.ebooks || entry;
          return {
            id: e.id,
book_id: entry.book_id,

            title: e.title,
            author: e.author,
            category: e.category,
            cover_url:
              entry.cover_url ||
              e.cover_url ||
              e.cover ||
              e.image ||
              "https://placehold.co/300x400",
            pages: e.pages,
            progress: Number(entry.progress ?? 0),
            purchased: entry.added_at,
          };
        });

        setBooks(formatted);
      } catch {
        toast.error("Search failed");
      }
    }, 400);
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    handleSearch(e.target.value);
  };

  // ---------------------------------------------------
  // Remove book from library (not from collection)
  // ---------------------------------------------------
  const handleRemoveBook = async (bookId: number) => {
    try {
      const headers = getAuthHeaders();
      await axios.delete(`https://ebook-backend-lxce.onrender.com/api/library/remove/${bookId}`, {
        headers,
      });

      toast.success("Book removed from library");
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch {
      toast.error("Failed to remove");
    }
  };

  // ---------------------------------------------------
  // Delete Collection
  // ---------------------------------------------------
  const handleDeleteCollection = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const headers = getAuthHeaders();
      await axios.delete(
        `https://ebook-backend-lxce.onrender.com/api/library/collections/${id}`,
        { headers }
      );

      setCollections((prev) => prev.filter((c) => c.id !== id));
      toast.success("Collection deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  // ---------------------------------------------------
  // Open collection edit
  // ---------------------------------------------------
  const handleEditCollection = (collection: any) => {
    setEditingCollection(collection);
    setEditCollectionName(collection.name);
    setIsEditDialogOpen(true);
  };

  // ---------------------------------------------------
  // Read click — open reader and mark started
  // ---------------------------------------------------
  const handleReadClick = async (book: any) => {
    window.dispatchEvent(new CustomEvent("reader:open", { detail: book }));
    onOpenBook(book);

    try {
      const headers = getAuthHeaders();
      await axios.post(
        "https://ebook-backend-lxce.onrender.com/api/library/read/start",
        { book_id: book.id },
        { headers }
      );

      setBooks((prev) =>
        prev.map((b) =>
          b.id === book.id ? { ...b, progress: b.progress > 0 ? b.progress : 1 } : b
        )
      );
    } catch {}
  };

  // ---------------------------------------------------
  // Computed lists
  // ---------------------------------------------------
  const readingBooks = books.filter((b) => b.progress > 0 && b.progress < 100);
  const completedBooks = books.filter((b) => b.progress >= 100);
  const recentBooks = [...books]
    .sort((a, b) => new Date(b.purchased).getTime() - new Date(a.purchased).getTime())
    .slice(0, 10);

  // ---------------------------------------------------
  // Render helpers
  // ---------------------------------------------------
  const renderCollectionGrid = (booksList) => {
    if (!booksList.length)
      return (
        <p className="text-center py-10 text-gray-500">
          No books in this collection.
        </p>
      );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {booksList.map((book) => (
          <Card key={book.id} className="shadow-md">
            <CardContent className="p-0">
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <img src={book.cover_url} className="w-full h-full object-cover" />
              </div>

              <div className="p-4">
                <Badge className="bg-blue-100 text-blue-700 mb-2">{book.category}</Badge>

                <h3 className="text-[#1d4d6a]">{book.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{book.author}</p>

                <Button className="bg-[#bf2026] text-white w-full" onClick={() => handleReadClick(book)}>
                  Read Now
                </Button>

                {/* remove from this collection */}
                {openCollectionView && (
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() => handleRemoveFromCollection(openCollectionView.id, book.id)}
                  >
                    Remove from Collection
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
// ---------------------------------------------------
// COLLECTION VIEW PAGE
// ---------------------------------------------------
if (openCollectionView) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[#1d4d6a] text-xl font-semibold">
          Collection – {openCollectionView.name}
        </h2>

        <Button
          variant="outline"
          onClick={() => {
            setOpenCollectionView(null);
            setCollectionBooks([]);
          }}
        >
          Back
        </Button>
      </div>

      {collectionBooks.length === 0 ? (
        <p className="text-gray-500 py-10 text-center">No books in this collection.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collectionBooks.map((book) => (
            <Card key={book.id} className="shadow-md">
              <CardContent className="p-0">
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <img
                    src={book.cover_url}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-4">
                  <Badge className="bg-blue-100 text-blue-700 mb-2">{book.category}</Badge>

                  <h3 className="text-[#1d4d6a] font-semibold">{book.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{book.author}</p>

                  <Button
                    className="bg-[#bf2026] text-white w-full"
                    onClick={() => handleReadClick(book)}
                  >
                    Read Now
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={() =>
                      handleRemoveFromCollection(openCollectionView.id, book.id)
                    }
                  >
                    Remove From Collection
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1d4d6a] mb-1">My Library</h2>
          <p className="text-sm text-gray-500">{books.length} books in your collection</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setIsCollectionDialogOpen(true)} className="bg-[#bf2026] text-white">
            <FolderPlus className="w-4 h-4" />
            New Collection
          </Button>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search library..."
              onChange={handleSearchInput}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg"
            />
          </div>

          <Button variant="outline">
            <Filter className="w-4 h-4" /> Filter
          </Button>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setViewMode("grid")} className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}>
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-2 rounded ${viewMode === "list" ? "bg-white shadow-sm" : ""}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <Tabs defaultValue="all">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="all">All Books</TabsTrigger>
          <TabsTrigger value="reading">Currently Reading</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="recent">Recently Added</TabsTrigger>
          <TabsTrigger value="collection">Collection</TabsTrigger>
        </TabsList>

        {/* ALL BOOKS */}
        <TabsContent value="all" className="mt-6">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <Card key={book.id} className="shadow-md group">
                  <CardContent className="p-0">
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />

                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition">
                        <Button onClick={() => handleReadClick(book)} className="opacity-0 group-hover:opacity-100 transition">
                          <BookOpen className="w-4 h-4 mr-2" /> Read Now
                        </Button>
                      </div>
                    </div>

                    <div className="p-4">
                      <Badge className="bg-blue-100 text-blue-700 mb-2">{book.category}</Badge>
                      <h3 className="text-[#1d4d6a] mb-1">{book.title}</h3>
                      <p className="text-sm text-gray-500 mb-3">{book.author}</p>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>{book.progress}%</span>
                        </div>

                        <div className="w-full bg-gray-200 h-2 rounded-full">
                          <div className="bg-[#bf2026] h-2 rounded-full" style={{ width: `${book.progress}%` }} />
                        </div>

                        <div className="flex justify-between text-xs text-gray-500 pt-1">
                          <span>{book.pages} pages</span>
                          <span>{book.purchased ? `Added ${new Date(book.purchased).toLocaleDateString()}` : ""}</span>
                        </div>

                        {/* Add to Collection button (everywhere) */}
                      {booksInCollections.has(String(book.id))

 ? (
  <Button
    className="w-full mt-2 bg-red-600 text-white"
    onClick={() => handleRemoveFromCollection(openCollectionView?.id, book.id)}
  >
    Remove from Collection
  </Button>
) : (
  <Button
    className="w-full mt-2 bg-[#1d4d6a] text-white"
    onClick={() => {
      setBookToAdd(book);
      setIsAddToCollectionOpen(true);
    }}
  >
    Add to Collection
  </Button>
)}

                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {books.map((book) => (
                <Card key={book.id} className="shadow-md">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-16 h-20 rounded overflow-hidden bg-gray-200">
                        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-[#1d4d6a]">{book.title}</h3>
                            <p className="text-sm text-gray-500">{book.author}</p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">{book.category}</Badge>
                        </div>

                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs">
                              <span>Progress</span>
                              <span>{book.progress}%</span>
                            </div>

                            <div className="w-full bg-gray-200 h-2 rounded-full">
                              <div className="bg-[#bf2026] h-2 rounded-full" style={{ width: `${book.progress}%` }} />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button onClick={() => handleReadClick(book)} className="bg-[#bf2026] text-white">
                              <BookOpen className="w-4 h-4 mr-2" /> Read
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => {
                                setBookToAdd(book);
                                setIsAddToCollectionOpen(true);
                              }}
                            >
                              Add to Collection
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* CURRENTLY READING */}
        <TabsContent value="reading" className="mt-6">
          {readingBooks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No current reading items.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {readingBooks.map((book) => (
                <Card key={book.id} className="shadow-md">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-28 overflow-hidden rounded">
                        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-[#1d4d6a]">{book.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">{book.author}</p>

                        <div className="bg-gray-200 h-2 rounded-full mb-2">
                          <div className="bg-[#bf2026] h-2 rounded-full" style={{ width: `${book.progress}%` }} />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={() => handleReadClick(book)} className="bg-[#bf2026] text-white">Resume</Button>
                          <Button onClick={() => handleRemoveBook(book.id)} variant="outline">Remove</Button>

                          <Button
                            variant="ghost"
                            onClick={() => {
                              setBookToAdd(book);
                              setIsAddToCollectionOpen(true);
                            }}
                          >
                            Add to Collection
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* COMPLETED */}
        <TabsContent value="completed" className="mt-6">
          {completedBooks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No completed books yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedBooks.map((book) => (
                <Card key={book.id} className="shadow-md">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-20 h-28 overflow-hidden rounded">
                        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-[#1d4d6a]">{book.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">{book.author}</p>

                        <div className="text-xs text-gray-600 mb-2">Completed</div>

                        <div className="flex gap-2">
                          <Button onClick={() => handleReadClick(book)} className="bg-[#bf2026] text-white">Reopen</Button>
                          <Button onClick={() => handleRemoveBook(book.id)} variant="outline">Remove</Button>

                          <Button
                            variant="ghost"
                            onClick={() => {
                              setBookToAdd(book);
                              setIsAddToCollectionOpen(true);
                            }}
                          >
                            Add to Collection
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* RECENT */}
        <TabsContent value="recent" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentBooks.map((book) => (
              <Card key={book.id} className="shadow-md">
                <CardContent className="p-0">
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />

                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition">
                      <Button onClick={() => handleReadClick(book)}>Read Now</Button>
                    </div>
                  </div>

                  <div className="p-4">
                    <Badge className="bg-blue-100 text-blue-700 mb-2">{book.category}</Badge>
                    <h3 className="text-[#1d4d6a]">{book.title}</h3>
                    <p className="text-sm text-gray-500">{book.author}</p>

                    <Button
                      className="w-full mt-2 bg-[#1d4d6a] text-white"
                      onClick={() => {
                        setBookToAdd(book);
                        setIsAddToCollectionOpen(true);
                      }}
                    >
                      Add to Collection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* COLLECTION TAB */}
        <TabsContent value="collection" className="mt-6">
        

          {collections.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No collections yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((c) => (
                <Card key={c.id} className="shadow-md p-4 group cursor-pointer" onClick={() => loadCollectionBooks(c)}>
                  <CardContent className="p-0">
                    <div className="flex justify-between mb-2">
                      <h3 className="text-[#1d4d6a]">{c.name}</h3>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCollection(c);
                          }}
                        >
                          Edit
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCollection(c.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500">Tap to view books</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ---------------------------
          CREATE COLLECTION DIALOG
      ---------------------------- */}
      <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
          </DialogHeader>

          <Label className="mb-2">Collection Name</Label>
          <Input placeholder="e.g. Fantasy, Self-help, Favourites..." value={collectionName} onChange={(e) => setCollectionName(e.target.value)} />

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCollectionDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#bf2026] text-white" onClick={handleCreateCollection}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------------
          SELECT COLLECTION (ADD BOOK)
      ---------------------------- */}
      <Dialog open={isAddToCollectionOpen} onOpenChange={setIsAddToCollectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Collection</DialogTitle>
          </DialogHeader>

          {collections.length === 0 ? (
            <p className="text-gray-500">No collections yet. Create one to add books.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {collections.map((c) => (
                <Button key={c.id} variant="outline" className="w-full" onClick={() => handleAddBookToCollection(c.id)}>
                  {c.name}
                </Button>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddToCollectionOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------------
          EDIT COLLECTION DIALOG
      ---------------------------- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection Name</DialogTitle>
          </DialogHeader>

          <div className="py-3">
            <Label>New Name</Label>
            <Input value={editCollectionName} onChange={(e) => setEditCollectionName(e.target.value)} />
          </div>

          <DialogFooter>
            <Button onClick={() => setIsEditDialogOpen(false)} variant="outline">Cancel</Button>
            <Button onClick={saveEditedCollection} className="bg-[#bf2026] text-white">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MyLibrary;