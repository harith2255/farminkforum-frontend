import { useState, useRef, useEffect, Suspense } from "react";
import {
  BookOpen,
  Home,
  FileText,
  ClipboardCheck,
  Briefcase,
  CreditCard,
  User,
  LogOut,
  Bell,
  Search,
  TrendingUp,
  Trophy,
  Clock,
  ChevronRight,
  Menu,
  Settings,
  Navigation,
  ShoppingCart,
  PenIcon,
  Crown,
  PenTool,
  ShoppingBag
} from "lucide-react";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { toast } from "sonner";

import Explore from "./user/Explore";
import MyLibrary  from "./user/MyLibrary";
import { MockTests } from "./user/MockTests";
import Exams from "./user/Exams";
import NotesRepository from "./user/NotesRepository";
import { WritingServices } from "./user/WritingServices";
import { JobPortal } from "./user/JobPortal";
import { PaymentsSubscriptions } from "./user/PaymentsSubscriptions";
import { ProfileSettings } from "./user/ProfileSettings";
import NotificationView from "./user/NotificationView";
import CartPage from "./user/Cartpage";
import ReadNotePage from "./ReadNotePage";
import axios from "axios";
import * as React from "react";
import { Progress } from "./ui/progress";
import UniversalPurchasePage from "./PurchasePage";

interface UserDashboardProps {
  onNavigate: (page: string) => void;
  onOpenBook: (book: any) => void;
  onLogout: () => void;
}

type UserSection =
  | "dashboard"
  | "explore"
  | "library"
  | "tests"
  |"exams"
  | "notes"
  | "writing"
  | "jobs"
  | "payments"
  | "profile"
  | "notifications"
  | "cartpage"
  | "purchase"
  | "purchase/cart"
  |"reader-note";

export function UserDashboard({ onNavigate, onOpenBook, onLogout }: UserDashboardProps) {
  const [activeSection, setActiveSection] = useState<UserSection>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState<any>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // ✅ FIX: Load Profile CLEANLY here
  useEffect(() => {
    async function loadProfile() {
      try {
        const session = JSON.parse(localStorage.getItem("session") || "{}");
        const token = session?.access_token || localStorage.getItem("token");
        const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data.profile || {});
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    }
    loadProfile();
  }, []);

  // 🔥 Get section from URL on first load
useEffect(() => {
  const path = window.location.pathname;

  if (path.startsWith("/user-dashboard/")) {
    const sub = path.replace("/user-dashboard/", "").trim();
    if (sub) {
      setActiveSection(sub as UserSection);
    }
  }
}, []);

 // Dashboard fetch
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");        if (!token) {
          setError("You are not logged in.");
          setLoading(false);
          return;
        }

        const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000,
        });

        setDashboardData(res.data);
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);

        if (err.code === "ECONNABORTED") {
          setError("Server timeout.");
        } else if (err.response) {
          setError("Server error " + err.response.status);
        } else {
          setError("Failed to load dashboard.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Load cart
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = localStorage.getItem("token");        if (!token) return;

        const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setCartItems(Array.isArray(res.data.items) ? res.data.items : []);
      } catch (err) {
        console.error("Failed to load cart", err);
      }
    };

    fetchCart();
    const listener = () => fetchCart();
    window.addEventListener("cart:changed", listener);
    return () => window.removeEventListener("cart:changed", listener);
  }, []);

  // Notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("token");        if (!token) return;

        const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const raw = res.data.notifications || [];

const items = raw.map((n: any) => ({
  ...n,
  time: n.created_at
    ? new Date(n.created_at).toLocaleString()
    : "Unknown",
}));

setNotifications(items);
setUnreadCount(items.filter((n: any) => !n.is_read).length);

      } catch (err) {
        
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();
    const listener = () => fetchNotifications();
    window.addEventListener("notifications:refresh", listener);
    return () => window.removeEventListener("notifications:refresh", listener);
  }, []);

  const menuItems = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "explore", icon: Navigation, label: "Explore" },
    { id: "library", icon: BookOpen, label: "My Library" },
    { id: "tests", icon: ClipboardCheck, label: "Mock Tests" },
    { id: "exams", icon: Crown, label: "Exams" },
    { id: "notes", icon: FileText, label: "Notes" },
    { id: "writing", icon: PenIcon, label: "Writing Services" },
    { id: "jobs", icon: Briefcase, label: "Job Portal" },
    { id: "payments", icon: CreditCard, label: "Payments" },
    { id: "profile", icon: User, label: "Profile" },
  ];
  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setAvatarOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setCartOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sidebar persistence
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) setSidebarCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

   // 🚀 MASTER URL ⟶ SECTION SYNC (replace all old ones)
