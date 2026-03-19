import { useEffect, useState, useRef } from "react";
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
import axios from "axios";
import {
  File,
  FileText,
  CheckCircle,
  XCircle,
  Download,
  MessageCircle,
  GraduationCap,
  BookOpen,
  Layers,
  Calendar,
  User,
  Hash,
  Clock,
  ExternalLink
} from "lucide-react";
import * as React from "react";

// Polling replaces Supabase realtime — no direct DB connection needed

export default function AdminWritingDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [showWorkDialog, setShowWorkDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);

  const [finalText, setFinalText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [quoteExpiry, setQuoteExpiry] = useState("");

  // messages popup + polling
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showMessagesPopup, setShowMessagesPopup] = useState(false);
  const [adminReply, setAdminReply] = useState("");
const [activeSection, setActiveSection] = useState<"writing" | "interview">("writing");

// Interview states
const [materials, setMaterials] = useState<any[]>([]);
const [materialTitle, setMaterialTitle] = useState("");
const [materialCategory, setMaterialCategory] = useState("");
const [materialDescription, setMaterialDescription] = useState("");
const [materialFile, setMaterialFile] = useState<File | null>(null);



  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };



  /* ================================
     LOAD ALL ORDERS (and compute unread_count)
  =================================*/
  const loadOrders = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/writing-service/orders`,
        { headers }
      );

      const ordersData = res.data || [];

      // fetch unread count for each order in parallel (lightweight)
      const withCounts = await Promise.all(
        ordersData.map(async (o: any) => {
          try {
            const c = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/writing/feedback/${Number(o.id)}`,
              { headers }
            );
           const messages = c.data || [];
