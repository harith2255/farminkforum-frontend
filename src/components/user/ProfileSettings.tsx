// ProfileSettings.tsx
import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Switch } from "../ui/switch";
import { Avatar, AvatarFallback } from "../ui/avatar";
import axios, { AxiosResponse } from "axios";
import * as React from "react";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

const API = "https://e-book-backend-production.up.railway.app/api/profile";

type Profile = {
  id?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  dob?: string;
  institution?: string;
  field_of_study?: string;
  academic_level?: string;
  bio?: string;
  avatar_url?: string;
  email_notifications?: any;
  push_notifications?: any;
};

type NotificationsShape = {
  email_notifications?: {
    recommendations?: boolean;
    test_reminders?: boolean;
    writing_updates?: boolean;
    marketing?: boolean;
  };
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
  // 🔥 IMPROVED: Loading states per section (from friend's code)
  const [loading, setLoading] = useState({
    initial: true,
    profile: false,
    sessions: false,
    avatar: false,
    personalInfo: false,
    password: false,
    notifications: false,
    preferences: false,
    twoFactor: false,
    revokingSession: false
  });

  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<NotificationsShape>({});
  const [security, setSecurity] = useState<SecurityShape>({});
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // 🔥 IMPROVED: Get token function (from friend's code)
  const getValidToken = () => {
    try {
      const sessionRaw = localStorage.getItem("session");
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (session?.access_token) return session.access_token;
      }
    } catch (err) {}

    return localStorage.getItem("token");
  };

  const authHeaders = () => {
    const token = getValidToken();
    if (!token) return {};
    return { 
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  // 🔥 ADDED: Loading spinner component (from friend's code)
  const renderSpinner = (text: string = "Loading...") => (
    <div className="flex justify-center items-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a] mb-3"></div>
        <p className="text-gray-500">{text}</p>
      </div>
    </div>
  );

  const formatTime = (iso?: string) => {
    if (!iso) return "Unknown";
  // 🔑 FORCE UTC if timezone missing
  const utcIso = iso.endsWith("Z") ? iso : `${iso}Z`;

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(utcIso));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(prev => ({ ...prev, initial: true, profile: true }));
      try {
        const res: AxiosResponse<any> = await axios.get(API, {
          headers: authHeaders(),
        });

        const serverProfile: Profile = res.data.profile || null;
        const serverNotifications: NotificationsShape = res.data.notifications || {};
        const serverSecurity: SecurityShape = res.data.security || {};

        setProfile(serverProfile);
        setNotifications(serverNotifications);
        setSecurity(serverSecurity);

        await loadSessions();
      } catch (err: any) {
        console.error("Profile load error:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(prev => ({ ...prev, initial: false, profile: false }));
      }
    };

    load();
  }, []);

  /* -------------------------
     SESSIONS
  ------------------------- */
  const loadSessions = async () => {
    try {
      setLoading(prev => ({ ...prev, sessions: true }));
      const res: AxiosResponse<SessionItem[]> = await axios.get(`${API}/sessions`, {
        headers: authHeaders(),
      });
      setSessions(res.data || []);
    } catch (err) {
      console.error("Failed to load sessions", err);
    } finally {
      setLoading(prev => ({ ...prev, sessions: false }));
    }
  };

