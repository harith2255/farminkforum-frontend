import React from "react";

const ContactHero = () => (
  <section className="relative bg-gradient-to-br from-[#1d4d6a] to-[#2a5f7f] text-white py-20 overflow-hidden">

  {/* Dotted Overlay */}
  <div
    className="absolute inset-0 opacity-10 pointer-events-none"
    style={{
      backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
      backgroundSize: "50px 50px",
    }}
  ></div>

  <div className="relative mt-15 max-w-4xl mx-auto px-6 text-center">
    <h1 className="text-5xl mb-6">Get in Touch</h1>
    <p className="text-xl text-gray-200">
      Have questions? We're here to help. Reach out to our team anytime.
    </p>
  </div>
</section>

);

export default ContactHero;
