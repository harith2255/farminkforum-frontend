// src/components/user/Explore.tsx
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import CategoryFilter from "../explore/CategorySection";
import DashboardBooksGrid from "../DashboardBooksGrid";
import * as React from "react";

function Explore({ onOpenBook, onNavigate }) {
  const [books, setBooks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  const isLoggedIn = () => {
    const token = localStorage.getItem("token");
    return token && token.length > 10;
  };

  // ✅ MAKE fetchBooks stable and available everywhere
  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);

      // 1️⃣ Fetch all books
      const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/content?type=books");
      let list = res.data?.contents || [];

      // 2️⃣ Fetch purchased book IDs
      let purchasedIds = [];
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const pres = await axios.get(
            "https://ebook-backend-lxce.onrender.com/api/purchase/purchased/book-ids",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          purchasedIds = pres.data || [];
        } catch (err) {
          console.log("⚠️ Could not fetch purchased IDs", err);
        }
      }
console.log("🔥 purchasedIds =", purchasedIds);
console.log("📚 allBooks =", list);

      // 3️⃣ Merge purchased flag
      const merged = list.map((b) => ({
        ...b,
        purchased: purchasedIds.includes(b.id),
      }));

      console.log("📘 MERGED BOOKS = ", merged);

      setBooks(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 1️⃣ Load books initially
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // 2️⃣ Refresh Explore after payment success
  useEffect(() => {
    const refresh = () => fetchBooks();
    window.addEventListener("refresh-library", refresh);

    return () => window.removeEventListener("refresh-library", refresh);
  }, [fetchBooks]);

  // 3️⃣ (Optional) Some pages emit refresh-explore
  useEffect(() => {
    const refresh = () => fetchBooks();
    window.addEventListener("refresh-explore", refresh);

    return () => window.removeEventListener("refresh-explore", refresh);
  }, [fetchBooks]);

  const categories = [
    "All",
    ...Array.from(new Set(books.map((b) => b.category).filter(Boolean))),
  ];

  const filteredBooks =
    selectedCategory === "All"
      ? books
      : books.filter((b) => b.category === selectedCategory);
  return (
    <div className="space-y-6">
      <h2 className="text-[#1d4d6a] mb-1">Explore Books</h2>
      <p className="text-sm text-gray-500">Discover amazing books</p>

      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        showHeading={false}
        layout="user"
      />

{loading ? (
        <p className="text-center text-gray-500">Loading books...</p>
      ) : (
        <DashboardBooksGrid
          books={filteredBooks}
          onOpenBook={onOpenBook}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

export default Explore;