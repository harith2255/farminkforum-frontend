// PaymentModal.jsx
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

declare global {
  interface Window {
    Razorpay: any;
  }
}

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

      /* ===================== ✍️ WRITING ===================== */
      let purchaseItems = [];

      if (itemType === "writing") {
        const pending = JSON.parse(
          localStorage.getItem("pendingWritingOrder") || "{}"
        );

        if (!pending || !pending.total_price || !pending.title) {
          toast.error("Invalid writing order");
          setLoading(false);
          return;
        }

        purchaseItems = [
          {
            type: "writing",
            payload: pending, // backend will create writing order
          },
        ];
      }
      else if (item?.type === "cart") {
        purchaseItems = (item.items || [])
          .map((i) => ({
            id: i.id ?? i.book_id ?? i.note_id,
            type: i.type ?? (i.book ? "book" : i.note ? "note" : null),
          }))
          .filter(Boolean);
      }
      else if (product?.id) {
        purchaseItems = [{ id: product.id, type: item.type }];
      }

      /* ===================== 🆓 FREE PRODUCT (₹0) ===================== */

      if (amount === 0 || Number(amount) === 0) {
        console.log("🆓 Free product detected, adding to library directly");

        try {
          const claimRes = await axios.post(
            `${apiBase}/api/library/claim-free`,
            { items: purchaseItems },
            { headers: { Authorization: `Bearer ${token}` } }
          );


          if (claimRes.status === 200) {
            toast.success("Added to your library!");
            onSuccess?.({ source: "free_claim" });
            onClose();
          } else {
            toast.error("Failed to add to library");
          }
        } catch (err) {
          console.error("Free claim error:", err);
          toast.error(err?.response?.data?.error || "Failed to add to library");
        } finally {
          setLoading(false);
        }
        return;
      }
          /* ===================== 📦 BOOK / NOTE / CART ===================== */


          // if (item?.type === "cart") {
          //   purchaseItems = (item.items || [])
          //     .map((i) => ({
          //       id: i.id ?? i.book_id ?? i.note_id,
          //       type: i.type ?? (i.book ? "book" : i.note ? "note" : null),
          //     }))
          //     .filter(Boolean);
          // } else if (product?.id) {
          //   purchaseItems = [{ id: product.id, type: item.type || "book" }];
          // }

          // if (!purchaseItems.length) {
          //   toast.error("Nothing to purchase.");
          //   setLoading(false);
          //   return;
          // }

          /* ===================== 💳 RAZORPAY ===================== */
          const orderRes = await axios.post(
            `${apiBase}/payments/razorpay/create-order`,
            { amount },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const order = orderRes.data;

          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: "INR",
            name: "Your App Name",
            description: title,
            order_id: order.id,

            prefill: {
              name: product?.author_name || "Customer",
              email: product?.author_email || "",
              contact: product?.author_phone || "",
            },
 method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },

        config: {
          display: {
            blocks: {
              banks: {
                name: "All payment methods",
                instruments: [
                  {
                    method: "card",
                    types: ["credit", "debit"],
                    issuers: ["HDFC", "ICICI", "SBI", "AXIS", "YES", "KOTAK"], // Domestic banks only
                  },
                  {
                    method: "upi",
                  },
                  {
                    method: "netbanking",
                  },
                ],
              },
            },
            preferences: {
              show_default_blocks: true,
            },
          },
        },

            handler: async (response) => {
              const verifyRes = await axios.post(
                `${apiBase}/payments/razorpay/verify`,
                { ...response, items: purchaseItems },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              if (verifyRes.status === 200 || verifyRes.status === 207) {

                onSuccess?.({ source: "purchase" });
                onClose();
              } else {
                toast.error("Payment verification failed");
              }
            },

            modal: {
              ondismiss: () => {
                toast.info("Payment cancelled");
                setLoading(false);
              },
            },

            theme: { color: "#bf2026" },
          };
          console.group("🧪 Razorpay Init Debug");
          console.log("Key:", import.meta.env.VITE_RAZORPAY_KEY_ID);
          console.log("Order object:", order);
          console.log("Order ID:", order?.id);
          console.log("Amount (paise):", order?.amount);
          console.log("Currency:", order?.currency);
          console.log("Title:", title);
          console.log("Items:", purchaseItems);
          console.groupEnd();

          new window.Razorpay(options).open();
        } catch (err) {
          console.error(err);
          toast.error("Payment failed");
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