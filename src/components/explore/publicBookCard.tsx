// src/components/explore/PublicBookCard.tsx

import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Award, TrendingUp, Star } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import axios from "axios";
import { toast } from "sonner";

export default function PublicBookCard({ book, onNavigate }) {
  const isLoggedIn = () => !!localStorage.getItem("token");
  const cover =
    book.cover_url ||
    book.cover ||
    book.image ||
    "https://placehold.co/300x400?text=No+Cover";

  /* --------------------------------------------------
     ADD TO CART (login required)
  -------------------------------------------------- */
  const handleAddToCart = async () => {
    if (!isLoggedIn()) return onNavigate("login");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "e-book-backend-production.up.railway.app/api/cart/add",
        { book_id: book.id, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Added to cart ✓");
      window.dispatchEvent(new Event("cart:changed"))
    } catch (err) {
      console.error(err);
      toast.error("Failed to add book to cart");
    }
  };

  /* --------------------------------------------------
     BUY NOW → PURCHASE PAGE (login required)
  -------------------------------------------------- */
  const handleBuyNow = () => {
    if (!isLoggedIn()) return onNavigate("login");

    localStorage.setItem("purchaseType", "book");
    localStorage.setItem("purchaseId", String(book.id));
    localStorage.setItem(
      "purchaseItems",
      JSON.stringify([{ id: book.id, type: "book" }])
    );

    onNavigate("purchase", book.id);
    window.history.pushState({}, "", `/purchase/${book.id}`);
  };

  /* --------------------------------------------------
     VIEW DETAILS → NO LOGIN REQUIRED
  -------------------------------------------------- */
  const handleViewDetails = () => {
    onNavigate("reader", book.id); // Public can view details freely
    window.history.pushState({}, "", `/reader/${book.id}`);
  };

  return (
    <Card className="border-none shadow-md hover:shadow-xl transition-all group overflow-hidden">
      {/* IMAGE SECTION */}
      <div className="relative h-64 overflow-hidden">
        <ImageWithFallback
          src={cover}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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

        {/* Hover Layer */}
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

        <h3 className="text-[#1d4d6a] mb-1 line-clamp-1 text-lg font-semibold">
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
          {/* Add to Cart */}
          <Button
            onClick={handleAddToCart}
            className="flex-1 bg-[#1d4d6a] hover:bg-[#153a4f] text-white"
            size="sm"
          >
            Add to Cart
          </Button>

          {/* Buy Now */}
          <Button
            onClick={handleBuyNow}
            className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white"
            size="sm"
          >
            Buy Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}