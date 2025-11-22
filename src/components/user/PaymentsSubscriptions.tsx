import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Check, CreditCard, Download, Calendar, Plus, Edit, Trash2, Shield, Lock } from 'lucide-react';
import { useState } from 'react';

export function PaymentsSubscriptions() {
  const [showManagePlan, setShowManagePlan] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showEditBilling, setShowEditBilling] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([
    {
      id: 1,
      type: 'visa',
      last4: '4242',
      brand: 'Visa',
      expiry: '12/2025',
      isDefault: true,
      cardholder: 'Alex Rodriguez'
    },
    {
      id: 2,
      type: 'mastercard',
      last4: '8888',
      brand: 'Mastercard',
      expiry: '08/2026',
      isDefault: false,
      cardholder: 'Alex Rodriguez'
    }
  ]);
  const [billingInfo, setBillingInfo] = useState({
    name: 'Alex Rodriguez',
    email: 'alex.rodriguez@email.com',
    address: '123 University Ave',
    city: 'Cambridge',
    state: 'MA',
    zipCode: '02138',
    country: 'United States'
  });

  const [newPaymentMethod, setNewPaymentMethod] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    saveCard: true
  });

  // Add New Payment Method
  const handleAddPaymentMethod = () => {
    if (!newPaymentMethod.cardNumber || !newPaymentMethod.expiryDate || !newPaymentMethod.cvv || !newPaymentMethod.cardholderName) {
      alert('Please fill all card details');
      return;
    }

    const last4 = newPaymentMethod.cardNumber.slice(-4);
    const newMethod = {
      id: savedPaymentMethods.length + 1,
      type: 'visa',
      last4: last4,
      brand: 'Visa',
      expiry: newPaymentMethod.expiryDate,
      isDefault: savedPaymentMethods.length === 0,
      cardholder: newPaymentMethod.cardholderName
    };

    setSavedPaymentMethods(prev => [...prev, newMethod]);
    setNewPaymentMethod({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
      saveCard: true
    });
    setShowAddPayment(false);
  };

  // Set Default Payment Method
  const setDefaultPaymentMethod = (id: number) => {
    setSavedPaymentMethods(prev => 
      prev.map(method => ({
        ...method,
        isDefault: method.id === id
      }))
    );
  };

  // Delete Payment Method
  const deletePaymentMethod = (id: number) => {
    if (savedPaymentMethods.find(m => m.id === id)?.isDefault) {
      alert('Cannot delete default payment method. Please set another method as default first.');
      return;
    }
    setSavedPaymentMethods(prev => prev.filter(method => method.id !== id));
  };

  // Update Billing Information
  const handleUpdateBillingInfo = (updatedInfo: any) => {
    setBillingInfo(updatedInfo);
    setShowEditBilling(false);
  };

  // Digital Wallet Handlers
  const handleGooglePay = () => {
    alert('Google Pay integration would be implemented here');
  };

  const handleApplePay = () => {
    alert('Apple Pay integration would be implemented here');
  };

  const handlePayPal = () => {
    alert('PayPal integration would be implemented here');
  };

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

  // If Manage Plan is shown, display the management interface
  if (showManagePlan) {
    return (
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowManagePlan(false)}
            className="flex items-center gap-2"
          >
            ← Back to Subscription
          </Button>
          <div>
            <h2 className="text-[#1d4d6a] mb-1">Manage Subscription Plan</h2>
            <p className="text-sm text-gray-500">Switch plans or cancel your subscription</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Current Plan Summary */}
          <Card className="border-2 border-[#bf2026]">
            <CardContent className="p-6">
              <Badge className="bg-[#bf2026] text-white mb-3">Current Plan</Badge>
              <h3 className="text-xl font-semibold text-[#1d4d6a] mb-2">Annual Subscription</h3>

              <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                <Calendar className="w-4 h-4" />
                Renews on April 1, 2025
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl text-[#1d4d6a]">₹199.99</span>
                <span className="text-gray-500">per year</span>
              </div>
            </CardContent>
          </Card>

          {/* Plan Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Switch Subscription Plan</CardTitle>
              <CardDescription>Choose the plan that works best for you</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan, index) => (
                  <Card 
                    key={index}
                    className={`border-2 ${
                      plan.active
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-[#bf2026] cursor-pointer'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-[#1d4d6a] text-lg">{plan.name}</CardTitle>

                        {plan.active && <Badge className="bg-green-500 text-white">Active</Badge>}
                        {plan.popular && !plan.active && (
                          <Badge className="bg-yellow-500 text-white">Popular</Badge>
                        )}
                      </div>

                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold text-[#1d4d6a]">{plan.price}</span>
                        <span className="text-gray-500 text-sm">{plan.period}</span>
                      </div>

                      {plan.savings && (
                        <Badge className="bg-green-100 text-green-700 w-fit mt-2">
                          {plan.savings}
                        </Badge>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <ul className="space-y-2">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-[#bf2026] mt-0.5" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className={`w-full ${
                          plan.active ? 'bg-gray-400' : 'bg-[#bf2026] hover:bg-[#a01c22]'
                        } text-white`}
                        disabled={plan.active}
                      >
                        {plan.active ? 'Current Plan' : 'Switch to Plan'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cancel Subscription Section */}
          <Card className="border-2 border-red-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Cancel Subscription</h3>
              <p className="text-gray-600 mb-4">
                Your subscription will remain active until April 1, 2025.  
                After cancellation, you'll lose access to premium features on your renewal date.
              </p>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowManagePlan(false)}
                >
                  Keep My Plan
                </Button>

                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    );
  }

  // Add Payment Method Modal
  const AddPaymentModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-[#1d4d6a] mb-4">Add Payment Method</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Card Number</label>
            <input 
              type="text" 
              placeholder="1234 5678 9012 3456"
              className="w-full p-3 border border-gray-300 rounded-xl mt-1"
              value={newPaymentMethod.cardNumber}
              onChange={(e) => setNewPaymentMethod(prev => ({...prev, cardNumber: e.target.value}))}
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600">Expiry Date</label>
              <input 
                type="text" 
                placeholder="MM/YY"
                className="w-full p-3 border border-gray-300 rounded-xl mt-1"
                value={newPaymentMethod.expiryDate}
                onChange={(e) => setNewPaymentMethod(prev => ({...prev, expiryDate: e.target.value}))}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600">CVV</label>
              <input 
                type="text" 
                placeholder="123"
                className="w-full p-3 border border-gray-300 rounded-xl mt-1"
                value={newPaymentMethod.cvv}
                onChange={(e) => setNewPaymentMethod(prev => ({...prev, cvv: e.target.value}))}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Cardholder Name</label>
            <input 
              type="text" 
              placeholder="John Doe"
              className="w-full p-3 border border-gray-300 rounded-xl mt-1"
              value={newPaymentMethod.cardholderName}
              onChange={(e) => setNewPaymentMethod(prev => ({...prev, cardholderName: e.target.value}))}
            />
          </div>
          
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={newPaymentMethod.saveCard}
              onChange={(e) => setNewPaymentMethod(prev => ({...prev, saveCard: e.target.checked}))}
            />
            <span className="text-sm text-gray-600">Save this card for future payments</span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setShowAddPayment(false)}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-[#bf2026] hover:bg-[#a81c21] text-white"
            onClick={handleAddPaymentMethod}
          >
            Add Card
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <Lock className="w-3 h-3" />
          <span>Your payment information is secure and encrypted</span>
        </div>
      </div>
    </div>
  );

  // Edit Billing Info Modal
  const EditBillingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold text-[#1d4d6a] mb-4">Update Billing Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Full Name</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-xl mt-1"
              value={billingInfo.name}
              onChange={(e) => setBillingInfo(prev => ({...prev, name: e.target.value}))}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <input 
              type="email" 
              className="w-full p-3 border border-gray-300 rounded-xl mt-1"
              value={billingInfo.email}
              onChange={(e) => setBillingInfo(prev => ({...prev, email: e.target.value}))}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Address</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-xl mt-1"
              value={billingInfo.address}
              onChange={(e) => setBillingInfo(prev => ({...prev, address: e.target.value}))}
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600">City</label>
              <input 
                type="text" 
                className="w-full p-3 border border-gray-300 rounded-xl mt-1"
                value={billingInfo.city}
                onChange={(e) => setBillingInfo(prev => ({...prev, city: e.target.value}))}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600">State</label>
              <input 
                type="text" 
                className="w-full p-3 border border-gray-300 rounded-xl mt-1"
                value={billingInfo.state}
                onChange={(e) => setBillingInfo(prev => ({...prev, state: e.target.value}))}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">ZIP Code</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-xl mt-1"
              value={billingInfo.zipCode}
              onChange={(e) => setBillingInfo(prev => ({...prev, zipCode: e.target.value}))}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setShowEditBilling(false)}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-[#bf2026] hover:bg-[#a81c21] text-white"
            onClick={() => handleUpdateBillingInfo(billingInfo)}
          >
            Update Info
          </Button>
        </div>
      </div>
    </div>
  );

  // Original subscription management view
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mb-2"
                    onClick={() => setShowManagePlan(true)}
                  >
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
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
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
                {savedPaymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                        <CreditCard className={`w-6 h-6 ${
                          method.type === 'visa' ? 'text-blue-500' : 'text-orange-500'
                        }`} />
                      </div>
                      <div>
                        <h4 className="text-[#1d4d6a] mb-1">{method.brand} ending in {method.last4}</h4>
                        <p className="text-sm text-gray-500">Expires {method.expiry}</p>
                        <p className="text-xs text-gray-400">{method.cardholder}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {method.isDefault && <Badge className="bg-green-100 text-green-700">Default</Badge>}
                      {!method.isDefault && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setDefaultPaymentMethod(method.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deletePaymentMethod(method.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Digital Wallet Options */}
                <div className="mt-6 space-y-3">
                  <h4 className="text-[#1d4d6a] font-medium">Digital Wallets</h4>
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-3 justify-start"
                    onClick={handleGooglePay}
                  >
                    <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">G</div>
                    Google Pay
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-3 justify-start"
                    onClick={handleApplePay}
                  >
                    <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                    </div>
                    Apple Pay
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-3 justify-start"
                    onClick={handlePayPal}
                  >
                    <div className="w-6 h-6 bg-blue-300 rounded flex items-center justify-center text-blue-800 text-xs font-bold">P</div>
                    PayPal
                  </Button>
                </div>

                <Button 
                  className="w-full mt-4 border-2 border-dashed border-gray-300 bg-transparent text-gray-700 hover:border-[#bf2026] hover:text-[#bf2026] hover:bg-transparent"
                  onClick={() => setShowAddPayment(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Payment Method
                </Button>

                <div className="flex items-center gap-2 text-xs text-gray-500 mt-4">
                  <Shield className="w-3 h-3" />
                  <span>All payment methods are securely stored and encrypted</span>
                </div>
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
                    <span className="text-gray-900">{billingInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="text-gray-900">{billingInfo.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Address</span>
                    <span className="text-gray-900 text-right">
                      {billingInfo.address}<br/>
                      {billingInfo.city}, {billingInfo.state} {billingInfo.zipCode}<br/>
                      {billingInfo.country}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setShowEditBilling(true)}
                >
                  Update Billing Info
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showAddPayment && <AddPaymentModal />}
      {showEditBilling && <EditBillingModal />}
    </div>
  );
}