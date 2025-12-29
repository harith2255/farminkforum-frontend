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

export default function UniversalPurchasePage({ id, item: passedItem, onNavigate }: any) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);


  // read afresh from localStorage - avoid stale closure values

  const purchaseType: PurchaseType =
  (localStorage.getItem("purchaseType") as PurchaseType) || null;

const purchaseItems =
  purchaseType === "writing"
    ? []
    : JSON.parse(
        localStorage.getItem("purchaseItems") ||
          localStorage.getItem("cartItems") ||
          "[]"
      );

const purchaseId = localStorage.getItem("purchaseId");

  

  const getToken = () => {
    const session = JSON.parse(localStorage.getItem("session") || "{}");
    return session.access_token || localStorage.getItem("token");
  };
if (purchaseType && purchaseId && purchaseItems.length === 0) {
  localStorage.setItem(
    "purchaseItems",
    JSON.stringify([{ id: purchaseId, type: purchaseType }])
  );
}

  // ICON MAP
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

  // Load writing order passed through navigation (if any)
  useEffect(() => {
    if (passedItem && passedItem.type === "writing" && passedItem.writing_order) {
      setItem({
        type: "writing",
        ...passedItem.writing_order,
      });
      setLoading(false);
      return;
    }
  }, [passedItem]);

  // VALIDATION BEFORE ANY FETCH
useEffect(() => {
  // 🛑 DO NOTHING AFTER SUCCESS

  const type = localStorage.getItem("purchaseType");
  const idLocal = localStorage.getItem("purchaseId");
  const itemsLocal = JSON.parse(localStorage.getItem("purchaseItems") || "[]");

  if (!type && itemsLocal.length === 0) {
    toast.error("❌ No purchase context found. Start purchase again.");
    onNavigate("explore");
    return;
  }

  // Skip validation for writing purchases
  if (type !== "writing") {
    if (!idLocal && itemsLocal.length === 0) {
      toast.error("❌ No product selected for purchase.");
      onNavigate("explore");
    }
  }
}, [onNavigate]);


  // PRODUCT EXTRACTOR
  const getProductFromEntry = (entry: any) =>
    entry?.book ||
    entry?.note ||
    entry?.subscription ||
    entry?.writing_order ||
    entry?.product ||
    entry ||
    null;

  // FETCH PRODUCT BY ID (books/notes/subscriptions)
  const fetchProductById = async (type: PurchaseType, productId: string | null) => {
    if (!type || !productId) {
      toast.error("Invalid purchase information");
      return null;
    }
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
      const res = await axios.get(url, { headers });
      return res.data;
    } catch (e: any) {
      console.error("fetchProductById error:", e);
      if (e.response?.status === 401) {
        toast.error("Login required");
        onNavigate("login");
      }
      return null;
    }
  };

  // MAIN LOADER
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
                const res = await axios.get(`https://ebook-backend-lxce.onrender.com/api/ebooks/${entry.book_id}`);
                return { ...entry, book: res.data };
              }
              if (entry.note_id) {
                const res = await axios.get(`https://ebook-backend-lxce.onrender.com/api/notes/${entry.note_id}`);
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
            if (!cancelled) setItem({ ...getProductFromEntry(single), type: purchaseType });
            return;
          }

          if (single.id) {
            const fetched = await fetchProductById(purchaseType, String(single.id));
            if (!cancelled && fetched) setItem({ ...fetched, type: purchaseType });
            return;
          }
        }

        const effectiveId = purchaseId || id;

       if (purchaseType === "writing") {
  const pending = JSON.parse(localStorage.getItem("pendingWritingOrder") || "{}");

  if (!pending?.total_price) {
    toast.error("Writing order data missing. Start again.");
    onNavigate("writing");
    return;
  }

  // REQUIRED FIX: Mark type = writing so PaymentModal detects correctly
  setItem({
    ...pending,
    type: "writing",
  });

  setLoading(false);
  return;
}


       toast.error("❌ No purchase data found. Please select an item again.");
onNavigate("explore");
return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  /* ------------------------------
     PAYMENT SUCCESS HANDLER (UPDATED)
     - This handler now accepts an optional `result` argument from PaymentModal.
     - PaymentModal will call onSuccess({ source: 'writing'|'purchase', ... })
     - If called without arg, we keep legacy behavior but avoid re-sending verification.
  -------------------------------*/
const handleSuccess = async (result?: any) => {
  const token = getToken();

  /* ================================
     ✅ SUBSCRIPTION SUCCESS
  ================================= */
  if (result?.source === "subscription") {
  toast.success("Subscription activated!");

  window.dispatchEvent(new CustomEvent("subscription:updated"));

  onNavigate("user-dashboard");
  return;
}


  /* ================================
     ❌ AUTH GUARD
  ================================= */
  if (!token) {
    toast.error("Login required");
    onNavigate("login");
    return;
  }

  try {
    /* ================================
       ✍️ WRITING
    ================================= */
    if (result?.source === "writing") {
      localStorage.removeItem("pendingWritingOrder");
      localStorage.removeItem("purchaseType");
      localStorage.removeItem("purchaseId");

      toast.success("✍️ Writing order created!");
    
      onNavigate("user-dashboard");
      return;
    }

    /* ================================
       📦 NORMAL PURCHASE
    ================================= */
    if (result?.source === "purchase") {
      localStorage.removeItem("purchaseType");
      localStorage.removeItem("purchaseId");
      localStorage.removeItem("purchaseItems");
      localStorage.removeItem("cartItems");

  // 🔥 fire event with book id BEFORE navigation
window.dispatchEvent(
  new CustomEvent("library:updated", {
    detail: {
      bookId: purchaseItems?.[0]?.id,
    },
  })
);

toast.success("Purchase completed!");

// ⏳ allow listeners to react before unmount
setTimeout(() => {
  onNavigate("user-dashboard");
}, 0);

    }
  } catch (err) {
    toast.error("Unexpected error. Please try again.");
  }
};




  if (loading) return <p className="text-center p-6">Loading...</p>;
  if (!item) return <p className="text-center p-6 text-red-500">Item not found.</p>;

  const isCart = item?.type === "cart";
  const items = isCart ? item.items : [item];
  const product = getProductFromEntry(item);
  const totalAmount = isCart
    ? Number(item.total)
    : item.type === "writing"
    ? Number(item.total_price || item.price)
    : Number(product?.price || 0);

  return (
    <div className="px-4 py-8 max-w-5xl mx-auto">
      <button onClick={() => onNavigate("user-dashboard","dashboard")} className="mb-6 flex items-center gap-2 text-gray-600">
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
                  <div key={i} className="flex items-start gap-4 pb-6 border-b last:border-none">
                    <div className="w-20 h-28 bg-gray-100 rounded-lg overflow-hidden">
                      {p.cover_url ? <img src={p.cover_url} className="w-full h-full object-cover" /> : <IconForType t={p.type} />}
                    </div>

                    <div className="flex-1">
                      <h1 className="text-xl font-bold text-blue-900">{p.title}</h1>
                      <p className="text-red-600 font-semibold text-lg">₹{p.price || p.total_price}</p>
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
                  <p className="text-sm text-gray-600">Your payment info is safe</p>
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

              <Button onClick={() => setShowPayment(true)} className="w-full bg-red-600 hover:bg-red-700 text-white py-4">
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
  onClose={() => {
  setShowPayment(false);
  onNavigate("user-dashboard", "dashboard");
; // 🔥 correct
}}

/>
    </div>
  );
}