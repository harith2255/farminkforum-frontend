import React from "react";
import {Card, CardContent} from "../ui/card";

const faqs = [
  {
    question: "Can I switch plans anytime?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, PayPal, and institutional purchase orders.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes! All plans come with a 14-day free trial. No credit card required to start.",
  },
  {
    question: "What's your refund policy?",
    answer:
      "30-day money-back guarantee. If you're not satisfied, we'll refund you in full.",
  },
];

const FAQSection = () => (
  <div className="mt-20">
    <h2 className="text-3xl text-[#1d4d6a] text-center mb-12">
      Frequently Asked Questions
    </h2>
    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
      {faqs.map((faq, index) => (
        <Card key={index} className="border-none shadow-md">
          <CardContent className="p-6">
            <h3 className="text-[#1d4d6a] mb-3">{faq.question}</h3>
            <p className="text-sm text-gray-600">{faq.answer}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default FAQSection;