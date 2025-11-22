import { useEffect, useState } from "react";
import { Home } from "./components/Home";
import { UserDashboard } from "./components/UserDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { PublicPages } from "./components/PublicPages";
import { BookReader } from "./components/BookReader";
import { Toaster } from "./components/ui/sonner";
import TestPage from "./components/user/Testpage";
import PurchasePage from "./components/PurchasePage";
import * as React from "react";

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
  | "cart";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [previousPage, setPreviousPage] = useState<Page>("home");
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"user" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);

  /* ----------------------------------------------------
     ⭐ INITIAL PAGE DETECTION
  ---------------------------------------------------- */
  useEffect(() => {
    const path = window.location.pathname;

    if (path === "/cart" || path === "/cart/") {
      setCurrentPage("user-dashboard");
      setTimeout(() => {
        window.history.replaceState({}, "", "/user-dashboard");
        window.dispatchEvent(new CustomEvent("open-cart-page"));
      }, 20);
      return;
    }

    if (path.startsWith("/purchase/")) {
      const id = path.split("/purchase/")[1];
      setSelectedPurchaseId(id);
      setCurrentPage("purchase");
      return;
    }

    if (path.startsWith("/reader")) {
      setCurrentPage("reader");
      return;
    }

    if (path.startsWith("/test")) {
      setCurrentPage("test");
      return;
    }

    // 🔥 FIX: Handle ALL user-dashboard sub-routes
    if (path.startsWith("/user-dashboard")) {
      setCurrentPage("user-dashboard");
      return;
    }

    if (path === "/admin-dashboard") {
      setCurrentPage("admin-dashboard");
    } else if (
      ["/explore", "/pricing", "/about", "/contact", "/login", "/register"].includes(path)
    ) {
      setCurrentPage(path.replace("/", "") as Page);
    } else {
      setCurrentPage("home");
    }
  }, []);

  /* ----------------------------------------------------
     ⭐ RESTORE SESSION
  ---------------------------------------------------- */
  useEffect(() => {
    const path = window.location.pathname;

    const loggedIn = localStorage.getItem("isLoggedIn");
    const role = localStorage.getItem("role");

    if (!loggedIn || !role) {
      setLoading(false);
      return;
    }

    setUserRole(role as "user" | "admin");

    // Admin dashboard restore
    if (path.startsWith("/admin-dashboard")) {
      setCurrentPage("admin-dashboard");
      setLoading(false);
      return;
    }

    // User dashboard restore + restore section
    if (path.startsWith("/user-dashboard")) {
      setCurrentPage("user-dashboard");

      const sub = path.replace("/user-dashboard/", "").trim();

      if (sub && sub.length > 0) {
        window.dispatchEvent(
          new CustomEvent("restore-user-section", { detail: sub })
        );
      }

      setLoading(false);
      return;
    }

    // Default redirect (only if user at "/")
    if (path === "/" || path === "") {
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
        <PurchasePage
          bookId={selectedPurchaseId}
          noteId={selectedPurchaseId}
          onNavigate={handleNavigate}
        />
      )}

      {["pricing", "about", "contact", "login", "register"].includes(currentPage) && (
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