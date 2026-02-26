import React, { useEffect, useState, useMemo } from "react";
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

export default function AdminDashboardHome() {
  const [kpis, setKpis] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const [activityPage, setActivityPage] = useState(1);
  const [activityInfo, setActivityInfo] = useState({ page: 1, totalPages: 1 });

  /* =====================================================
     MEMO (MUST BE BEFORE RETURN)
  ===================================================== */
  const kpiData = useMemo(() => {
    if (!kpis) return [];

    return [
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
  }, [kpis]);

  /* =====================================================
     FETCHES
  ===================================================== */
  const fetchOverview = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "e-book-backend-production.up.railway.app/api/admin/dashboard",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setKpis(res.data.kpis);
      setChartData(res.data.chartData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchActivity = async () => {
    try {
      setLoadingActivity(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `e-book-backend-production.up.railway.app/api/admin/dashboard?page=${activityPage}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRecentActivity(res.data.recentActivity || []);
      setActivityInfo(res.data.activityPagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [activityPage]);

  /* =====================================================
     SAFE EARLY RETURN
  ===================================================== */
  if (loadingOverview || !kpis) {
    return (
      <div className="flex justify-center py-10 text-gray-600">
        Loading dashboard...
      </div>
    );
  }
return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <Card
            key={index}
            className="border-none shadow-md hover:shadow-lg transition-all"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">{kpi.label}</p>
                  <h3 className="text-[#1d4d6a] mb-2">{kpi.value}</h3>

                  <div
                    className={`flex items-center gap-1 text-xs ${
                      kpi.change >= 0 ? "text-green-600" : "text-red-600"
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

               <div
  className={`w-12 h-12 ${kpi.color} bg-opacity-10 rounded-lg flex items-center justify-center`}
>
  <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
</div>

              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue & Growth Chart */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">
            Revenue & User Growth
          </CardTitle>
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

      {/* Recent Activity with Pagination */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Recent Activity</CardTitle>
          <CardDescription>Latest platform events</CardDescription>
        </CardHeader>

        <CardContent>
 <div className="space-y-4">
  {loadingActivity ? (
    <p className="text-sm text-gray-500">Loading activity...</p>
  ) : recentActivity.length === 0 ? (
    <p className="text-sm text-gray-400">No recent activity</p>
  ) : (
    recentActivity.map((activity) => (
      <div
        key={activity.id || activity.created_at} // ✅ stable key
        className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0"
      >
        {/* indicator */}
        <div
          className={`w-2 h-2 rounded-full mt-2 ${
            activity.type === "subscription"
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

        {/* content */}
        <div className="flex-1">
          <p className="text-sm text-[#1d4d6a]">
            <span className="font-medium">
              {activity.user_name || "User"}
            </span>{" "}
            {activity.action}
          </p>

          <p className="text-xs text-gray-500">
            {new Date(activity.created_at).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}
          </p>
        </div>
      </div>
    ))
  )}
</div>


          {/* Pagination Buttons */}
          <div className="flex items-center justify-between pt-6">
            <button
            type="button"
              disabled={activityPage === 1}
              onClick={() => setActivityPage(activityPage - 1)}
              className="px-4 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>

            <p className="text-sm text-gray-600">
              Page {activityInfo.page} of {activityInfo.totalPages}
            </p>

            <button
             type="button"
              disabled={activityPage === activityInfo.totalPages}
              onClick={() => setActivityPage(activityPage + 1)}
              className="px-4 py-2 bg-gray-200 rounded-md text-sm hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}