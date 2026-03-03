import React from "react";
import {Card, CardContent} from "../ui/card";

const faqs = [
  {
    question: "How do I access the notes after purchase?",
    answer:
      "Once purchased, your study materials will be available in your personal library for lifetime access.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major UPI apps, credit/debit cards, and Net Banking through our secure payment gateway.",
  },
  {
    question: "Are the mock tests based on real exams?",
    answer:
      "Yes, our mock tests are curated by experts to match the pattern and difficulty of agriculture competitive exams.",
  },
  {
    question: "How do I request academic services?",
    answer:
      "You can contact us directly via email or WhatsApp for custom academic requirements and professional assistance.",
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