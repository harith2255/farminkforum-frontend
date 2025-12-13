// PaymentModal.jsx
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
        toast.error("Login expired. Please log in again.");
        setLoading(false);
        return;
      }

      /* ---------------------------------------------
         FIX #1 — Correctly detect writing type
      --------------------------------------------- */
      const itemType = item?.type || product?.type;

      if (itemType === "writing") {
        const pendingRaw = localStorage.getItem("pendingWritingOrder");
        if (!pendingRaw) {
          toast.error("No pending writing order found.");
          setLoading(false);
          return;
        }

        const payload = JSON.parse(pendingRaw);

        if (!payload.total_price || Number(payload.total_price) <= 0) {
          toast.error("Invalid writing order amount.");
          setLoading(false);
          return;
        }

        /* ---------------------------------------------
           Step 1: Verify payment (adds revenue + tx)
        --------------------------------------------- */
        const verifyRes = await fetch(`${apiBase}/api/writing/payments/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            order_temp_id: payload.id || null,
            amount: payload.total_price,
            method: "test-payment",
          }),
        });

        const verifyData = await verifyRes.json().catch(() => ({}));
        if (!verifyRes.ok) {
          toast.error(verifyData?.error || "Payment verification failed.");
          setLoading(false);
          return;
        }

        /* ---------------------------------------------
           Step 2: Create final writing order
        --------------------------------------------- */
        const createRes = await fetch(`${apiBase}/api/writing/order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...payload,
            attachments_url: payload.attachments_url || null,
            deadline: payload.deadline || null,
            total_price: payload.total_price,
            payment_success: true,
            order_temp_id: payload.id || null,
          }),
        });

        const createData = await createRes.json().catch(() => ({}));
        if (!createRes.ok) {
          toast.error(createData?.error || "Order creation failed.");
          setLoading(false);
          return;
        }

        /* ---------------------------------------------
           Step 3: Local cleanup — do NOT run unified purchase
        --------------------------------------------- */
        localStorage.removeItem("pendingWritingOrder");
        localStorage.removeItem("purchaseType");
        localStorage.removeItem("purchaseId");

        /* ---------------------------------------------
           Step 4: Success callback
        --------------------------------------------- */
        onSuccess &&
          onSuccess({
            source: "writing",
            order: createData.order ?? createData,
          });

        setLoading(false);
        onClose?.();
        return; // 🔥 EXIT — prevents unified purchase from running
      }

      /* ---------------------------------------------
         NORMAL PURCHASE FLOW (books/notes/cart)
      --------------------------------------------- */
      let purchaseItems = [];

      if (item?.type === "cart") {
        purchaseItems = (item.items || [])
          .map((i) => ({
            id: i.id ?? i.book_id ?? i.note_id,
            type: i.type ?? (i.book ? "book" : i.note ? "note" : null),
          }))
          .filter(Boolean);
      } else if (product?.id) {
        purchaseItems = [{ id: product.id, type: item.type }];
      } else {
        toast.error("Nothing to purchase.");
        setLoading(false);
        return;
      }

      if (!purchaseItems.length) {
        toast.error("No valid items to purchase.");
        setLoading(false);
        return;
      }

      const purchaseRes = await fetch(`${apiBase}/api/purchase/unified`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: purchaseItems }),
      });

      const purchaseData = await purchaseRes.json().catch(() => ({}));
      if (!purchaseRes.ok) {
        const msg =
          purchaseData?.error ||
          purchaseData?.errors?.[0]?.error ||
          "Purchase failed";
        toast.error(msg);
        setLoading(false);
        return;
      }

      onSuccess &&
        onSuccess({ source: "purchase", result: purchaseData, item });

      setLoading(false);
      onClose?.();
    } catch (err) {
      console.error("PaymentModal confirmPayment error:", err);
      toast.error("Unexpected error.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#1d4d6a]">Confirm Payment</DialogTitle>
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
            {loading && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
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