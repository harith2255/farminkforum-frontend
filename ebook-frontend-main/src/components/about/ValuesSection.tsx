import React from "react";
import { Card, CardContent } from "../ui/card";
import { Target, Heart, Shield, Zap } from "lucide-react";

const values = [
  { icon: Target, title: "Excellence", desc: "We strive for the highest quality in every resource." },
  { icon: Heart, title: "Accessibility", desc: "Making quality education accessible to everyone." },
  { icon: Shield, title: "Integrity", desc: "We uphold the highest academic standards." },
  { icon: Zap, title: "Innovation", desc: "Continuously evolving our platform with new technology." },
];

const ValuesSection = () => (
  <section className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-6 text-center">
      <h2 className="text-4xl text-[#1d4d6a] mb-4">Our Core Values</h2>
      <p className="text-gray-600 max-w-2xl mx-auto mb-16">
        These principles guide everything we do at AcademicHub
      </p>
      <div className="grid md:grid-cols-4 gap-8">
        {values.map((val, i) => (
          <Card key={i} className="border-none shadow-md hover:shadow-xl transition-all">
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 bg-[#bf2026]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <val.icon className="w-8 h-8 text-[#bf2026]" />
              </div>
              <h3 className="text-[#1d4d6a] mb-3">{val.title}</h3>
              <p className="text-sm text-gray-600">{val.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default ValuesSection;
