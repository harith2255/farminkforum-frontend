import React from "react";

const AboutHero = () => (
  <section className="relative bg-gradient-to-br from-[#1d4d6a] to-[#2a5f7f] text-white py-32 overflow-hidden">
    <div className="absolute inset-0 opacity-10">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />
    </div>
    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
      <h1 className="text-6xl mb-6">Expert-Led Agricultural Learning</h1>
      <p className="text-xl text-gray-200">
        FarmInk Forum is dedicated to helping agricultural aspirants and researchers access curated study materials, high-quality mock tests, and professional guidance.
        Our mission is to simplify exam preparation and empower successful careers in India's agricultural sector.
      </p>
    </div>
  </section>
);

export default AboutHero;
