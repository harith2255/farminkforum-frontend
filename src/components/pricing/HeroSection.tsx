import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-[#1d4d6a] to-[#2a5f7f] text-white py-20 overflow-hidden">

      {/* Visible Dotted Pattern */}
      <div className="
        absolute inset-0 pointer-events-none opacity-20
        bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.4)_1px,_transparent_1px)]
        bg-[size:22px_22px]
      ">
      </div>

      <div className="relative mt-15 max-w-4xl mx-auto px-6 text-center">
        <h1 className="text-5xl mb-6">Honest & Affordable Resources</h1>
        <p className="text-xl text-gray-200 mb-8">
          One-time purchases for lifelong success. No hidden subscriptions.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
