import { useState, useRef, useEffect, Suspense } from "react";
import {
  BookOpen,
  Clock,
  FileText,
  ClipboardCheck,
  Briefcase,
  CreditCard,
  User,
  LogOut,
  Bell,
  TrendingUp,
  Trophy,
  ChevronRight,
  Menu,
  Settings,
  ShoppingCart,
  MessageCircle,
  X,
  LayoutDashboard,
  Award,
  CalendarDays,
  Compass,
  PenTool,
} from "lucide-react";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { toast } from "sonner";

import Explore from "./user/Explore";
import MyLibrary from "./user/MyLibrary";
import { MockTests } from "./user/MockTests";
import NotesRepository from "./user/NotesRepository";
import { WritingServices } from "./user/WritingServices";
import { JobPortal } from "./user/JobPortal";
import CurrentAffairs from "./user/UserCurrentAffairs";
import { PaymentsSubscriptions } from "./user/PaymentsSubscriptions";
import { ProfileSettings } from "./user/ProfileSettings";
import NotificationView from "./user/NotificationView";
import CartPage from "./user/Cartpage";
import axios from "axios";
import * as React from "react";
import { Progress } from "./ui/progress";
import UniversalPurchasePage from "./PurchasePage";
import Exams from "./user/Exams";
import ReadNotePage from "./ReadNotePage";
import PYQSection from "./user/PYQs";

interface UserDashboardProps {
  activeTab?: string;
  onNavigate: (page: string) => void;
  onOpenBook: (book: any) => void;
  onLogout: () => void;
}

type UserSection =
  | "dashboard"
  | "explore"
  | "library"
  | "tests"
  | "exams"
  | "pyqs"
  | "currentaffairs"
  | "notes"
  | "writing"
  | "jobs"
  | "payments"
  | "profile"
  | "notifications"
  | "cartpage"
  | "purchase"
  | "purchase/cart"
  | "reader-note";

