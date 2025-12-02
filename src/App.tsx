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

/* --------------------------------------------------
   AXIOS INTERCEPTOR
-------------------------------------------------- */
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;

    if (status === 401) {
      if (window.location.pathname.startsWith("/user-dashboard")) {
        window.location.href = "/login";
      }
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
  (function () {
    const pushState = window.history.pushState;
    window.history.pushState = function (...args) {
      pushState.apply(this, args);
      window.dispatchEvent(new Event("pushstate"));
    };
  })();

  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [pageParam, setPageParam] = useState<any>(null);
  const [previousPage, setPreviousPage] = useState<Page>("home");
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [userRole, setUserRole] = useState<"user" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("session") || "{}");
    if (session?.access_token) {
      localStorage.setItem("token", session.access_token);
    }
  }, []);

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

  // const handleOpenBook = (book: any) => {
  //   // Navigate to reader page
  //   handleNavigate("reader", book.id);
  // };


  useEffect(() => {
    const syncRoute = () => {
      const route = resolveRoute();
      setCurrentPage(route.page);
      setPageParam(route.param);
    };

    window.addEventListener("popstate", syncRoute);
    window.addEventListener("pushstate", syncRoute); // CUSTOM EVENT

    return () => {
      window.removeEventListener("popstate", syncRoute);
      window.removeEventListener("pushstate", syncRoute);
    };
  }, []);

  const resolveRoute = () => {
    const path = window.location.pathname;

    // Notes reader
    if (path.startsWith("/notes/read/")) {
      const id = Number(path.split("/").pop());
      return { page: "reader-note" as Page, param: id };
    }

    // Book reader
    if (path.startsWith("/reader/")) {
      const id = path.split("/").pop();
      return { page: "reader" as Page, param: id };
    }

    // Purchase
    if (path.startsWith("/purchase/")) {
      const id = path.split("/").pop();
      return { page: "purchase" as Page, param: id };
    }

    // Dashboards
    if (path.startsWith("/user-dashboard"))
      return { page: "user-dashboard" as Page, param: null };

    if (path.startsWith("/admin-dashboard"))
      return { page: "admin-dashboard" as Page, param: null };

    // Static pages
    const staticPages = [
      "/explore",
      "/pricing",
      "/about",
      "/contact",
      "/login",
      "/register",
    ];

    if (staticPages.includes(path)) {
      return { page: path.replace("/", "") as Page, param: null };
    }

    return { page: "home" as Page, param: null };
  };

  /* --------------------------------------------------
     RESTORE SESSION
  -------------------------------------------------- */
  const restoreToken = () => {
    const session = JSON.parse(localStorage.getItem("session") || "{}");

    if (session?.access_token) {
      localStorage.setItem("token", session.access_token);
    }
  };
  restoreToken();

  /* --------------------------------------------------
     INITIAL LOAD → resolve route
  -------------------------------------------------- */
  useEffect(() => {
    const route = resolveRoute();
    setCurrentPage(route.page);
    setPageParam(route.param);
  }, []);

  /* --------------------------------------------------
     BACK/FORWARD button
  -------------------------------------------------- */
  useEffect(() => {
    const handler = () => {
      const route = resolveRoute();
      setCurrentPage(route.page);
      setPageParam(route.param);
    };

    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  /* --------------------------------------------------
      AUTO LOGIN RESTORE
  -------------------------------------------------- */
  useEffect(() => {
    const path = window.location.pathname;
    const logged = localStorage.getItem("isLoggedIn");
    const role = localStorage.getItem("role");

    if (!logged || !role) {
      setLoading(false);
      return;
    }

    setUserRole(role as any);

    if (path.startsWith("/user-dashboard")) {
      setCurrentPage("user-dashboard");
      setLoading(false);
      return;
    }

    if (path.startsWith("/admin-dashboard")) {
      setCurrentPage("admin-dashboard");
      setLoading(false);
      return;
    }

    setLoading(false);
  }, []);

  /* --------------------------------------------------
     SCROLL RESTORE
  -------------------------------------------------- */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  /* --------------------------------------------------
     LOGIN
  -------------------------------------------------- */
  const handleLogin = (role: "user" | "admin") => {
    setUserRole(role);
    const target = role === "user" ? "user-dashboard" : "admin-dashboard";
    setCurrentPage(target);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("role", role);
    window.history.pushState({}, "", `/${target}`);
  };

  /* --------------------------------------------------
     OPEN BOOK READER
  -------------------------------------------------- */
  const handleOpenBook = (book: any) => {
    setPreviousPage(currentPage!);
    setSelectedBook(book);
    setCurrentPage("reader");
    window.history.pushState({}, "", `/reader/${book.id}`);
  };

  /* --------------------------------------------------
     NAVIGATION
  -------------------------------------------------- */
  const handleNavigate = (page: string, param?: string) => {
    const newParam = param || null;
    setPreviousPage(currentPage!);

    // -------- FIXED NOTES READER --------
    if (page === "reader-note") {
      const newId = Number(param);

      // FORCE REMOUNT even if same note clicked again
      if (currentPage === "reader-note" && pageParam === newId) {
        setPageParam(null);
        setTimeout(() => setPageParam(newId), 0);
      } else {
        setPageParam(newId);
      }

      setCurrentPage("reader-note");
      window.history.pushState({}, "", `/notes/read/${newId}`);
      return;
    }

    // -------- BOOK READER --------
    if (page === "reader") {
      setCurrentPage("reader");
      setPageParam(param || null);
      window.history.pushState({}, "", `/reader/${param}`);
      return;
    }

    // -------- PURCHASE --------
    if (page === "purchase") {
      const id = param || localStorage.getItem("purchaseId") || "";
      setCurrentPage("purchase");
      setPageParam(id);
      window.history.pushState({}, "", `/purchase/${id}`);
      return;
    }

    // -------- DEFAULT --------
    setCurrentPage(page as Page);
    window.history.pushState({}, "", `/${page}`);
  };

  /* --------------------------------------------------
     LOGOUT
  -------------------------------------------------- */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("role");

    window.dispatchEvent(new Event("authChan"));
    setUserRole(null);
    setCurrentPage("home");
    window.history.pushState({}, "", "/");
  };

  /* --------------------------------------------------
     LOADING SCREEN
  -------------------------------------------------- */
  if (loading || currentPage === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-t-[#bf2026] border-gray-300 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-3 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  /* --------------------------------------------------
     RENDER PAGES
  -------------------------------------------------- */
  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {currentPage === "home" && (
        <Home onNavigate={handleNavigate} onOpenBook={handleOpenBook} />
      )}

      {currentPage === "user-dashboard" && (
        <UserDashboard
          onNavigate={handleNavigate}
          onOpenBook={handleOpenBook}
          onLogout={handleLogout}
        />
      )}

      {currentPage === "admin-dashboard" && (
        <AdminDashboard onNavigate={handleNavigate} onLogout={handleLogout} />
      )}

      {currentPage === "reader" && selectedBook && (
        <BookReader
          book={selectedBook}
          onClose={() => {
            setCurrentPage(previousPage);
            window.history.pushState({}, "", `/${previousPage}`);
          }}
        />
      )}

      {currentPage === "reader-note" && pageParam && (
        <ReadNotePage noteId={pageParam} onNavigate={handleNavigate} />
      )}

      {currentPage === "purchase" && pageParam && (
        <UniversalPurchasePage id={pageParam} onNavigate={handleNavigate} />
      )}

      {["explore", "pricing", "about", "contact", "login", "register"].includes(
        currentPage
      ) && (
          <PublicPages
            page={currentPage as any}
            onNavigate={handleNavigate}
            onLogin={handleLogin}
          />
        )}

      {currentPage === "test" && (
        <TestPage onNavigate={handleNavigate} onLogout={handleLogout} />
      )}

      <Toaster />
    </div>
  );
}