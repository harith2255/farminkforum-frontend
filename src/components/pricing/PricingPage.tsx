import React, { useState } from 'react';
import HeroSection from './HeroSection';
import PlanCard from './PlanCard';
import FAQSection from './FAQSection';
import { Card } from '../ui/card';

function PricingPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  const plans = [
    {
      name: 'Basic',
      description: 'Perfect for individual learners',
      monthlyPrice: 19.99,
      annualPrice: 199.99,
      features: [
        { text: 'Access to 1,000+ e-books', included: true },
        { text: '10 mock tests per month', included: true },
        { text: 'Basic notes repository', included: true },
        { text: 'Email support', included: true },
        { text: 'Mobile app access', included: true },
        { text: 'Offline reading', included: false },
        { text: 'Priority support', included: false },
        { text: 'Advanced analytics', included: false },
      ],
    },
    {
      name: 'Professional',
      description: 'For serious students and researchers',
      monthlyPrice: 39.99,
      annualPrice: 399.99,
      popular: true,
      features: [
        { text: 'Access to 5,000+ e-books', included: true },
        { text: 'Unlimited mock tests', included: true },
        { text: 'Premium notes repository', included: true },
        { text: 'Priority support 24/7', included: true },
        { text: 'Mobile app access', included: true },
        { text: 'Offline reading', included: true },
        { text: 'Advanced reading tools', included: true },
        { text: 'Writing service discount (10%)', included: true },
      ],
    },
    {
      name: 'Institutional',
      description: 'For universities and organizations',
      monthlyPrice: 99.99,
      annualPrice: 999.99,
      features: [
        { text: 'Access to entire library (10,000+ books)', included: true },
        { text: 'Everything in Professional', included: true },
        { text: 'Up to 50 user accounts', included: true },
        { text: 'Admin dashboard access', included: true },
        { text: 'Custom content upload', included: true },
        { text: 'Advanced analytics & reports', included: true },
        { text: 'Dedicated account manager', included: true },
        { text: 'Custom branding options', included: true },
      ],
    },
  ];

  return (
    <div>
      <HeroSection billingCycle={billingCycle} setBillingCycle={setBillingCycle} />

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <PlanCard
              key={index}
              plan={plan}
              billingCycle={billingCycle}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        <FAQSection />
      </div>
    </div>
  );
}

export default PricingPage;
