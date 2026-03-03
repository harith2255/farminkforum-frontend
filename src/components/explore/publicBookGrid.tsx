import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Award, TrendingUp, Star } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import axios from "axios";
import { toast } from "sonner";

export default function PublicBooksGrid({ books, onNavigate }) {

  const isLoggedIn = () => !!localStorage.getItem("token");
  const redirectToLogin = () => onNavigate?.("login");

  const addToCart = async (bookId: number) => {
    if (!isLoggedIn()) return redirectToLogin();

    const token = localStorage.getItem("token");
    try {
      await axios.post(
        "https://e-book-backend-production.up.railway.app/api/cart/add",
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

  const handleBuyNow = (book) => {
    if (!isLoggedIn()) return redirectToLogin();

    localStorage.setItem("purchaseType", "book");
    localStorage.setItem("purchaseId", String(book.id));
    localStorage.setItem("purchaseItems", JSON.stringify([{ id: book.id, type: "book" }]));

    onNavigate("purchase", book.id);
    window.history.pushState({}, "", `/purchase/${book.id}`);
  };

  // ---------------------------------------------------------

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-[#1d4d6a] mb-6">Available Study Materials</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
        {books.map((book) => {
          const cover =
            book.cover_url ||
            book.cover ||
            book.image ||
            "https://placehold.co/300x400?text=No+Cover";

          return (
            <Card key={book.id} className="border-none shadow-md hover:shadow-xl transition-all group overflow-hidden">
              
              {/* IMAGE */}
              <div className="relative h-64 overflow-hidden">
                <ImageWithFallback
                  src={cover}
                  alt={book.title}
                  className="w-full h-full object-contain bg-gray-50 group-hover:scale-105 transition-transform duration-500"
                />

                {book.bestseller && (
                  <Badge className="absolute top-3 left-3 bg-[#bf2026] text-white flex items-center">
                    <Award className="w-3 h-3 mr-1" /> Bestseller
                  </Badge>
                )}

                {book.trending && (
                  <Badge className="absolute top-3 right-3 bg-green-600 text-white flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" /> Trending
                  </Badge>
                )}

                {/* Hover: View Details */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <Button
                    onClick={() => onNavigate("login")} // always ask login
                    className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white"
                  >
                    View Details
                  </Button>
                </div>
              </div>

              {/* CONTENT */}
              <CardContent className="p-4">
                {book.category && (
                  <Badge className="bg-blue-100 text-blue-700 text-xs mb-2">
                    {book.category}
                  </Badge>
                )}

                <h3 className="text-[#1d4d6a] mb-1 text-lg font-semibold line-clamp-1">
                  {book.title}
                </h3>

                <p className="text-sm text-gray-500 mb-3">{book.author}</p>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span>{book.rating || "0.0"}</span>
                    <span className="text-xs text-gray-500">({book.reviews || 0})</span>
                  </div>

                  <span className="text-[#bf2026] font-semibold">₹{book.price}</span>
                </div>

                {/* BUTTONS */}
                <div className="flex items-center justify-between gap-2">
                  <Button
                    onClick={() => addToCart(book.id)}
                    className="flex-1 bg-[#1d4d6a] hover:bg-[#153a4f] text-white"
                    size="sm"
                  >
                    Add to Cart
                  </Button>

                  <Button
                    onClick={() => handleBuyNow(book)}
                    className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white"
                    size="sm"
                  >
                    Buy Now
                  </Button>
                </div>
              </CardContent>

            </Card>
          );
        })}
      </div>
    </div>
  );
}