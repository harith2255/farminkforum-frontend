// src/components/explore/Explore.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import CategoryFilter from "../explore/CategorySection";
import BooksGrid from "../explore/BooksGrid";
import * as React from "react";
import {toast} from "sonner"
function Explore({
  onOpenBook,
  onNavigate
}: {
  onOpenBook: (book: any) => void;
  onNavigate: (page: string) => void;
}) {
  const [books, setBooks] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  const handleAddToCart = async (bookId: number) => {
  const token = localStorage.getItem("token");

  if (!token) {
    onNavigate("login");
    return;
  }

  try {
    await axios.post(
      "https://ebook-backend-lxce.onrender.com/api/cart/add",
      { book_id: bookId, quantity: 1 },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.success("Added to cart ✓");

    // Let the dashboard cart refresh automatically
    window.dispatchEvent(new CustomEvent("cart:changed"));
  } catch (err) {
    console.error("Add to cart failed:", err);
    toast.error("Failed to add to cart");
  }
};

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);

        const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/content?type=books");
        let payload = res.data?.contents ?? [];

        const token = localStorage.getItem("token");

        if (token) {
          payload = await Promise.all(
            payload.map(async (book: any) => {
              const check = await axios.get(
                "https://ebook-backend-lxce.onrender.com/api/purchase/check",
                {
                  params: { bookId: book.id },
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              return { ...book, purchased: check.data.purchased };
            })
          );
        }

        setBooks(payload);
      } catch (err) {
        console.error("Error fetching books:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(books.map((b) => b.category).filter(Boolean)))
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
        <p className="text-gray-500 text-center">Loading books...</p>
      ) : (
       <BooksGrid
  books={filteredBooks.map(book => ({
    ...book,

    onBuy: () => {
      localStorage.setItem("purchaseType", "book");
      localStorage.setItem("purchaseId", book.id.toString());
      onNavigate("purchase");
    },

    onAddToCart: async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        onNavigate("login");
        return;
      }

      try {
        await axios.post(
          "https://ebook-backend-lxce.onrender.com/api/cart/add",
          { book_id: book.id, quantity: 1 },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        window.dispatchEvent(new CustomEvent("cart:changed"));
        alert("Added to cart ✓");

      } catch (err) {
        console.error("Add to cart error:", err);
        alert("Failed to add to cart");
      }
    }

  }))}

  onOpenBook={onOpenBook}
  onNavigate={onNavigate}
/>



      )}
    </div>
  );
}

export default Explore;