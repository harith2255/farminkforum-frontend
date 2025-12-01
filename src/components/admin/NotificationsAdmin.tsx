import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui/select";
import { Send } from "lucide-react";
import { toast } from "sonner";
import * as React from "react";

export function NotificationsAdmin() {
  const API = "https://ebook-backend-lxce.onrender.com/api/admin/notifications";

  const [recipientType, setRecipientType] = useState("");
  const [notificationType, setNotificationType] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [customList, setCustomList] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ----------------------------------------------------
     FETCH NOTIFICATION LOGS
  ---------------------------------------------------- */
  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  /* ----------------------------------------------------
     SEND NOTIFICATION
  ---------------------------------------------------- */
  const handleSend = async () => {
    if (!recipientType || !notificationType || !subject || !message) {
      return toast.error("Please fill all required fields.");
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient_type: recipientType,
          notification_type: notificationType,
          subject,
          message,
          custom_list: customList.split(",").map((e) => e.trim()),
        }),
      });

      const data = await res.json();

      if (data.error) return toast.error(data.error);

      toast.success("Notification sent!");

      // Refresh list
      loadNotifications();
    } catch (err) {
      toast.error("Failed to send notification");
    }
  };

  /* ----------------------------------------------------
     SAVE DRAFT
  ---------------------------------------------------- */
  const saveDraft = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipient_type: recipientType,
          notification_type: notificationType,
          subject,
          message,
          custom_list: customList.split(",").map((e) => e.trim()),
        }),
      });

      const data = await res.json();

      if (data.error) return toast.error(data.error);

      toast.success("Draft saved!");
    } catch (err) {
      toast.error("Failed to save draft");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1">Send Notifications</h2>
        <p className="text-sm text-gray-500">Compose and send messages to users</p>
      </div>

      {/* ---------------------- COMPOSE NOTIFICATION ------------------------ */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Compose Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recipient Type */}
          <div>
            <Label>Recipient Type</Label>
            <Select onValueChange={setRecipientType}>
              <SelectTrigger>
                <SelectValue placeholder="Select recipients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active Subscribers</SelectItem>
                <SelectItem value="trial">Trial Users</SelectItem>
                <SelectItem value="inactive">Inactive Users</SelectItem>
                <SelectItem value="custom">Custom List</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom email list */}
          {recipientType === "custom" && (
            <div>
              <Label>Custom Email List</Label>
              <Textarea
                placeholder="Enter comma-separated emails"
                value={customList}
                onChange={(e) => setCustomList(e.target.value)}
              />
            </div>
          )}

          {/* Notification Type */}
          <div>
            <Label>Notification Type</Label>
            <Select onValueChange={setNotificationType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="website">Website Notification</SelectItem>
                <SelectItem value="both">Email + Website</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div>
            <Label>Subject</Label>
            <Input
              placeholder="Enter subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Message */}
          <div>
            <Label>Message</Label>
            <Textarea
              placeholder="Write your message..."
              className="min-h-[150px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={saveDraft}>
              Save as Draft
            </Button>
            <Button
              className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white gap-2"
              onClick={handleSend}
            >
              <Send className="w-4 h-4" />
              Send Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ---------------------- RECENT NOTIFICATIONS ------------------------ */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Recent Notifications</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-[#1d4d6a] mb-2">{n.subject}</h4>
                  <p className="text-sm text-gray-500">
                    Sent to {n.recipient_type} •{" "}
                    {new Date(n.created_at).toLocaleDateString()} •{" "}
                    {n.delivered_count} delivered
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}