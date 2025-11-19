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
      <h1 className="text-6xl mb-6">Empowering Agricultural Learning Across India</h1>
      <p className="text-xl text-gray-200">
Since 2020, FarmInk Forum has been helping students and researchers access trusted academic materials, mock tests, and learning tools for success in agriculture education.
Our goal is to bridge the gap between classroom learning and competitive exam success through focused, practical resources.</p>    </div>
  </section>
);

export default AboutHero;
