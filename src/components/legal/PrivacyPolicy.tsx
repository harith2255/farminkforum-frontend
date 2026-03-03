import React from "react";
import { LegalLayout } from "./LegalLayout";

export const PrivacyPolicy: React.FC = () => {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="March 03, 2026">
      <section>
        <p className="leading-relaxed">
          At <strong>FarmInk Forum</strong>, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information in compliance with India&apos;s <strong>Digital Personal Data Protection Act (DPDP Act 2023)</strong>.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[#1d4d6a] mb-4">1. Information We Collect</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Personal Details:</strong> Name, email address, and phone number provided during registration.</li>
          <li><strong>Payment Information:</strong> We do not store credit card or bank details. All payments are processed securely by <strong>Razorpay</strong>, our third-party payment processor.</li>
          <li><strong>Technical Data:</strong> IP address, browser type, and usage data collected to improve platform performance.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[#1d4d6a] mb-4">2. Purpose of Data Collection</h2>
        <p>We use your data for the following essential purposes:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>To provide access to purchased study materials and mock tests.</li>
          <li>To manage your account and provide customer support.</li>
          <li>To send course updates, verify identity, and prevent unauthorized access.</li>
          <li>To comply with legal obligations and prevent fraud.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[#1d4d6a] mb-4">3. Data Sharing and Third Parties</h2>
        <p>
          We do not sell or rent your data to third parties. Your data is shared only with essential service providers like:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li><strong>Razorpay:</strong> For secure payment processing.</li>
          <li><strong>Cloud Infrastructure:</strong> To host the platform and your progress.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[#1d4d6a] mb-4">4. Data Retention and Security</h2>
        <p>
          We retain your information as long as your account is active. We implement industry-standard security measures, including encryption and secure servers, to protect your data from unauthorized access or disclosure.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[#1d4d6a] mb-4">5. Your Legal Rights</h2>
        <p>Under the DPDP Act 2023, you have the right to:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>Access and update your personal information.</li>
          <li>Request correction of inaccurate data.</li>
          <li>Request deletion of your account and data (subject to legal retention requirements).</li>
          <li>Withdraw consent for data processing.</li>
        </ul>
      </section>

      <section>
        <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-[#bf2026]">
          <h2 className="text-lg font-bold text-[#1d4d6a] mb-1">Contact for Data Requests</h2>
          <p className="text-sm">
            For any data-related queries, contact our Data Privacy Officer at <strong>farminkforum@gmail.com</strong>.
          </p>
        </div>
      </section>
    </LegalLayout>
  );
};
