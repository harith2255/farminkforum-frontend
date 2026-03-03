import React from "react";
import { LegalLayout } from "./LegalLayout";

export const DRMPolicy: React.FC = () => {
  return (
    <LegalLayout title="DRM & Content Protection Policy" lastUpdated="March 03, 2026">
      <section>
        <h2 className="text-xl font-bold text-[#1d4d6a] mb-4">1. Content Ownership</h2>
        <p>
          All educational resources provided on <strong>FarmInk Forum</strong> are protected by the <strong>Indian Copyright Act, 1957</strong>. The content is for your personal, non-commercial use only.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[#1d4d6a] mb-4">2. Individual Use License</h2>
        <p>
          Purchase of any material grants you a non-exclusive, non-transferable license for self-study. Redistribution, resale, or group-sharing is an infringement of our intellectual property rights.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[#1d4d6a] mb-4">3. Content Protection Measures</h2>
        <p>To prevent piracy, we employ several technical measures:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li><strong>Watermarking:</strong> Every PDF and study resource may be watermarked with your identifiable information (Name, Email, Phone Number).</li>
          <li><strong>Access Tracking:</strong> We monitor access patterns to identify and prevent account sharing or unauthorized scraping.</li>
          <li><strong>Restricted Downloads:</strong> Some mock tests and interactive resources are designed for platform-only access.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[#1d4d6a] mb-4">4. Anti-Piracy Enforcement</h2>
        <p>
          FarmInk Forum takes piracy very seriously. In the event of confirmed piracy or unauthorized redistribution:
        </p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>The offending user account will be permanently banned without a refund.</li>
          <li>Legal proceedings will be initiated under civil and criminal laws for copyright infringement.</li>
          <li>Infringement reports will be filed with payment gateways and relevant authorities.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[#1d4d6a] mb-4">5. Reporting Infringement</h2>
        <p>
          If you come across any pirated version of our content or any platform redistributing our materials unauthorizedly, please report it to us at <strong>farminkforum@gmail.com</strong>.
        </p>
      </section>
    </LegalLayout>
  );
};
