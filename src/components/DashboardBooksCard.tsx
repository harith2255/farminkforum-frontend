import React, { useState, useEffect } from "react";
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
  const [collections, setCollections] = useState<any[]>([]);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);

const [inCollection, setInCollection] = useState(false);
const [isPurchased, setIsPurchased] = useState(book.purchased);



  const isLoggedIn = () => !!localStorage.getItem("token");
  const token = localStorage.getItem("token");

  const cover =
    book.cover_url ||
    book.cover ||
    book.image ||
    "https://placehold.co/300x400?text=No+Cover";

  /* ---------------------------------------------------
       LOAD USER COLLECTIONS
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

      // CHECK IF THIS BOOK EXISTS IN ANY COLLECTION
      const contains = res.data.some((c) =>
        c.books?.some((b) => b.id === book.id)
      );

      setInCollection(contains);

    } catch (err) {
      console.log("Failed to load collections");
    }
  };

  loadCollections();
}, []);


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

    // instantly change UI
    setInCollection(true);

    // notify library/explore screens to refetch
    window.dispatchEvent(new Event("library:updated"));
    window.dispatchEvent(new Event("refresh-explore"));

  } catch (err: any) {
    toast.error("Failed to add to collection");
  }
};


  /* ---------------------------------------------------
              ADD TO CART
  --------------------------------------------------- */
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

  /* ---------------------------------------------------
                 BUY NOW
  --------------------------------------------------- */
const handleBuyNow = () => {
  if (!isLoggedIn()) return onNavigate("login");

  localStorage.setItem("purchaseType", "book");
  localStorage.setItem("purchaseId", String(book.id));
  localStorage.setItem("purchaseItems", JSON.stringify([{ id: book.id, type: "book" }]));
  localStorage.setItem("previousSection", "explore");

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
    preview: !isPurchased,
    previewPages: isPurchased ? undefined : 2,
  });
};


useEffect(() => {
  const onPurchase = () => {
    setIsPurchased(true);
  };

  window.addEventListener("library:updated", onPurchase);
  return () => window.removeEventListener("library:updated", onPurchase);
}, []);




useEffect(() => {
  const onPurchase = (e: any) => {
    if (String(e?.detail?.bookId) === String(book.id)) {
      setIsPurchased(true);
    }
  };

  window.addEventListener("library:updated", onPurchase);
  return () => window.removeEventListener("library:updated", onPurchase);
}, [book.id]);



  return (
    <>
      {/* ============================
          BOOK CARD
      ============================= */}
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
         {book.categories?.name && (
  <Badge className="bg-blue-100 text-blue-700 text-xs mb-2">
    {book.categories.name}
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
              <span className="text-xs text-gray-500">({book.reviews ?? 0})</span>
            </div>

            <span className="text-[#bf2026] font-semibold">
              ₹{book.price ?? 0}
            </span>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-between gap-2">
            {isPurchased ? (
              <>
                <Button
                  onClick={handleReadNow}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  Read Now
                </Button>

                {/* Add To Collection Button */}
       {inCollection ? (
  <Button disabled className="flex-1 bg-gray-300 text-gray-600" size="sm">
    Added ✓
  </Button>
) : (
  <Button
    onClick={() => setIsCollectionDialogOpen(true)}
    className="flex-1 bg-[#1d4d6a] hover:bg-[#153a4f] text-white"
    size="sm"
  >
    <FolderPlus className="w-4 h-4 mr-1" />
    Add to Collection
  </Button>
)}



              </>
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

      {/* ============================
          COLLECTION SELECT DIALOG
      ============================= */}
      <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Collection</DialogTitle>
          </DialogHeader>

          {collections.length === 0 ? (
            <p className="text-gray-500 text-sm">No collections available.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {collections.map((c) => (
                <Button
                  key={c.id}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => addToCollection(c.id)}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCollectionDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}