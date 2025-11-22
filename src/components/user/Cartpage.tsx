import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { ShoppingCart } from "lucide-react";
import axios from "axios";

export default function CartPage({ onNavigate, items }: any) {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  /* --------------------------------------------------------
     🔥 1. LOAD CART FROM BACKEND
  -------------------------------------------------------- */
  const fetchCart = async () => {
    try {
      const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems(Array.isArray(res.data.items) ? res.data.items : []);

    } catch (err) {
      console.error("Failed to fetch cart:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // 🔥 Listen for cart updates globally
  useEffect(() => {
    const handler = () => {
      fetchCart(); // refresh cart automatically
    };

    window.addEventListener("cart:changed", handler);

    return () => window.removeEventListener("cart:changed", handler);
  }, []);
  /* --------------------------------------------------------
     🗑 2. REMOVE ITEM FROM CART
  -------------------------------------------------------- */
  const removeFromCart = async (id: number) => {
    try {
      await axios.delete(`https://ebook-backend-lxce.onrender.com/api/cart/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCartItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Remove failed:", err);
      alert("Failed to remove item");
    }
  };

  /* --------------------------------------------------------
     💳 3. BUY NOW (go to purchase page)
  -------------------------------------------------------- */
  const handleBuyNow = (item: any) => {
    if (item.book_id) {
      localStorage.setItem("purchaseType", "book");
      localStorage.setItem("purchaseId", String(item.book_id));
    } else if (item.note_id) {
      localStorage.setItem("purchaseType", "note");
      localStorage.setItem("purchaseId", String(item.note_id));
    }

    onNavigate("purchase");
  };

  /* --------------------------------------------------------
     🧮 4. TOTALS
  -------------------------------------------------------- */
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.book?.price || item.note?.price || 0;
    return acc + Number(price);
  }, 0);

  const total = subtotal.toFixed(2);

  if (loading)
    return <p className="p-6 text-center">Loading your cart...</p>;

  return (
    <div className="max-w-5xl mx-auto p-3">
      <h2 className="text-[#1d4d6a] mb-2 flex items-center gap-2 text-2xl font-semibold">
        <ShoppingCart className="w-7 h-7" /> Your Cart
      </h2>

      <p className="text-gray-600 text-sm mb-6">
        <span>{cartItems.length}</span>{" "}
        {cartItems.length === 1 ? "item" : "items"} in your cart.
      </p>

      {cartItems.length === 0 ? (
        <p className="text-gray-500 text-lg">Your cart is empty.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* --------------------------------------
              LEFT SIDE – ITEM LIST
          --------------------------------------- */}
          <div className="md:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const product = item.book || item.note;
              const isBook = !!item.book_id;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-white p-4 rounded-2xl shadow"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        product?.file_url?.endsWith(".png") ||
                        product?.file_url?.endsWith(".jpg") ||
                        product?.file_url?.endsWith(".jpeg")
                          ? product.file_url
                          : "https://cdn-icons-png.flaticon.com/512/337/337946.png"
                      }
                      className="w-20 h-24 object-cover rounded"
                    />

                    <div>
                      <h2 className="font-semibold text-lg">
                        {product?.title}
                      </h2>
                      <p className="text-gray-600 text-sm">
                        {isBook
                          ? `by ${product?.author}`
                          : product?.author || "—"}
                      </p>

                      <p className="text-[#bf2026] font-medium mt-1">
                        ₹{product?.price}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 mt-3">
                    <Button
                      onClick={() => handleBuyNow(item)}
                      className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white text-sm py-1 px-3 rounded-md"
                    >
                      Buy Now
                    </Button>

                    <Button
                      onClick={() => removeFromCart(item.id)}
                      className="w-full bg-[#1d4d6a] hover:bg-[#153a4f] text-white text-sm py-1 px-3 rounded-md"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* --------------------------------------
              RIGHT SIDE – SUMMARY
          --------------------------------------- */}
          <div className="bg-white rounded-2xl shadow p-5 h-fit">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="flex justify-between text-gray-700 mb-2">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <Button
              className="w-full mt-5 bg-[#bf2026] hover:bg-[#a01c22] text-white py-2 rounded-md text-lg"
              onClick={() => {
                localStorage.setItem("purchaseType", "cart");
                localStorage.setItem("cartItems", JSON.stringify(cartItems));
                onNavigate("purchase"); // ✅ FIXED
              }}            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}