// src/components/PurchasePage.tsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import PaymentModal from "./paymentModal";
import { toast } from "sonner";
import {
  BookOpen,
  CreditCard,
  Shield,
  CheckCircle2,
  FileText,
  Crown,
  PenTool,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";

type PurchaseType =
  | "book"
  | "note"
  | "subscription"
  | "writing"
  | "cart"
  | null;

export default function UniversalPurchasePage({ id, onNavigate }: any) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  const purchaseType: PurchaseType =
    (localStorage.getItem("purchaseType") as PurchaseType) || null;

  const rawPurchaseItems =
    localStorage.getItem("purchaseItems") ||
    localStorage.getItem("cartItems") ||
    "[]";

  const purchaseItems = JSON.parse(rawPurchaseItems || "[]");
  const purchaseId = localStorage.getItem("purchaseId");

  const getToken = () => {
    const session = JSON.parse(localStorage.getItem("session") || "{}");
    return session.access_token || localStorage.getItem("token");
  };

  // ---------------- ICON MAP ----------------
  const IconForType = ({ t }: { t: PurchaseType }) => {
    switch (t) {
      case "book":
        return <BookOpen className="w-12 h-12 text-blue-600" />;
      case "note":
        return <FileText className="w-12 h-12 text-amber-600" />;
      case "subscription":
        return <Crown className="w-12 h-12 text-purple-600" />;
      case "writing":
        return <PenTool className="w-12 h-12 text-green-600" />;
      default:
        return <ShoppingBag className="w-12 h-12 text-gray-600" />;
    }
  };

  // ---------------- VALIDATION BEFORE ANY FETCH ----------------
  useEffect(() => {
    const type = localStorage.getItem("purchaseType");
    const id = localStorage.getItem("purchaseId");
    const items = JSON.parse(localStorage.getItem("purchaseItems") || "[]");

    if (!type && items.length === 0) {
      toast.error("❌ No purchase context found. Start purchase again.");
      onNavigate("explore");
      return;
    }

    if (!id && items.length === 0) {
      toast.error("❌ No product selected for purchase.");
      onNavigate("explore");
      return;
    }
  }, []);

  // ---------------- PRODUCT EXTRACTOR ----------------
  const getProductFromEntry = (entry: any) =>
    entry?.book ||
    entry?.note ||
    entry?.subscription ||
    entry?.product ||
    entry ||
    null;

  // ---------------- FETCH PRODUCT BY ID ----------------
  const fetchProductById = async (
    type: PurchaseType,
    productId: string | null
  ) => {
    if (!type || !productId) {
      toast.error("Invalid purchase information");
      return null;
    }

    console.log("📦 Fetching product", { type, productId });

    try {
      const token = getToken();

      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const url =
        type === "book"
          ? `https://ebook-backend-lxce.onrender.com/api/books/${productId}`
          : type === "note"
          ? `https://ebook-backend-lxce.onrender.com/api/notes/${productId}`
          : type === "subscription"
          ? `https://ebook-backend-lxce.onrender.com/api/subscriptions/${productId}`
          : null;

      if (!url) {
        toast.error("Unsupported purchase type");
        return null;
      }

      console.log("🌐 Request URL:", url);
      console.log("🔑 Headers:", headers);

      const res = await axios.get(url, { headers });

      console.log("✅ Product fetched successfully:", res.data);

      return res.data;
    } catch (e: any) {
      console.error("❌ fetchProductById error:", {
        message: e.message,
        status: e.response?.status,
        backend: e.response?.data,
      });

      if (e.response?.status === 401 || e.response?.status === 403) {
        toast.error("Login required");
        onNavigate("login");
      }

      return null;
    }
  };
  const createWritingOrder = async () => {
  const payload = JSON.parse(localStorage.getItem("pendingWritingOrder"));
  if (!payload) return;

  const res = await fetch("https://ebook-backend-lxce.onrender.com/api/writing/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    toast.error("Order creation failed");
    return;
  }

  // clear temp save
  localStorage.removeItem("pendingWritingOrder");

  toast.success("Order placed successfully!");
};


  // ---------------- MAIN LOADER ----------------
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        if (purchaseType === "cart") {
          const enriched = await Promise.all(
            purchaseItems.map(async (entry: any) => {
              if (entry.book || entry.note) return entry;

              if (entry.book_id) {
                const res = await axios.get(
                  `https://ebook-backend-lxce.onrender.com/api/ebooks/${entry.book_id}`
                );
                return { ...entry, book: res.data };
              }
              if (entry.note_id) {
                const res = await axios.get(
                  `https://ebook-backend-lxce.onrender.com/api/notes/${entry.note_id}`
                );
                return { ...entry, note: res.data };
              }
              return entry;
            })
          );

          const total = enriched.reduce((sum: number, it: any) => {
            const p = getProductFromEntry(it);
            return sum + Number(p?.price || 0);
          }, 0);

          if (!cancelled) setItem({ type: "cart", items: enriched, total });
          return;
        }

        if (purchaseItems.length === 1) {
          const single = purchaseItems[0];

          if (single.book || single.note) {
            if (!cancelled)
              setItem({ ...getProductFromEntry(single), type: purchaseType });
            return;
          }

          if (single.id) {
            const fetched = await fetchProductById(
              purchaseType,
              String(single.id)
            );
            if (!cancelled && fetched)
              setItem({ ...fetched, type: purchaseType });
            return;
          }
        }

        const effectiveId = purchaseId || id;

        if (purchaseType === "writing") {
  const payload = JSON.parse(localStorage.getItem("pendingWritingOrder") || "{}");

  if (!payload || !payload.title) {
    toast.error("Writing order data missing. Start again.");
    onNavigate("user-dashboard");
    return;
  }

  // Convert local storage payload into UI item format
  if (!cancelled) {
    setItem({
      type: "writing",
      title: payload.title,
      price: payload.total_price,
      pages: payload.pages,
      subject: payload.subject_area,
      deadline: payload.deadline,
      instructions: payload.instructions,
      attachments_url: payload.attachments_url,
    });
  }

  setLoading(false);
  return;
}


        throw new Error("No purchase data found.");
      } catch (err) {
        console.error("Purchase load failed", err);
        toast.error("Failed to load item.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------------- PAYMENT SUCCESS ----------------
const handleSuccess = async () => {
  const token = getToken();

  if (!token) {
    toast.error("Login required");
    onNavigate("login");
    return;
  }

  try {
    if (!item) throw new Error("No item found");
    const headers = { Authorization: `Bearer ${token}` };

    // ⭐ 1) SUBSCRIPTIONS
    if (item.type === "subscription") {
      await axios.post(
        "https://ebook-backend-lxce.onrender.com/api/subscriptions/upgrade",
        { planId: item.id },
        { headers }
      );

      toast.success("Subscription upgraded!");
      localStorage.clear();
      onNavigate("user-dashboard");
      return;
    }

    // ⭐ 2) BOOKS / NOTES PURCHASE
    let purchaseData;
    if (item.type === "cart") {
      purchaseData = {
        items: item.items
          .map((entry) => {
            const p = getProductFromEntry(entry);
            if (!p?.id) return null;
            return { type: p.type || "book", id: p.id };
          })
          .filter(Boolean),
      };
    } else {
      purchaseData = { items: [{ type: item.type, id: item.id }] };
    }

    await axios.post(
      "https://ebook-backend-lxce.onrender.com/api/purchase/unified",
      purchaseData,
      { headers }
    );

    // ⭐ 3) WRITING ORDER CREATION
    const pendingWriting = localStorage.getItem("pendingWritingOrder");

    if (pendingWriting) {
      const writingPayload = JSON.parse(pendingWriting);

      await axios.post(
        "https://ebook-backend-lxce.onrender.com/api/writing/order",
        {
          ...writingPayload,
          payment_success: true,
          paid_at: new Date().toISOString(),
        },
        { headers }
      );

      localStorage.removeItem("pendingWritingOrder");
      toast.success("✍️ Writing order created successfully!");
    }

    // ⭐ 4) CLEAR PURCHASE CONTEXT
    localStorage.removeItem("purchaseType");
    localStorage.removeItem("purchaseId");
    localStorage.removeItem("purchaseItems");
    localStorage.removeItem("cartItems");

    window.dispatchEvent(new Event("refresh-library"));
    window.dispatchEvent(new Event("refresh-explore"));

    onNavigate("user-dashboard");
  } catch (err) {
    console.error("Payment error:", err);
    toast.error("Payment failed.");
  }
};


  if (loading) return <p className="text-center p-6">Loading...</p>;
  if (!item)
    return <p className="text-center p-6 text-red-500">Item not found.</p>;

  const isCart = item?.type === "cart";
  const items = isCart ? item.items : [item];
 const product = getProductFromEntry(item);
const totalAmount = isCart
  ? Number(item.total)
  : Number(product?.price || 0);

  return (
    <div className="px-4 py-8 max-w-5xl mx-auto">
      <button
        onClick={() => onNavigate("user-dashboard")}
        className="mb-6 flex items-center gap-2 text-gray-600"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="shadow-xl border-none">
            <div className="h-3 bg-gradient-to-r from-blue-900 via-blue-700 to-red-600" />
            <CardContent className="p-8">
              {items.map((entry: any, i: number) => {
                const p = getProductFromEntry(entry);
                return (
                  <div
                    key={i}
                    className="flex items-start gap-4 pb-6 border-b last:border-none"
                  >
                    <div className="w-20 h-28 bg-gray-100 rounded-lg overflow-hidden">
                      {p.cover_url ? (
                        <img
                          src={p.cover_url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <IconForType t={p.type} />
                      )}
                    </div>

                    <div className="flex-1">
                      <h1 className="text-xl font-bold text-blue-900">
                        {p.title}
                      </h1>
                      <p className="text-red-600 font-semibold text-lg">
                        ₹{p.price}
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mt-6">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> What's Included
                </h3>

                <ul className="space-y-2 text-gray-700">
                  <li>Instant access</li>
                  <li>Secure delivery</li>
                  <li>Customer support</li>
                </ul>
              </div>

              <div className="flex items-center gap-4 mt-6">
                <Shield className="w-12 h-12 text-green-600" />
                <div>
                  <p className="font-semibold text-gray-900">Secure Checkout</p>
                  <p className="text-sm text-gray-600">
                    Your payment info is safe
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-xl border-none sticky top-24">
            <CardHeader className="bg-gray-50">
              <CardTitle className="text-xl text-blue-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Payment
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              <div className="bg-blue-900 text-white p-6 rounded-xl shadow-lg">
                <p>Total Amount</p>
                <p className="text-4xl font-bold">₹{totalAmount}</p>
              </div>

              <Button
                onClick={() => setShowPayment(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-4"
              >
                Pay ₹{totalAmount}
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