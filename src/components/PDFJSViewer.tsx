// src/components/PDFJSViewer.tsx
import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

import * as React from "react";

// CORRECT WORKER — VERSION ALWAYS MATCHES
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).toString();

export default function PDFJSViewer({
  url,
  page = 1,
  scale = 1,
  onTotalPages,
  onPageChange,
  bookId,
  highlightMode = false,
  highlights = [],
  onAddHighlight,
  onDeleteHighlight
}: any) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [pdfInstance, setPdfInstance] = useState<any>(null);

  const currentRenderTask = useRef<any>(null);

  const dragState = useRef<{
    startX: number;
    startY: number;
    active: boolean;
    rectEl?: HTMLDivElement;
  } | null>(null);

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
  }, [url]);

  /* ------------------------------
      Re-render on changes
  ------------------------------ */
  useEffect(() => {
    if (!pdfInstance) return;
    renderPage(pdfInstance, page, scale);
  }, [pdfInstance, page, scale]);

  /* ------------------------------
      Render a page safely
  ------------------------------ */
  async function renderPage(pdf: any, pageNum: number, scaleVal: number) {
    try {
      if (currentRenderTask.current) {
        currentRenderTask.current.cancel();
        currentRenderTask.current = null;
      }

      const pdfPage = await pdf.getPage(pageNum);
      const viewport = pdfPage.getViewport({ scale: scaleVal });

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderTask = pdfPage.render({
        canvasContext: ctx,
        viewport
      });

      currentRenderTask.current = renderTask;

      await renderTask.promise;

      currentRenderTask.current = null;

      const overlay = overlayRef.current!;
      overlay.style.width = `${canvas.width}px`;
      overlay.style.height = `${canvas.height}px`;

      drawHighlights(canvas.width, canvas.height);

      onPageChange?.(pageNum);
    } catch (err: any) {
      if (err?.name === "RenderingCancelledException") {
        return;
      }
      console.error("renderPage error:", err);
    }
  }

  /* ------------------------------
      Draw Highlights
  ------------------------------ */
  function drawHighlights(canvasW: number, canvasH: number) {
    const overlay = overlayRef.current!;
    overlay.innerHTML = "";

    (highlights || [])
      .filter((h: any) => Number(h.page) === Number(page))
      .forEach((h: any) => {
        const left = (h.xPct ?? h.x) * canvasW;
        const top = (h.yPct ?? h.y) * canvasH;
        const w = Math.max(2, (h.wPct ?? h.width) * canvasW);
        const hgt = Math.max(2, (h.hPct ?? h.height) * canvasH);

        const el = document.createElement("div");
        el.className = "pdf-highlight";
        el.style.position = "absolute";
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        el.style.width = `${w}px`;
        el.style.height = `${hgt}px`;
        el.style.background = h.color || "rgba(255,255,0,0.35)";
        el.style.pointerEvents = "auto";
        el.style.opacity = "0.6";
        el.style.borderRadius = "2px";

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          if (confirm("Delete this highlight?")) {
            onDeleteHighlight?.(h.id);
          }
        });

        overlay.appendChild(el);
      });
  }

  /* ------------------------------
      Drag highlight
  ------------------------------ */
  useEffect(() => {
    const overlay = overlayRef.current!;
    if (!overlay) return;

    function onMouseDown(e: MouseEvent) {
      if (!highlightMode) return;

      const rect = overlay.getBoundingClientRect();
      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;

      const rectEl = document.createElement("div");
      rectEl.style.position = "absolute";
      rectEl.style.left = `${startX}px`;
      rectEl.style.top = `${startY}px`;
      rectEl.style.width = "0px";
      rectEl.style.height = "0px";
      rectEl.style.background = "rgba(255,255,0,0.3)";
      rectEl.style.border = "1px dashed rgba(0,0,0,0.2)";
      rectEl.style.pointerEvents = "none";

      overlay.appendChild(rectEl);

      dragState.current = { startX, startY, active: true, rectEl };
    }

    function onMouseMove(e: MouseEvent) {
      const ds = dragState.current;
      if (!ds || !ds.active) return;

      const rect = overlay.getBoundingClientRect();
      const curX = e.clientX - rect.left;
      const curY = e.clientY - rect.top;

      const x = Math.min(ds.startX, curX);
      const y = Math.min(ds.startY, curY);
      const w = Math.abs(curX - ds.startX);
      const h = Math.abs(curY - ds.startY);

      if (ds.rectEl) {
        ds.rectEl.style.left = `${x}px`;
        ds.rectEl.style.top = `${y}px`;
        ds.rectEl.style.width = `${w}px`;
        ds.rectEl.style.height = `${h}px`;
      }
    }

    function onMouseUp() {
      const ds = dragState.current;
      if (!ds || !ds.active) return;

      const canvas = canvasRef.current!;
      const canvasW = canvas.width;
      const canvasH = canvas.height;

      const rectEl = ds.rectEl!;
      rectEl.remove();

      const leftPx = parseFloat(rectEl.style.left);
      const topPx = parseFloat(rectEl.style.top);
      const wPx = parseFloat(rectEl.style.width);
      const hPx = parseFloat(rectEl.style.height);

      if (wPx < 5 || hPx < 5) {
        dragState.current = null;
        return;
      }

      const xPct = leftPx / canvasW;
      const yPct = topPx / canvasH;
      const wPct = wPx / canvasW;
      const hPct = hPx / canvasH;

      onAddHighlight?.({
        page,
        xPct,
        yPct,
        wPct,
        hPct,
        color: "rgba(255,255,0,0.35)"
      });

      dragState.current = null;
    }

    overlay.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      overlay.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [highlightMode, onAddHighlight, page, highlights]);

  // Re-draw highlights
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawHighlights(canvas.width, canvas.height);
  }, [highlights, page]);

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          margin: "auto",
          maxWidth: "100%"
        }}
      />
      <div
        ref={overlayRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          pointerEvents: "auto"
        }}
      />
    </div>
  );
}