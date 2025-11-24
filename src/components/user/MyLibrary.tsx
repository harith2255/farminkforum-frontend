import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { BookOpen, Grid3x3, List, Search, Filter, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import axios from "axios";
import * as React from 'react';

interface MyLibraryProps {
  onOpenBook: (book: any) => void;
}

export function MyLibrary({ onOpenBook }: MyLibraryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [collectionName, setCollectionName] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collections, setCollections] = useState<any[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);

  // keep ref to avoid re-creating handler
  const booksRef = useRef(books);
  useEffect(() => { booksRef.current = books; }, [books]);

  // ---------------------------------------------------
  // Helper: get token header
  // ---------------------------------------------------
  const getAuthHeaders = () => {
    const session = JSON.parse(localStorage.getItem("session") || "{}");
    const token = session?.access_token || localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // ---------------------------------------------------
  // Load Collections
  // ---------------------------------------------------
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) return setLoadingCollections(false);

        const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/library/collections", { headers });
        setCollections(res.data || []);
      } catch (err) {
        console.error("Failed to load collections:", err);
        toast.error("Failed to load collections");
      } finally {
        setLoadingCollections(false);
      }
    };

    fetchCollections();
  }, [isCollectionDialogOpen]);

  // ---------------------------------------------------
  // Load Library Books
  // ---------------------------------------------------
  useEffect(() => {
    const fetchLibrary = async () => {
      setLoading(true);
      try {
        const headers = getAuthHeaders();
        if (!headers.Authorization) {
          setError("Not logged in");
          setLoading(false);
          return;
        }

        const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/library", { headers });
        // Normalize / format response
        const formattedBooks = (res.data || []).map((entry: any) => {
          const e = entry.ebooks || entry; // adapt to your shape
          return {
            id: e.id,
            title: e.title,
            author: e.author,
            category: e.category,
            description: e.description,
            cover_url: e.file_url,
            file_url: e.file_url,
            pages: e.pages,
            price: e.price,
            progress: Number(entry.progress ?? 0),
            purchased: entry.added_at ?? null,
            // any other fields...
          };
        });

        setBooks(formattedBooks);
      } catch (err) {
        console.error("Library error:", err);
        setError("Failed to load library");
        toast.error("Failed to load library");
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, []);

  // ---------------------------------------------------
  // Computed lists
  // ---------------------------------------------------
  const readingBooks = books.filter(b => b.progress > 0 && b.progress < 100);
  const completedBooks = books.filter(b => b.progress >= 100);
  const recentBooks = [...books].sort((a, b) => {
    const da = a.purchased ? new Date(a.purchased).getTime() : 0;
    const db = b.purchased ? new Date(b.purchased).getTime() : 0;
    return db - da;
  }).slice(0, 10);

  // ---------------------------------------------------
  // Listen for reader events (open + progress)
  // BookReader should emit:
  //  - window.dispatchEvent(new CustomEvent('reader:open', { detail: book }))
  //  - window.dispatchEvent(new CustomEvent('reader:progress', { detail: { id, progress } }))
  // ---------------------------------------------------
  useEffect(() => {
    const onOpen = (e: any) => {
      const book = e.detail;
      if (!book) return;
      // ensure UI shows reading state
      setBooks(prev => {
        const found = prev.find(p => p.id === book.id);
        if (found) return prev;
        // if not present, optionally push
        return prev;
      });

      // notify backend that user started reading (optimistic)
      (async () => {
        try {
          const headers = getAuthHeaders();
          if (!headers.Authorization) return;
          await axios.post("https://ebook-backend-lxce.onrender.com/api/library/read/start", { book_id: book.id }, { headers });
        } catch (err) {
          console.warn("start read failed", err);
        }
      })();
    };

    const onProgress = (e: any) => {
      const { id, progress } = e.detail || {};
      if (!id || typeof progress !== "number") return;

      // Optimistic update in UI
      setBooks(prev => prev.map(b => (b.id === id ? { ...b, progress: Math.min(100, Math.round(progress)) } : b)));

      // Patch backend (debounce not implemented here - backend should handle idempotent updates)
      (async () => {
        try {
          const headers = getAuthHeaders();
          if (!headers.Authorization) return;
          await axios.patch(`https://ebook-backend-lxce.onrender.com/api/library/progress/${id}`, { progress: Math.min(100, Math.round(progress)) }, { headers });

          if (progress >= 100) {
            // mark completed
            await axios.patch(`https://ebook-backend-lxce.onrender.com/api/library/complete/${id}`, { completed_at: new Date().toISOString() }, { headers });
          }
        } catch (err) {
          console.warn("progress update failed", err);
        }
      })();
    };

    window.addEventListener('reader:open', onOpen);
    window.addEventListener('reader:progress', onProgress);
    return () => {
      window.removeEventListener('reader:open', onOpen);
      window.removeEventListener('reader:progress', onProgress);
    };
  }, []);

  

  // ---------------------------------------------------
  // Search System
  // ---------------------------------------------------
  const searchTimeoutRef = useRef<number | null>(null);
  const handleSearch = async (query: string) => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get(`https://ebook-backend-lxce.onrender.com/api/library/search?query=${encodeURIComponent(query)}`, { headers });
      const formatted = (res.data || []).map((entry: any) => {
        const e = entry.ebooks || entry;
        return {
          id: e.id,
          title: e.title,
          author: e.author,
          category: e.category,
          cover_url: e.file_url,
          pages: e.pages,
          price: e.price,
          progress: Number(entry.progress ?? 0),
          purchased: entry.added_at,
        };
      });
      setBooks(formatted);
    } catch (err) {
      toast.error("Search failed");
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
    const value = e.target.value.trim();
    searchTimeoutRef.current = window.setTimeout(() => {
      if (value.length > 0) {
        handleSearch(value);
      } else {
        // Reload full library
        const headers = getAuthHeaders();
        axios.get("https://ebook-backend-lxce.onrender.com/api/library", { headers })
          .then((res) => {
            const formattedBooks = (res.data || []).map((entry: any) => {
              const e = entry.ebooks || entry;
              return {
                id: e.id,
                title: e.title,
                author: e.author,
                category: e.category,
                cover_url: e.file_url,
                pages: e.pages,
                price: e.price,
                progress: Number(entry.progress ?? 0),
                purchased: entry.added_at,
              };
            });
            setBooks(formattedBooks);
          })
          .catch(() => toast.error("Failed to reload library"));
      }
    }, 400);
  };

  // ---------------------------------------------------
  // Remove Book
  // ---------------------------------------------------
  const handleRemoveBook = async (bookId: number) => {
    try {
      const headers = getAuthHeaders();
      await axios.delete(`https://ebook-backend-lxce.onrender.com/api/library/remove/${bookId}`, { headers });
      toast.success("Book removed");
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch (err) {
      toast.error("Failed to remove");
    }
  };

  // ---------------------------------------------------
  // Add Collection
  // ---------------------------------------------------
  const handleCreateCollection = async () => {
    if (!collectionName.trim()) return;

    try {
      const headers = getAuthHeaders();
      await axios.post("https://ebook-backend-lxce.onrender.com/api/library/collections", { name: collectionName }, { headers });
      toast.success("Collection created");
      setCollectionName("");
      setIsCollectionDialogOpen(false);
    } catch (err) {
      toast.error("Failed to create collection");
    }
  };

  // ---------------------------------------------------
  // When user clicks read (UI -> open reader + start backend)
  // ---------------------------------------------------
  const handleReadClick = async (book: any) => {
    // Dispatch open event that BookReader listens to or App will handle
    window.dispatchEvent(new CustomEvent('reader:open', { detail: book }));

    // open in UI (parent will open actual reader)
    onOpenBook(book);

    // also call backend start if not already started
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) return;
      await axios.post("https://ebook-backend-lxce.onrender.com/api/library/read/start", { book_id: book.id }, { headers });
      // update UI progress if currently zero -> set to 1% to indicate started
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, progress: b.progress > 0 ? b.progress : 1 } : b));
    } catch (err) {
      console.warn("start read failed", err);
    }
  };

  // ---------------------------------------------------
  // UI Rendering (unchanged structure)
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
          <Button onClick={() => setIsCollectionDialogOpen(true)} className="bg-[#bf2026] hover:bg-[#a01c22] text-white gap-2">
            <FolderPlus className="w-4 h-4" />
            New Collection
          </Button>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search library..." onChange={handleSearchInput}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#bf2026]" />
          </div>

          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>

          {/* View Mode */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}>
              <Grid3x3 className="w-4 h-4" />
            </button>

            <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="all">All Books</TabsTrigger>
          <TabsTrigger value="reading">Currently Reading</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="recent">Recently Added</TabsTrigger>
          <TabsTrigger value="collection">Collection</TabsTrigger>
        </TabsList>

        {/* ALL BOOKS */}
        <TabsContent value="all" className="mt-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <Card key={book.id} className="border-none shadow-md hover:shadow-xl transition-all group">
                  <CardContent className="p-0">
                    {/* COVER */}
                    <div className="relative bg-gradient-to-br from-[#1d4d6a] to-[#2a5f7f] h-48 flex items-center justify-center rounded-t-lg overflow-hidden">
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />

                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                        <Button onClick={() => handleReadClick(book)} className="bg-[#bf2026] hover:bg-[#a01c22] text-white opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                          <BookOpen className="w-4 h-4 mr-2" /> Read Now
                        </Button>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="p-4">
                      <Badge className="bg-blue-100 text-blue-700 mb-2">{book.category}</Badge>
                      <h3 className="text-[#1d4d6a] mb-1 line-clamp-1">{book.title}</h3>
                      <p className="text-sm text-gray-500 mb-3">{book.author}</p>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Progress</span>
                          <span>{book.progress}%</span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-[#bf2026] h-2 rounded-full transition-all" style={{ width: `${book.progress}%` }} />
                        </div>

                        <div className="flex justify-between text-xs text-gray-500 pt-1">
                          <span>{book.pages} pages</span>
                          <span>{book.purchased ? `Added ${new Date(book.purchased).toLocaleDateString()}` : ''}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // LIST VIEW
            <div className="space-y-3">
              {books.map((book) => (
                <Card key={book.id} className="border-none shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* COVER */}
                      <div className="w-16 h-20 rounded overflow-hidden bg-gray-200">
                        <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                      </div>

                      {/* CONTENT */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-[#1d4d6a] mb-1">{book.title}</h3>
                            <p className="text-sm text-gray-500">{book.author}</p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700">{book.category}</Badge>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Progress</span>
                              <span>{book.progress}%</span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-[#bf2026] h-2 rounded-full" style={{ width: `${book.progress}%` }} />
                            </div>
                          </div>

                          <Button onClick={() => handleReadClick(book)} className="bg-[#bf2026] hover:bg-[#a01c22] text-white">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Read
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

        {/* CURRENTLY READING */}
        <TabsContent value="reading" className="mt-6">
          {readingBooks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No current reading items.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {readingBooks.map(b => (
                <Card key={b.id} className="border-none shadow-md hover:shadow-xl transition-all group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-28 overflow-hidden rounded">
                        <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[#1d4d6a]">{b.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">{b.author}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div className="bg-[#bf2026] h-2 rounded-full" style={{ width: `${b.progress}%` }} />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleReadClick(b)} className="bg-[#bf2026] text-white">Resume</Button>
                          <Button onClick={() => handleRemoveBook(b.id)} variant="outline">Remove</Button>
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
              {completedBooks.map(b => (
                <Card key={b.id} className="border-none shadow-md hover:shadow-xl transition-all group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-28 overflow-hidden rounded">
                        <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[#1d4d6a]">{b.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">{b.author}</p>
                        <div className="text-xs text-gray-600 mb-2">Completed</div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleReadClick(b)} className="bg-[#bf2026] text-white">Reopen</Button>
                          <Button onClick={() => handleRemoveBook(b.id)} variant="outline">Remove</Button>
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
              <Card key={book.id} className="border-none shadow-md hover:shadow-xl transition-all group">
                <CardContent className="p-0">
                  <div className="relative h-48 rounded-t-lg overflow-hidden">
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                      <Button onClick={() => handleReadClick(book)}>Read Now</Button>
                    </div>
                  </div>

                  <div className="p-4">
                    <Badge className="bg-blue-100 text-blue-700 mb-2">{book.category}</Badge>
                    <h3 className="text-[#1d4d6a] mb-1">{book.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">{book.author}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* COLLECTIONS DIALOG */}
      <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1d4d6a]">Create New Collection</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <Label>Collection Name</Label>
            <Input value={collectionName} onChange={(e) => setCollectionName(e.target.value)} placeholder="e.g., Favorite Books" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCollectionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCollection} className="bg-[#bf2026] hover:bg-[#a01c22] text-white">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MyLibrary;