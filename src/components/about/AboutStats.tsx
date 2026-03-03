import React, { useEffect, useState } from "react";

const stats = [
  { suffix: "", label: "Agriculture exam preparation", isGeneric: true },
  { suffix: "", label: "Mission to help aspirants qualify", isGeneric: true },
  { suffix: "", label: "First in South India", isGeneric: true },
  { suffix: "", label: "Growing Academy Platform", isGeneric: true },
];


const AboutStats = () => (
  <section className="py-16 bg-white border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      {stats.map((s, i) => (
        <AnimatedStat
          key={i}
          value={0}
          suffix={s.suffix}
          label={s.label}
          isGeneric={s.isGeneric}
        />
      ))}
    </div>
  </section>
);

const AnimatedStat = ({
  value,
  suffix,
  label,
  isGeneric = false,
}: {
  value: number;
  suffix: string;
  label: string;
  isGeneric?: boolean;
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isGeneric) return;
    let start = 0;
    const duration = 1500; // 1.5s animation
    const startTime = performance.now();

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const currentValue = Math.floor(start + eased * value);
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, isGeneric]);

  if (isGeneric) {
    return (
      <div>
        <p className="text-gray-600 font-medium">{label}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-5xl text-[#bf2026] mb-2 font-semibold">
        {count.toLocaleString()}
        {suffix}
      </div>
      <p className="text-gray-600">{label}</p>
    </div>
  );
};

export default AboutStats;