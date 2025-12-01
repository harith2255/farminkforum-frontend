import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import {
  Users,
  BookOpen,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  IndianRupee,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function AdminDashboardHome() {
  const [kpis, setKpis] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);


  function formatActivity(activity: any) {
    const { user_name, action_type, meta } = activity;

    switch (action_type) {
      case "upload_book":
        return `${user_name} uploaded a book "${meta?.title}"`;

      case "subscribe":
        return `${user_name} subscribed to a ${meta?.plan}`;

      case "subscription_activate":
        return `${user_name} activated a ${meta?.plan}`;

      case "renew_subscription":
        return `${user_name} renewed their ${meta?.plan}`;

      case "purchase_book":
        return `${user_name} purchased the book "${meta?.title}"`;

      case "publish_notes":
        return `${user_name} published study notes for "${meta?.subject}"`;

      case "update_content":
        return `${user_name} updated content in category "${meta?.category}"`;

      case "checkout_resource":
        return `${user_name} checked out a resource from ${meta?.category}`;

      case "login":
        return `${user_name} logged in`;

      case "signin":
        return `${user_name} signed in`;

      default:
        return `${user_name} performed an action`;
    }
  }



  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching analytics with token:", token);
      const res = await axios.get(
        "https://ebook-backend-lxce.onrender.com/api/admin/dashboard",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setKpis(res.data.kpis);
      setChartData(res.data.chartData);
      setRecentActivity(res.data.recentActivity);
    } catch (err) {
      console.error("Analytics Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !kpis) {
    return <div className="flex justify-center py-10 text-gray-600">Loading...</div>;
  }

  const kpiData = [
    {
      label: "Total Users",
      value: kpis.totalUsers,
      change: kpis.userGrowthPercent,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Active Subscriptions",
      value: kpis.activeSubs,
      change: kpis.subsGrowthPercent,
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Books Sold",
      value: kpis.booksSold,
      change: kpis.booksGrowthPercent,
      icon: BookOpen,
      color: "text-purple-500",
    },
    {
      label: "Revenue (MTD)",
      value: `₹${kpis.revenueMTD}`,
      change: kpis.revenueGrowthPercent,
      icon: IndianRupee,
      color: "text-red-500",
    },
  ];




  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="border-none shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">{kpi.label}</p>
                  <h3 className="text-[#1d4d6a] mb-2">{kpi.value}</h3>

                  <div
                    className={`flex items-center gap-1 text-xs ${kpi.change >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {kpi.change >= 0 ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    <span>{Math.abs(kpi.change)}%</span>
                  </div>

                </div>

                <div className="w-12 h-12 bg-opacity-10 rounded-lg flex items-center justify-center">
                  <kpi.icon className={`w-6 h-6 ${kpi.color.replace("bg-", "text-")}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Trend */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Revenue & User Growth</CardTitle>
          <CardDescription>6-month trend analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
              <Tooltip />
              <Legend />

              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#bf2026"
                strokeWidth={2}
                name="Revenue (₹)"
              />

              <Line
                yAxisId="right"
                type="monotone"
                dataKey="users"
                stroke="#1d4d6a"
                strokeWidth={2}
                name="New Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Recent Activity</CardTitle>
          <CardDescription>Latest platform events</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                <div
                  className={`w-2 h-2 rounded-full mt-2 ${activity.type === "subscription"
                      ? "bg-green-500"
                      : activity.type === "activity"
                        ? "bg-blue-500"
                        : activity.type === "content"
                          ? "bg-purple-500"
                          : activity.type === "service"
                            ? "bg-orange-500"
                            : "bg-gray-500"
                    }`}
                />
                <div className="flex-1">
                  <p className="text-sm text-[#1d4d6a]">
                    <span>{activity.user_name}</span> {activity.action}
                  </p>

                  <p className="text-xs text-gray-500">
                    {new Date(activity.created_at).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                    })}
                  </p>

                </div>


              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}