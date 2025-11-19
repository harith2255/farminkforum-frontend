import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {ImageWithFallback} from "../figma/ImageWithFallback";

const ContactFormSection = () => (
  <div className="grid md:grid-cols-2 gap-12 mb-16">
    {/* Contact Form */}
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
            <Input placeholder="John" />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input placeholder="Doe" />
          </div>
        </div>
        <div>
          <Label>Email Address</Label>
          <Input type="email" placeholder="your@email.com" />
        </div>
        <div>
          <Label>Subject</Label>
          <Input placeholder="How can we help?" />
        </div>
        <div>
          <Label>Message</Label>
          <Textarea placeholder="Tell us more about your inquiry..." className="min-h-[150px]" />
        </div>
        <Button className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white">
          Send Message
        </Button>
      </CardContent>
    </Card>

    {/* Map + Office Hours */}
    <div className="space-y-6">
      <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1661877854265-48a976379af4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwc3R1ZHlpbmclMjBsYXB0b3B8ZW58MXx8fHwxNzYxNzg1MjcxfDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Office"
          className="w-full h-full object-cover"
        />
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Office Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Monday - Friday</span>
            <span className="text-[#1d4d6a]">8:00 AM - 6:00 PM</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Saturday</span>
            <span className="text-[#1d4d6a]">10:00 AM - 4:00 PM</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-600">Sunday</span>
            <span className="text-gray-500">Closed</span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default ContactFormSection;
