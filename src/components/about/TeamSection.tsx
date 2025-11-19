import React from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

const author = {
  name: "Your Name",
  role: "Founder & Author",
  image:
    "", // replace with your photo
  intro:
    "Dedicated to promoting agricultural education and lifelong learning. With a strong passion for rural development and community empowerment, I aim to make knowledge accessible for students, educators, and farmers across India through practical, research-based learning resources.",
};

const TeamSection = () => (
  <section className="py-20 bg-[#f5f6f8]">
    <div className="max-w-6xl mx-auto px-6">
      <h2 className="text-4xl text-[#1d4d6a] mb-12 text-center">
        Meet the Author
      </h2>

      {/* Flex Layout: Image Left, Text Right, Vertically Centered */}
      <div className="flex flex-row md:flex-row items-center justify-center gap-10">
        {/* Left: Author Image + Name + Role */}
        <div className="flex-shrink-0 flex flex-col items-center text-center">
          <div className="relative h-80 w-80 rounded-2xl overflow-hidden shadow-md mb-4">
            <ImageWithFallback
              src={author.image}
              alt={author.name}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-[#1d4d6a] text-2xl font-semibold">
            {author.name}
          </h3>
          <p className="text-sm text-gray-600">{author.role}</p>
        </div>

        {/* Right: Intro Text */}
        <div className="flex flex-col text-gray-700 leading-relaxed text-center md:text-left max-w-2xl">
          <p className="text-lg">{author.intro}</p>
        </div>
      </div>
    </div>
  </section>
);

export default TeamSection;
