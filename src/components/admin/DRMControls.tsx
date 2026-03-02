import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Shield, Download, Copy, Eye, Plus, Minus, Loader2 } from 'lucide-react';

type DRMSettings = {
  copy_protection: boolean;
  watermarking: boolean;
  device_limit: number;
  screenshot_prevention: boolean;
};

export default function DRMControls() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<DRMSettings>({
    copy_protection: true,
    watermarking: true,
    device_limit: 3,
    screenshot_prevention: false,
  });

  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'licenses'>('logs');

  const API_BASE = "https://e-book-backend-production.up.railway.app/api";
  const token = localStorage.getItem("token");

  const [page, setPage] = useState(1);
const limit = 10;

const loadLogs = async () => {
  const res = await axios.get(
    `https://e-book-backend-production.up.railway.app/api/admin/drm/access-logs?page=${page}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  setAccessLogs(res.data.logs);
};

useEffect(() => {
  loadLogs();
}, [page]);

  // Load initial data
  useEffect(() => {
    (async () => {
    try {
      const [s, logs, lic] = await Promise.all([
        axios.get("https://e-book-backend-production.up.railway.app/api/admin/drm/settings", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("https://e-book-backend-production.up.railway.app/api/admin/drm/access-logs", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("https://e-book-backend-production.up.railway.app/api/admin/drm/licenses", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setSettings(s.data.settings);
      setAccessLogs(logs.data.logs);
      setLicenses(lic.data.licenses);
    } catch (err) {
      console.error("DRM load error:", err);
    } finally {
      setLoading(false);
    }
  })();
}, []);

  // Save settings to backend
  const saveSettings = async (newSet: Partial<DRMSettings>) => {
    const updated = { ...settings, ...newSet };
    setSettings(updated);

    try {
      setSaving(true);
      await axios.put(
        `${API_BASE}/admin/drm/settings`,
        { settings: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Save settings error:", err);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Change device limit with +/- buttons
  const changeDeviceLimit = (delta: number) => {
    const newLimit = Math.max(1, settings.device_limit + delta);
    saveSettings({ device_limit: newLimit });
  };

  // Add watermark to a book
  const addWatermark = async () => {
    const book_id = prompt("Enter Book ID:");
    if (!book_id) return;

    try {
      setSaving(true);
      const response = await axios.post(
        `${API_BASE}/admin/drm/watermark`,
        { book_id: book_id.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(response.data.message || "Watermark job queued successfully!");
    } catch (err: any) {
      console.error("Watermark error:", err);
      alert(err.response?.data?.error || "Failed to queue watermark job");
    } finally {
      setSaving(false);
    }
  };

  // Download access report as CSV
  const downloadReport = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/admin/drm/report`,
        {
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `drm-access-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Download error:", err);
      alert(err.response?.data?.error || "Failed to download report");
    }
  };

  // Revoke user access
  const revokeUserAccess = async () => {
    const userId = prompt("Enter User ID:");
    if (!userId) return;

    if (!confirm(`Are you sure you want to revoke access for user ${userId}?`)) {
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE}/admin/drm/revoke`,
        { user_id: userId.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(response.data.message || "Access revoked successfully!");
    } catch (err: any) {
      console.error("Revoke access error:", err);
      alert(err.response?.data?.error || "Failed to revoke access");
    }
  };

  // // View active licenses
  // const viewLicenses = () => {
  //   setActiveTab('licenses');
  // };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#1d4d6a]" />
          <p className="text-gray-500">Loading DRM controls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className=" text-[#1d4d6a] mb-1">DRM Controls</h2>
          <p className="text-sm text-gray-500">Manage digital rights and access controls</p>
        </div>
        
        {saving && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving changes...
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Protection Settings */}
        <Card className="lg:col-span-2 border-none shadow-md">
          <CardHeader className="bg-gradient-to-r from-[#1d4d6a]/5 to-transparent">
            <CardTitle className="text-[#1d4d6a]">Protection Settings</CardTitle>
            <CardDescription>Configure DRM rules and restrictions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Copy Protection */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <h4 className="font-semibold text-[#1d4d6a] mb-1">Copy Protection</h4>
                <p className="text-sm text-gray-500">Prevent users from copying text from e-books</p>
              </div>
              <Switch 
                checked={settings.copy_protection}
                onCheckedChange={(checked) => saveSettings({ copy_protection: checked })}
                disabled={saving}
              />
            </div>

            {/* Watermarking */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <h4 className="font-semibold text-[#1d4d6a] mb-1">Watermarking</h4>
                <p className="text-sm text-gray-500">Embed invisible user identifiers in documents</p>
              </div>
              <Switch 
                checked={settings.watermarking}
                onCheckedChange={(checked) => saveSettings({ watermarking: checked })}
                disabled={saving}
              />
            </div>

            {/* Device Limit */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <h4 className="font-semibold text-[#1d4d6a] mb-1">Device Limit</h4>
                <p className="text-sm text-gray-500">
                  Maximum number of devices a user can access content from
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeDeviceLimit(-1)}
                  disabled={settings.device_limit <= 1 || saving}
                  className="h-8 w-8"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-[2rem] text-center font-bold text-lg text-[#1d4d6a]">
                  {settings.device_limit}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeDeviceLimit(1)}
                  disabled={saving}
                  className="h-8 w-8"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Screenshot Prevention */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <h4 className="font-semibold text-[#1d4d6a] mb-1">Screenshot Prevention</h4>
                <p className="text-sm text-gray-500">Block screenshots in mobile/web applications</p>
              </div>
              <Switch 
                checked={settings.screenshot_prevention}
                onCheckedChange={(checked) => saveSettings({ screenshot_prevention: checked })}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-none shadow-md">
          <CardHeader className="bg-gradient-to-r from-[#bf2026]/5 to-transparent">
            <CardTitle className="text-[#1d4d6a]">Quick Actions</CardTitle>
            <CardDescription>Manage watermarks and licenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <Button 
              className="w-full justify-start bg-[#bf2026] hover:bg-[#a01c22] text-white"
              onClick={addWatermark}
              disabled={saving}
            >
              <Shield className="w-4 h-4 mr-2" />
              Add Watermark to Book
            </Button>
            
            {/* <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={viewLicenses}
              disabled={saving}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Active Licenses ({licenses.length})
            </Button> */}
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={downloadReport}
              disabled={saving}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Access Report
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={revokeUserAccess}
              disabled={saving}
            >
              <Copy className="w-4 h-4 mr-2" />
              Revoke User Access
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Logs and Licenses */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex border-b">
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'logs' 
                ? 'text-[#1d4d6a] border-b-2 border-[#1d4d6a]' 
                : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('logs')}
            >
              Access Logs ({accessLogs.length})
            </button>
            {/* <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'licenses' 
                ? 'text-[#1d4d6a] border-b-2 border-[#1d4d6a]' 
                : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('licenses')}
            >
              Active Licenses ({licenses.length})
            </button> */}
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {activeTab === 'logs' ? (
            // Access Logs Tab
            <div className="space-y-4">
              {accessLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No access logs found
                </div>
              ) : (
                accessLogs.map((log, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 mb-3 sm:mb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-[#1d4d6a]">
                          {log.user_name || log.user || 'Unknown User'}
                        </h4>
                        <Badge className={
                          log.action === 'download' ? 'bg-green-100 text-green-700' :
                          log.action === 'view' ? 'bg-blue-100 text-blue-700' :
                          log.action === 'print' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {log.action || 'access'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {log.book_title && (
                          <p className="font-medium">"{log.book_title}"</p>
                        )}
                        <p className="text-xs">
                          {log.device_info && `${log.device_info} • `}
                          {log.ip_address && `IP: ${log.ip_address} • `}
                          {log.created_at && new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {log.time || (log.created_at && new Date(log.created_at).toLocaleTimeString())}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Licenses Tab
            <div className="space-y-4">
              {licenses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active licenses found
                </div>
              ) : (
                licenses.map((license, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 mb-3 sm:mb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-[#1d4d6a]">
                          {license.user_name || license.user_id || 'Unknown User'}
                        </h4>
                        <Badge className={
                          license.status === 'active' ? 'bg-green-100 text-green-700' :
                          license.status === 'expired' ? 'bg-red-100 text-red-700' :
                          license.status === 'suspended' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {license.status || 'unknown'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {license.product_name && (
                          <p className="font-medium">{license.product_name}</p>
                        )}
                        <p className="text-xs">
                          {license.license_key && `Key: ${license.license_key.substring(0, 12)}... • `}
                          {license.expires_at && `Expires: ${new Date(license.expires_at).toLocaleDateString()} • `}
                          Devices: {license.device_count || '0'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {license.created_at && (
                        <p className="text-xs text-gray-500">
                          Created: {new Date(license.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
           {/* PAGINATION */}
<div className="flex justify-between items-center mt-4">
  <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
    Prev
  </Button>

  <span className="text-sm text-gray-500">Page {page}</span>

  <Button
    variant="outline"
    disabled={accessLogs.length < limit}
    onClick={() => setPage(page + 1)}
  >
    Next
  </Button>
</div>
        </CardContent>
      </Card>
    </div>
  );
}