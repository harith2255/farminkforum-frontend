import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Download, IndianRupee, CreditCard, TrendingUp } from "lucide-react";
import axios from "axios";
import { useEffect, useState } from "react";
import * as React from "react";

const ICONS: any = {
  IndianRupee: IndianRupee,
  CreditCard: CreditCard,
  Download: Download,
  TrendingUp:TrendingUp,
};

export default function PaymentsAdmin() {
  const [stats, setStats] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  
  const page = pagination.page || 1;

  const loadPayments = async (page = 1) => {
    try {
      const token = localStorage.getItem("token");

      /* ----------------- Stats ----------------- */
      const statsRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/payments/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStats(statsRes.data.stats || []);

      /* ----------------- Transactions ----------------- */
      const txRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/payments/transactions?page=${page}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTransactions(txRes.data.transactions || []);
      setPagination(txRes.data.pagination || {});
    } catch (error: any) {
      console.error("❌ Admin Payment Load Error:", error.response?.data || error);
    }
  };

  useEffect(() => {
    loadPayments(1);
  }, []);

  /* Pagination buttons */
  const nextPage = () => {
    if (page < pagination.totalPages) loadPayments(page + 1);
  };

  const prevPage = () => {
    if (page > 1) loadPayments(page - 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1d4d6a] mb-1">Payment Management</h2>
          <p className="text-sm text-gray-500">
            Monitor revenue and user transactions
          </p>
        </div>
        <Button className="bg-[#bf2026] hover:bg-[#a01c22] text-white gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* ---------- Stats Section ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = ICONS[stat.icon];

          return (
            <Card key={index} className="border-none shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <h3 className="text-[#1d4d6a] mb-1 font-semibold text-lg">
                      {stat.value}
                    </h3>
                    <p
                      className={`text-xs`}
                    >
                      {stat.change}
                    </p>
                  </div>

                  {Icon && (
                    <div className="w-12 h-12 bg-opacity-10 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-[#bf2026]" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ---------- Transaction List ---------- */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Recent Transactions</CardTitle>
          <CardDescription>
            User payments & subscription purchases
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              {/* Left side */}
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-[#bf2026]" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-[#1d4d6a] font-semibold mb-0.5 truncate text-sm sm:text-base">
                    {tx.type || "Payment"}
                  </h4>

                  <p className="text-sm text-gray-600 flex flex-wrap items-center gap-1.5 truncate">
                    <span className="font-medium text-[#1d4d6a]">{tx.user?.name || (typeof tx.user === 'string' ? tx.user : "Unknown User")}</span>
                    {tx.user?.email && <span className="text-xs text-gray-400">({tx.user.email})</span>}
                  </p>

                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1 flex items-center gap-2">
                    {tx.date} <span className="text-gray-200">|</span> Method: {tx.method || "N/A"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[#1d4d6a] font-bold text-lg">
                  ₹{tx.amount}
                </p>

                <Badge
                  className={
                    tx.status.toLowerCase().includes("success") ||
                    tx.status.toLowerCase().includes("complete")
                      ? "bg-green-100 text-green-700"
                      : tx.status.toLowerCase().includes("pending")
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }
                >
                  {tx.status}
                </Badge>
              </div>
            </div>
          ))}

          {/* ---------- Pagination ---------- */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                disabled={page === 1}
                onClick={prevPage}
              >
                Previous
              </Button>

              <p className="text-sm text-gray-600">
                Page {page} of {pagination.totalPages}
              </p>

              <Button
                variant="secondary"
                disabled={page === pagination.totalPages}
                onClick={nextPage}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}