export default function UserDashboard({
  activeTab = "dashboard",
  onNavigate,
  onOpenBook,
  onLogout,
}: UserDashboardProps) {
  const [activeSection, setActiveSection] = useState<UserSection | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [showQRModal, setShowQRModal] = useState(false); // QR Modal state
  const [selectedQR, setSelectedQR] = useState<string>(""); // Which QR to show

  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const whatsappRef = useRef<HTMLDivElement>(null);

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  type SubStatus = "loading" | "active" | "inactive";
  const [subStatus, setSubStatus] = useState<SubStatus>("loading");
  const [activeSub, setActiveSub] = useState<any | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function UpgradeRequired({ onNavigate }) {
    return (
      <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
        <h2 className="text-lg font-semibold text-red-600 mb-2">
          Subscription Required
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          You need an active subscription to access exams.
        </p>

        <Button
          className="bg-[#bf2026] text-white"
          onClick={() => onNavigate("payments")}
        >
          View Plans
        </Button>
      </div>
    );
  }

  // QR Code Modal Component
  const QRModal = () => {
    if (!showQRModal) return null;

    const qrData = {
      "farmink": {
        title: "FarmInk Forum - Agricultural Social Sciences",
        description: "WhatsApp group for Agricultural & Social Sciences",
        qrUrl:"/qrimage/FarmInkForumQR1.png", // Replace with your actual image path
        instruction: "Scan this QR code using the WhatsApp camera to join this group",
        color: "bg-green-50",
        textColor: "text-green-800",
        buttonColor: "bg-green-600 hover:bg-green-700",
        whatsappUrl: "https://wa.me/?text=Hello!%20I%20want%20to%20join%20FarmInk%20Forum%20-%20Agricultural,%20Social%20Sciences"
      },
      "ugc-net": {
        title: "UGC NET JRF - Adult Education Preparation",
        subtitle: "Intensive Extension Knowledge Forum",
        description: "WhatsApp group for UGC NET/JRF Adult Education Preparation",
        qrUrl: "/qrimage/FarmInkForumQR2.png", // Replace with your actual image path
        instruction: "Scan this QR code using the WhatsApp camera to join this group",
        color: "bg-blue-50",
        textColor: "text-blue-800",
        buttonColor: "bg-blue-600 hover:bg-blue-700",
        whatsappUrl: "https://wa.me/?text=Hello!%20I%20want%20to%20join%20UGC%20NET%20JRF%20-%20Adult%20Education%20Preparation%20-%20Intensive%20Extension%20Knowledge%20Forum"
      }
    };

    const data = qrData[selectedQR as keyof typeof qrData] || qrData.farmink;

    return (
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
        <div className={`${data.color} rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300`}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex-1">
                <h2 className={`text-lg font-bold ${data.textColor} leading-tight`}>
                  {data.title}
                </h2>
                {data.subtitle && (
                  <p className={`text-sm ${data.textColor} font-medium mt-1`}>
                    {data.subtitle}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1">{data.description}</p>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-2 hover:bg-white/50 rounded-full transition-colors ml-4"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl shadow-lg mb-4 border border-gray-200">
                <img
                  src={data.qrUrl}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64 object-contain"
                />
              </div>

              <div className="text-center mb-6">
                <p className="text-gray-700 font-medium mb-1">
                  {data.instruction}
                </p>
             
              </div>

            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Can't scan? Open WhatsApp and search for the group name
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handler = () => {
      setActiveSection("notes");
      window.history.pushState({}, "", "/user-dashboard/notes");
    };

    window.addEventListener("open-dashboard-notes", handler);
    return () => window.removeEventListener("open-dashboard-notes", handler);
  }, []);

  // Restore notes section after closing reader-note
  useEffect(() => {
    const handler = () => {
      setActiveSection("notes");
      window.history.pushState({}, "", "/user-dashboard/notes");
    };

    window.addEventListener("open-dashboard-notes", handler);
    return () => window.removeEventListener("open-dashboard-notes", handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      window.dispatchEvent(new Event("dashboard:update"));
    };

    window.addEventListener("collections:changed", handler);
    return () => window.removeEventListener("collections:changed", handler);
  }, []);

  // 🔥 Improved Dashboard Update Listener with error handling
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("e-book-backend-production.up.railway.app/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setDashboardData(res.data);
      } catch (err) {
        console.error("Dashboard refresh failed:", err);
      }
    };

    window.addEventListener("dashboard:update", fetchDashboard);
  window.addEventListener("library:updated", fetchDashboard); // 🔥 Listen for library updates too
  return () => {
    window.removeEventListener("dashboard:update", fetchDashboard);
    window.removeEventListener("library:updated", fetchDashboard);
  };  }, []);

  // ✅ FIX: Load Profile CLEANLY here
  useEffect(() => {
    async function loadProfile() {
      try {
        const session = JSON.parse(localStorage.getItem("session") || "{}");
        const token = session?.access_token || localStorage.getItem("token");

        const res = await axios.get("e-book-backend-production.up.railway.app/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data.profile || {});
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    }
    loadProfile();
  }, []);

  // 🔥 IMPROVED: fetch dashboard with retry logic
  useEffect(() => {
    let cancelled = false;

    const resolveToken = () => {
      return (
        localStorage.getItem("token") ||
        JSON.parse(localStorage.getItem("session") || "{}")?.access_token ||
        null
      );
    };

    const fetchDashboard = async () => {
      const token = resolveToken();

      if (!token) {
        console.warn("⏳ Token not ready yet — retrying...");
        setTimeout(fetchDashboard, 300);
        return;
      }

      try {
        if (!cancelled) {
          setLoading(true);
          setError("");
        }

        const res = await axios.get(
          "e-book-backend-production.up.railway.app/api/dashboard",
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 8000,
          }
        );

        if (!cancelled) {
          setDashboardData(res.data);
        }
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);

        if (!cancelled) {
          if (err.code === "ECONNABORTED") {
            setError("Server timeout.");
          } else if (err.response) {
            setError("Server error " + err.response.status);
          } else {
            setError("Failed to load dashboard.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  // 🔥 IMPROVED: Listen for subscription changes globally
  useEffect(() => {
    const handler = async () => {
      await fetchSubscription();
      window.dispatchEvent(new Event("dashboard:update"));
    };

    window.addEventListener("subscription:updated", handler);

    return () => window.removeEventListener("subscription:updated", handler);
  }, []);

  // Load cart
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("e-book-backend-production.up.railway.app/api/cart", {
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

        const res = await axios.get("e-book-backend-production.up.railway.app/api/notifications", {
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
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "explore", icon: Compass, label: "Explore" }, // Changed
  { id: "library", icon: BookOpen, label: "My Library" },
  { id: "notes", icon: FileText, label: "Notes" },
  { id: "pyqs", icon: Clock, label: "PYQs" },
  { id: "tests", icon: ClipboardCheck, label: "Mock Tests" },
  { id: "exams", icon: Award, label: "Exams" }, // Changed
  { id: "writing", icon: PenTool, label: "Services" }, // Changed
  { id: "jobs", icon: Briefcase, label: "Job Portal" },
  { id: "currentaffairs", icon: CalendarDays, label: "Current Affairs" }, // Changed
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
      if (whatsappRef.current && !whatsappRef.current.contains(event.target as Node)) {
        setWhatsAppOpen(false);
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

  useEffect(() => {
    const handler = () => {
      const last = localStorage.getItem("lastSection") as UserSection;
      if (last) setActiveSection(last);
    };
    window.addEventListener("restore-user-section", handler);
    return () => window.removeEventListener("restore-user-section", handler);
  }, []);

  // 🚀 IMPROVED: MASTER URL ⟶ SECTION SYNC
  useEffect(() => {
    const syncFromURL = () => {
      let path = window.location.pathname;

      if (!path.startsWith("/user-dashboard")) {
        setActiveSection("dashboard");
        return;
      }

      let sub = path.replace("/user-dashboard/", "").trim();

      if (sub === "" || sub === "/") sub = "dashboard";
      if (sub.startsWith("purchase")) sub = "purchase";
      if (sub.startsWith("cart")) sub = "cartpage";

      const valid: UserSection[] = [
        "dashboard",
        "explore",
        "library",
        "tests",
        "notes",
        "exams",
        "pyqs",
        "currentaffairs",
        "writing",
        "jobs",
        "payments",
        "profile",
        "notifications",
        "cartpage",
        "purchase",
        "reader-note",
      ];

      if (valid.includes(sub as UserSection)) {
        setActiveSection(sub as UserSection);
      }
    };

    syncFromURL();
    window.addEventListener("popstate", syncFromURL);

    const restore = (e: any) => {
      if (e.detail) {
        setActiveSection(e.detail as UserSection);
      } else {
        syncFromURL();
      }
    };
    window.addEventListener("restore-user-section", restore);

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

  // 🔥 IMPROVED: fetchSubscription with better error handling
  async function fetchSubscription() {
    try {
      setSubStatus("loading")
      const token = localStorage.getItem("token");
      if (!token) {
        setSubStatus("inactive");
        setActiveSub(null);
        return;
      }

      const res = await axios.get(
        "e-book-backend-production.up.railway.app/api/subscriptions/active",
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (s) => s < 500,
        }
      );

      if (res.status === 200 && res.data) {
        setActiveSub(res.data);
        setSubStatus("active");
      } else {
        setActiveSub(null);
        setSubStatus("inactive");
      }
    } catch (err) {
      console.warn("Subscription check failed", err);
      setActiveSub(null);
      setSubStatus("inactive");
    }
  }

  // initial load + focus refresh
  useEffect(() => {
    fetchSubscription();

    const handler = () => fetchSubscription();
    window.addEventListener("focus", handler);

    return () => window.removeEventListener("focus", handler);
  }, []);

  // refresh after purchase
  useEffect(() => {
    const handler = () => fetchSubscription();
    window.addEventListener("subscription:updated", handler);

    return () => window.removeEventListener("subscription:updated", handler);
  }, []);

  useEffect(() => {
  const handler = (e: any) => {
    const updatedProfile = e.detail;

    setDashboardData((prev: any) => ({
      ...prev,
      user: {
        ...(prev?.user || {}),
        ...updatedProfile,
      },
    }));

    setUser(updatedProfile);
  };

  window.addEventListener("profileUpdated", handler);
  return () => window.removeEventListener("profileUpdated", handler);
}, []);

  // 🔥 ADDED: Sync route tab → dashboard section
  useEffect(() => {
    if (activeTab && !activeSection) {
      setActiveSection(activeTab as UserSection);
    }
  }, [activeTab, activeSection]);

  // Close dropdowns and mobile sidebar on outside click
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
      if (whatsappRef.current && !whatsappRef.current.contains(event.target as Node)) {
        setWhatsAppOpen(false);
      }
      const isMobile = window.innerWidth < 1024;
      if (isMobile && sidebarOpen && (event.target as HTMLElement).closest('#sidebar') === null) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  const handleMenuToggle = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#f5f6f8] flex">
        {/* QR Modal */}
        <QRModal />

        {/* Overlay for mobile */}
        <div
          className={`fixed inset-0 bg-black/40 z-40 transition-opacity 
            ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} 
            lg:hidden`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside
          id="sidebar"
          className={`fixed z-50 top-0 left-0 h-full bg-white border-r border-gray-200 
            flex flex-col transition-all duration-300
            ${sidebarCollapsed ? "w-20" : "w-64"}
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 lg:static lg:w-${sidebarCollapsed ? "20" : "64"}`}
        >
          <div className="p-6 border-b border-gray-200 flex items-center justify-center">
            <div className="flex flex-col items-center leading-tight text-center">
              <span className="text-[#1d4d6a] font-medium">FarmInk Forum</span>
              <p className="text-xs text-gray-500">Student Portal</p>
            </div>
          </div>

          {/* Scrollable navigation */}
<div className="flex-1 overflow-y-auto scscroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
  <nav className="p-4">
    {menuItems.map((item) => (
      <button
        key={item.id}
        onClick={() => {
          setActiveSection(item.id as UserSection);
          setDropdownOpen(false);
          setAvatarOpen(false);
          setWhatsAppOpen(false);
          setSidebarOpen(false);
          window.history.pushState({}, "", `/user-dashboard/${item.id}`);
        }}
        className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-4'} py-3 rounded-lg mb-1 transition-all ${
          activeSection === item.id
            ? "bg-[#bf2026] text-white shadow-md"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        <item.icon className={`${sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
        {!sidebarCollapsed && (
          <span className="text-sm ml-3">{item.label}</span>
        )}
      </button>
    ))}
  </nav>
</div>

<div className="p-4 border-t border-gray-200 bg-white">
  <button
    onClick={handleLogoutClick}
    className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start px-4'} py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-[#bf2026] transition-all`}
  >
    <LogOut className={`${sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
    {!sidebarCollapsed && <span className="text-sm ml-3">Logout</span>}
  </button>
</div>
        </aside>

        {/* Main Content */}
        <div
          className={`flex-1 lg:ml-${sidebarCollapsed ? "20" : "64"} transition-all duration-300 overflow-hidden`}
        >
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="px-4 sm:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button onClick={handleMenuToggle} variant="ghost" size="sm" className="inline-flex">
                  <Menu className="w-5 h-5" />
                </Button>

                <div>
                  <h1 className="text-[#1d4d6a] mb-1 text-base sm:text-lg">
                    Welcome back, {dashboardData?.user?.full_name || "Student"}!
                  </h1>
                  <p className="text-sm text-gray-500 hidden sm:block">
                    Continue your learning journey
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                {/* WhatsApp Dropdown */}
                <div className="relative" ref={whatsappRef}>
                  <button
                    className="relative p-2 hover:bg-gray-100 rounded-lg group"
                    onClick={() => setWhatsAppOpen(!whatsAppOpen)}
                    title="Chat with Support on WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5 text-gray-600 transition-colors" />                  
                  </button>

                  {whatsAppOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white shadow-lg rounded-xl border border-gray-100 z-50">
                      <div className="p-3 border-b font-semibold text-gray-700">
                        Select Support Channel
                      </div>
                      
                      <ul className="py-2">
                        <li>
                          <button
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                            onClick={() => {
                              setSelectedQR("farmink");
                              setShowQRModal(true);
                              setWhatsAppOpen(false);
                            }}
                          >
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <MessageCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">FarmInk Forum</p>
                              <p className="text-xs text-gray-500">Agricultural, Social Science</p>
                            </div>
                          </button>
                        </li>
                        
                        <li>
                          <button
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => {
                              setSelectedQR("ugc-net");
                              setShowQRModal(true);
                              setWhatsAppOpen(false);
                            }}
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <BookOpen className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">UGC NET/JRF Preparation</p>
                              <p className="text-xs text-gray-500">Adult Education - Intensive Extension Knowledge Forum</p>
                            </div>
                          </button>
                        </li>
                      </ul>
                      
                      <div className="p-3 border-t text-center">
                        <p className="text-xs text-gray-500">Typically replies within 30 minutes</p>
                      </div>
                    </div>
                  )}
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
                      <div className="p-3 border-b font-semibold text-gray-700">
                        Notifications
                      </div>

                      <ul className="max-h-60 overflow-y-auto scscroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
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
                                const token = localStorage.getItem("token");
                                await axios.patch(
                                  `e-book-backend-production.up.railway.app/api/notifications/read/${n.id}`,
                                  {},
                                  {
                                    headers: { Authorization: `Bearer ${token}` },
                                  }
                                );

                                setNotifications((prev) =>
                                  prev.map((item) =>
                                    item.id === n.id
                                      ? { ...item, is_read: true }
                                      : item
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
                              className={`text-gray-700 ${n.is_read ? "opacity-70" : "font-medium"
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
                        <span className="text-xs text-gray-500">
                          {cartItems.length} items
                        </span>
                      </div>

                      {cartItems.length > 0 ? (
                        <>
                          <ul className="max-h-60 overflow-y-auto scscroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                            {cartItems.map((item) => {
                              const product = item.book || item.note;

                              return (
                                <li
                                  key={item.id}
                                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50"
                                >
                                  <img
                                    src={
                                      product?.file_url?.match(
                                        /\.(png|jpg|jpeg)$/i
                                      )
                                        ? product.file_url
                                        : "https://cdn-icons-png.flaticon.com/512/337/337946.png"
                                    }
                                    className="w-10 h-10 rounded object-cover"
                                  />

                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-700">
                                      {product?.title}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      ₹{product?.price}
                                    </p>
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

          {/* Main Content with Scroll */}
          <main className="p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-80px)] scscroll-smooth [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            <Suspense fallback={
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a]"></div>
                  <p className="text-gray-600 mt-3">Loading...</p>
                </div>
              </div>
            }>
              {activeSection === "dashboard" && (
                <DashboardHome
                  onOpenBook={onOpenBook}
                  dashboardData={dashboardData}
                  loading={loading}
                  error={error}
                />
              )}

              {activeSection === "explore" && (
                <Explore onOpenBook={onOpenBook} onNavigate={onNavigate} />
              )}

              {activeSection === "library" && (
                <MyLibrary onOpenBook={onOpenBook} />
              )}

              {activeSection === "tests" && <MockTests />}

              {activeSection === "notes" && (
                <NotesRepository onNavigate={onNavigate} />
              )}
           {activeSection === "exams" && (
                subStatus === "loading" ? null : subStatus === "active" ? (
                  <Exams />
                ) : (
                  <UpgradeRequired onNavigate={setActiveSection} />
                )
              )}

              {activeSection === "pyqs" && <PYQSection />}

              {activeSection === "currentaffairs" && <CurrentAffairs />}

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
                    if (page === "user-dashboard") {
                    setActiveSection("dashboard");
                    window.history.pushState({}, "", "/user-dashboard/dashboard");
                  } else {
                    setActiveSection(page as UserSection);
                    window.history.pushState({}, "", `/${page}`);
                  }
                  }}
                />
              )}

            </Suspense>
          </main>
        </div>
      </div>
    </>
  );
}

// DashboardHome component with improved stats display
export function DashboardHome({
  onOpenBook,
  dashboardData,
  loading,
  error,
}) {
  if (loading)
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a]"></div>
          <p className="text-gray-600 mt-3">Loading dashboard...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );

  if (!dashboardData)
    return (
      <div className="text-center py-12 text-gray-500">
        No dashboard data found.
      </div>
    );

  const stats = dashboardData?.stats || {};
const formatNumber = (value: any, decimals = 1) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(decimals) : "0.0";
};

const totalHours = formatNumber(stats?.studyHours);
const weeklyHours = formatNumber(stats?.weeklyHours);
  const recentBooks = dashboardData?.recentBooks || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
      {/* Books Read */}
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Books Read</p>
            <h3 className="text-[#1d4d6a] mb-1">{stats.booksRead ?? 0}</h3>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>+{stats.booksThisMonth ?? 0} this month</span>
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
              <span>
                {Number(stats.avgScore) > 0
  ? `${Number(stats.avgScore).toFixed(1)}% avg`
  : "No tests yet"}
              </span>
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

      <h3 className="text-[#1d4d6a] mb-1">
        {totalHours}h
      </h3>

      <div className="flex items-center gap-1 text-xs">
        <Clock className="w-3 h-3" />

        {Number(weeklyHours) > 0 ? (
          <span className="text-green-600">
            +{weeklyHours}h this week
          </span>
        ) : (
          <span className="text-gray-400">
            No study time this week yet
          </span>
        )}
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
            <h3 className="text-[#1d4d6a] mb-1">
              {stats.activeStreak ?? 0} Days
            </h3>
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <Trophy className="w-3 h-3" />
             <span>
  {stats.activeStreak === 0 && "Start learning today 🚀"}
  {stats.activeStreak > 0 && stats.activeStreak < 5 && "Keep going 💪"}
  {stats.activeStreak >= 5 && "🔥 Great streak!"}
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

          {recentBooks.map((entry, index) => {
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
                <img
                  src={book.cover_url}
                  className="w-14 h-20 object-cover rounded-md shadow"
                />

                <div className="flex-1">
                  <h4 className="text-[#1d4d6a] font-medium mb-1">
                    {book.title}
                  </h4>
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