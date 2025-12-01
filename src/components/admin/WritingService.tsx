import { useEffect, useState, useRef } from "react";
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
  MessageCircle
} from "lucide-react";
import * as React from "react";

// Supabase client for realtime (placeholders — replace with your values)
import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

const realtimeClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function AdminWritingDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [showWorkDialog, setShowWorkDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const [finalText, setFinalText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // messages popup + realtime
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showMessagesPopup, setShowMessagesPopup] = useState(false);
  const [adminReply, setAdminReply] = useState("");
  const [listening, setListening] = useState(false);

  const token = localStorage.getItem("token");  const headers = { Authorization: `Bearer ${token}` };

  const realtimeChannelRef = useRef<any>(null);

  /* ================================
LOAD ALL ORDERS (and compute unread_count)
  =================================*/
  const loadOrders = async () => {
    try {
      const res = await axios.get(
        "https://ebook-backend-lxce.onrender.com/api/admin/writing-service/orders",
        { headers }
      );
      const ordersData = res.data || [];

      // fetch unread count for each order in parallel (lightweight)
      const withCounts = await Promise.all(
        ordersData.map(async (o: any) => {
          try {
            const c = await axios.get(
              `https://ebook-backend-lxce.onrender.com/api/writing/feedback/${Number(o.id)}`,
              { headers }
            );
            const messages = c.data || [];
            // unread logic: here we treat all as unread until admin views; you can refine with a `read` column later
            return { ...o, unread_count: messages.length };
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
        `https://ebook-backend-lxce.onrender.com/api/writing/feedback/${Number(orderId)}`,
        { headers }
      );

      setMessages(res.data || []);
      // when admin opens messages, mark unread_count 0 locally
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, unread_count: 0 } : o)));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load user messages");
    } finally {
      setLoadingMessages(false);
    }
  };

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
          "https://ebook-backend-lxce.onrender.com/api/admin/writing-service/upload",
          formData,
          { headers: { ...headers } }
        );

        notes_url = uploadRes.data.url;
      }

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
        "https://ebook-backend-lxce.onrender.com/api/admin/writing-service/orders/reply",
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
     Realtime: subscribe to writing_feedback inserts
  =================================*/
  useEffect(() => {
    // don't double subscribe
    if (listening) return;

    try {
      const channel = realtimeClient
        .channel("writing_feedback_changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "writing_feedback",
          },
          (payload) => {
            const newMsg = payload.new;

            // ensure order_id is number for comparison
            const newOrderId = Number(newMsg.order_id);

            // If admin currently viewing that order's popup, append message
            setSelectedOrder((cur) => {
              if (cur && Number(cur.id) === newOrderId) {
                setMessages((prev) => [...prev, newMsg]);
                return cur;
              }
              return cur;
            });

            // Update unread counter in orders list
            setOrders((prev) =>
              prev.map((o) =>
                Number(o.id) === newOrderId ? { ...o, unread_count: (o.unread_count || 0) + 1 } : o
              )
            );
          }
        )
        .subscribe();

      realtimeChannelRef.current = channel;
      setListening(true);
    } catch (err) {
      console.error("Realtime subscribe error:", err);
    }

    // cleanup
    return () => {
      try {
        if (realtimeChannelRef.current) {
          realtimeClient.removeChannel(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
          setListening(false);
        }
      } catch (err) {
        console.error("Realtime cleanup error:", err);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



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
              <div className="flex items-center justify-between">
                <div>
                  <p><strong>Type:</strong> {order.type}</p>
                  <p><strong>Word Count:</strong> {order.word_count || "Not specified"}</p>
                </div>

                {/* Messages button with unread badge */}
                <div>
                  <Button
                    variant="outline"
                    className="border-blue-400 text-blue-700 flex items-center gap-2"
                    onClick={() => {
                      setSelectedOrder(order);
                      loadMessages(Number(order.id));
                      setShowMessagesPopup(true);
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Messages
                    {order.unread_count > 0 && (
                      <span className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {order.unread_count}
                      </span>
                    )}
                  </Button>
                </div>
              </div>

              <p>
                <strong>Deadline:</strong>{" "}
                {order.deadline ? new Date(order.deadline).toLocaleDateString() : "—"}
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
                      rel="noreferrer"
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
                      loadMessages(Number(order.id));
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
                      loadMessages(Number(order.id));
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

      {/* MESSAGES POPUP */}
      <Dialog open={showMessagesPopup} onOpenChange={(v) => {
        setShowMessagesPopup(v);
        if (!v) {
          setMessages([]);
          setSelectedOrder(null);
        }
      }}>
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
              <div key={msg.id} className={`p-3 rounded ${msg.sender === "admin" ? "bg-blue-50 border-blue-100" : "bg-white border"}`}>
                <p className="text-gray-800">{msg.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {msg.sender === "admin" ? (msg.user_name || "Admin") : (msg.user_name || "User")} — {new Date(msg.created_at).toLocaleString()}
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
            <Button onClick={() => {
              setShowMessagesPopup(false);
              setMessages([]);
              setSelectedOrder(null);
            }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* COMPLETE WORK DIALOG */}
      <Dialog open={showWorkDialog} onOpenChange={setShowWorkDialog}>
        <DialogContent>

          <DialogHeader>
            <DialogTitle>Complete Order</DialogTitle>
            <p className="text-sm text-gray-500">
              Deliver the final writing or upload a file.
            </p>
          </DialogHeader>

          {/* USER MESSAGES */}
          <div className="bg-white p-3 rounded border mb-4 max-h-60 overflow-y-auto">
            <h3 className="text-md font-semibold mb-2 text-[#1d4d6a]">
              User Messages
            </h3>

            {loadingMessages && <p>Loading messages...</p>}

            {messages.length === 0 && !loadingMessages && (
              <p className="text-sm text-gray-500">
                No messages from user.
              </p>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="border-b py-2">
                <p className="text-sm text-gray-800">{msg.message}</p>
                <p className="text-xs text-gray-500">
                  — {msg.user_name || "User"} ({new Date(msg.created_at).toLocaleString()})
                </p>
              </div>
            ))}
          </div>

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
                  rel="noreferrer"
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

          {/* SHOW USER MESSAGES IN REJECT DIALOG TOO */}
          <div className="bg-white p-3 rounded border mb-4 max-h-60 overflow-y-auto">
            <h3 className="text-md font-semibold mb-2 text-[#1d4d6a]">
              User Messages
            </h3>

            {loadingMessages && <p>Loading messages...</p>}

            {messages.length === 0 && !loadingMessages && (
              <p className="text-sm text-gray-500">
                No messages from user.
              </p>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="border-b py-2">
                <p className="text-sm text-gray-800">{msg.message}</p>
                <p className="text-xs text-gray-500">
                  — {msg.user_name || "User"} ({new Date(msg.created_at).toLocaleString()})
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