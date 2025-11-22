// src/components/explore/ExplorePage.tsx
import { useEffect, useState } from "react";
import HeroSection from "./HeroSection";
import CategoryFilter from "./CategorySection";
import BooksGrid from "./BooksGrid";
import * as React from "react";

function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicBooks = async () => {
      try {
        setLoading(true);

        const res = await fetch("https://ebook-backend-lxce.onrender.com/api/content?type=books");
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
    ...Array.from(new Set(books.map((b) => b.category).filter(Boolean)))
  ];

  const filteredBooks = books.filter(
    (book) =>
      (selectedCategory === "All" || book.category === selectedCategory) &&
      (searchQuery === "" ||
        book.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 🚫 ALWAYS redirect to LOGIN for public Explore
  const forceLogin = () => {
    window.history.pushState({}, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div>
      <HeroSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="max-w-7xl mx-auto px-6 py-12">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <BooksGrid
          books={filteredBooks.map((b) => ({
            ...b,
            purchased: false, // just to avoid undefined
            onBuy: forceLogin
          }))}
          onOpenBook={forceLogin}
          onNavigate={forceLogin}   // ⬅️ REQUIRED so "Buy Now" triggers login
        />
      </div>
    </div>
  );
}

export default ExplorePage;