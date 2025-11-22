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
import * as React from "react";

export default function PurchasePage({ onNavigate }: any) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [email, setEmail] = useState("");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [format, setFormat] = useState("PDF");

  /* -----------------------------
     Load Purchase Data
  ----------------------------- */
  const purchaseType = localStorage.getItem("purchaseType");
  const purchaseId = localStorage.getItem("purchaseId");

  useEffect(() => {
    const fetchItem = async () => {
      try {
        if (!purchaseType || !purchaseId) {
          setLoading(false);
          return;
        }

        /* ---- BOOK PURCHASE ---- */
        if (purchaseType === "book") {
          const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/content?type=books");
          const found = res.data.contents.find((b: any) => b.id == purchaseId);

          if (!found) throw new Error("Book not found");

          setItem({ ...found, type: "book" });
        }

        /* ---- NOTE PURCHASE ---- */
        if (purchaseType === "note") {
          const res = await axios.get(
            `https://ebook-backend-lxce.onrender.com/api/notes/${purchaseId}`
          );
          if (!res.data) throw new Error("Note not found");

          setItem({ ...res.data, type: "note" });
        }

        /* ---- SUBSCRIPTION PURCHASE ---- */
        if (purchaseType === "subscription") {
          const res = await axios.get(
            "https://ebook-backend-lxce.onrender.com/api/subscriptions/plans"
          );
          const found = res.data.find((p: any) => p.id == purchaseId);

          if (!found) throw new Error("Subscription not found");

          setItem({ ...found, type: "subscription" });
        }
      } catch (err) {
        console.error("Failed to load purchase item:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [purchaseId, purchaseType]);

  /* -----------------------------
     PAYMENT SUCCESS HANDLER
  ----------------------------- */
  const handleSuccess = async () => {
    const session = JSON.parse(localStorage.getItem("session") || "{}");
    const token = session?.access_token || localStorage.getItem("token");

    if (!token) {
      toast.error("Login required");
      onNavigate("login");
      return;
    }

    try {
      /* ---- BOOK ---- */
      if (item.type === "book") {
        await axios.post(
          "https://ebook-backend-lxce.onrender.com/api/purchase",
          { bookId: item.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Auto add to library (safe fallback)
      }

      /* ---- NOTE ---- */
      if (item.type === "note") {
        await axios.post(
          "https://ebook-backend-lxce.onrender.com/api/notes/purchase",
          { noteId: item.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      /* ---- SUBSCRIPTIONS ---- */
      if (item.type === "subscription") {
        await axios.post(
          "https://ebook-backend-lxce.onrender.com/api/subscriptions/upgrade",
          { planId: item.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        localStorage.setItem("refreshSubscription", "true");
      }

      // Cleanup
      localStorage.removeItem("purchaseId");
      localStorage.removeItem("purchaseType");

      toast.success("Payment successful!");

      window.history.pushState({}, "", "/user-dashboard");
      onNavigate("user-dashboard");
    } catch (err: any) {
      console.error("Payment error:", err);
      const msg = err?.response?.data?.error || err.message;
      toast.error(`Payment failed: ${msg}`);
    }
  };

  const applyCoupon = () => {
    // Implement coupon logic here
  };

  /* -----------------------------
     UI
  ----------------------------- */
  if (loading)
    return <p className="text-center p-6">Loading...</p>;

  if (!item)
    return (
      <p className="text-center p-6 text-red-500">
        Item not found or removed.
      </p>
    );

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => onNavigate("user-dashboard")}
        className="flex items-center gap-2 text-[#1d4d6a]"
      >
        ← Back to Dashboard
      </Button>

      {/* Purchase Card */}
      <Card className="shadow-xl border border-gray-100 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-3xl font-bold text-[#1d4d6a]">
            Checkout
          </CardTitle>
          <CardDescription className="text-gray-500">
            Complete your secure payment
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          {/* Item Banner */}
          <div className="bg-[#f7f9fc] p-5 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <Badge className="bg-blue-100 text-blue-700 capitalize px-3 py-1">
                {item.type}
              </Badge>

              {/* Price + Discount */}
              <div className="text-right">
                {item.originalPrice && (
                  <p className="line-through text-gray-400 text-sm">₹{item.originalPrice}</p>
                )}
                <span className="text-[#bf2026] font-bold text-xl">₹{item.price}</span>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-[#1d4d6a] mt-4 leading-tight">
              {item.title}
            </h2>

            {item.author && (
              <p className="text-sm text-gray-500 mt-1">By {item.author}</p>
            )}

            {/* Format selection */}
            <div className="mt-4 space-y-2">
              <label className="text-sm text-gray-600 font-medium">Select Format</label>
              <select
                className="w-full p-2 border rounded-lg"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                <option value="PDF">PDF</option>
                <option value="EPUB">EPUB</option>
                <option value="KINDLE">KINDLE</option>
              </select>
            </div>
          </div>

          {/* Email Input for Delivery */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600">Your Email (Delivery)</label>
            <input
              type="email"
              className="w-full p-3 border rounded-xl"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Promo Code */}
          <div className="flex gap-2">
            <input
              className="flex-1 p-3 border rounded-xl"
              placeholder="Enter Promo Code"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
            />
            <Button className="bg-gray-200 hover:bg-gray-300" onClick={applyCoupon}>
              Apply
            </Button>
          </div>

          {/* Summary Section */}
          <div className="bg-gray-50 p-4 rounded-xl border">
            <h3 className="font-semibold text-[#1d4d6a] mb-2">Order Summary</h3>
            <div className="flex justify-between text-gray-600">
              <span>Price</span>
              <span>₹{item.price}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600 mt-1">
                <span>Discount</span>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[#1d4d6a] mt-2 border-t pt-2">
              <span>Total</span>
              <span>₹{item.price - discount}</span>
            </div>
          </div>

          {/* Payment CTA */}
          <Button
            className="w-full bg-[#bf2026] hover:bg-[#a81c21] text-white text-lg py-6 rounded-xl"
            onClick={() => setShowPayment(true)}
          >
            Proceed to Pay ₹{item.price - discount}
          </Button>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <PaymentModal
        open={showPayment}
        item={{ ...item, price: item.price - discount, format, email }}
        onSuccess={handleSuccess}
        onClose={() => setShowPayment(false)}
      />
    </div>
  );
}