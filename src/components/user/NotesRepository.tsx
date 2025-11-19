import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Search, Filter, Download, Eye, Star } from 'lucide-react';

export function NotesRepository() {
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Agricultural Extension Education', 'Adult and Continuing Education and Extension'];

  const notes = [
    { id: 1, title: 'Agricultural Extension Education Notes', category: 'Agricultural Extension Education', author: 'Prof. Smith', pages: 12, downloads: 2450, rating: 4.8, price: 'Free', featured: true },
    { id: 2, title: 'Adult and Continuing Education and Extension Notes', category: 'Adult and Continuing Education and Extension', author: 'Dr. Johnson', pages: 25, downloads: 1890, rating: 4.9, price: '₹150', featured: true }
  ];

  const handlePreview = (note: any) => {
    setSelectedNote(note);
    setShowPreview(true);
  };

  // Filter notes by selected category
  const filteredNotes =
    activeCategory === 'All'
      ? notes
      : notes.filter((note) => note.category === activeCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1d4d6a] mb-1">Notes Repository</h2>
          <p className="text-sm text-gray-500">Access curated academic notes from top educators</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notes by title, subject, or author..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#bf2026] focus:border-transparent"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Category Buttons */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category}
            variant="outline"
            onClick={() => setActiveCategory(category)}
            className={`transition-all ${
              activeCategory === category
                ? 'bg-[#bf2026] text-white border-[#bf2026] shadow-md scale-105'
                : 'bg-white text-gray-700 hover:bg-[#f9eaea] hover:text-[#bf2026]'
            }`}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Featured Notes */}
      {activeCategory === 'All' && (
        <div>
          <h3 className="text-[#1d4d6a] mb-4">Featured Notes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {notes.filter((n) => n.featured).map((note) => (
              <Card key={note.id} className="border-none shadow-md hover:shadow-xl transition-all group">
                <CardContent className="p-0">
                  <div className="relative bg-gradient-to-br from-[#1d4d6a] to-[#2a5f7f] h-40 flex items-center justify-center rounded-t-lg">
                    <span className="text-6xl">📝</span>
                    <Badge className="absolute top-3 right-3 bg-yellow-500 text-white">Featured</Badge>
                  </div>
                  <div className="p-4">
                    <Badge className="bg-blue-100 text-blue-700 mb-2">{note.category}</Badge>
                    <h4 className="text-[#1d4d6a] mb-1">{note.title}</h4>
                    <p className="text-sm text-gray-500 mb-3">by {note.author}</p>
                    <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
                      <span>{note.pages} pages</span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {note.rating}
                      </span>
                      <span>{note.downloads} downloads</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => handlePreview(note)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white">
                        {note.price === 'Free' ? 'Download' : `Buy ${note.price}`}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Notes (filtered) */}
      <div>
        <h3 className="text-[#1d4d6a] mb-4">
          {activeCategory === 'All' ? 'All Notes' : `${activeCategory} Notes`}
        </h3>
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="border-none shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-24 bg-gradient-to-br from-[#1d4d6a] to-[#2a5f7f] rounded flex items-center justify-center text-3xl shrink-0">
                    📝
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-[#1d4d6a] truncate">{note.title}</h4>
                          {note.featured && (
                            <Badge className="bg-yellow-500 text-white shrink-0">Featured</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">by {note.author}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 shrink-0">{note.category}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                      <span>{note.pages} pages</span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {note.rating}
                      </span>
                      <span>{note.downloads.toLocaleString()} downloads</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePreview(note)}>
                        <Eye className="w-3 h-3 mr-2" />
                        Preview
                      </Button>
                      <Button size="sm" className="bg-[#bf2026] hover:bg-[#a01c22] text-white">
                        <Download className="w-3 h-3 mr-2" />
                        {note.price === 'Free' ? 'Download Free' : `Buy ${note.price}`}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1d4d6a]">{selectedNote?.title}</DialogTitle>
            <DialogDescription>by {selectedNote?.author} • {selectedNote?.category}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-8 min-h-[500px]">
              <h3 className="text-[#1d4d6a] mb-4">Preview - Page 1</h3>
              <div className="space-y-4 text-gray-700">
                <p>This is a preview of the notes. The actual content contains comprehensive study material covering all key concepts and formulas.</p>
                <h4 className="text-[#1d4d6a] mt-6">Key Topics Covered:</h4>
                <ul className="list-disc list-inside space-y-2">
                  <li>Fundamental concepts and definitions</li>
                  <li>Important formulas and equations</li>
                  <li>Solved examples and practice problems</li>
                  <li>Quick reference charts and diagrams</li>
                  <li>Exam tips and tricks</li>
                </ul>
                <p className="text-sm text-gray-500 mt-6 italic">
                  Full access includes {selectedNote?.pages} pages of detailed notes with illustrations, examples, and practice questions.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowPreview(false)}>
                Close Preview
              </Button>
              <Button className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white">
                <Download className="w-4 h-4 mr-2" />
                {selectedNote?.price === 'Free' ? 'Download Free' : `Purchase for ${selectedNote?.price}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
