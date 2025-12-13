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
  startPage?: number;
  drm?: any;
  onClose: () => void;
  previewPages?: number;
}
const API_BASE = "https://ebook-backend-lxce.onrender.com";

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

  // PAGE STATE (default 1 - overridden by reader:open event)
  const [currentPage, setCurrentPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [isLocked, setIsLocked] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [drmConfig, setDrmConfig] = useState<any>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // DEVICE ID
  const deviceIdRef = useRef<string | null>(null);
  if (typeof window !== "undefined" && !deviceIdRef.current) {
    const existing = localStorage.getItem("device_id");
    const id =
      existing ||
      (crypto && (crypto as any).randomUUID
        ? (crypto as any).randomUUID()
        : `d-${Math.random().toString(36).slice(2)}`);

    deviceIdRef.current = id;
    localStorage.setItem("device_id", id);
  }
  const deviceId = deviceIdRef.current;

  const effectivePreviewPages = React.useMemo(() => {
    if (typeof previewPages === "number" && previewPages > 0)
      return Math.floor(previewPages);
    return 2;
  }, [previewPages]);

  /* --------------------------------------------------
    HELPER: SAFE FETCH
  -------------------------------------------------- */
  async function fetchJson(input: RequestInfo, init?: RequestInit) {
    const res = await fetch(input, init);
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.toLowerCase().includes("application/json");

    if (!res.ok) {
      if (isJson) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error || body?.reason || `HTTP ${res.status}`;
        const err: any = new Error(msg);
        err.status = res.status;
        err.body = body;
        throw err;
      } else {
        const text = await res.text().catch(() => "");
        const snippet = text ? text.slice(0, 200) : `HTTP ${res.status}`;
        const err: any = new Error(`Server error: ${snippet}`);
        err.status = res.status;
        throw err;
      }
    }

    return isJson ? res.json() : res.text();
  }

  /* --------------------------------------------------
    FIX: LISTEN FOR start_page FROM MyLibrary
  -------------------------------------------------- */
  useEffect(() => {
    const handleReaderOpen = (e: any) => {
      const { start_page } = e.detail || {};
      if (start_page && start_page > 0) {
        console.log("➡️ Reading will start from page:", start_page);
        setCurrentPage(start_page);
      }
    };

    window.addEventListener("reader:open", handleReaderOpen);
    return () => window.removeEventListener("reader:open", handleReaderOpen);
  }, []);

  /* --------------------------------------------------
    Register Device (silent)
  -------------------------------------------------- */
  async function tryRegisterDevice() {
    if (!token || !deviceId) return;
    try {
      await fetchJson(`${API_BASE}/api/drm/register-device`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ device_id: deviceId }),
      });
    } catch (err) {
      console.warn("tryRegisterDevice:", (err as Error).message || err);
    }
  }

  /* --------------------------------------------------
    Load Book Metadata + DRM
  -------------------------------------------------- */
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

        // Book metadata
        let data: any;
        try {
          data = await fetchJson(`${API_BASE}/api/books/${bookId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        } catch (err: any) {
          throw new Error(`Book fetch error: ${err?.message}`);
        }

        if (!mounted) return;
        setBook(data.book ?? null);

        // DEFAULT fallback if event hasn't set start_page yet
        if (!data.book?.last_page) {
          // if no saved page, don't overwrite event-based page
        } else if (currentPage === 1) {
          // only override if event didn't already set page
          setCurrentPage(data.book.last_page);
        }

        await tryRegisterDevice();

        if (!token) {
          const bookPrice = data?.book?.price ?? null;
          const isFree = Number(bookPrice) === 0;
          setIsLocked(!isFree);
          return;
        }

        // DRM Check
        let drmData: any;
        try {
          drmData = await fetchJson(
            `${API_BASE}/api/drm/check-access?book_id=${bookId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "x-device-id": deviceId ?? "",
              },
            }
          );
        } catch (err: any) {
          if (err?.body?.error === "no_valid_access") {
            setIsLocked(true);
            setDrmConfig({
              copy_protection: false,
              watermarking: true,
              screenshot_prevention: false,
              device_limit: 3,
              watermark_text: localStorage.getItem("email") || "User",
            });
            return;
          }

          if (err?.status === 401 || err?.status === 403) {
            throw new Error("Unauthorized — please login again.");
          }

          throw new Error(err?.message || "DRM access failed");
        }

        if (!drmData?.can_read) {
          setIsLocked(true);
          setDrmConfig({
            copy_protection: drmData.copy_protection,
            watermarking: drmData.watermarking,
            screenshot_prevention: drmData.screenshot_prevention,
            device_limit: drmData.device_limit ?? 3,
            watermark_text:
              drmData.watermark_text ||
              localStorage.getItem("email") ||
              "User",
          });
          return;
        }

        setIsLocked(false);
        setDrmConfig({
          copy_protection: drmData.copy_protection,
          watermarking: drmData.watermarking,
          screenshot_prevention: drmData.screenshot_prevention,
          device_limit: drmData.device_limit ?? 3,
          watermark_text:
            drmData.watermark_text ||
            localStorage.getItem("email") ||
            "User",
        });
      } catch (err: any) {
        setError(err?.message || "Failed to load book");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => (mounted = false);
  }, [bookId, token, deviceId]);

  /* --------------------------------------------------
    Load highlights
  -------------------------------------------------- */
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
    } catch {}
  }

  /* --------------------------------------------------
    Page Change Handler
  -------------------------------------------------- */
  function handlePageChange(pg: number) {
  if (!book) return;

  // Prevent double events
  if (pg === currentPage) return;

  if (pg < 1 || pg > totalPages) return;

  if (isLocked && pg > effectivePreviewPages) {
    setShowBuyModal(true);
    return;
  }

  setCurrentPage(pg);

  // Log reading activity (optional)
  if (token) {
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
      }),
    }).catch(() => {});
  }

  // Dispatch progress event to App.tsx
  window.dispatchEvent(
    new CustomEvent("reader:progress", {
      detail: { bookId: book.id, page: pg, totalPages },
    })
  );
}


  /* --------------------------------------------------
    UI STATES
  -------------------------------------------------- */
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
    RENDER
  -------------------------------------------------- */
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
            <Button onClick={onClose} variant="ghost">
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
      <div
        className={`fixed bottom-0 left-0 right-0 border-t ${
          theme === "dark"
            ? "border-gray-800 bg-black"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          >
            <ChevronLeft /> Prev
          </Button>

          <span className="text-gray-500">
            Page {currentPage} / {totalPages}
          </span>

          <Button
            onClick={() => {
              if (isLocked && currentPage >= effectivePreviewPages)
                return setShowBuyModal(true);
              return handlePageChange(Math.min(totalPages, currentPage + 1));
            }}
          >
            Next <ChevronRight />
          </Button>
        </div>

        <Slider
          className="px-4 pb-2"
          value={[currentPage]}
          min={1}
          max={isLocked ? effectivePreviewPages : totalPages}
          onValueChange={(v) => {
            const pg = v[0];
            if (isLocked && pg > effectivePreviewPages) {
              setShowBuyModal(true);
              return;
            }
            handlePageChange(pg);
          }}
        />
      </div>

      {showBuyModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
          <div className="bg-white p-6 rounded-xl text-black max-w-sm w-full">
            <h2 className="text-xl font-semibold mb-2 text-center">
              Unlock Full Book
            </h2>
            <p className="text-sm text-gray-600 mb-4 text-center">
              You have reached the preview limit ({effectivePreviewPages}{" "}
              pages).
            </p>
            <Button
              className="w-full mb-3"
              onClick={() =>
                (window.location.href = `/purchase/book/${book.id}`)
              }
            >
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