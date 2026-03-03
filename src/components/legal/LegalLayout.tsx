import React from "react";

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({ title, lastUpdated, children }) => {
  return (
    <div className="bg-[#f5f6f8] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-[#1d4d6a] px-8 py-10 text-white text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{title}</h1>
          <p className="text-gray-300 text-sm">Last Updated: {lastUpdated}</p>
        </div>
        
        <div className="px-8 py-12 prose prose-blue max-w-none text-gray-700">
          <div className="space-y-8">
            {children}
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            For any queries regarding our policies, please contact us at{" "}
            <a href="mailto:farminkforum@gmail.com" className="text-[#bf2026] font-medium hover:underline">
              farminkforum@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
