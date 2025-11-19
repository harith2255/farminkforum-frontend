import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Cpu, Zap, Tag, FileSearch } from 'lucide-react';

export function AIAutomation() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1">AI Automation</h2>
        <p className="text-sm text-gray-500">Configure intelligent automation features</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-[#1d4d6a]">Content Processing</CardTitle>
            <CardDescription>Automated content analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-[#1d4d6a] mb-1">Auto-Tagging</h4>
                  <p className="text-sm text-gray-500">Automatically tag content categories</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileSearch className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-[#1d4d6a] mb-1">Summary Generation</h4>
                  <p className="text-sm text-gray-500">AI-generated book summaries</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="text-[#1d4d6a] mb-1">Plagiarism Detection</h4>
                  <p className="text-sm text-gray-500">Check for duplicate content</p>
                </div>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-[#1d4d6a]">User Personalization</CardTitle>
            <CardDescription>AI-powered recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="text-[#1d4d6a] mb-1">Smart Recommendations</h4>
                  <p className="text-sm text-gray-500">Personalized content suggestions</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h4 className="text-[#1d4d6a] mb-1">Adaptive Learning</h4>
                  <p className="text-sm text-gray-500">Adjust difficulty based on performance</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FileSearch className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-[#1d4d6a] mb-1">Smart Search</h4>
                  <p className="text-sm text-gray-500">AI-enhanced search results</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">AI Activity Log</CardTitle>
          <CardDescription>Recent automated actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: 'Auto-tagged 12 new books', status: 'Completed', time: '2 min ago', type: 'success' },
              { action: 'Generated summaries for 5 books', status: 'Completed', time: '15 min ago', type: 'success' },
              { action: 'Recommended 145 books to users', status: 'Completed', time: '1 hour ago', type: 'success' },
              { action: 'Plagiarism check on uploaded content', status: 'In Progress', time: '2 hours ago', type: 'pending' },
            ].map((log, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-[#1d4d6a] mb-1">{log.action}</p>
                  <p className="text-sm text-gray-500">{log.time}</p>
                </div>
                <Badge className={log.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                  {log.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
