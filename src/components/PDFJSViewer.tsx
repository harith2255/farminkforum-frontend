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
  page: number;
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

  // 👇 ADD THESE
  onRenderStart?: () => void;
  onRenderEnd?: () => void;
}

export default function PDFJSViewer({
  url,
  page,
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

  // 👇 FIX: include in function
  onRenderStart,
  onRenderEnd,
}: PDFJSViewerProps) {

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [pdfInstance, setPdfInstance] = useState<any>(null);
  const currentRenderTask = useRef<any>(null);

  /* ---------------------------------
     LOAD PDF
  ---------------------------------- */
useEffect(() => {
  if (!url) return;

  let cancelled = false;

  (async () => {
    try {
      const task = pdfjsLib.getDocument(url);
      const pdf = await task.promise;

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

  // only cancel on unmount or url change
  return () => {
    cancelled = true;
  };

}, [url]);


  /* ---------------------------------
     RENDER PAGE
  ---------------------------------- */
useEffect(() => {
  if (!pdfInstance) return;
  renderPage(pdfInstance, page, scale);
}, [page, scale, pdfInstance]);




async function renderPage(pdf: any, pageNum: number, scaleVal: number) {
  try {
    console.log("🟢 renderPage called:", pageNum);

    onRenderStart?.();

    // Ensure valid
    if (pageNum < 1 || pageNum > pdf.numPages) {
      console.warn("❗ Invalid page:", pageNum);
      return;
    }

    const pdfPage = await pdf.getPage(pageNum);
    const viewport = pdfPage.getViewport({ scale: scaleVal });

    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize — DO NOT clear again afterwards
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);

    overlay.innerHTML = "";
    overlay.style.width = `${canvas.width}px`;
    overlay.style.height = `${canvas.height}px`;

    // Render page
    const renderTask = pdfPage.render({ canvasContext: ctx, viewport });
    currentRenderTask.current = renderTask;
    await renderTask.promise;

    console.log("✔️ Render finished:", pageNum);

    // Locking
    if (isLocked && pageNum > previewPages) {
      applyLockOverlay(canvas.width, canvas.height);
      return;
    }

    drawHighlights(canvas.width, canvas.height);

    onPageChange?.(pageNum);

  } catch (err) {
    if (err?.name === "RenderingCancelledException") return;
    console.error("❌ renderPage error:", err);
  } finally {
    onRenderEnd?.();
  }
}





  /* -------------------------
     LOCK SCREEN
  -------------------------- */
  function applyLockOverlay(width: number, height: number) {
    const overlay = overlayRef.current;
    if (!overlay) return;

    overlay.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.style.cssText = `
      position:absolute;
      top:0;left:0;
      width:${width}px;height:${height}px;
      display:flex;flex-direction:column;
      align-items:center;justify-content:center;
      background:rgba(255,255,255,0.85);
      backdrop-filter:blur(4px);
      font-size:22px;font-weight:600;color:#000;z-index:998;
    `;

    const text = document.createElement("div");
    text.innerText = "🔒 Buy to unlock full book";

    const btn = document.createElement("button");
    btn.innerText = "Buy Now";
    btn.style.cssText = `
      margin-top:14px;padding:10px 22px;font-size:18px;border-radius:6px;
      background:black;color:white;border:none;cursor:pointer;z-index:999;
    `;

    btn.onclick = (e) => {
      e.stopPropagation();
      onBuyClick?.(bookId as any);
    };

    wrap.appendChild(text);
    wrap.appendChild(btn);
    overlay.appendChild(wrap);
  }

  /* -------------------------
     HIGHLIGHTS
  -------------------------- */
  function drawHighlights(canvasW: number, canvasH: number) {
    const overlay = overlayRef.current;
    if (!overlay) return;

    overlay.innerHTML = "";

    highlights
      .filter((h) => Number(h.page) === Number(page))
      .forEach((h) => {
        const el = document.createElement("div");
        el.style.cssText = `
          position:absolute;
          left:${h.xPct * canvasW}px;
          top:${h.yPct * canvasH}px;
          width:${h.wPct * canvasW}px;
          height:${h.hPct * canvasH}px;
          background:${h.color || "rgba(255,255,0,0.35)"};
          border-radius:2px;
          cursor:pointer;
        `;

        el.onclick = (e) => {
          e.stopPropagation();
          if (!isLocked && onDeleteHighlight) {
            if (confirm("Delete highlight?")) {
              onDeleteHighlight(h.id);
            }
          }
        };

        overlay.appendChild(el);
      });
  }

  /* ---------------------------------
     VIEWER ROOT
  ---------------------------------- */
  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          margin: "auto",
          maxWidth: "100%",
          zIndex: 1,
        }}
      />

      <div
        ref={overlayRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          pointerEvents: "auto",
          zIndex: 2,
        }}
      />
    </div>
  );
}