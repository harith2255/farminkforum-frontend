import { useState } from 'react';
import { Button } from './ui/button';
import { 
  X, 
  Sun, 
  Moon, 
  ZoomIn, 
  ZoomOut, 
  Bookmark, 
  Highlighter, 
  Menu,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react';
import { Slider } from './ui/slider';

interface BookReaderProps {
  book: any;
  onClose: () => void;
}

export function BookReader({ book, onClose }: BookReaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [fontSize, setFontSize] = useState(18);
  const [showMenu, setShowMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightMode, setHighlightMode] = useState(false);

  const totalPages = book.pages || 450;

  const sampleContent = `
    <h1>Chapter ${Math.floor(currentPage / 20) + 1}: Introduction to ${book.title}</h1>
    
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
    
    <h2>Key Concepts</h2>
    
    <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
    
    <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
    
    <blockquote>"The important thing is not to stop questioning. Curiosity has its own reason for existing."</blockquote>
    
    <h2>Practical Applications</h2>
    
    <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
    
    <ul>
      <li>Understanding fundamental principles</li>
      <li>Applying theoretical knowledge to practical scenarios</li>
      <li>Developing critical thinking skills</li>
      <li>Building a strong foundation for advanced topics</li>
    </ul>
    
    <p>Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.</p>
    
    <h2>Summary</h2>
    
    <p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.</p>
  `;

  return (
    <div className={`fixed inset-0 z-50 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'} transition-colors`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 border-b ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className={theme === 'dark' ? 'text-white hover:bg-gray-900' : ''}
            >
              <X className="w-5 h-5" />
            </Button>
            <div>
              <h2 className={theme === 'dark' ? 'text-white' : 'text-[#1d4d6a]'}>{book.title}</h2>
              <p className="text-sm text-gray-500">{book.author}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Font Size Controls */}
            <Button
              onClick={() => setFontSize(Math.max(14, fontSize - 2))}
              variant="ghost"
              size="sm"
              className={theme === 'dark' ? 'text-white hover:bg-gray-900' : ''}
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            <span className="text-sm text-gray-500 w-12 text-center">{fontSize}px</span>
            <Button
              onClick={() => setFontSize(Math.min(24, fontSize + 2))}
              variant="ghost"
              size="sm"
              className={theme === 'dark' ? 'text-white hover:bg-gray-900' : ''}
            >
              <ZoomIn className="w-5 h-5" />
            </Button>

            <div className={`w-px h-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} mx-2`} />

            {/* Highlight Tool */}
            <Button
              onClick={() => setHighlightMode(!highlightMode)}
              variant="ghost"
              size="sm"
              className={`${highlightMode ? 'bg-yellow-100 text-yellow-700' : theme === 'dark' ? 'text-white hover:bg-gray-900' : ''}`}
            >
              <Highlighter className="w-5 h-5" />
            </Button>

            {/* Bookmark */}
            <Button
              variant="ghost"
              size="sm"
              className={theme === 'dark' ? 'text-white hover:bg-gray-900' : ''}
            >
              <Bookmark className="w-5 h-5" />
            </Button>

            <div className={`w-px h-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} mx-2`} />

            {/* Theme Toggle */}
            <Button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              variant="ghost"
              size="sm"
              className={theme === 'dark' ? 'text-white hover:bg-gray-900' : ''}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>

            {/* Settings */}
            <Button
              onClick={() => setShowMenu(!showMenu)}
              variant="ghost"
              size="sm"
              className={theme === 'dark' ? 'text-white hover:bg-gray-900' : ''}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Reading Area */}
      <div className="max-w-4xl mx-auto px-12 py-12">
        <div 
          className={`prose prose-lg max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}
          style={{ fontSize: `${fontSize}px` }}
          dangerouslySetInnerHTML={{ __html: sampleContent }}
        />

        {/* DRM Watermark */}
        <div className={`fixed bottom-4 left-4 text-xs ${theme === 'dark' ? 'text-gray-700' : 'text-gray-300'} pointer-events-none select-none`}>
          Licensed to: Alex Rodriguez • {new Date().toISOString().split('T')[0]}
        </div>
      </div>

      {/* Page Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 border-t ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              variant="ghost"
              size="sm"
              disabled={currentPage === 1}
              className={theme === 'dark' ? 'text-white hover:bg-gray-900' : ''}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              variant="ghost"
              size="sm"
              disabled={currentPage === totalPages}
              className={theme === 'dark' ? 'text-white hover:bg-gray-900' : ''}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <Slider
            value={[currentPage]}
            onValueChange={(value) => setCurrentPage(value[0])}
            min={1}
            max={totalPages}
            step={1}
            className="cursor-pointer"
          />
        </div>
      </div>

      {/* Settings Panel */}
      {showMenu && (
        <div className={`fixed right-0 top-16 bottom-0 w-80 border-l ${theme === 'dark' ? 'border-gray-800 bg-black' : 'border-gray-200 bg-white'} shadow-xl p-6 overflow-y-auto`}>
          <h3 className={`${theme === 'dark' ? 'text-white' : 'text-[#1d4d6a]'} mb-6`}>Reading Settings</h3>
          
          <div className="space-y-6">
            <div>
              <label className="text-sm text-gray-500 mb-2 block">Theme</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setTheme('light')}
                  variant={theme === 'light' ? 'default' : 'outline'}
                  className={theme === 'light' ? 'bg-[#bf2026] hover:bg-[#a01c22] text-white' : ''}
                >
                  <Sun className="w-4 h-4 mr-2" />
                  Light
                </Button>
                <Button
                  onClick={() => setTheme('dark')}
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  className={theme === 'dark' ? 'bg-[#bf2026] hover:bg-[#a01c22] text-white' : ''}
                >
                  <Moon className="w-4 h-4 mr-2" />
                  Dark
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-2 block">Font Size: {fontSize}px</label>
              <Slider
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                min={14}
                max={24}
                step={1}
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 mb-2 block">Quick Navigation</label>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Table of Contents
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Bookmarks
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  My Highlights
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Search in Book
                </Button>
              </div>
            </div>

            <div className={`border-t ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'} pt-4`}>
              <h4 className="text-sm text-gray-500 mb-2">Reading Progress</h4>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-[#bf2026] h-2 rounded-full"
                  style={{ width: `${(currentPage / totalPages) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {Math.round((currentPage / totalPages) * 100)}% complete
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
