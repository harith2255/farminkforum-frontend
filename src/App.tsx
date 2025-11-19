import { useEffect, useState } from "react";
import { Home } from "./components/Home";
import { UserDashboard } from "./components/UserDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { PublicPages } from "./components/PublicPages";
import { BookReader } from "./components/BookReader";
import { Toaster } from "./components/ui/sonner";
import TestPage from "./components/user/Testpage";
import BuyNowPage from "./components/user/BuyNowPage";

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
  | "test"
  | "collections"
  | "buynow";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [userRole, setUserRole] = useState<"user" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);

  /* ----------------------------------------------------------
     1. Detect route on first load
  ---------------------------------------------------------- */
useEffect(() => {
    const path = window.location.pathname;

    if (path === "/test") setCurrentPage("test");
    else if (path === "/user-dashboard") setCurrentPage("user-dashboard");
    else if (path === "/admin-dashboard") setCurrentPage("admin-dashboard");
    else if (path === "/buynow") setCurrentPage("buynow");
    else if (path.startsWith("/collections")) {
      setCurrentPage("collections");
      const id = path.split("/collections/")[1];
      if (id) localStorage.setItem("currentCollectionId", id);
    } else {
      const clean = path.replace("/", "");
      const valid = [
        "explore",
        "pricing",
        "about",
        "contact",
        "login",
        "register",
      ];
      if (valid.includes(clean)) setCurrentPage(clean as Page);
      else setCurrentPage("home");
    }
  }, []);

  /* ----------------------------------------------------------
     2. Restore login + role AFTER route detection
        (Important fix to avoid overriding user navigation)
  ---------------------------------------------------------- */
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    const role = localStorage.getItem("role") as "user" | "admin" | null;

    if (loggedIn && role) {
      setUserRole(role);

      // Only redirect if the current page is home
      if (currentPage === "home") {
        setCurrentPage(role === "admin" ? "admin-dashboard" : "user-dashboard");
      }
    }

    setLoading(false);
  }, [currentPage]);

  /* ----------------------------------------------------------
     3. Scroll to top on navigation
  ---------------------------------------------------------- */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  /* ----------------------------------------------------------
     Navigation Handlers
  ---------------------------------------------------------- */
  const handleLogin = (role: "user" | "admin") => {
    setUserRole(role);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("role", role);

    const page = role === "admin" ? "admin-dashboard" : "user-dashboard";
    setCurrentPage(page);
    window.history.pushState({}, "", `/${page}`);
  };

  const handleOpenBook = (book: any) => {
    setSelectedBook(book);
    setCurrentPage("reader");
    window.history.pushState({}, "", "/reader");
  };

  const handleNavigate = (page: string, id?: number) => {
    // ⭐ NEW: Buy Now page protection
    if (page === "buynow") {
      const loggedIn = localStorage.getItem("isLoggedIn");

      if (!loggedIn) {
        setCurrentPage("login");
        window.history.pushState({}, "", "/login");
        return;
      }
    }

        setCurrentPage(page as Page);


    if (page === "collections" && id) {
      localStorage.setItem("currentCollectionId", id.toString());
      window.history.pushState({}, "", `/collections/${id}`);
    } else {
      window.history.pushState({}, "", `/${page === "home" ? "" : page}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("role");

    setUserRole(null);
    setCurrentPage("home");
    window.history.pushState({}, "", "/");
  };

  /* ----------------------------------------------------------
     Loading Screen
  ---------------------------------------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-t-[#bf2026] border-gray-300 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-3 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------
     Page Rendering
  ---------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      {/* Home */}
      {currentPage === "home" && (
        <Home onNavigate={handleNavigate} onOpenBook={handleOpenBook} />
      )}

      {/* User Dashboard */}
      {currentPage === "user-dashboard" && userRole === "user" && (
        <UserDashboard
          onNavigate={handleNavigate}
          onOpenBook={handleOpenBook}
          onLogout={handleLogout}
        />
      )}

      {/* Admin Dashboard (Protected) */}
      {currentPage === "admin-dashboard" &&
        (userRole === "admin" ? (
          <AdminDashboard onNavigate={handleNavigate} onLogout={handleLogout} />
        ) : (
          <div className="p-10 text-center text-red-600 font-semibold">
            Access Denied
          </div>
        ))}

      {/* Reader */}
      {currentPage === "reader" && selectedBook && (
        <BookReader book={selectedBook} onClose={() => setCurrentPage("user-dashboard")} />
      )}

      {/* Public Pages */}
      {["explore", "pricing", "about", "contact", "login", "register"].includes(currentPage) && (
        <PublicPages page={currentPage as any} onNavigate={handleNavigate} onLogin={handleLogin} />
      )}

      {/* Test page */}
      {currentPage === "test" && (
        <TestPage onNavigate={handleNavigate} onLogout={handleLogout} />
      )}

      {/* ⭐ NEW Buy Now page */}
      {currentPage === "buynow" && (
        <BuyNowPage onNavigate={handleNavigate} onLogout={handleLogout} />
      )}

      <Toaster />
    </div>
  );
}
