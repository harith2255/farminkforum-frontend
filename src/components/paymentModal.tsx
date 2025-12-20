// PaymentModal.jsx
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
 import axios from "axios";
export default function PaymentModal({ open, item, onClose, onSuccess }) {
  const [loading, setLoading] = React.useState(false);

  const product =
    item?.writing_order ||
    item?.book ||
    item?.note ||
    item?.subscription ||
    item?.product ||
    item ||
    {};

  const amount =
    product?.total_price ||
    item?.total_price ||
    product?.price ||
    product?.amount ||
    item?.total ||
    0;

  const title =
    item?.type === "cart"
      ? `${item.items?.length || 0} Items`
      : product?.title || product?.name || "Purchase";

  const apiBase = import.meta.env.VITE_API_URL || "https://ebook-backend-lxce.onrender.com";

  const confirmPayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Login expired. Please login again.");
        setLoading(false);
        return;
      }

      const itemType = item?.type || product?.type;

      /* =================================================
         ✍️ WRITING FLOW (UNCHANGED)
      ================================================= */
      if (itemType === "writing") {
        const pendingRaw = localStorage.getItem("pendingWritingOrder");
        if (!pendingRaw) {
          toast.error("No pending writing order found.");
          setLoading(false);
          return;
        }

        const payload = JSON.parse(pendingRaw);

        const verifyRes = await fetch(
          `${apiBase}/api/writing/payments/verify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
  order_temp_id: String(payload.id),     // MUST be non-null
  amount: Number(payload.total_price),   // MUST be number
  method: "test-payment"
})


          }
        );

        if (!verifyRes.ok) {
          toast.error("Payment verification failed");
          setLoading(false);
          return;
        }

        const createRes = await fetch(`${apiBase}/api/writing/order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...payload,
            payment_success: true,
            order_temp_id: payload.id || null,
          }),
        });

        if (!createRes.ok) {
          toast.error("Order creation failed");
          setLoading(false);
          return;
        }

        localStorage.removeItem("pendingWritingOrder");
        localStorage.removeItem("purchaseType");
        localStorage.removeItem("purchaseId");

        onSuccess?.({ source: "writing" });
        setLoading(false);
        onClose();
        return;
      }

      /* =================================================
         👑 SUBSCRIPTION FLOW (🔥 FIXED)
      ================================================= */
      if (itemType === "subscription") {
        const planId = product?.id || item?.id;

        if (!planId) {
          toast.error("Invalid subscription plan.");
          setLoading(false);
          return;
        }

       

const res = await axios.post(
  `${apiBase}/api/subscriptions/upgrade`,
  { planId },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    validateStatus: (status) => status < 500, // ⛔ prevent auto logout
  }
);

const data = res.data;

if (res.status !== 200) {
  toast.error(data?.error || "Subscription upgrade failed");
  setLoading(false);
  return;
}


        localStorage.removeItem("purchaseType");
        localStorage.removeItem("purchaseId");
        localStorage.removeItem("purchaseItems");

        onSuccess?.({
          source: "subscription",
          subscription: data.subscription || data,
        });

        setLoading(false);
        onClose();
        return;
      }

      /* =================================================
         📦 BOOK / NOTE / CART FLOW (UNCHANGED)
      ================================================= */
      let purchaseItems = [];

      if (item?.type === "cart") {
        purchaseItems = (item.items || [])
          .map((i) => ({
            id: i.id ?? i.book_id ?? i.note_id,
            type: i.type ?? (i.book ? "book" : i.note ? "note" : null),
          }))
          .filter(Boolean);
      }  else if (product?.id) {
  purchaseItems = [
    {
      id: product.id,
      type: item.type || product.type || "book",
    },
  ];
}


      if (!purchaseItems.length) {
        toast.error("Nothing to purchase.");
        setLoading(false);
        return;
      }

const purchaseRes = await axios.post(
  `${apiBase}/api/purchases/unified`,
  { items: purchaseItems },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    validateStatus: (s) => s < 500, // ⛔ never auto-logout
  }
);

if (purchaseRes.status !== 200 && purchaseRes.status !== 207) {
  toast.error(purchaseRes.data?.error || "Purchase failed");
  setLoading(false);
  return;
}

      onSuccess?.({ source: "purchase" });
      setLoading(false);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#1d4d6a]">
            Confirm Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg">
            <p className="font-semibold">{title}</p>
            <p className="text-sm capitalize">{item?.type}</p>
            <p className="font-bold mt-2">₹{amount}</p>
          </div>

          <Button
            className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white"
            onClick={confirmPayment}
            disabled={loading}
          >
            {loading && (
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
            )}
            Pay Now ₹{amount}
          </Button>

          <Button variant="outline" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}