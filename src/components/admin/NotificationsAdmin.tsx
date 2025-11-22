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

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Compose Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Recipient Type</Label>
            <Select>
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

          <div>
            <Label>Notification Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="push">Push Notification</SelectItem>
                <SelectItem value="both">Email + Push</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Subject</Label>
            <Input placeholder="Enter subject line" />
          </div>

          <div>
            <Label>Message</Label>
            <Textarea
              placeholder="Write your message..."
              className="min-h-[150px]"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              Save as Draft
            </Button>
            <Button className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white gap-2">
              <Send className="w-4 h-4" />
              Send Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { subject: 'New Books Added', recipients: 'All Users', sent: '2024-03-20', delivered: '12,453' },
              { subject: 'Platform Maintenance', recipients: 'Active Subscribers', sent: '2024-03-18', delivered: '8,234' },
              { subject: 'Special Discount Offer', recipients: 'Trial Users', sent: '2024-03-15', delivered: '1,245' },
            ].map((notification, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-[#1d4d6a] mb-2">{notification.subject}</h4>
                <p className="text-sm text-gray-500">
                  Sent to {notification.recipients} • {new Date(notification.sent).toLocaleDateString()} • {notification.delivered} delivered
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
