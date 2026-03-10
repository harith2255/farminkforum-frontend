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
import { lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";



const PDFJSViewer = lazy(() => import("./PDFJSViewer"));

import * as React from "react";

interface BookReaderProps {
  bookId: string | number;
  startPage?: number;
  drm?: any;
  onClose: () => void;
  previewPages?: number;
}
const API_BASE = import.meta.env.VITE_API_URL;

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
  const params = new URLSearchParams(window.location.search);
  const urlParam = params.get("src");


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


  useEffect(() => {
    if (!drmConfig?.copy_protection) return;

    const disable = (e: Event) => e.preventDefault();

    document.addEventListener("copy", disable);
    document.addEventListener("cut", disable);
    document.addEventListener("contextmenu", disable);

    return () => {
      document.removeEventListener("copy", disable);
      document.removeEventListener("cut", disable);
      document.removeEventListener("contextmenu", disable);
    };
  }, [drmConfig?.copy_protection]);


  useEffect(() => {
    if (!drmConfig?.screenshot_prevention) return;

    const onBlur = () => document.body.classList.add("blur-sm");
    const onFocus = () => document.body.classList.remove("blur-sm");

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [drmConfig?.screenshot_prevention]);

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


  // ✅ REQUIRED: prepare purchase context before redirect
  const goToPurchase = (bookId: string | number) => {
    localStorage.setItem("purchaseType", "book");
    localStorage.setItem("purchaseId", String(bookId));
    localStorage.setItem(
      "purchaseItems",
      JSON.stringify([{ id: String(bookId), type: "book" }])
    );

    window.location.href = `/purchase/book/${bookId}`;
  };

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

  // -------- INTERVIEW DETECTION --------
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";

  const isInterviewViaPath = pathname.includes("/reader/interview/");
  const interviewIdFromPath = isInterviewViaPath
    ? pathname.split("/reader/interview/")[1]?.split("/")[0]
    : null;

  const isInterviewViaBookId =
    typeof bookId === "string" && bookId.startsWith("interview:");

  const interviewIdFromBookId = isInterviewViaBookId
    ? String(bookId).replace("interview:", "")
    : null;

  const isInterview = isInterviewViaPath || isInterviewViaBookId;
  const interviewId = interviewIdFromPath || interviewIdFromBookId;

  /* --------------------------------------------------
    Load Book Metadata + DRM
  -------------------------------------------------- */
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        // -------- INTERVIEW MODE (FASTER + NO DOUBLE FETCH) --------
        if (isInterview && interviewId) {
          // ✅ get URL passed from opener: /reader/interview/:id?src=....
          const params = new URLSearchParams(window.location.search);
          const directPdfUrl = params.get("src");

          if (!directPdfUrl) {
            throw new Error(
              "Interview PDF URL missing (src parameter). Open material using handleViewMaterial()."
            );
          }

          // 🚀 Optionally: load metadata only (very small & fast)
          const material = await fetchJson(
            `${API_BASE}/api/writing/interview-materials/${interviewId}`,
            token ? { headers: { Authorization: `Bearer ${token}` } } : {}
          );

          if (!mounted) return;
          if (!material) throw new Error("Interview material not found");

          // 👇 no need to call /pdf again!
          setBook({
            id: material.id,
            title: material.title,
            category: material.category,
            file_url: directPdfUrl, // 🟢 already resolved URL
          });

          // 📕 interview materials are not locked
          setIsLocked(false);
          setDrmConfig(null);
          return;
        }

        if (!bookId) {
          setError("Invalid book ID.");
          setLoading(false);
          return;
        }


        const data = await fetchJson(`${API_BASE}/api/books/${bookId}`, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
        if (!mounted) return;
        setBook(data.book ?? null);
        if (data.book?.last_page && currentPage === 1) setCurrentPage(data.book.last_page);
        await tryRegisterDevice();


        if (!token) {
          const bookPrice = data?.book?.price ?? null;
          const isFree = Number(bookPrice) === 0;
          setIsLocked(!isFree);
          return;
        }


const drmData = await fetchJson(
  `${API_BASE}/api/drm/check-access?book_id=${bookId}&device_id=${deviceId}`,
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

console.log("🔐 DRM Check Response:", drmData);
console.log("📖 Book Price:", data?.book?.price);

// Check if book is free - should always allow access
const bookPrice = data?.book?.price ?? null;
const isBookFree = Number(bookPrice) === 0;

if (isBookFree) {
  console.log("✅ Free book detected - unlocking");
  setIsLocked(false);
  setDrmConfig(drmData);
  return;
}

        if (!drmData?.can_read) {
          setIsLocked(true);
          setDrmConfig(drmData);
          return;
        }
        setIsLocked(false);
        setDrmConfig(drmData);
      } catch (err: any) {
        setError(err?.message || "Failed to load content");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [bookId, interviewId, isInterview, token, deviceId]);

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
      .catch(() => { });
  }, [book, token]);

  async function handleDeleteHighlight(id: any) {
    if (!token) return;
    try {
      await fetchJson(`${API_BASE}/api/library/highlights/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setHighlights((prev) => prev.filter((h) => h.id !== id));
    } catch { }
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
    console.log("sending bookId:", book.id, typeof book.id);

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
      }).catch(() => { });
    }

    // Dispatch progress event to App.tsx
    window.dispatchEvent(
      new CustomEvent("reader:progress", {
        detail: { bookId: book.id, page: pg, totalPages },
      })
    );
  }

  async function handleAddHighlight(h: {
    page: number;
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
    color?: string;
  }) {
    if (!token || !book) return;

    // 🔥 1. OPTIMISTIC ADD
    const tempHighlight = {
      ...h,
      id: `temp-${Date.now()}`,
    };

    setHighlights((prev) => [...prev, tempHighlight]);

    try {
      // 🔥 2. SAVE TO BACKEND
      const res = await fetch(`${API_BASE}/api/library/highlights`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          book_id: book.id,
          page: h.page,
          xPct: h.xPct,
          yPct: h.yPct,
          wPct: h.wPct,
          hPct: h.hPct,
          color: h.color,
        }),
      });

      const saved = await res.json();

      // 🔥 3. REPLACE TEMP WITH REAL
      setHighlights((prev) =>
        prev.map((x) => (x.id === tempHighlight.id ? saved : x))
      );
    } catch (err) {
      // 🔥 4. ROLLBACK ON ERROR
      setHighlights((prev) =>
        prev.filter((x) => x.id !== tempHighlight.id)
      );
    }
  }

  const fetchProtectedPDF = async () => {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/interview-materials/${id}/stream`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  };

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
      className={`fixed inset-0 z-50 ${theme === "dark" ? "bg-black text-white" : "bg-white text-black"
        }`}
    >
      {/* HEADER */}
      <header
        className={`sticky top-0 border-b ${theme === "dark"
            ? "border-gray-800 bg-black"
            : "border-gray-200 bg-white"
          }`}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => {
                if (window.opener) {
                  window.close();      // closes tab
                  window.opener.focus();
                } else {
                  window.history.back();  // fallback if same tab
                }
              }}
              variant="ghost"
            >
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
      <div className="flex justify-center h-[calc(108vh-220px)] overflow-auto">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full text-gray-500">
              Loading pages…
            </div>
          }
        >
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
            onBuyClick={() => goToPurchase(book.id)}
            onDeleteHighlight={handleDeleteHighlight}
            onAddHighlight={handleAddHighlight}
            watermarkText={drmConfig?.watermarking ? drmConfig?.watermark_text : null}
          />

        </Suspense>

      </div>

      {/* FOOTER */}
      <div
        className={`fixed bottom-0 left-0 right-0 border-t ${theme === "dark"
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
              onClick={() => goToPurchase(book.id)}
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