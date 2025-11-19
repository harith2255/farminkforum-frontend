import React from "react";
import{ImageWithFallback} from "../figma/ImageWithFallback";

const MissionSection = () => (
  <section className="py-20 bg-[#f5f6f8]">
    <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
      <div>
        <h2 className="text-4xl text-[#1d4d6a] mb-6">Our Mission</h2>
        <p className="text-gray-700 mb-6">
Every year, only a small percentage of aspirants qualify for agricultural entrance exams, scholarships, or government jobs.
At FarmInk Forum, we aim to help you become one among them.
By providing focused study materials, smart mock tests, and expert guidance, we help every learner move closer to success.  </p>
        <p className="text-gray-700">
          We believe everyone deserves access to world-class educational materials, regardless of their location or economic background.
        </p>
      </div>
      <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
        <ImageWithFallback
          src="/Books1.webp"
          alt="Library"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  </section>
);

export default MissionSection;
