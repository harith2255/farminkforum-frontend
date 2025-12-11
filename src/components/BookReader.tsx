// src/components/BookReader.tsx
import { useState, useEffect, useRef } from "react";
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
  previewPages?: number;
}
const API_BASE = "http://localhost:5000";

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

  const [drmConfig, setDrmConfig] = useState<any>(null);

  // Token from localStorage (may be null)
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Persist device id once. Keep ref to avoid reassigning on every render.
  const deviceIdRef = useRef<string | null>(null);
  if (typeof window !== "undefined" && !deviceIdRef.current) {
    const existing = localStorage.getItem("device_id");
    const id = existing || (crypto && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `d-${Math.random().toString(36).slice(2)}`);
    deviceIdRef.current = id;
    localStorage.setItem("device_id", id);
  }
  const deviceId = deviceIdRef.current;

  const effectivePreviewPages = React.useMemo(() => {
    if (typeof previewPages === "number" && previewPages > 0) return Math.floor(previewPages);
    return 2;
  }, [previewPages]);

  /* ---------------------------
     Helper: safe fetch -> parse JSON only if content-type is JSON
     Throws Error with friendly message when server returns HTML or non-json
  --------------------------- */
  async function fetchJson(input: RequestInfo, init?: RequestInit) {
    const res = await fetch(input, init);

    // try to parse json only if content-type present and contains json
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.toLowerCase().includes("application/json");

    if (!res.ok) {
      // try to extract reason from JSON, otherwise fallback
      if (isJson) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error || body?.reason || `HTTP ${res.status}`;
        const err: any = new Error(msg);
        err.status = res.status;
        err.body = body;
        throw err;
      } else {
        // Non JSON (likely HTML) - read text but don't try parse
        const text = await res.text().catch(() => "");
        const snippet = text ? text.slice(0, 200) : `HTTP ${res.status}`;
        const err: any = new Error(`Server error: ${snippet}`);
        err.status = res.status;
        throw err;
      }
    }

    // success path
    if (isJson) return res.json();
    // if success but not json - return text
    return res.text();
  }

  /* --------------------------------------------------
      Register device (silent). Only run when token exists.
      Server may respond 403/401 if token invalid — we handle silently.
  -----------------------------------------------------*/
  async function tryRegisterDevice() {
    if (!token || !deviceId) return;
    try {
      // Don't require admin header; this route should allow user-device registration.
      await fetchJson(`${API_BASE}/api/drm/register-device`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ device_id: deviceId }),
      });
    } catch (err) {
      // silent: registration failing is not fatal. Useful to log for dev.
      console.warn("tryRegisterDevice:", (err as Error).message || err);
    }
  }

  /* --------------------------------------------------
      Load book metadata & DRM check flow
       - robust to HTML responses & missing token
  -----------------------------------------------------*/
  useEffect(() => {
    if (!bookId) {
      setError("Invalid book ID.");
      setLoading(false);
      return;
    }

    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // 1) BOOK info (public)
        let data: any;
        try {
          data = await fetchJson(`${API_BASE}/api/books/${bookId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        } catch (err: any) {
          // Provide clear message
          const msg = err?.message || "Failed to fetch book";
          throw new Error(`Book fetch error: ${msg}`);
        }

        if (!mounted) return;
        setBook(data.book ?? null);
        setCurrentPage(data.book?.last_page > 1 ? data.book.last_page : 1);

        // 2) Attempt device registration (silent)
        await tryRegisterDevice();

        // 3) DRM / access check
        // If there is no token, avoid calling protected endpoints.
        if (!token) {
          // only allow full read if book is free
          const bookPrice = data?.book?.price ?? null;
          const isFree = Number(bookPrice) === 0;
          setIsLocked(!isFree);
          setDrmConfig(null);
          return;
        }

        // Token exists -> call drm endpoint (server must accept x-device-id header)
        let drmData: any;
        try {
          drmData = await fetchJson(`${API_BASE}/api/drm/check-access?book_id=${bookId}`, {
            
            headers: {
              
              Authorization: `Bearer ${token}`,
              "x-device-id": deviceId ?? "",
            },
          });
       } catch (err: any) {
  console.log("DRM CHECK ERROR =", err);

  // USER DOES NOT HAVE ACCESS → Show preview instead of error
  if (err?.message === "no_valid_access" || err?.body?.error === "no_valid_access") {
    console.warn("User has no access → switching to PREVIEW mode");

    setIsLocked(true);
    setDrmConfig({
      copy_protection: false,
      watermarking: true,
      screenshot_prevention: false,
      device_limit: 3,
      watermark_text: localStorage.getItem("email") || "User"
    });

    return; // IMPORTANT — do NOT let the error bubble to setError()
  }

  // token expired → real error
  if (err?.status === 401 || err?.status === 403) {
    throw new Error("Unauthorized or session expired — please login again.");
  }

  // any other error
  throw new Error(err?.message || "DRM access check failed");
}

// User does NOT have full access → enable preview mode
if (!drmData?.can_read) {
  console.warn("User does not have full access → enabling preview mode");

  setIsLocked(true); // PREVIEW MODE
  setDrmConfig({
    copy_protection: !!drmData.copy_protection,
    watermarking: !!drmData.watermarking,
    screenshot_prevention: !!drmData.screenshot_prevention,
    device_limit: drmData.device_limit ?? 3,
    watermark_text:
      drmData.watermark_text ??
      localStorage.getItem("email") ??
      "User",
  });

  return; // IMPORTANT → do NOT throw
}


        // apply DRM config safely
        setDrmConfig({
          copy_protection: !!drmData.copy_protection,
          watermarking: !!drmData.watermarking,
          screenshot_prevention: !!drmData.screenshot_prevention,
          device_limit: drmData.device_limit ?? 3,
          watermark_text: drmData.watermark_text ?? localStorage.getItem("email") ?? "User",
        });

        // isLocked depends on whether user has access or book is free
        setIsLocked(!(drmData.isFree || drmData.subscriptionActive || drmData.individuallyPurchased));
      } catch (err: any) {
        console.error("BookReader.load error:", err);
        // surface a friendly error message to the user
        setError(err?.message || "Failed to load book.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, token, deviceId]);

  /* --------------------------------------------------
      Load highlights
  -----------------------------------------------------*/
  useEffect(() => {
    if (!book || !token) return;
    fetch(`${API_BASE}/api/library/highlights/${book.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json().catch(() => []))
      .then((d) => setHighlights(d))
      .catch(() => {});
  }, [book, token]);

  async function handleDeleteHighlight(id: any) {
    if (!token) return;
    try {
      await fetchJson(`${API_BASE}/api/library/highlights/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setHighlights((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.warn("delete highlight failed:", (err as Error).message || err);
    }
  }

  /* --------------------------------------------------
      Page change: log and limit
  -----------------------------------------------------*/
  function handlePageChange(pg: number) {
    if (!book) return;
    if (pg < 1 || pg > totalPages) return;
    if (isLocked && pg > effectivePreviewPages) {
      setShowBuyModal(true);
      return;
    }
    setCurrentPage(pg);

    if (token) {
      // best-effort logging; don't crash reader if network fails
     fetch(`${API_BASE}/api/books/read`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    book_id: book.id,
    page: pg,
    device_id: deviceId,
  })

      }).catch(() => {});
    }

    window.dispatchEvent(new CustomEvent("reader:progress", { detail: { id: book.id, page: pg, totalPages } }));
  }

  /* --------------------------------------------------
      Apply client side protections (copy/select/print/devtools)
      apply only when drmConfig present
  -----------------------------------------------------*/
  useEffect(() => {
    if (!drmConfig) return;
    const block = (e: Event) => e.preventDefault();
    const kblock = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i") ||
        (e.ctrlKey && e.key.toLowerCase() === "p") ||
        (e.ctrlKey && e.key.toLowerCase() === "s") ||
        e.key === "PrintScreen"
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    if (drmConfig.copy_protection) {
      document.addEventListener("copy", block);
      document.addEventListener("cut", block);
      document.addEventListener("selectstart", block);
      document.addEventListener("contextmenu", block);
    }

    if (drmConfig.screenshot_prevention) {
      window.addEventListener("keydown", kblock);
    }

    const injectDomWatermark = () => {
      const existing = document.getElementById("reader-dom-watermark");
      if (existing) return;
      const w = document.createElement("div");
      w.id = "reader-dom-watermark";
      w.innerText = drmConfig.watermark_text || localStorage.getItem("email") || "User";
      w.style.cssText = `
        position: fixed;
        pointer-events: none;
        bottom: 14px;
        right: 14px;
        opacity: 0.18;
        font-size: 13px;
        z-index: 99999;
      `;
      document.body.appendChild(w);
    };

    if (drmConfig.watermarking) injectDomWatermark();

    return () => {
      if (drmConfig.copy_protection) {
        document.removeEventListener("copy", block);
        document.removeEventListener("cut", block);
        document.removeEventListener("selectstart", block);
        document.removeEventListener("contextmenu", block);
      }
      if (drmConfig.screenshot_prevention) {
        window.removeEventListener("keydown", kblock);
      }
      const domW = document.getElementById("reader-dom-watermark");
      if (domW) domW.remove();
    };
  }, [drmConfig]);

  /* --------------------------------------------------
      UI states
  -----------------------------------------------------*/
  if (loading)
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        Loading book…
      </div>
    );

  if (error || !book)
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center text-red-600">
        <p className="text-xl mb-4">⚠️ {error || "Book not found"}</p>
        <Button onClick={onClose}>Close Reader</Button>
      </div>
    );

  /* --------------------------------------------------
      Main UI (unchanged)
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
            <Button onClick={onClose} variant="ghost">
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
            <Button
              onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
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

      {/* PDF VIEW */}
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
          previewPages={effectivePreviewPages}
          purchased={!isLocked}
          bookId={book.id}
          onBuyClick={(id) => (window.location.href = `/purchase/book/${id}`)}
          onDeleteHighlight={handleDeleteHighlight}
          watermarkText={drmConfig?.watermark_text}
        />
      </div>

      {/* FOOTER */}
      <div className={`fixed bottom-0 left-0 right-0 border-t ${theme === "dark" ? "border-gray-800 bg-black" : "border-gray-200 bg-white"}`}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button onClick={() => handlePageChange(Math.max(1, currentPage - 1))}><ChevronLeft /> Prev</Button>

          <span className="text-gray-500">Page {currentPage} / {totalPages}</span>

          <Button onClick={() => {
            if (isLocked && currentPage >= effectivePreviewPages) return setShowBuyModal(true);
            return handlePageChange(Math.min(totalPages, currentPage + 1));
          }}>
            Next <ChevronRight />
          </Button>
        </div>

        <Slider className="px-4 pb-2" value={[currentPage]} min={1} max={isLocked ? effectivePreviewPages : totalPages} onValueChange={(v) => {
          const pg = v[0];
          if (isLocked && pg > effectivePreviewPages) {
            setShowBuyModal(true);
            return;
          }
          handlePageChange(pg);
        }} />
      </div>

      {/* BUY MODAL */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
          <div className="bg-white p-6 rounded-xl text-black max-w-sm w-full">
            <h2 className="text-xl font-semibold mb-2 text-center">Unlock Full Book</h2>
            <p className="text-sm text-gray-600 mb-4 text-center">You have reached the preview limit ({effectivePreviewPages} pages).</p>
            <Button className="w-full mb-3" onClick={() => window.location.href = `/purchase/${book.id}`}>Buy Now</Button>
            <Button variant="outline" className="w-full" onClick={() => setShowBuyModal(false)}>Continue Preview</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookReader;