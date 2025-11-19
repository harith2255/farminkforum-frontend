import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Check, CreditCard, Download, Calendar } from 'lucide-react';

export function PaymentsSubscriptions() {
  const plans = [
    {
      name: 'Monthly',
      price: '₹19.99',
      period: 'per month',
      features: [
        'Access to 1,000+ e-books',
        '10 mock tests per month',
        'Basic notes repository',
        'Email support',
        'Standard reading features'
      ],
      active: false
    },
    {
      name: 'Annual',
      price: '₹199.99',
      period: 'per year',
      savings: 'Save $40',
      features: [
        'Access to 5,000+ e-books',
        'Unlimited mock tests',
        'Premium notes repository',
        'Priority support 24/7',
        'Advanced reading tools',
        'Writing service discount',
        'Job portal premium access'
      ],
      active: true,
      popular: true
    },
    {
      name: 'Institutional',
      price: '₹499.99',
      period: 'per year',
      features: [
        'Everything in Annual',
        'Up to 50 user accounts',
        'Admin dashboard access',
        'Custom content upload',
        'Advanced analytics',
        'Dedicated account manager',
        'API access'
      ],
      active: false
    }
  ];

  const transactions = [
    { id: 1, date: '2024-03-01', description: 'Annual Subscription Renewal', amount: '₹199.99', status: 'Completed', method: 'Visa •••• 4242' },
    { id: 2, date: '2024-02-15', description: 'Research Paper - AI Ethics', amount: '₹104.00', status: 'Completed', method: 'Mastercard •••• 8888' },
    { id: 3, date: '2024-02-01', description: 'Organic Chemistry Notes', amount: '₹3.99', status: 'Completed', method: 'Visa •••• 4242' },
    { id: 4, date: '2024-01-20', description: 'Machine Learning E-book', amount: '₹24.99', status: 'Completed', method: 'Visa •••• 4242' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1">Payments & Subscriptions</h2>
        <p className="text-sm text-gray-500">Manage your subscription and view transaction history</p>
      </div>

      <Tabs defaultValue="subscription" className="w-full">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
        </TabsList>

        {/* Subscription Plans */}
        <TabsContent value="subscription" className="mt-6 space-y-6">
          {/* Current Plan Card */}
          <Card className="border-2 border-[#bf2026] shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-[#bf2026] text-white mb-2">Active Plan</Badge>
                  <h3 className="text-[#1d4d6a] mb-1">Annual Subscription</h3>
                  <p className="text-sm text-gray-500 mb-4">Renews on April 1, 2025</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl text-[#1d4d6a]">₹199.99</span>
                    <span className="text-gray-500">per year</span>
                  </div>
                </div>
                <div className="text-right">
                  <Button variant="outline" size="sm" className="mb-2">
                    Manage Plan
                  </Button>
                  <p className="text-xs text-gray-500">Cancel anytime</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Plans */}
          <div>
            <h3 className="text-[#1d4d6a] mb-4">Available Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <Card key={index} className={`border-none shadow-md ${plan.popular ? 'ring-2 ring-[#bf2026]' : ''} ${plan.active ? 'opacity-50' : 'hover:shadow-xl transition-all'}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-[#1d4d6a]">{plan.name}</CardTitle>
                      {plan.popular && <Badge className="bg-yellow-500 text-white">Popular</Badge>}
                      {plan.active && <Badge className="bg-green-500 text-white">Active</Badge>}
                    </div>
                    <div className="mb-4">
                      <span className="text-3xl text-[#1d4d6a]">{plan.price}</span>
                      <span className="text-gray-500 text-sm ml-2">{plan.period}</span>
                      {plan.savings && (
                        <Badge className="bg-green-100 text-green-700 ml-2">{plan.savings}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-[#bf2026] shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${plan.active ? 'bg-gray-400' : 'bg-[#bf2026] hover:bg-[#a01c22]'} text-white`}
                      disabled={plan.active}
                    >
                      {plan.active ? 'Current Plan' : 'Upgrade Now'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Transaction History */}
        <TabsContent value="transactions" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[#1d4d6a]">Transaction History</CardTitle>
                  <CardDescription>View all your past transactions</CardDescription>
                </div>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12  bg-opacity-10 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-[#bf2026]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[#1d4d6a] mb-1">{transaction.description}</h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(transaction.date).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{transaction.method}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[#1d4d6a] mb-1">{transaction.amount}</p>
                      <Badge className="bg-green-100 text-green-700">{transaction.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods */}
        <TabsContent value="payment-methods" className="mt-6">
          <div className="space-y-4">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-[#1d4d6a]">Saved Payment Methods</CardTitle>
                <CardDescription>Manage your payment methods securely</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12  bg-opacity-10 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="text-[#1d4d6a] mb-1">Visa ending in 4242</h4>
                      <p className="text-sm text-gray-500">Expires 12/2025</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-green-100 text-green-700">Default</Badge>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12  bg-opacity-10 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <h4 className="text-[#1d4d6a] mb-1">Mastercard ending in 8888</h4>
                      <p className="text-sm text-gray-500">Expires 08/2026</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>

                <Button className="w-full mt-4 border-2 border-dashed border-gray-300 bg-transparent text-gray-700 hover:border-[#bf2026] hover:text-[#bf2026] hover:bg-transparent">
                  + Add New Payment Method
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-[#1d4d6a]">Billing Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name</span>
                    <span className="text-gray-900">Alex Rodriguez</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="text-gray-900">alex.rodriguez@email.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Address</span>
                    <span className="text-gray-900 text-right">123 University Ave<br/>Cambridge, MA 02138</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Update Billing Info
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
