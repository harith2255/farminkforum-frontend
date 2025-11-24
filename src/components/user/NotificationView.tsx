import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bell, Circle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch Notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setNotifications(
          (res.data.notifications || []).map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            unread: !n.is_read,
            time: new Date(n.created_at).toLocaleString(),
          }))
        );
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // 🧹 Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        "https://ebook-backend-lxce.onrender.com/api/notifications/read-all",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // 🖱 Mark a single notification as read (NO navigation)
  const handleNotificationClick = async (id: number) => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `https://ebook-backend-lxce.onrender.com/api/notifications/read/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  // FILTER
  const filteredNotifications = notifications.filter((n) =>
    filter === "all" ? true : filter === "unread" ? n.unread : !n.unread
  );

  // SORT
  const sortedNotifications = [...filteredNotifications].sort((a, b) =>
    sortOrder === "newest" ? b.id - a.id : a.id - b.id
  );

  if (loading) return <p className="text-center py-10">Loading...</p>;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs defaultValue={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-4">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>

          <button
            onClick={markAllAsRead}
            className="text-sm font-medium text-[#bf2026] hover:underline"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-4 mt-6">
        {sortedNotifications.map((n) => (
          <div
            key={n.id}
            onClick={() => handleNotificationClick(n.id)}
            className={`cursor-pointer flex items-start justify-between p-4 rounded-lg border transition ${
              n.unread
                ? "bg-gray-50 border-[#bf2026]/30 hover:bg-gray-100"
                : "bg-white border-gray-200 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <Bell
                size={18}
                className={`mt-1 ${
                  n.unread ? "text-[#bf2026]" : "text-gray-400"
                }`}
              />
              <div>
                <h3
                  className={`font-medium ${
                    n.unread ? "text-[#1d4d6a]" : "text-gray-700"
                  }`}
                >
                  {n.title}
                </h3>
                <p className="text-sm text-gray-600">{n.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {n.unread && <Circle size={8} fill="#bf2026" />}
              <span className="text-xs text-gray-400">{n.time}</span>
            </div>
          </div>
        ))}

        {sortedNotifications.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No notifications found 🎉
          </div>
        )}
      </div>
    </div>
  );
}