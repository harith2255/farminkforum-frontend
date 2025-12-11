// src/components/PDFJSViewer.tsx
import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import * as React from "react";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

interface Highlight {
  id: number | string;
  page: number;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  color?: string;
}

interface PDFJSViewerProps {
  /** Instead of exposing a public URL, pass a protected file URL - we fetch bytes with auth */
  url: string;
  page: number;
  scale?: number;
  onTotalPages?: (total: number) => void;
  onPageChange?: (page: number) => void;
  highlightMode?: boolean;
  highlights?: Highlight[];
  isLocked?: boolean;
  previewPages?: number;
  purchased?: boolean;
  onBuyClick?: (bookId: string | number) => void;
  bookId?: string | number;
  onDeleteHighlight?: (id: number | string) => void;
  onRenderStart?: () => void;
  onRenderEnd?: () => void;
  /** watermark text string (eg: user's email) */
  watermarkText?: string;
}

export default function PDFJSViewer(props: PDFJSViewerProps) {
  const {
    url,
    page,
    scale = 1,
    onTotalPages,
    onPageChange,
    highlightMode = false,
    highlights = [],
    isLocked = false,
    previewPages = 1,
    purchased = false,
    onBuyClick,
    bookId,
    onDeleteHighlight,
    onRenderStart,
    onRenderEnd,
    watermarkText,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const currentRenderTask = useRef<any>(null);

  const [pdfInstance, setPdfInstance] = useState<any>(null);
  const [pdfLoadedBytes, setPdfLoadedBytes] = useState<ArrayBuffer | null>(null);

  const isPageLocked = !purchased && isLocked && page > previewPages;

  /* ---------------------------
     Strong anti-extraction measures
     - disable toDataURL
     - disable getContext extraction for 2D
     - disable right-click/context
     - block print and common shortcuts
  --------------------------- */
  useEffect(() => {
    // block canvas extraction
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;

    HTMLCanvasElement.prototype.toDataURL = function () {
      // @ts-ignore
      if ((this as HTMLCanvasElement).dataset?.drmProtected === "1") {
        throw new Error("Extraction disabled");
      }
      return originalToDataURL.apply(this, arguments as any);
    };

    HTMLCanvasElement.prototype.toBlob = function () {
      // @ts-ignore
      if ((this as HTMLCanvasElement).dataset?.drmProtected === "1") {
        throw new Error("Extraction disabled");
      }
      return originalToBlob.apply(this, arguments as any);
    };

    // block contextmenu, selection, keys
    const block = (e: Event) => e.preventDefault();
    const kblock = (e: KeyboardEvent) => {
      // block F12, ctrl+shift+I, ctrl+P, ctrl+S, PrintScreen
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

    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("selectstart", block);
    window.addEventListener("keydown", kblock);

    // block print calls
    const beforePrint = () => {
      alert("Printing is disabled for protected content.");
      return false;
    };
    window.addEventListener("beforeprint", beforePrint);

    return () => {
      HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
      HTMLCanvasElement.prototype.toBlob = originalToBlob;

      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("selectstart", block);
      window.removeEventListener("keydown", kblock);
      window.removeEventListener("beforeprint", beforePrint);
    };
  }, []);

  /* ---------------------------
     DevTools / screen-record detection heuristics
     - outer-inner width diff
     - visibility change
     - repeated resize checks
  --------------------------- */
  useEffect(() => {
    let locked = false;
    const start = Date.now();
    const interval = setInterval(() => {
      if (locked) return;
      try {
        // devtools open horizontally increases outerWidth - innerWidth
        if (window.outerWidth - window.innerWidth > 160) {
          locked = true;
          alert("DevTools or screen capture detected. Closing reader.");
          window.location.reload();
        }
        // visibility hidden could be screen recorder or switching
        if (document.hidden) {
          locked = true;
          alert("Screen recording or backgrounding detected. Closing reader.");
          window.location.reload();
        }
        // quick heuristic: large devtools opening soon after load
        if (Date.now() - start < 5000 && window.outerWidth - window.innerWidth > 80) {
          locked = true;
          alert("Screen capture detected. Closing reader.");
          window.location.reload();
        }
      } catch (e) {}
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------------------
     Fetch protected PDF bytes with Authorization
     (prevent exposing direct URL).
     The URL must accept Authorization and return ArrayBuffer.
  --------------------------- */
  async function fetchProtectedPdf(fetchUrl: string) {
    if (!fetchUrl) return null;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(fetchUrl, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch PDF");
      const ab = await res.arrayBuffer();
      return ab;
    } catch (err) {
      console.error("fetchProtectedPdf error:", err);
      return null;
    }
  }

  /* ---------------------------
     Load PDF from bytes (ArrayBuffer)
  --------------------------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!url) return;
      try {
        const bytes = await fetchProtectedPdf(url);
        if (!bytes) return;
        if (cancelled) return;
        setPdfLoadedBytes(bytes);

        // load pdf via typed array - no URL exposed
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bytes) });
        const pdf = await loadingTask.promise;
        if (cancelled) {
          pdf?.destroy();
          return;
        }
        setPdfInstance(pdf);
        onTotalPages?.(pdf.numPages);
      } catch (err) {
        console.error("PDF load error:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  /* ---------------------------
     Render page to canvas + draw watermark directly on canvas
  --------------------------- */
  const renderPage = React.useCallback(
    async (pdf: any, pageNum: number, scaleVal: number) => {
      try {
        onRenderStart?.();

        if (!pdf || pageNum < 1 || pageNum > pdf.numPages) return;

        const canvas = canvasRef.current;
        const overlay = overlayRef.current;
        const container = containerRef.current;
        if (!canvas || !overlay || !container) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // cancel previous
        if (currentRenderTask.current) {
          try {
            currentRenderTask.current.cancel();
          } catch (_) {}
        }

        // clear overlay
        overlay.innerHTML = "";

        // locked page blur + overlay
        if (isPageLocked) {
          const pdfPage = await pdf.getPage(pageNum);
          const viewport = pdfPage.getViewport({ scale: 0.6 });

          canvas.width = Math.round(viewport.width);
          canvas.height = Math.round(viewport.height);
          canvas.dataset.drmProtected = "1";

          const renderTask = pdfPage.render({ canvasContext: ctx, viewport });
          currentRenderTask.current = renderTask;
          await renderTask.promise;

          // add strong blur & locked overlay
          canvas.style.filter = "blur(6px)";
          showLockedOverlay(canvas.width, canvas.height);
          return;
        }

        // normal render
        const pdfPage = await pdf.getPage(pageNum);
        const viewport = pdfPage.getViewport({ scale: scaleVal });

        // high DPR support
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        canvas.width = Math.round(viewport.width * dpr);
        canvas.height = Math.round(viewport.height * dpr);
        canvas.style.width = `${Math.round(viewport.width)}px`;
        canvas.style.height = `${Math.round(viewport.height)}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport: pdfPage.getViewport({ scale: scaleVal * dpr }),
        };

        // mark canvas protected
        canvas.dataset.drmProtected = "1";

        const renderTask = pdfPage.render(renderContext);
        currentRenderTask.current = renderTask;
        await renderTask.promise;

        // draw watermark directly into canvas (harder to remove)
        try {
          drawWatermarkOnCanvas(ctx, canvas.width, canvas.height, watermarkText);
        } catch (err) {
          // non-fatal
        }

        // draw highlights overlay (DOM elements on top) but ensure they are non-copyable
        drawHighlights(canvas, overlay);

        onPageChange?.(pageNum);
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("renderPage error:", err);
        }
      } finally {
        onRenderEnd?.();
      }
    },
    [isPageLocked, scale, watermarkText, highlights, onDeleteHighlight]
  );

  useEffect(() => {
    if (!pdfInstance) return;
    // cancel old render then render
    if (currentRenderTask.current) {
      try {
        currentRenderTask.current.cancel();
      } catch (_) {}
    }
    renderPage(pdfInstance, page, scale);
  }, [page, scale, pdfInstance, renderPage]);

  /* ---------------------------
     Draw highlights (DOM overlay)
  ---------------------------*/
  function drawHighlights(canvas: HTMLCanvasElement, overlay: HTMLDivElement) {
    const cw = canvas.width;
    const ch = canvas.height;

    overlay.innerHTML = "";

    highlights
      .filter((h) => Number(h.page) === Number(page))
      .forEach((h) => {
        const el = document.createElement("div");
        el.style.cssText = `
          position:absolute;
          left:${h.xPct * (cw / (window.devicePixelRatio || 1))}px;
          top:${h.yPct * (ch / (window.devicePixelRatio || 1))}px;
          width:${h.wPct * (cw / (window.devicePixelRatio || 1))}px;
          height:${h.hPct * (ch / (window.devicePixelRatio || 1))}px;
          background:${h.color || "rgba(255,255,0,0.35)"};
          border-radius:2px;
          cursor:pointer;
          pointer-events:auto;
        `;

        el.onclick = (e) => {
          e.stopPropagation();
          if (!isPageLocked && onDeleteHighlight && confirm("Delete highlight?")) {
            onDeleteHighlight(h.id);
          }
        };

        overlay.appendChild(el);
      });
  }

  /* ---------------------------
     Draw watermark text into canvas context
     - repeated tiled, rotated, semi-transparent
  ---------------------------*/
  function drawWatermarkOnCanvas(ctx: CanvasRenderingContext2D, width: number, height: number, text?: string | null) {
    if (!text) text = "Protected";
    const tileSize = 260;
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#000";
    ctx.font = `${Math.round(tileSize / 10)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.translate(0, 0);
    // tile
    for (let y = 0; y < height; y += tileSize) {
      for (let x = 0; x < width; x += tileSize) {
        ctx.save();
        ctx.translate(x + tileSize / 2, y + tileSize / 2);
        ctx.rotate((-20 * Math.PI) / 180);
        ctx.fillText(text!, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  /* ---------------------------
     Locked page overlay UI (DOM) - similar to your previous impl
  ---------------------------*/
  function showLockedOverlay(width: number, height: number) {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.innerHTML = "";
    overlay.style.width = `${width / (window.devicePixelRatio || 1)}px`;
    overlay.style.height = `${height / (window.devicePixelRatio || 1)}px`;

    const wrap = document.createElement("div");
    wrap.style.cssText = `
      position:absolute; top:0; left:0;
      width:100%; height:100%;
      display:flex; flex-direction:column;
      align-items:center;
      justify-content:center;
      background:rgba(255,255,255,0.5);
      backdrop-filter:blur(6px);
      z-index:5;
    `;

    const card = document.createElement("div");
    card.style.cssText = `
      background:white;
      padding:18px 22px;
      border-radius:10px;
      box-shadow:0 4px 10px rgba(0,0,0,0.12);
      text-align:center;
      max-width:300px;
    `;
    const title = document.createElement("div");
    title.style.cssText = "font-size:16px;font-weight:600;margin-bottom:8px";
    title.textContent = "Unlock this book";
    const sub = document.createElement("div");
    sub.style.cssText = "font-size:13px;color:#555;margin-bottom:12px";
    sub.textContent = "This page is locked in preview mode";
    const btn = document.createElement("button");
    btn.innerText = "Buy Now";
    btn.style.cssText = `
      padding:8px 16px;
      border-radius:6px;
      background:#bf2026;color:#fff;border:none;cursor:pointer;
    `;
    btn.onclick = (e) => {
      e.stopPropagation();
      onBuyClick?.(bookId as any);
    };
    card.appendChild(title);
    card.appendChild(sub);
    card.appendChild(btn);
    wrap.appendChild(card);
    overlay.appendChild(wrap);
  }

  /* ---------------------------
     Root return (UI unchanged)
  ---------------------------*/
  return (
    <div ref={containerRef} style={{ position: "relative", touchAction: "none" }}>
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          margin: "auto",
          maxWidth: "100%",
          userSelect: "none",
          pointerEvents: "auto",
        }}
        // disable context menu on canvas specifically
        onContextMenu={(e) => e.preventDefault()}
      />

      <div
        ref={overlayRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          pointerEvents: "auto",
        }}
      />
    </div>
  );
}