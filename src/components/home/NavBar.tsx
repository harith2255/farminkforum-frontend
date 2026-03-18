import { Button } from "../ui/button";
import * as React from "react";

interface NavbarProps {
  onNavigate: (page: string) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-[#0f3b53] to-[#1d4d6a] shadow-lg backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 lg:px-15 py-3">

        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => onNavigate("home")}
        >
          <img
            src="/logooutline.png"
            alt="FarmInk Forum Logo"
            className="h-10 sm:h-12 md:h-15 w-auto object-contain drop-shadow-lg"
          />
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {["home", "explore", "pricing", "about", "contact"].map((page) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className="text-white hover:text-[#bf2026] font-medium tracking-wide transition whitespace-nowrap"
            >
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </button>
          ))}

          <Button
            onClick={() => onNavigate("login")}
            className="bg-[#bf2026] hover:bg-[#a01c22] text-white rounded-xl px-5 lg:px-6 py-2 shadow-md transition"
          >
            Sign In
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white text-2xl font-bold"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-4 bg-[#0f3b53] bg-opacity-95 px-6 py-6 shadow-lg">

          {["home", "explore", "pricing", "about", "contact"].map((page) => (
            <button
              key={page}
              onClick={() => {
                onNavigate(page);
                setMenuOpen(false); // close menu after clicking link
              }}
              className="text-white text-left font-medium text-lg hover:text-[#bf2026] transition"
            >
              {page.charAt(0).toUpperCase() + page.slice(1)}
            </button>
          ))}

          <Button
            onClick={() => {
              onNavigate("login");
              setMenuOpen(false);
            }}
            className="bg-[#bf2026] hover:bg-[#a01c22] text-white rounded-xl px-6 py-2 shadow-md transition"
          >
            Sign In
          </Button>
        </div>
      )}
    </nav>
  );
}
