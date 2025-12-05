import { useEffect, useState } from "react";
import NotesReader from "./NotesReader";
import * as React from "react";

export default function ReadNotePage({ noteId, onNavigate, onClose }: any) {

  const [note, setNote] = useState<any>(null);
  const [drm, setDrm] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!noteId) return;

    const load = async () => {
      try {
        const res = await fetch(`https://ebook-backend-lxce.onrender.com/api/notes/${noteId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        // IMPORTANT: your API returns note inside "note" key
        setNote(data.note || null);
        setDrm(data.drm || null);
      } catch (err) {
        console.error("Failed to load note:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [noteId]);

if (!token) {
  onNavigate("notes");
  return null;
}



  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        Loading note...
      </div>
    );
  }

 if (!note && !loading) {
  return (
    <div className="h-screen flex items-center justify-center text-red-500">
      Note not found or not purchased.
      <button onClick={() => onNavigate("notes")} className="underline ml-2">
        Back
      </button>
    </div>
  );
}


 return (
  <NotesReader
    note={note}
    drm={drm}
    onClose={onClose} // ← use provided handler
  />
);
}