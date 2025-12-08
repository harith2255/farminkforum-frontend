import { useState, useEffect } from "react";
import {
  X, Sun, Moon, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import PDFJSViewer from "./PDFJSViewer";
import * as React from "react";

export default function NotesReader({ note, drm, onClose }: any) {
  if (!note) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-400">
        Loading note...
      </div>
    );
  }

  const [theme, setTheme] = useState("light");
  const [zoom, setZoom] = useState(1.2);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlights, setHighlights] = useState<any[]>([]);
  const token = localStorage.getItem("token");
  const userEmail = localStorage.getItem("email") || "User";

  /* ============================
     ⚠️ FILE URL SAFETY CHECK
  ============================ */
  if (!note.file_url) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-gray-600">
        <p className="mb-2">You need to purchase this note to read it.</p>

        <Button
          className="bg-[#bf2026] text-white"
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </div>
    );
  }

  /* ============================
     DRM: COPY / RIGHT CLICK BLOCK
  ============================ */
  useEffect(() => {
    if (!drm?.copy_protection) return;

    const prevent = (e: any) => e.preventDefault();

    document.addEventListener("copy", prevent);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("selectstart", prevent);

    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("selectstart", prevent);
    };
  }, [drm]);

  /* ============================
     DRM: DETECT DEVTOOLS
  ============================ */
  useEffect(() => {
    if (!drm?.screenshot_prevention) return;

    let locked = false;

    const interval = setInterval(() => {
      if (locked) return;

      if (window.outerWidth - window.innerWidth > 160) {
        locked = true;
        alert("Screen recording / devtools detected. Closing reader.");
        window.location.reload();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [drm]);

  /* ============================
     LOAD HIGHLIGHTS + LAST PAGE
  ============================ */
  useEffect(() => {
    if (!note || !token) return;

    (async () => {
      try {
        const hres = await fetch(
          `https://ebook-backend-lxce.onrender.com/api/notes/highlights/${note.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (hres.ok) setHighlights(await hres.json());

        const pres = await fetch(
          `https://ebook-backend-lxce.onrender.com/api/notes/lastpage/${note.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (pres.ok) {
          const data = await pres.json();
          if (data?.last_page) setCurrentPage(Number(data.last_page));
        }
      } catch (err) {
        console.warn("Failed load highlights/last page", err);
      }
    })();
  }, [note]);

  /* ============================
     SAVE LAST PAGE (debounced)
  ============================ */
  useEffect(() => {
    if (!note || !token) return;

    const t = setTimeout(async () => {
      try {
        await fetch(`https://ebook-backend-lxce.onrender.com/api/notes/lastpage/${note.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ last_page: currentPage }),
        });
      } catch {}
    }, 500);

    return () => clearTimeout(t);
  }, [currentPage, note]);

  /* ============================
     HIGHLIGHTS
  ============================ */
  const handleAddHighlight = async (h: any) => {
    try {
      if (!token) return;

      const res = await fetch("https://ebook-backend-lxce.onrender.com/api/notes/highlights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          note_id: note.id,
          page: h.page,
          x_pct: h.xPct,
          y_pct: h.yPct,
          w_pct: h.wPct,
          h_pct: h.hPct,
          color: h.color || "rgba(255,255,0,0.35)",
        }),
      });

      if (!res.ok) throw new Error();

      const saved = await res.json();
      setHighlights((prev) => [...prev, saved]);
    } catch (err) {
      console.warn("add highlight failed");
    }
  };

  const handleDeleteHighlight = async (id: number) => {
    try {
      if (!token) return;

      const res = await fetch(
        `https://ebook-backend-lxce.onrender.com/api/notes/highlights/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error();

      setHighlights((prev) => prev.filter((h) => h.id !== id));
    } catch {}
  };

  /* ============================================================= */

  return (
    <div
      className={`fixed inset-0 z-50 ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      {/* HEADER */}
      <header
        className={`sticky top-0 z-10 border-b ${
          theme === "dark"
            ? "border-gray-800 bg-black"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={onClose} variant="ghost">
              <X />
            </Button>

            <div>
              <h2 className={theme === "dark" ? "text-white" : "text-[#1d4d6a]"}>
                {note.title}
              </h2>
              <p className="text-sm text-gray-500">{note.author}</p>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex items-center gap-2">
            <Button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} variant="ghost">
              <ZoomOut />
            </Button>

            <Button onClick={() => setZoom(Math.min(3, zoom + 0.1))} variant="ghost">
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
          </div>
        </div>
      </header>

      {/* PDF VIEW */}
      <div className="flex justify-center h-[calc(100vh-220px)] overflow-auto">
        <PDFJSViewer
          url={note.file_url}
          page={currentPage}
          scale={zoom}
          onTotalPages={setTotalPages}
          onPageChange={setCurrentPage}
          highlightMode={highlightMode}
          highlights={highlights}
          onAddHighlight={handleAddHighlight}
          onDeleteHighlight={handleDeleteHighlight}
          drm={drm}
        />
      </div>

      {/* FOOTER */}
      <div
        className={`fixed left-0 right-0 border-t ${
          theme === "dark"
            ? "border-gray-800 bg-black"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>
            <ChevronLeft /> Prev
          </Button>

          <span className="text-gray-500">
            Page {currentPage} / {totalPages}
          </span>

          <Button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}>
            Next <ChevronRight />
          </Button>
        </div>

        <Slider
          className="px-4 pb-0 pt-0"
          value={[currentPage]}
          min={1}
          max={totalPages}
          onValueChange={(v) => setCurrentPage(v[0])}
        />
      </div>
    </div>
  );
}