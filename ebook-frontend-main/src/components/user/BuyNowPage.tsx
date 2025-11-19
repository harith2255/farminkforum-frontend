import React, { useMemo, useState } from "react";
import { CheckCircle, Lock, CreditCard, BarChart2} from "lucide-react";

// BuyNowPage.tsx
// A responsive, premium "Buy Now" React page using Tailwind CSS.
// - Production-ready layout (no external UI deps required)
// - Sample payment flow stub, coupon, GST calculation, and order summary
// - Replace payment placeholders with your gateway integration (Razorpay, Cashfree etc.)

export type Product = {
  id: string;
  title: string;
  description?: string;
  features?: string[];
  price: number; // base price in INR (integer rupees)
  originalPrice?: number;
  thumbnail?: string; // image URL
  delivery?: string; // e.g. "Instant Download"
};

type Props = {
  product?: Product;
  onComplete?: (receipt: { orderId: string; productId: string }) => void;
};

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

const DEFAULT_PRODUCT: Product = {
  id: "p_ebook_001",
  title: "Advanced Calculus — Complete Guide",
  description: "Comprehensive eBook with solved problems, chapter tests and formula sheets.",
  features: [
    "Instant PDF download",
    "DRM-protected file",
    "Lifetime access",
    "Includes practice mock tests",
  ],
  price: 799,
  originalPrice: 999,
  thumbnail: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=abcd",
  delivery: "Instant Digital Download",
};

