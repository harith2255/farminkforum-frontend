import React from "react";
import { LegalLayout } from "./LegalLayout";

export const TermsOfService: React.FC = () => {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="March 03, 2026">
      <section>
        <h2 className="text-xl font-bold text-[#1d4d6a] mb-4">1. Acceptance of Terms</h2>
        <p>
          By accessing or using <strong>FarmInk Forum</strong>, you agree to comply with and be bound by these Terms of Service. If you do not agree, please refrain from using the platform.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[#1d4d6a] mb-4">2. Intellectual Property</h2>
        <p>
          All study materials, PDF notes, mock tests, and website content are the exclusive property of <strong>FarmInk Forum</strong>. These materials are protected by Indian and International copyright laws.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[#1d4d6a] mb-4">3. User Conduct and Account Security</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Prohibited Sharing:</strong> Sharing your login credentials or redistributed materials is strictly prohibited.</li>
          <li><strong>Anti-Piracy:</strong> Any attempt to bypass DRM, download protected content unauthorizedly, or resell materials will lead to immediate account suspension and legal action.</li>
          <li><strong>One Account per User:</strong> Each purchase is for individual use only.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[#1d4d6a] mb-4">4. Refund and Cancellation Policy</h2>
        <p>
          As we provide non-tangible, irrevocable digital goods (PDFs and Mock Tests), <strong>we do not issue refunds</strong> once the order is confirmed and the product is accessible. We encourage users to review samples where available before purchasing.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[#1d4d6a] mb-4">5. Disclaimers</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>No Guarantee:</strong> FarmInk Forum provides preparatory materials but does not guarantee success or selection in any competitive exams.</li>
          <li><strong>Government Affiliation:</strong> FarmInk Forum is a private educational platform. We are <strong>not affiliated</strong> with any government body or exam-conducting authorities.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[#1d4d6a] mb-4">6. Limitation of Liability</h2>
        <p>
          FarmInk Forum shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our services.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[#1d4d6a] mb-4">7. Governing Law</h2>
        <p>
          These terms are governed by the laws of <strong>India</strong>. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka.
        </p>
      </section>
    </LegalLayout>
  );
};
