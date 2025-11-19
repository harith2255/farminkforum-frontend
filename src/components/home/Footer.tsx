import React from "react";
import { BookOpen } from "lucide-react";

interface FooterProps {
  onNavigate: (path: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="relative bg-[#1d4d6a] text-white py-10">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent_70%)] pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Grid layout */}
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          {/* Brand Section */}
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <img
                src="/logooutline.png"
                alt="FarmInk Forum Logo"
                className="h-15 w-auto object-contain drop-shadow-sm"
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your trusted platform for academic excellence and continuous learning.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="mb-4 font-semibold text-lg">Platform</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>
                <button
                  onClick={() => onNavigate("explore")}
                  className="hover:text-white transition-colors"
                >
                  Explore Books
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("pricing")}
                  className="hover:text-white transition-colors"
                >
                  Pricing
                </button>
              </li>
              <li>
                <button className="hover:text-white transition-colors">
                  Features
                </button>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="mb-4 font-semibold text-lg">Company</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>
                <button
                  onClick={() => onNavigate("about")}
                  className="hover:text-white transition-colors"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("contact")}
                  className="hover:text-white transition-colors"
                >
                  Contact
                </button>
              </li>
              <li>
                <button className="hover:text-white transition-colors">
                  Careers
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="mb-4 font-semibold text-lg">Legal</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>
                <button className="hover:text-white transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button className="hover:text-white transition-colors">
                  Terms of Service
                </button>
              </li>
              <li>
                <button className="hover:text-white transition-colors">
                  DRM Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-600 pt-8 text-center text-sm text-gray-300">
          <p>&copy; 2025 FarmInk Forum. All rights reserved.</p>
        </div>
      </div>

      {/* Decorative blur shapes */}
      <div className="absolute top-8 right-10 w-28 h-28 bg-[#bf2026]/20 blur-2xl rounded-full"></div>
      <div className="absolute bottom-8 left-10 w-32 h-32 bg-white/10 blur-3xl rounded-full"></div>
    </footer>
  );
}
