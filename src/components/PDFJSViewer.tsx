// src/components/PDFJSViewer.tsx
import { useEffect, useRef, useState } from "react";
import * as React from "react";

let pdfjsLibPromise: Promise<any> | null = null;

async function loadPdfJs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = (async () => {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf");

      // ✅ CORRECT: real worker URL
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.min.js",
        import.meta.url
      ).toString();

      return pdfjs;
    })();
  }

  return pdfjsLibPromise;
}

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
  onAddHighlight?: (h: {
    page: number;
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
    color?: string;
  }) => void;
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
  /** Enable vertical scrolling for PDF content */
  enableScroll?: boolean;
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
    onAddHighlight,
    isLocked = false,
    previewPages = 1,
    purchased = false,
    onBuyClick,
    bookId,
    onDeleteHighlight,
    onRenderStart,
    onRenderEnd,
    watermarkText,
    enableScroll = false, // New prop for scrolling
  } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const currentRenderTask = useRef<any>(null);

  const [pdfInstance, setPdfInstance] = useState<any>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [scrollPosition, setScrollPosition] = useState(0);

  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const tempRectRef = useRef<HTMLDivElement | null>(null);

  const isPageLocked = !purchased && isLocked && page > previewPages;

  // Responsive container width tracking
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setContainerWidth(width);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    
    // Use ResizeObserver for better performance
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateWidth);
      resizeObserver.disconnect();
    };
  }, []);

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
      if ((this as HTMLCanvasElement).dataset?.drmProtected === "1") {
        throw new Error("Extraction disabled");
      }
      return originalToDataURL.apply(this, arguments as any);
    };

    HTMLCanvasElement.prototype.toBlob = function () {
      if ((this as HTMLCanvasElement).dataset?.drmProtected === "1") {
        throw new Error("Extraction disabled");
      }
      return originalToBlob.apply(this, arguments as any);
    };

    // block contextmenu, copy, cut
    const block = (e: Event) => e.preventDefault();

    // allow selection ONLY in highlight mode
    const blockSelect = (e: Event) => {
      if (!highlightMode) e.preventDefault();
    };

    // block devtools / print shortcuts
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

    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("selectstart", blockSelect);
    window.addEventListener("keydown", kblock);

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
      document.removeEventListener("selectstart", blockSelect);
      window.removeEventListener("keydown", kblock);
      window.removeEventListener("beforeprint", beforePrint);
    };
  }, [highlightMode]);

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
          window.location.replace("/access-denied");
        }
        // visibility hidden could be screen recorder or switching
        if (document.hidden) {
          locked = true;
          alert("Screen recording or backgrounding detected. Closing reader.");
          window.location.replace("/access-denied");
        }
        // quick heuristic: large devtools opening soon after load
        if (Date.now() - start < 5000 && window.outerWidth - window.innerWidth > 80) {
          locked = true;
          alert("Screen capture detected. Closing reader.");
          window.location.replace("/access-denied");
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
        // ✅ ENSURE pdf.js + worker are loaded
        const pdfjs = await loadPdfJs();

        const bytes = await fetchProtectedPdf(url);
        if (!bytes || cancelled) return;

        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(bytes),
          disableAutoFetch: true,
          disableStream: true,
        });

        const pdf = await loadingTask.promise;
        if (cancelled) {
          pdf.destroy();
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
  }, [url]);

  /* ---------------------------
     Render page to canvas + draw watermark directly on canvas
     Now with scrolling support
  --------------------------- */
  const renderPage = React.useCallback(
    async (pdf: any, pageNum: number, scaleVal: number) => {
      try {
        onRenderStart?.();

        if (!pdf || pageNum < 1 || pageNum > pdf.numPages) return;

        const canvas = canvasRef.current;
        const overlay = overlayRef.current;
        const container = containerRef.current;
        const scrollContainer = scrollContainerRef.current;
        if (!canvas || !overlay || !container) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // cancel previous
        if (currentRenderTask.current) {
          try {
            currentRenderTask.current.cancel();
          } catch (_) {}
        }

        const pdfPage = await pdf.getPage(pageNum);
        const originalViewport = pdfPage.getViewport({ scale: 1 });
        
        // Calculate responsive scale based on container width
        const containerWidth = container.clientWidth;
        let responsiveScale;
        
        if (enableScroll) {
          // For scrolling mode, use original scale or slightly reduced
          responsiveScale = scaleVal * 0.8; // Slightly reduce scale for better scrolling
        } else {
          // For fit-to-width mode
          responsiveScale = Math.min(
            scaleVal,
            (containerWidth - 32) / originalViewport.width
          );
        }

        const viewport = pdfPage.getViewport({ scale: responsiveScale });

        // Store PDF dimensions for scrolling container
        setPdfDimensions({
          width: viewport.width,
          height: viewport.height
        });

        // locked page blur + overlay
        if (isPageLocked) {
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

        // normal render with high DPR support
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        canvas.width = Math.round(viewport.width * dpr);
        canvas.height = Math.round(viewport.height * dpr);
        
        if (enableScroll) {
          // For scrolling, set actual dimensions
          canvas.style.width = `${Math.round(viewport.width)}px`;
          canvas.style.height = `${Math.round(viewport.height)}px`;
        } else {
          // For fit-to-width, constrain width
          canvas.style.width = `${Math.round(viewport.width)}px`;
          canvas.style.height = `${Math.round(viewport.height)}px`;
          canvas.style.maxWidth = "100%";
        }

        // ✅ SYNC overlay with canvas CSS size & position
        if (enableScroll) {
          overlay.style.width = canvas.style.width;
          overlay.style.height = canvas.style.height;
          overlay.style.position = "absolute";
          overlay.style.top = "0";
          overlay.style.left = "0";
        } else {
          overlay.style.width = canvas.style.width;
          overlay.style.height = canvas.style.height;
          overlay.style.maxWidth = "100%";
          overlay.style.position = "absolute";
          overlay.style.left = "0";
          overlay.style.top = "0";
        }

        const renderContext = {
          canvasContext: ctx,
          viewport: pdfPage.getViewport({ scale: responsiveScale * dpr }),
        };

        // mark canvas protected
        canvas.dataset.drmProtected = "1";

        const renderTask = pdfPage.render(renderContext);
        await renderTask.promise;
        currentRenderTask.current = null;

        // draw watermark directly into canvas (harder to remove)
        try {
          drawWatermarkOnCanvas(ctx, canvas.width, canvas.height, watermarkText);
        } catch (err) {
          // non-fatal
        }

        // Redraw highlights after render
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
    [isPageLocked, scale, watermarkText, enableScroll]
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
  }, [page, scale, pdfInstance, renderPage, containerWidth]);

  /* ---------------------------
     Draw highlights (DOM overlay)
  ---------------------------*/
  function drawHighlights(canvas: HTMLCanvasElement, overlay: HTMLDivElement) {
    if (!overlay || !canvas) return;
    
    overlay.innerHTML = "";

    const canvasRect = canvas.getBoundingClientRect();
    const baseWidth = canvasRect.width;
    const baseHeight = canvasRect.height;

    highlights
      .filter(h => Number(h.page) === Number(page))
      .forEach(h => {
        const el = document.createElement("div");
        el.style.cssText = `
          position: absolute;
          left: ${h.xPct * 100}%;
          top: ${h.yPct * 100}%;
          width: ${h.wPct * 100}%;
          height: ${h.hPct * 100}%;
          background: ${h.color || "rgba(255,255,0,0.4)"};
          z-index: 10;
          cursor: pointer;
          pointer-events: auto;
        `;

        el.onclick = (e) => {
          e.stopPropagation();
          if (confirm("Delete highlight?")) {
            onDeleteHighlight?.(h.id);
          }
        };

        overlay.appendChild(el);
      });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    drawHighlights(canvas, overlay);
  }, [highlights, page, containerWidth]);

  /* ---------------------------
     Draw watermark text into canvas context
     - repeated tiled, rotated, semi-transparent
  ---------------------------*/
  function drawWatermarkOnCanvas(ctx: CanvasRenderingContext2D, width: number, height: number, text?: string | null) {
    if (!text) text = "Protected";
    const tileSize = Math.min(width, height) / 8; // Responsive tile size
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
     Locked page overlay UI (DOM) - responsive
  ---------------------------*/
  function showLockedOverlay(width: number, height: number) {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.innerHTML = "";
    overlay.style.width = `${width / (window.devicePixelRatio || 1)}px`;
    overlay.style.height = `${height / (window.devicePixelRatio || 1)}px`;
    overlay.style.maxWidth = "100%";

    const wrap = document.createElement("div");
    wrap.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.5);
      backdrop-filter: blur(6px);
      z-index: 5;
    `;

    const card = document.createElement("div");
    card.style.cssText = `
      background: white;
      padding: 1rem 1.25rem;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.12);
      text-align: center;
      max-width: 300px;
      width: 90%;
      margin: 0 auto;
    `;
    
    const title = document.createElement("div");
    title.style.cssText = "font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;";
    title.textContent = "Unlock this book";
    
    const sub = document.createElement("div");
    sub.style.cssText = "font-size: 0.8125rem; color: #555; margin-bottom: 0.75rem;";
    sub.textContent = "This page is locked in preview mode";
    
    const btn = document.createElement("button");
    btn.innerText = "Buy Now";
    btn.style.cssText = `
      padding: 0.5rem 1rem;
      border-radius: 6px;
      background: #bf2026;
      color: #fff;
      border: none;
      cursor: pointer;
      font-size: 0.875rem;
      width: 100%;
      max-width: 200px;
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
     Handle highlight drawing
  ---------------------------*/
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!highlightMode || isPageLocked) return;

    const rect = overlayRef.current!.getBoundingClientRect();
    isDrawingRef.current = true;
    startPointRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const temp = document.createElement("div");
    temp.style.cssText = `
      position: absolute;
      background: rgba(255,255,0,0.4);
      border: 1px solid rgba(200,200,0,0.8);
    `;
    overlayRef.current!.appendChild(temp);
    tempRectRef.current = temp;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingRef.current || !startPointRef.current) return;

    const rect = overlayRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const sx = startPointRef.current.x;
    const sy = startPointRef.current.y;

    const left = Math.min(sx, x);
    const top = Math.min(sy, y);
    const width = Math.abs(x - sx);
    const height = Math.abs(y - sy);

    if (tempRectRef.current) {
      Object.assign(tempRectRef.current.style, {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      });
    }
  };

  const handleMouseUp = () => {
    if (!isDrawingRef.current || !startPointRef.current || !tempRectRef.current) return;

    const overlay = overlayRef.current!;
    const box = tempRectRef.current.getBoundingClientRect();
    const base = overlay.getBoundingClientRect();

    isDrawingRef.current = false;

    onAddHighlight?.({
      page,
      xPct: (box.left - base.left) / base.width,
      yPct: (box.top - base.top) / base.height,
      wPct: box.width / base.width,
      hPct: box.height / base.height,
      color: "rgba(255,255,0,0.4)",
    });

    tempRectRef.current.remove();
    tempRectRef.current = null;
    startPointRef.current = null;
  };

  /* ---------------------------
     Handle scroll for scrollable container
  ---------------------------*/
  const handleScroll = (e: React.UIEvent) => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    
    const scrollTop = scrollContainer.scrollTop;
    const scrollHeight = scrollContainer.scrollHeight;
    const clientHeight = scrollContainer.clientHeight;
    
    setScrollPosition(scrollTop);
    
    // You could implement auto-page turning based on scroll position
    // if (scrollTop + clientHeight >= scrollHeight - 50) {
    //   // Load next page when near bottom
    // }
  };

  /* ---------------------------
     Render based on scroll mode
  ---------------------------*/
  const renderScrollablePDF = () => {
    const canvasStyle = enableScroll 
      ? {
          display: "block",
          margin: "0 auto",
          width: `${pdfDimensions.width}px`,
          height: `${pdfDimensions.height}px`,
          userSelect: highlightMode ? "text" : "none",
          cursor: highlightMode ? "text" : "default",
          pointerEvents: "auto",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }
      : {
          display: "block",
          margin: "0 auto",
          maxWidth: "100%",
          height: "auto",
          userSelect: highlightMode ? "text" : "none",
          cursor: highlightMode ? "text" : "default",
          pointerEvents: "auto",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        };

    const containerStyle = enableScroll
      ? {
          position: "relative",
          touchAction: "none",
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
        }
      : {
          position: "relative",
          touchAction: "none",
          width: "100%",
          maxWidth: "100%",
          overflow: "hidden",
        };

    if (enableScroll) {
      return (
        <div 
          ref={scrollContainerRef}
          style={{
            width: "100%",
            height: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            position: "relative",
          }}
          onScroll={handleScroll}
        >
          <div 
            ref={containerRef} 
            style={containerStyle}
          >
            <canvas
              ref={canvasRef}
              style={canvasStyle}
              onContextMenu={(e) => e.preventDefault()}
            />

            <div
              ref={overlayRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                zIndex: 10,
                cursor: highlightMode ? "crosshair" : "default",
                touchAction: "none",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>
        </div>
      );
    }

    return (
      <div 
        ref={containerRef} 
        style={containerStyle}
      >
        <canvas
          ref={canvasRef}
          style={canvasStyle}
          onContextMenu={(e) => e.preventDefault()}
        />

        <div
          ref={overlayRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            margin: "0 auto",
            zIndex: 10,
            cursor: highlightMode ? "crosshair" : "default",
            touchAction: "none",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    );
  };

  /* ---------------------------
     Root return
  ---------------------------*/
  return (
    <div style={{ 
      width: "100%", 
      height: enableScroll ? "calc(100vh - 200px)" : "auto",
      position: "relative"
    }}>
      {renderScrollablePDF()}
      
      {enableScroll && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          backgroundColor: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "8px 12px",
          borderRadius: "4px",
          fontSize: "12px",
          zIndex: 100,
        }}>
          Scroll Position: {Math.round(scrollPosition)}px
        </div>
      )}
    </div>
  );
}