import { useEffect, useState } from "react";
import { BookOpen, Users, Award, TrendingUp } from "lucide-react";

export function StatsSection() {
  const stats = [
    { icon: Users, value: 10000, label: "Registered learners" },
    { icon: BookOpen, value: 350, label: "Agricultural E-Books and Resources", suffix: "+" },
    { icon: TrendingUp, value: 95, label: "Positive Reviews", suffix: "%" },
    { icon: Award, value: 9, label: "State Covered in India", suffix: "+" },
  ];

  return (
    <section className="py-10 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ icon: Icon, value, label, suffix }) => (
            <StatItem key={label} Icon={Icon} value={value} label={label} suffix={suffix} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ✅ Reusable animated stat component
function StatItem({ Icon, value, label, suffix = "" }: any) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500; // animation duration (1.5s)
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress); // smooth easing
      const currentValue = Math.floor(start + eased * value);
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  // Smooth easing function
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Icon className="w-6 h-6 text-[#bf2026]" />
        <p className="text-[#1d4d6a] text-lg font-semibold">
          {count.toLocaleString()}
          {suffix}
          {value >= 1000 && suffix === "" ? "+" : ""}
        </p>
      </div>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}