import React from 'react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Check, Sparkles } from 'lucide-react';

interface Plan {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  popular?: boolean;
  features: { text: string; included: boolean }[];
}

interface PlanCardProps {
  plan: Plan;
  billingCycle: 'monthly' | 'annual';
  onNavigate: (page: string) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, billingCycle, onNavigate }) => (
  <Card
    className={`border-none shadow-lg hover:shadow-2xl transition-all relative ${
      plan.popular ? 'ring-2 ring-[#bf2026] scale-105' : ''
    }`}
  >
    {plan.popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <Badge className="bg-[#bf2026] text-white px-4 py-1">
          <Sparkles className="w-3 h-3 mr-1" />
          Most Popular
        </Badge>
      </div>
    )}

    <CardHeader className="text-center pb-8 pt-8">
      <CardTitle className="text-[#1d4d6a] mb-2">{plan.name}</CardTitle>
      <CardDescription className="text-sm">{plan.description}</CardDescription>

      <div className="mt-6">
        <span className="text-5xl text-[#1d4d6a]">
          ₹{billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice}
        </span>
        <span className="text-gray-500 ml-2">
          /{billingCycle === 'monthly' ? 'month' : 'year'}
        </span>
      </div>

      {billingCycle === 'annual' && (
        <p className="text-sm text-gray-500 mt-2">
          ${(plan.annualPrice / 12).toFixed(2)} per month, billed annually
        </p>
      )}
    </CardHeader>

    <CardContent className="space-y-6">
      <ul className="space-y-3">
        {plan.features.map((feature, fIndex) => (
          <li key={fIndex} className="flex items-start gap-3 text-sm">
            {feature.included ? (
              <Check className="w-5 h-5 text-[#bf2026] shrink-0 mt-0.5" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0 mt-0.5" />
            )}
            <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onNavigate('register')}
        className={`w-full ${
          plan.popular
            ? 'bg-[#bf2026] hover:bg-[#a01c22] text-white'
            : 'bg-[#1d4d6a] hover:bg-[#153a4f] text-white'
        }`}
      >
        Get Started
      </Button>
    </CardContent>
  </Card>
);

export default PlanCard;
