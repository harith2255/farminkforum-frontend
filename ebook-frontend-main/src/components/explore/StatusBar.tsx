import { BookOpen, Star, Users, Award } from "lucide-react";

const StatsBar = ({ totalBooks }: { totalBooks: number }) => {
  const stats = [
    { icon: BookOpen, value: totalBooks, label: "Books Available" },
    { icon: Star, value: "4.8", label: "Average Rating" },
    { icon: Users, value: "50K+", label: "Active Readers" },
    { icon: Award, value: "500+", label: "Expert Authors" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
      {stats.map(({ icon: Icon, value, label }) => (
        <div
          key={label}
          className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex items-center gap-3"
        >
          <Icon className="w-8 h-8 text-[#bf2026]" />
          <div>
            <p className="text-2xl text-[#1d4d6a]">{value}</p>
            <p className="text-sm text-gray-600">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
