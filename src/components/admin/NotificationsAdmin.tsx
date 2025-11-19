import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Send } from 'lucide-react';

export function NotificationsAdmin() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1">Send Notifications</h2>
        <p className="text-sm text-gray-500">Compose and send messages to users</p>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Compose Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Recipient Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select recipients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active Subscribers</SelectItem>
                <SelectItem value="trial">Trial Users</SelectItem>
                <SelectItem value="inactive">Inactive Users</SelectItem>
                <SelectItem value="custom">Custom List</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notification Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="push">Push Notification</SelectItem>
                <SelectItem value="both">Email + Push</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Subject</Label>
            <Input placeholder="Enter subject line" />
          </div>

          <div>
            <Label>Message</Label>
            <Textarea 
              placeholder="Write your message..."
              className="min-h-[150px]"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              Save as Draft
            </Button>
            <Button className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white gap-2">
              <Send className="w-4 h-4" />
              Send Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { subject: 'New Books Added', recipients: 'All Users', sent: '2024-03-20', delivered: '12,453' },
              { subject: 'Platform Maintenance', recipients: 'Active Subscribers', sent: '2024-03-18', delivered: '8,234' },
              { subject: 'Special Discount Offer', recipients: 'Trial Users', sent: '2024-03-15', delivered: '1,245' },
            ].map((notification, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-[#1d4d6a] mb-2">{notification.subject}</h4>
                <p className="text-sm text-gray-500">
                  Sent to {notification.recipients} • {new Date(notification.sent).toLocaleDateString()} • {notification.delivered} delivered
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