useEffect(() => {
  const syncFromURL = () => {
    let path = window.location.pathname;

    if (!path.startsWith("/user-dashboard")) {
      setActiveSection("dashboard");
      return;
    }

    let sub = path.replace("/user-dashboard/", "").trim();

    // normalize weird patterns
    if (sub === "" || sub === "/") sub = "dashboard";
    if (sub.startsWith("purchase")) sub = "purchase";
    if (sub.startsWith("cart")) sub = "cartpage";

 const valid: UserSection[] = [
  "dashboard","explore","library","tests","notes","writing","jobs",
  "payments","profile","notifications","cartpage","purchase","reader-note"
];

    if (valid.includes(sub as UserSection)) {
      setActiveSection(sub as UserSection);
    } else {
      setActiveSection("dashboard");
    }
  };

  // Run immediately (first load)
  syncFromURL();

  // Browser back/forward
  window.addEventListener("popstate", syncFromURL);

  // restore-user-section support
  const restore = (e: any) => {
    if (e.detail) {
      setActiveSection(e.detail as UserSection);
    } else {
      syncFromURL();
    }
  };
  window.addEventListener("restore-user-section", restore);

  // safety retry
  const retry = setTimeout(syncFromURL, 50);

  return () => {
    window.removeEventListener("popstate", syncFromURL);
    window.removeEventListener("restore-user-section", restore);
    clearTimeout(retry);
  };
}, []);

  const handleLogoutClick = () => {
    toast.success("Logged out successfully");
    onLogout();
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarCollapsed ? "w-20" : "w-64"} bg-white border-r border-gray-200 fixed h-screen overflow-y-auto transition-all duration-300`}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-center">
          <div className="flex flex-col items-center leading-tight text-center">
            <span className="text-[#1d4d6a] font-medium">FarmInk Forum</span>
            <p className="text-xs text-gray-500">Student Portal</p>
          </div>
        </div>

        <nav className="p-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
             onClick={() => {
  setActiveSection(item.id as UserSection);
  setDropdownOpen(false);
  setAvatarOpen(false);

  // URL update without navigation
  window.history.pushState({}, "", `/user-dashboard/${item.id}`);
}}

              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                activeSection === item.id
                  ? "bg-[#bf2026] text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-[#bf2026] transition-all"
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarCollapsed ? "ml-20" : "ml-64"} transition-all duration-300`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                <Menu className="w-5 h-5 text-gray-600" />
              </Button>

              <div>
                <h1 className="text-[#1d4d6a] mb-1">
                  Welcome back, {dashboardData?.user?.full_name || "Student"}!
                </h1>
                <p className="text-sm text-gray-500">Continue your learning journey</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-none focus:ring-2 focus:ring-[#bf2026] w-64"
                />
              </div>

              {/* Notifications */}
              <div className="relative" ref={dropdownRef}>
                <button
                  className="relative p-2 hover:bg-gray-100 rounded-lg"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#bf2026] rounded-full"></span>
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-xl border border-gray-100 z-50">
                    <div className="p-3 border-b font-semibold text-gray-700">Notifications</div>

                    <ul className="max-h-60 overflow-y-auto">
                      {notifications.length === 0 && (
                        <p className="px-3 py-2 text-sm text-gray-400 text-center">
                          No notifications
                        </p>
                      )}

                      {notifications.map((n) => (
                        <li
                          key={n.id}
                          className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem("token");                              await axios.patch(
                                `https://ebook-backend-lxce.onrender.com/api/notifications/read/${n.id}`,
                                {},
                                { headers: { Authorization: `Bearer ${token}` } }
                              );

                              setNotifications((prev) =>
                                prev.map((item) =>
                                  item.id === n.id ? { ...item, is_read: true } : item
                                )
                              );

                              setUnreadCount((prev) => Math.max(prev - 1, 0));

                              setActiveSection("notifications");
                              setDropdownOpen(false);
                            } catch (err) {
                              console.error("Failed to mark read:", err);
                            }
                          }}
                        >
                          <p
                            className={`text-gray-700 ${
                              n.is_read ? "opacity-70" : "font-medium"
                            }`}
                          >
                            {n.message}
                          </p>
                          <p className="text-xs text-gray-400">{n.time}</p>
                        </li>
                      ))}
                    </ul>

                    <div className="text-center py-2 border-t">
                      <button
                        onClick={() => {
                          setActiveSection("notifications");
                          setDropdownOpen(false);
                        }}
                        className="text-[#bf2026] text-sm font-medium hover:underline"
                      >
                        View all
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Dropdown */}
              <div className="relative" ref={cartRef}>
                <button
                  className="relative p-2 hover:bg-gray-100 rounded-lg"
                  onClick={() => setCartOpen(!cartOpen)}
                >
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                  {cartItems.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#bf2026] rounded-full"></span>
                  )}
                </button>

                {cartOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white shadow-lg rounded-xl border border-gray-100 z-50">
                    <div className="p-3 border-b font-semibold text-gray-700 flex justify-between">
                      <span>Cart</span>
                      <span className="text-xs text-gray-500">{cartItems.length} items</span>
                    </div>

                    {cartItems.length > 0 ? (
                      <>
                        <ul className="max-h-60 overflow-y-auto">
                          {cartItems.map((item) => {
                            const product = item.book || item.note;

                            return (
                              <li
                                key={item.id}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
                              >
                                <img
                                  src={
                                    product?.file_url?.match(/\.(png|jpg|jpeg)$/i)
                                      ? product.file_url
                                      : "https://cdn-icons-png.flaticon.com/512/337/337946.png"
                                  }
                                  className="w-10 h-10 rounded"
                                />

                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-700">
                                    {product?.title}
                                  </p>
                                  <p className="text-xs text-gray-500">₹{product?.price}</p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>

                        <div className="text-center py-2 border-t">
                          <button
                            onClick={() => {
                              setActiveSection("cartpage");
                              setCartOpen(false);
                            }}
                            className="text-[#bf2026] text-sm font-medium hover:underline"
                          >
                            View Cart
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-500 py-6 text-sm">
                        Your cart is empty 🛍️
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Avatar Dropdown (FINAL & FIXED — only one rendered) */}
              <div className="relative" ref={avatarRef}>
                <button
                  className="p-1 rounded-full hover:bg-gray-100"
                  aria-label="User Menu"
                  onClick={() => setAvatarOpen(!avatarOpen)}
                >
                  <Avatar className="w-8 h-8">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <AvatarFallback>
                        {user?.full_name?.slice(0, 2).toUpperCase() || "NA"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </button>

                {avatarOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-xl border border-gray-100 z-50">
                    <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {user?.full_name ||
                            `${user?.first_name || ""} ${user?.last_name || ""}` ||
                            "Guest User"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {user?.email || "no-email@example.com"}
                        </p>
                      </div>
                    </div>

                    <ul className="py-2">
                      <li>
                        <button
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                          onClick={() => setActiveSection("profile")}
                        >
                          <Settings className="w-4 h-4" /> Settings
                        </button>
                      </li>
                      <li>
                        <button
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                          onClick={handleLogoutClick}
                        >
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          <Suspense fallback={<p>Loading...</p>}>
            {activeSection === "dashboard" && (
              <DashboardHome
                onOpenBook={onOpenBook}
                dashboardData={dashboardData}
                loading={loading}
                error={error}
              />
            )}

            {activeSection === "explore" && (
              <Explore
                onOpenBook={onOpenBook}
                onNavigate={onNavigate}
              />
            )}

            {activeSection === "library" && <MyLibrary onOpenBook={onOpenBook} />}

            {activeSection === "tests" && <MockTests />}

            {activeSection === "notes" && (
              <NotesRepository onNavigate={onNavigate} />
            )}
            {activeSection === "exams" && <Exams />}

            {activeSection === "writing" && (
              <WritingServices onNavigate={onNavigate} />
            )}

            {activeSection === "jobs" && <JobPortal />}

            {activeSection === "payments" && (
              <PaymentsSubscriptions
                onNavigate={(page) => setActiveSection(page)}
              />
            )}

            {activeSection === "profile" && <ProfileSettings />}

            {activeSection === "notifications" && (
              <NotificationView onNavigate={onNavigate} />
            )}

            {activeSection === "cartpage" && (
  <CartPage
    items={cartItems}
    onNavigate={(page) => {
      setActiveSection(page as UserSection);
      window.history.pushState({}, "", `/user-dashboard/${page}`);
    }}
  />  
            )}

{activeSection === "purchase" && (
  <UniversalPurchasePage
    onNavigate={(page) => {
      setActiveSection(page as UserSection);
      window.history.pushState({}, "", `/${page}`);

    }}
  />
)}
{activeSection === "reader-note" && (
  <ReadNotePage
    onNavigate={(page) => {
      setActiveSection(page as UserSection);
      window.history.pushState({}, "", `/user-dashboard/${page}`);
    }}
  />
)}
          </Suspense>
        </main>
      </div>
    </div>
  );
}






// src/components/DashboardHome.tsx


const API_URL = (import.meta.env.VITE_API_URL as string) || "https://ebook-backend-lxce.onrender.com";

export default function DashboardHome({ onOpenBook }: { onOpenBook: (book: any) => void }) {
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

 // Extracted fetch so other effects / events can call it
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");      if (!token) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Dashboard load failed: ${res.status}`);
      }

      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboard();
  }, []);

   // Global dashboard update listeners (fired from BookReader, MockTests, etc.)
  useEffect(() => {
    const refresh = () => fetchDashboard();
    const events = [
      "dashboard:update",
      "dashboard:update.tests",
      "dashboard:update.study",
      "dashboard:update.streak",
      "dashboard:update.library",
      "dashboard:update.notifications",
      "dashboard:update.cart",
    ];

    events.forEach((ev) => window.addEventListener(ev, refresh));
    return () => events.forEach((ev) => window.removeEventListener(ev, refresh));
  }, []);

  if (loading)
    return <p className="text-center text-gray-500">Loading dashboard...</p>;
  if (error)
    return <p className="text-center text-red-500">{error}</p>;

  const stats = dashboardData?.stats || {};
  const recentBooks = dashboardData?.recentBooks || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

      {/* Books Read */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Books Read</p>
            <h3 className="text-[#1d4d6a] mb-1">{stats.booksRead ?? 0}</h3>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>+{stats.booksThisMonth ?? 0}</span>
            </div>
          </div>
          <BookOpen className="w-6 h-6 text-[#bf2026]" />
        </CardContent>
      </Card>

      {/* Tests */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Tests Completed</p>
            <h3 className="text-[#1d4d6a] mb-1">{stats.testsCompleted ?? 0}</h3>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Trophy className="w-3 h-3" />
              <span>{stats.avgScore ? `${stats.avgScore}% avg` : "No tests yet"}</span>
            </div>
          </div>
          <ClipboardCheck className="w-6 h-6 text-[#bf2026]" />
        </CardContent>
      </Card>

      {/* Study Hours */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Study Hours</p>
            <h3 className="text-[#1d4d6a] mb-1">{stats.studyHours ?? 0}h</h3>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Clock className="w-3 h-3" />
              <span>+{stats.weeklyHours ?? 0}h this week</span>
            </div>
          </div>
          <TrendingUp className="w-6 h-6 text-[#bf2026]" />
        </CardContent>
      </Card>

      {/* Streak */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Active Streak</p>
            <h3 className="text-[#1d4d6a] mb-1">{stats.activeStreak ?? 0} Days</h3>
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <Trophy className="w-3 h-3" />
              <span>
                {stats.activeStreak >= 5 ? "🔥 Great streak!" : "Keep going!"}
              </span>
            </div>
          </div>
          <Trophy className="w-6 h-6 text-[#bf2026]" />
        </CardContent>
      </Card>

      {/* Continue Reading */}
      <Card className="shadow-md mt-6 md:col-span-4">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Continue Reading</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {recentBooks.length === 0 && (
            <p className="text-gray-500 text-sm">
              You haven't started reading any books yet.
            </p>
          )}

          {recentBooks.map((entry: any, index: number) => {
            const book = entry.ebooks; 
            if (!book) return null;

            return (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                onClick={() =>
                  onOpenBook({
                    ...book,
                    id: entry.book_id || book.id,
                    last_page: entry.last_page,
                    progress: entry.progress,
                  })
                }
              >
<img src={book.cover_url} className="w-14 h-20 object-cover rounded-md shadow" />

                <div className="flex-1">
                  <h4 className="text-[#1d4d6a] font-medium mb-1">{book.title}</h4>
                  <p className="text-sm text-gray-500 mb-2">{book.author}</p>
                  <Progress value={entry.progress || 0} className="h-2" />
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}