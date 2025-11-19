import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Settings, Database, Key, Users as UsersIcon } from 'lucide-react';

export function SystemSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1">System Settings</h2>
        <p className="text-sm text-gray-500">Configure platform settings and integrations</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-4">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Platform Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Platform Name</Label>
                <Input defaultValue="FarmInk Forum" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Support Email</Label>
                  <Input defaultValue="support@farminckforum.com" />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input defaultValue="+91-9876-543210" />
                </div>
              </div>
              <div>
                <Label>Default Currency</Label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                  <option>INR (₹)</option>
                </select>
              </div>

              <Button className="bg-[#bf2026] hover:bg-[#a01c22] text-white">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Feature Toggles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">User Registrations</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Content Upload</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Maintenance Mode</span>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Payment Integrations</CardTitle>
              <CardDescription>Configure payment gateways</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-[#1d4d6a] mb-1">Stripe</h4>
                  <p className="text-sm text-gray-500">Credit card processing</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-green-600">Connected</span>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-[#1d4d6a] mb-1">Razorpay</h4>
                  <p className="text-sm text-gray-500">India-based payments</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-green-600">Connected</span>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Automated Backups</CardTitle>
              <CardDescription>Configure backup schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-[#1d4d6a] mb-1">Daily Backups</h4>
                  <p className="text-sm text-gray-500">Last backup: 2024-03-20 02:00 AM</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div>
                <Label>Backup Retention (Days)</Label>
                <Input type="number" defaultValue="30" />
              </div>
              <Button className="bg-[#bf2026] hover:bg-[#a01c22] text-white">
                Create Backup Now
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">User Roles</CardTitle>
              <CardDescription>Manage permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { role: 'Super Admin', users: 2, permissions: 'Full Access' },
                { role: 'Content Manager', users: 5, permissions: 'Content, DRM' },
                { role: 'Support', users: 12, permissions: 'Customers, Tickets' },
              ].map((role, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-[#1d4d6a] mb-1">{role.role}</h4>
                    <p className="text-sm text-gray-500">{role.users} users • {role.permissions}</p>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              ))}
              <Button className="w-full border-2 border-dashed border-gray-300 bg-transparent text-gray-700 hover:border-[#bf2026] hover:text-[#bf2026] hover:bg-transparent">
                + Add New Role
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
