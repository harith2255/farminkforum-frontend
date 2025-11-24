// -------------------------------------------------------------
//  PURCHASE PAGE (FULLY UPDATED — Supports WRITING ORDERS TOO)
// -------------------------------------------------------------

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import PaymentModal from "./paymentModal";
import { toast } from "sonner";
import {
  BookOpen,
  ShoppingCart,
  CreditCard,
  Shield,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import * as React from "react";

const FALLBACK_COVER = "/placeholder-cover.png";

export default function PurchasePage({ onNavigate }: any) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  const purchaseType = localStorage.getItem("purchaseType");
  const purchaseId = localStorage.getItem("purchaseId");

  // -------------------------------------------------------------
  // FETCH ITEM DETAILS BASED ON TYPE
  // -------------------------------------------------------------
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const session = JSON.parse(localStorage.getItem("session") || "{}");
        const token = session?.access_token || localStorage.getItem("token");

        // ───────────────────────────────────────────────
        // CART CHECKOUT
        // ───────────────────────────────────────────────
        if (purchaseType === "cart") {
          const stored = JSON.parse(localStorage.getItem("cartItems") || "[]");

          if (!Array.isArray(stored) || stored.length === 0)
            throw new Error("Cart empty");

          const enriched = await Promise.all(
            stored.map(async (c: any) => {
              if (c.book || c.note) return c;

              try {
                if (c.book_id) {
                  const res = await axios.get(
                    `https://ebook-backend-lxce.onrender.com/api/ebooks/${c.book_id}`
                  );
                  return { ...c, book: res.data };
                }
                if (c.note_id) {
                  const res = await axios.get(
                    `https://ebook-backend-lxce.onrender.com/api/notes/${c.note_id}`
                  );
                  return { ...c, note: res.data };
                }
              } catch {}
              return c;
            })
          );

          const total = enriched.reduce((sum: number, it: any) => {
            const price = it.book?.price || it.note?.price || 0;
            return sum + Number(price) * (it.quantity || 1);
          }, 0);

          setItem({ type: "cart", items: enriched, total });
          setLoading(false);
          return;
        }

        // ───────────────────────────────────────────────
        // SINGLE BOOK PURCHASE
        // ───────────────────────────────────────────────
        if (purchaseType === "book") {
          const res = await axios.get(
            "https://ebook-backend-lxce.onrender.com/api/content?type=books"
          );
          const found = res.data.contents?.find(
            (b: any) => String(b.id) === String(purchaseId)
          );
          if (!found) throw new Error("Book not found");

          setItem({ ...found, type: "book" });
          setLoading(false);
          return;
        }

        // ───────────────────────────────────────────────
        // NOTE PURCHASE
        // ───────────────────────────────────────────────
        if (purchaseType === "note") {
          const res = await axios.get(
            `https://ebook-backend-lxce.onrender.com/api/notes/${purchaseId}`
          );
          if (!res.data) throw new Error("Note not found");

          setItem({ ...res.data, type: "note" });
          setLoading(false);
          return;
        }

        // ───────────────────────────────────────────────
        // SUBSCRIPTION PURCHASE
        // ───────────────────────────────────────────────
        if (purchaseType === "subscription") {
          const res = await axios.get(
            "https://ebook-backend-lxce.onrender.com/api/subscriptions/plans"
          );
          const found = res.data?.find(
            (p: any) => String(p.id) === String(purchaseId)
          );
          if (!found) throw new Error("Subscription not found");

          setItem({ ...found, type: "subscription" });
          setLoading(false);
          return;
        }

        // ───────────────────────────────────────────────
        // WRITING ORDER PURCHASE
        // ───────────────────────────────────────────────
        if (purchaseType === "writing") {
          const res = await axios.get(
            `https://ebook-backend-lxce.onrender.com/api/writing/order/${purchaseId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (!res.data) throw new Error("Writing order not found");

          setItem({ ...res.data, type: "writing" });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Failed to load purchase item:", err);
        toast.error("Failed to load purchase info.");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [purchaseType, purchaseId]);

  // -------------------------------------------------------------
  // PAYMENT SUCCESS HANDLER
  // -------------------------------------------------------------
  const handleSuccess = async () => {
    const session = JSON.parse(localStorage.getItem("session") || "{}");
    const token = session?.access_token || localStorage.getItem("token");

    if (!token) {
      toast.error("Login required");
      onNavigate("login");
      return;
    }

    try {
      // BOOK
      if (item.type === "book") {
        await axios.post(
          "https://ebook-backend-lxce.onrender.com/api/purchase",
          { bookId: item.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // NOTE
      if (item.type === "note") {
        await axios.post(
          "https://ebook-backend-lxce.onrender.com/api/notes/purchase",
          { noteId: item.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // SUBSCRIPTION
      if (item.type === "subscription") {
        await axios.post(
          "https://ebook-backend-lxce.onrender.com/api/subscriptions/upgrade",
          { planId: item.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // WRITING ORDER
      if (item.type === "writing") {
        await axios.post(
          "https://ebook-backend-lxce.onrender.com/api/writing/checkout",
          { orderId: item.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // CART
      if (item.type === "cart") {
        for (const entry of item.items) {
          try {
            if (entry.book_id || entry.book?.id) {
              const bookId = entry.book_id || entry.book?.id;
              await axios.post(
                "https://ebook-backend-lxce.onrender.com/api/purchase",
                { bookId },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }

            if (entry.note_id || entry.note?.id) {
              const noteId = entry.note_id || entry.note?.id;
              await axios.post(
                "https://ebook-backend-lxce.onrender.com/api/notes/purchase",
                { noteId },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }

            if (entry.id) {
              await axios.delete(
                `https://ebook-backend-lxce.onrender.com/api/cart/${entry.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }
          } catch {}
        }
      }

      // CLEANUP
      localStorage.removeItem("purchaseType");
      localStorage.removeItem("purchaseId");
      localStorage.removeItem("cartItems");

      toast.success("Payment successful!");
      onNavigate("user-dashboard");
    } catch (err: any) {
      console.error("Payment error:", err);
      const msg = err?.response?.data?.error || err.message;
      toast.error(`Payment failed: ${msg}`);
    }
  };

  // -------------------------------------------------------------
  // LOADING / ERROR UI
  // -------------------------------------------------------------
  if (loading) return <p className="text-center p-6">Loading...</p>;
  if (!item)
    return (
      <p className="text-center p-6 text-red-500">
        Item not found or removed.
      </p>
    );

  // -------------------------------------------------------------
  // CART UI BLOCK
  // -------------------------------------------------------------
  if (item.type === "cart") {
    return (
      <div className="px-4 py-6 max-w-5xl mx-auto">
        <button
          onClick={() => onNavigate("user-dashboard")}
          className="mb-6 flex items-center gap-2 text-gray-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* CART LIST + SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CART ITEMS */}
          <div className="md:col-span-2 space-y-4">
            <Card className="shadow-lg border-none">
              <div className="p-6 bg-gradient-to-r from-blue-900 to-blue-700 text-white">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" />
                  Your Cart
                </h2>
                <p className="text-sm text-blue-100">
                  {item.items.length} items selected
                </p>
              </div>

              <CardContent className="p-6 space-y-4">
                {item.items.map((entry: any, idx: number) => {
                  const p = entry.book || entry.note || {};
                  const title =
                    p.title ||
                    (entry.book_id ? `Book ${entry.book_id}` : `Note ${entry.note_id}`);
                  const price = p.price || 0;

                  return (
                    <div
                      key={idx}
                      className="flex gap-4 border-b pb-4 last:border-none"
                    >
                      <div className="w-16 h-20 bg-blue-800 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-white" />
                      </div>

                      <div className="flex-1">
                        <h4 className="font-semibold">{title}</h4>
                        <p className="text-sm text-gray-500">
                          Quantity: {entry.quantity || 1}
                        </p>
                        <p className="text-red-600 font-semibold mt-2">₹{price}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* SUMMARY */}
          <div>
            <Card className="shadow-lg border-none sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl text-blue-900">
                  Order Summary
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{item.total}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-red-600 pt-2 border-t">
                    <span>Total</span>
                    <span>₹{item.total}</span>
                  </div>
                </div>

                <Button
                  onClick={() => setShowPayment(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Complete Purchase
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <PaymentModal
          open={showPayment}
          item={item}
          onSuccess={handleSuccess}
          onClose={() => setShowPayment(false)}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // SINGLE (BOOK, NOTE, SUBSCRIPTION, WRITING) DISPLAY LOGIC
  // -------------------------------------------------------------
  const displayTitle =
    item.type === "writing"
      ? item.title
      : item.title || item.name || "Untitled";

  const displayAuthor =
    item.type === "writing"
      ? `${item.academic_level} • ${item.subject_area}`
      : item.author || item.vendor || null;

  const displayPrice =
    item.type === "writing"
      ? item.total_price
      : item.price || item.amount || 0;

  const cover = item.cover_url || item.file_url || FALLBACK_COVER;

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      <button
        onClick={() => onNavigate("user-dashboard")}
        className="mb-6 flex items-center gap-2 text-gray-600"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid md:grid-cols-3 gap-6">
        {/* LEFT SIDE: ITEM INFO */}
        <div className="md:col-span-2">
          <Card className="shadow-xl border-none">
            <div className="h-3 bg-gradient-to-r from-blue-900 via-blue-700 to-red-600"></div>

            <CardContent className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-24 h-32 rounded-lg overflow-hidden shadow-lg">
                  <img src={cover} alt={displayTitle} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1">
                  <span className="inline-block bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-semibold mb-3 capitalize">
                    {item.type}
                  </span>

                  <h1 className="text-3xl font-bold text-blue-900 mb-2">
                    {displayTitle}
                  </h1>

                  {displayAuthor && (
                    <p className="text-gray-600 text-lg">by {displayAuthor}</p>
                  )}
                </div>
              </div>

              {/* WRITING SERVICE EXTRA DETAILS */}
              {item.type === "writing" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <p><strong>Academic Level:</strong> {item.academic_level}</p>
                  <p><strong>Subject Area:</strong> {item.subject_area}</p>
                  <p><strong>Pages:</strong> {item.pages}</p>
                  <p><strong>Deadline:</strong> {item.deadline}</p>

                  {item.instructions && (
                    <p className="mt-2">
                      <strong>Instructions:</strong> {item.instructions}
                    </p>
                  )}

                  {item.attachments_url && (
                    <a
                      href={item.attachments_url}
                      target="_blank"
                      className="text-blue-700 underline block mt-2"
                    >
                      View Attached File
                    </a>
                  )}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  What's Included
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                    Instant digital access
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                    Secure content delivery
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>
                    Customer support included
                  </li>
                </ul>
              </div>

              <div className="flex items-center gap-4">
                <Shield className="w-12 h-12 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">Secure Checkout</p>
                  <p className="text-sm text-gray-600">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SIDE: PAYMENT */}
        <div>
          <Card className="shadow-xl border-none sticky top-24">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-xl text-blue-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              <div className="bg-blue-900 text-white p-6 rounded-xl shadow-lg">
                <p className="text-sm opacity-90 mb-1">Total Amount</p>
                <p className="text-4xl font-bold">₹{displayPrice}</p>
                <p className="text-xs opacity-75 mt-2">One-time payment</p>
              </div>

              <Button
                onClick={() => setShowPayment(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg shadow-lg"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pay ₹{displayPrice}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <PaymentModal
        open={showPayment}
        item={item}
        onSuccess={handleSuccess}
        onClose={() => setShowPayment(false)}
      />
    </div>
  );
}