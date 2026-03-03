// PaymentsSubscriptions.tsx — Production-grade Purchase History
import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  CreditCard,
  Calendar,
  Loader2,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  IndianRupee,
  BookOpen,
  FileText,
  Package,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL;

/* ─── status helpers ─── */
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  paid: {
    label: "Paid",
    color: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: CheckCircle2,
  },
  captured: {
    label: "Paid",
    color: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    color: "bg-red-50 text-red-700 border border-red-200",
    icon: XCircle,
  },
};

const VISIBLE_STATUSES = ["paid", "captured", "failed"];

/* ─── item type icon ─── */
function getItemIcon(description: string) {
  const lower = (description || "").toLowerCase();
  if (lower.includes("book") || lower.includes("study material"))
    return <BookOpen className="w-5 h-5 text-[#1d4d6a]" />;
  if (lower.includes("note"))
    return <FileText className="w-5 h-5 text-[#1d4d6a]" />;
  if (lower.includes("exam") || lower.includes("mock") || lower.includes("test"))
    return <Package className="w-5 h-5 text-[#1d4d6a]" />;
  return <ShoppingBag className="w-5 h-5 text-[#1d4d6a]" />;
}

/* ─── format currency ─── */
function formatAmount(amount: any): string {
  if (!amount && amount !== 0) return "—";
  const num = typeof amount === "string" ? parseFloat(amount.replace(/[₹,]/g, "")) : Number(amount);
  if (isNaN(num)) return String(amount);
  return `₹${num.toLocaleString("en-IN")}`;
}

/* ─── format date ─── */
function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PaymentsSubscriptions({ onNavigate }: any) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios
        .get(`${API_BASE}/payments/transactions`, { headers })
        .catch(() => ({ data: [] }));

      const raw = Array.isArray(res.data) ? res.data : [];

      // Filter to only paid / captured / failed
      const filtered = raw.filter((t: any) =>
        VISIBLE_STATUSES.includes((t.status || "").toLowerCase())
      );

      setTransactions(filtered);
    } catch (err) {
      console.error("Failed to load transactions:", err);
      toast.error("Failed to load purchase history");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  /* ─── render ─── */
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div>
        <h2 className="text-[#1d4d6a] text-xl sm:text-2xl font-bold mb-1">
          Purchase History
        </h2>
        <p className="text-sm text-gray-500">
          View your past purchases and payment status
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Successful</p>
                <p className="text-xl font-bold text-[#1d4d6a]">
                  {transactions.filter((t) => ["paid", "captured"].includes((t.status || "").toLowerCase())).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Failed</p>
                <p className="text-xl font-bold text-[#1d4d6a]">
                  {transactions.filter((t) => (t.status || "").toLowerCase() === "failed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Spent</p>
                <p className="text-xl font-bold text-[#1d4d6a]">
                  {formatAmount(
                    transactions
                      .filter((t) => ["paid", "captured"].includes((t.status || "").toLowerCase()))
                      .reduce((sum: number, t: any) => {
                        const n = parseFloat(String(t.amount || "0").replace(/[₹,]/g, ""));
                        return sum + (isNaN(n) ? 0 : n);
                      }, 0)
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">All Transactions</CardTitle>
          <CardDescription>
            Only completed and failed payments are shown
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#1d4d6a] mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading purchases…</p>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-500 mb-1">
                No purchases yet
              </h3>
              <p className="text-sm text-gray-400">
                Your completed and failed transactions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((t: any, idx: number) => {
                const statusKey = (t.status || "").toLowerCase();
                const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.paid;
                const StatusIcon = cfg.icon;

                return (
                  <div
                    key={t.id ?? idx}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100/80 transition-colors"
                  >
                    {/* Left: Icon + Details */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center shrink-0">
                        {getItemIcon(t.description)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-[#1d4d6a] font-medium truncate">
                          {t.description || "Purchase"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(t.created_at || t.date)}</span>
                          {t.method && (
                            <>
                              <span>•</span>
                              <CreditCard className="w-3 h-3" />
                              <span>{t.method}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount + Status */}
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-[#1d4d6a] font-semibold">
                        {formatAmount(t.amount)}
                      </p>
                      <Badge className={`mt-1 text-xs font-medium ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info footer */}
      <div className="text-center text-xs text-gray-400 py-2">
        All payments are processed securely by Razorpay. For any payment issues,
        contact{" "}
        <a
          href="mailto:farminkforum@gmail.com"
          className="text-[#bf2026] hover:underline"
        >
          farminkforum@gmail.com
        </a>
      </div>
    </div>
  );
}