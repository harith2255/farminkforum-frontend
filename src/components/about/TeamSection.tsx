import React from "react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

const author = {
  name: "Your Name",
  role: "Founder & Author",
  image: "", // replace with your photo
  intro:
    "Dedicated to promoting agricultural education and lifelong learning. With a strong passion for rural development and community empowerment, I aim to make knowledge accessible for students, educators, and farmers across India through practical, research-based learning resources.",
};

const TeamSection = () => (
  <section className="py-16 md:py-20 bg-[#f5f6f8]">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <h2 className="text-3xl sm:text-4xl text-[#1d4d6a] mb-10 sm:mb-12 text-center">
        Meet the Author
      </h2>

      {/* FLEX LAYOUT */}
      <div className="flex flex-row max-[480px]:flex-col items-center max-[430px]:items-center sm:items-start justify-center gap-10 sm:gap-14">
        
        {/* LEFT SIDE — IMAGE */}
        <div className="flex-shrink-0 flex flex-col items-center sm:items-start text-center sm:text-left">
          <div className="relative h-56 w-56 sm:h-72 sm:w-72 md:h-80 md:w-80 rounded-2xl overflow-hidden shadow-md mb-4">
            <ImageWithFallback
              src={author.image}
              alt={author.name}
              className="w-full h-full object-cover"
            />
          </div>

          <h3 className="text-[#1d4d6a] text-xl sm:text-2xl font-semibold">
            {author.name}
          </h3>
          <p className="text-sm text-gray-600">{author.role}</p>
        </div>

        {/* RIGHT SIDE — TEXT */}
        <div className="flex flex-col text-gray-700 leading-relaxed text-center sm:text-left max-w-2xl">
          <p className="text-base sm:text-lg">{author.intro}</p>
        </div>
      </div>
    </div>
  </section>
);

export default TeamSection;
