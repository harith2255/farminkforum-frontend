import React from 'react';
import HeroSection from './HeroSection';
import PlanCard from './PlanCard';
import FAQSection from './FAQSection';
import { Card } from '../ui/card';

function PricingPage({ onNavigate, isLoggedIn }: { onNavigate: (page: string) => void, isLoggedIn?: boolean }) {
  const categories = [
    {
      name: 'Study Materials',
      description: 'Individual PDF notes and resources',
      price: 'Starting from ₹49',
      features: [
        { text: 'Comprehensive PDF Notes', included: true },
        { text: 'Topic-wise Summaries', included: true },
        { text: 'One-time Purchase', included: true },
        { text: 'Lifetime Access', included: true },
        { text: 'Mobile-friendly Reading', included: true },
      ],
    },
    {
      name: 'Mock Test Packages',
      description: 'Exam-wise practice materials',
      price: 'Starting from ₹199',
      popular: true,
      features: [
        { text: 'Exam-specific Mock Tests', included: true },
        { text: 'Detailed Analytics', included: true },
        { text: 'Real Exam Experience', included: true },
        { text: 'Performance Tracking', included: true },
        { text: 'Free Daily Quizzes included', included: true },
      ],
    },
    {
      name: 'Academic Services',
      description: 'Professional assistance for aspirants',
      price: 'Price on Request',
      features: [
        { text: 'Research Paper Assistance', included: true },
        { text: 'Literature Review Support', included: true },
        { text: 'Dissertation Guidance', included: true },
        { text: 'Professional Proofreading', included: true },
        { text: 'Custom Academic Solutions', included: true },
      ],
    },
  ];

  return (
    <div>
      <HeroSection />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <PlanCard
              key={index}
              plan={category as any}
              onNavigate={onNavigate}
              isLoggedIn={isLoggedIn}
            />
          ))}
        </div>

        <FAQSection />
      </div>
    </div>
  );
}

export default PricingPage;