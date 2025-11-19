import React, { useState } from "react";
import { Button } from "../ui/button";
import { ShoppingCart } from "lucide-react";
export default function CartPage() {
    // Example cart data
    const [cartItems, setCartItems] = useState([
        {
            id: 1,
            title: "Atomic Habits",
            author: "James Clear",
            price: 12.99,
            image: "https://m.media-amazon.com/images/I/81bGKUa1e0L.jpg",
        },
        {
            id: 2,
            title: "Deep Work",
            author: "Cal Newport",
            price: 9.99,
            image: "https://m.media-amazon.com/images/I/71g2ednj0JL.jpg",
        },
        {
    id: 3,
    title: "Rich Dad Poor Dad",
    author: "Robert T. Kiyosaki",
    price: 10.99,
    image: "https://m.media-amazon.com/images/I/81bsw6fnUiL.jpg",
  },
    ]);

    // Remove from cart
    const removeFromCart = (id: number) => {
        setCartItems(cartItems.filter((item) => item.id !== id));
    };

    // Buy Now (demo action)
    const handleBuyNow = (item: any) => {
        alert(`Proceeding to checkout for "${item.title}"`);
    };

    // Calculate totals
    const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);
    const total = subtotal.toFixed(2);

    return (
        <div className="max-w-5xl mx-auto p-3">
            <h2 className="text-[#1d4d6a] mb-2 flex items-center gap-2 text-2xl font-semibold">
                <ShoppingCart className="w-7 h-7" /> Your Cart
            </h2>

            <p className="text-gray-600 text-sm mb-6">
                <span>{cartItems.length}</span> {cartItems.length === 1 ? "book" : "books"} in your cart.
            </p>

            {cartItems.length === 0 ? (
                <p className="text-gray-500 text-lg">Your cart is empty.</p>
            ) : (
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Left side - Cart Items */}
                    <div className="md:col-span-2 space-y-4">
                        {cartItems.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between bg-white p-4 rounded-2xl shadow"
                            >
                                <div className="flex items-center gap-4">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-20 h-24 object-cover rounded"
                                    />
                                    <div>
                                        <h2 className="font-semibold text-lg">{item.title}</h2>
                                        <p className="text-gray-600 text-sm">by {item.author}</p>
                                        <p className="text-[#bf2026] font-medium mt-1">
                                            ₹{item.price}
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
                        ))}
                    </div>

                    {/* Right side - Summary */}
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

                        <Button className="w-full mt-5 bg-[#bf2026] hover:bg-[#a01c22] text-white py-2 rounded-md text-lg">
                            Proceed to Checkout
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
