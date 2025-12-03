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
  url: string;
  page?: number;
  scale?: number;
  onTotalPages?: (total: number) => void;
  onPageChange?: (page: number) => void;
  highlightMode?: boolean;
  highlights?: Highlight[];
  isLocked?: boolean;
  previewPages?: number;
  onBuyClick?: (bookId: string | number) => void;
  bookId?: string | number;
  onDeleteHighlight?: (id: number | string) => void;
}

export default function PDFJSViewer({
  url,
  page = 1,
  scale = 1,
  onTotalPages,
  onPageChange,
  highlightMode = false,
  highlights = [],
  isLocked = false,
  previewPages = 1,
  onBuyClick,
  bookId,
  onDeleteHighlight,
}: PDFJSViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [pdfInstance, setPdfInstance] = useState<any>(null);

  const currentRenderTask = useRef<any>(null);

  /* ------------------------------
      Load PDF
  ------------------------------ */
  useEffect(() => {
    let mounted = true;
    let loadedPdf: any = null;

    async function loadPdf() {
      if (!url) return;
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        loadedPdf = pdf;
        if (!mounted) return;
        setPdfInstance(pdf);
        onTotalPages?.(pdf.numPages);
      } catch (err) {
        console.error("PDF load error:", err);
      }
    }

    loadPdf();

    return () => {
      mounted = false;
      if (currentRenderTask.current) {
        currentRenderTask.current.cancel();
      }
      if (loadedPdf?.destroy) loadedPdf.destroy();
      setPdfInstance(null);
    };
  }, [url, onTotalPages]);

  /* ------------------------------
      Render the page
  ------------------------------ */
  useEffect(() => {
    if (!pdfInstance) return;
    renderPage(pdfInstance, page, scale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfInstance, page, scale, isLocked, previewPages, highlights]);

  async function renderPage(pdf: any, pageNum: number, scaleVal: number) {
    try {
      if (currentRenderTask.current) currentRenderTask.current.cancel();

      const pdfPage = await pdf.getPage(pageNum);
      const viewport = pdfPage.getViewport({ scale: scaleVal });

      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      if (!canvas || !overlay) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);

      // reset blur & overlay each render
      canvas.style.filter = "none";
      overlay.innerHTML = "";

      const renderTask = pdfPage.render({
        canvasContext: ctx,
        viewport,
      });

      currentRenderTask.current = renderTask;
      await renderTask.promise;

      // 🔒 LOCK FEATURE
      if (isLocked && pageNum > previewPages) {
        applyLockOverlay();
        // we still size overlay for correct click-area
        overlay.style.width = `${canvas.width}px`;
        overlay.style.height = `${canvas.height}px`;
        return;
      }

      overlay.style.width = `${canvas.width}px`;
      overlay.style.height = `${canvas.height}px`;
      drawHighlights(canvas.width, canvas.height);

      onPageChange?.(pageNum);
    } catch (err: any) {
      if (err.name === "RenderingCancelledException") return;
      console.error("renderPage error:", err);
    }
  }

  /* ------------------------------
     🔒 Overlay lock
  ------------------------------ */
  function applyLockOverlay() {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    canvas.style.filter = "blur(8px)";

    overlay.innerHTML = `
      <div style="
        position:absolute;top:0;left:0;width:100%;height:100%;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        background:rgba(255,255,255,0.75);backdrop-filter:blur(4px);
        font-size:22px;font-weight:600;color:#000;z-index:999;
        pointer-events:none;
      ">
        🔒 Buy to unlock full book
        <button id="unlock-btn" style="
          pointer-events:auto;
          margin-top:14px;padding:10px 22px;font-size:18px;border-radius:6px;
          background:black;color:white;border:none;cursor:pointer;
        ">
          Buy Now
        </button>
      </div>
    `;

    const btn = document.getElementById("unlock-btn");
    if (btn) {
      btn.onclick = (e) => {
        e.stopPropagation();
        if (onBuyClick) {
          onBuyClick(bookId as any);
        }
      };
    }
  }

  /* ------------------------------
      Draw Highlights
  ------------------------------ */
  function drawHighlights(canvasW: number, canvasH: number) {
    const overlay = overlayRef.current;
    if (!overlay) return;

    overlay.innerHTML = "";

    (highlights || [])
      .filter((h) => Number(h.page) === Number(page))
      .forEach((h) => {
        const left = h.xPct * canvasW;
        const top = h.yPct * canvasH;
        const w = h.wPct * canvasW;
        const hgt = h.hPct * canvasH;

        const el = document.createElement("div");
        el.style.position = "absolute";
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        el.style.width = `${w}px`;
        el.style.height = `${hgt}px`;
        el.style.background = h.color || "rgba(255,255,0,0.35)";
        el.style.borderRadius = "2px";
        el.style.cursor = "pointer";

        el.onclick = (e) => {
          e.stopPropagation();
          if (onDeleteHighlight && !isLocked) {
            if (confirm("Delete highlight?")) onDeleteHighlight(h.id);
          }
        };

        overlay.appendChild(el);
      });
  }

  return (
    <div id="pdf-container" style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        id="pdf-canvas"
        style={{
          display: "block",
          margin: "auto",
          maxWidth: "100%",
          zIndex: 1,
        }}
      />

      <div
        ref={overlayRef}
        id="pdf-overlay"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          pointerEvents: "auto",
          zIndex: 2,
        }}
      />

      <div
        id="pdf-protect-layer"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 3,
        }}
      />
    </div>
  );
}