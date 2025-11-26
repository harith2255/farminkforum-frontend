// UniversalPurchasePage.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "./ui/card";
import { Button } from "./ui/button";
import PaymentModal from "./paymentModal";
import { toast } from "sonner";
import {
  BookOpen,
  ShoppingCart,
  CreditCard,
  Shield,
  CheckCircle2,
  FileText,
  Crown,
  PenTool,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";

type PurchaseType = "book" | "note" | "subscription" | "writing" | "cart" | null;

export default function UniversalPurchasePage({ onNavigate }: any) {
  const [item, setItem] = useState<any>(null); // item can be single product or { type: "cart", items: [], total }
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);

  // read purchase meta (saved by CartPage / Buy Now)
  const purchaseType: PurchaseType = (localStorage.getItem("purchaseType") as PurchaseType) || null;
  const rawPurchaseItems = localStorage.getItem("purchaseItems") || localStorage.getItem("cartItems") || "[]";
  const purchaseItems = JSON.parse(rawPurchaseItems || "[]");
  const purchaseId = localStorage.getItem("purchaseId");

  // helper icons
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

  const handleBack = () => {
  const prev = localStorage.getItem("previousSection") || "notes";

  // Go back using your manual routing system
  onNavigate(prev);

  // Update URL again
  window.history.pushState({}, "", `/user-dashboard/${prev}`);
};


  // get product object from an entry that may be { book, note, product, book_id, note_id, id }
  const getProductFromEntry = (entry: any) => entry?.book || entry?.note || entry?.product || null;

  useEffect(() => {
    let cancelled = false;

    const fetchProductById = async (type: PurchaseType, id: string | null) => {
      if (!id) return null;
      try {
        if (type === "book") {
          const res = await axios.get(`https://ebook-backend-lxce.onrender.com/api/books/${id}`);
          return res.data;
        } else if (type === "note") {
          const res = await axios.get(`https://ebook-backend-lxce.onrender.com/api/notes/${id}`);
          return res.data;
        } else if (type === "subscription") {
          const res = await axios.get(`https://ebook-backend-lxce.onrender.com/api/subscriptions/plans`);
          return res.data?.find((p: any) => String(p.id) === String(id)) || null;
        } else if (type === "writing") {
          const session = JSON.parse(localStorage.getItem("session") || "{}");
          const token = session?.access_token || localStorage.getItem("token");
          const res = await axios.get(`https://ebook-backend-lxce.onrender.com/api/writing/order/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          return res.data;
        }
      } catch (e) {
        console.error("Failed to fetch product by id:", e);
      }
      return null;
    };

    const load = async () => {
      setLoading(true);
      try {
        // If cart checkout (multiple items)
        if (purchaseType === "cart") {
          // purchaseItems might already be cart items (enriched) or simple { id, product }
          const stored = Array.isArray(purchaseItems) ? purchaseItems : [];

          // Enrich entries that aren't already enriched
          const enriched = await Promise.all(
            stored.map(async (entry: any) => {
              // if already has product object, keep it
              if (entry.book || entry.note || entry.product) return entry;

              // If entry has book_id or note_id fetch detail
              if (entry.book_id) {
                try {
                  const res = await axios.get(`https://ebook-backend-lxce.onrender.com/api/ebooks/${entry.book_id}`);
                  return { ...entry, book: res.data };
                } catch (e) {
                  return entry;
                }
              }
              if (entry.note_id) {
                try {
                  const res = await axios.get(`https://ebook-backend-lxce.onrender.com/api/notes/${entry.note_id}`);
                  return { ...entry, note: res.data };
                } catch (e) {
                  return entry;
                }
              }
              // fallback: if entry.id possibly an item id referencing cart — return as is
              return entry;
            })
          );

          // compute total
          const total = enriched.reduce((sum: number, it: any) => {
            const p = getProductFromEntry(it);
            const price = Number(p?.price || 0);
            return sum + price;
          }, 0);

          if (!cancelled) setItem({ type: "cart", items: enriched, total });
          return;
        }

        // If purchaseItems already contains a single product (from Buy Now), use it
        if (Array.isArray(purchaseItems) && purchaseItems.length === 1) {
          const single = purchaseItems[0];
          // If it's already enriched product object
          if (single.product || single.book || single.note) {
            const p = single.product || single.book || single.note;
            if (!cancelled) setItem({ ...p, type: purchaseType || "book" });
            return;
          }
          // else if it contains id + type fallback to fetch
          if (single.id) {
            const fetched = await fetchProductById(purchaseType, String(single.id));
            if (fetched && !cancelled) setItem({ ...fetched, type: purchaseType || "book" });
            return;
          }
        }

        // If single product id available via purchaseId, fetch it
        if (purchaseType && purchaseId) {
          const fetched = await fetchProductById(purchaseType, purchaseId);
          if (fetched && !cancelled) setItem({ ...fetched, type: purchaseType });
          return;
        }

        // Fallback: nothing to buy -> show helpful message
        throw new Error("No purchase data found. Start checkout from cart or product page.");
      } catch (err: any) {
        console.error("Purchase load failed:", err);
        toast.error(err?.message || "Failed to load purchase item.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount (reads localStorage)

  // Unified success handler (keeps your previous behavior)
  const handleSuccess = async () => {
    const session = JSON.parse(localStorage.getItem("session") || "{}");
    const token = session?.access_token || localStorage.getItem("token");

    if (!token) {
      toast.error("Login required");
      navigate("login");;
      return;
    }

    try {
      if (!item) throw new Error("No item to purchase");

      if (item.type === "book") {
        await axios.post("https://ebook-backend-lxce.onrender.com/api/purchase", { bookId: item.id }, { headers: { Authorization: `Bearer ${token}` } });
      } else if (item.type === "note") {
        await axios.post("https://ebook-backend-lxce.onrender.com/api/notes/purchase", { noteId: item.id }, { headers: { Authorization: `Bearer ${token}` } });
      } else if (item.type === "subscription") {
        await axios.post("https://ebook-backend-lxce.onrender.com/api/subscriptions/upgrade", { planId: item.id }, { headers: { Authorization: `Bearer ${token}` } });
      } else if (item.type === "writing") {
        await axios.post("https://ebook-backend-lxce.onrender.com/api/writing/checkout", { orderId: item.id }, { headers: { Authorization: `Bearer ${token}` } });
      } else if (item.type === "cart") {
        const ops = item.items.map(async (entry: any) => {
          try {
            const p = getProductFromEntry(entry);
            if (entry.book_id || p?.id) {
              const bookId = entry.book_id || p?.id;
              await axios.post("https://ebook-backend-lxce.onrender.com/api/purchase", { bookId }, { headers: { Authorization: `Bearer ${token}` } });
            }
            if (entry.note_id || (p && p.id && entry.note)) {
              const noteId = entry.note_id || (entry.note && entry.note.id);
              if (noteId) {
                await axios.post("https://ebook-backend-lxce.onrender.com/api/notes/purchase", { noteId }, { headers: { Authorization: `Bearer ${token}` } });
              }
            }
            if (entry.id) {
              // server side cart id -> delete
              await axios.delete(`https://ebook-backend-lxce.onrender.com/api/cart/${entry.id}`, { headers: { Authorization: `Bearer ${token}` } });
            }
            return { ok: true };
          } catch (e: any) {
            console.error("Cart entry purchase failed:", e?.response?.data || e.message || e);
            return { ok: false, error: e };
          }
        });

        const results = await Promise.all(ops);
        const failed = results.filter((r: any) => !r.ok);
        if (failed.length === item.items.length) {
          throw new Error("All cart purchases failed");
        }
        if (failed.length > 0) {
          toast.success("Payment succeeded for some items; others failed — check orders.");
        }
      }

      // cleanup local keys used for checkout
      localStorage.removeItem("purchaseType");
      localStorage.removeItem("purchaseId");
      localStorage.removeItem("purchaseItems");
      localStorage.removeItem("cartItems");

      toast.success("Payment successful");
      onNavigate("user-dashboard");
    } catch (err: any) {
      console.error("Payment error:", err);
      const msg = err?.response?.data?.error || err.message || "Unknown";
      toast.error(`Payment failed: ${msg}`);
    }
  };
  useEffect(() => {
  const handleBack = () => {
    const prev = localStorage.getItem("previousSection") || "notes";

    // navigate back via manual routing
    onNavigate(prev);

    // update URL to reflect previous page
    window.history.pushState({}, "", `/user-dashboard/${prev}`);
  };

  const onPop = () => {
    handleBack();
  };

  window.addEventListener("popstate", onPop);
  return () => window.removeEventListener("popstate", onPop);
}, []);


  // RENDER single unified UI (cart or single)
  const renderUnifiedPurchaseView = () => {
    const isCart = item?.type === "cart";
    const items = isCart ? item.items : [item];
    // compute total amount safely
    const totalAmount = isCart
      ? Number(item.total || items.reduce((s: number, it: any) => {
          const p = getProductFromEntry(it) || it;
          return s + Number(p?.price || 0);
        }, 0))
      : Number(item.price || item.amount || item.total_price || 0);

    return (
      <div className="px-4 py-8 max-w-5xl mx-auto">
        <button onClick={() => onNavigate("user-dashboard")} className="mb-6 flex items-center gap-2 text-gray-600">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="shadow-xl border-none">
              <div className="h-3 bg-gradient-to-r from-blue-900 via-blue-700 to-red-600" />
              <CardContent className="p-8">
                {isCart ? (
                  <div className="space-y-6">
                    {items.map((entry: any, i: number) => {
                      const p = getProductFromEntry(entry) || entry;
                      const cover = p?.cover_url || p?.file_url || null;
                      const typeIcon = p?.type || (entry.book ? "book" : entry.note ? "note" : "subscription");
                      return (
                        <div key={i} className="flex items-start gap-4 pb-6 border-b last:border-none">
                          <div className="w-20 h-28 rounded-lg overflow-hidden bg-gray-100 shadow flex items-center justify-center">
                            {cover ? (
                              <img src={cover} alt={p.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="p-2">
                                <IconForType t={typeIcon as PurchaseType} />
                              </div>
                            )}
                          </div>
                          

                          <div className="flex-1">
                            <h1 className="text-xl font-bold text-blue-900">{p.title || p.name || "Untitled"}</h1>
                            {p.author && <p className="text-gray-600 text-sm mb-2">by {p.author}</p>}
                            <p className="text-red-600 font-semibold text-lg">₹{Number(p.price || 0)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-24 h-32 rounded-lg overflow-hidden shadow-lg flex items-center justify-center bg-gray-100">
                        {item.type === "book" ? (
                          item.cover_url ? <img src={item.cover_url} alt={item.title} className="w-full h-full object-cover" /> : <BookOpen className="w-12 h-12 text-blue-600" />
                        ) : (
                          <IconForType t={item.type} />
                        )}
                      </div>

                      <div className="flex-1">
                        <span className="inline-block bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm font-semibold mb-3 capitalize">
                          {item.type}
                        </span>

                        <h1 className="text-3xl font-bold text-blue-900 mb-2">{item.title || item.name || "Untitled"}</h1>

                        {item.author && <p className="text-gray-600 text-lg">by {item.author}</p>}
                      </div>
                    </div>
                  </>
                )}

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> What's Included</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div> Instant digital access</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div> Secure content delivery</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div> Customer support included</li>
                  </ul>
                </div>

                <div className="flex items-center gap-4">
                  <Shield className="w-12 h-12 text-green-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Secure Checkout</p>
                    <p className="text-sm text-gray-600">Your payment information is encrypted and secure</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="shadow-xl border-none sticky top-24">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-xl text-blue-900 flex items-center gap-2"><CreditCard className="w-5 h-5" /> Payment Details</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                <div className="bg-blue-900 text-white p-6 rounded-xl shadow-lg">
                  <p className="text-sm opacity-90 mb-1">Total Amount</p>
                  <p className="text-4xl font-bold">₹{Number(totalAmount)}</p>
                  <p className="text-xs opacity-75 mt-2">One-time payment</p>
                </div>

                <Button onClick={() => setShowPayment(true)} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-lg shadow-lg">
                  <CreditCard className="w-5 h-5 mr-2" /> Pay ₹{Number(totalAmount)}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <PaymentModal open={showPayment} item={item} onSuccess={handleSuccess} onClose={() => setShowPayment(false)} />
      </div>
    );
  };

  if (loading) return <p className="text-center p-6">Loading...</p>;
  if (!item) return <p className="text-center p-6 text-red-500">Item not found or removed.</p>;

  return renderUnifiedPurchaseView();
}