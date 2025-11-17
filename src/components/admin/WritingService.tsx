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
import { Pencil, MessageSquare } from "lucide-react";

interface Order {
  id: number;
  title: string;
  type: string;
  deadline: string;
  status: "Pending" | "Completed";
  progress: number;
  author_id: string | null;
}

export default function AdminWritingDashboard() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 1,
      title: "Agricultural Innovations",
      type: "Research Paper",
      deadline: "2025-11-20",
      status: "Pending",
      progress: 45,
      author_id: "writer_001",
    },
    {
      id: 2,
      title: "Adult Education Trends",
      type: "Essay",
      deadline: "2025-11-25",
      status: "Pending",
      progress: 80,
      author_id: "writer_002",
    },
    {
      id: 3,
      title: "Agricultural Policies Analysis",
      type: "Dissertation",
      deadline: "2025-12-05",
      status: "Completed",
      progress: 0,
      author_id: null,
    },
  ]);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [authorId, setAuthorId] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);


  // ✅ Handle Assign Writer
  // const handleAssign = () => {
  //   if (!selectedOrder) return;
  //   if (!authorId) {
  //     toast.error("Please enter an Author ID");
  //     return;
  //   }

  //   const updatedOrders = orders.map((o) =>
  //     o.id === selectedOrder.id
  //       ? { ...o, author_id: authorId, status: "Assigned" as const }
  //       : o
  //   );

  //   setOrders(updatedOrders);
  //   toast.success(`Writer assigned to order #${selectedOrder.id}`);
  //   setAuthorId("");
  //   setIsAssignDialogOpen(false);
  // };

  // ✅ Handle Send Message
  const handleSendMessage = () => {
    if (!selectedOrder) return;
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    toast.success(`Message sent to ${selectedOrder.author_id || "writer"}`);
    setMessage("");
    setIsMessageDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-[#1d4d6a] font-semibold text-2xl">
        Admin — Writing Orders
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="shadow-md border-none">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">{order.title}</CardTitle>
              <Badge
                className={
                  order.status === "Pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : order.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-700"
                }
              >
                {order.status}
              </Badge>

            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-2 mb-3">
                <p>
                  <strong>Type:</strong> {order.type}
                </p>
                <p>
                  <strong>Deadline:</strong>{" "}
                  {new Date(order.deadline).toLocaleDateString()}
                </p>
                <p>
                  <strong>Progress:</strong> {order.progress}%
                </p>
                <p>
                  <strong>Writer:</strong>{" "}
                  {order.author_id ? order.author_id : "Unassigned"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!order.author_id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setIsMessageDialogOpen(true);
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assign Author Dialog
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Writer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="author">Author ID</Label>
            <Input
              id="author"
              placeholder="Enter writer's user ID"
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="bg-[#bf2026] text-white" onClick={handleAssign}>
              Assign Writer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}

      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message to Student</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Message */}
            <div>
              <Label>Message</Label>
              <Textarea
                placeholder="Type your message to the author..."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            {/* File Upload */}
            <div>
              <Label>Attachment (optional)</Label>
              <Input
                type="file"
                accept="image/*, .pdf, .docx"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMessageDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button className="bg-[#bf2026] text-white" onClick={handleSendMessage}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
