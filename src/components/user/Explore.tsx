// src/components/user/Explore.tsx
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import CategoryFilter from "../explore/CategorySection";
import DashboardBooksGrid from "../DashboardBooksGrid";
import * as React from "react";

function Explore({ onOpenBook, onNavigate }) {
  const [books, setBooks] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  const isLoggedIn = () => {
    const token = localStorage.getItem("token");
    return token && token.length > 10;
  };

  /* ---------------------------------------------------
        FETCH BOOKS (STABLE)
  --------------------------------------------------- */
  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      /* ----------------------------
         1️⃣ FETCH ALL BOOKS
      ---------------------------- */
      const res = await axios.get(
        "https://e-book-backend-production.up.railway.app/api/content?type=books"
      );

      let list = res.data?.contents || [];

      /* ----------------------------
         2️⃣ FETCH PURCHASED IDS
      ---------------------------- */
      let purchasedIds: string[] = [];
      let collectionIds: string[] = [];

      if (token) {
        try {
          const pres = await axios.get(
            "https://e-book-backend-production.up.railway.app/api/purchases/purchased/book-ids",
            { headers: { Authorization: `Bearer ${token}` } }
          );

          purchasedIds = Array.isArray(pres.data)
            ? pres.data
            : pres.data?.bookIds || [];
        } catch (err) {
          console.log("⚠️ Could not fetch purchased IDs", err);
        }

        try {
          const cres = await axios.get(
            "https://e-book-backend-production.up.railway.app/api/library/collections/book-ids",
            { headers: { Authorization: `Bearer ${token}` } }
          );

          collectionIds = Array.isArray(cres.data)
            ? cres.data
            : cres.data?.bookIds || [];
        } catch (err) {
          console.log("⚠️ Could not fetch collection IDs", err);
        }
      }

      /* ----------------------------
         3️⃣ MERGE FLAGS
      ---------------------------- */
      const normPurchased = purchasedIds.map(String);
      const normCollection = collectionIds.map(String);

      const merged = list.map((b: any) => ({
        ...b,

        // normalize category
        category: b.categories?.name || null,

        purchased: normPurchased.includes(String(b.id)),
        inCollection: normCollection.includes(String(b.id)),
      }));

      setBooks(merged);
    } catch (err) {
      console.error("❌ Failed to load books", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------------------------
        INITIAL LOAD
  --------------------------------------------------- */
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  /* ---------------------------------------------------
        🔥 REFRESH AFTER PURCHASE / LIBRARY UPDATE
  --------------------------------------------------- */
  useEffect(() => {
    const refresh = () => fetchBooks();

    window.addEventListener("library:updated", refresh);
    window.addEventListener("refresh-explore", refresh);
    window.addEventListener("collections:changed", refresh);

    return () => {
      window.removeEventListener("library:updated", refresh);
      window.removeEventListener("refresh-explore", refresh);
      window.removeEventListener("collections:changed", refresh);
    };
  }, [fetchBooks]);

  /* ---------------------------------------------------
        FILTERING
  --------------------------------------------------- */
  const categories = [
    "All",
    ...Array.from(
      new Set(books.map((b) => b.category).filter(Boolean))
    ),
  ];

  const filteredBooks =
    selectedCategory === "All"
      ? books
      : books.filter((b) => b.category === selectedCategory);

  /* ----------
        RENDER
  ------------- */
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header */}
      <div>
        <h2 className="text-[#1d4d6a] text-xl sm:text-2xl font-bold mb-1">
          Explore Books
        </h2>
        <p className="text-sm text-gray-500">
          Discover amazing books
        </p>
      </div>

      {/* Category Filter */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        showHeading={false}
        layout="user"
      />

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a]"></div>
            <p className="text-gray-500 mt-2">Loading books...</p>
          </div>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No books....
          </p>
        </div>
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