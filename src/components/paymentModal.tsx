import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

export default function PaymentModal({ open, item, onClose, onSuccess }: any) {
  const [loading, setLoading] = React.useState(false);

  // 🔥 Unified price solution
// Resolve nested product object
const product =
  item?.book ||
  item?.note ||
  item?.subscription ||
  item?.product ||
  item || {};

// Extract price
const amount =
  product?.price ||        // most products use price
  product?.amount ||       // subscription uses amount
  item?.total ||           // cart
  0;


  // 🔥 Correct cart title handling
  const title =
    item?.type === "cart"
      ? `${item.items?.length || 0} Items in Cart`
      : item?.title ||
        item?.name ||
        item?.book?.title ||
        item?.note?.title ||
        "Untitled";

  const type = item?.type || "purchase";

 const confirmPayment = async () => {
  try {
    setLoading(true);

    // simulate payment process
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // 🔥 Determine what user is buying
    let purchaseItems = [];

    if (product.id) {
      purchaseItems = [{ id: product.id, type: item.type || "book" }];
    }

    // 🧠 fallback for cart
    if (item?.type === "cart") {
      purchaseItems = item.items?.map((i: any) => ({
        id: i.id,
        type: i.type,
      })) ?? [];
    }

    // 🚀 CALL BACKEND PURCHASE API
    await fetch("https://ebook-backend-lxce.onrender.com/api/purchase/unified", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ items: purchaseItems }),
    });

    setLoading(false);

    // UI callback
    onSuccess(item);

  } catch (err) {
    console.error(err);
    setLoading(false);
    alert("Payment failed, please try again.");
  }
};


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#1d4d6a]">Confirm Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-gray-700">
          <p>You are purchasing:</p>

          {/* ITEM CARD */}
          <div className="p-4 border rounded-lg">
            <p className="font-semibold">{title}</p>
            <p className="text-sm capitalize">{type}</p>
            <p className="font-semibold mt-2">Price: ₹{amount}</p>
          </div>

          {/* Pay Button */}
          <Button
            className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white"
            onClick={confirmPayment}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
            Pay Now ₹{amount}
          </Button>

          {/* Cancel */}
          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}