import { useEffect, useState, startTransition, Suspense } from "react";
import { Home } from "./components/Home";
import { PublicPages } from "./components/PublicPages";
import { Toaster } from "./components/ui/sonner";
import UniversalPurchasePage from "./components/PurchasePage";
import * as React from "react";
import axios from "axios";

const UserDashboard = React.lazy(() =>
  import("./components/UserDashboard")
);

const AdminDashboard = React.lazy(() =>
  import("./components/AdminDashboard")
);

const BookReader = React.lazy(() =>
  import("./components/BookReader")
);

const TestPage = React.lazy(() =>
  import("./components/user/Testpage")
);

const ReadNotePage = React.lazy(() =>
  import("./components/ReadNotePage")
);

/* ============================================================
   AXIOS REQUEST INTERCEPTOR – SESSION + JWT
============================================================ */
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const sessionId = localStorage.getItem("current_session_id");

  config.headers = config.headers || {};
  config.timeout = config.timeout || 15000; // 15s global timeout

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (sessionId) {
    config.headers["x-session-id"] = sessionId;
  }

  return config;
});

/* ============================================================
   AXIOS RESPONSE INTERCEPTOR – AUTO LOGOUT ON AUTH FAILURE
============================================================ */
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const reason = err?.response?.data?.error;

    if (status === 401) {
      console.warn("🔒 Auth expired:", reason);

      // clear auth
      localStorage.removeItem("token");
      localStorage.removeItem("current_session_id");
      localStorage.removeItem("role");
      localStorage.removeItem("isLoggedIn");

      // hard redirect (prevents back button)
      window.location.replace("/login?reason=expired");
    }

    return Promise.reject(err);
  }
);

