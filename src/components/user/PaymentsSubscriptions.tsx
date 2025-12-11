// PaymentsSubscriptions.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  Check,
  CreditCard,
  Download,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Shield,
  Lock,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "https://ebook-backend-lxce.onrender.com/api";

export function PaymentsSubscriptions({ onNavigate }: any) {
  // UI / modal state
  const [loading, setLoading] = useState({
    initial: true,
    plans: false,
    activePlan: false,
    transactions: false,
    methods: false,
    upgrading: false,
    cancelling: false,
    addingMethod: false,
    updatingBilling: false,
    deletingMethod: false,
    settingDefault: false
  });
  
  const [showManagePlan, setShowManagePlan] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showEditBilling, setShowEditBilling] = useState(false);

  // Remote data
  const [plans, setPlans] = useState<any[]>([]);
  const [activePlan, setActivePlan] = useState<any | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [apiMethods, setApiMethods] = useState<any[]>([]);

  // Local sample methods
  const [localMethods] = useState<any[]>([
    {
      id: "local_1",
      brand: "Visa",
      last4: "4242",
      expiry: "12/2025",
      isDefault: true,
      cardholder: "Alex Rodriguez",
      displayName: "Visa •••• 4242",
      source: "local",
    },
    {
      id: "local_2",
      brand: "Mastercard",
      last4: "8888",
      expiry: "08/2026",
      isDefault: false,
      cardholder: "Alex Rodriguez",
      displayName: "Mastercard •••• 8888",
      source: "local",
    },
  ]);

  // Billing info
  const [billingInfo, setBillingInfo] = useState({
    name: "Alex Rodriguez",
    email: "alex.rodriguez@email.com",
    address: "123 University Ave",
    city: "Cambridge",
    state: "MA",
    zipCode: "02138",
    country: "United States",
  });

  // Add card form state
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    saveCard: true,
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const [methods, setMethods] = useState<any[]>([]);

  // Render loading spinner
  const renderSpinner = (text: string = "Loading...") => (
    <div className="flex justify-center items-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a] mb-3"></div>
        <p className="text-gray-500">{text}</p>
      </div>
    </div>
  );

  // Normalizer
  const normalizeMethod = (raw: any) => {
    if (!raw) return null;
    if (raw && raw._normalized) return raw;

    const m: any = { _normalized: true, raw };

    if (raw.display_name || raw.displayName) {
      m.id = raw.id ?? raw.method_id ?? String(Math.random());
      m.displayName = raw.display_name ?? raw.displayName;
      m.brand = raw.provider ?? raw.brand ?? m.displayName.split(" ")[0];
      m.last4 =
        raw.last4 ?? (m.displayName.match(/(\d{4})$/) || [null, null])[1] ?? "";
      m.expiry = raw.expiry ?? raw.expiry_date ?? raw.exp_year ?? "";
      m.isDefault = raw.is_default ?? raw.isDefault ?? false;
      m.cardholder = raw.cardholder ?? raw.cardholder_name ?? "";
      m.source = raw.source ?? "api";
      return m;
    }

    if (raw.brand && raw.last4) {
      m.id = raw.id ?? String(Math.random());
      m.brand = raw.brand;
      m.last4 = raw.last4;
      if (raw.exp_month && raw.exp_year)
        m.expiry = `${String(raw.exp_month).padStart(2, "0")}/${raw.exp_year}`;
      else m.expiry = raw.expiry ?? "";
      m.isDefault = raw.is_default ?? raw.isDefault ?? false;
      m.cardholder = raw.cardholder ?? raw.name ?? "";
      m.displayName = `${m.brand} •••• ${m.last4}`;
      m.source = raw.source ?? "api";
      return m;
    }

    if (raw.card && (raw.card.last4 || raw.card.network)) {
      const card = raw.card;
      m.id = raw.id ?? card.id ?? String(Math.random());
      m.brand = card.network ?? card.brand ?? "Card";
      m.last4 = card.last4 ?? "";
      m.expiry =
        card.exp_month && card.exp_year
          ? `${String(card.exp_month).padStart(2, "0")}/${card.exp_year}`
          : card.expiry ?? "";
      m.isDefault = raw.isDefault ?? raw.is_default ?? false;
      m.cardholder = card.name ?? raw.cardholder ?? "";
      m.displayName = `${m.brand} •••• ${m.last4}`;
      m.source = raw.source ?? "razorpay";
      return m;
    }

    m.id = raw.id ?? String(Math.random());
    m.displayName = raw.displayName ?? `Method ${m.id}`;
    m.brand = raw.brand ?? "";
    m.last4 = raw.last4 ?? "";
    m.expiry = raw.expiry ?? "";
    m.isDefault = raw.isDefault ?? false;
    m.cardholder = raw.cardholder ?? "";
    m.source = raw.source ?? "api";
    return m;
  };

  // Load data
  const loadData = useCallback(async () => {
    setLoading(prev => ({ ...prev, initial: true, plans: true, activePlan: true, transactions: true, methods: true }));
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [plansRes, activeRes, txRes, methodsRes] = await Promise.all([
        axios.get(`${API_BASE}/subscriptions/plans`),
        axios
          .get(`${API_BASE}/subscriptions/active`, { headers })
          .catch(() => ({ data: null })),
        axios
          .get(`${API_BASE}/payments/transactions`, { headers })
          .catch(() => ({ data: [] })),
        axios
          .get(`${API_BASE}/payments/methods`, { headers })
          .catch(() => ({ data: [] })),
      ]);

      setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
      setActivePlan(activeRes.data || null);
      setTransactions(Array.isArray(txRes.data) ? txRes.data : txRes.data || []);

      const apiRaw = Array.isArray(methodsRes.data) ? methodsRes.data : [];
      const normalizedApi = apiRaw.map(normalizeMethod).filter(Boolean);

      const merged: any[] = [...normalizedApi];
      localMethods.forEach((lm) => {
        const exists = normalizedApi.some(
          (am) => am.last4 && lm.last4 && am.last4 === lm.last4
        );
        if (!exists) merged.push(normalizeMethod(lm));
      });

      if (!merged.some((m) => m.isDefault)) {
        if (merged.length) merged[0].isDefault = true;
      }

      setApiMethods(normalizedApi);
      setMethods(merged);
    } catch (err) {
      console.error("Failed to load payment data:", err);
      toast.error("Failed to load payment data");
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        initial: false, 
        plans: false, 
        activePlan: false, 
        transactions: false, 
        methods: false 
      }));
    }
  }, [token, localMethods]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handler = () => {
      if (localStorage.getItem("refreshSubscription") === "true") {
        loadData();
        localStorage.removeItem("refreshSubscription");
      }
    };
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [loadData]);

  // Actions
  const handleUpgrade = async (planId: any) => {
    try {
      setLoading(prev => ({ ...prev, upgrading: true }));
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post(
        `${API_BASE}/subscriptions/upgrade`,
        { planId },
        { headers }
      );

      if (res.data && res.data.subscription) {
        setActivePlan(res.data.subscription);
      } else {
        try {
          const activeRes = await axios.get(
            `${API_BASE}/subscriptions/active`,
            { headers }
          );
          setActivePlan(activeRes.data || null);
        } catch (e) {
          console.warn("Upgrade: failed to re-fetch active subscription", e);
        }
      }

      await loadData();
      setShowManagePlan(false);

      toast.success("Subscription upgraded!");
      window.dispatchEvent(new CustomEvent("subscription:updated"));

      onNavigate("exams");
      window.history.pushState({}, "", "/user-dashboard/exams");
    } catch (err: any) {
      console.error("Upgrade failed:", err);
      const message =
        err?.response?.data?.error || err?.message || "Upgrade failed";
      toast.error(message);
    } finally {
      setLoading(prev => ({ ...prev, upgrading: false }));
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    try {
      setLoading(prev => ({ ...prev, cancelling: true }));
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(
        `${API_BASE}/subscriptions/cancel`,
        {},
        { headers }
      );
      
      toast.success(res.data?.message ?? "Canceled. You will retain access until expiry.");
      localStorage.setItem("refreshSubscription", "true");
      await loadData();
      setShowManagePlan(false);
    } catch (err) {
      console.error("Cancel failed:", err);
      toast.error("Failed to cancel subscription");
    } finally {
      setLoading(prev => ({ ...prev, cancelling: false }));
    }
  };

  // Payment methods
  const handleAddPaymentMethod = async () => {
    const { cardNumber, expiryDate, cvv, cardholderName } = newPaymentMethod;
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      toast.error("Please fill all card details");
      return;
    }

    try {
      setLoading(prev => ({ ...prev, addingMethod: true }));
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const last4 = cardNumber.slice(-4);
      const displayName = `${
        cardholderName ? cardholderName + " • " : ""
      }Card •••• ${last4}`;

      const res = await axios.post(
        `${API_BASE}/payments/methods`,
        {
          provider: "card",
          displayName,
          last4,
          expiry: expiryDate,
        },
        { headers }
      );

      const saved = normalizeMethod(res.data) ?? {
        id: `local_${Date.now()}`,
        displayName,
        brand: "Card",
        last4,
        expiry: expiryDate,
        isDefault: false,
        source: "api",
      };

      setMethods((prev) => {
        const updated = prev.map((p) => ({
          ...p,
          isDefault: saved.isDefault ? false : p.isDefault,
        }));
        return [...updated, saved];
      });

      setNewPaymentMethod({
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        cardholderName: "",
        saveCard: true,
      });
      setShowAddPayment(false);
      toast.success("Payment method added successfully");
    } catch (err) {
      console.error("Add method failed:", err);
      toast.error("Failed to add payment method");
    } finally {
      setLoading(prev => ({ ...prev, addingMethod: false }));
    }
  };

  const setDefaultPaymentMethod = async (id: string) => {
    try {
      setLoading(prev => ({ ...prev, settingDefault: true }));
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        `${API_BASE}/payments/methods/${id}/default`,
        {},
        { headers }
      );

      setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
      toast.success("Default payment method updated");
    } catch (err) {
      console.error("Set default failed:", err);
      toast.error("Failed to set default");
    } finally {
      setLoading(prev => ({ ...prev, settingDefault: false }));
    }
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      const m = methods.find((x) => x.id === id);
      if (m?.isDefault) {
        toast.error("Cannot delete default payment method. Set another default first.");
        return;
      }
      if (!confirm("Delete this saved payment method?")) return;

      setLoading(prev => ({ ...prev, deletingMethod: true }));
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`${API_BASE}/payments/methods/${id}`, { headers });

      setMethods((prev) => prev.filter((x) => x.id !== id));
      toast.success("Payment method deleted");
    } catch (err) {
      console.error("Delete method failed:", err);
      toast.error("Failed to delete payment method");
    } finally {
      setLoading(prev => ({ ...prev, deletingMethod: false }));
    }
  };

  const handleUpdateBillingInfo = () => {
    setLoading(prev => ({ ...prev, updatingBilling: true }));
    
    setTimeout(() => {
      setBillingInfo(billingInfo);
      setShowEditBilling(false);
      toast.success("Billing information updated");
      setLoading(prev => ({ ...prev, updatingBilling: false }));
    }, 800);
  };

  const formatPrice = (p: any) => {
    if (typeof p === "number") return `₹${p}`;
    if (typeof p === "string" && p.startsWith("₹")) return p;
    return p ? `₹${p}` : "—";
  };

  if (loading.initial) {
    return renderSpinner("Loading payment information...");
  }

  // Modals
  const AddPaymentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-[#1d4d6a] mb-4">
          Add Payment Method
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">
              Card Number
            </label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              className="w-full p-3 border border-gray-300 rounded-xl mt-1"
              value={newPaymentMethod.cardNumber}
              onChange={(e) =>
                setNewPaymentMethod((prev) => ({
                  ...prev,
                  cardNumber: e.target.value,
                }))
              }
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600">
                Expiry Date
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                className="w-full p-3 border border-gray-300 rounded-xl mt-1"
                value={newPaymentMethod.expiryDate}
                onChange={(e) =>
                  setNewPaymentMethod((prev) => ({
                    ...prev,
                    expiryDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600">CVV</label>
              <input
                type="text"
                placeholder="123"
                className="w-full p-3 border border-gray-300 rounded-xl mt-1"
                value={newPaymentMethod.cvv}
                onChange={(e) =>
                  setNewPaymentMethod((prev) => ({
                    ...prev,
                    cvv: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">
              Cardholder Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full p-3 border border-gray-300 rounded-xl mt-1"
              value={newPaymentMethod.cardholderName}
              onChange={(e) =>
                setNewPaymentMethod((prev) => ({
                  ...prev,
                  cardholderName: e.target.value,
                }))
              }
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newPaymentMethod.saveCard}
              onChange={(e) =>
                setNewPaymentMethod((prev) => ({
                  ...prev,
                  saveCard: e.target.checked,
                }))
              }
            />
            <span className="text-sm text-gray-600">
              Save this card for future payments
            </span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowAddPayment(false)}
            disabled={loading.addingMethod}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-[#bf2026] hover:bg-[#a81c21] text-white flex items-center justify-center gap-2"
            onClick={handleAddPaymentMethod}
            disabled={loading.addingMethod}
          >
            {loading.addingMethod ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Adding...
              </>
            ) : (
              "Add Card"
            )}
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <Lock className="w-3 h-3" />
          <span>Your payment information is secure and encrypted</span>
        </div>
      </div>
    </div>
  );

  const EditBillingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-[#1d4d6a] mb-4">
          Update Billing Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">
              Full Name
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-xl mt-1"
              value={billingInfo.name}
              onChange={(e) =>
                setBillingInfo((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              className="w-full p-3 border border-gray-300 rounded-xl mt-1"
              value={billingInfo.email}
              onChange={(e) =>
                setBillingInfo((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Address</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-xl mt-1"
              value={billingInfo.address}
              onChange={(e) =>
                setBillingInfo((prev) => ({ ...prev, address: e.target.value }))
              }
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600">City</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-xl mt-1"
                value={billingInfo.city}
                onChange={(e) =>
                  setBillingInfo((prev) => ({ ...prev, city: e.target.value }))
                }
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600">State</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-xl mt-1"
                value={billingInfo.state}
                onChange={(e) =>
                  setBillingInfo((prev) => ({ ...prev, state: e.target.value }))
                }
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">
              ZIP Code
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-xl mt-1"
              value={billingInfo.zipCode}
              onChange={(e) =>
                setBillingInfo((prev) => ({ ...prev, zipCode: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setShowEditBilling(false)}
            disabled={loading.updatingBilling}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-[#bf2026] hover:bg-[#a81c21] text-white flex items-center justify-center gap-2"
            onClick={handleUpdateBillingInfo}
            disabled={loading.updatingBilling}
          >
            {loading.updatingBilling ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              "Update Info"
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // Manage plan UI
  if (showManagePlan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManagePlan(false)}
            className="flex items-center gap-2"
            disabled={loading.cancelling || loading.upgrading}
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Subscription
          </Button>
          <div>
            <h2 className="text-[#1d4d6a] text-xl sm:text-2xl font-bold mb-1">Manage Subscription Plan</h2>
            <p className="text-sm text-gray-500">
              Switch plans or cancel your subscription
            </p>
          </div>
        </div>

        {loading.plans ? (
          renderSpinner("Loading subscription plans...")
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Plan Summary */}
            <Card className="border-2 border-[#bf2026]">
              <CardContent className="p-6">
                <Badge className="bg-[#bf2026] text-white mb-3">
                  Current Plan
                </Badge>
                <h3 className="text-xl font-semibold text-[#1d4d6a] mb-2">
                  {activePlan?.name ?? "—"}
                </h3>

                <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                  <Calendar className="w-4 h-4" />
                  Renews on{" "}
                  {activePlan?.renewsOn
                    ? new Date(activePlan.renewsOn).toLocaleDateString()
                    : "—"}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl text-[#1d4d6a]">
                    {formatPrice(activePlan?.price ?? "—")}
                  </span>
                  <span className="text-gray-500">
                    {activePlan?.period ?? ""}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Plan Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#1d4d6a]">
                  Switch Subscription Plan
                </CardTitle>
                <CardDescription>
                  Choose the plan that works best for you
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((plan: any, index: number) => (
                    <Card
                      key={plan.id ?? index}
                      className={`border-2 ${
                        activePlan?.id === plan.id
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-[#bf2026] cursor-pointer"
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-[#1d4d6a] text-lg">
                            {plan.name}
                          </CardTitle>

                          {plan.popular && !(activePlan?.id === plan.id) && (
                            <Badge className="bg-yellow-500 text-white">
                              Popular
                            </Badge>
                          )}
                          {activePlan?.id === plan.id && (
                            <Badge className="bg-green-500 text-white">
                              Active
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-bold text-[#1d4d6a]">
                            {formatPrice(plan.price)}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {plan.period}
                          </span>
                        </div>

                        {plan.savings && (
                          <Badge className="bg-green-100 text-green-700 w-fit mt-2">
                            {plan.savings}
                          </Badge>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <ul className="space-y-2">
                          {Array.isArray(plan.features) &&
                            plan.features.map((feature: string, i: number) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm"
                              >
                                <Check className="w-4 h-4 text-[#bf2026] mt-0.5" />
                                <span className="text-gray-700">{feature}</span>
                              </li>
                            ))}
                        </ul>

                        <Button
                          className={`w-full flex items-center justify-center gap-2 ${
                            activePlan?.id === plan.id
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-[#bf2026] hover:bg-[#a01c22]"
                          } text-white`}
                          disabled={activePlan?.id === plan.id || loading.upgrading}
                          onClick={() => handleUpgrade(plan.id)}
                        >
                          {loading.upgrading ? (
                            <>
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Processing...
                            </>
                          ) : activePlan?.id === plan.id ? (
                            "Current Plan"
                          ) : (
                            "Switch to Plan"
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cancel Subscription Section */}
            <Card className="border-2 border-red-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-red-600 mb-2">
                  Cancel Subscription
                </h3>
                <p className="text-gray-600 mb-4">
                  Your subscription will remain active until{" "}
                  {activePlan?.renewsOn
                    ? new Date(activePlan.renewsOn).toLocaleDateString()
                    : "the renewal date"}
                  . After cancellation, you'll lose access to premium features on
                  your renewal date.
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowManagePlan(false)}
                    disabled={loading.cancelling}
                  >
                    Keep My Plan
                  </Button>

                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                    onClick={handleCancel}
                    disabled={loading.cancelling}
                  >
                    {loading.cancelling ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Cancelling...
                      </>
                    ) : (
                      "Cancel Subscription"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Main subscription view
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] text-xl sm:text-2xl font-bold mb-1">Payments & Subscriptions</h2>
        <p className="text-sm text-gray-500">
          Manage your subscription and view transaction history
        </p>
      </div>

      <Tabs defaultValue="subscription" className="w-full">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="subscription">
            Subscription
            {loading.activePlan && <Loader2 className="w-3 h-3 ml-2 animate-spin" />}
          </TabsTrigger>
          <TabsTrigger value="transactions">
            Transactions
            {loading.transactions && <Loader2 className="w-3 h-3 ml-2 animate-spin" />}
          </TabsTrigger>
          <TabsTrigger value="payment-methods">
            Payment Methods
            {loading.methods && <Loader2 className="w-3 h-3 ml-2 animate-spin" />}
          </TabsTrigger>
        </TabsList>

        {/* Subscription */}
        <TabsContent value="subscription" className="mt-6 space-y-6">
          <Card className="border-2 border-[#bf2026] shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-[#bf2026] text-white mb-2">
                    Active Plan
                  </Badge>
                  <h3 className="text-[#1d4d6a] text-lg sm:text-xl font-semibold mb-1">
                    {activePlan?.name ?? "No active subscription"}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Renews on{" "}
                    {activePlan?.renewsOn
                      ? new Date(activePlan.renewsOn).toLocaleDateString()
                      : "—"}
                  </p>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl text-[#1d4d6a]">
                      {formatPrice(activePlan?.price ?? "—")}
                    </span>
                    <span className="text-gray-500">
                      / {activePlan?.period ?? ""}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="mb-2"
                    onClick={() => setShowManagePlan(true)}
                  >
                    Manage Plan
                  </Button>
                  <p className="text-xs text-gray-500">Cancel anytime</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Plans */}
          <div>
            <h3 className="text-[#1d4d6a] mb-4">Available Plans</h3>
            {loading.plans ? (
              renderSpinner("Loading available plans...")
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No subscription plans available at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan: any, index: number) => (
                  <Card
                    key={plan.id ?? index}
                    className={`border-none shadow-md ${
                      plan.popular ? "ring-2 ring-[#bf2026]" : ""
                    } ${
                      activePlan?.id === plan.id
                        ? "opacity-50"
                        : "hover:shadow-xl transition-all"
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-[#1d4d6a]">
                          {plan.name}
                        </CardTitle>
                        {plan.popular && (
                          <Badge className="bg-yellow-500 text-white">
                            Popular
                          </Badge>
                        )}
                        {activePlan?.id === plan.id && (
                          <Badge className="bg-green-500 text-white">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="mb-4">
                        <span className="text-3xl text-[#1d4d6a]">
                          {formatPrice(plan.price)}
                        </span>
                        <span className="text-gray-500 text-sm ml-2">
                          {plan.period}
                        </span>
                        {plan.savings && (
                          <Badge className="bg-green-100 text-green-700 ml-2">
                            {plan.savings}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-3">
                        {Array.isArray(plan.features) &&
                          plan.features.map((feature: string, fIndex: number) => (
                            <li
                              key={fIndex}
                              className="flex items-start gap-2 text-sm"
                            >
                              <Check className="w-4 h-4 text-[#bf2026] shrink-0 mt-0.5" />
                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ))}
                      </ul>

                      <Button
                        className={`w-full bg-[#bf2026] text-white flex items-center justify-center gap-2`}
                        disabled={activePlan?.id === plan.id || loading.upgrading}
                        onClick={() => {
                          localStorage.setItem("purchaseType", "subscription");
                          localStorage.setItem("purchaseId", plan.id);
                          if (onNavigate) onNavigate("purchase");
                          else {
                            if (
                              confirm(
                                "Proceed to upgrade via server-side (test)?"
                              )
                            )
                              handleUpgrade(plan.id);
                          }
                        }}
                      >
                        {loading.upgrading ? (
                          <>
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : activePlan?.id === plan.id ? (
                          "Current Plan"
                        ) : (
                          "Upgrade Now"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Transactions */}
        <TabsContent value="transactions" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#1d4d6a]">
                    Transaction History
                  </CardTitle>
                  <CardDescription>
                    Your past payments and purchases
                  </CardDescription>
                </div>

                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" /> Export
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading.transactions ? (
                renderSpinner("Loading transactions...")
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No transactions yet
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((t: any) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-[#bf2026]" />
                        </div>

                        <div className="flex-1">
                          <h4 className="text-[#1d4d6a] mb-1">{t.description}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {t.created_at
                                ? new Date(t.created_at).toLocaleDateString()
                                : t.date
                                ? new Date(t.date).toLocaleDateString()
                                : "—"}
                            </span>
                            <span>•</span>
                            <span>{t.method ?? ""}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[#1d4d6a] mb-1">{t.amount}</p>
                        <Badge className="bg-green-100 text-green-700">
                          {t.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods */}
        <TabsContent value="payment-methods" className="mt-6">
          <div className="space-y-4">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-[#1d4d6a]">
                  Saved Payment Methods
                </CardTitle>
                <CardDescription>
                  Manage your payment methods securely
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {loading.methods ? (
                  renderSpinner("Loading payment methods...")
                ) : methods.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No saved payment methods
                  </div>
                ) : (
                  methods.map((method: any) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-[#bf2026]" />
                        </div>

                        <div>
                          <h4 className="text-[#1d4d6a] mb-1">
                            {method.displayName ??
                              `${method.brand} ending in ${method.last4}`}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Expires {method.expiry ?? "—"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {method.cardholder ?? ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {method.isDefault && (
                          <Badge className="bg-green-100 text-green-700">
                            Default
                          </Badge>
                        )}
                        {!method.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDefaultPaymentMethod(method.id)}
                            disabled={loading.settingDefault}
                            className="flex items-center gap-1"
                          >
                            {loading.settingDefault ? (
                              <>
                                <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                                Setting...
                              </>
                            ) : (
                              "Set Default"
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            alert("Edit card flow not implemented server-side")
                          }
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePaymentMethod(method.id)}
                          disabled={loading.deletingMethod}
                          className="flex items-center gap-1"
                        >
                          {loading.deletingMethod ? (
                            <>
                              <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                              Deleting...
                            </>
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}

                {/* Digital Wallet Options */}
                <div className="mt-6 space-y-3">
                  <h4 className="text-[#1d4d6a] font-medium">
                    Digital Wallets
                  </h4>

                  <Button
                    variant="outline"
                    className="w-full flex items-center gap-3 justify-start"
                    onClick={() => alert("Google Pay integration placeholder")}
                  >
                    <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                      G
                    </div>
                    Google Pay
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full flex items-center gap-3 justify-start"
                    onClick={() => alert("Apple Pay integration placeholder")}
                  >
                    <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                      </svg>
                    </div>
                    Apple Pay
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full flex items-center gap-3 justify-start"
                    onClick={() => alert("PayPal integration placeholder")}
                  >
                    <div className="w-6 h-6 bg-blue-300 rounded flex items-center justify-center text-blue-800 text-xs font-bold">
                      P
                    </div>
                    PayPal
                  </Button>
                </div>

                <Button
                  className="w-full mt-4 border-2 border-dashed border-gray-300 bg-transparent text-gray-700 hover:border-[#bf2026] hover:text-[#bf2026] hover:bg-transparent flex items-center justify-center gap-2"
                  onClick={() => setShowAddPayment(true)}
                  disabled={loading.addingMethod}
                >
                  <Plus className="w-4 h-4" />
                  Add New Payment Method
                </Button>

                <div className="flex items-center gap-2 text-xs text-gray-500 mt-4">
                  <Shield className="w-3 h-3" />
                  <span>
                    All payment methods are securely stored and encrypted
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Billing Info */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-[#1d4d6a]">
                  Billing Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name</span>
                    <span className="text-gray-900">{billingInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="text-gray-900">{billingInfo.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Address</span>
                    <span className="text-gray-900 text-right">
                      {billingInfo.address}
                      <br />
                      {billingInfo.city}, {billingInfo.state}{" "}
                      {billingInfo.zipCode}
                      <br />
                      {billingInfo.country}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4 flex items-center justify-center gap-2"
                  onClick={() => setShowEditBilling(true)}
                  disabled={loading.updatingBilling}
                >
                  {loading.updatingBilling ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Billing Info"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showAddPayment && <AddPaymentModal />}
      {showEditBilling && <EditBillingModal />}
    </div>
  );
}