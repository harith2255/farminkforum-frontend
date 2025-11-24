import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DollarSign, TrendingUp, CreditCard, Download, IndianRupee } from 'lucide-react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import * as React from 'react';

export function PaymentsAdmin() {
  const [stats, setStats] = useState<any[]>([]);          // ✅ FIXED
  const [transactions, setTransactions] = useState<any[]>([]);  // ✅ FIXED


 useEffect(() => {
    const loadPayments = async () => {
      try {
       const token = localStorage.getItem("token");
console.log("TOKEN SENT:", token);


        /* ---------------------------
           1️⃣ Fetch Payment Stats
        --------------------------- */
        console.log("▶ Fetching Stats...");
        
        const statsRes = await axios.get(
          "https://ebook-backend-lxce.onrender.com/api/admin/payments/stats",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("📊 Stats Response:", statsRes.data);

        /* ---------------------------
           2️⃣ Fetch Transactions
        --------------------------- */
        console.log("▶ Fetching Transactions...");
        const txnRes = await axios.get(
          "https://ebook-backend-lxce.onrender.com/api/admin/payments/transactions",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("📦 Raw Transactions Response:", txnRes.data);

        if (!txnRes.data || !Array.isArray(txnRes.data.transactions)) {
          console.error("❌ transactions is NOT an array:", txnRes.data);
        } else {
          console.log("🔎 transactions array length:", txnRes.data.transactions.length);

          // Log the first item for shape debugging
          if (txnRes.data.transactions[0]) {
            console.log("🧩 First transaction object:", txnRes.data.transactions[0]);
          }
        }

        /* ---------------------------
           3️⃣ Set State
        --------------------------- */
        setStats(statsRes.data.stats);
        setTransactions(txnRes.data.transactions);

      }  catch (error: any) {
  console.error("❌ Payment Load Error:", error);

  if (error.response) {
    console.error("⚠ Backend Error Response:", error.response.data);
    console.error("⚠ Backend Status:", error.response.status);
  } else {
    console.error("⚠ No backend response:", error.message);
  }
}

    };

    loadPayments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1d4d6a] mb-1">Payment Management</h2>
          <p className="text-sm text-gray-500">Monitor revenue and transactions</p>
        </div>
        <Button className="bg-[#bf2026] hover:bg-[#a01c22] text-white gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* ---------- Stats Section ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <h3 className="text-[#1d4d6a] mb-1">{stat.value}</h3>
                  <p className="text-xs text-green-600">{stat.change}</p>
                </div>
                <div className="w-12 h-12 bg-opacity-10 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-[#bf2026]" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ---------- Transactions Section ---------- */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Recent Transactions</CardTitle>
          <CardDescription>Latest payment activity</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {transactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-[#1d4d6a]">{txn.id}</h4>

                    <Badge
                      className={
                        txn.status === 'Completed'
                          ? 'bg-green-100 text-green-700'
                          : txn.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }
                    >
                      {txn.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-500">
                    {txn.user} • {txn.type} • {new Date(txn.date).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[#1d4d6a]">{txn.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}