// src/components/BookReader.tsx
import { useState, useEffect } from "react";
import {
  X,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import PDFJSViewer from "./PDFJSViewer";
import * as React from "react";

interface BookReaderProps {
  bookId: string | number;
  drm?: any;
  onClose: () => void;

  /** 🔒 How many pages are free in preview mode (for locked books). Default: 2 */
  previewPages?: number;
}

export function BookReader({
  bookId,
  drm,
  onClose,
  previewPages,
}: BookReaderProps) {
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [zoom, setZoom] = useState(1.2);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [highlightMode, setHighlightMode] = useState(false);
  const [highlights, setHighlights] = useState<any[]>([]);

  const [isLocked, setIsLocked] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // ✅ Configurable preview pages, safe fallback = 2
  const effectivePreviewPages = React.useMemo(() => {
    if (typeof previewPages === "number" && previewPages > 0) {
      return Math.floor(previewPages);
    }
    return 2; // default preview length
  }, [previewPages]);

  /* --------------------------------------------------
      1️⃣ Fetch Book Metadata + Purchase Status
  -----------------------------------------------------*/
  useEffect(() => {
    if (!bookId) {
      setError("Invalid book ID.");
      setLoading(false);
      return;
    }

    async function loadBook() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`https://ebook-backend-lxce.onrender.com/api/books/${bookId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error("Book not found.");

        const data = await res.json();
        setBook(data.book);

        // ⭐️ resume at last_page
        const start = data.book.last_page > 1 ? data.book.last_page : 1;
        setCurrentPage(start);

        // check purchase
        const pres = await fetch(
          `https://ebook-backend-lxce.onrender.com/api/purchase/check?bookId=${data.book.id}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );

        if (pres.ok) {
          const pd = await pres.json();
          // 🔒 locked = not purchased
          setIsLocked(!pd.purchased);
        } else {
          // If check fails, stay locked (secure-by-default)
          setIsLocked(true);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load book.");
      } finally {
        setLoading(false);
      }
    }

    loadBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, token]);

  /* --------------------------------------------------
      OPTIONAL: load highlights
  -----------------------------------------------------*/
  useEffect(() => {
    if (!book || !token) return;

    async function loadHighlights() {
      try {
        const res = await fetch(
          `https://ebook-backend-lxce.onrender.com/api/library/highlights/${book.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return;
        const data = await res.json();
        setHighlights(data || []);
      } catch (err) {
        console.error("loadHighlights error:", err);
      }
    }

    loadHighlights();
  }, [book, token]);

  async function handleDeleteHighlight(id: number | string) {
    if (!token) return;
    try {
      await fetch(`https://ebook-backend-lxce.onrender.com/api/library/highlights/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setHighlights((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error("deleteHighlight error:", err);
    }
  }

  /* --------------------------------------------------
      🔁 Redirect to purchase page
  -----------------------------------------------------*/
  const handleBuyNowRedirect = (id: number) => {
    if (!id) return;
    // Client-side redirect, actual access still enforced by backend
    window.location.href = `/purchase/book/${id}`;
  };

  /* --------------------------------------------------
      BUY MODAL (Unlock overlay)
  -----------------------------------------------------*/
  function handlePurchase() {
    if (!book) return;

    localStorage.setItem("purchaseType", "book");
    localStorage.setItem("purchaseId", String(book.id));
    localStorage.setItem(
      "purchaseItems",
      JSON.stringify([{ id: book.id, type: "book" }])
    );

    localStorage.setItem("previousSection", "reader");

    window.location.href = `/purchase/${book.id}`;
  }

  function handlePageChange(pg: number) {
    if (!book) return;

    // prevent invalid page numbers
    if (pg < 1 || pg > totalPages) return;

    // 🔒 Locked books: block navigation beyond preview
    if (isLocked && pg > effectivePreviewPages) {
      setShowBuyModal(true);
      return;
    }

    // update UI
    setCurrentPage(pg);

    // send progress event
    window.dispatchEvent(
      new CustomEvent("reader:progress", {
        detail: { id: book.id, page: pg, totalPages },
      })
    );
  }

  /* --------------------------------------------------
      CLOSE HANDLER
  -----------------------------------------------------*/
  const handleClose = () => onClose();

  /* --------------------------------------------------
      UI STATES
  -----------------------------------------------------*/

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-700 text-lg">
          Loading book…
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white text-red-600">
        <p className="text-xl mb-4">⚠️ {error || "Book not found"}</p>
        <Button onClick={handleClose}>Close Reader</Button>
      </div>
    );
  }

  /* --------------------------------------------------
      MAIN RENDER
  -----------------------------------------------------*/
  return (
    <div
      className={`fixed inset-0 z-50 ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      {/* HEADER */}
      <header
        className={`sticky top-0 border-b ${
          theme === "dark"
            ? "border-gray-800 bg-black"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={handleClose} variant="ghost">
              <X />
            </Button>

            <div>
              <h2>{book.title}</h2>
              <p className="text-sm text-gray-500">{book.author}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              variant="ghost"
            >
              <ZoomOut />
            </Button>

            <Button
              onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
              variant="ghost"
            >
              <ZoomIn />
            </Button>

            <Button
              onClick={() =>
                setTheme((t) => (t === "light" ? "dark" : "light"))
              }
              variant="ghost"
            >
              {theme === "light" ? <Moon /> : <Sun />}
            </Button>

            <Button
              onClick={() => setHighlightMode((m) => !m)}
              variant="ghost"
              className={highlightMode ? "text-yellow-500" : ""}
            >
              ✏️ Highlight
            </Button>

            <Button variant="ghost">
              <Menu />
            </Button>
          </div>
        </div>
      </header>

      {/* PDF VIEWER */}
      <div className="flex justify-center h-[calc(100vh-220px)] overflow-auto">
        <PDFJSViewer
          url={book.file_url}
          page={currentPage}
          scale={zoom}
          onTotalPages={setTotalPages}
          onPageChange={handlePageChange}
          highlightMode={highlightMode}
          highlights={highlights}
          isLocked={isLocked}
          // 🔒 pass consistent preview limit to viewer
          previewPages={effectivePreviewPages}
          bookId={book.id}
          onBuyClick={handleBuyNowRedirect}
          onDeleteHighlight={handleDeleteHighlight}
        />
      </div>

      {/* FOOTER */}
      <div
        className={`fixed bottom-0 left-0 right-0 border-t ${
          theme === "dark"
            ? "border-gray-800 bg-black"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            onClick={() => {
              const newPage = Math.max(1, currentPage - 1);
              handlePageChange(newPage);
            }}
          >
            <ChevronLeft /> Prev
          </Button>

          <span className="text-gray-500">
            Page {currentPage} / {totalPages}
          </span>

          <Button
            onClick={() => {
              // 🔒 if locked & already at/after last preview page → show overlay
              if (isLocked && currentPage >= effectivePreviewPages) {
                setShowBuyModal(true);
                return;
              }
              const newPage = Math.min(totalPages, currentPage + 1);
              handlePageChange(newPage);
            }}
          >
            Next <ChevronRight />
          </Button>
        </div>

        <Slider
          className="px-4 pb-2"
          value={[currentPage]}
          min={1}
          max={
            isLocked
              ? Math.min(totalPages, effectivePreviewPages)
              : totalPages
          }
          onValueChange={(v) => {
            const pg = v[0];

            // 🔒 Prevent sliding beyond preview
            if (isLocked && pg > effectivePreviewPages) {
              setShowBuyModal(true);
              return;
            }

            handlePageChange(pg);
          }}
        />
      </div>

      {/* BUY MODAL = Unlock Overlay */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
          <div className="bg-white p-6 rounded-xl text-black max-w-sm w-full">
            <h2 className="text-xl font-semibold mb-2 text-center">
              Unlock Full Book
            </h2>
            <p className="text-sm text-gray-600 mb-4 text-center">
              You have reached the end of the free preview (
              {effectivePreviewPages} page
              {effectivePreviewPages > 1 ? "s" : ""}). Purchase to continue
              reading.
            </p>

            <Button className="w-full mb-3" onClick={handlePurchase}>
              Buy Now
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowBuyModal(false)}
            >
              Continue Preview
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookReader;