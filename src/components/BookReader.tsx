// src/components/BookReader.tsx
import { useState, useEffect } from "react";
import {
  X, Sun, Moon, ZoomIn, ZoomOut,
  Menu, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import PDFJSViewer from "./PDFJSViewer";
import * as React from "react";

export function BookReader({ book, onClose }: any) {
  const [theme, setTheme] = useState("light");
  const [zoom, setZoom] = useState(1.2);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // study session timer
  const [sessionStart, setSessionStart] = useState<number | null>(null);

  // highlights
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlights, setHighlights] = useState<any[]>([]);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  /* --------------------------------------------------
      Load highlights + lastPage AND start study timer
  -----------------------------------------------------*/
  useEffect(() => {
    if (!book) return;

    window.dispatchEvent(new CustomEvent("reader:open", { detail: book }));

    (async () => {
      try {
        if (!token) return;

        // load highlights
        const hres = await fetch(
          `https://ebook-backend-lxce.onrender.com/api/library/highlights/${book.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (hres.ok) setHighlights(await hres.json());

        // load last page
        const pres = await fetch(
          `https://ebook-backend-lxce.onrender.com/api/library/lastpage/${book.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (pres.ok) {
          const data = await pres.json();
          if (data?.last_page) setCurrentPage(Number(data.last_page));
        }

        // start study tracking timer
        setSessionStart(Date.now());
      } catch (err) {
        console.warn("Failed loading reader data", err);
      }
    })();
  }, [book]);

  /* --------------------------------------------------
      Save Last Page (Debounced)
  -----------------------------------------------------*/
  useEffect(() => {
    if (!book) return;
    const t = setTimeout(async () => {
      try {
        if (!token) return;
        await fetch(
          `https://ebook-backend-lxce.onrender.com/api/library/lastpage/${book.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ last_page: currentPage }),
          }
        );
      } catch (err) {
        console.warn("save last page failed", err);
      }
    }, 500);

    return () => clearTimeout(t);
  }, [currentPage, book]);

  /* --------------------------------------------------
      Update Reading Progress (auto)
      progress = (current_page / total_pages) * 100
  -----------------------------------------------------*/
 /* -------------------------------------------
    Update Reading Progress (auto)
--------------------------------------------*/
useEffect(() => {
  if (!book || !currentPage || !totalPages) return;

  const t = setTimeout(async () => {
    try {
      if (!token) return;

      const progress = Math.round((currentPage / totalPages) * 100);

      await fetch(
        `https://ebook-backend-lxce.onrender.com/api/library/progress/${book.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ progress }), // ✅ FIXED
        }
      );
    } catch (err) {
      console.warn("progress update failed", err);
    }
  }, 500);

  return () => clearTimeout(t);
}, [currentPage, totalPages, book]);


  /* --------------------------------------------------
      Add Highlight
  -----------------------------------------------------*/
  const handleAddHighlight = async (h: any) => {
    try {
      if (!token) return;

      const res = await fetch("https://ebook-backend-lxce.onrender.com/api/library/highlights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          book_id: book.id,
          page: h.page,
          x_pct: h.xPct,
          y_pct: h.yPct,
          w_pct: h.wPct,
          h_pct: h.hPct,
          color: h.color || "rgba(255,255,0,0.35)",
          note: h.text || "",
        }),
      });

      if (!res.ok) throw new Error("save highlight failed");

      const saved = await res.json();
      setHighlights((prev) => [...prev, saved]);
    } catch (err) {
      console.warn("add highlight failed", err);
    }
  };

  /* --------------------------------------------------
      Delete Highlight
  -----------------------------------------------------*/
  const handleDeleteHighlight = async (highlightId: number) => {
    try {
      if (!token) return;

      const res = await fetch(
        `https://ebook-backend-lxce.onrender.com/api/library/highlights/${highlightId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("delete failed");

      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    } catch (err) {
      console.warn("delete highlight failed", err);
    }
  };

  /* --------------------------------------------------
      Close Reader → Save Study Time
  -----------------------------------------------------*/
  const handleCloseReader = async () => {
    if (sessionStart) {
      const ms = Date.now() - sessionStart;
      const hours = ms / (1000 * 60 * 60);

      try {
        await fetch(`https://ebook-backend-lxce.onrender.com/api/library/study-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ duration: hours }),
        });

        window.dispatchEvent(new Event("dashboard:refresh"));
      } catch (err) {
        console.warn("Failed to save study session", err);
      }
    }

    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      {/* Header */}
      <header
        className={`sticky top-0 z-10 border-b ${
          theme === "dark"
            ? "border-gray-800 bg-black"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={handleCloseReader} variant="ghost">
              <X />
            </Button>
            <div>
              <h2
                className={
                  theme === "dark" ? "text-white" : "text-[#1d4d6a]"
                }
              >
                {book.title}
              </h2>
              <p className="text-sm text-gray-500">{book.author}</p>
            </div>
          </div>

          {/* Tools */}
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
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
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

      {/* PDF Viewer */}
      <div className="flex justify-center py-6 h-[calc(100vh-220px)] overflow-auto">
        <PDFJSViewer
          url={book.file_url}
          page={currentPage}
          scale={zoom}
          onTotalPages={setTotalPages}
          onPageChange={setCurrentPage}
          bookId={book.id}
          highlightMode={highlightMode}
          highlights={highlights}
          onAddHighlight={handleAddHighlight}
          onDeleteHighlight={handleDeleteHighlight}
        />
      </div>

      {/* Pagination */}
      <div
        className={`fixed bottom-0 left-0 right-0 border-t ${
          theme === "dark"
            ? "border-gray-800 bg-black"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft /> Prev
          </Button>

          <span className="text-gray-500">
            Page {currentPage} / {totalPages}
          </span>

          <Button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next <ChevronRight />
          </Button>
        </div>

        <Slider
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