const revoke = async (sessionId: string) => {
  try {
    const res = await axios.delete(`${API}/sessions/${sessionId}`, {
      headers: {
        ...authHeaders(),
        "x-session-id": localStorage.getItem("current_session_id"),
      },
    });

    // 🔥 CURRENT SESSION → LOGOUT
    if (res.data.revoked_current) {
      localStorage.clear();
      window.location.replace("/login?reason=expired");
      return;
    }

    await loadSessions();
    setMessage("Session revoked");
    setTimeout(() => setMessage(null), 3000);

  } catch (err) {
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

    const token = getValidToken();
    if (!token) {
      setError("Session expired. Please login again.");
      return;
    }

    try {
      setLoading(prev => ({ ...prev, avatar: true }));
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await axios.post(`${API}/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setProfile((prev) => ({ ...(prev || {}), avatar_url: res.data.avatar_url }));
      setMessage("Avatar updated successfully");
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Avatar upload failed", err);
      setError((err as any)?.response?.data?.error || "Failed to upload avatar");
    } finally {
      setLoading(prev => ({ ...prev, avatar: false }));
    }
  };

  /* -------------------------
     UPDATE PERSONAL INFO
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
      headers: authHeaders(),
    });

    setProfile(res.data.profile);

// 🔥 notify dashboard + header
window.dispatchEvent(
  new CustomEvent("profileUpdated", {
    detail: res.data.profile,
  })
);

setMessage("Profile updated");

    setMessage("Profile updated");
    setTimeout(() => setMessage(null), 3000);
  } catch (err: any) {
    console.error(err);
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
      setLoading(prev => ({ ...prev, password: true }));
      await axios.put(
        `${API}/security/password`,
        { new_password: newPassword },
        { headers: authHeaders() } // ✅ FIXED: Using authHeaders() instead of hardcoded
      );
      
      setMessage("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Password change failed", err);
      setError(err?.response?.data?.error || "Failed to change password");
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  /* -------------------------
     NOTIFICATIONS
  ------------------------- */
  const updateNotifSettings = async (payload: NotificationsShape) => {
    try {
      setLoading(prev => ({ ...prev, notifications: true }));
      await axios.put(`${API}/notifications`, payload, {
        headers: authHeaders(),
      });
      
      setMessage("Notification settings saved");
      setTimeout(() => setMessage(null), 2000);
    } catch (err: any) {
      console.error("Failed to save notifications", err);
      setError(err?.response?.data?.error || "Failed to save notification settings");
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  const handleEmailToggle = (key: keyof NonNullable<NotificationsShape["email_notifications"]>) => {
    const prevEmail = notifications.email_notifications || {};
    const updated = { ...prevEmail, [key]: !prevEmail[key] };
    const newNotifications = { ...notifications, email_notifications: updated };
    setNotifications(newNotifications);
    updateNotifSettings({
      email_notifications: updated,
      push_notifications: notifications.push_notifications,
    });
  };

  const handlePushToggle = (key: keyof NonNullable<NotificationsShape["push_notifications"]>) => {
    const prevPush = notifications.push_notifications || {};
    const updated = { ...prevPush, [key]: !prevPush[key] };
    const newNotifications = { ...notifications, push_notifications: updated };
    setNotifications(newNotifications);
    updateNotifSettings({
      email_notifications: notifications.email_notifications,
      push_notifications: updated,
    });
  };

  /* -------------------------
     PREFERENCES
  ------------------------- */
  const updatePrefs = async (payload: Record<string, any>) => {
    try {
      setLoading(prev => ({ ...prev, preferences: true }));
      await axios.put(`${API}/preferences`, payload, {
        headers: authHeaders(),
      });
      
      setMessage("Preferences saved");
      setTimeout(() => setMessage(null), 2000);
    } catch (err: any) {
      console.error("Failed to save preferences", err);
      setError(err?.response?.data?.error || "Failed to save preferences");
    } finally {
      setLoading(prev => ({ ...prev, preferences: false }));
    }
  };

  /* -------------------------
     TWO-FACTOR
  ------------------------- */
  const toggle2FA = async (enabled: boolean, method = "app") => {
    try {
      setLoading(prev => ({ ...prev, twoFactor: true }));
      await axios.put(`${API}/security/2fa`, { enabled, method }, {
        headers: authHeaders(),
      });
      
      setSecurity((s) => ({ ...(s || {}), two_factor_enabled: enabled, method }));
      setMessage(`Two-factor ${enabled ? "enabled" : "disabled"}`);
      setTimeout(() => setMessage(null), 2000);
    } catch (err: any) {
      console.error("Failed to toggle 2FA", err);
      setError(err?.response?.data?.error || "Failed to update two-factor settings");
    } finally {
      setLoading(prev => ({ ...prev, twoFactor: false }));
    }
  };

  /* -------------------------
     Profile field updates
  ------------------------- */
  const updateProfileField = (field: keyof Profile, value: any) => {
    setProfile((p) => ({ ...(p || {}), [field]: value }));
  };

  /* -------------------------
     File change handler
  ------------------------- */
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatarFile(file);
    e.currentTarget.value = "";
  };

  /* -------------------------
     Load profile helper
  ------------------------- */
  async function loadProfileFromServer(profileId?: string) {
    if (!profileId) return;
    try {
      setLoading(prev => ({ ...prev, profile: true }));
      const res = await axios.get(API, {
        headers: authHeaders(),
      });
      const serverProfile: Profile = res.data.profile || null;
      setProfile(serverProfile);
    } catch (err) {
      console.error("Reload profile failed", err);
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  }

  const currentSessionId = typeof window !== "undefined"
    ? localStorage.getItem("current_session_id")
    : null;

  /* -------------------------
     RENDER
  ------------------------- */
  return (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="text-[#1d4d6a] text-xl sm:text-2xl font-bold mb-1">Profile Settings</h2>
        <p className="text-sm text-gray-500">Manage your account settings and preferences</p>
      </div>

      {/* 🔥 IMPROVED: Message and error displays with icons (from friend's code) */}
      {message && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading.initial ? (
        renderSpinner("Loading profile settings...")
      ) : (
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="bg-white border border-gray-200">
            {/* 🔥 ADDED: Loading indicators on tabs (from friend's code) */}
            <TabsTrigger value="personal">
              Personal Info
              {loading.profile && <Loader2 className="w-3 h-3 ml-2 animate-spin" />}
            </TabsTrigger>
            <TabsTrigger value="security">
              Security
              {loading.sessions && <Loader2 className="w-3 h-3 ml-2 animate-spin" />}
            </TabsTrigger>
            {/* <TabsTrigger value="preferences">
              Preferences
              {loading.preferences && <Loader2 className="w-3 h-3 ml-2 animate-spin" />}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              Notifications
              {loading.notifications && <Loader2 className="w-3 h-3 ml-2 animate-spin" />}
            </TabsTrigger> */}
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
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} className="w-full h-full rounded-full" alt="avatar" />
                    ) : (
                      <AvatarFallback className="bg-[#1d4d6a] text-white text-2xl">
                        {profile?.full_name?.slice(0, 2).toUpperCase() || "NA"}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFileChange}
                    />
                    <Button 
                      className="bg-[#bf2026] hover:bg-[#a01c22] text-white mb-2 flex items-center gap-2"
                      onClick={onUploadClick}
                      disabled={loading.avatar}
                    >
                      {/* 🔥 ADDED: Loading state for avatar upload */}
                      {loading.avatar ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Uploading...
                        </>
                      ) : (
                        "Upload New Photo"
                      )}
                    </Button>
                    <p className="text-xs text-gray-500">JPG, PNG or GIF. Max size 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={profile?.first_name ?? ""}
                      onChange={(e) => updateProfileField("first_name", e.target.value)}
                      disabled={loading.personalInfo}
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={profile?.last_name ?? ""}
                      onChange={(e) => updateProfileField("last_name", e.target.value)}
                      disabled={loading.personalInfo}
                    />
                  </div>
                </div>

                <div>
                  <Label>Email Address</Label>
                  <Input
                    value={profile?.email ?? ""}
                    onChange={(e) => updateProfileField("email", e.target.value)}
                    disabled={true}
                    className="cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      value={profile?.phone ?? ""}
                      onChange={(e) => updateProfileField("phone", e.target.value)}
                      disabled={loading.personalInfo}
                    />
                  </div>
                  <div>
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={profile?.dob ?? ""}
                      onChange={(e) => updateProfileField("dob", e.target.value)}
                      disabled={loading.personalInfo}
                    />
                  </div>
                </div>

                <div>
                  <Label>Institution</Label>
                  <Input
                    value={profile?.institution ?? ""}
                    onChange={(e) => updateProfileField("institution", e.target.value)}
                    disabled={loading.personalInfo}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Field of Study</Label>
                    <Input
                      value={profile?.field_of_study ?? ""}
                      onChange={(e) => updateProfileField("field_of_study", e.target.value)}
                      disabled={loading.personalInfo}
                    />
                  </div>
                  <div>
                    <Label>Academic Level</Label>
                    <Input
                      value={profile?.academic_level ?? ""}
                      onChange={(e) => updateProfileField("academic_level", e.target.value)}
                      disabled={loading.personalInfo}
                    />
                  </div>
                </div>

                <div>
                  <Label>Bio</Label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#bf2026] focus:border-transparent min-h-[100px]"
                    value={profile?.bio ?? ""}
                    onChange={(e) => updateProfileField("bio", e.target.value)}
                    disabled={loading.personalInfo}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (profile?.id) loadProfileFromServer(profile.id);
                    }}
                    disabled={loading.personalInfo}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="bg-[#bf2026] hover:bg-[#a01c22] text-white flex items-center gap-2"
                    onClick={updatePersonalInfo}
                    disabled={loading.personalInfo}
                  >
                    {/* 🔥 ADDED: Loading state for save button */}
                    {loading.personalInfo ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
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
                  <Input 
                    type="password" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={loading.password}
                  />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading.password}
                  />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input 
                    type="password" 
                    value={confirmNewPassword} 
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    disabled={loading.password}
                  />
                </div>
                <Button 
                  className="bg-[#bf2026] hover:bg-[#a01c22] text-white flex items-center gap-2"
                  onClick={changePassword}
                  disabled={loading.password}
                >
                  {/* 🔥 ADDED: Loading state for password update */}
                  {loading.password ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* <Card className="border-none shadow-md">
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
                  <Switch
                    checked={!!security?.two_factor_enabled}
                    onCheckedChange={(v) => toggle2FA(!!v, "app")}
                    disabled={loading.twoFactor}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-[#1d4d6a] mb-1">SMS Authentication</h4>
                    <p className="text-sm text-gray-500">Receive codes via text message</p>
                  </div>
                  <Switch
                    checked={security?.method === "sms"}
                    onCheckedChange={(v) => toggle2FA(!!v, "sms")}
                    disabled={loading.twoFactor}
                  />
                </div>
              </CardContent>
            </Card> */}

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-[#1d4d6a]">Active Sessions</CardTitle>
                <CardDescription>Manage your active login sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* 🔥 ADDED: Loading state for sessions */}
                {loading.sessions ? (
                  <div className="flex justify-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#1d4d6a]"></div>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No active sessions found
                  </div>
                ) : (
                  sessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-[#1d4d6a] mb-1">{s.device ?? "Unknown device"}</h4>
                        <p className="text-sm text-gray-500">
                          {s.location ?? "Unknown location"} • {formatTime(s.last_active)}
                        </p>
                      </div>
                      <div>
                        {s.id === currentSessionId ? (
                          <Button variant="outline" size="sm" disabled>
                            Current
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 flex items-center gap-1"
                            onClick={() => revoke(s.id)}
                            disabled={loading.revokingSession}
                          >
                            {/* 🔥 ADDED: Loading state for revoke button */}
                            {loading.revokingSession ? (
                              <>
                                <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                                Revoking...
                              </>
                            ) : (
                              "Revoke"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-white"
                      onClick={() => updatePrefs({ theme: "light" })}
                      disabled={loading.preferences}
                    >
                      ☀️ Light
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => updatePrefs({ theme: "dark" })}
                      disabled={loading.preferences}
                    >
                      🌙 Dark
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-[#1d4d6a] mb-1">Auto-save Progress</h4>
                    <p className="text-sm text-gray-500">Automatically save your reading position</p>
                  </div>
                  <Switch
                    checked={!!(profile && (profile as any).auto_save)}
                    onCheckedChange={(v) => updatePrefs({ auto_save: !!v })}
                    disabled={loading.preferences}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-[#1d4d6a] mb-1">Sync Highlights</h4>
                    <p className="text-sm text-gray-500">Sync your highlights across devices</p>
                  </div>
                  <Switch
                    checked={!!(profile && (profile as any).sync_highlights)}
                    onCheckedChange={(v) => updatePrefs({ sync_highlights: !!v })}
                    disabled={loading.preferences}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="text-[#1d4d6a] mb-1">Reading Reminders</h4>
                    <p className="text-sm text-gray-500">Get daily reading reminders</p>
                  </div>
                  <Switch
                    checked={!!(profile && (profile as any).reading_reminders)}
                    onCheckedChange={(v) => updatePrefs({ reading_reminders: !!v })}
                    disabled={loading.preferences}
                  />
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
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#bf2026] focus:border-transparent"
                    defaultValue={(profile && (profile as any).language) || "English (US)"}
                    onChange={(e) => updatePrefs({ language: e.target.value })}
                    disabled={loading.preferences}
                  >
                    <option>English (US)</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
                <div>
                  <Label>Timezone</Label>
                  <select
  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
  value={(profile as any)?.timezone || "Asia/Kolkata"}
  onChange={(e) => updatePrefs({ timezone: e.target.value })}
>
  <option value="Asia/Kolkata">India (IST)</option>
  <option value="Asia/Dubai">UAE (GST)</option>
  <option value="Asia/Singapore">Singapore (SGT)</option>
  <option value="Europe/London">UK (GMT)</option>
  <option value="America/New_York">USA (EST)</option>
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
                      <Switch
                        checked={!!notifications.email_notifications?.recommendations}
                        onCheckedChange={() => handleEmailToggle("recommendations")}
                        disabled={loading.notifications}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Test reminders</span>
                      <Switch
                        checked={!!notifications.email_notifications?.test_reminders}
                        onCheckedChange={() => handleEmailToggle("test_reminders")}
                        disabled={loading.notifications}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Writing service updates</span>
                      <Switch
                        checked={!!notifications.email_notifications?.writing_updates}
                        onCheckedChange={() => handleEmailToggle("writing_updates")}
                        disabled={loading.notifications}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Marketing emails</span>
                      <Switch
                        checked={!!notifications.email_notifications?.marketing}
                        onCheckedChange={() => handleEmailToggle("marketing")}
                        disabled={loading.notifications}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-[#1d4d6a] mb-3">Push Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Reading streak reminders</span>
                      <Switch
                        checked={!!notifications.push_notifications?.reading_streak}
                        onCheckedChange={() => handlePushToggle("reading_streak")}
                        disabled={loading.notifications}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Test score notifications</span>
                      <Switch
                        checked={!!notifications.push_notifications?.test_scores}
                        onCheckedChange={() => handlePushToggle("test_scores")}
                        disabled={loading.notifications}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Job alerts</span>
                      <Switch
                        checked={!!notifications.push_notifications?.job_alerts}
                        onCheckedChange={() => handlePushToggle("job_alerts")}
                        disabled={loading.notifications}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ProfileSettings;