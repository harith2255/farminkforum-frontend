import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Shield, Eye, Download, Copy } from 'lucide-react';

export function DRMControls() {
  const accessLogs = [
    { user: 'Alex Rodriguez', book: 'Advanced Calculus', action: 'Read', device: 'MacBook Pro', time: '5 min ago', ip: '192.168.1.1' },
    { user: 'Sarah Johnson', book: 'Quantum Physics', action: 'Download', device: 'iPhone 14', time: '15 min ago', ip: '192.168.1.5' },
    { user: 'Michael Chen', book: 'Machine Learning', action: 'Read', device: 'iPad Air', time: '1 hour ago', ip: '192.168.1.12' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1">DRM Controls</h2>
        <p className="text-sm text-gray-500">Manage digital rights and access controls</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-[#1d4d6a]">Protection Settings</CardTitle>
            <CardDescription>Configure DRM rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-[#1d4d6a] mb-1">Copy Protection</h4>
                <p className="text-sm text-gray-500">Prevent text copying</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-[#1d4d6a] mb-1">Watermarking</h4>
                <p className="text-sm text-gray-500">Add user watermarks</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-[#1d4d6a] mb-1">Device Limit</h4>
                <p className="text-sm text-gray-500">Max 3 devices per user</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-[#1d4d6a] mb-1">Screenshot Prevention</h4>
                <p className="text-sm text-gray-500">Block screenshots</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-[#1d4d6a]">Quick Actions</CardTitle>
            <CardDescription>Manage watermarks and licenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-[#bf2026] hover:bg-[#a01c22] text-white">
              <Shield className="w-4 h-4 mr-2" />
              Add Watermark to Book
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Eye className="w-4 h-4 mr-2" />
              View Active Licenses
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Download Access Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Copy className="w-4 h-4 mr-2" />
              Revoke User Access
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Recent Access Logs</CardTitle>
          <CardDescription>Monitor content access in real-time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {accessLogs.map((log, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-[#1d4d6a] mb-1">{log.user}</h4>
                  <p className="text-sm text-gray-500">
                    {log.action}: "{log.book}" • {log.device} • IP: {log.ip}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className="bg-blue-100 text-blue-700">{log.action}</Badge>
                  <p className="text-xs text-gray-500 mt-1">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
