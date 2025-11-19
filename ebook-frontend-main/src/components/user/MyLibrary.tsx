import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  BookOpen,
  Grid3x3,
  List,
  Search,
  Filter,
  FolderPlus,
  Trash2,
  Edit3,
  Folder,
} from 'lucide-react';
import { toast } from 'sonner';

interface MyLibraryProps {
  onOpenBook: (book: any) => void;
  onNavigate: (page: string, id?: number) => void;
}

export function MyLibrary({ onOpenBook, onNavigate }: MyLibraryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [collectionName, setCollectionName] = useState('');
  const [collections, setCollections] = useState<any[]>([]);
  const [expandedCollectionId, setExpandedCollectionId] = useState<number | null>(null);

  const books = [
    {
      id: 1,
      title: 'Agricultural Extension Education',
      author: 'Dr. Sarah Smith',
      category: 'Agricultural Extension Education',
      progress: 65,
      purchased: '2024-01-15',
      cover: '📘',
      pages: 450,
    },
    {
      id: 2,
      title: 'Adult and Continuing Education and Extension',
      author: 'Prof. Michael Johnson',
      category: 'Adult and Continuing Education and Extension',
      progress: 42,
      purchased: '2024-02-01',
      cover: '📗',
      pages: 520,
    },
  ];

  useEffect(() => {
    const stored = localStorage.getItem('collections');
    if (stored) {
      setCollections(JSON.parse(stored));
    }
  }, []);

  const saveCollections = (updated: any[]) => {
    setCollections(updated);
    localStorage.setItem('collections', JSON.stringify(updated));
  };

  const handleCreateCollection = () => {
    if (collectionName.trim()) {
      const newCollection = {
        id: Date.now(),
        name: collectionName,
        books: books, // show 2 demo books inside
        createdAt: new Date().toISOString(),
      };
      const updated = [...collections, newCollection];
      saveCollections(updated);
      toast.success(`Collection "${collectionName}" created!`);
      setCollectionName('');
      setIsCollectionDialogOpen(false);
    }
  };

  const handleDeleteCollection = (id: number) => {
    const updated = collections.filter((c) => c.id !== id);
    saveCollections(updated);
    toast.success('Collection deleted successfully');
  };

  const handleRenameCollection = () => {
    if (selectedCollection && collectionName.trim()) {
      const updated = collections.map((c) =>
        c.id === selectedCollection.id ? { ...c, name: collectionName } : c
      );
      saveCollections(updated);
      toast.success('Collection renamed successfully!');
      setIsRenameDialogOpen(false);
      setSelectedCollection(null);
      setCollectionName('');
    }
  };

  return (
    <div className="space-y-6">
      {/* ✅ If a collection is opened, show its book details */}
      {expandedCollectionId && (
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={() => setExpandedCollectionId(null)}
            className="flex items-center gap-2"
          >
            ← Back
          </Button>

          {collections
            .filter((c) => c.id === expandedCollectionId)
            .map((c) => (
              <div key={c.id} className="space-y-3">
                <h2 className="text-xl font-semibold text-[#1d4d6a]">{c.name}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {c.books.map((book: any) => (
                    <Card
                      key={book.id}
                      className="p-4 flex items-center justify-between hover:shadow-md cursor-pointer"
                      onClick={() => onOpenBook(book)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{book.cover}</span>
                        <div>
                          <p className="text-[#1d4d6a] font-medium">{book.title}</p>
                          <p className="text-sm text-gray-500">{book.author}</p>
                        </div>
                      </div>
                      <BookOpen className="w-4 h-4 text-[#bf2026]" />
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ✅ Only show the main library view when no collection is opened */}
      {!expandedCollectionId && (
        <>
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
                  className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#bf2026] focus:border-transparent"
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-white border border-gray-200 ">
              <TabsTrigger value="all">All Books</TabsTrigger>
              <TabsTrigger value="reading">Currently Reading</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="recent">Recently Added</TabsTrigger>
              <TabsTrigger value="collection">Collections</TabsTrigger>
            </TabsList>

            {/* Collections Tab */}
            <TabsContent value="collection" className="mt-6">
              {collections.length === 0 ? (
                <p className="text-gray-500 text-center py-6">No collections created yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {collections.map((c) => (
                    <Card
                      key={c.id}
                      className="shadow-md hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => setExpandedCollectionId(c.id)} // ✅ opens collection
                    >
                      <CardContent className="p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Folder className="w-5 h-5 text-[#1d4d6a]" />
                            <h3 className="text-[#1d4d6a] font-medium">{c.name}</h3>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCollection(c);
                                setCollectionName(c.name);
                                setIsRenameDialogOpen(true);
                              }}
                            >
                              <Edit3 className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCollection(c.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">{c.books.length} books</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Create Collection Dialog */}
      <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1d4d6a]">Create New Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="collection-name">Collection Name</Label>
              <Input
                id="collection-name"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                placeholder="e.g., Summer Reading List"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCollectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCollection}
              className="bg-[#bf2026] hover:bg-[#a01c22] text-white"
            >
              Create Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Collection Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1d4d6a]">Rename Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="rename-input">New Name</Label>
            <Input
              id="rename-input"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRenameCollection}
              className="bg-[#bf2026] hover:bg-[#a01c22] text-white"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