type Page =
  | "home"
  | "user-dashboard"
  | "admin-dashboard"
  | "explore"
  | "pricing"
  | "about"
  | "contact"
  | "login"
  | "register"
  | "reader"
  | "purchase"
  | "test"
  | "reader-note"
  | "privacy"
  | "terms"
  | "forgot-password"
  | "reset-password"
  | "verify-email"
  | "writing"
  | "drm";

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [pageParam, setPageParam] = useState<any>(null);
  const [previousPage, setPreviousPage] = useState<Page>("home");
  const [userRole, setUserRole] = useState<"user" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [routerReady, setRouterReady] = useState(false);

  /* ============================================================
     GLOBAL BOOK READING PROGRESS LISTENER
  ============================================================ */
  useEffect(() => {
    let isMounted = true;
    let lastSentPage = 0;
    let debounceTimer: any = null;

    const handleReaderProgress = async (e: any) => {
      if (!isMounted) return;

      const { bookId, page, totalPages } = e.detail || {};

      // ---------- VALIDATION ----------
      if (!bookId || !page || !totalPages || totalPages <= 0) {
        console.warn("⚠️ Invalid progress payload", e.detail);
        return;
      }

      // ---------- TOKEN GUARD ----------
      const token = localStorage.getItem("token");
      if (!token) return;

      // ---------- PREVENT SPAM ----------
      if (page === lastSentPage) return;
      lastSentPage = page;

      const percent = Math.min(
        100,
        Math.round((page / totalPages) * 100)
      );

      // ---------- DEBOUNCE ----------
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        try {
          await axios.put(
            `${(import.meta as any).env.VITE_API_URL}/api/library/progress/${bookId}`,
            { progress: percent, last_page: page },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              // 🚨 prevent interceptor logout
              validateStatus: (status) => status < 500,
            }
          );
        } catch (err: any) {
          // ❌ NEVER logout for progress errors
          if (err?.response?.status === 401) {
            console.warn("⏭ Progress skipped (unauthenticated)");
            return;
          }

          console.error("❌ Progress update failed:", err);
        }
      }, 800); // send only after pause
    };

    window.addEventListener("reader:progress", handleReaderProgress);

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
      window.removeEventListener("reader:progress", handleReaderProgress);
    };
  }, []);

  /* ============================================================
     1) RESTORE TOKEN — FIXED (runs only once)
  ============================================================ */
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("session") || "{}");
    if (session?.access_token) {
      localStorage.setItem("token", session.access_token);
    }
  }, []);

  /* ============================================================
     2) FIXED PUSHSTATE HOOK – runs once (not every render)
  ============================================================ */
  useEffect(() => {
    const original = window.history.pushState;
    window.history.pushState = function (...args) {
      original.apply(this, args);
      window.dispatchEvent(new Event("pushstate"));
    };
    return () => {
      window.history.pushState = original;
    };
  }, []);

  const handleOpenBook = (book: any) => {
    const id = book.book_id || book.id;
    handleNavigate("reader", {
      id,
      last_page: book.last_page || 1,
    });
  };

  /* ============================================================
     3) ROUTE RESOLVER - FIXED for /user-dashboard/dashboard
  ============================================================ */
  const resolveRoute = (): { page: Page; param: any } => {
    const path = window.location.pathname || "";
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const role = localStorage.getItem("role");

    // 🔥 SECURITY: Protect Admin Dashboard routes
    if (path.startsWith("/admin-dashboard")) {
      if (!isLoggedIn) {
        window.history.replaceState({}, "", "/login");
        return { page: "login", param: null };
      }
      if (role !== "admin" && role !== "super_admin") {
        window.history.replaceState({}, "", "/user-dashboard");
        return { page: "user-dashboard", param: "dashboard" };
      }
      const section = path.split("/")[2] || "dashboard";
      return { page: "admin-dashboard", param: section };
    }

    // 🔥 SECURITY: Protect User Dashboard routes
    if (path.startsWith("/user-dashboard")) {
      if (!isLoggedIn) {
        window.history.replaceState({}, "", "/login");
        return { page: "login", param: null };
      }
    }

    if (path.startsWith("/notes/read/")) {
      if (!isLoggedIn) {
        window.history.replaceState({}, "", "/login");
        return { page: "login", param: null };
      }
      const id = Number(path.split("/").pop());
      return { page: "reader-note", param: id };
    }

    if (path.startsWith("/reader/")) {
      if (!isLoggedIn) {
        window.history.replaceState({}, "", "/login");
        return { page: "login", param: null };
      }
      const meta = JSON.parse(localStorage.getItem("open_book_meta") || "{}");

      // fallback if someone manually types URL
      if (!meta?.id) {
        const id = path.split("/").pop();
        return { page: "reader", param: { id, last_page: 1 } };
      }

      return { page: "reader", param: meta };
    }

    if (path.startsWith("/purchase/")) {
      if (!isLoggedIn) {
        window.history.replaceState({}, "", "/login");
        return { page: "login", param: null };
      }
      const id = path.split("/").pop();
      return { page: "purchase", param: id };
    }

    // 🔥 FIX: Handle /user-dashboard/dashboard path FIRST
    if (path === "/user-dashboard/dashboard") {
      return { page: "user-dashboard", param: "dashboard" };
    }

    if (path.startsWith("/user-dashboard/")) {
      const section = path.split("/")[2] || "dashboard";
      return { page: "user-dashboard", param: section };
    }

    if (path.startsWith("/test/")) {
      if (!isLoggedIn) {
        window.history.replaceState({}, "", "/login");
        return { page: "login", param: null };
      }
      const id = path.split("/").pop();
      return { page: "test", param: id };
    }

    // Handle base /user-dashboard URL (redirect to dashboard)
    if (path === "/user-dashboard") {
      return { page: "user-dashboard", param: "dashboard" };
    }

    // fallback static pages
    const staticPages = [
      "explore",
      "pricing",
      "about",
      "contact",
      "login",
      "register",
      "privacy",
      "terms",
      "forgot-password",
      "reset-password",
      "verify-email",
      "drm",
    ];
    const page = path.replace("/", "");
    if (staticPages.includes(page)) {
      return { page: page as Page, param: null };
    }

    if (path.startsWith("/writing")) {
      return { page: "user-dashboard", param: "writing" };
    }

    // fallback always return
    return { page: "home", param: null };
  };

  /* ============================================================
     4) SYNC ROUTER — Single clean listener
  ============================================================ */
  useEffect(() => {
    const syncRoute = () => {
      const r = resolveRoute();
      if (!r) return;
      startTransition(() => {
        setCurrentPage(r.page);
        setPageParam(r.param);
      });
    };

    // Initial load: set everything synchronously (no startTransition)
    // so the skeleton hides only AFTER currentPage is correct
    const r = resolveRoute();
    if (r) {
      setCurrentPage(r.page);
      setPageParam(r.param);
    }
    setRouterReady(true);

    window.addEventListener("popstate", syncRoute);
    window.addEventListener("pushstate", syncRoute);

    return () => {
      window.removeEventListener("popstate", syncRoute);
      window.removeEventListener("pushstate", syncRoute);
    };
  }, []);

  /* ============================================================
     5) AUTO LOGIN RESTORE
  ============================================================ */
  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role) setUserRole(role as any);

    setAuthReady(true);
    setLoading(false); // ✅ REQUIRED
  }, []);

  /* ============================================================
     6) SCROLL RESTORE
  ============================================================ */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  /* ============================================================
     7) LOGIN
  ============================================================ */
  const handleLogin = (role: "user" | "admin") => {
    setUserRole(role);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("role", role);

    const target = role === "user" ? "user-dashboard" : "admin-dashboard";
    startTransition(() => {
      setCurrentPage(target as Page);
    });
    window.history.pushState({}, "", `/${target}`);
  };

  /* ============================================================
     8) NAVIGATE - Updated to handle /user-dashboard/dashboard
  ============================================================ */
  const handleNavigate = (page: string, param?: any) => {
    const targetPage = page as Page;
    setPreviousPage(currentPage);
    setPageParam(param ?? null);
    
    // Use startTransition to allow lazy loading
    startTransition(() => {
      setCurrentPage(targetPage);
    });

    switch (targetPage) {
      case "user-dashboard":
        if (param === "dashboard") {
          window.history.pushState({}, "", "/user-dashboard/dashboard");
        } else if (param) {
          window.history.pushState({}, "", `/user-dashboard/${param}`);
        } else {
          window.history.pushState({}, "", "/user-dashboard");
        }
        break;

      case "admin-dashboard":
        if (param) {
          window.history.pushState({}, "", `/admin-dashboard/${param}`);
        } else {
          window.history.pushState({}, "", "/admin-dashboard");
        }
        break;

      case "purchase":
        window.history.pushState({}, "", `/purchase/${param ?? ""}`);
        break;

      case "reader":
        if (param?.id) {
          window.history.pushState({}, "", `/reader/${param.id}`);
        }
        break;

      case "reader-note":
        window.history.pushState({}, "", `/notes/read/${param}`);
        break;

      case "test":
        window.history.pushState({}, "", `/test/${param}`);
        break;

      case "writing":
        window.history.pushState({}, "", "/writing");
        break;

      default:
        window.history.pushState({}, "", `/${page}`);
    }
  };

  /* ============================================================
     9) LOGOUT
  ============================================================ */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("isLoggedIn");

    window.dispatchEvent(new Event("authChanged"));

    setUserRole(null);
    startTransition(() => {
      setCurrentPage("home");
    });
    window.history.pushState({}, "", "/");
  };

  /* ============================================================
     LOADING SCREEN
  ============================================================ */
  if (!authReady || !routerReady) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] w-full">
        {/* Skeleton Top Navbar */}
        <div className="h-16 w-full bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="w-32 h-8 bg-gray-200 rounded-md animate-pulse" />
          <div className="flex gap-4">
            <div className="w-16 h-8 bg-gray-200 rounded-md animate-pulse hidden sm:block" />
            <div className="w-24 h-8 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Skeleton Main Content Layout */}
        <div className="max-w-7xl mx-auto p-6 mt-8">
          <div className="w-48 h-10 bg-gray-200 rounded-md animate-pulse mb-8" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="h-32 bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-4" />
              <div className="w-24 h-4 bg-gray-200 rounded mb-2" />
              <div className="w-16 h-6 bg-gray-200 rounded" />
            </div>
            <div className="h-32 bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse hidden md:block">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-4" />
              <div className="w-24 h-4 bg-gray-200 rounded mb-2" />
              <div className="w-16 h-6 bg-gray-200 rounded" />
            </div>
            <div className="h-32 bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse hidden md:block">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-4" />
              <div className="w-24 h-4 bg-gray-200 rounded mb-2" />
              <div className="w-16 h-6 bg-gray-200 rounded" />
            </div>
          </div>

          <div className="h-64 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  /* ============================================================
     RENDER PAGES
  ============================================================ */
  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* HOME */}
      {currentPage === "home" && <Home onNavigate={handleNavigate} onOpenBook={handleOpenBook} />}

      {/* USER DASHBOARD */}
      {currentPage === "user-dashboard" && (
        <ErrorBoundary fallback={<div className="p-6">Error loading dashboard</div>}>
          <Suspense fallback={
            <div className="min-h-screen bg-[#f5f6f8]">
              <div className="flex">
                <div className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-screen p-4 space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                  ))}
                </div>
                <div className="flex-1 p-6 space-y-6">
                  <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-28 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse" />
                    ))}
                  </div>
                  <div className="h-64 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse" />
                </div>
              </div>
            </div>
          }>
            <UserDashboard
              key={`${currentPage}-${pageParam}`}
              activeTab={pageParam || "dashboard"}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
              onOpenBook={handleOpenBook}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* ADMIN DASHBOARD */}
      {currentPage === "admin-dashboard" && (
        <ErrorBoundary fallback={<div className="p-6">Error loading admin dashboard</div>}>
          <Suspense fallback={
            <div className="min-h-screen bg-[#f5f6f8]">
              <div className="flex">
                <div className="hidden md:block w-64 bg-white border-r border-gray-200 min-h-screen p-4 space-y-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                  ))}
                </div>
                <div className="flex-1 p-6 space-y-6">
                  <div className="h-8 w-56 bg-gray-200 rounded-md animate-pulse" />
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-24 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse" />
                    ))}
                  </div>
                  <div className="h-72 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse" />
                </div>
              </div>
            </div>
          }>
            <AdminDashboard
              key={`${currentPage}-${pageParam}`}
              activeSection={pageParam}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* READER */}
      {currentPage === "reader" && pageParam && (
        <ErrorBoundary fallback={<div className="p-6">Error opening book</div>}>
          <Suspense fallback={
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-48 h-64 bg-gray-800 rounded-lg animate-pulse mx-auto" />
                <div className="w-32 h-4 bg-gray-700 rounded animate-pulse mx-auto" />
              </div>
            </div>
          }>
            <BookReader
              bookId={pageParam.id}
              startPage={pageParam.last_page || 1}
              onClose={() => {
                startTransition(() => {
                  setCurrentPage(previousPage);
                });
                window.history.pushState({}, "", `/${previousPage}`);
              }}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* NOTE READER */}
      {currentPage === "reader-note" && pageParam && (
        <ErrorBoundary fallback={<div className="p-6">Error loading notes</div>}>
          <Suspense fallback={
            <div className="min-h-screen bg-[#f5f6f8] p-6">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="h-8 w-40 bg-gray-200 rounded-md animate-pulse" />
                <div className="h-96 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse" />
              </div>
            </div>
          }>
            <ReadNotePage
              noteId={pageParam}
              onNavigate={handleNavigate}
              onClose={() => {
                startTransition(() => {
                  setCurrentPage("user-dashboard");
                });
                window.history.pushState({}, "", `/user-dashboard`);
                setTimeout(() => {
                  window.dispatchEvent(new Event("open-dashboard-notes"));
                }, 0);
              }}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* PURCHASE */}
      {currentPage === "purchase" && pageParam && (
        <UniversalPurchasePage id={pageParam} onNavigate={handleNavigate} />
      )}

      {/* PUBLIC PAGES */}
      {["explore", "pricing", "about", "contact", "privacy", "terms", "forgot-password", "drm"].includes(currentPage) && (
        <PublicPages
          page={currentPage as any}
          onNavigate={handleNavigate as any}
          onLogin={handleLogin}
        />
      )}

      {["login", "register"].includes(currentPage) && (
        <PublicPages
          page={currentPage as any}
          onNavigate={handleNavigate as any}
          onLogin={handleLogin}
        />
      )}

      {currentPage === "test" && pageParam && (
        <ErrorBoundary fallback={<div className="p-6">Error loading test</div>}>
          <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
              <div className="w-40 h-10 bg-gray-200 rounded-full animate-pulse mb-6" />
              <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-4xl space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-3 border-b pb-4">
                    <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }>
            <TestPage
              testId={pageParam}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      <Toaster />
    </div>
  );
}