import React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Mail, MessageSquare, Phone } from "lucide-react";

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    description: "For formal queries and support",
    contact: "farminkforum@gmail.com",
    action: "Send Email",
    href: "mailto:farminkforum@gmail.com",
    color: "bg-blue-50",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp",
    description: "Quick response for students",
    contact: "9901371208",
    action: "Message Us",
    href: "https://wa.me/919901371208",
    color: "bg-green-50",
  },
  {
    icon: Phone,
    title: "Call Us",
    description: "Available for urgent queries",
    contact: "+91 9901371208",
    action: "Call Now",
    href: "tel:+919901371208",
    color: "bg-red-50",
  },
];

const ContactMethods = () => (
  <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
    {contactMethods.map((method, index) => (
      <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-all h-full flex flex-col">
        <CardContent className="p-8 text-center flex-1 flex flex-col">
          <div className={`w-16 h-16 ${method.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <method.icon className="w-8 h-8 text-[#bf2026]" />
          </div>
          <h3 className="text-[#1d4d6a] mb-2 font-semibold text-lg">{method.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{method.description}</p>
          <p className="text-sm font-medium text-gray-900 mb-8">{method.contact}</p>
          
          <div className="mt-auto">
            <Button 
              variant="outline" 
              className="w-full border-[#bf2026] text-[#bf2026] hover:bg-[#bf2026] hover:text-white transition-colors"
              onClick={() => window.open(method.href, '_blank')}
            >
              {method.action}
            </Button>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default ContactMethods;
