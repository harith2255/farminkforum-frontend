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
  Download
} from "lucide-react";
import * as React from "react";

export default function AdminWritingDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [showWorkDialog, setShowWorkDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const [finalText, setFinalText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  /* ================================
     LOAD ALL ORDERS
  =================================*/
  const loadOrders = async () => {
    try {
      const res = await axios.get(
        "https://ebook-backend-lxce.onrender.com/api/admin/writing-service/orders",
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
        `https://ebook-backend-lxce.onrender.com/api/admin/writing-service/orders/${id}/accept`,
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

  // 🚨 VALIDATION MUST BE FIRST
  if (!file && !finalText.trim()) {
    toast.error("You must upload a file or write final text.");
    return;
  }

  try {
    let notes_url = null;

    // Upload file if provided
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await axios.post(
        "https://ebook-backend-lxce.onrender.com/api/admin/writing-service/upload",
        formData,
        { headers: { ...headers, "Content-Type": "multipart/form-data" } }
      );

      notes_url = uploadRes.data.url;
    }

    // Send completion request
    await axios.put(
      `https://ebook-backend-lxce.onrender.com/api/admin/writing-service/orders/${selectedOrder.id}/complete`,
      { notes_url, content_text: finalText },
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
      await axios.put(
        `https://ebook-backend-lxce.onrender.com/api/admin/writing-service/orders/${selectedOrder.id}/reject`,
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
     UI
  =================================*/
  return (
    <div className="space-y-6">
      <h2 className="text-[#1d4d6a] text-2xl font-semibold">
        Admin — Writing Orders
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="shadow-md border-none">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">
                {order.title}
              </CardTitle>

              <Badge
                className={
                  order.status === "Completed"
                    ? "bg-green-100 text-green-700"
                    : order.status === "In Progress"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-yellow-100 text-yellow-700"
                }
              >
                {order.status}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-2 text-sm">

              <p><strong>Type:</strong> {order.type}</p>
              <p><strong>Word Count:</strong> {order.word_count || "Not specified"}</p>

              <p>
                <strong>Deadline:</strong>{" "}
                {new Date(order.deadline).toLocaleDateString()}
              </p>

              <p><strong>User ID:</strong> {order.user_id}</p>

              <p><strong>Instructions:</strong></p>
              <p className="text-gray-700 bg-gray-50 p-2 rounded">
                {order.instructions || "No instructions"}
              </p>

              {order.attachments_url && (
                <div className="mt-2">
                  <strong>Attachment:</strong>
                  <div className="flex items-center gap-2 mt-1">
                    <File className="w-4 h-4" />
                    <a
                      href={order.attachments_url}
                      target="_blank"
                      className="text-blue-600 underline flex items-center"
                    >
                      Download File <Download className="w-4 ml-1" />
                    </a>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {order.status === "Pending" && (
                  <Button
                    className="bg-blue-600 text-white"
                    onClick={() => acceptOrder(order.id)}
                  >
                    Accept
                  </Button>
                )}

                {order.status === "In Progress" && (
                  <Button
                    className="bg-[#bf2026] text-white"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowWorkDialog(true);
                    }}
                  >
                    <FileText className="w-4 h-4 mr-1" /> Complete Work
                  </Button>
                )}

                {order.status !== "Completed" && (
                  <Button
                    variant="outline"
                    className="border-red-400 text-red-600"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowRejectDialog(true);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* COMPLETE WORK DIALOG */}
      <Dialog open={showWorkDialog} onOpenChange={setShowWorkDialog}>
        <DialogContent>

          <DialogHeader>
            <DialogTitle>Complete Order</DialogTitle>
            <p className="text-sm text-gray-500">
              Deliver the final writing or upload a file.
            </p>
          </DialogHeader>

          {/* Show User Request */}
          <div className="bg-gray-50 p-3 rounded border mb-4">
            <h3 className="text-md font-semibold mb-2 text-[#1d4d6a]">User Request</h3>

            <p><strong>Title:</strong> {selectedOrder?.title}</p>
            <p><strong>Type:</strong> {selectedOrder?.type}</p>

            <p className="mt-2"><strong>Instructions:</strong></p>
            <p className="text-gray-700">
              {selectedOrder?.instructions}
            </p>

            {selectedOrder?.attachments_url && (
              <div className="mt-2">
                <strong>Attachment:</strong>{" "}
                <a
                  href={selectedOrder.attachments_url}
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  Download Attachment
                </a>
              </div>
            )}
          </div>

          {/* Admin Work */}
          <div className="space-y-4 py-4">
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

          <DialogFooter>
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
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 text-white" onClick={rejectOrder}>
              Reject Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}