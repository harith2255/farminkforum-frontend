import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { ShoppingCart } from "lucide-react";
import axios from "axios";

export default function CartPage({ onNavigate }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  /* --------------------------------------------------------
    LOAD CART 
  -------------------------------------------------------- */
  const fetchCart = async () => {
    try {
      const res = await axios.get("https://e-book-backend-production.up.railway.app/api/cart", {
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
    const listener = () => fetchCart();
    window.addEventListener("cart:changed", listener);
    return () => window.removeEventListener("cart:changed", listener);

  }, []);

  /* --------------------------------------------------------
    REMOVE ITEM 
  -------------------------------------------------------- */
  const removeFromCart = async (id) => {
    try {
      await axios.delete(`https://e-book-backend-production.up.railway.app/api/cart/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCartItems((prev) => prev.filter((i) => i.id !== id));

      const cached = JSON.parse(localStorage.getItem("cartItems") || "[]");
      localStorage.setItem(
        "cartItems",
        JSON.stringify(cached.filter((i) => i.id !== id))
      );

      window.dispatchEvent(new Event("cart:changed"));
    } catch (err) {
      console.error("Remove failed:", err);
    }
  };

  // --------------------------------------------------------
  // BUY NOW (single item)
  // --------------------------------------------------------
  const handleBuyNow = (item) => {
    const product = item.book || item.note;
    const type = item.book_id ? "book" : "note";

    localStorage.setItem("purchaseType", type);

    localStorage.setItem(
      "purchaseItems",
      JSON.stringify([
        {
          id: product.id,
          product,
        },
      ])
    );

    onNavigate("purchase");
  };

  // --------------------------------------------------------
  // TOTAL (no quantity)
  // --------------------------------------------------------
  const subtotal = cartItems.reduce((acc, item) => {
    const product = item.book || item.note;
    return acc + Number(product?.price || 0);
  }, 0);

  const total = Number(subtotal || 0).toFixed(2);

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
          {/* ITEM LIST */}
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
                        product?.file_url?.match(/\.(png|jpg|jpeg)$/i)
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
                        {isBook ? `by ${product?.author}` : product?.author || "—"}
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

          {/* SUMMARY */}
          <div className="bg-white rounded-2xl shadow p-5 h-fit">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="flex justify-between text-gray-700 mb-2">
              <span>Subtotal</span>
              <span>₹{Number(subtotal || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>Total</span>
              <span>₹{total}</span>
            </div>

            <Button
              className="w-full mt-5 bg-[#bf2026] hover:bg-[#a01c22] text-white py-2 rounded-md text-lg"
              onClick={() => {
                localStorage.setItem("purchaseType", "cart");
                localStorage.setItem(
                  "purchaseItems",
                  JSON.stringify(
                    cartItems.map((item) => ({
                      id: item.id,
                      product: item.book || item.note,
                    }))
                  )
                );

                onNavigate("purchase");
              }}
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}