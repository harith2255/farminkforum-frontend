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

import { useEffect, useState } from "react";
import { Home } from "./components/Home";

import { PublicPages } from "./components/PublicPages";

import { Toaster } from "./components/ui/sonner";

import UniversalPurchasePage from "./components/PurchasePage";
import * as React from "react";
import axios from "axios";

import { lazy, Suspense } from "react";

const UserDashboard = lazy(() =>
  import("./components/UserDashboard")
);

const AdminDashboard = lazy(() =>
  import("./components/AdminDashboard")
);

const BookReader = lazy(() =>
  import("./components/BookReader")
);

const TestPage = lazy(() =>
  import("./components/user/Testpage")
);

const ReadNotePage = lazy(() =>
  import("./components/ReadNotePage")
);




/* ============================================================
   AXIOS INTERCEPTOR – AUTO LOGOUT ON BAN + EXPIRED TOKEN
============================================================ */

// axios.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     const status = err?.response?.status;
//     const url = err?.config?.url || "";

//     // 🔒 NEVER logout automatically
//     if (status === 401 || status === 403) {
//       console.warn("⏭ Auth error ignored:", url);
//       return Promise.reject(err);
//     }

//     return Promise.reject(err);
//   }
// );





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
  | "reader-note";
  


export default function App() {
const [currentPage, setCurrentPage] = useState<Page>("home");

  const [pageParam, setPageParam] = useState<any>(null);
  const [previousPage, setPreviousPage] = useState<Page>("home");
  const [userRole, setUserRole] = useState<"user" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
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
          `https://ebook-backend-lxce.onrender.com/api/library/progress/${bookId}`,
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
     3) ROUTE RESOLVER
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

  if (path === "/user-dashboard") {
  window.history.replaceState({}, "", "/user-dashboard/dashboard");
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

  // fallback static pages
  const staticPages = ["explore", "pricing", "about", "contact", "login", "register"];
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

  setCurrentPage(r.page ?? "home");
  setPageParam(r.param ?? null);
};


    window.addEventListener("popstate", sync);
    window.addEventListener("pushstate", sync);

    sync(); // INITIAL

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
    setCurrentPage(target as Page);
    window.history.pushState({}, "", `/${target}`);
  };

  /* ============================================================
     8) NAVIGATE
  ============================================================ */
const handleNavigate = (page: Page, param?: any) => {
  setPreviousPage(currentPage);
  setPageParam(param ?? null);
  setCurrentPage(page);

  switch (page) {
    case "user-dashboard":
      window.history.pushState({}, "", "/user-dashboard");
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
setCurrentPage("home");
window.history.pushState({}, "", "/");


};


  /* ============================================================
     LOADING SCREEN
  ============================================================ */
if (!authReady) {
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
  <Suspense fallback={<div className="p-6">Loading dashboard…</div>}>
    <UserDashboard
  activeTab={pageParam || "dashboard"}
  onNavigate={handleNavigate}
  onLogout={handleLogout}
  onOpenBook={handleOpenBook}
/>

  </Suspense>
)}




      {/* ADMIN DASHBOARD */}
    {currentPage === "admin-dashboard" && (
  <AdminDashboard
    onNavigate={handleNavigate}
    onLogout={handleLogout}
  />
)}




      {/* READER */}
    {currentPage === "reader" && pageParam && (
  <Suspense fallback={<div className="p-6">Opening book…</div>}>
    <BookReader
      bookId={pageParam.id}
      startPage={pageParam.last_page || 1}
      onClose={() => {
        setCurrentPage(previousPage);
        window.history.pushState({}, "", `/${previousPage}`);
      }}
    />
  </Suspense>
)}




      {/* NOTE READER */}
{currentPage === "reader-note" && pageParam && (
  <Suspense fallback={<div className="p-6">Loading notes…</div>}>
    <ReadNotePage
      noteId={pageParam}
      onNavigate={handleNavigate}
      onClose={() => {
        setCurrentPage("user-dashboard");
        window.history.pushState({}, "", `/user-dashboard`);
        setTimeout(() => {
          window.dispatchEvent(new Event("open-dashboard-notes"));
        }, 0);
      }}
    />
  </Suspense>
)}





      {/* PURCHASE */}
      {currentPage === "purchase" && pageParam && (
        <UniversalPurchasePage id={pageParam} onNavigate={handleNavigate} />
      )}

      {/* PUBLIC PAGES */}
     {["explore", "pricing", "about", "contact"].includes(currentPage) && (
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
  <Suspense fallback={<div className="p-6">Loading test…</div>}>
    <TestPage
      testId={pageParam}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    />
  </Suspense>
)}




      <Toaster />
    </div>
  );
}