import React, { useState } from "react";
import { Bell, Circle } from "lucide-react"; // icons
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

interface Notification {
    id: number;
    title: string;
    message: string;
    time: string;
    unread: boolean;
    link: string;
}

interface NotificationsPageProps {
    onNavigate: (page: string) => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: 1,
            title: "Payment Successful",
            message: "Your subscription has been renewed successfully.",
            time: "2 hours ago",
            unread: true,
            link: "PaymentsSubscriptions",
        },
        {
            id: 2,
            title: "New Job Alert",
            message: "A new job matching your preferences is available.",
            time: "Yesterday",
            unread: false,
            link: "job-portal",
        },
        {
            id: 3,
            title: "New Test Added",
            message: "A new mock test is available in your library.",
            time: "2 days ago",
            unread: true,
            link: "explore",
        },
    ]);

    const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

    // 🔘 Filter notifications
    const filteredNotifications = notifications.filter((n) =>
        filter === "all" ? true : filter === "unread" ? n.unread : !n.unread
    );

    // 🔽 Sort notifications
    const sortedNotifications = [...filteredNotifications].sort((a, b) =>
        sortOrder === "newest" ? b.id - a.id : a.id - b.id
    );

    // 🧹 Mark all as read
    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    };

    // 🖱 Handle click: mark as read + navigate
    const handleNotificationClick = (id: number, link: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
        );
        //onNavigate(link);
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Tabs styled*/}
                <Tabs
                    defaultValue={filter}
                    onValueChange={(value) => setFilter(value as "all" | "unread" | "read")}
                >
                    <TabsList className="bg-white border border-gray-200">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="unread">Unread</TabsTrigger>
                        <TabsTrigger value="read">Read</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Sort + Mark All Section */}
                <div className="flex items-center gap-4">
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 text-gray-600 focus:outline-none"
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
                        onClick={() => handleNotificationClick(n.id, n.link)}
                        className={`cursor-pointer flex items-start justify-between p-4 rounded-lg border transition ${n.unread
                                ? "bg-gray-50 border-[#bf2026]/30 hover:bg-gray-100"
                                : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <Bell
                                size={18}
                                className={`mt-1 ${n.unread ? "text-[#bf2026]" : "text-gray-400"
                                    }`}
                            />
                            <div>
                                <h3
                                    className={`font-medium ${n.unread ? "text-[#1d4d6a]" : "text-gray-700"
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

                {/* Empty State */}
                {sortedNotifications.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No notifications found 🎉
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;