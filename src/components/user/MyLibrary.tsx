import { useState, useEffect } from 'react';
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
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [collectionName, setCollectionName] = useState('');
  const [bookNote, setBookNote] = useState('');

  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collections, setCollections] = useState<any[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);

  // ---------------------------------------------------
  // Load Collections
  // ---------------------------------------------------
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const token =
          JSON.parse(localStorage.getItem("session") || "{}")?.access_token ||
          localStorage.getItem("token");

        if (!token) return;

        const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/library/collections", {
          headers: { Authorization: `Bearer ${token}` },
        });

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
      console.log("📚 Fetching library");

      try {
        const session = JSON.parse(localStorage.getItem("session") || "{}");
        const token = session?.access_token || localStorage.getItem("token");

        if (!token) {
          setError("Not logged in");
          setLoading(false);
          return;
        }

        const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/library", {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("📥 Raw API:", res.data);

        const formattedBooks = res.data
          .map((entry: any) => {
            if (!entry.ebooks) return null;

           return {
  id: entry.ebooks.id,
  title: entry.ebooks.title,
  author: entry.ebooks.author,
  category: entry.ebooks.category,
  description: entry.ebooks.description,

  // FIX THIS
  cover_url: entry.ebooks.file_url,     // cover (if you're using same file)
  file_url: entry.ebooks.file_url,      // PDF reader uses this

  pages: entry.ebooks.pages,
  price: entry.ebooks.price,
  progress: entry.progress,
  purchased: entry.added_at,
};

          })
          .filter(Boolean);

        setBooks(formattedBooks);
      } catch (err: any) {
        console.error("Library error:", err);
        setError("Failed to load library");
      } finally {
        setLoading(false);
      }
    };

    fetchLibrary();
  }, []);

  // ---------------------------------------------------
  // Search System
  // ---------------------------------------------------
  let searchTimeout: any;

  const handleSearch = async (query: string) => {
    try {
      const session = JSON.parse(localStorage.getItem("session") || "{}");
      const token = session?.access_token || localStorage.getItem("token");

      const res = await axios.get(
        `https://ebook-backend-lxce.onrender.com/api/library/search?query=${query}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const formatted = res.data.map((entry: any) => ({
        id: entry.ebooks.id,
        title: entry.ebooks.title,
        author: entry.ebooks.author,
        category: entry.ebooks.category,
        cover_url: entry.ebooks.file_url,
        pages: entry.ebooks.pages,
        price: entry.ebooks.price,
        progress: entry.progress,
        purchased: entry.added_at,
      }));

      setBooks(formatted);
    } catch (err) {
      toast.error("Search failed");
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(searchTimeout);
    const value = e.target.value.trim();

    searchTimeout = setTimeout(() => {
      if (value.length > 0) {
        handleSearch(value);
      } else {
        // Reload full library
        const session = JSON.parse(localStorage.getItem("session") || "{}");
        const token = session?.access_token;

        axios
          .get("https://ebook-backend-lxce.onrender.com/api/library", {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            const formattedBooks = res.data.map((entry: any) => ({
              id: entry.ebooks.id,
              title: entry.ebooks.title,
              author: entry.ebooks.author,
              category: entry.ebooks.category,
              cover_url: entry.ebooks.file_url,
              pages: entry.ebooks.pages,
              price: entry.ebooks.price,
              progress: entry.progress,
              purchased: entry.added_at,
            }));
            setBooks(formattedBooks);
          });
      }
    }, 400);
  };

  // ---------------------------------------------------
  // Remove Book
  // ---------------------------------------------------
  const handleRemoveBook = async (bookId: number) => {
    try {
      const session = JSON.parse(localStorage.getItem("session") || "{}");
      const token = session?.access_token || localStorage.getItem("token");

      await axios.delete(`https://ebook-backend-lxce.onrender.com/api/library/remove/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
      const session = JSON.parse(localStorage.getItem("session") || "{}");
      const token = session?.access_token;

      await axios.post(
        "https://ebook-backend-lxce.onrender.com/api/library/collections",
        { name: collectionName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Collection created");
      setCollectionName("");
      setIsCollectionDialogOpen(false);
    } catch (err) {
      toast.error("Failed to create collection");
    }
  };

  // ---------------------------------------------------
  // UI Rendering (UNCHANGED)
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
          <Button
            onClick={() => setIsCollectionDialogOpen(true)}
            className="bg-[#bf2026] hover:bg-[#a01c22] text-white gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            New Collection
          </Button>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search library..."
              onChange={handleSearchInput}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#bf2026]"
            />
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
                        <Button
                          onClick={() => onOpenBook(book)}
                          className="bg-[#bf2026] hover:bg-[#a01c22] text-white opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Read Now
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
                          <div
                            className="bg-[#bf2026] h-2 rounded-full transition-all"
                            style={{ width: `${book.progress}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-xs text-gray-500 pt-1">
                          <span>{book.pages} pages</span>
                          <span>Added {new Date(book.purchased).toLocaleDateString()}</span>
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

                          <Button onClick={() => onOpenBook(book)} className="bg-[#bf2026] hover:bg-[#a01c22] text-white">
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

        {/* COMPLETED, RECENT & COLLECTION TABS (leave UI untouched) */}
        <TabsContent value="reading" className="mt-6">
          <div className="text-gray-500">Filter logic unchanged</div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No completed books yet. Keep reading!</p>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.slice(0, 3).map((book) => (
              <Card key={book.id} className="border-none shadow-md hover:shadow-xl transition-all group">
                <CardContent className="p-0">
                  <div className="relative h-48 rounded-t-lg overflow-hidden">
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />

                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                      <Button
  onClick={() => {
    console.log("🔍 OPEN BOOK CLICKED:", book); // ADD THIS
    onOpenBook(book);
  }}
>

                        Read Now
                      </Button>
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
            <Input
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="e.g., Favorite Books"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCollectionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCollection} className="bg-[#bf2026] hover:bg-[#a01c22] text-white">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}