import { useEffect, useState } from "react";
import NotesReader from "./NotesReader";
import * as React from "react";

export default function ReadNotePage({ noteId, onNavigate, onClose }: any) {
  const [note, setNote] = useState<any>(null);
  const [isPurchased, setIsPurchased] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [drm, setDrm] = useState<any>(null);

  const token = localStorage.getItem("token");
  const deviceId = localStorage.getItem("device_id") || "unknown-device";



  /* ---------------------------------------------------
     🟦 Step 2: Load Note Details + DRM Check
  --------------------------------------------------- */
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
        setNote(data.note || null);
        setIsPurchased(data.isPurchased || false);

        // ❗ Require purchase
        if (!data.isPurchased && data.note?.price > 0) {
          setLoading(false);
          return;
        }

       
      

        const drmRes = await fetch(
          `https://ebook-backend-lxce.onrender.com/api/drm/check-access?note_id=${noteId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-Device-Id": deviceId,
            },
          }
        );

        const drmData = await drmRes.json();

        if (!drmData.can_read) {
          alert("Access Denied: " + drmData.reason);
          onNavigate("notes");
          return;
        }

        setDrm(drmData);
      } catch (err) {
        console.error("Failed to load note:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [noteId]);

  /* ---------------------------------------------------
     AUTH REQUIRED
  --------------------------------------------------- */
  if (!token) {
    onNavigate("login");
    return null;
  }

  /* ---------------------------------------------------
     LOADING
  --------------------------------------------------- */
  if (loading || drm === null) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        Loading note...
      </div>
    );
  }

  /* ---------------------------------------------------
     NOTE NOT FOUND
  --------------------------------------------------- */
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

  /* ---------------------------------------------------
     MUST PURCHASE FIRST
  --------------------------------------------------- */
  if (!isPurchased && note.price > 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-gray-700 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Purchase Required</h2>
        <p className="text-center text-sm max-w-sm">
          You need to purchase this note to access the full content.
        </p>

        <button
          className="px-6 py-2 bg-[#bf2026] text-white rounded-lg"
          onClick={() => onNavigate("purchase", String(noteId))}
        >
          Buy Now
        </button>

        <button
          className="text-sm underline text-gray-500"
          onClick={() => onNavigate("notes")}
        >
          Back to Notes
        </button>
      </div>
    );
  }

  /* ---------------------------------------------------
     ALLOW READING WITH DRM RULES
  --------------------------------------------------- */
  return (
    <NotesReader
      note={note}
      drm={drm}
      onClose={onClose}
    />
  );
}