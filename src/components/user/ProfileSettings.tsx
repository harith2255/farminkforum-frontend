import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { User, Lock, Bell, Settings, Palette, Shield } from 'lucide-react';
import axios, { AxiosResponse } from "axios";
import * as React from "react";
import { useState, useRef, useEffect } from "react";


const API = "https://ebook-backend-lxce.onrender.com/api/profile";

type Profile = {
  id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  dob?: string; // yyyy-mm-dd
  institution?: string;
  field_of_study?: string;
  academic_level?: string;
  bio?: string;
  avatar_url?: string;
  // optional json columns (depends on your db)
  email_notifications?: any;
  push_notifications?: any;
  // other fields...
};

type NotificationsShape = {
  // email notifications object
  email_notifications?: {
    recommendations?: boolean;
    test_reminders?: boolean;
    writing_updates?: boolean;
    marketing?: boolean;
  };
  // push notifications object
  push_notifications?: {
    reading_streak?: boolean;
    test_scores?: boolean;
    job_alerts?: boolean;
  };
};

type SecurityShape = {
  two_factor_enabled?: boolean;
  method?: string;
};

type SessionItem = {
  id: string;
  device?: string;
  location?: string;
  last_active?: string;
  active?: boolean;
  user_agent?: string;
};

export const ProfileSettings: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<NotificationsShape>({});
  const [security, setSecurity] = useState<SecurityShape>({});
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  // password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  // small ui messages
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // helper to add Authorization header
const getValidToken = () => {
  // try Supabase session first
  const session = JSON.parse(localStorage.getItem("session") || "{}");

  return session?.access_token || localStorage.getItem("token");
};

const token = getValidToken();


  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res: AxiosResponse<any> = await axios.get(API, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Backend expected structure: { profile, notifications, security }
        const serverProfile: Profile = res.data.profile || null;
        const serverNotifications: NotificationsShape = res.data.notifications || {};
        const serverSecurity: SecurityShape = res.data.security || {};

        setProfile(serverProfile);
        setNotifications(serverNotifications);
        setSecurity(serverSecurity);

        // load sessions
        await loadSessions();
      } catch (err: any) {
        console.error("Profile load error:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------
     SESSIONS
  ------------------------- */
  const loadSessions = async () => {
    try {
      const res: AxiosResponse<SessionItem[]> = await axios.get(`${API}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSessions(res.data || []);
    } catch (err) {
      console.error("Failed to load sessions", err);
    }
  };

  const revoke = async (sessionId: string) => {
    try {
      await axios.delete(`${API}/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // refresh
      await loadSessions();
      setMessage("Session revoked");
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Failed to revoke session", err);
      setError("Could not revoke session");
    }
  };

  /* -------------------------
     AVATAR UPLOAD
  ------------------------- */
  const onUploadClick = () => {
    if (avatarInputRef.current) avatarInputRef.current.click();
  };

  const uploadAvatarFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Max avatar size is 2MB");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await axios.post(`${API}/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // backend returns { message, avatar_url }
      setProfile((prev) => ({ ...(prev || {}), avatar_url: res.data.avatar_url }));
      setMessage("Avatar updated");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Avatar upload failed", err);
      setError("Failed to upload avatar");
    }
  };

  /* -------------------------
     UPDATE PERSONAL INFO (Manual Save)
  ------------------------- */
  const updatePersonalInfo = async () => {
    if (!profile) return;
    setError(null);
    try {
      const payload = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        dob: profile.dob,
        institution: profile.institution,
        field_of_study: profile.field_of_study,
        academic_level: profile.academic_level,
        bio: profile.bio,
      };

      const res = await axios.put(API, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // backend returns { message, profile }
      setProfile(res.data.profile || profile);
      setMessage("Profile updated");
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Failed to update profile", err);
      setError(err?.response?.data?.error || "Could not update profile");
    }
  };

  /* -------------------------
     CHANGE PASSWORD
  ------------------------- */
  const changePassword = async () => {
    setError(null);
    if (!newPassword) {
      setError("Enter a new password");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await axios.put(
        `${API}/security/password`,
        { new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Password change failed", err);
      setError(err?.response?.data?.error || "Failed to change password");
    }
  };

  /* -------------------------
     NOTIFICATIONS (Auto-save)
     We send an object to backend: { email_notifications, push_notifications }
     Backend must accept JSON in those fields (supabase jsonb or text)
  ------------------------- */
  const updateNotifSettings = async (payload: NotificationsShape) => {
    try {
      // optimistic update was already done in UI
      await axios.put(`${API}/notifications`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Notification settings saved");
      setTimeout(() => setMessage(null), 2000);
    } catch (err: any) {
      console.error("Failed to save notifications", err);
      setError(err?.response?.data?.error || "Failed to save notification settings");
    }
  };

  // helper for toggles
  const handleEmailToggle = (key: keyof NonNullable<NotificationsShape["email_notifications"]>) => {
    const prevEmail = notifications.email_notifications || {};
    const updated = { ...prevEmail, [key]: !prevEmail[key] };
    const newNotifications = { ...notifications, email_notifications: updated };
    setNotifications(newNotifications);
    updateNotifSettings({ email_notifications: updated, push_notifications: notifications.push_notifications });
  };

  const handlePushToggle = (key: keyof NonNullable<NotificationsShape["push_notifications"]>) => {
    const prevPush = notifications.push_notifications || {};
    const updated = { ...prevPush, [key]: !prevPush[key] };
    const newNotifications = { ...notifications, push_notifications: updated };
    setNotifications(newNotifications);
    updateNotifSettings({ email_notifications: notifications.email_notifications, push_notifications: updated });
  };

  /* -------------------------
     PREFERENCES (Auto-save)
  ------------------------- */
  const updatePrefs = async (payload: Record<string, any>) => {
    try {
      await axios.put(`${API}/preferences`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Preferences saved");
      setTimeout(() => setMessage(null), 2000);
    } catch (err: any) {
      console.error("Failed to save preferences", err);
      setError(err?.response?.data?.error || "Failed to save preferences");
    }
  };

  /* -------------------------
     TWO-FACTOR (toggle)
  ------------------------- */
  const toggle2FA = async (enabled: boolean, method = "app") => {
    try {
      await axios.put(`${API}/security/2fa`, { enabled, method }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSecurity((s) => ({ ...(s || {}), two_factor_enabled: enabled, method }));
      setMessage(`Two-factor ${enabled ? "enabled" : "disabled"}`);
      setTimeout(() => setMessage(null), 2000);
    } catch (err: any) {
      console.error("Failed to toggle 2FA", err);
      setError(err?.response?.data?.error || "Failed to update two-factor settings");
    }
  };

  /* -------------------------
     Handlers for controlled inputs (profile)
  ------------------------- */
  const updateProfileField = (field: keyof Profile, value: any) => {
    setProfile((p) => ({ ...(p || {}), [field]: value }));
  };

  /* -------------------------
     UI helpers
  ------------------------- */
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatarFile(file);
    e.currentTarget.value = ""; // reset input
  };

  /* -------------------------
     RENDER
  ------------------------- */
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
  )
}

