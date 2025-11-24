// src/components/payments/PaymentsSubscriptions.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Check, CreditCard, Download, Calendar } from 'lucide-react';
import axios from "axios";
import { useEffect, useState } from "react";
import * as React from 'react';

export function PaymentsSubscriptions({ onNavigate }: any) {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [transactions, setTransactions] = useState([]);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");


  /* ----------------------------------------------------------
      FETCH DATA
  ------------------------------------------------------------ */
useEffect(() => {
  const loadData = async () => {
    try {
      const [plansRes, activeRes, transactionsRes, methodsRes] = await Promise.all([
        axios.get("https://ebook-backend-lxce.onrender.com/api/subscriptions/plans"),
        axios.get("https://ebook-backend-lxce.onrender.com/api/subscriptions/active", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("https://ebook-backend-lxce.onrender.com/api/payments/transactions", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("https://ebook-backend-lxce.onrender.com/api/payments/methods", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setPlans(plansRes.data);
      setActivePlan(activeRes.data || null);
      setTransactions(Array.isArray(transactionsRes.data) ? transactionsRes.data : []);
      setMethods(Array.isArray(methodsRes.data) ? methodsRes.data : []);

      // Reset refresh trigger
      if (localStorage.getItem("refreshSubscription") === "true") {
        localStorage.removeItem("refreshSubscription");
      }
    } catch (err) {
      console.error("Failed to load payment data:", err);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, []);


  // 🔥 Refresh handler for dynamic subscription reload
  useEffect(() => {
    const handler = () => {
      if (localStorage.getItem("refreshSubscription") === "true") {
        loadData();
        localStorage.removeItem("refreshSubscription");
      }
    };

    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, []);



  if (loading) return <p className="text-gray-600 p-6">Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1">Payments & Subscriptions</h2>
        <p className="text-sm text-gray-500">
          Manage your subscription and view transaction history
        </p>
      </div>

      <Tabs defaultValue="subscription" className="w-full">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
        </TabsList>

        {/* --------------------------
            CURRENT SUBSCRIPTION
        --------------------------- */}
        <TabsContent value="subscription" className="mt-6 space-y-6">
          {activePlan ? (
            <Card className="border-2 border-[#bf2026] shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="bg-[#bf2026] text-white mb-2">Active Plan</Badge>
                    <h3 className="text-[#1d4d6a] mb-1">{activePlan.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Renews on {new Date(activePlan.renewsOn).toLocaleDateString()}
                    </p>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl text-[#1d4d6a]">₹{activePlan.price}</span>
                      <span className="text-gray-500">/ {activePlan.period}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <Button variant="outline" size="sm">Manage Plan</Button>
                    <p className="text-xs text-gray-500 mt-1">Cancel anytime</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-gray-600">No active subscription</p>
          )}

          {/* --------------------------
              AVAILABLE PLANS (DYNAMIC)
          --------------------------- */}
          <div>
            <h3 className="text-[#1d4d6a] mb-4">Available Plans</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan: any) => (
                <Card
                  key={plan.id}
                  className={`border-none shadow-md ${
                    plan.popular ? "ring-2 ring-[#bf2026]" : ""
                  } ${
                    activePlan?.id === plan.id ? "opacity-50" : "hover:shadow-xl transition-all"
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-[#1d4d6a]">{plan.name}</CardTitle>
                      {plan.popular && (
                        <Badge className="bg-yellow-500 text-white">Popular</Badge>
                      )}
                      {activePlan?.id === plan.id && (
                        <Badge className="bg-green-500 text-white">Active</Badge>
                      )}
                    </div>

                    <div className="mb-4">
                      <span className="text-3xl text-[#1d4d6a]">₹{plan.price}</span>
                      <span className="text-gray-500 text-sm ml-2">/{plan.period}</span>
                      {plan.savings && (
                        <Badge className="bg-green-100 text-green-700 ml-2">{plan.savings}</Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-[#bf2026] shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                 <Button
  className="w-full bg-[#bf2026] text-white"
  disabled={activePlan?.id === plan.id}
  onClick={() => {
    localStorage.setItem("purchaseType", "subscription");
    localStorage.setItem("purchaseId", plan.id);
    onNavigate("purchase");
  }}
>
  {activePlan?.id === plan.id ? "Current Plan" : "Upgrade Now"}
</Button>



                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* --------------------------
            TRANSACTION HISTORY
        --------------------------- */}
        <TabsContent value="transactions" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#1d4d6a]">Transaction History</CardTitle>
                  <CardDescription>Your past payments and purchases</CardDescription>
                </div>

                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" /> Export
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {transactions.length === 0 && (
                  <p className="text-gray-500">No transactions yet</p>
                )}

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
                            {new Date(t.date).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{t.method}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[#1d4d6a] mb-1">₹{t.amount}</p>
                      <Badge className="bg-green-100 text-green-700">{t.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --------------------------
            PAYMENT METHODS
        --------------------------- */}
        <TabsContent value="payment-methods" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Saved Payment Methods</CardTitle>
              <CardDescription>Manage your saved cards</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {methods.length === 0 && (
                <p className="text-gray-500">No saved payment methods</p>
              )}

              {methods.map((m: any) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-[#bf2026]" />
                    </div>

                    <div>
                      <h4 className="text-[#1d4d6a] mb-1">{m.displayName}</h4>
                      <p className="text-sm text-gray-500">{m.expiry}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {m.isDefault && (
                      <Badge className="bg-green-100 text-green-700">Default</Badge>
                    )}
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              ))}

              <Button className="w-full mt-4 border-2 border-dashed border-gray-300 bg-transparent text-gray-700 hover:border-[#bf2026] hover:text-[#bf2026] hover:bg-transparent">
                + Add New Payment Method
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
function loadData() {
  throw new Error('Function not implemented.');
}
