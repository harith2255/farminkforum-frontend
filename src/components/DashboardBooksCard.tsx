import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Award, TrendingUp, Star } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import axios from "axios";
import { toast } from "sonner";

export default function DashboardBookCard({
  book,
  onOpenBook,
  onNavigate,
}: {
  book: any;
  onOpenBook: (book: any) => void;
  onNavigate: (page: string, param?: string) => void;
}) {
  const isLoggedIn = () => !!localStorage.getItem("token");
  const token = localStorage.getItem("token");
  const cover =
    book.cover_url ||
    book.cover ||
    book.image ||
    "https://placehold.co/300x400?text=No+Cover";

  /* ------------------ ADD TO CART ------------------ */
  const handleAddToCart = async () => {
    if (!isLoggedIn()) return onNavigate("login");

    try {
      await axios.post(
        "https://ebook-backend-lxce.onrender.com/api/cart/add",
        { book_id: book.id, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Added to cart ✓");
      window.dispatchEvent(new CustomEvent("cart:changed"));
    } catch (err) {
      console.error("Add to cart error:", err);
      toast.error("Failed to add to cart");
    }
  };

  /* ------------------ BUY NOW ------------------ */
  const handleBuyNow = () => {
    if (!isLoggedIn()) return onNavigate("login");

    localStorage.setItem("purchaseType", "book");
    localStorage.setItem("purchaseId", String(book.id));
    localStorage.setItem(
      "purchaseItems",
      JSON.stringify([{ id: book.id, type: "book" }])
    );

    localStorage.setItem("previousSection", "explore");

    onNavigate("purchase", book.id);
    window.history.pushState({}, "", `/purchase/${book.id}`);
  };

  /* ------------------ READ NOW ------------------ */
  const handleReadNow = () => {
    if (!isLoggedIn()) return onNavigate("login");
    onOpenBook(book);
  };

  /* ------------------ VIEW DETAILS ------------------ */
  const handleViewDetails = () => {
    if (!isLoggedIn()) return onNavigate("login");
    onOpenBook(book);
  };

  return (
    <Card className="border-none shadow-md hover:shadow-xl transition-all group overflow-hidden">
      {/* IMAGE */}
      <div className="relative h-64 overflow-hidden">
        <ImageWithFallback
          src={cover}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {book.bestseller && (
          <Badge className="absolute top-3 left-3 bg-[#bf2026] text-white flex items-center">
            <Award className="w-3 h-3 mr-1" />
            Bestseller
          </Badge>
        )}

        {book.trending && (
          <Badge className="absolute top-3 right-3 bg-green-600 text-white flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            Trending
          </Badge>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <Button
            onClick={handleViewDetails}
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
            <span className="text-sm">{book.rating ?? "4.5"}</span>
            <span className="text-xs text-gray-500">
              ({book.reviews ?? 0})
            </span>
          </div>

          <span className="text-[#bf2026] font-semibold">
            ₹{book.price ?? 0}
          </span>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-between gap-2">
          {book.purchased ? (
            <Button
              onClick={handleReadNow}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              Read Now
            </Button>
          ) : (
            <>
              <Button
                onClick={handleAddToCart}
                className="flex-1 bg-[#1d4d6a] hover:bg-[#153a4f] text-white"
                size="sm"
              >
                Add to Cart
              </Button>

              <Button
                onClick={handleBuyNow}
                className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white"
                size="sm"
              >
                Buy Now
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}