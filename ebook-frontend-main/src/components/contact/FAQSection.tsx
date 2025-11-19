import React from "react";
import { Card, CardContent } from "../ui/card";

const faqs = [
  {
    question: "How do I access my purchased e-books?",
    answer:
      'All purchased e-books are instantly available in your library. Simply log in and navigate to "My Library" to start reading.',
  },
  {
    question: "Can I share my account with others?",
    answer:
      "Individual accounts are for single users only. For multiple users, please consider our Institutional plan which supports up to 50 accounts.",
  },
  {
    question: "What DRM protection do you use?",
    answer:
      "We use industry-standard DRM to protect content while ensuring a seamless reading experience across all your devices.",
  },
  {
    question: "Do you offer academic discounts?",
    answer:
      "Yes! We offer special discounts for students and educators. Contact our support team with your academic credentials.",
  },
];

const FAQSection = () => (
  <div>
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
