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
  Loader2,
  Lock,
  BadgeCheck,
  HelpCircle,
} from "lucide-react";

type PurchaseType =
  | "book"
  | "note"
  | "subscription"
  | "writing"
  | "cart"
  | "exam"
  | null;

export default function UniversalPurchasePage({ id, item: passedItem, onNavigate }: any) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

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
      case "exam":
        return <BadgeCheck className="w-12 h-12 text-red-600" />;
      default:
        return <ShoppingBag className="w-12 h-12 text-gray-600" />;
    }
  };

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

  useEffect(() => {
    const type = localStorage.getItem("purchaseType");
    const idLocal = localStorage.getItem("purchaseId");
    const itemsLocal = JSON.parse(localStorage.getItem("purchaseItems") || "[]");

    if (!type && itemsLocal.length === 0) {
      toast.error("❌ No purchase context found. Start purchase again.");
      onNavigate("explore");
      return;
    }

    if (type !== "writing") {
      if (!idLocal && itemsLocal.length === 0) {
        toast.error("❌ No product selected for purchase.");
        onNavigate("explore");
      }
    }
  }, [onNavigate]);

  const getProductFromEntry = (entry: any) =>
    entry?.book ||
    entry?.note ||
    entry?.subscription ||
    entry?.writing_order ||
    entry?.product ||
    entry ||
    null;

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
          ? `https://e-book-backend-production.up.railway.app/api/books/${productId}`
          : type === "note"
            ? `https://e-book-backend-production.up.railway.app/api/notes/${productId}`
            : type === "subscription"
              ? `https://e-book-backend-production.up.railway.app/api/subscriptions/${productId}`
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
                const res = await axios.get(`https://e-book-backend-production.up.railway.app/api/ebooks/${entry.book_id}`);
                return { ...entry, book: res.data };
              }
              if (entry.note_id) {
                const res = await axios.get(`https://e-book-backend-production.up.railway.app/api/notes/${entry.note_id}`);
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

          if (single.book || single.note || single.exam || single.product) {
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
  }, []);

  const handleSuccess = async (result?: any) => {
    const token = getToken();

    if (result?.source === "subscription") {
      toast.success("Subscription activated!");
      window.dispatchEvent(new CustomEvent("subscription:updated"));
      onNavigate("user-dashboard");
      return;
    }

    if (!token) {
      toast.error("Login required");
      onNavigate("login");
      return;
    }

    try {
      if (result?.source === "writing") {
        localStorage.removeItem("pendingWritingOrder");
        localStorage.removeItem("purchaseType");
        localStorage.removeItem("purchaseId");

        toast.success("✍️ Writing order created!");
        onNavigate("user-dashboard");
        return;
      }

      if (result?.source === "purchase") {
        localStorage.removeItem("purchaseType");
        localStorage.removeItem("purchaseId");
        localStorage.removeItem("purchaseItems");
        localStorage.removeItem("cartItems");

        window.dispatchEvent(
          new CustomEvent("library:updated", {
            detail: {
              bookId: purchaseItems?.[0]?.id,
            },
          })
        );

        toast.success("Purchase completed!");

        setTimeout(() => {
          onNavigate("user-dashboard");
        }, 0);
      }
    } catch (err) {
      toast.error("Unexpected error. Please try again.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 text-lg font-medium text-gray-700">Loading purchase details</p>
      <p className="mt-2 text-gray-500">Please wait while we prepare your order...</p>
    </div>
  );

  if (!item) return (
    <div className="text-center p-8 max-w-md mx-auto">
      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
        <ShoppingBag className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-3">No Items Found</h3>
      <p className="text-gray-600 mb-8">
        Your cart appears to be empty or the item is no longer available.
      </p>
      <Button 
        onClick={() => onNavigate("explore")} 
        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl shadow-lg"
      >
        Continue Shopping
      </Button>
    </div>
  );

  const isCart = item?.type === "cart";
  const items = isCart ? item.items : [item];
  const product = getProductFromEntry(item);
  const totalAmount = isCart
    ? Number(item.total)
    : item.type === "writing"
      ? Number(item.total_price || item.price)
      : Number(product?.price || 0);

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto">
      <button 
        onClick={() => onNavigate("user-dashboard", "dashboard")} 
        className="mb-8 flex items-center gap-2 text-gray-600 hover:text-blue-700 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="hidden sm:inline font-medium">Back to Dashboard</span>
        <span className="sm:hidden font-medium">Back</span>
      </button>

      <div className="mb-10">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="text-center relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-blue-700">Review Items</p>
            <div className="absolute top-6 left-full w-16 h-1 bg-gradient-to-r from-blue-600 to-blue-100 -translate-y-1/2"></div>
          </div>
          <div className="text-center relative">
            <div className={`w-12 h-12 ${showPayment ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' : 'bg-gray-100 text-gray-400'} rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg transition-all duration-300`}>
              {showPayment ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-bold">2</span>}
            </div>
            <p className={`text-sm font-semibold ${showPayment ? 'text-blue-700' : 'text-gray-500'}`}>Payment</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="shadow-2xl border-0 overflow-hidden transition-all duration-300 hover:shadow-3xl">
            <div className="h-2 bg-gradient-to-r from-blue-900 via-blue-700 to-red-600" />
            <CardContent className="p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Summary</h2>
                <p className="text-gray-600">Review your items before payment</p>
              </div>

              <div className="space-y-6">
                {items.map((entry: any, i: number) => {
                  const p = getProductFromEntry(entry);
                  const itemType = entry.type || purchaseType;
                  
                  return (
                    <div 
                      key={i} 
                      className="flex items-start gap-6 pb-6 border-b last:border-none group hover:bg-blue-50/50 p-4 rounded-2xl transition-all duration-300"
                    >
                      <div className="w-24 h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-md border border-gray-200 flex-shrink-0">
                        {p.cover_url ? (
                          <img 
                            src={p.cover_url} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            alt={p.title}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <IconForType t={itemType} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900">{p.title}</h3>
                              {itemType === "book" && (
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Book</span>
                              )}
                              {itemType === "note" && (
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">Note</span>
                              )}
                              {itemType === "writing" && (
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Writing Service</span>
                              )}
                              {itemType === "exam" && (
                                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Exam</span>
                              )}
                            </div>
                            {p.description && (
                              <p className="text-gray-600 line-clamp-2 mb-3">{p.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-red-600">₹{p.price || p.total_price}</p>
                            {p.original_price && p.original_price > (p.price || p.total_price) && (
                              <p className="text-sm text-gray-500 line-through">₹{p.original_price}</p>
                            )}
                          </div>
                        </div>
                        
                        {p.author && (
                          <p className="text-gray-700 mb-2">
                            <span className="font-medium">Author:</span> {p.author}
                          </p>
                        )}
                        
                        {p.pages && (
                          <p className="text-gray-700">
                            <span className="font-medium">Pages:</span> {p.pages}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-8">
                  <h3 className="font-bold text-xl text-blue-900 mb-6 flex items-center gap-3">
                    <CheckCircle2 className="w-7 h-7" /> What's Included
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Instant Access</p>
                        <p className="text-sm text-gray-600">Download immediately</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Secure Delivery</p>
                        <p className="text-sm text-gray-600">Protected transfer</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BadgeCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Quality Guarantee</p>
                        <p className="text-sm text-gray-600">High-quality content</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <HelpCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">24/7 Support</p>
                        <p className="text-sm text-gray-600">Always here to help</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                      <Shield className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">Secure & Trusted Checkout</p>
                      <p className="text-gray-600">Your payment information is encrypted and protected</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-700">SSL Secured</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-24">
          <Card className="shadow-2xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800">
              <CardTitle className="text-2xl text-white flex items-center gap-3">
                <CreditCard className="w-7 h-7" /> Payment Summary
              </CardTitle>
            </CardHeader>

            <CardContent className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{totalAmount}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Processing Fee</span>
                  <span className="font-semibold text-green-600">₹0</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold">₹0</span>
                </div>
                <div className="pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-blue-900">₹{totalAmount}</span>
                  </div>
                  {totalAmount > 1000 && (
                    <p className="text-sm text-green-600 mt-2">
                      🎉 You're saving on bulk purchase!
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-red-700 text-white p-8 rounded-2xl shadow-xl text-center">
                <div className="mb-4">
                  <div className="text-sm opacity-90">Amount to Pay</div>
                  <div className="text-5xl font-bold mt-2 tracking-tight">₹{totalAmount}</div>
                </div>
                <div className="text-xs opacity-80 mt-4">
                  All prices include applicable taxes
                </div>
              </div>

              <Button 
                onClick={() => setShowPayment(true)} 
                className="w-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white py-5 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <CreditCard className="w-6 h-6 mr-3" />
                Pay ₹{totalAmount}
              </Button>

              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-gray-100">
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <Shield className="w-5 h-5 text-green-600 mb-2" />
                  <span className="text-xs font-semibold text-gray-700">Secure</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <Lock className="w-5 h-5 text-blue-600 mb-2" />
                  <span className="text-xs font-semibold text-gray-700">Encrypted</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <BadgeCheck className="w-5 h-5 text-purple-600 mb-2" />
                  <span className="text-xs font-semibold text-gray-700">Guaranteed</span>
                </div>
              </div>

              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                  🔒 Your payment is secured with 256-bit encryption
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 mb-2">
          By completing your purchase, you agree to our{" "}
          <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">Terms of Service</a>
          {" "}and{" "}
          <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">Privacy Policy</a>
        </p>
        <p className="text-sm text-gray-500">
          Need help?{" "}
          <a href="#" className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1 mt-2">
            <HelpCircle className="w-4 h-4" /> Contact Support
          </a>
        </p>
      </div>

      <PaymentModal
        open={showPayment}
        item={item}
        onSuccess={handleSuccess}
        onClose={() => {
          setShowPayment(false);
          onNavigate("user-dashboard", "dashboard");
        }}
      />
    </div>
  );
}