const unread = messages.filter(m => m.sender !== "admin").length;
return { ...o, unread_count: unread };

          } catch (err) {
            return { ...o, unread_count: 0 };
          }
        })
      );

      setOrders(withCounts);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load orders");
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  /* ================================
     LOAD USER MESSAGES FOR ORDER
  =================================*/
  const loadMessages = async (orderId: number) => {
    try {
      setLoadingMessages(true);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/writing/feedback/${Number(orderId)}`,
        { headers }
      );

      setMessages(res.data || []);
      // when admin opens messages, mark unread_count 0 locally
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, unread_count: 0 } : o))
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load user messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  const reviewOrder = async (id: number) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/writing-service/orders/${id}/review`,
        {},
        { headers }
      );
      toast.success("Order moved to review");
      loadOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error starting review");
    }
  };

  const sendQuote = async () => {
    if (!selectedOrder) return;
    if (!quotePrice) {
      toast.error("Price is required for quote");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/writing-service/orders/${selectedOrder.id}/quote`,
        {
          price: Number(quotePrice),
          notes: quoteNotes,
          expires_at: quoteExpiry || null
        },
        { headers }
      );
      toast.success("Quote sent successfully");
      setShowQuoteDialog(false);
      setQuotePrice("");
      setQuoteNotes("");
      loadOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error sending quote");
    }
  };

  /* ================================
     COMPLETE ORDER
  =================================*/
  const completeOrder = async () => {
    if (!selectedOrder) return;

    if (!file && !finalText.trim()) {
      toast.error("You must upload a file or write final text.");
      return;
    }

    try {
      let notes_url = null;

      if (file) {
      const formData = new FormData();
formData.append("file", file);

const uploadRes = await axios.post(
  `${import.meta.env.VITE_API_URL}/api/admin/writing-service/upload`,
  formData,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  }
);


        notes_url = uploadRes.data.url;
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/writing-service/orders/${selectedOrder.id}/complete`,
        {
          notes_url,
          final_text: finalText,
        },
        { headers }
      );


      toast.success("Order completed");
      setFinalText("");
      setFile(null);
      setShowWorkDialog(false);
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
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/writing-service/orders/${selectedOrder.id}/reject`,
        { reason: rejectReason },
        { headers }
      );

      toast.success("Order rejected");
      setRejectReason("");
      setShowRejectDialog(false);
      loadOrders();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject order");
    }
  };

  /* ================================
     SEND ADMIN REPLY
  =================================*/
  const sendAdminReply = async () => {
    if (!selectedOrder) {
      toast.error("No order selected");
      return;
    }
    if (!adminReply.trim()) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/writing-service/orders/reply`,
        {
          order_id: Number(selectedOrder.id),
          message: adminReply,
        },
        { headers }
      );

      // optimistic UI: push locally (server will also emit realtime)
      const newMsg = {
        id: `local-${Date.now()}`,
        order_id: Number(selectedOrder.id),
        user_id: "admin-local",
        user_name: "Admin",
        message: adminReply,
        sender: "admin",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMsg]);
      setAdminReply("");
      toast.success("Reply sent");
    } catch (err) {
      console.error("sendAdminReply error:", err);
      toast.error("Failed to send reply");
    }
  };

  /* ================================
     Polling: refresh messages every 10s when popup is open
  =================================*/
  useEffect(() => {
    if (!selectedOrder) return;
    if (!showMessagesPopup && !showWorkDialog && !showRejectDialog) return;

    const interval = setInterval(() => {
      loadMessages(Number(selectedOrder.id));
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedOrder, showMessagesPopup, showWorkDialog, showRejectDialog]);



  /* ================================
   LOAD INTERVIEW MATERIALS
================================ */
const loadInterviewMaterials = async () => {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/admin/writing-service/interview-materials`,
      { headers }
    );
    setMaterials(res.data || []);
  } catch (err) {
    console.error(err);
    toast.error("Failed to load interview materials");
  }
};

/* ================================
   UPLOAD INTERVIEW FILE
================================ */
const uploadInterviewMaterial = async () => {
  if (!materialTitle || !materialCategory || !materialFile) {
    toast.error("Title, category and file required");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("title", materialTitle);
    formData.append("category", materialCategory);
    formData.append("description", materialDescription);
    formData.append("file", materialFile);

    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/admin/writing-service/interview-materials`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // ⚠️ DO NOT set Content-Type manually
        },
      }
    );

    toast.success("Interview material added");

    setMaterialTitle("");
    setMaterialCategory("");
    setMaterialDescription("");
    setMaterialFile(null);

    loadInterviewMaterials();
  } catch (err) {
    console.error(err);
    toast.error("Upload failed");
  }
};

