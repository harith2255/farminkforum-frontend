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
  Menu,
  X,
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
  const [loading, setLoading] = useState({
    books: true,
    collections: true,
    collectionBooks: false,
    search: false
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [editCollectionName, setEditCollectionName] = useState("");
  const [openCollectionView, setOpenCollectionView] = useState<any>(null);
  const [collectionBooks, setCollectionBooks] = useState([]);
  const [booksInCollections, setBooksInCollections] = useState<Set<string>>(new Set());
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
        setLoading(prev => ({ ...prev, books: true }));
        const headers = getAuthHeaders();
        const res = await axios.get("https://e-book-backend-production.up.railway.app/api/library", {
          headers,
        });

        const formatted = res.data.map((entry) => {
          const e = entry.ebooks ?? {};
          return {
            id: e.id,
            book_id: entry.book_id,
            title: e.title,
            author: e.author,
            category: e.category,
            cover_url:
              e.cover_url ||
              e.cover ||
              e.image ||
              "https://placehold.co/300x400",
            pages: e.pages,
            progress: Number(entry.progress ?? 0),
          last_page: Number(entry.last_page ?? 1),
          purchased: entry.added_at,
          };
        });

        setBooks(formatted);
      } catch {
        toast.error("Failed to load library");
      } finally {
        setLoading(prev => ({ ...prev, books: false }));
      }
    };

    fetchLibrary();
  }, []);

  // LOAD BOOKS INSIDE A COLLECTION
  const loadCollectionBooks = async (collection) => {
    try {
      setLoading(prev => ({ ...prev, collectionBooks: true }));
      const headers = getAuthHeaders();
      const res = await axios.get(
        `https://e-book-backend-production.up.railway.app/api/library/collections/${collection.id}/books`,
        { headers }
      );
      setOpenCollectionView(collection);
      setCollectionBooks(res.data);
    } catch {
      toast.error("Failed to load collection books");
    } finally {
      setLoading(prev => ({ ...prev, collectionBooks: false }));
    }
  };

  // CREATE COLLECTION
  const handleCreateCollection = async () => {
    if (!collectionName.trim()) return toast.error("Name required");

    try {
      setLoading(prev => ({ ...prev, collections: true }));
      const headers = getAuthHeaders();
      await axios.post(
        "https://e-book-backend-production.up.railway.app/api/library/collections",
        { name: collectionName },
        { headers }
      );

      toast.success("Collection created");
      setCollectionName("");
      setIsCollectionDialogOpen(false);
      await loadCollections();
    } catch {
      toast.error("Failed to create collection");
    } finally {
      setLoading(prev => ({ ...prev, collections: false }));
    }
  };

  // LOAD COLLECTIONS
  const loadCollections = async () => {
    try {
      setLoading(prev => ({ ...prev, collections: true }));
      const headers = getAuthHeaders();

      // 1. Load collections
      const res = await axios.get(
        "https://e-book-backend-production.up.railway.app/api/library/collections",
        { headers }
      );

      setCollections(res.data);

      // 2. Load book ids for all collections
      const idsRes = await axios.get(
        "https://e-book-backend-production.up.railway.app/api/library/collections/book-ids",
        { headers }
      );

      const ids = Array.isArray(idsRes.data)
        ? idsRes.data.map(String)
        : idsRes.data.bookIds?.map(String) || [];

      // 3. Initialize local state
      setBooksInCollections(new Set(ids.map(String)));
    } catch {
      toast.error("Failed to load collections");
    } finally {
      setLoading(prev => ({ ...prev, collections: false }));
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  // ADD BOOK → COLLECTION
  const handleAddBookToCollection = async (collectionId: string) => {
    try {
      const headers = getAuthHeaders();
      await axios.post(
        `https://e-book-backend-production.up.railway.app/api/library/collections/${collectionId}/add`,
        { book_id: bookToAdd.book_id || bookToAdd.id },
        { headers }
      );

      toast.success("Book added!");
      setBooksInCollections(prev => {
        const updated = new Set(prev);
        updated.add(String(bookToAdd.book_id || bookToAdd.id));
        return updated;
      });

      setIsAddToCollectionOpen(false);
      setBookToAdd(null);
    } catch(err) {
      toast.error("Failed to add book");
      console.error("ADD BOOK ERROR:", err?.response?.data || err);
    }
  };

  // REMOVE BOOK FROM COLLECTION
  const handleRemoveFromCollection = async (collectionId, bookId) => {
    try {
      const headers = getAuthHeaders();
      await axios.delete(
        `https://e-book-backend-production.up.railway.app/api/library/collections/${collectionId}/remove/${bookId}`,
        { headers }
      );

      setCollectionBooks((prev) => prev.filter((b) => b.id !== bookId));
      toast.success("Removed");
      setBooksInCollections(prev => {
        const updated = new Set(prev);
        updated.delete(String(bookId));
        return updated;
      });
    } catch {
      toast.error("Remove failed");
    }
  };

  // 📌 Reload library & collections together with correct formatting
  async function loadLibrary() {
    try {
      setLoading(prev => ({ ...prev, books: true, collections: true }));
      const headers = getAuthHeaders();

      // fetch library items
      const libRes = await axios.get("https://e-book-backend-production.up.railway.app/api/library", { headers });

      const formatted = (libRes.data || []).map((entry: any) => {
        const e = entry.ebooks ?? {};
        return {
          id: e.id,
          book_id: entry.book_id,
          title: e.title,
          author: e.author,
          category: e.category,
          cover_url:
            e.cover_url ||
            "https://placehold.co/300x400",
          pages: e.pages,
          progress: Number(entry.progress ?? 0),
          last_page: Number(entry.last_page ?? 1),
          purchased: entry.added_at,
        };
      });

      setBooks(formatted);
      await loadCollections();
    } catch {
      console.warn("Failed to reload library");
    } finally {
      setLoading(prev => ({ ...prev, books: false, collections: false }));
    }
  }

  // EDIT COLLECTION NAME
  const saveEditedCollection = async () => {
    try {
      setLoading(prev => ({ ...prev, collections: true }));
      const headers = getAuthHeaders();
      await axios.put(
        `https://e-book-backend-production.up.railway.app/api/library/collections/${editingCollection.id}`,
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
    } finally {
      setLoading(prev => ({ ...prev, collections: false }));
    }
  };

  // ---------------------------------------------------
  // Reader event listeners (start/progress)
  // ---------------------------------------------------
  useEffect(() => {
    const onOpen = (e: any) => {
      const book = e.detail;
      if (!book) return;

      (async () => {
        try {
          const headers = getAuthHeaders();
          if (!headers.Authorization) return;
          await axios.post(
            "https://e-book-backend-production.up.railway.app/api/library/read/start",
            { book_id: book.id },
            { headers }
          );
        } catch (err) {}
      })();
    };

    const onProgress = (e: any) => {
      const { bookId:id, page, totalPages } = e.detail || {};
      if (!id || !page || !totalPages) return;

      const percent = Math.min(100, Math.round((page / totalPages) * 100));

      // update UI immediately
      setBooks(prev =>
        prev.map(b =>
          b.id === id || b.book_id === id ? { ...b, progress: percent } : b
        )
      );

      (async () => {
        try {
          const headers = getAuthHeaders();
          
          await axios.put(
            `https://e-book-backend-production.up.railway.app/api/library/progress/${id}`,
            { 
              progress: percent,
              last_page: page
            },
            { headers }
          );

          if (percent === 100) {
            await axios.put(
              `https://e-book-backend-production.up.railway.app/api/library/complete/${id}`,
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

    const onLibraryUpdated = () => {
      loadLibrary();
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
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      loadLibrary();
      return;
    }

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setLoading(prev => ({ ...prev, search: true }));
        const headers = getAuthHeaders();
        const res = await axios.get(
          `https://e-book-backend-production.up.railway.app/api/library/search?query=${encodeURIComponent(
            query
          )}`,
          { headers }
        );

        const formatted = (res.data || []).map((entry: any) => {
          const e = entry.ebooks ?? {};
          return {
            id: e.id,
            book_id: entry.book_id,
            title: e.title,
            author: e.author,
            category: e.category,
            cover_url:
              e.cover_url ||
              e.cover ||
              e.image ||
              "https://placehold.co/300x400",
            pages: e.pages,
            progress: Number(entry.progress ?? 0),
          last_page: Number(entry.last_page ?? 1),
            purchased: entry.added_at,
          };
        });

        setBooks(formatted);
      } catch {
        toast.error("Search failed");
      } finally {
        setLoading(prev => ({ ...prev, search: false }));
      }
    }, 400);
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    handleSearch(e.target.value);
  };

  async function handleRemoveFromAllCollections(book) {
    try {
      const headers = getAuthHeaders();
      await axios.delete(
        `https://e-book-backend-production.up.railway.app/api/library/collections/remove-book/${book.book_id || book.id}`,
        { headers }
      );

      toast.success("Removed from collections");
      setBooksInCollections(prev => {
        const updated = new Set(prev);
        updated.delete(String(book.book_id || book.id));
        return updated;
      });
    } catch {
      toast.error("Failed to remove from collections");
    }
  }

  // ---------------------------------------------------
  // Remove book from library (not from collection)
  // ---------------------------------------------------
  const handleRemoveBook = async (bookId: number) => {
    try {
      const headers = getAuthHeaders();
      await axios.delete(`https://e-book-backend-production.up.railway.app/api/library/remove/${bookId}`, {
        headers,
      });

      toast.success("Book removed from library");
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch {
      toast.error("Failed to remove");
    }
  };

  const handleResetProgress = async (bookId: number) => {
    try {
      const headers = getAuthHeaders();
      await axios.put(`https://e-book-backend-production.up.railway.app/api/library/reset/${bookId}`, {}, { headers });

      toast.success("Removed from currently reading");
      setBooks(prev =>
        prev.map(b =>
          b.id === bookId ? { ...b, progress: 0 } : b
        )
      );
    } catch {
      toast.error("Failed to reset");
    }
  };

  // ---------------------------------------------------
  // Delete Collection
  // ---------------------------------------------------
  const handleDeleteCollection = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      setLoading(prev => ({ ...prev, collections: true }));
      const headers = getAuthHeaders();
      await axios.delete(
        `https://e-book-backend-production.up.railway.app/api/library/collections/${id}`,
        { headers }
      );

      setCollections((prev) => prev.filter((c) => c.id !== id));
      toast.success("Collection deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setLoading(prev => ({ ...prev, collections: false }));
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
    window.dispatchEvent(
      new CustomEvent("reader:open", {
        detail: {
          ...book,
          start_page: book.last_page || 1,
        },
      })
    );
    onOpenBook(book);

    try {
      const headers = getAuthHeaders();
      await axios.post(
        "https://e-book-backend-production.up.railway.app/api/library/read/start",
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
    .sort((a, b) => {
      const dateA = a.purchased ? new Date(a.purchased).getTime() : 0;
      const dateB = b.purchased ? new Date(b.purchased).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 10);

  // ---------------------------------------------------
  // COLLECTION VIEW PAGE
  // ---------------------------------------------------
  if (openCollectionView) {
    return (
      <div className="space-y-6 p-4 sm:p-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[#1d4d6a] text-lg sm:text-xl font-semibold">
              Collection – {openCollectionView.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {collectionBooks.length} books
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOpenCollectionView(null);
              setCollectionBooks([]);
            }}
          >
            Back
          </Button>
        </div>

        {loading.collectionBooks ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a]"></div>
              <p className="text-gray-500 mt-2">Loading collection books...</p>
            </div>
          </div>
        ) : collectionBooks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No books in this collection.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {collectionBooks.map((book) => (
              <Card key={book.id} className="shadow-md">
                <CardContent className="p-0">
                  <div className="relative h-40 sm:h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-4">
                    <Badge className="bg-blue-100 text-blue-700 mb-2 text-xs">
                      {book.category}
                    </Badge>

                    <h3 className="text-[#1d4d6a] font-semibold text-sm sm:text-base line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mb-3 line-clamp-1">
                      {book.author}
                    </p>

                    <Button
                      className="bg-[#bf2026] text-white w-full text-sm py-2"
                      onClick={() => handleReadClick(book)}
                    >
                      Read Now
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full mt-2 text-sm py-2"
                      onClick={() => handleRemoveFromAllCollections(book)}
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
    <div className="space-y-6 p-4 sm:p-0">
      {/* HEADER - Mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[#1d4d6a] text-xl sm:text-2xl font-bold mb-1">My Library</h2>
          {!loading.books && !loading.search && (
            <p className="text-sm text-gray-500">{books.length} books in your collection</p>
          )}
        </div>

        {/* MOBILE FILTERS TOGGLE */}
        <div className="sm:hidden">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            {showMobileFilters ? <X className="w-4 h-4 mr-2" /> : <Menu className="w-4 h-4 mr-2" />}
            {showMobileFilters ? "Close Menu" : "Menu"}
          </Button>
        </div>

        {/* DESKTOP ACTIONS */}
        <div className="hidden sm:flex items-center gap-3">
          <Button 
            onClick={() => setIsCollectionDialogOpen(true)} 
            className="bg-[#bf2026] text-white text-sm"
            size="sm"
            disabled={loading.collections}
          >
            {loading.collections ? (
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <FolderPlus className="w-4 h-4 mr-2" />
            )}
            {loading.collections ? "Creating..." : "New Collection"}
          </Button>

          <div className="relative w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search library..."
              onChange={handleSearchInput}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg"
            />
            {loading.search && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
              </div>
            )}
          </div>

          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" /> Filter
          </Button>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode("grid")} 
              className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode("list")} 
              className={`p-2 rounded ${viewMode === "list" ? "bg-white shadow-sm" : ""}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE ACTIONS (Collapsible) */}
      {showMobileFilters && (
        <div className="sm:hidden bg-white p-4 rounded-lg shadow-md space-y-3">
          <Button 
            onClick={() => setIsCollectionDialogOpen(true)} 
            className="bg-[#bf2026] text-white w-full"
            disabled={loading.collections}
          >
            {loading.collections ? (
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <FolderPlus className="w-4 h-4 mr-2" />
            )}
            {loading.collections ? "Creating..." : "New Collection"}
          </Button>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search library..."
              onChange={handleSearchInput}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg"
            />
            {loading.search && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode("grid")} 
                className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("list")} 
                className={`p-2 rounded ${viewMode === "list" ? "bg-white shadow-sm" : ""}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHOW INITIAL LOADING */}
      {loading.books && !loading.search ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a]"></div>
            <p className="text-gray-500 mt-2">Loading books...</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="bg-white border border-gray-200 w-full flex overflow-x-auto">
            <TabsTrigger value="all" className="flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-4 py-2">
              All Books
            </TabsTrigger>
            <TabsTrigger value="reading" className="flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-4 py-2">
              Reading ({readingBooks.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-4 py-2">
              Completed
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-4 py-2">
              Recent
            </TabsTrigger>
            <TabsTrigger value="collection" className="flex-1 min-w-0 text-xs sm:text-sm px-2 sm:px-4 py-2">
              Collection
            </TabsTrigger>
          </TabsList>

          {/* ALL BOOKS */}
          <TabsContent value="all" className="mt-4 sm:mt-6">
            {loading.search ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a]"></div>
                  <p className="text-gray-500 mt-2">Searching books...</p>
                </div>
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchQuery ? `No books found for "${searchQuery}"` : "No books in your library yet."}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {books.map((book) => (
                  <Card key={book.id} className="shadow-md group h-full">
                    <CardContent className="p-0 h-full flex flex-col">
                      <div className="relative h-40 sm:h-48 overflow-hidden rounded-t-lg">
                        <img 
                          src={book.cover_url} 
                          alt={book.title} 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition">
                          <Button 
                            onClick={() => handleReadClick(book)} 
                            className="opacity-0 group-hover:opacity-100 transition text-xs sm:text-sm"
                            size="sm"
                          >
                            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
                            Read Now
                          </Button>
                        </div>
                      </div>

                      <div className="p-3 sm:p-4 flex-grow flex flex-col">
                        <Badge className="bg-blue-100 text-blue-700 mb-2 text-xs w-fit">
                          {book.category}
                        </Badge>
                        <h3 className="text-[#1d4d6a] text-sm sm:text-base font-semibold mb-1 line-clamp-2">
                          {book.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mb-2 line-clamp-1">
                          {book.author}
                        </p>

                        <div className="space-y-2 mt-auto">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{book.progress}%</span>
                          </div>

                          <div className="w-full bg-gray-200 h-1.5 sm:h-2 rounded-full">
                            <div 
                              className="bg-[#bf2026] h-1.5 sm:h-2 rounded-full" 
                              style={{ width: `${book.progress}%` }} 
                            />
                          </div>

                          <div className="flex justify-between text-xs text-gray-500 pt-1">
                            <span>{book.pages} pages</span>
                            <span className="truncate ml-2">
                              {book.purchased ? `Added ${new Date(book.purchased).toLocaleDateString()}` : ""}
                            </span>
                          </div>

                          {booksInCollections.has(String(book.book_id || book.id)) ? (  
                            <Button
                              className="w-full mt-2 bg-[#bf2026] text-white text-xs sm:text-sm py-1.5 sm:py-2"
                              onClick={() => handleRemoveFromAllCollections(book)}
                            >
                              Remove from Collection
                            </Button>
                          ) : (
                            <Button
                              className="w-full mt-2 bg-[#1d4d6a] text-white text-xs sm:text-sm py-1.5 sm:py-2"
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
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex gap-3 sm:gap-4">
                        <div className="w-16 h-20 sm:w-20 sm:h-28 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                          <img 
                            src={book.cover_url} 
                            alt={book.title} 
                            className="w-full h-full object-cover" 
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[#1d4d6a] text-sm sm:text-base font-semibold truncate">
                                {book.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-500 truncate">
                                {book.author}
                              </p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-700 text-xs w-fit mt-1 sm:mt-0">
                              {book.category}
                            </Badge>
                          </div>

                          <div className="mt-2 sm:mt-4">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{book.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 h-1.5 sm:h-2 rounded-full">
                              <div 
                                className="bg-[#bf2026] h-1.5 sm:h-2 rounded-full" 
                                style={{ width: `${book.progress}%` }} 
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3">
                              <Button 
                                onClick={() => handleReadClick(book)} 
                                className="bg-[#bf2026] text-white text-xs sm:text-sm py-1.5 sm:py-2 flex-1"
                                size="sm"
                              >
                                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
                                Read
                              </Button>

                              {booksInCollections.has(String(book.book_id || book.id)) ? (
                                <Button
                                  className="text-xs sm:text-sm py-1.5 sm:py-2 flex-1"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveFromAllCollections(book)}
                                >
                                  Remove from Collection
                                </Button>
                              ) : (
                                <Button
                                  className="text-xs sm:text-sm py-1.5 sm:py-2 flex-1"
                                  variant="outline"
                                  size="sm"
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
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* CURRENTLY READING */}
          <TabsContent value="reading" className="mt-4 sm:mt-6">
            {readingBooks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No current reading items.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {readingBooks.map((book) => (
                  <Card key={book.id} className="shadow-md">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex gap-3 sm:gap-4">
                        <div className="w-16 h-24 sm:w-20 sm:h-28 overflow-hidden rounded flex-shrink-0">
                          <img 
                            src={book.cover_url} 
                            alt={book.title} 
                            className="w-full h-full object-cover" 
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-[#1d4d6a] text-sm sm:text-base font-semibold line-clamp-2">
                            {book.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 mb-2 line-clamp-1">
                            {book.author}
                          </p>

                          <div className="mb-2">
                            <div className="text-xs text-gray-600 mb-1">Progress</div>
                            <div className="bg-gray-200 h-1.5 sm:h-2 rounded-full">
                              <div 
                                className="bg-[#bf2026] h-1.5 sm:h-2 rounded-full" 
                                style={{ width: `${book.progress}%` }} 
                              />
                            </div>
                            <div className="text-xs text-gray-500 text-right mt-1">
                              {book.progress}%
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <Button 
                              onClick={() => handleReadClick(book)} 
                              className="bg-[#bf2026] text-white text-xs sm:text-sm py-1.5 flex-1"
                              size="sm"
                            >
                              Resume
                            </Button>
                            <Button 
                              onClick={() => handleRemoveBook(book.id)} 
                              variant="outline" 
                              className="text-xs sm:text-sm py-1.5 flex-1"
                              size="sm"
                            >
                              Remove
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
          <TabsContent value="completed" className="mt-4 sm:mt-6">
            {completedBooks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No completed books yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {completedBooks.map((book) => (
                  <Card key={book.id} className="shadow-md">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex gap-3 sm:gap-4">
                        <div className="w-16 h-24 sm:w-20 sm:h-28 overflow-hidden rounded flex-shrink-0">
                          <img 
                            src={book.cover_url} 
                            alt={book.title} 
                            className="w-full h-full object-cover" 
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-[#1d4d6a] text-sm sm:text-base font-semibold line-clamp-2">
                            {book.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 mb-2 line-clamp-1">
                            {book.author}
                          </p>

                          <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded w-fit mb-3">
                            ✓ Completed
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button 
                              onClick={() => handleReadClick(book)} 
                              className="bg-[#bf2026] text-white text-xs sm:text-sm py-1.5 flex-1"
                              size="sm"
                            >
                              Reopen
                            </Button>
                            <Button 
                              onClick={() => handleRemoveBook(book.id)} 
                              variant="outline" 
                              className="text-xs sm:text-sm py-1.5 flex-1"
                              size="sm"
                            >
                              Remove
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
          <TabsContent value="recent" className="mt-4 sm:mt-6">
            {recentBooks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No recent books.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {recentBooks.map((book) => (
                  <Card key={book.id} className="shadow-md">
                    <CardContent className="p-0">
                      <div className="relative h-40 sm:h-48 overflow-hidden rounded-t-lg">
                        <img 
                          src={book.cover_url} 
                          alt={book.title} 
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition">
                          <Button 
                            onClick={() => handleReadClick(book)} 
                            className="opacity-0 group-hover:opacity-100 transition text-xs sm:text-sm"
                            size="sm"
                          >
                            Read Now
                          </Button>
                        </div>
                      </div>

                      <div className="p-3 sm:p-4">
                        <Badge className="bg-blue-100 text-blue-700 mb-2 text-xs">
                          {book.category}
                        </Badge>
                        <h3 className="text-[#1d4d6a] text-sm sm:text-base font-semibold line-clamp-2">
                          {book.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mb-3 line-clamp-1">
                          {book.author}
                        </p>

                        {booksInCollections.has(String(book.id)) ? (
                          <Button
                            className="w-full mt-2 bg-[#bf2026] text-white text-xs sm:text-sm py-1.5 sm:py-2"
                            onClick={() => handleRemoveFromAllCollections(book)}
                          >
                            Remove from Collection
                          </Button>
                        ) : (
                          <Button
                            className="w-full mt-2 bg-[#1d4d6a] text-white text-xs sm:text-sm py-1.5 sm:py-2"
                            onClick={() => {
                              setBookToAdd(book);
                              setIsAddToCollectionOpen(true);
                            }}
                          >
                            Add to Collection
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* COLLECTION TAB */}
          <TabsContent value="collection" className="mt-4 sm:mt-6">
            {loading.collections ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a]"></div>
                  <p className="text-gray-500 mt-2">Loading collections...</p>
                </div>
              </div>
            ) : collections.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No collections yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {collections.map((c) => (
                  <Card 
                    key={c.id} 
                    className="shadow-md p-3 sm:p-4 group cursor-pointer hover:shadow-lg transition"
                    onClick={() => loadCollectionBooks(c)}
                  >
                    <CardContent className="p-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-[#1d4d6a] text-sm sm:text-base font-semibold">
                          {c.name}
                        </h3>

                        <div className="flex gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs p-1 sm:p-2"
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
                            className="text-xs p-1 sm:p-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCollection(c.id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-500">
                        Tap to view books
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* ---------------------------
          CREATE COLLECTION DIALOG
      ---------------------------- */}
      <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Create Collection</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Collection Name</Label>
            <Input 
              placeholder="e.g. Fantasy, Self-help, Favourites..." 
              value={collectionName} 
              onChange={(e) => setCollectionName(e.target.value)}
              className="text-sm sm:text-base"
            />
          </div>

          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsCollectionDialogOpen(false)}
              className="text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#bf2026] text-white text-sm sm:text-base"
              onClick={handleCreateCollection}
              disabled={loading.collections}
            >
              {loading.collections ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------------
          SELECT COLLECTION (ADD BOOK)
      ---------------------------- */}
      <Dialog open={isAddToCollectionOpen} onOpenChange={setIsAddToCollectionOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Select Collection</DialogTitle>
          </DialogHeader>

          {loading.collections ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a]"></div>
                <p className="text-gray-500 mt-2">Loading collections...</p>
              </div>
            </div>
          ) : collections.length === 0 ? (
            <p className="text-gray-500 text-sm sm:text-base text-center py-4">
              No collections yet. Create one to add books.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto py-2">
              {collections.map((c) => (
                <Button 
                  key={c.id} 
                  variant="outline" 
                  className="w-full justify-start text-sm sm:text-base py-3"
                  onClick={() => handleAddBookToCollection(c.id)}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsAddToCollectionOpen(false)}
              className="text-sm sm:text-base"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------------
          EDIT COLLECTION DIALOG
      ---------------------------- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Collection Name</DialogTitle>
          </DialogHeader>

          <div className="py-3 space-y-2">
            <Label className="text-sm sm:text-base">New Name</Label>
            <Input 
              value={editCollectionName} 
              onChange={(e) => setEditCollectionName(e.target.value)}
              className="text-sm sm:text-base"
            />
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setIsEditDialogOpen(false)} 
              variant="outline"
              className="text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button 
              onClick={saveEditedCollection} 
              className="bg-[#bf2026] text-white text-sm sm:text-base"
              disabled={loading.collections}
            >
              {loading.collections ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MyLibrary;