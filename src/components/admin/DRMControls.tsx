import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Shield, Download, Copy, Eye } from 'lucide-react';

type DRMSettings = {
  copy_protection: boolean;
  watermarking: boolean;
  device_limit: number;
  screenshot_prevention: boolean;
};

export function DRMControls() {
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

  const token = localStorage.getItem("token");
  useEffect(() => {
    (async () => {
      try {
        const s = await axios.get("https://ebook-backend-lxce.onrender.com/api/admin/drm/settings", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const logs = await axios.get("https://ebook-backend-lxce.onrender.com/api/admin/drm/access-logs?limit=50", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const lic = await axios.get("https://ebook-backend-lxce.onrender.com/api/admin/drm/licenses", {
          headers: { Authorization: `Bearer ${token}` }
        });

        setSettings(s.data.settings);
        setAccessLogs(logs.data.logs);
        setLicenses(lic.data.licenses);
        setLoading(false);
      } catch (err) {
        console.error("DRM load error:", err);
      }
    })();
  }, []);

  const saveSettings = async (newSet: Partial<DRMSettings>) => {
  const updated = { ...settings, ...newSet };
  setSettings(updated);

  setSaving(true);
  await axios.put(
    "https://ebook-backend-lxce.onrender.com/api/admin/drm/settings",
    { settings: updated },  // <-- FIXED
    { headers: { Authorization: `Bearer ${token}` } }
  );
  setSaving(false);
};


  const changeDeviceLimit = (d: number) =>
    saveSettings({ device_limit: Math.max(1, settings.device_limit + d) });

  const addWatermark = async () => {
    setSaving(true);
    const r = await axios.post(
      "https://ebook-backend-lxce.onrender.com/api/admin/drm/watermark",
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert(r.data.message);
    setSaving(false);
  };

  const downloadReport = async () => {
    const res = await axios.get(
      "https://ebook-backend-lxce.onrender.com/api/admin/drm/report",
      { responseType: "blob", headers: { Authorization: `Bearer ${token}` } }
    );

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = `access-report-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const revokeUserAccess = async () => {
    const uid = prompt("Enter user id:");
    if (!uid) return;

    const r = await axios.post(
      "https://ebook-backend-lxce.onrender.com/api/admin/drm/revoke",
      { user_id: uid.trim() },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert(r.data.message);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1">DRM Controls</h2>
        <p className="text-sm text-gray-500">Manage digital rights and access controls</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-[#1d4d6a]">Protection Settings</CardTitle>
            <CardDescription>Configure DRM rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-[#1d4d6a] mb-1">Copy Protection</h4>
                <p className="text-sm text-gray-500">Prevent text copying</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-[#1d4d6a] mb-1">Watermarking</h4>
                <p className="text-sm text-gray-500">Add user watermarks</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-[#1d4d6a] mb-1">Device Limit</h4>
                <p className="text-sm text-gray-500">Max 3 devices per user</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-[#1d4d6a] mb-1">Screenshot Prevention</h4>
                <p className="text-sm text-gray-500">Block screenshots</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-[#1d4d6a]">Quick Actions</CardTitle>
            <CardDescription>Manage watermarks and licenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-[#bf2026] hover:bg-[#a01c22] text-white">
              <Shield className="w-4 h-4 mr-2" />
              Add Watermark to Book
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Eye className="w-4 h-4 mr-2" />
              View Active Licenses
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Download Access Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Copy className="w-4 h-4 mr-2" />
              Revoke User Access
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Recent Access Logs</CardTitle>
          <CardDescription>Monitor content access in real-time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {accessLogs.map((log, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-[#1d4d6a] mb-1">{log.user}</h4>
                  <p className="text-sm text-gray-500">
                    {log.action}: "{log.book}" • {log.device} • IP: {log.ip}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className="bg-blue-100 text-blue-700">{log.action}</Badge>
                  <p className="text-xs text-gray-500 mt-1">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}