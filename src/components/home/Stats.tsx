import { useEffect, useState } from "react";
import { BookOpen, Users, Award, TrendingUp } from "lucide-react";

export function StatsSection() {
  const stats = [
    { icon: BookOpen, value: 0, label: "Exam-Oriented Study Materials", isGeneric: true, suffix: "" },
    { icon: Users, value: 0, label: "Built for Agriculture Aspirants", isGeneric: true, suffix: "" },
    { icon: Award, value: 0, label: "Focused on Exam Success", isGeneric: true, suffix: "" },
    { icon: TrendingUp, value: 0, label: "Growing Academic Platform", isGeneric: true, suffix: "" },
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
function StatItem({ Icon, value, label, suffix = "", isGeneric = false }: any) {
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

  if (isGeneric) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Icon className="w-6 h-6 text-[#bf2026]" />
        </div>
        <p className="text-[#1d4d6a] text-sm font-semibold">{label}</p>
      </div>
    );
  }

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