import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

const ContactFormSection = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    const subject = encodeURIComponent(form.subject || "Contact from FarmInk Forum");
    const body = encodeURIComponent(
      `Name: ${form.firstName} ${form.lastName}\nEmail: ${form.email}\n\n${form.message}`
    );
    window.location.href = `mailto:farminkforum@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="max-w-2xl mx-auto mb-16">
      <Card className="border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Send us a Message</CardTitle>
          <CardDescription>
            Fill out the form and we'll get back to you within 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input name="firstName" placeholder="John" value={form.firstName} onChange={handleChange} />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input name="lastName" placeholder="Doe" value={form.lastName} onChange={handleChange} />
            </div>
          </div>
          <div>
            <Label>Email Address</Label>
            <Input name="email" type="email" placeholder="your@email.com" value={form.email} onChange={handleChange} />
          </div>
          <div>
            <Label>Subject</Label>
            <Input name="subject" placeholder="How can we help?" value={form.subject} onChange={handleChange} />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea name="message" placeholder="Tell us more about your inquiry..." className="min-h-[150px]" value={form.message} onChange={handleChange} />
          </div>
          <Button
            className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white"
            onClick={handleSubmit}
          >
            Send Message
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactFormSection;
