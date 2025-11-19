import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { MessageSquare, CheckCircle, Clock, Download, FileText, User, Calendar, BookOpen, FileCheck, DollarSign } from "lucide-react";

interface Order {
  id: number;
  title: string;
  type: string;
  deadline: string;
  status: "Pending" | "Completed";
  progress: number;
  student_name: string;
  student_email: string;
  academic_level: string;
  subject_area: string;
  number_of_pages: number;
  detailed_instructions: string;
  additional_materials: string[];
  paid_amount: number;
  currency: string;
  order_date: string;
  writer_notes?: string;
}

export default function AdminWritingDashboard() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 1,
      title: "Agricultural Innovations in Modern Farming",
      type: "Research Paper",
      deadline: "2025-11-20",
      status: "Completed",
      progress: 100,
      student_name: "John Smith",
      student_email: "john.smith@email.com",
      academic_level: "Master's Degree",
      subject_area: "Agricultural Science",
      number_of_pages: 25,
      detailed_instructions: "Please focus on sustainable farming practices and technological innovations in modern agriculture. Include case studies from developed countries. The paper should follow APA 7th edition formatting with at least 15 peer-reviewed references.",
      additional_materials: ["research_guidelines.pdf", "reference_material.docx", "data_sets.xlsx"],
      paid_amount: 4500,
      currency: "₹",
      order_date: "2025-10-15",
      writer_notes: "Completed ahead of schedule. Student was very satisfied with the quality."
    },
    {
      id: 2,
      title: "Adult Education Trends in Rural Areas",
      type: "Essay",
      deadline: "2025-11-25",
      status: "Completed",
      progress: 100,
      student_name: "Sarah Johnson",
      student_email: "sarah.j@email.com",
      academic_level: "Bachelor's Degree",
      subject_area: "Education",
      number_of_pages: 8,
      detailed_instructions: "Analyze current trends in adult education with focus on rural communities. Discuss challenges and potential solutions. Use MLA formatting style.",
      additional_materials: ["essay_requirements.pdf"],
      paid_amount: 1800,
      currency: "₹",
      order_date: "2025-10-20"
    },
    {
      id: 3,
      title: "Agricultural Policies Analysis and Impact",
      type: "Dissertation",
      deadline: "2025-12-05",
      status: "Pending",
      progress: 0,
      student_name: "Michael Brown",
      student_email: "m.brown@email.com",
      academic_level: "PhD",
      subject_area: "Agricultural Economics",
      number_of_pages: 80,
      detailed_instructions: "Comprehensive analysis of agricultural policies from 2000-2025. Focus on economic impact, sustainability, and farmer welfare. Requires statistical analysis and econometric modeling. Harvard referencing style.",
      additional_materials: ["dissertation_proposal.pdf", "data_analysis.xlsx", "literature_review.docx"],
      paid_amount: 12000,
      currency: "₹",
      order_date: "2025-10-25"
    },
    {
      id: 4,
      title: "Sustainable Farming Methods for Future",
      type: "Research Paper",
      deadline: "2025-12-10",
      status: "Pending",
      progress: 0,
      student_name: "Emily Davis",
      student_email: "emily.davis@email.com",
      academic_level: "Bachelor's Degree",
      subject_area: "Environmental Science",
      number_of_pages: 15,
      detailed_instructions: "Compare traditional vs modern sustainable farming methods. Include cost-benefit analysis and environmental impact assessment. Chicago style formatting required.",
      additional_materials: ["assignment_brief.pdf"],
      paid_amount: 3200,
      currency: "₹",
      order_date: "2025-10-28"
    },
    {
      id: 5,
      title: "Impact of Climate Change on Crop Yields",
      type: "Thesis",
      deadline: "2025-12-15",
      status: "Pending",
      progress: 0,
      student_name: "Robert Wilson",
      student_email: "r.wilson@email.com",
      academic_level: "Master's Degree",
      subject_area: "Climate Science",
      number_of_pages: 60,
      detailed_instructions: "Quantitative analysis of climate change impact on major crop yields in South Asia. Requires GIS data analysis and predictive modeling. APA 7th edition formatting.",
      additional_materials: ["thesis_guidelines.pdf", "climate_data.csv", "research_papers.zip"],
      paid_amount: 8500,
      currency: "₹",
      order_date: "2025-11-01"
    }
  ]);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  // ✅ Handle Mark as Complete
  const handleMarkComplete = () => {
    if (!selectedOrder) return;

    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === selectedOrder.id
          ? { ...order, status: "Completed", progress: 100 }
          : order
      )
    );

    toast.success(`Order "${selectedOrder.title}" marked as completed`);
    setIsStatusDialogOpen(false);
    setSelectedOrder(null);
  };

  // ✅ Handle Mark as Pending
  const handleMarkPending = () => {
    if (!selectedOrder) return;

    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === selectedOrder.id
          ? { ...order, status: "Pending", progress: 0 }
          : order
      )
    );

    toast.success(`Order "${selectedOrder.title}" marked as pending`);
    setIsStatusDialogOpen(false);
    setSelectedOrder(null);
  };

  // ✅ Handle Send Message
  const handleSendMessage = () => {
    if (!selectedOrder) return;
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const attachmentInfo = attachment ? ` with attachment: ${attachment.name}` : "";
    
    toast.success(`Message sent to ${selectedOrder.student_name}${attachmentInfo}`);
    
    // Reset form
    setMessage("");
    setAttachment(null);
    setIsMessageDialogOpen(false);
    setSelectedOrder(null);
  };

  // ✅ Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload only images, PDF, or DOCX files");
        return;
      }
      
      setAttachment(file);
    }
  };

  // ✅ Handle download additional materials
  const handleDownloadMaterial = (material: string) => {
    toast.info(`Downloading ${material}...`);
    // In a real application, this would trigger an actual download
    console.log(`Downloading: ${material}`);
  };

  // ✅ Get status badge color
  const getStatusColor = (status: Order["status"]) => {
    return status === "Completed" 
      ? "bg-green-100 text-green-700 border-green-200" 
      : "bg-yellow-100 text-yellow-700 border-yellow-200";
  };

  // ✅ Get status icon
  const getStatusIcon = (status: Order["status"]) => {
    return status === "Completed" ? CheckCircle : Clock;
  };

  // ✅ Calculate days until deadline
  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // ✅ Format currency
  const formatCurrency = (amount: number, currency: string) => {
    return `${currency}${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[#1d4d6a] font-semibold text-2xl">
            Writing Service Orders
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage student writing orders and communications
          </p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-3 py-2 rounded-lg border">
          <div className="flex gap-4">
            <span>Total: {orders.length}</span>
            <span className="text-green-600">Completed: {orders.filter(o => o.status === "Completed").length}</span>
            <span className="text-yellow-600">Pending: {orders.filter(o => o.status === "Pending").length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((order) => {
          const StatusIcon = getStatusIcon(order.status);
          const daysUntilDeadline = getDaysUntilDeadline(order.deadline);
          const isUrgent = daysUntilDeadline <= 3 && order.status === "Pending";
          
          return (
            <Card key={order.id} className={`shadow-md border-none hover:shadow-lg transition-shadow ${
              isUrgent ? 'border-l-4 border-l-red-500' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge className={getStatusColor(order.status)}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {order.status}
                  </Badge>
                  {isUrgent && (
                    <Badge variant="destructive" className="text-xs">
                      Urgent
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-[#1d4d6a] text-lg leading-tight">
                  {order.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Order Details */}
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      Type:
                    </span>
                    <span>{order.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Deadline:
                    </span>
                    <span className={isUrgent ? "text-red-600 font-semibold" : ""}>
                      {new Date(order.deadline).toLocaleDateString()} 
                      {order.status === "Pending" && ` (${daysUntilDeadline} days)`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Student:
                    </span>
                    <span>{order.student_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Pages:
                    </span>
                    <span>{order.number_of_pages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Amount:
                    </span>
                    <span className="text-green-600 font-semibold">
                      {formatCurrency(order.paid_amount, order.currency)}
                    </span>
                  </div>
                </div>

                {/* Academic Details */}
                <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Academic Level:</span>
                    <span>{order.academic_level}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Subject Area:</span>
                    <span className="text-blue-600">{order.subject_area}</span>
                  </div>
                </div>

                {/* Materials Section */}
                {order.additional_materials.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Materials Provided:</Label>
                    <div className="flex flex-wrap gap-1">
                      {order.additional_materials.map((material, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs cursor-pointer hover:bg-gray-100"
                          onClick={() => handleDownloadMaterial(material)}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Progress Bar - Only show for completed orders */}
                {order.status === "Completed" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Progress</span>
                      <span>{order.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-green-500 transition-all duration-300"
                        style={{ width: `${order.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Writer Notes (for completed orders) */}
                {order.writer_notes && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <Label className="text-sm font-medium text-green-800">Writer Notes:</Label>
                    <p className="text-sm text-green-700 mt-1">{order.writer_notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {/* Details Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsDetailsDialogOpen(true);
                    }}
                  >
                    <FileCheck className="w-4 h-4 mr-1" />
                    Details
                  </Button>

                  {/* Message Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsMessageDialogOpen(true);
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Message
                  </Button>

                  {/* Status Toggle Button */}
                  <Button
                    variant={order.status === "Completed" ? "outline" : "default"}
                    size="sm"
                    className={order.status === "Completed" ? "flex-1" : "flex-1 bg-[#1d4d6a]"}
                    onClick={() => {
                      setSelectedOrder(order);
                      setIsStatusDialogOpen(true);
                    }}
                  >
                    {order.status === "Completed" ? (
                      <>
                        <Clock className="w-4 h-4 mr-1" />
                        Mark Pending
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Complete
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1d4d6a]">
              Order Details - #{selectedOrder?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Order Title</Label>
                  <p className="text-sm">{selectedOrder.title}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Order Type</Label>
                  <p className="text-sm">{selectedOrder.type}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Academic Level</Label>
                  <p className="text-sm">{selectedOrder.academic_level}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Subject Area</Label>
                  <p className="text-sm text-blue-600">{selectedOrder.subject_area}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Number of Pages</Label>
                  <p className="text-sm">{selectedOrder.number_of_pages}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Paid Amount</Label>
                  <p className="text-sm text-green-600 font-semibold">
                    {formatCurrency(selectedOrder.paid_amount, selectedOrder.currency)}
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Order Date</Label>
                  <p className="text-sm">{new Date(selectedOrder.order_date).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Deadline</Label>
                  <p className="text-sm">{new Date(selectedOrder.deadline).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Student Information */}
              <div className="space-y-1">
                <Label className="text-sm font-medium">Student Information</Label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm"><strong>Name:</strong> {selectedOrder.student_name}</p>
                  <p className="text-sm"><strong>Email:</strong> {selectedOrder.student_email}</p>
                </div>
              </div>

              {/* Detailed Instructions */}
              <div className="space-y-1">
                <Label className="text-sm font-medium">Detailed Instructions</Label>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedOrder.detailed_instructions}</p>
                </div>
              </div>

              {/* Additional Materials */}
              {selectedOrder.additional_materials.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Additional Materials</Label>
                  <div className="space-y-2">
                    {selectedOrder.additional_materials.map((material, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{material}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadMaterial(material)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Writer Notes (if available) */}
              {selectedOrder.writer_notes && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-green-800">Writer Notes</Label>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">{selectedOrder.writer_notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedOrder?.status === "Completed" ? "Mark as Pending" : "Mark as Complete"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOrder && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="font-medium text-[#1d4d6a]">{selectedOrder.title}</p>
                <p className="text-sm text-gray-600">Type: {selectedOrder.type}</p>
                <p className="text-sm text-gray-600">Student: {selectedOrder.student_name}</p>
                <p className="text-sm">
                  Current Status: <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </p>
              </div>
            )}
            <p className="text-sm text-gray-600">
              {selectedOrder?.status === "Completed" 
                ? "This will change the order back to pending status."
                : "This will mark the order as completed and notify the student."
              }
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsStatusDialogOpen(false);
                setSelectedOrder(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              className={selectedOrder?.status === "Completed" ? "bg-yellow-600 text-white" : "bg-green-600 text-white"} 
              onClick={selectedOrder?.status === "Completed" ? handleMarkPending : handleMarkComplete}
            >
              {selectedOrder?.status === "Completed" ? "Mark as Pending" : "Mark as Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Message to {selectedOrder?.student_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Order Info */}
            {selectedOrder && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-[#1d4d6a]">
                  {selectedOrder.title}
                </p>
                <p className="text-sm text-gray-600">
                  Order #{selectedOrder.id} • {selectedOrder.type}
                </p>
                <p className="text-sm text-gray-600">
                  Student: {selectedOrder.student_email}
                </p>
              </div>
            )}

            {/* Message */}
            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Type your message to the student..."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="resize-none"
              />
            </div>

            {/* File Upload */}
            <div>
              <Label htmlFor="attachment">Attachment (optional)</Label>
              <Input
                id="attachment"
                type="file"
                accept="image/*, .pdf, .doc, .docx"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              {attachment && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ {attachment.name} selected
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Supported: Images, PDF, DOC, DOCX (Max 10MB)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsMessageDialogOpen(false);
                setMessage("");
                setAttachment(null);
                setSelectedOrder(null);
              }}
            >
              Cancel
            </Button>

            <Button 
              className="bg-[#bf2026] text-white" 
              onClick={handleSendMessage}
              disabled={!message.trim()}
            >
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}