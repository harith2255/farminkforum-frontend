import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import axios from "axios";
import { IntegrationModal } from "./IntegrationModel";

export default function SystemSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  /* -----------------------------
      FETCH SETTINGS + INTEGRATIONS
  ----------------------------- */
  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const settingsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const integrationsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/settings/integrations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSettings(settingsRes.data.settings);
      setIntegrations(integrationsRes.data.integrations);
    } catch (err) {
      console.error("Settings Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <p>Loading...</p>;

  /* -----------------------------
      UPDATE SYSTEM SETTINGS
  ----------------------------- */
  const saveSettings = async () => {
    const token = localStorage.getItem("token");
    await axios.put(
      `${import.meta.env.VITE_API_URL}/api/admin/settings`,
      settings,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Settings updated!");
  };

  /* -----------------------------
      CHANGE ADMIN PASSWORD
  ----------------------------- */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordError("Both fields are required");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/settings/password`,
        { current_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordSuccess("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPasswordError(err.response?.data?.error || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-[#1d4d6a] mb-1">System Settings</h2>
      <p className="text-sm text-gray-500">Configure platform settings and integrations</p>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* GENERAL SETTINGS */}
        <TabsContent value="general" className="mt-6 space-y-4">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Platform Configuration</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <Label>Platform Name</Label>
                <Input
                  value={settings.platform_name}
                  onChange={(e) =>
                    setSettings({ ...settings, platform_name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Support Email</Label>
                  <Input
                    value={settings.support_email}
                    onChange={(e) =>
                      setSettings({ ...settings, support_email: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    value={settings.support_phone}
                    onChange={(e) =>
                      setSettings({ ...settings, support_phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Default Currency</Label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={settings.default_currency}
                  onChange={(e) =>
                    setSettings({ ...settings, default_currency: e.target.value })
                  }
                >
                  <option>INR (₹)</option>
                </select>
              </div>

              <Button className="bg-[#bf2026] text-white" onClick={saveSettings}>
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md mt-6">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Change Admin Password</CardTitle>
              <CardDescription>Update your administrator password. This will override the default one-time setup password.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                {passwordError && <p className="text-red-500 text-sm font-medium">{passwordError}</p>}
                {passwordSuccess && <p className="text-green-600 text-sm font-medium">{passwordSuccess}</p>}
                
                <div>
                  <Label>Current Password</Label>
                  <Input 
                    type="password" 
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)} 
                    placeholder="Enter current password"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>New Password</Label>
                  <Input 
                    type="password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    placeholder="Enter new password (min 6 chars)"
                    className="mt-1"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="bg-[#1d4d6a] text-white hover:bg-[#163b52] mt-2" 
                  disabled={passwordLoading}
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INTEGRATIONS */}
        <TabsContent value="integrations" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Payment Integrations</CardTitle>
              <CardDescription>Configure payment gateways</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {integrations.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <h4 className="text-[#1d4d6a] mb-1">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedIntegration(item);
                      setShowModal(true);
                    }}
                  >
                    Configure
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* MODAL */}
          <IntegrationModal
            open={showModal}
            onClose={() => setShowModal(false)}
            integration={selectedIntegration}
            refresh={loadData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}