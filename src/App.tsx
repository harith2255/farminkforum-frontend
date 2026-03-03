// 🔥 DEBUG: trace who clears auth
const originalClear = localStorage.clear;
localStorage.clear = function () {
  console.error("❌ localStorage.clear() CALLED");
  console.trace(); // ← THIS IS THE KEY
  originalClear.apply(this, arguments as any);
};

const originalRemoveItem = localStorage.removeItem;
localStorage.removeItem = function (key) {
  if (key === "token") {
    console.error("❌ token REMOVED");
    console.trace(); // ← EXACT FILE + LINE
  }
  originalRemoveItem.apply(this, arguments as any);
};

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

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 🔥 THIS WAS MISSING
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
            `https://e-book-backend-production.up.railway.app/api/library/progress/${bookId}`,
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

    if (path.startsWith("/notes/read/")) {
      const id = Number(path.split("/").pop());
      return { page: "reader-note", param: id };
    }

    if (path.startsWith("/reader/")) {
      const meta = JSON.parse(localStorage.getItem("open_book_meta") || "{}");

      // fallback if someone manually types URL
      if (!meta?.id) {
        const id = path.split("/").pop();
        return { page: "reader", param: { id, last_page: 1 } };
      }

      return { page: "reader", param: meta };
    }

    if (path.startsWith("/purchase/")) {
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
      const id = path.split("/").pop();
      return { page: "test", param: id };
    }

    if (path.startsWith("/admin-dashboard")) {
      return { page: "admin-dashboard", param: null };
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
      "drm",
    ];
    const page = path.replace("/", "");
    if (staticPages.includes(page)) {
      return { page: page as Page, param: null };
    }

    // fallback always return
    return { page: "home", param: null };
  };

  /* ============================================================
     4) SYNC ROUTER — Single clean listener
  ============================================================ */
  useEffect(() => {
    const sync = () => {
      const r = resolveRoute();
      if (!r) return;

      // Use startTransition to allow lazy loading during navigation
      startTransition(() => {
        setCurrentPage(r.page);
        setPageParam(r.param);
      });
      setRouterReady(true); // ✅ key
    };

    window.addEventListener("popstate", sync);
    window.addEventListener("pushstate", sync);

    sync(); // initial

    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("pushstate", sync);
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
  const handleNavigate = (page: Page, param?: any) => {
    setPreviousPage(currentPage);
    setPageParam(param ?? null);
    
    // Use startTransition to allow lazy loading
    startTransition(() => {
      setCurrentPage(page);
    });

    switch (page) {
      case "user-dashboard":
        if (param === "dashboard") {
          window.history.pushState({}, "", "/user-dashboard/dashboard");
        } else {
          window.history.pushState({}, "", "/user-dashboard");
        }
        break;

      case "admin-dashboard":
        window.history.pushState({}, "", "/admin-dashboard");
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

      default:
        window.history.pushState({}, "", `/${page}`);
    }
  };

  /* ============================================================
     9) LOGOUT
  ============================================================ */
  const handleLogout = () => {
    console.trace("🔥 LOGOUT CALLED");
    debugger;

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
    return <div className="min-h-screen bg-[#f5f6f8]" />;
  }

  /* ============================================================
     RENDER PAGES
  ============================================================ */
  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* HOME */}
      {currentPage === "home" && <Home onNavigate={handleNavigate} />}

      {/* USER DASHBOARD */}
      {currentPage === "user-dashboard" && (
        <ErrorBoundary fallback={<div className="p-6">Error loading dashboard</div>}>
          <Suspense fallback={<div className="p-6">Loading dashboard...</div>}>
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
          <Suspense fallback={<div className="p-6">Loading admin dashboard...</div>}>
            <AdminDashboard
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* READER */}
      {currentPage === "reader" && pageParam && (
        <ErrorBoundary fallback={<div className="p-6">Error opening book</div>}>
          <Suspense fallback={<div className="p-6">Opening book…</div>}>
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
          <Suspense fallback={<div className="p-6">Loading notes…</div>}>
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
      {["explore", "pricing", "about", "contact", "privacy", "terms", "drm"].includes(currentPage) && (
        <PublicPages
          page={currentPage as any}
          onNavigate={handleNavigate}
          onLogin={handleLogin}
        />
      )}

      {["login", "register"].includes(currentPage) && (
        <PublicPages
          page={currentPage as any}
          onNavigate={handleNavigate}
          onLogin={handleLogin}
        />
      )}

      {currentPage === "test" && pageParam && (
        <ErrorBoundary fallback={<div className="p-6">Error loading test</div>}>
          <Suspense fallback={<div className="p-6">Loading test…</div>}>
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