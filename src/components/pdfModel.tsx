// components/PdfModal.tsx
import { Button } from "./ui/button";
import { X } from "lucide-react";
import * as React from "react";
import { lazy, Suspense } from "react";

const PDFJSViewer = lazy(() => import("./PDFJSViewer"));

export function PdfModal({
  open,
  onClose,
  url,
  title,
}: {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <div className="bg-white h-full w-full flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-[#1d4d6a]">{title}</h2>
          <Button variant="ghost" onClick={onClose}>
            <X />
          </Button>
        </div>

        {/* PDF */}
        <div className="flex-1 overflow-auto">
          <Suspense fallback={<div className="p-6">Loading PDF…</div>}>
            <PDFJSViewer
              url={url}
              page={1}
              scale={1.1}
              purchased={true}     // no lock
              isLocked={false}     // free material
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}