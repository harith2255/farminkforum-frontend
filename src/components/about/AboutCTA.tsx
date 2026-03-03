import React from "react";
import { Button } from "../ui/button";

const AboutCTA = () => (
  <section className="bg-gradient-to-r from-[#1d4d6a] to-[#2a5f7f] text-white py-20 text-center">
    <div className="max-w-4xl mx-auto px-6">
      <h2 className="text-4xl mb-6">Start Your Preparation Today</h2>
      <p className="text-xl mb-8 text-gray-200">
        Join the growing community of agriculture aspirants who are dedicated to excellence.
      </p>
      <Button className="bg-[#bf2026] hover:bg-[#a01c22] text-white px-10 py-6 text-lg" onClick={() => (window.location.href = "/register")}>
        Browse Materials
      </Button>
    </div>
  </section>
);

export default AboutCTA;
