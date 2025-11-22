import * as React from "react";
// @ts-ignore - react-pdf has no type declarations in this project
const { Document, Page, pdfjs } = require("react-pdf");

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function PDFViewer({ fileUrl }: any) {
  return (
    <Document
      file={fileUrl}
      onLoadError={(err: unknown) => console.error("PDF Load Error:", err)}
    >
      <Page pageNumber={1} />
    </Document>
  );
}