export default function BuyNowPage({ product = DEFAULT_PRODUCT, onComplete }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi" | "netbanking">("card");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // simple coupon map for demo
  const COUPONS: Record<string, { type: "percent" | "flat"; value: number }> = {
    FARMINK10: { type: "percent", value: 10 }, // 10% off
    WELCOME50: { type: "flat", value: 50 },
  };

  const base = useMemo(() => product.price * quantity, [product.price, quantity]);
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const c = COUPONS[appliedCoupon];
    if (!c) return 0;
    return c.type === "percent" ? Math.round((base * c.value) / 100) : c.value;
  }, [appliedCoupon, base]);

  const subtotal = Math.max(0, base - couponDiscount);
  const GST_RATE = 18; // 18% GST (modify if needed)
  const tax = Math.round((subtotal * GST_RATE) / 100);
  const total = subtotal + tax;

  function applyCoupon() {
    const code = coupon.trim().toUpperCase();
    if (!code) return setError("Enter coupon code");
    if (!COUPONS[code]) return setError("Invalid coupon code");
    setAppliedCoupon(code);
    setError(null);
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCoupon("");
  }

  function validateForm() {
    if (!customer.name.trim()) return "Please enter your name";
    if (!/\S+@\S+\.\S+/.test(customer.email)) return "Please enter a valid email";
    if (!/^[6-9]\d{9}$/.test(customer.phone)) return "Please enter a valid 10-digit mobile number";
    return null;
  }

  async function handlePay() {
    setError(null);
    const invalid = validateForm();
    if (invalid) return setError(invalid);

    // Simulate payment flow
    setProcessing(true);
    try {
      // TODO: integrate with Razorpay / Cashfree / Stripe here
      await new Promise((res) => setTimeout(res, 1400)); // mock network

      // Mock success
      setSuccess(true);
      setProcessing(false);

      const receipt = { orderId: `ORD-${Date.now()}`, productId: product.id };
      onComplete?.(receipt);
    } catch (e: any) {
      setProcessing(false);
      setError("Payment failed. Please try again.");
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Product + Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-start bg-white rounded-2xl p-6 shadow-lg">
            <img src={product.thumbnail} alt={product.title} className="w-full md:w-56 h-40 object-cover rounded-lg shadow-sm" />

            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-[#1d4d6a]">{product.title}</h2>
              <p className="text-sm text-gray-600 mt-2">{product.description}</p>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm">
                  <CheckCircle className="w-4 h-4" /> Instant Delivery
                </div>

                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 text-gray-700 text-sm border">
                  <Lock className="w-4 h-4" /> DRM Protected
                </div>

                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 text-gray-700 text-sm border">
                  <BarChart2 className="w-4 h-4" /> Lifetime Access
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-600">What's included</h4>
                  <ul className="list-disc ml-5 text-sm text-gray-700">
                    {product.features?.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-600">Delivery</h4>
                  <p className="text-sm text-gray-700">{product.delivery}</p>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-gray-400 line-through mr-2">{product.originalPrice ? formatINR(product.originalPrice) : ""}</span>
                    <div className="text-xl font-semibold text-[#1d4d6a]">{formatINR(product.price)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-[#1d4d6a] mb-4">Customer Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={customer.name}
                onChange={(e) => setCustomer((s) => ({ ...s, name: e.target.value }))}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#bf2026]/30"
                placeholder="Full name"
              />

              <input
                value={customer.email}
                onChange={(e) => setCustomer((s) => ({ ...s, email: e.target.value }))}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#bf2026]/30"
                placeholder="Email address"
              />

              <input
                value={customer.phone}
                onChange={(e) => setCustomer((s) => ({ ...s, phone: e.target.value }))}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#bf2026]/30"
                placeholder="Mobile number"
              />
            </div>
          </div>

          {/* FAQ + Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-[#1d4d6a] mb-3">Frequently Asked Questions</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <div className="font-medium">Refund Policy</div>
                  <div className="text-gray-600">Full refund within 7 days if you are not satisfied.</div>
                </div>

                <div>
                  <div className="font-medium">How to download?</div>
                  <div className="text-gray-600">You will receive an instant download link after successful payment.</div>
                </div>

                <div>
                  <div className="font-medium">License & Access</div>
                  <div className="text-gray-600">One-time purchase gives lifetime access to the purchased file.</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-[#1d4d6a] mb-3">What learners say</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1d4d6a] text-white flex items-center justify-center font-semibold">JS</div>
                  <div>
                    <div className="font-medium">Jason S.</div>
                    <div className="text-gray-600">"Excellent explanations and practice tests — helped me ace the exam."</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#bf2026] text-white flex items-center justify-center font-semibold">AK</div>
                  <div>
                    <div className="font-medium">Anita K.</div>
                    <div className="text-gray-600">"Clear, practical examples. Highly recommended for self-study."</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Summary & Payment */}
        <aside className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-6">
            <h3 className="text-lg font-semibold text-[#1d4d6a]">Order Summary</h3>

            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{product.title}</div>
                  <div className="text-xs text-gray-400">Qty: 
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="ml-2 px-2 py-1 border rounded-md text-sm"
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </div>
                </div>
                <div className="font-semibold">{formatINR(product.price * quantity)}</div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="font-medium">{formatINR(base)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Coupon</span>
                <span className="font-medium">-{formatINR(couponDiscount)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">GST ({GST_RATE}%)</span>
                <span className="font-medium">{formatINR(tax)}</span>
              </div>

              <div className="pt-3 border-t flex items-center justify-between">
                <div className="text-sm text-gray-500">Total payable</div>
                <div className="text-xl font-semibold text-[#1d4d6a]">{formatINR(total)}</div>
              </div>
            </div>

            {/* Coupon input */}
            <div className="mt-4">
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg"
                    placeholder="Coupon code"
                  />
                  <button onClick={applyCoupon} className="px-4 py-2 bg-[#1d4d6a] text-white rounded-lg">Apply</button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{appliedCoupon}</div>
                    <div className="text-xs text-gray-500">You saved {formatINR(couponDiscount)}</div>
                  </div>
                  <button onClick={removeCoupon} className="text-sm text-[#bf2026] hover:underline">Remove</button>
                </div>
              )}
            </div>

            {/* Payment methods */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Payment method</h4>

              <div className="grid grid-cols-1 gap-2">
                <label className={`flex items-center gap-3 p-2 rounded-lg border ${paymentMethod === "card" ? "border-[#bf2026] bg-[#fff3f3]" : "border-gray-200 bg-white"}`}>
                  <input type="radio" name="pm" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} />
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <span className="text-sm">Credit / Debit Card</span>
                </label>

                <label className={`flex items-center gap-3 p-2 rounded-lg border ${paymentMethod === "upi" ? "border-[#bf2026] bg-[#fff3f3]" : "border-gray-200 bg-white"}`}>
                  <input type="radio" name="pm" checked={paymentMethod === "upi"} onChange={() => setPaymentMethod("upi")} />
                  <img src="/upi-logos.png" alt="upi" className="w-6 h-4 object-contain" />
                  <span className="text-sm">UPI (PhonePe / Google Pay / Paytm)</span>
                </label>

                <label className={`flex items-center gap-3 p-2 rounded-lg border ${paymentMethod === "netbanking" ? "border-[#bf2026] bg-[#fff3f3]" : "border-gray-200 bg-white"}`}>
                  <input type="radio" name="pm" checked={paymentMethod === "netbanking"} onChange={() => setPaymentMethod("netbanking")} />
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M21 10h-6l-2 6H7l-2-6H3" /></svg>
                  <span className="text-sm">Netbanking</span>
                </label>
              </div>
            </div>

            {/* Secure badges */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lock className="w-4 h-4" /> <span>100% Secure payment</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4" /> <span>Trusted by 5,000+ users</span>
              </div>
            </div>

            {/* Action */}
            <div className="mt-4">
              {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

              <button
                onClick={handlePay}
                disabled={processing || success}
                className={`w-full px-4 py-3 rounded-lg text-white ${processing || success ? "bg-gray-300" : "bg-[#bf2026] hover:bg-[#a01c22]"}`}
              >
                {processing ? "Processing…" : success ? "Payment successful" : `Pay ${formatINR(total)}`}
              </button>

              {success && (
                <div className="mt-3 text-sm text-green-700">
                  Payment completed. <a className="text-[#1d4d6a] underline" href="#">Download now</a>
                </div>
              )}
            </div>
          </div>

          {/* Small trust card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm text-sm text-gray-700">
            <div className="font-medium">Need help?</div>
            <div className="text-gray-500">support@farminkforum.com • +91 98765 43210</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
