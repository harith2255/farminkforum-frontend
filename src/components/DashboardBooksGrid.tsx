import React, { useEffect, useState } from "react";
import DashboardBookCard from "./DashboardBooksCard";

export default function DashboardBooksGrid({
  books,
  onNavigate,
  onOpenBook,
}) {
  // 🔹 Local copy of books to allow instant UI updates
  const [localBooks, setLocalBooks] = useState(books);

  // 🔹 Sync when parent updates books (normal renders)
  useEffect(() => {
    setLocalBooks(books);
  }, [books]);

  // 🔹 Listen for purchase / library updates
  useEffect(() => {
    const onLibraryUpdated = (e: any) => {
      const purchasedId = e?.detail?.bookId;

setLocalBooks((prev) =>
  prev.map((b) =>
    String(b.id) === String(purchasedId)
      ? { ...b, purchased: true }
      : b
  )
);

    };

    window.addEventListener("library:updated", onLibraryUpdated);
    return () =>
      window.removeEventListener("library:updated", onLibraryUpdated);
  }, []);

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-[#1d4d6a] mb-6">
        Your Available Study Materials
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
        {localBooks.map((book) => (
          <DashboardBookCard
            key={book.id}
            book={book}
            onNavigate={onNavigate}
            onOpenBook={onOpenBook}
          />
        ))}
      </div>
    </div>
  );
}