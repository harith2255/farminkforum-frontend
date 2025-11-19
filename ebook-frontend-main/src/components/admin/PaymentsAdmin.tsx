import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DollarSign, TrendingUp, CreditCard, Download, IndianRupee } from 'lucide-react';

export function PaymentsAdmin() {
  const stats = [
    { label: 'Total Revenue', value: '₹145,890', change: '+18.2%', icon: IndianRupee },
    { label: 'This Month', value: '₹45,230', change: '+12.5%', icon: TrendingUp },
    { label: 'Subscriptions', value: '₹98,450', change: '+15.3%', icon: CreditCard },
    { label: 'One-time Sales', value: '₹47,440', change: '+22.1%', icon: IndianRupee },
  ];

  const transactions = [
    { id: 'TXN-1234', user: 'Alex Rodriguez', type: 'Subscription', amount: '₹199.99', status: 'Completed', date: '2024-03-20' },
    { id: 'TXN-1235', user: 'Sarah Johnson', type: 'E-book', amount: '₹24.99', status: 'Completed', date: '2024-03-20' },
    { id: 'TXN-1236', user: 'Michael Chen', type: 'Writing Service', amount: '₹104.00', status: 'Pending', date: '2024-03-20' },
    { id: 'TXN-1237', user: 'Emily Davis', type: 'Subscription', amount: '₹19.99', status: 'Failed', date: '2024-03-19' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1d4d6a] mb-1">Payment Management</h2>
          <p className="text-sm text-gray-500">Monitor revenue and transactions</p>
        </div>
        <Button className="bg-[#bf2026] hover:bg-[#a01c22] text-white gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <h3 className="text-[#1d4d6a] mb-1">{stat.value}</h3>
                  <p className="text-xs text-green-600">{stat.change}</p>
                </div>
                <div className="w-12 h-12  bg-opacity-10 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-[#bf2026]" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1d4d6a]">Recent Transactions</CardTitle>
          <CardDescription>Latest payment activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-[#1d4d6a]">{txn.id}</h4>
                    <Badge className={
                      txn.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      txn.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }>
                      {txn.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {txn.user} • {txn.type} • {new Date(txn.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#1d4d6a]">{txn.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
