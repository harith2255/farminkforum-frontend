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
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          onNavigate("login");
          return;
        }

        const data = await res.json();

        // API format: { note, isPurchased, preview_content }
        setNote(data.note || null);
        setDrm(data.drm || null);

        // If not purchased, redirect
        if (!data.note?.file_url) {
          onNavigate("purchase", String(noteId));
        }

      } catch (err) {
        console.error("Failed to load note:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [noteId]);

  // no token → go login
  if (!token) {
    onNavigate("login");
    return null;
  }

  // loading UI
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        Loading note...
      </div>
    );
  }

  // final fallback
  if (!note) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        Note not found.
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
      onClose={onClose}
    />
  );
}