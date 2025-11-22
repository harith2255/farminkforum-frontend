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
  PenTool,
} from "lucide-react";


import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { toast } from "sonner";

import Explore from "./user/Explore";
import { MyLibrary } from "./user/MyLibrary";
import { MockTests } from "./user/MockTests";
import { NotesRepository } from "./user/NotesRepository";
import { WritingServices } from "./user/WritingServices";
import { JobPortal } from "./user/JobPortal";
import { PaymentsSubscriptions } from "./user/PaymentsSubscriptions";
import { ProfileSettings } from "./user/ProfileSettings";
import NotificationView from "./user/NotificationView";
import CartPage from "./user/Cartpage";
import axios from "axios";
import * as React from "react";
import { Progress } from "./ui/progress";
import PurchasePage from "./PurchasePage";


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
  | "notes"
  | "writing"
  | "jobs"
  | "payments"
  | "profile"
  | "notifications"
  | "cartpage"
  | "purchase"
  | "purchase/cart";;

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



  useEffect(() => {
  const handler = (e: any) => {
    const section = e.detail;
    if (section) {
      setActiveSection(section);
    }
  };

  window.addEventListener("restore-user-section", handler);
  return () => window.removeEventListener("restore-user-section", handler);
}, []);

  // Dashboard fetch
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        if (!token) {
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
        const token = localStorage.getItem("token");
        if (!token) return;

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
        const token = localStorage.getItem("token");
        if (!token) return;

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
    { id: "dashboard" as UserSection, icon: Home, label: "Dashboard" },
    { id: "explore" as UserSection, icon: Navigation, label: "Explore" },
    { id: "library" as UserSection, icon: BookOpen, label: "My Library" },
    { id: "tests" as UserSection, icon: ClipboardCheck, label: "Mock Tests" },
    { id: "writing" as UserSection, icon: PenTool, label: "Writing Services" },
    { id: "jobs" as UserSection, icon: Briefcase, label: "Job Portal" },
    { id: "payments" as UserSection, icon: CreditCard, label: "Payments" },
    { id: "profile" as UserSection, icon: User, label: "Profile" },
  ];

  // Close dropdowns when clicking outside
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

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) {
      setSidebarCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  // 🔐 Handle logout
  const handleLogoutClick = () => {
    toast.success("Logged out successfully ✅"); // 🔹 UPDATED
    onLogout();
  };



  return (
    <div className="min-h-screen bg-[#f5f6f8] flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarCollapsed ? "w-20" : "w-64"
          } bg-white border-r border-gray-200 fixed h-screen  transition-all duration-300`}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-center">
          {!sidebarCollapsed && (
            <div className="flex flex-col items-center leading-tight text-center">
              <span className="text-[#1d4d6a] font-medium">FarmInk Forum</span>
              <p className="text-xs text-gray-500">Student Portal</p>
            </div>
          )}
          {sidebarCollapsed && (
            <span className="text-[#1d4d6a] font-medium text-sm">
              FarmInk Forum
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent">
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
                className={`w-full flex items-center ${sidebarCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3"
                  } rounded-lg mb-1 transition-all group ${activeSection === item.id
                    ? "bg-[#bf2026] text-white shadow-lg shadow-[#bf2026]/20"
                    : "text-gray-700 hover:bg-gray-100 hover:text-[#bf2026]"
                  }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon
                  className={`transition-all duration-200 ${sidebarCollapsed ? "w-6 h-6" : "w-5 h-5"
                    } ${activeSection === item.id ? "text-white" : "group-hover:text-[#bf2026]"}`}
                />
                {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>


        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-[#bf2026] transition-all"
            title={sidebarCollapsed ? "Logout" : undefined}
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
              <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                aria-label="Toggle Sidebar">
                <Menu className="w-5 h-5 text-gray-600" />
              </Button>
              <div>
                <h1 className="text-[#1d4d6a] mb-1">Welcome back, {dashboardData?.user?.full_name || "Student"}!</h1>
                <p className="text-sm text-gray-500">Continue your learning journey</p>
              </div>
            </div>

            {/* Right Side */}
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
                  aria-label="Notifications"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#bf2026] rounded-full"></span>
                  )}
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-xl border border-gray-100 z-50">
                    <div className="p-3 border-b border-gray-200 font-semibold text-gray-700">
                      Notifications
                    </div>
                    <ul className="max-h-60 overflow-y-auto">
                      {notifications.length === 0 && (
                        <p className="px-3 py-2 text-sm text-gray-400 text-center">No notifications</p>
                      )}

                      {notifications.map((n) => (
                        <li
                          key={n.id}
                          className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem("token");
                              await axios.patch(
                                `https://ebook-backend-lxce.onrender.com/api/notifications/read/${n.id}`,
                                {},
                                { headers: { Authorization: `Bearer ${token}` } }
                              );

                              // mark as read immediately (UX fast)
                              setNotifications(prev =>
                                prev.map(item =>
                                  item.id === n.id ? { ...item, is_read: true } : item
                                )
                              );

                              setUnreadCount(prev => Math.max(prev - 1, 0));

                              // optional: navigate to notifications page
                              setActiveSection("notifications");
                              setDropdownOpen(false);

                            } catch (err) {
                              console.error("Failed to mark read:", err);
                            }
                          }}
                        >
                          <p className={`text-gray-700 ${n.is_read ? "opacity-70" : "font-medium"}`}>
                            {n.message}
                          </p>
                          <p className="text-xs text-gray-400">{n.time}</p>
                        </li>
                      ))}
                    </ul>

                    <div className="text-center py-2 border-t border-gray-200">
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
                  aria-label="Shopping Cart"
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
                              <li key={item.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50">
                                <img
                                  src={
                                    product?.file_url?.match(/\.(png|jpg|jpeg)$/i)
                                      ? product.file_url
                                      : "https://cdn-icons-png.flaticon.com/512/337/337946.png"
                                  }
                                  className="w-10 h-10 rounded"
                                />

                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-700">{product?.title}</p>
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


              {/* Avatar Dropdown */}
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
                        </p>fgh'

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
          <Suspense fallback={<p>Loading...</p>}> {/* 🔹 UPDATED */}
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
                onNavigate={onNavigate}   // ⭐ REQUIRED
              />
            )}

            {activeSection === "library" && <MyLibrary onOpenBook={onOpenBook} />}
            {activeSection === "tests" && <MockTests />}
            {activeSection === "notes" && <NotesRepository onNavigate={onNavigate} />
            }
            {activeSection === "writing" && <WritingServices onNavigate={onNavigate} />
            }
            {activeSection === "jobs" && <JobPortal />}
            {activeSection === "payments" && <PaymentsSubscriptions onNavigate={page => setActiveSection(page)} />}

            {activeSection === "profile" && <ProfileSettings />}
            {activeSection === "notifications" && <NotificationView onNavigate={onNavigate} />}
            {activeSection === "cartpage" && <CartPage
              items={cartItems}
              onNavigate={(page) => setActiveSection(page)}
            />
            }
            {activeSection === "purchase" && (
              <PurchasePage onNavigate={onNavigate} />
            )}

            {activeSection === "purchase/cart" && (
              <PurchasePage onNavigate={onNavigate} />
            )}

          </Suspense>
        </main>
      </div >
    </div >
  );
}

