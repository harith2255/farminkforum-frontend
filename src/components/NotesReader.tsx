import { useState, useEffect } from "react";
import {
  X, Sun, Moon, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import PDFJSViewer from "./PDFJSViewer";
import * as React from "react";

function getDeviceId() {
  let deviceId = localStorage.getItem("device_id");

  if (!deviceId) {
    deviceId =
      (window.crypto?.randomUUID?.() ??
        `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    localStorage.setItem("device_id", deviceId);
  }

  return deviceId;
}
function authHeaders(token: string | null) {
  return {
    Authorization: `Bearer ${token}`,
    "x-device-id": getDeviceId(),
  };
}

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

  const [drmAllowed, setDrmAllowed] = useState<boolean | null>(null);

useEffect(() => {
  if (!note || !token) return;

  let cancelled = false;

  const checkAccess = async () => {
    try {
      const res = await fetch(
        `https://ebook-backend-lxce.onrender.com/api/drm/check-access?note_id=${note.id}`,
        {
          headers: authHeaders(token), // ✅ FIX
        }
      );

      if (!res.ok) throw new Error("DRM check failed");

      const data = await res.json();

      if (!data?.can_read) {
        alert("Access denied. Purchase or subscription required.");
        onClose();
        return;
      }

      if (!cancelled) setDrmAllowed(true);
    } catch (err) {
      console.error("DRM check error", err);
      alert("DRM check failed");
      onClose();
    }
  };

  checkAccess();

  return () => {
    cancelled = true;
  };
}, [note?.id, token]);

  /* ============================
     DRM: BLOCK COPY / SELECT
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
     DRM: BLOCK PRINT SCREEN
  ============================ */
  useEffect(() => {
    if (!drm?.screenshot_prevention) return;

    const handleKey = (e: any) => {
      if (e.key === "PrintScreen") {
        document.body.style.opacity = "0";
        setTimeout(() => (document.body.style.opacity = "1"), 800);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [drm]);

  /* ============================
     DRM: DEVTOOLS DETECTION
  ============================ */
  useEffect(() => {
    if (!drm?.screenshot_prevention) return;

    let locked = false;

    const interval = setInterval(() => {
      if (locked) return;
      if (window.outerWidth - window.innerWidth > 160) {
        locked = true;
        alert("Screen recorder / DevTools detected. Closing.");
        window.location.reload();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [drm]);

  /* ============================
     LOAD HIGHLIGHTS / LAST PAGE
  ============================ */
  useEffect(() => {
  if (!note || !token) return;

  let cancelled = false;

  (async () => {
    try {
      const hres = await fetch(
        `https://ebook-backend-lxce.onrender.com/api/notes/highlights/${note.id}`,
        { headers: authHeaders(token) }
      );

      if (!cancelled && hres.ok) {
        setHighlights(await hres.json());
      }

      const pres = await fetch(
        `https://ebook-backend-lxce.onrender.com/api/notes/lastpage/${note.id}`,
        { headers: authHeaders(token) }
      );

      if (!cancelled && pres.ok) {
        const data = await pres.json();
        if (data?.last_page) {
          setCurrentPage(Number(data.last_page));
        }
      }
    } catch (err) {
      console.error("Failed to load note metadata", err);
    }
  })();

  return () => {
    cancelled = true;
  };
}, [note?.id, token]);

  /* ============================
     SAVE LAST PAGE
  ============================ */
useEffect(() => {
  if (!note || !token) return;

  const t = setTimeout(async () => {
    try {
      await fetch(
        `https://ebook-backend-lxce.onrender.com/api/notes/lastpage/${note.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(token), // ✅ FIX
          },
          body: JSON.stringify({ last_page: currentPage }),
        }
      );
    } catch (err) {
      console.error("Failed to save last page", err);
    }
  }, 500);

  return () => clearTimeout(t);
}, [currentPage, note?.id, token]); // ✅ FIX

  /* ============================
     ADD HIGHLIGHT
  ============================ */
 const handleAddHighlight = async (h: any) => {
  try {
    const res = await fetch(
      "https://ebook-backend-lxce.onrender.com/api/notes/highlights",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(token), // ✅ FIX
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
      }
    );

    if (!res.ok) throw new Error("Highlight save failed");

    const saved = await res.json();
    setHighlights((prev) => [...prev, saved]);
  } catch (err) {
    console.error("Add highlight failed", err);
  }
};

  /* ============================
     DELETE HIGHLIGHT
  ============================ */
  const handleDeleteHighlight = async (id: number) => {
    try {
      await fetch(
        `https://ebook-backend-lxce.onrender.com/api/notes/highlights/${id}`,
        {
          method: "DELETE",
headers: authHeaders(token),        }
      );

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
      {/* DRM WATERMARK */}
      {drm?.watermarking && (
        <div className="fixed bottom-6 right-6 opacity-20 pointer-events-none text-sm">
          {userEmail} • {new Date().toLocaleString()}
        </div>
      )}

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
      <div className="flex justify-center h-[calc(100vh-200px)] overflow-auto">
       {drmAllowed && (
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
    watermarkText={drm?.watermarking ? userEmail : undefined}
  />
)}

      </div>

      {/* FOOTER + SLIDER */}
      <div
        className={`fixed left-0 right-0 border-t  ${
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