import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

export default function PaymentModal({ open, item, onClose, onSuccess }: any) {
  const [loading, setLoading] = React.useState(false);

  // 🔥 Unified price solution
  const amount =
    item?.price ||        // book, note
    item?.total_price ||  // writing order
    item?.amount ||       // subscription
    item?.total ||        // cart
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
    setLoading(true);

    // Simulated processing (test mode)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setLoading(false);
    onSuccess(item); // calls PurchasePage handleSuccess()
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#1d4d6a]">Confirm Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-gray-700">
          <p>You are purchasing:</p>

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