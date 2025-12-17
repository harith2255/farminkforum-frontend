import { useEffect, useState, useMemo } from "react";
import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Download, FileText } from "lucide-react";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as React from "react";

export default function ReportsAnalytics() {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);

  const token = localStorage.getItem("token");

  /* ---------------- FETCH ANALYTICS ---------------- */
  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(
        "https://ebook-backend-lxce.onrender.com/api/admin/reports/analytics",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalytics(res.data.analytics || []);
    } catch (err) {
      console.error("Analytics error:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  /* ---------------- FETCH REPORTS ---------------- */
  const fetchReports = async () => {
    try {
      const res = await axios.get(
        "https://ebook-backend-lxce.onrender.com/api/admin/reports",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports(res.data.reports || []);
    } catch (err) {
      console.error("Reports fetch error:", err);
    } finally {
      setLoadingReports(false);
    }
  };

  /* ---------------- GENERATE REPORT ---------------- */
  const generateNewReport = async () => {
    try {
      await axios.post(
        "https://ebook-backend-lxce.onrender.com/api/admin/reports/generate",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Report generated successfully!");
      fetchReports();
    } catch (err) {
      console.error("Generate report error:", err);
      alert("Failed to generate report");
    }
  };

  /* ---------------- DOWNLOAD REPORT ---------------- */
  const downloadReport = async (id: string) => {
    try {
      const res = await axios.get(
        `https://ebook-backend-lxce.onrender.com/api/admin/reports/${id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${id}.csv`;
      a.click();
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  /* ---------------- INITIAL LOAD (PARALLEL) ---------------- */
  useEffect(() => {
    fetchAnalytics();
    fetchReports();
  }, []);

  /* ---------------- MEMOIZED CHART DATA ---------------- */
  const chartData = useMemo(() => analytics, [analytics]);

  /* ---------------- BLOCK ONLY CHARTS ---------------- */
  if (loadingAnalytics) {
    return (
      <p className="text-center py-6 text-gray-500">
        Loading analytics...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1">Reports & Analytics</h2>
        <p className="text-sm text-gray-500">
          Generate and download platform reports
        </p>
      </div>

      {/* -------- Revenue vs Users -------- */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">
            Revenue vs User Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line dataKey="revenue" stroke="#bf2026" strokeWidth={2} />
              <Line dataKey="users" stroke="#1d4d6a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* -------- Books Sold -------- */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Books Sold by Month</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="books" fill="#bf2026" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* -------- Reports -------- */}
      <Card className="border-none shadow-md">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-[#1d4d6a]">Generated Reports</CardTitle>
          <Button
            className="bg-[#bf2026] text-white"
            onClick={generateNewReport}
          >
            Generate New Report
          </Button>
        </CardHeader>

        <CardContent>
          {loadingReports ? (
            <p className="text-sm text-gray-500">Loading reports...</p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#bf2026]" />
                    <div>
                      <p className="text-[#1d4d6a]">{r.name}</p>
                      <p className="text-xs text-gray-500">
                        {r.format} •{" "}
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadReport(r.id)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}