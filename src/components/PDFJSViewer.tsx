// src/components/PDFJSViewer.tsx
import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import * as React from "react";

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
  highlightMode = false,
  highlights = [],
  onAddHighlight,
  onDeleteHighlight,
}: any) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [pdfInstance, setPdfInstance] = useState<any>(null);

  const currentRenderTask = useRef<any>(null);
  const dragState = useRef<any>(null);

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
      DRM Protection: Overlay watermark + Screenshot blur
  ------------------------------ */
  useEffect(() => {
    const pdfCanvas = document.getElementById("pdf-canvas") as HTMLCanvasElement;
    const protectLayer = document.getElementById("pdf-protect-layer") as HTMLDivElement;

    if (!pdfCanvas || !protectLayer) return;

    const userEmail = localStorage.getItem("email") || "User";

    // Create clean watermark
    const createWatermark = () => {
      protectLayer.innerHTML = "";
      const wm = document.createElement("div");
      wm.id = "drm-overlay-watermark";
      wm.innerText = `${userEmail} • ${new Date().toLocaleString()}`;
      wm.style.position = "absolute";
      wm.style.top = "50%";
      wm.style.left = "50%";
      wm.style.transform = "translate(-50%, -50%) rotate(-25deg)";
      wm.style.fontSize = "28px";
      wm.style.opacity = "0.18";
      wm.style.color = "#000";
      wm.style.pointerEvents = "none";
      wm.style.userSelect = "none";
      wm.style.mixBlendMode = "multiply";
      protectLayer.appendChild(wm);
    };

    createWatermark();

    // Re-add watermark if removed
    const obs = new MutationObserver(() => {
      if (!document.getElementById("drm-overlay-watermark")) createWatermark();
    });
    obs.observe(protectLayer, { childList: true, subtree: true });

    // Screenshot blur
    const blurOnScreenshot = () => {
      pdfCanvas.style.filter = "blur(28px)";
      protectLayer.style.backdropFilter = "blur(12px)";

      setTimeout(() => {
        pdfCanvas.style.filter = "";
        protectLayer.style.backdropFilter = "";
      }, 1400);
    };

    const handleKey = (e: KeyboardEvent) => {
      if (["PrintScreen", "Snapshot", "F13"].includes(e.key)) {
        blurOnScreenshot();
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
      obs.disconnect();
    };
  }, [url]);

  /* ------------------------------
      Render the page
  ------------------------------ */
  useEffect(() => {
    if (!pdfInstance) return;
    renderPage(pdfInstance, page, scale);
  }, [pdfInstance, page, scale]);

  async function renderPage(pdf: any, pageNum: number, scaleVal: number) {
    try {
      if (currentRenderTask.current) currentRenderTask.current.cancel();

      const pdfPage = await pdf.getPage(pageNum);
      const viewport = pdfPage.getViewport({ scale: scaleVal });

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);

      const renderTask = pdfPage.render({
        canvasContext: ctx,
        viewport,
      });

      currentRenderTask.current = renderTask;
      await renderTask.promise;

      const overlay = overlayRef.current!;
      overlay.style.width = `${canvas.width}px`;
      overlay.style.height = `${canvas.height}px`;
      drawHighlights(canvas.width, canvas.height);

      onPageChange?.(pageNum);
    } catch (err) {
      if (err.name === "RenderingCancelledException") return;
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
        el.style.background = "rgba(255,255,0,0.35)";
        el.style.borderRadius = "2px";
        el.style.cursor = "pointer";

        el.onclick = () => {
          if (confirm("Delete highlight?")) onDeleteHighlight?.(h.id);
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