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

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
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
  | "cart"
  | "test";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [previousPage, setPreviousPage] = useState<Page>("home");
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"user" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);

   /* --------------------------------------------------
     URL → PAGE MAPPER (we will reuse it)
  -------------------------------------------------- */
  const resolveRoute = () => {
    const path = window.location.pathname;

    if (path.startsWith("/purchase")) return "purchase";
    if (path.startsWith("/reader")) return "reader";
    if (path.startsWith("/test")) return "test";
    if (path.startsWith("/user-dashboard")) return "user-dashboard";
    if (path.startsWith("/admin-dashboard")) return "admin-dashboard";

    const staticPages = ["/explore", "/pricing", "/about", "/contact", "/login", "/register"];
    if (staticPages.includes(path)) return path.replace("/", "") as Page;

    return "home";
  };

  /* --------------------------------------------------
     INITIAL ROUTE DETECTION
  -------------------------------------------------- */
  useEffect(() => {
    setCurrentPage(resolveRoute());
  }, []);

  /* --------------------------------------------------
     HANDLE BROWSER BACK/FORWARD
  -------------------------------------------------- */
  useEffect(() => {
    const handler = () => {
      const nextPage = resolveRoute();
      setCurrentPage(nextPage);

      // Handle restoring dashboard subsection
      if (nextPage === "user-dashboard") {
        const section = window.location.pathname.replace("/user-dashboard/", "").trim();
        if (section.length > 0) {
          window.dispatchEvent(new CustomEvent("restore-user-section", { detail: section }));
        }
      }
    };

    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  /* --------------------------------------------------
     RESTORE SESSION
  -------------------------------------------------- */
  useEffect(() => {
    const path = window.location.pathname;

    const logged = localStorage.getItem("isLoggedIn");
    const role = localStorage.getItem("role");

    if (!logged || !role) {
      setLoading(false);
      return;
    }

    setUserRole(role as "user" | "admin");

    if (path.startsWith("/user-dashboard")) {
      setCurrentPage("user-dashboard");

      const section = path.replace("/user-dashboard/", "").trim();
      if (section.length > 0) {
        window.dispatchEvent(new CustomEvent("restore-user-section", { detail: section }));
      }

      setLoading(false);
      return;
    }

    if (path.startsWith("/admin-dashboard")) {
      setCurrentPage("admin-dashboard");
      setLoading(false);
      return;
    }

    if (path === "/") {
      if (role === "admin") {
        setCurrentPage("admin-dashboard");
        window.history.replaceState({}, "", "/admin-dashboard");
      } else {
        setCurrentPage("user-dashboard");
        window.history.replaceState({}, "", "/user-dashboard");
      }
    }

    setLoading(false);
  }, []);


  /* ----------------------------------------------------
     ⭐ SCROLL TO TOP
  ---------------------------------------------------- */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  /* ----------------------------------------------------
     ⭐ LOGIN
  ---------------------------------------------------- */
  const handleLogin = (role: "user" | "admin") => {
    setUserRole(role);
    setCurrentPage(role === "user" ? "user-dashboard" : "admin-dashboard");

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("role", role);

    window.history.pushState({}, "", `/${role === "user" ? "user-dashboard" : "admin-dashboard"}`);
  };

  /* ----------------------------------------------------
     ⭐ OPEN READER
  ---------------------------------------------------- */
  const handleOpenBook = (book: any) => {
    setPreviousPage(currentPage!);
    setSelectedBook(book);
    setCurrentPage("reader");
    window.history.pushState({}, "", "/reader");
  };

  /* ----------------------------------------------------
     ⭐ NAVIGATION HANDLER
  ---------------------------------------------------- */
  const handleNavigate = (page: string) => {
    setPreviousPage(currentPage!);

    if (page === "cartpage" || page === "cart") {
      setCurrentPage("user-dashboard");
      window.history.pushState({}, "", "/user-dashboard");

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("open-cart-page"));
      }, 20);

      return;
    }

    setCurrentPage(page as Page);
    window.history.pushState({}, "", `/${page === "home" ? "" : page}`);
  };

  /* ----------------------------------------------------
     ⭐ LOGOUT
  ---------------------------------------------------- */
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("role");

    setUserRole(null);
    setCurrentPage("home");
    window.history.pushState({}, "", "/");
  };

  /* ----------------------------------------------------
     ⭐ LOADING SCREEN
  ---------------------------------------------------- */
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

  /* ----------------------------------------------------
     ⭐ RENDER PAGES
  ---------------------------------------------------- */
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

      {currentPage === "purchase" && (
        <UniversalPurchasePage
          bookId={selectedPurchaseId}
          noteId={selectedPurchaseId}
          onNavigate={handleNavigate}
        />
      )}

      {["explore","pricing", "about", "contact", "login", "register"].includes(currentPage) && (
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