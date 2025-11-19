import React from "react";
import { Button } from "../ui/button"; // adjust import path if needed

interface CTASectionProps {
  onNavigate: (path: string) => void;
}

export function CTASection({ onNavigate }: CTASectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-[#1d4d6a] via-[#2a5f7f] to-[#1d4d6a] text-white py-20 overflow-hidden">
      {/* Decorative Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12),transparent_70%)] pointer-events-none"></div>

      {/* Main Content */}
      <div className="relative max-w-5xl mx-auto text-center px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
          Ready to Transform Your Learning?
        </h2>
        <p className="text-lg md:text-xl mb-10 text-gray-200 max-w-2xl mx-auto">
          Join thousands of students and researchers who trust{" "}
          <span className="font-semibold text-white">FarmInk Forum</span> for their educational growth.
        </p>

        {/* CTA Buttons */}
        <div className="flex  gap-6 justify-center p-8">
          <Button
            onClick={() => onNavigate("register")}
            className="bg-[#bf2026] hover:bg-[#a01c22] text-white px-10 py-5 rounded-lg font-medium text-lg shadow-lg hover:shadow-2xl transition-all hover:scale-105"
          >
            Start Your Free Trial
          </Button>

          <Button
            onClick={() => onNavigate("explore")}
            className="bg-white text-[#1d4d6a] hover:bg-gray-100 px-10 py-5 rounded-lg font-medium text-lg shadow-md hover:shadow-xl transition-all hover:scale-105"
          >
            Browse Library
          </Button>
        </div>
      </div>

      {/* Decorative Blur Shapes */}
      <div className="absolute top-10 right-10 w-24 h-24 bg-[#bf2026]/20 blur-2xl rounded-full"></div>
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-white/10 blur-3xl rounded-full"></div>
    </section>
  );
}
