import { useState, useEffect } from "react";
import {
  X,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import PDFJSViewer from "./PDFJSViewer";
import * as React from "react";

export default function NotesReader({ note, drm, onClose }: any) {
  /* ============================
     SAFETY: NOTE NOT LOADED
  ============================ */
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
     DRM: BLOCK COPY / SELECT / RIGHT-CLICK
  ============================ */
  useEffect(() => {
    if (!drm?.copy_protection) return;

    const prevent = (e: any) => e.preventDefault();

    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("paste", prevent);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("selectstart", prevent);

    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("paste", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("selectstart", prevent);
    };
  }, [drm]);

  /* ============================
     DRM: BLOCK PRINTSCREEN
  ============================ */
  useEffect(() => {
    if (!drm?.screenshot_prevention) return;

    const handlePrint = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText("");
        alert("Screenshots are disabled by DRM policy.");
      }
    };

    window.addEventListener("keyup", handlePrint);
    return () => window.removeEventListener("keyup", handlePrint);
  }, [drm]);

  /* ============================
     DRM: SCREEN RECORDING / DEVTOOLS DETECTION
  ============================ */
  useEffect(() => {
    if (!drm?.screenshot_prevention) return;

    const interval = setInterval(() => {
      // Detect devtools opening (browser gap changes)
      if (window.outerWidth - window.innerWidth > 160) {
        alert("Screen recording / devtools detected. Closing reader.");
        window.location.reload();
      }
    }, 800);

    return () => clearInterval(interval);
  }, [drm]);

  /* ============================
     LOAD HIGHLIGHTS + LAST PAGE
  ============================ */
  useEffect(() => {
    if (!note) return;

    window.dispatchEvent(
      new CustomEvent("notes-reader:open", { detail: note })
    );

    (async () => {
      try {
        if (!token) return;

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
        console.warn("Failed loading reader info", err);
      }
    })();
  }, [note]);

  /* ============================
     SAVE LAST PAGE
  ============================ */
  useEffect(() => {
    if (!note) return;
    const t = setTimeout(async () => {
      if (!token) return;
      try {
        await fetch(`https://ebook-backend-lxce.onrender.com/api/notes/lastpage/${note.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ last_page: currentPage }),
        });
      } catch (err) {}
    }, 500);

    return () => clearTimeout(t);
  }, [currentPage, note]);

  /* ============================
     HIGHLIGHT FUNCTIONS
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

      if (!res.ok) throw new Error("Failed to save highlight");

      const saved = await res.json();
      setHighlights((prev) => [...prev, saved]);
    } catch (err) {
      console.warn("add highlight failed", err);
    }
  };

  const handleDeleteHighlight = async (highlightId: number) => {
    try {
      if (!token) return;

      const res = await fetch(
        `https://ebook-backend-lxce.onrender.com/api/notes/highlights/${highlightId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to delete highlight");

      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    } catch (err) {}
  };

  return (
    <div
      className={`fixed inset-0 z-50 ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      {/* ============================
          DRM WATERMARK (Visible on screenshot)
      ============================ */}
      {drm?.watermarking && (
        <div
          style={{
            position: "fixed",
            top: "35%",
            left: "20%",
            fontSize: "40px",
            opacity: 0.18,
            pointerEvents: "none",
            zIndex: 999999,
            transform: "rotate(-20deg)",
            color: "#d00",
          }}
        >
          {userEmail} • {new Date().toLocaleString()}
        </div>
      )}

      {/* ============================
          HEADER
      ============================ */}
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
              <h2
                className={theme === "dark" ? "text-white" : "text-[#1d4d6a]"}
              >
                {note.title}
              </h2>
              <p className="text-sm text-gray-500">{note.author}</p>
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
          </div>
        </div>
      </header>

      {/* ============================
          PDF VIEWER
      ============================ */}
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

      {/* ============================
          FOOTER PAGINATION
      ============================ */}
      <div
        className={`fixed left-0 right-0 border-t ${
          theme === "dark"
            ? "border-gray-800 bg-black"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
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