// src/components/explore/ExplorePage.tsx
import { useEffect, useState } from "react";
import HeroSection from "./HeroSection";
import CategoryFilter from "./CategorySection";
import * as React from "react";
import PublicBooksGrid from "./publicBookGrid";

function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicBooks = async () => {
      try {
        setLoading(true);

        const res = await fetch("https://e-book-backend-production.up.railway.app/api/content?type=books");
        const json = await res.json();
        const payload = json?.contents ?? json ?? [];

        setBooks(payload);
      } catch (err) {
        console.error("Error fetching public books:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicBooks();
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(books.map((b) => b.category).filter(Boolean))),
  ];

  const filteredBooks = books.filter(
    (book) =>
      (selectedCategory === "All" || book.category === selectedCategory) &&
      (searchQuery === "" ||
        book.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const forceLogin = () => {
    window.location.href = "/login"; // 🔥 public page → always login
  };

  return (
    <div>
     {/* HERO BANNER */}
      <HeroSection searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        {/* PUBLIC BOOK GRID */}
        {loading ? (
          <p className="text-center text-gray-500 mt-10">Loading books...</p>
        ) : (
          <PublicBooksGrid
            books={filteredBooks}
            onNavigate={forceLogin}
          />
        )}
      </div>
    </div>
  );
}

export default ExplorePage;