function DashboardHome({
  onOpenBook,
  dashboardData,
  loading,
  error
}: {
  onOpenBook: (book: any) => void;
  dashboardData?: any;
  loading: boolean;
  error: string;
}) {
  if (loading)
    return <p className="text-center text-gray-500">Loading dashboard...</p>;

  if (error)
    return <p className="text-center text-red-500">{error}</p>;

  const stats = dashboardData?.stats || {};

  const recentBooks = dashboardData?.recentBooks || [];

  const allTests = [
    { id: 1, title: "Mathematics Mock Test 3", date: "2 days", questions: 50 },
    { id: 2, title: "Physics Final Prep", date: "5 days", questions: 75 },
    { id: 3, title: "Computer Science Quiz", date: "1 week", questions: 30 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* 📚 Books Read */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Books Read</p>
            <h3 className="text-[#1d4d6a] mb-1">{stats.booksRead ?? 0}</h3>

            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>+2 this month</span>
            </div>
          </div>
          <BookOpen className="w-6 h-6 text-[#bf2026]" />
        </CardContent>
      </Card>
      {/* 📝 Tests Completed */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Tests Completed</p>
            <h3 className="text-[#1d4d6a] mb-1">{stats.testsCompleted ?? 0}</h3>

            <div className="flex items-center gap-1 text-xs text-green-600">
              <Trophy className="w-3 h-3" />
              <span>
                {stats.avgScore
                  ? `${stats.avgScore}% avg score`
                  : "No tests yet"}
              </span>
            </div>
          </div>
          <ClipboardCheck className="w-6 h-6 text-[#bf2026]" />
        </CardContent>
      </Card>

      {/* ⏳ Study Hours */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Study Hours</p>
            <h3 className="text-[#1d4d6a] mb-1">{stats.studyHours ?? 0}h</h3>

            <div className="flex items-center gap-1 text-xs text-green-600">
              <Clock className="w-3 h-3" />
              <span>Good progress</span>
            </div>
          </div>
          <TrendingUp className="w-6 h-6 text-[#bf2026]" />
        </CardContent>
      </Card>

      {/* 🔥 Active Streak */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Active Streak</p>
            <h3 className="text-[#1d4d6a] mb-1">
              {stats.activeStreak ?? 0} Days
            </h3>

            <div className="flex items-center gap-1 text-xs text-orange-600">
              <Trophy className="w-3 h-3" />
              <span>
                {stats.activeStreak >= 5
                  ? "🔥 Great streak!"
                  : "Keep it going!"}
              </span>
            </div>
          </div>
          <Trophy className="w-6 h-6 text-[#bf2026]" />
        </CardContent>
      </Card>

      {/* Continue Reading */}
      <div className="w-full md:col-span-4 ">
        <Card className="shadow-md">
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
              const book = entry.books;

              return (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => onOpenBook(book)}
                >
                  <img
                    src={
                      book?.cover_url ||
                      "https://cdn-icons-png.flaticon.com/512/337/337946.png"
                    }
                    alt={book?.title}
                    className="w-14 h-20 object-cover rounded-md shadow"
                  />

                  <div className="flex-1">
                    <h4 className="text-[#1d4d6a] font-medium mb-1">
                      {book?.title || "Untitled"}
                    </h4>

                    <p className="text-sm text-gray-500 mb-2">
                      {book?.author || "Unknown Author"}
                    </p>

                    <Progress value={entry.progress || 0} className="h-2" />
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

    </div >
  );
}

export default UserDashboard;