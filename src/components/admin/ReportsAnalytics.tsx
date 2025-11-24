import { useEffect, useState } from "react";
import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Download, FileText } from 'lucide-react';

import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import * as React from "react";

export function ReportsAnalytics() {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // --------------------------------------------
  // Fetch Analytics (Revenue, Users, Books)
  // --------------------------------------------
  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(
        "https://ebook-backend-lxce.onrender.com/api/admin/reports/analytics",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAnalytics(res.data.analytics || []);
    } catch (err) {
      console.error("Analytics error:", err);
    }
  };

  // --------------------------------------------
  // Fetch Generated Reports
  // --------------------------------------------
  const fetchReports = async () => {
    try {
      const res = await axios.get(
        "https://ebook-backend-lxce.onrender.com/api/admin/reports",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReports(res.data.reports || []);
    } catch (err) {
      console.error("Reports fetch error:", err);
    }
  };

  // --------------------------------------------
  // Generate New Report
  // --------------------------------------------
  const generateNewReport = async () => {
    try {
      const res = await axios.post(
        "https://ebook-backend-lxce.onrender.com/api/admin/reports/generate",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Report generated successfully!");
      fetchReports(); // refresh report list
    } catch (err) {
      console.error("Generate report error:", err);
      alert("Failed to generate report");
    }
  };

  // --------------------------------------------
  // Download Report
  // --------------------------------------------
  const downloadReport = async (id: string) => {
  const token = localStorage.getItem("token");

  try {
    const res = await axios.get(
      `https://ebook-backend-lxce.onrender.com/api/admin/reports/${id}/download`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob"
      }
    );

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${id}.csv`;
    a.click();
  } catch (err) {
    console.error("Download error:", err);
  }
};


  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchAnalytics();
      await fetchReports();
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <p className="text-center py-6 text-gray-500">Loading reports...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1">Reports & Analytics</h2>
        <p className="text-sm text-gray-500">Generate and download platform reports</p>
      </div>

      {/* ---------------------------- */}
      {/* Line Chart: Revenue vs Users */}
      {/* ---------------------------- */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Revenue vs User Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />

              <Line type="monotone" dataKey="revenue" stroke="#bf2026" strokeWidth={2} name="Revenue (₹)" />
              <Line type="monotone" dataKey="users" stroke="#1d4d6a" strokeWidth={2} name="New Users" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ---------------------------- */}
      {/* Bar Chart: Books Sold */}
      {/* ---------------------------- */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Books Sold by Month</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />

              <Bar dataKey="books" fill="#bf2026" name="Books Sold" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ---------------------------- */}
      {/* Generated Reports Section   */}
      {/* ---------------------------- */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#1d4d6a]">Generated Reports</CardTitle>
            <Button
              className="bg-[#bf2026] hover:bg-[#a01c22] text-white"
              onClick={generateNewReport}
            >
              Generate New Report
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {reports.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-opacity-10 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#bf2026]" />
                  </div>

                  <div>
                    <h4 className="text-[#1d4d6a] mb-1">{r.name}</h4>
                    <p className="text-sm text-gray-500">
                      {r.description} • {r.format} • Generated{" "}
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => downloadReport(r.id)}
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}