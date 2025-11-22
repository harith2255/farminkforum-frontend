import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import axios from "axios";
import {
  FileText,
  CheckCircle,
  XCircle,
  File,
  Download,
  BookOpen,
  Calendar,
  User,
  DollarSign,
  FileCheck,
  MessageSquare,
  Clock
} from "lucide-react";

// Helper functions
const getStatusIcon = (status: string) => {
  return status === "Completed" ? CheckCircle : Clock;
};

const getStatusColor = (status: string) => {
  return status === "Completed" 
    ? "bg-green-100 text-green-800 hover:bg-green-100" 
    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
};

const getDaysUntilDeadline = (deadline: string) => {
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(amount);
};

export default function AdminWritingDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Dialog states
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  
  // Message state
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  /* ================================
     LOAD ALL ORDERS
  =================================*/
  const loadOrders = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/admin/writing-service/orders",
        { headers }
      );
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders");
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  /* ================================
     ACCEPT ORDER
  =================================*/
  const acceptOrder = async (id: number) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/writing-service/orders/${id}/accept`,
        {},
        { headers }
      );
      toast.success("Order accepted");
      loadOrders();
    } catch (err) {
      console.error(err);
      toast.error("Error accepting order");
    }
  };

  /* ================================
     COMPLETE ORDER
  =================================*/
  const completeOrder = async () => {
    if (!selectedOrder) return;

    try {
      let notes_url = null;

      // Upload file if provided
      if (attachment) {
        const formData = new FormData();
        formData.append("file", attachment);

        const uploadRes = await axios.post(
          "http://localhost:5000/api/admin/writing-service/upload",
          formData,
          { headers: { ...headers, "Content-Type": "multipart/form-data" } }
        );

        notes_url = uploadRes.data.url;
      }

      // Send completion request
      await axios.put(
        `http://localhost:5000/api/admin/writing-service/orders/${selectedOrder.id}/complete`,
        { notes_url, content_text: message },
        { headers }
      );

      toast.success("Order completed");
      setMessage("");
      setAttachment(null);
      setIsMessageDialogOpen(false);
      loadOrders();

    } catch (err) {
      console.error(err);
      toast.error("Error completing order");
    }
  };

  /* ================================
     REJECT ORDER
  =================================*/
  const rejectOrder = async () => {
    if (!selectedOrder) return;

    try {
      await axios.put(
        `http://localhost:5000/api/admin/writing-service/orders/${selectedOrder.id}/reject`,
        { reason: message },
        { headers }
      );

      toast.success("Order rejected");
      setMessage("");
      setIsMessageDialogOpen(false);
      loadOrders();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject order");
    }
  };

  /* ================================
     MARK AS COMPLETE
  =================================*/
  const handleMarkComplete = async () => {
    if (!selectedOrder) return;

    try {
      await axios.put(
        `http://localhost:5000/api/admin/writing-service/orders/${selectedOrder.id}/complete`,
        { content_text: "Order marked as completed" },
        { headers }
      );

      toast.success(`Order "${selectedOrder.title}" marked as completed`);
      setIsStatusDialogOpen(false);
      setSelectedOrder(null);
      loadOrders();
    } catch (err) {
      console.error(err);
      toast.error("Error marking order as complete");
    }
  };

  /* ================================
     MARK AS PENDING
  =================================*/
  const handleMarkPending = async () => {
    if (!selectedOrder) return;

    try {
      await axios.put(
        `http://localhost:5000/api/admin/writing-service/orders/${selectedOrder.id}/status`,
        { status: "Pending" },
        { headers }
      );

      toast.success(`Order "${selectedOrder.title}" marked as pending`);
      setIsStatusDialogOpen(false);
      setSelectedOrder(null);
      loadOrders();
    } catch (err) {
      console.error(err);
      toast.error("Error marking order as pending");
    }
  };

  /* ================================
     SEND MESSAGE
  =================================*/
  const handleSendMessage = async () => {
    if (!selectedOrder || !message.trim()) return;

    try {
      let attachment_url = null;

      // Upload attachment if provided
      if (attachment) {
        const formData = new FormData();
        formData.append("file", attachment);

        const uploadRes = await axios.post(
          "http://localhost:5000/api/admin/writing-service/upload",
          formData,
          { headers: { ...headers, "Content-Type": "multipart/form-data" } }
        );

        attachment_url = uploadRes.data.url;
      }

      // Send message
      await axios.post(
        `http://localhost:5000/api/admin/writing-service/orders/${selectedOrder.id}/message`,
        { 
          message: message.trim(),
          attachment_url 
        },
        { headers }
      );

      toast.success("Message sent successfully");
      setMessage("");
      setAttachment(null);
      setIsMessageDialogOpen(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    }
  };

  /* ================================
     HANDLE FILE UPLOAD
  =================================*/
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setAttachment(file);
    }
  };

  /* ================================
     HANDLE DOWNLOAD MATERIAL
  =================================*/
  const handleDownloadMaterial = async (material: string) => {
    try {
      // This would typically download the file from your server
      toast.info(`Downloading ${material}...`);
      // Implement actual download logic here
    } catch (err) {
      console.error(err);
      toast.error("Failed to download material");
    }
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
                {order.additional_materials && order.additional_materials.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Materials Provided:</Label>
                    <div className="flex flex-wrap gap-1">
                      {order.additional_materials.map((material: string, index: number) => (
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
                      <span>{order.progress || 100}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-green-500 transition-all duration-300"
                        style={{ width: `${order.progress || 100}%` }}
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
              {selectedOrder.additional_materials && selectedOrder.additional_materials.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Additional Materials</Label>
                  <div className="space-y-2">
                    {selectedOrder.additional_materials.map((material: string, index: number) => (
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