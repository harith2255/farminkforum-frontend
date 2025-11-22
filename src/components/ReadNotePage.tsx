import * as React from "react";
import { Button } from "./ui/button";


export default function ReadNotePage({ onNavigate }) {
  const fileUrl = localStorage.getItem("readNoteFile");
  const title = localStorage.getItem("readNoteTitle");

  return (
    <div className="p-6">
      <Button onClick={() => onNavigate("notes")}>← Back</Button>

      <h2 className="text-2xl mt-4 mb-4 text-[#1d4d6a]">{title}</h2>

      <iframe
        src={fileUrl ?? undefined}
        className="w-full h-[80vh] border rounded-lg"
      />
    </div>
  );
}