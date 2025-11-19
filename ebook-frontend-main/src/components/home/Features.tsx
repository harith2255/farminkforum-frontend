import { BookOpen, Award, FileText, Search, Users, Clock } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: BookOpen,
      title: "Digital Library",
      desc: "Access thousands of academic e-books with DRM protection, highlighting tools, and dual reading themes."
    },
    {
      icon: Award,
      title: "Mock Tests",
      desc: "Prepare with comprehensive mock tests, detailed analytics, and leaderboards to track your progress."
    },
    {
      icon: FileText,
      title: "Writing Services",
      desc: "Professional academic writing assistance for research papers, essays, and dissertations."
    },
    {
      icon: Search,
      title: "Notes Repository",
      desc: "Curated academic notes organized by category with preview and search functionality."
    },
    {
      icon: Users,
      title: "Job Portal",
      desc: "Find academic positions, research opportunities, and internships tailored to your field."
    },
    {
      icon: Clock,
      title: "24/7 Support",
      desc: "Round-the-clock academic support with expert guidance and personalized assistance."
    },
  ];

  return (
    <section className="py-24 bg-[#f5f6f8] mb-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#1d4d6a] mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
Only a few make it — we’re here to help you become one of them.
FarmInk Forum gives you the right tools to prepare, perform, and qualify.          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-xl p-8 shadow-md hover:shadow-xl transition-all hover:scale-105"
            >
              <div className="w-14 h-14  bg-opacity-10 rounded-lg flex items-center justify-center mb-6">
                <Icon className="w-7 h-7 text-[#bf2026]" />
              </div>
              <h3 className="text-[#1d4d6a] font-semibold mb-3">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
