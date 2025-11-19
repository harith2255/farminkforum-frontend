import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { FileText, Upload, Clock, CheckCircle, AlertCircle, Calendar, Edit, MessageSquare, Download } from 'lucide-react';
import { toast } from 'sonner';

export function WritingServices() {
  const [step, setStep] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [updatedDeadline, setUpdatedDeadline] = useState('');

  const activeOrders = [
    { id: 1, title: 'Research Paper on AI Ethics', type: 'Research Paper', deadline: '2024-03-25', status: 'In Progress', progress: 60, writer: 'Dr. Sarah Johnson' },
    { id: 2, title: 'Literature Review - Climate Change', type: 'Literature Review', deadline: '2024-03-30', status: 'Draft Review', progress: 85, writer: 'Prof. Michael Chen' },
  ];

  const completedOrders = [
    { id: 3, title: 'Essay on Shakespeare', type: 'Essay', completedDate: '2024-03-10', grade: 'A', rating: 5 },
    { id: 4, title: 'Lab Report - Chemistry', type: 'Lab Report', completedDate: '2024-02-28', grade: 'A-', rating: 4 },
  ];

  const services = [
    { name: 'Research Paper', description: 'Comprehensive research papers with citations', turnaround: '7-14 days', price: 'From ₹49' },
    { name: 'Essay Writing', description: 'Academic essays on any topic', turnaround: '3-7 days', price: 'From ₹29' },
    { name: 'Dissertation', description: 'Full dissertation writing support', turnaround: '30-90 days', price: 'From ₹299' },
    { name: 'Thesis Writing', description: 'Master\'s and PhD thesis assistance', turnaround: '14-60 days', price: 'From ₹199' },
    { name: 'Literature Review', description: 'Detailed literature reviews', turnaround: '5-10 days', price: 'From ₹79' },
    { name: 'Editing & Proofreading', description: 'Professional editing services', turnaround: '1-3 days', price: 'From ₹19' },
  ];

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order);
    setUpdatedDeadline(order.deadline);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    toast.success('Order updated successfully!');
    setIsEditDialogOpen(false);
  };

  const handleProvideFeedback = (order: any) => {
    setSelectedOrder(order);
    setFeedback('');
    setIsFeedbackDialogOpen(true);
  };

  const handleSubmitFeedback = () => {
    toast.success('Feedback sent to writer');
    setIsFeedbackDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1">Writing Services</h2>
        <p className="text-sm text-gray-500">Professional academic writing assistance from expert writers</p>
      </div>

      <Tabs defaultValue="new-order" className="w-full">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="new-order">New Order</TabsTrigger>
          <TabsTrigger value="active">Active Orders ({activeOrders.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        {/* New Order */}
        <TabsContent value="new-order" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Place a New Order</CardTitle>
              <CardDescription>Tell us about your writing needs and we'll match you with an expert</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= s ? 'bg-[#bf2026] text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {s}
                      </div>
                      {s < 3 && (
                        <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-[#bf2026]' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step 1: Basic Info */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Service Type</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="research">Research Paper</SelectItem>
                            <SelectItem value="essay">Essay</SelectItem>
                            <SelectItem value="dissertation">Dissertation</SelectItem>
                            <SelectItem value="thesis">Thesis</SelectItem>
                            <SelectItem value="review">Literature Review</SelectItem>
                            <SelectItem value="notes">Notes</SelectItem>
                            <SelectItem value="references">References</SelectItem>
                            <SelectItem value="PPTs">PPTs</SelectItem>
                            <SelectItem value="others">Others</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Academic Level</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high-school">High-School </SelectItem>
                            <SelectItem value="undergraduate">Undergraduate </SelectItem>
                            <SelectItem value="masters">Masters </SelectItem>
                            <SelectItem value="post-doc">Post Doc </SelectItem>
                            <SelectItem value="diploma">Diploma </SelectItem>
                            <SelectItem value="pg-diploma">PG Diploma </SelectItem>
                            <SelectItem value="others">Others </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Topic/Title</Label>
                      <Input placeholder="Enter your topic or title" />
                    </div>

                    <div>
                      <Label>Subject Area</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agriculture">Agriculture Extension Education</SelectItem>
                          <SelectItem value="adult">Adult and Continuing Education and Extension</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="sociology">Sociology</SelectItem>
                          <SelectItem value="rural-development">Rural Development</SelectItem>
                          <SelectItem value="mass-communication-journalism">Mass Communication and Journalism</SelectItem>
                          <SelectItem value="agriculture-statistics">Agriculture Statistics </SelectItem>
                          <SelectItem value="agricultural-economics">Agricultural Economics</SelectItem>
                          <SelectItem value="community-science">Community Science </SelectItem>
                          <SelectItem value="agribusiness-management">Agribusiness Management </SelectItem>
                          <SelectItem value="agriculture-marketing">Agriculture Marketing </SelectItem>
                          <SelectItem value="other-agricultural-sciences">Other Agricultural Sciences</SelectItem>
                          <SelectItem value="others">Others</SelectItem>
                          
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Number of Pages</Label>
                        <Input type="number" placeholder="10" />
                      </div>
                      <div>
                        <Label>Deadline</Label>
                        <Input type="date" />
                      </div>
                    </div>

                    <Button className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white" onClick={() => setStep(2)}>
                      Continue to Details
                    </Button>
                  </div>
                )}

                {/* Step 2: Requirements */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Label>Detailed Instructions</Label>
                      <Textarea
                        placeholder="Provide detailed instructions for your assignment..."
                        className="min-h-[150px]"
                      />
                    </div>

                    <div>
                      <Label>Citation Style</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select citation style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apa">APA</SelectItem>
                          <SelectItem value="mla">MLA</SelectItem>
                          <SelectItem value="chicago">Chicago</SelectItem>
                          <SelectItem value="harvard">Harvard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Additional Materials (Optional)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#bf2026] transition-colors cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX up to 10MB</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white" onClick={() => setStep(3)}>
                        Continue to Review
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Submit */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                      <h4 className="text-[#1d4d6a]">Order Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Service Type</p>
                          <p className="text-gray-900">Research Paper</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Academic Level</p>
                          <p className="text-gray-900">Master's</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Pages</p>
                          <p className="text-gray-900">10 pages</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Deadline</p>
                          <p className="text-gray-900">March 30, 2024</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#bf2026] bg-opacity-10 border border-[#bf2026] rounded-lg p-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Subtotal</span>
                        <span className="text-gray-900">₹89.00</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Express Fee</span>
                        <span className="text-gray-900">₹15.00</span>
                      </div>
                      <div className="border-t border-[#bf2026] my-3 pt-3 flex justify-between items-center">
                        <span className="text-[#1d4d6a]">Total</span>
                        <span className="text-[#1d4d6a]">₹104.00</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                        Back
                      </Button>
                      <Button className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white">
                        Submit Order & Pay
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Orders */}
        <TabsContent value="active" className="mt-6">
          <div className="space-y-4">
            {activeOrders.map((order) => (
              <Card key={order.id} className="border-none shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-[#1d4d6a] mb-1">{order.title}</h3>
                      <p className="text-sm text-gray-500">{order.type}</p>
                    </div>
                    <Badge className={order.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}>
                      {order.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span>{order.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#bf2026] h-2 rounded-full transition-all"
                        style={{ width: `${order.progress}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {order.writer}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {new Date(order.deadline).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleProvideFeedback(order)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditOrder(order)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Completed Orders */}
        <TabsContent value="completed" className="mt-6">
          <div className="space-y-4">
            {completedOrders.map((order) => (
              <Card key={order.id} className="border-none shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-[#1d4d6a] mb-1">{order.title}</h3>
                          <p className="text-sm text-gray-500">{order.type} • Completed {new Date(order.completedDate).toLocaleDateString()}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700">Completed</Badge>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="bg-gray-50 rounded-lg px-4 py-2">
                          <p className="text-xs text-gray-500 mb-1">Grade Received</p>
                          <p className="text-[#1d4d6a]">{order.grade}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg px-4 py-2">
                          <p className="text-xs text-gray-500 mb-1">Your Rating</p>
                          <p className="text-yellow-500">{'⭐'.repeat(order.rating)}</p>
                        </div>
                        <Button variant="outline" size="sm">Download</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Services */}
        <TabsContent value="services" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="border-none shadow-md hover:shadow-lg transition-all">
                <CardHeader>
                  <CardTitle className="text-[#1d4d6a]">{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{service.turnaround}</span>
                    </div>
                    <div className="text-[#bf2026]">{service.price}</div>
                  </div>
                  <Button className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white">
                    Order Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1d4d6a]">Edit Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedOrder && (
              <>
                <div className="p-3 bg-gray-50 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-1">Order</p>
                  <p className="text-[#1d4d6a]">{selectedOrder.title}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Update Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={updatedDeadline}
                    onChange={(e) => setUpdatedDeadline(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Additional fees may apply for deadline changes</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additional-notes">Additional Instructions</Label>
                  <Textarea
                    id="additional-notes"
                    placeholder="Add any additional instructions or changes..."
                    rows={4}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              className="bg-[#bf2026] hover:bg-[#a01c22] text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1d4d6a]">Message Writer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedOrder && (
              <>
                <div className="p-3 bg-gray-50 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-1">Writer</p>
                  <p className="text-[#1d4d6a]">{selectedOrder.writer}</p>
                  <p className="text-xs text-gray-500 mt-1">Working on: {selectedOrder.title}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedback">Your Message</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Type your message to the writer..."
                    rows={6}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitFeedback}
              className="bg-[#bf2026] hover:bg-[#a01c22] text-white"
            >
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
