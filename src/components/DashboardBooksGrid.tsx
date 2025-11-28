import React from "react";
import DashboardBookCard from "./DashboardBooksCard";

export default function DashboardBooksGrid({ books, onNavigate, onOpenBook }) {
  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-[#1d4d6a] mb-6">
        Your Available Books
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
  {books.map((book) => (
    <React.Fragment key={book.id}>
      <DashboardBookCard
        book={book}
        onNavigate={onNavigate}
        onOpenBook={onOpenBook}
      />
    </React.Fragment>
  ))}
</div>

    </div>
  );
}