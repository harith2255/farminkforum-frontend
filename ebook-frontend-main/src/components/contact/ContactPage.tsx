import React from "react";
import ContactHero from "./ContactHero";
import ContactMethods from "./ContactMethods";
import ContactFormSection from "./ContactFormSection";
import FAQSection from "./FAQSection";

const ContactPage = () => (
  <div>
    <ContactHero />
    <div className="max-w-7xl mx-auto px-6 py-16">
      <ContactMethods />
      <ContactFormSection />
      <FAQSection />
    </div>
  </div>
);

export default ContactPage;
