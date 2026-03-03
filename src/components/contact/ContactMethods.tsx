import React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Mail, Phone, MapPin } from "lucide-react";

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    description: "We aim to respond within 24–48 hours",
    contact: "farminkforum@gmail.com",
    action: "Send Email",
  },
  {
    icon: Phone,
    title: "Call / WhatsApp",
    description: "Available for urgent queries",
    contact: "+91 9901371208",
    action: "Call Now",
  },
];

const ContactMethods = () => (
  <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
    {contactMethods.map((method, index) => (
      <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-all">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <method.icon className="w-8 h-8 text-[#bf2026]" />
          </div>
          <h3 className="text-[#1d4d6a] mb-2">{method.title}</h3>
          <p className="text-sm text-gray-600 mb-3">{method.description}</p>
          <p className="text-sm text-gray-900 mb-4">{method.contact}</p>
          <Button variant="outline" className="w-full">
            {method.action}
          </Button>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default ContactMethods;
