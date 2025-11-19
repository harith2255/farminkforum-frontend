import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Download, FileText, BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ReportsAnalytics() {
  const monthlyData = [
    { month: 'Jan', users: 320, revenue: 45000, books: 1200 },
    { month: 'Feb', revenue: 52000, users: 410, books: 1450 },
    { month: 'Mar', revenue: 48000, users: 380, books: 1300 },
    { month: 'Apr', revenue: 61000, users: 520, books: 1680 },
    { month: 'May', revenue: 75000, users: 630, books: 2100 },
    { month: 'Jun', revenue: 88000, users: 720, books: 2450 },
  ];

  const reports = [
    { name: 'Monthly Revenue Report', description: 'Detailed revenue breakdown', format: 'PDF', lastGenerated: '2024-03-20' },
    { name: 'User Engagement Analytics', description: 'User activity and engagement metrics', format: 'CSV', lastGenerated: '2024-03-19' },
    { name: 'Content Performance', description: 'Top performing books and notes', format: 'PDF', lastGenerated: '2024-03-18' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1">Reports & Analytics</h2>
        <p className="text-sm text-gray-500">Generate and download platform reports</p>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Revenue vs User Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
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

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Books Sold by Month</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
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

      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#1d4d6a]">Generated Reports</CardTitle>
            <Button className="bg-[#bf2026] hover:bg-[#a01c22] text-white">
              Generate New Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12  bg-opacity-10 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-[#bf2026]" />
                  </div>
                  <div>
                    <h4 className="text-[#1d4d6a] mb-1">{report.name}</h4>
                    <p className="text-sm text-gray-500">
                      {report.description} • {report.format} • Generated {new Date(report.lastGenerated).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
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
