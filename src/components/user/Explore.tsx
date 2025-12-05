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

  // ✅ Stable fetchBooks method
  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      /* ---------------------------------------------------
            1️⃣ Fetch all books
      --------------------------------------------------- */
      const res = await axios.get(
        "https://ebook-backend-lxce.onrender.com/api/content?type=books"
      );
      let list = res.data?.contents || [];

      /* ---------------------------------------------------
            2️⃣ Fetch purchased + collection book IDs
      --------------------------------------------------- */
     let purchasedIds = [];
let collectionIds = [];

if (token) {
  try {
    const pres = await axios.get(
      "https://ebook-backend-lxce.onrender.com/api/purchase/purchased/book-ids",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    purchasedIds = Array.isArray(pres.data) ? pres.data : pres.data?.bookIds || [];
  } catch (err) {
    console.log("⚠️ Could not fetch purchased IDs", err);
  }

  try {
    const cres = await axios.get(
      "https://ebook-backend-lxce.onrender.com/api/library/collections/book-ids",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    collectionIds = Array.isArray(cres.data)
      ? cres.data
      : cres.data?.bookIds || [];

  } catch (err) {
    console.log("⚠️ Could not fetch collection IDs", err);
  }
}

/* ---------------------------------------------------
      3️⃣ Merge flags into books
--------------------------------------------------- */

const normPurchased = purchasedIds.map(String);
const normCollection = collectionIds.map(String);

const merged = list.map((b) => ({
  ...b,
  purchased: normPurchased.includes(String(b.id)),
  inCollection: normCollection.includes(String(b.id)),
}));


      console.log("📘 MERGED BOOKS = ", merged);

      setBooks(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------------------------------------------
        LOAD BOOKS INITIALLY
  --------------------------------------------------- */
  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  /* ---------------------------------------------------
        REFRESH AFTER PAYMENT SUCCESS
  --------------------------------------------------- */
  useEffect(() => {
    const refresh = () => fetchBooks();
    window.addEventListener("refresh-library", refresh);

    return () => window.removeEventListener("refresh-library", refresh);
  }, [fetchBooks]);
useEffect(() => {
  window.addEventListener("collections:changed", fetchBooks);
  return () => window.removeEventListener("collections:changed", fetchBooks);
}, []);

  /* ---------------------------------------------------
        OPTIONAL GLOBAL REFRESH
  --------------------------------------------------- */
  useEffect(() => {
    const refresh = () => fetchBooks();
    window.addEventListener("refresh-explore", refresh);

    return () => window.removeEventListener("refresh-explore", refresh);
  }, [fetchBooks]);

  /* ---------------------------------------------------
        FILTERING
  --------------------------------------------------- */
  const categories = [
    "All",
    ...Array.from(new Set(books.map((b) => b.category).filter(Boolean))),
  ];

  const filteredBooks =
    selectedCategory === "All"
      ? books
      : books.filter((b) => b.category === selectedCategory);

  /* ---------------------------------------------------
        RENDER
  --------------------------------------------------- */
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