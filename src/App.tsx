import { useEffect, useState } from "react";
import { Home } from "./components/Home";
import { UserDashboard } from "./components/UserDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { PublicPages } from "./components/PublicPages";
import { BookReader } from "./components/BookReader";
import { Toaster } from "./components/ui/sonner";
import TestPage from "./components/user/Testpage";
import UniversalPurchasePage from "./components/PurchasePage";
import * as React from "react";
import axios from "axios";
import ReadNotePage from "./components/ReadNotePage";



/* ============================================================
   AXIOS INTERCEPTOR – 401 + 403 BAN + TOKEN REVOKE LOGOUT
============================================================ */

/* ============================================================
   AXIOS INTERCEPTOR – AUTO LOGOUT ON BAN + EXPIRED TOKEN
============================================================ */

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const msg = err?.response?.data?.error?.toLowerCase() || "";
    const path = window.location.pathname;

    const isDashboard =
      path.startsWith("/user-dashboard") ||
      path.startsWith("/admin-dashboard");

    /* ========================================================
       1. SUSPENDED / BANNED USER
       - Backend should return 403 with message "suspended" or "ban"
    ========================================================= */
    if (
      status === 403 &&
      (msg.includes("suspend") || msg.includes("ban"))
    ) {
      console.warn("⚠ Suspended/Banned — force logout");

      // Clear session
      localStorage.clear();

      // Redirect without back button
      window.location.replace("/login?reason=suspended");
      return Promise.reject(err);
    }

    /* ========================================================
       2. TOKEN EXPIRED / REVOKED
       - Supabase often returns 401 on revoked tokens
    ========================================================= */
    if (status === 401 && isDashboard) {
      console.warn("⚠ Token expired / invalid — force logout");

      localStorage.clear();

      window.location.replace("/login?reason=expired");
      return Promise.reject(err);
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
  | "reader-note";
  

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [pageParam, setPageParam] = useState<any>(null);
  const [previousPage, setPreviousPage] = useState<Page>("home");
  const [userRole, setUserRole] = useState<"user" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);
/* ============================================================
   GLOBAL BOOK READING PROGRESS LISTENER
============================================================ */
useEffect(() => {
  async function handleReaderProgress(e: any) {
    const { bookId, page, totalPages } = e.detail || {};

    if (!bookId || !page || !totalPages) {
      console.warn("⚠️ Invalid progress event payload", e.detail);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("⚠️ No token — skipping progress update");
      return;
    }

    const percent = Math.min(100, Math.round((page / totalPages) * 100));

    console.log("📩 RECEIVED PROGRESS EVENT", {
      bookId,
      page,
      percent,
      totalPages,
    });

    try {
      const res = await axios.put(
        `https://ebook-backend-lxce.onrender.com/api/library/progress/${bookId}`,
        { progress: percent, last_page: page },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Progress updated:", res.data);
    } catch (err: any) {
      console.error("❌ Progress update failed:", err.response?.data || err);
    }
  }

  window.addEventListener("reader:progress", handleReaderProgress);

  return () => {
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

  if (path.startsWith("/user-dashboard")) {
    return { page: "user-dashboard", param: null };
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
    const logged = localStorage.getItem("isLoggedIn");
    const role = localStorage.getItem("role");

    if (logged && role) {
      setUserRole(role as any);
    }

    setLoading(false);
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
  const handleNavigate = (page: string, param?: string) => {
    setPreviousPage(currentPage!);

    if (page === "reader-note") {
      setCurrentPage("reader-note");
      setPageParam(Number(param));
      window.history.pushState({}, "", `/notes/read/${param}`);
      return;
    }
if (page === "reader") {
  const meta =
    typeof param === "object"
      ? param
      : { id: param, last_page: 1 };

  // Save full metadata in localStorage
  localStorage.setItem("open_book_meta", JSON.stringify(meta));

  setCurrentPage("reader");
  setPageParam(meta);

  window.history.pushState({}, "", `/reader/${meta.id}`);
  return;
}


    if (page === "purchase") {
      const id = param || "";
      setCurrentPage("purchase");
      setPageParam(id);
      window.history.pushState({}, "", `/purchase/${id}`);
      return;
    }

    setCurrentPage(page as Page);
    window.history.pushState({}, "", `/${page}`);
  };

  /* ============================================================
     9) LOGOUT
  ============================================================ */
  const handleLogout = () => {
    // Remove all tokens ALWAYS
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("isLoggedIn");

    // Notify app
    window.dispatchEvent(new Event("authChanged"));

    setUserRole(null);
    setCurrentPage("home");
    window.history.pushState({}, "", "/");
  };

  /* ============================================================
     LOADING SCREEN
  ============================================================ */
  if (loading || currentPage === null) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div>Loading...</div>
      </div>
    );
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
        <UserDashboard onNavigate={handleNavigate} onLogout={handleLogout} onOpenBook={handleOpenBook}/>
      )}

      {/* ADMIN DASHBOARD */}
      {currentPage === "admin-dashboard" && (
        <AdminDashboard onNavigate={handleNavigate} onLogout={handleLogout} />
      )}

      {/* READER */}
    {currentPage === "reader" && pageParam && (
  <BookReader
    bookId={pageParam.id}
    startPage={pageParam.last_page || 1}
    onClose={() => {
      setCurrentPage(previousPage);
      window.history.pushState({}, "", `/${previousPage}`);
    }}
  />
)}



      {/* NOTE READER */}
{currentPage === "reader-note" && pageParam && (
  <ReadNotePage
    noteId={pageParam}
    onNavigate={handleNavigate}
    onClose={() => {
      setCurrentPage("user-dashboard");
      window.history.pushState({}, "", `/user-dashboard`);
      
      // Optional: trigger dashboard to open notes tab
      setTimeout(() => {
        window.dispatchEvent(new Event("open-dashboard-notes"));
      }, 0);
    }}
  />
)}




      {/* PURCHASE */}
      {currentPage === "purchase" && pageParam && (
        <UniversalPurchasePage id={pageParam} onNavigate={handleNavigate} />
      )}

      {/* PUBLIC PAGES */}
      {["explore", "pricing", "about", "contact", "login", "register"].includes(
        currentPage
      ) && (
        <PublicPages
          page={currentPage as any}
          onNavigate={handleNavigate}
          onLogin={handleLogin}
        />
      )}

      {currentPage === "test" && pageParam && (
  <TestPage 
    testId={pageParam}
    onNavigate={handleNavigate}
    onLogout={handleLogout}
  />
)}



      <Toaster />
    </div>
  );
}