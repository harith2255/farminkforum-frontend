import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Award, TrendingUp, Star, FolderPlus } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import axios from "axios";
import { toast } from "sonner";

import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "./ui/dialog";

export default function DashboardBookCard({
  book,
  onOpenBook,
  onNavigate,
}) {
  const isFreeBook = Number(book.price) === 0;

  const [collections, setCollections] = useState<any[]>([]);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [inCollection, setInCollection] = useState(false);
  const [isPurchased, setIsPurchased] = useState(
    book.purchased || isFreeBook
  );

  useEffect(() => {
    setIsPurchased(book.purchased || isFreeBook);
  }, [book.purchased, isFreeBook]);

  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(
    book.user_rating ?? null
  );
  const [avgRating, setAvgRating] = useState(book.rating ?? 4.5);
  const ratingRef = useRef<HTMLDivElement | null>(null);
  const [reviewsCount, setReviewsCount] = useState(book.reviews ?? 0);

  const isLoggedIn = () => !!localStorage.getItem("token");
  const token = localStorage.getItem("token");

  const cover =
    book.cover_url ||
    book.cover ||
    book.image ||
    "https://placehold.co/300x400?text=No+Cover";

  /* ---------------------------------------------------
       LOAD USER COLLECTIONS (single effect)
  --------------------------------------------------- */
  useEffect(() => {
    const loadCollections = async () => {
      if (!isLoggedIn()) return;

      try {
        const res = await axios.get(
          "https://ebook-backend-lxce.onrender.com/api/library/collections",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setCollections(res.data || []);

        const contains = res.data.some((c) =>
          c.books?.some((b) => b.id === book.id)
        );

        setInCollection(contains);
      } catch {}
    };

    loadCollections();
  }, []);

  /* ---------------------------------------------------
        ADD BOOK TO COLLECTION
  --------------------------------------------------- */
  const addToCollection = async (collectionId: string) => {
    try {
      await axios.post(
        `https://ebook-backend-lxce.onrender.com/api/library/collections/${collectionId}/add`,
        { book_id: book.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Added to collection ✓");
      setIsCollectionDialogOpen(false);
      setInCollection(true);

      window.dispatchEvent(
        new CustomEvent("library:updated", {
          detail: { bookId: book.id },
        })
      );
      window.dispatchEvent(new Event("refresh-explore"));
    } catch {
      toast.error("Failed to add to collection");
    }
  };

  /* ---------------------------------------------------
              ADD TO CART
  --------------------------------------------------- */
  const handleAddToCart = async () => {
    if (!isLoggedIn()) return onNavigate("login");
    if (isFreeBook) return;

    try {
      const res = await axios.get(
        "https://ebook-backend-lxce.onrender.com/api/cart",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const alreadyInCart = res.data?.items?.some(
        (item: any) => String(item.book_id) === String(book.id)
      );

      if (alreadyInCart) {
        toast("Item already in cart 🛒");
        return;
      }

      await axios.post(
        "https://ebook-backend-lxce.onrender.com/api/cart/add",
        { book_id: book.id, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Added to cart ✓");
      window.dispatchEvent(new CustomEvent("cart:changed"));
    } catch {
      toast.error("Failed to add to cart");
    }
  };

  /* ---------------------------------------------------
                 BUY NOW
  --------------------------------------------------- */
  const handleBuyNow = async () => {
    if (!isLoggedIn()) return onNavigate("login");

    if (isFreeBook) {
      try {
        await axios.post(
          "https://ebook-backend-lxce.onrender.com/api/purchases/unified",
          { items: [{ id: book.id, type: "book" }] },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.success("Book added to your library 📚");
        setIsPurchased(true);

        window.dispatchEvent(
          new CustomEvent("library:updated", {
            detail: { bookId: book.id },
          })
        );
        return;
      } catch {
        toast.error("Failed to add free book");
        return;
      }
    }

    localStorage.setItem("purchaseType", "book");
    localStorage.setItem("purchaseId", String(book.id));
    localStorage.setItem(
      "purchaseItems",
      JSON.stringify([{ id: book.id, type: "book" }])
    );

    onNavigate("purchase", book.id);
  };

  /* ---------------------------------------------------
              READ / VIEW DETAILS
  --------------------------------------------------- */
  const handleReadNow = () => {
    if (!isLoggedIn()) return onNavigate("login");
    return onOpenBook(book, { preview: false });
  };

  const handleViewDetails = () => {
    if (!isLoggedIn()) return onNavigate("login");

    return onOpenBook(book, {
      preview: !isPurchased && !isFreeBook,
      previewPages: !isPurchased && !isFreeBook ? 2 : undefined,
    });
  };

  /* ---------------------------------------------------
           PURCHASE EVENT LISTENER (single)
  --------------------------------------------------- */
  useEffect(() => {
    const onPurchase = (e: any) => {
      if (String(e?.detail?.bookId) === String(book.id)) {
        setIsPurchased(true);
      }
    };

    window.addEventListener("library:updated", onPurchase);
    return () => window.removeEventListener("library:updated", onPurchase);
  }, [book.id]);

  /* ---------------------------------------------------
                RENDER
  --------------------------------------------------- */
  return (
    <>
      <Card className="border-none shadow-md hover:shadow-xl transition-all group overflow-hidden">
        <div className="relative aspect-[3/4] overflow-hidden">
          <ImageWithFallback
            src={cover}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {book.bestseller && (
            <Badge className="absolute top-3 left-3 bg-[#bf2026] text-white">
              <Award className="w-3 h-3 mr-1" />
              Bestseller
            </Badge>
          )}

          {book.trending && (
            <Badge className="absolute top-3 right-3 bg-green-600 text-white">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending
            </Badge>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
            <Button
              onClick={handleViewDetails}
              className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white"
            >
              View Details
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          <h3 className="text-[#1d4d6a] mb-1 text-lg font-semibold line-clamp-1">
            {book.title}
          </h3>

          <p className="text-sm text-gray-500 mb-3">{book.author}</p>

          <span className="text-[#bf2026] font-semibold">
            {isFreeBook ? "Free" : `₹${book.price}`}
          </span>

          <div className="flex items-center justify-between gap-2 mt-3">
            {isPurchased ? (
              <Button
                onClick={handleReadNow}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                Read Now
              </Button>
            ) : (
              <>
                {!isFreeBook && (
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1 bg-[#1d4d6a] hover:bg-[#153a4f] text-white"
                    size="sm"
                  >
                    Add to Cart
                  </Button>
                )}
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
    </>
  );
}
