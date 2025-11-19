import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { User, Lock, Bell, Settings, Palette, Shield } from 'lucide-react';

export function ProfileSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1">Profile Settings</h2>
        <p className="text-sm text-gray-500">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Personal Information</CardTitle>
              <CardDescription>Update your personal details and profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="bg-[#1d4d6a] text-white text-2xl">AR</AvatarFallback>
                </Avatar>
                <div>
                  <Button className="bg-[#bf2026] hover:bg-[#a01c22] text-white mb-2">
                    Upload New Photo
                  </Button>
                  <p className="text-xs text-gray-500">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input defaultValue="Alex" />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input defaultValue="Rodriguez" />
                </div>
              </div>

              <div>
                <Label>Email Address</Label>
                <Input type="email" defaultValue="alex.rodriguez@email.com" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone Number</Label>
                  <Input defaultValue="+1 (555) 123-4567" />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" defaultValue="1998-05-15" />
                </div>
              </div>

              <div>
                <Label>Institution</Label>
                <Input defaultValue="Massachusetts Institute of Technology" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Field of Study</Label>
                  <Input defaultValue="Computer Science" />
                </div>
                <div>
                  <Label>Academic Level</Label>
                  <Input defaultValue="Graduate" />
                </div>
              </div>

              <div>
                <Label>Bio</Label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#bf2026] focus:border-transparent min-h-[100px]"
                  defaultValue="Graduate student studying machine learning and artificial intelligence."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-[#bf2026] hover:bg-[#a01c22] text-white">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-6 space-y-4">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <Input type="password" />
              </div>
              <div>
                <Label>New Password</Label>
                <Input type="password" />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input type="password" />
              </div>
              <Button className="bg-[#bf2026] hover:bg-[#a01c22] text-white">
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-[#1d4d6a] mb-1">Authenticator App</h4>
                  <p className="text-sm text-gray-500">Use an authenticator app for 2FA</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-[#1d4d6a] mb-1">SMS Authentication</h4>
                  <p className="text-sm text-gray-500">Receive codes via text message</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Active Sessions</CardTitle>
              <CardDescription>Manage your active login sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-[#1d4d6a] mb-1">MacBook Pro - Chrome</h4>
                  <p className="text-sm text-gray-500">Cambridge, MA • Active now</p>
                </div>
                <Button variant="outline" size="sm">Current</Button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-[#1d4d6a] mb-1">iPhone - Safari</h4>
                  <p className="text-sm text-gray-500">Cambridge, MA • 2 hours ago</p>
                </div>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">Revoke</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences */}
        <TabsContent value="preferences" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Reading Preferences</CardTitle>
              <CardDescription>Customize your reading experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-[#1d4d6a] mb-1">Default Reading Theme</h4>
                  <p className="text-sm text-gray-500">Choose your preferred reading mode</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-white">
                    ☀️ Light
                  </Button>
                  <Button variant="outline" size="sm">
                    🌙 Dark
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-[#1d4d6a] mb-1">Auto-save Progress</h4>
                  <p className="text-sm text-gray-500">Automatically save your reading position</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-[#1d4d6a] mb-1">Sync Highlights</h4>
                  <p className="text-sm text-gray-500">Sync your highlights across devices</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-[#1d4d6a] mb-1">Reading Reminders</h4>
                  <p className="text-sm text-gray-500">Get daily reading reminders</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md mt-4">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Language & Region</CardTitle>
              <CardDescription>Set your language and timezone preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Language</Label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#bf2026] focus:border-transparent">
                  <option>English (US)</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>
              <div>
                <Label>Timezone</Label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#bf2026] focus:border-transparent">
                  <option>Eastern Time (ET)</option>
                  <option>Pacific Time (PT)</option>
                  <option>Central Time (CT)</option>
                  <option>Mountain Time (MT)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-[#1d4d6a] mb-3">Email Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">New book recommendations</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Test reminders</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Writing service updates</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Marketing emails</span>
                    <Switch />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-[#1d4d6a] mb-3">Push Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Reading streak reminders</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Test score notifications</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">Job alerts</span>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
