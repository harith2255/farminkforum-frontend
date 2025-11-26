// src/components/explore/BooksGrid.tsx

import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Award, TrendingUp, Star } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import axios from "axios";
import { toast } from "sonner";

interface BooksGridProps {
  books: any[];
  onOpenBook?: (book: any) => void;
  onNavigate?: (page: string) => void;
}

export default function BooksGrid({ books, onOpenBook, onNavigate }: BooksGridProps) {
  
  const redirectToLogin = () => {
    window.history.pushState({}, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const addToCart = async (bookId: number) => {
    const token = localStorage.getItem("token");
    if (!token) {
      onNavigate?.("login");
      return;
    }

    try {
      await axios.post(
        "https://ebook-backend-lxce.onrender.com/api/cart/add",
        { book_id: bookId, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Book added to cart ✓");
      window.dispatchEvent(new CustomEvent("cart:changed"));
    } catch (err) {
      console.error("Add to cart failed:", err);
      toast.error("Failed to add book to cart");
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-[#1d4d6a] mb-6">
        Available Books
      </h2>

      <div
        className="
          grid grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          gap-8
          auto-rows-fr
        "
      >
        {books.map((book) => {

          // 🚀 FIXED: Correct fallback chain
          const cover =
            book.cover_url ||
            book.cover ||
            book.image ||
            "https://placehold.co/300x400?text=No+Cover";

          return (
            <Card
              key={book.id}
              className="border-none shadow-md hover:shadow-xl transition-all group overflow-hidden"
            >
              {/* IMAGE SECTION */}
              <div className="relative h-64 overflow-hidden">
                <ImageWithFallback
                  src={cover}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />

                {/* Bestseller Badge */}
                {book.bestseller && (
                  <Badge className="absolute top-3 left-3 bg-[#bf2026] text-white flex items-center">
                    <Award className="w-3 h-3 mr-1" />
                    Bestseller
                  </Badge>
                )}

                {/* Trending Badge */}
                {book.trending && (
                  <Badge className="absolute top-3 right-3 bg-green-600 text-white flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending
                  </Badge>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <Button
                    onClick={() => {
                      if (onOpenBook) onOpenBook(book);
                      else redirectToLogin();
                    }}
                    className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white"
                  >
                    View Details
                  </Button>
                </div>
              </div>

              {/* CONTENT */}
              <CardContent className="p-4">

                {/* Category */}
                {book.category && (
                  <Badge className="bg-blue-100 text-blue-700 text-xs mb-2">
                    {book.category}
                  </Badge>
                )}

                {/* Title */}
                <h3 className="text-[#1d4d6a] mb-1 line-clamp-1 text-lg font-semibold">
                  {book.title}
                </h3>

                {/* Author */}
                <p className="text-sm text-gray-500 mb-3">{book.author}</p>

                {/* Rating + Price */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm">{book.rating || "4.5"}</span>
                    <span className="text-xs text-gray-500">
                      ({book.reviews || 120})
                    </span>
                  </div>

                  <span className="text-[#bf2026] font-semibold">
                    ₹{book.price || 0}
                  </span>
                </div>

                {/* BUTTON ROW */}
                <div className="flex items-center justify-between gap-2">

                  {/* Add to Cart */}
                  <Button
                    onClick={() => addToCart(book.id)}
                    className="flex-1 bg-[#1d4d6a] hover:bg-[#153a4f] text-white"
                    size="sm"
                  >
                    Add to Cart
                  </Button>

                  {/* Buy Now */}
                  {!book.purchased ? (
                    <Button
                      onClick={() => {
                        const token = localStorage.getItem("token");
                        if (!token) {
                          onNavigate?.("login");
                          return;
                        }
                        localStorage.setItem("purchaseType", "book");
                        localStorage.setItem("purchaseId", String(book.id));
                        onNavigate?.("purchase");
                      }}
                      className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white"
                      size="sm"
                    >
                      Buy Now
                    </Button>
                  ) : (
                    <Button
                      disabled
                      className="flex-1 bg-green-600 text-white"
                      size="sm"
                    >
                      ✓ Purchased
                    </Button>
                  )}

                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}