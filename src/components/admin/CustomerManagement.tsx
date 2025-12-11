import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card, CardContent, CardHeader
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../ui/table";
import {
  Search, Filter, Mail,
  Trash2, ShieldCheck, ShieldOff
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import * as React from "react";

export function CustomerManagement() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");

  const [loading, setLoading] = useState(true);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/admin/customers", {
        headers: { Authorization: `Bearer ${token}` },
        params: { search, status, plan, page, limit: 10 },
      });
      setCustomers(res.data.data || []);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search, status, plan]);

  const applyFilters = () => {
    setPage(1);
    fetchCustomers();
  };

  const suspendCustomer = async (id: string) => {
    const token = localStorage.getItem("token");
    await axios.post(
      `https://ebook-backend-lxce.onrender.com/api/admin/customers/${id}/suspend`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchCustomers();
  };

  const activateCustomer = async (id: string) => {
    const token = localStorage.getItem("token");
    await axios.post(
      `https://ebook-backend-lxce.onrender.com/api/admin/customers/${id}/activate`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchCustomers();
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    const token = localStorage.getItem("token");
    await axios.delete(
      `https://ebook-backend-lxce.onrender.com/api/admin/customers/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await fetchCustomers();
  };

  const sendNotification = async () => {
    const token = localStorage.getItem("token");
    await axios.post(
      `https://ebook-backend-lxce.onrender.com/api/admin/customers/${selectedCustomer.id}/notify`,
      {
        title: emailSubject,
        message: emailMessage,
        // link: "dashboard",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setShowEmailModal(false);
    setEmailSubject("");
    setEmailMessage("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-[#1d4d6a] mb-1">Customer Management</h2>
          <p className="text-sm text-gray-500">{loading ? "Loading..." : `${customers.length} customers`}</p>
        </div>
        <Button className="bg-[#bf2026] text-white">Export Data</Button>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            {/* search input */}
            <div className="relative sm:flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="border px-3 py-2 rounded-lg w-full sm:flex-1"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Accounts</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              className="border px-3 py-2 rounded-lg w-full sm:flex-1"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
            >
              <option value="">All Plans</option>
              <option value="Monthly">Monthly</option>
              <option value="Annual">Annual</option>
              <option value="Institutional">Institutional</option>
            </select>

            <Button variant="outline" className="gap-2 w-full sm:flex-1" onClick={applyFilters}>
              <Filter className="w-4 h-4" /> Apply
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-center py-6 text-gray-500">Loading...</p>
          ) : customers.length === 0 ? (
            <p className="text-center py-6 text-gray-500">No customers found</p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Billing Status</TableHead>
                      <TableHead>Account Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                                <TableBody>
                {customers.map((c) => {
                  const displayName =
                    c.full_name?.trim() ||
                    c.email?.split("@")[0] ||
                    "Unnamed";

                  const initial = displayName[0]?.toUpperCase() || "U";

                  return (
                    <TableRow key={c.id}>
                      {/* customer name */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-[#1d4d6a] text-white">
                              {initial}
                            </AvatarFallback>
                          </Avatar>

                          <span className="text-[#1d4d6a] font-medium">
                            {displayName}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>{c.email}</TableCell>

                      <TableCell>
                        <Badge>{c.plan || "N/A"}</Badge>
                      </TableCell>

                      {/* Billing Status (subscription) */}
                      <TableCell>
                        <Badge
                          className={
                            c.subscription_status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }
                        >
                          {c.subscription_status}
                        </Badge>
                      </TableCell>

                      {/* Account Status (profile) */}
                      <TableCell>
                        <Badge
                          className={
                            c.account_status === "active"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                         {c.account_status}

                        </Badge>
                      </TableCell>

                      <TableCell>
                        {c.created_at
                          ? new Date(c.created_at).toLocaleDateString()
                          : "—"}
                      </TableCell>

                      <TableCell>
                        ₹{Number(c.total_spent ?? 0).toLocaleString()}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex gap-2">
                          {/* Email */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setShowEmailModal(true);
                            }}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>

                          {/* Suspend / Activate */}
                          {c.account_status === "active" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => suspendCustomer(c.id)}
                            >
                              <ShieldOff className="w-4 h-4 text-red-500" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => activateCustomer(c.id)}
                            >
                              <ShieldCheck className="w-4 h-4 text-green-500" />
                            </Button>
                          )}

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCustomer(c.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden space-y-4">
                {customers.map((c) => {
                  const displayName =
                    c.full_name?.trim() ||
                    `${c.first_name || ""} ${c.last_name || ""}`.trim() ||
                    c.email?.split("@")[0] ||
                    "Unnamed";
                  const initial = displayName[0]?.toUpperCase() || "U";

                  return (
                    <Card key={c.id} className="p-4 shadow-md">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-[#1d4d6a] text-white">{initial}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-[#1d4d6a]">{displayName}</p>
                            <p className="text-sm text-gray-500">{c.email}</p>
                          </div>
                        </div>
                        <Badge className={c.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{c.status}</Badge>
                      </div>

                      <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                        <span>Plan: {c.plan || "N/A"}</span>
                        <span>Joined: {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</span>
                        <span>Total: ₹{Number(c.total_spent ?? 0).toLocaleString()}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedCustomer(c); setShowEmailModal(true); }}>
                          <Mail className="w-4 h-4" />
                        </Button>
                        {c.status === "Active" ? (
                          <Button variant="ghost" size="sm" onClick={() => suspendCustomer(c.id)}>
                            <ShieldOff className="w-4 h-4 text-red-500" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => activateCustomer(c.id)}>
                            <ShieldCheck className="w-4 h-4 text-green-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => deleteCustomer(c.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination */}
          <div className="flex justify-center gap-3 mt-4">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
            <span className="text-gray-600">Page {page} of {totalPages}</span>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </CardContent>
      </Card>

      {/* EMAIL MODAL */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message / Email</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            className="mb-3"
          />
          <Textarea
            placeholder="Write your message..."
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
          />
          <Button className="mt-4 w-full bg-[#bf2026] text-white" onClick={sendNotification}>Send Email</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