/* ================================
   DELETE INTERVIEW MATERIAL
================================ */
const deleteInterviewMaterial = async (id: number) => {
  if (!confirm("Delete this material?")) return;

  try {
    await axios.delete(
      `${import.meta.env.VITE_API_URL}/api/admin/writing-service/interview-materials/${id}`,
      { headers }
    );

    toast.success("Material deleted");
    loadInterviewMaterials();
  } catch (err) {
    console.error(err);
    toast.error("Delete failed");
  }
};
useEffect(() => {
  if (activeSection === "interview") {
    loadInterviewMaterials();
  }
}, [activeSection]);

  /* ================================
     UI
  =================================*/
  return (
    <div className="space-y-6">
     <div className="flex items-center justify-between">
  <h2 className="text-[#1d4d6a] text-2xl font-semibold">
    Admin — Services
  </h2>

  <div className="flex gap-2 mb-4">
  <Button
    variant={activeSection === "writing" ? "default" : "outline"}
    className={activeSection === "writing" ? "bg-[#bf2026] text-white" : ""}
    onClick={() => setActiveSection("writing")}
  >
    Writing Services
  </Button>

  <Button
    variant={activeSection === "interview" ? "default" : "outline"}
    className={activeSection === "interview" ? "bg-[#bf2026] text-white" : ""}
    onClick={() => setActiveSection("interview")}
  >
    Interview Preparation
  </Button>
</div>

</div>

{activeSection === "writing" && (
  <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="shadow-lg border border-gray-100 hover:border-gray-200 transition-all rounded-xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type: {order.type}</span>
                  </div>
                  <CardTitle className="text-[#1d4d6a] text-lg font-bold leading-tight">
                    {order.title || "Untitled Project"}
                  </CardTitle>
                </div>
                
                <Badge
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    order.status === "COMPLETED" || order.status === "Completed"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : order.status === "PAID" || order.status === "IN_PROGRESS" || order.status === "In Progress"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : order.status === "QUOTED"
                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                      : order.status === "PAYMENT_PENDING"
                      ? "bg-orange-50 text-orange-700 border border-orange-200"
                      : order.status === "REJECTED"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                  }`}
                >
                  {order.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 text-sm pb-6">
              {/* Main Metadata Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <GraduationCap className="w-3 h-3 text-[#bf2026]" />
                    <span>Academic Level</span>
                  </div>
                  <p className="pl-5 text-gray-800 font-semibold text-sm capitalize">
                    {order.academic_level || "Not specified"}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <BookOpen className="w-3 h-3 text-[#bf2026]" />
                    <span>Subject Area</span>
                  </div>
                  <p className="pl-5 text-gray-800 font-semibold text-sm capitalize">
                    {order.subject_area || "Not specified"}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <Layers className="w-3 h-3 text-[#bf2026]" />
                    <span>Project Size</span>
                  </div>
                  <p className="pl-5 text-gray-800 font-semibold text-sm uppercase">
                    {order.pages ? `${order.pages} Pages` : order.word_count || "Custom Size"}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <Calendar className="w-3 h-3 text-[#bf2026]" />
                    <span>Timeline</span>
                  </div>
                  <p className="pl-5 text-gray-800 font-semibold text-sm">
                    {order.deadline
                      ? new Date(order.deadline).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : "No Deadline"}
                  </p>
                </div>

                <div className="space-y-1 col-span-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <User className="w-3 h-3 text-[#bf2026]" />
                    <span>Customer Reference</span>
                  </div>
                  <p className="pl-5 text-gray-500 font-mono text-[10px] truncate bg-gray-50 p-1 rounded">
                    ID: {order.user_id}
                  </p>
                </div>
              </div>

              {/* Messages Button (Moved to a cleaner spot) */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] font-medium text-gray-400">
                  Ref: #{order.id}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-400 text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                  onClick={() => {
                    setSelectedOrder(order);
                    loadMessages(Number(order.id));
                    setShowMessagesPopup(true);
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Conversation
                  {order.unread_count > 0 && (
                    <span className="ml-1 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                      {order.unread_count}
                    </span>
                  )}
                </Button>
              </div>

              {/* Instructions Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="w-4 h-4 text-[#bf2026]" />
                  <span className="font-semibold text-sm">Detailed Instructions:</span>
                </div>
                <div className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[60px] leading-relaxed text-sm">
                  {order.instructions || "No instructions provided."}
                </div>
              </div>

              {/* Attachments Section */}
              {order.attachments_url && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Student Attachment</span>
                  </div>
                  <a
                    href={order.attachments_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 font-semibold"
                  >
                    Download <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                {order.status === "REQUESTED" && (
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => reviewOrder(order.id)}
                  >
                    <Clock className="w-4 h-4 mr-2" /> Start Review
                  </Button>
                )}

                {order.status === "UNDER_REVIEW" && (
                  <Button
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowQuoteDialog(true);
                    }}
                  >
                    <Hash className="w-4 h-4 mr-2" /> Send Quote
                  </Button>
                )}

                {(order.status === "PAID" || order.status === "IN_PROGRESS" || order.status === "In Progress") && (
                  <Button
                    className="flex-1 bg-[#bf2026] hover:bg-[#bf2026]/90 text-white"
                    onClick={() => {
                      setSelectedOrder(order);
                      loadMessages(Number(order.id));
                      setShowWorkDialog(true);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Complete Delivery
                  </Button>
                )}

                {!["COMPLETED", "Completed", "REJECTED"].includes(order.status) && (
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setSelectedOrder(order);
                      loadMessages(Number(order.id));
                      setShowRejectDialog(true);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MESSAGES POPUP */}
      <Dialog
        open={showMessagesPopup}
        onOpenChange={(v) => {
          setShowMessagesPopup(v);
          if (!v) {
            setMessages([]);
            setSelectedOrder(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Messages</DialogTitle>
            <p className="text-sm text-gray-500">
              Conversation for order #{selectedOrder?.id}
            </p>
          </DialogHeader>

          <div className="max-h-80 overflow-y-auto space-y-3 p-2 border rounded bg-gray-50">
            {loadingMessages && <p>Loading...</p>}

            {messages.length === 0 && !loadingMessages && (
              <p className="text-sm text-gray-500">No messages yet.</p>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded ${
                  msg.sender === "admin"
                    ? "bg-blue-50 border-blue-100"
                    : "bg-white border"
                }`}
              >
                <p className="text-gray-800">{msg.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {msg.sender === "admin"
                    ? msg.user_name || "Admin"
                    : msg.user_name || "User"}{" "}
                  — {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Reply input */}
          <div className="mt-3 flex gap-2">
            <Input
              value={adminReply}
              onChange={(e) => setAdminReply(e.target.value)}
              placeholder="Type reply..."
            />
            <Button className="bg-blue-600 text-white" onClick={sendAdminReply}>
              Send
            </Button>
          </div>

          <DialogFooter className="mt-3">
            <Button
              onClick={() => {
                setShowMessagesPopup(false);
                setMessages([]);
                setSelectedOrder(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* COMPLETE WORK DIALOG */}
      {/* COMPLETE WORK DIALOG */}
<Dialog open={showWorkDialog} onOpenChange={setShowWorkDialog}>
  <DialogContent className="max-h-[90vh] flex flex-col">
    <DialogHeader>
      <DialogTitle>Complete Order</DialogTitle>
      <p className="text-sm text-gray-500">
        Deliver the final writing or upload a file.
      </p>
    </DialogHeader>

    {/* Scrollable content area */}
    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
      {/* USER MESSAGES */}
      <div className="bg-white p-3 rounded border">
        <h3 className="text-md font-semibold mb-2 text-[#1d4d6a]">
          User Messages
        </h3>

        {loadingMessages && <p>Loading messages...</p>}

        {messages.length === 0 && !loadingMessages && (
          <p className="text-sm text-gray-500">No messages from user.</p>
        )}

        <div className="max-h-60 overflow-y-auto">
          {messages.map((msg) => (
            <div key={msg.id} className="border-b py-2">
              <p className="text-sm text-gray-800">{msg.message}</p>
              <p className="text-xs text-gray-500">
                — {msg.user_name || "User"} (
                {new Date(msg.created_at).toLocaleString()})
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* USER REQUEST */}
      <div className="bg-gray-50 p-3 rounded border">
        <h3 className="text-md font-semibold mb-2 text-[#1d4d6a]">
          User Request
        </h3>

        <p>
          <strong>Title:</strong> {selectedOrder?.title}
        </p>
        <p>
          <strong>Type:</strong> {selectedOrder?.type}
        </p>

        <p className="mt-2">
          <strong>Instructions:</strong>
        </p>
        <p className="text-gray-700">{selectedOrder?.instructions}</p>

        {selectedOrder?.attachments_url && (
          <div className="mt-2">
            <strong>Attachment:</strong>{" "}
            <a
              href={selectedOrder.attachments_url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              Download Attachment
            </a>
          </div>
        )}
      </div>

      {/* ADMIN WORK */}
      <div className="space-y-4 py-2">
        <Label>Write Final Text</Label>
        <Textarea
          rows={6}
          placeholder="Write the completed content here..."
          value={finalText}
          onChange={(e) => setFinalText(e.target.value)}
        />

        <Label>Or Upload File</Label>
        <Input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>
    </div>

    {/* Fixed footer at the bottom */}
    <DialogFooter className="mt-4 pt-4 border-t">
      <Button variant="outline" onClick={() => setShowWorkDialog(false)}>
        Cancel
      </Button>
      <Button className="bg-green-600 text-white" onClick={completeOrder}>
        <CheckCircle className="w-4 h-4 mr-1" />
        Mark Completed
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* REJECT DIALOG */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Order</DialogTitle>
          </DialogHeader>

          {/* SHOW USER MESSAGES IN REJECT DIALOG TOO */}
          <div className="bg-white p-3 rounded border mb-4 max-h-60 overflow-y-auto">
            <h3 className="text-md font-semibold mb-2 text-[#1d4d6a]">
              User Messages
            </h3>

            {loadingMessages && <p>Loading messages...</p>}

            {messages.length === 0 && !loadingMessages && (
              <p className="text-sm text-gray-500">No messages from user.</p>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="border-b py-2">
                <p className="text-sm text-gray-800">{msg.message}</p>
                <p className="text-xs text-gray-500">
                  — {msg.user_name || "User"} (
                  {new Date(msg.created_at).toLocaleString()})
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Label>Reason for rejection</Label>
            <Textarea
              rows={4}
              placeholder="Why is the order being rejected?"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button className="bg-red-600 text-white" onClick={rejectOrder}>
              Reject Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SEND QUOTE DIALOG */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Quote</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Price (INR)</Label>
              <Input
                type="number"
                value={quotePrice}
                onChange={(e) => setQuotePrice(e.target.value)}
                placeholder="e.g. 1500"
              />
            </div>
            <div>
              <Label>Admin Notes / Instructions for User</Label>
              <Textarea
                rows={3}
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                placeholder="Details about the price or scope..."
              />
            </div>
            <div>
              <Label>Quote Expiry (Optional)</Label>
              <Input
                type="date"
                value={quoteExpiry}
                onChange={(e) => setQuoteExpiry(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowQuoteDialog(false)}
            >
              Cancel
            </Button>
            <Button className="bg-purple-600 text-white" onClick={sendQuote}>
              Send Quote to Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )}

{activeSection === "interview" && (
  <div className="space-y-6">
    <h3 className="text-[#1d4d6a] text-xl font-semibold">Interview Materials</h3>
    
    {/* Add Interview Material Form */}
    <Card className="shadow-md border-none">
      <CardHeader>
        <CardTitle>Add New Material</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Title</Label>
          <Input
            value={materialTitle}
            onChange={(e) => setMaterialTitle(e.target.value)}
            placeholder="Material title"
          />
        </div>
        <div>
          <Label>Category</Label>
          <Input
            value={materialCategory}
            onChange={(e) => setMaterialCategory(e.target.value)}
            placeholder="e.g., Technical, Behavioral"
          />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            value={materialDescription}
            onChange={(e) => setMaterialDescription(e.target.value)}
            placeholder="Brief description"
          />
        </div>
        <div>
          <Label>File</Label>
          <Input
            type="file"
            onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
          />
        </div>
        <Button className="bg-[#bf2026] text-white" onClick={uploadInterviewMaterial}>
          Upload Material
        </Button>
      </CardContent>
    </Card>

    {/* Materials List */}
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {materials.map((m) => (
          <Card key={m.id} className="shadow-md border-none">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">{m.title}</CardTitle>
              <Badge>{m.category}</Badge>
            </CardHeader>

            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">{m.description}</p>

              <div className="flex justify-between items-center">
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline flex items-center"
                >
                  <Download className="w-4 h-4 mr-1" /> View PDF
                </a>

                <Button
                  variant="outline"
                  className="border-red-400 text-red-600"
                  onClick={() => deleteInterviewMaterial(m.id)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
)}
    </div>
  );
}


  
