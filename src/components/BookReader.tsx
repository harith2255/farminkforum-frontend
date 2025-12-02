// src/components/BookReader.tsx
import { useState, useEffect } from "react";
import {
  X, Sun, Moon, ZoomIn, ZoomOut, Menu,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import PDFJSViewer from "./PDFJSViewer";
import * as React from "react";

export function BookReader({ bookId, drm, onClose }: any) {
  /* --------------------------------------------------
        ALL HOOKS MUST BE FIRST — ALWAYS!
  -----------------------------------------------------*/
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [theme, setTheme] = useState("light");
  const [zoom, setZoom] = useState(1.2);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [sessionStart, setSessionStart] = useState<number | null>(null);

  const [highlightMode, setHighlightMode] = useState(false);
  const [highlights, setHighlights] = useState<any[]>([]);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  /* --------------------------------------------------
      1️⃣ Fetch Book Metadata
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
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Book not found.");

        const data = await res.json();
        if (!data.book) throw new Error("Book data missing.");

        setBook(data.book);
      } catch (err: any) {
        setError(err.message || "Failed to load book.");
      } finally {
        setLoading(false);
      }
    }

    loadBook();
  }, [bookId]);

  /* --------------------------------------------------
      2️⃣ Load highlights + last page once book exists
  -----------------------------------------------------*/
  useEffect(() => {
    if (!book) return;

    window.dispatchEvent(new CustomEvent("reader:open", { detail: book }));

    (async () => {
      try {
        if (!token) return;

        await fetch("https://ebook-backend-lxce.onrender.com/api/books/read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ book_id: book.id }),
        });

        const hres = await fetch(
          `https://ebook-backend-lxce.onrender.com/api/library/highlights/${book.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (hres.ok) setHighlights(await hres.json());

        const pres = await fetch(
          `https://ebook-backend-lxce.onrender.com/api/library/lastpage/${book.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (pres.ok) {
          const data = await pres.json();
          if (data?.last_page) setCurrentPage(Number(data.last_page));
        }

        setSessionStart(Date.now());
      } catch (err) {
        console.warn("Reader load error", err);
      }
    })();
  }, [book]);

  /* --------------------------------------------------
      3️⃣ Save last page (debounced)
  -----------------------------------------------------*/
  useEffect(() => {
    if (!book) return;

    const t = setTimeout(async () => {
      try {
        if (!token) return;
        await fetch(`https://ebook-backend-lxce.onrender.com/api/library/lastpage/${book.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ last_page: currentPage }),
        });
      } catch (err) {
        console.warn("Failed saving last page", err);
      }
    }, 500);

    return () => clearTimeout(t);
  }, [currentPage, book]);

  /* --------------------------------------------------
      4️⃣ Save study session on close
  -----------------------------------------------------*/
  const handleClose = async () => {
    if (sessionStart) {
      const hours = (Date.now() - sessionStart) / (1000 * 60 * 60);

      await fetch("https://ebook-backend-lxce.onrender.com/api/library/study-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ duration: hours }),
      });
    }

    onClose();
  };

  /* --------------------------------------------------
      5️⃣ SAFE CONDITIONAL UI RENDERING (AFTER HOOKS)
  -----------------------------------------------------*/

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="animate-pulse text-gray-700 text-lg">Loading book…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white text-red-600">
        <p className="text-xl mb-4">⚠️ {error}</p>
        <Button onClick={handleClose}>Close Reader</Button>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white text-gray-600">
        <p>Book data missing.</p>
        <Button className="mt-4" onClick={handleClose}>
          Close
        </Button>
      </div>
    );
  }

  /* --------------------------------------------------
      6️⃣ MAIN RENDER
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
          theme === "dark" ? "border-gray-800 bg-black" : "border-gray-200 bg-white"
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
            <Button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} variant="ghost">
              <ZoomOut />
            </Button>

            <Button onClick={() => setZoom((z) => Math.min(3, z + 0.1))} variant="ghost">
              <ZoomIn />
            </Button>

            <Button onClick={() => setTheme(theme === "light" ? "dark" : "light")} variant="ghost">
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
          onPageChange={setCurrentPage}
          bookId={book.id}
          drm={drm}
          highlightMode={highlightMode}
          highlights={highlights}
        />
      </div>

      {/* FOOTER */}
      <div
        className={`fixed bottom-0 left-0 right-0 border-t ${
          theme === "dark" ? "border-gray-800 bg-black" : "border-gray-200 bg-white"
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft /> Prev
          </Button>

          <span className="text-gray-500">
            Page {currentPage} / {totalPages}
          </span>

          <Button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
            Next <ChevronRight />
          </Button>
        </div>

        <Slider
          className="px-4 pb-2"
          value={[currentPage]}
          min={1}
          max={totalPages}
          onValueChange={(v) => setCurrentPage(v[0])}
        />
      </div>
    </div>
  );
}

export default BookReader;