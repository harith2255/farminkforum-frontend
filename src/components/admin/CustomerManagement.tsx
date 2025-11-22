import { useState, useEffect } from 'react';
import axios from "axios";
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  Search, Filter, Mail,
  Trash2, ShieldCheck, ShieldOff
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Textarea } from "../ui/textarea";

export function CustomerManagement() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(true);

  // Email modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  // Remove unused state variables
  // const [filterOpen, setFilterOpen] = useState(false);
  // const [sortOption, setSortOption] = useState('');
  // const [searchQuery, setSearchQuery] = useState('');
  // const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  // const [mailPopup, setMailPopup] = useState<any>(null);
  // const [mailText, setMailText] = useState("");
  // const [actionMenu, setActionMenu] = useState<number | null>(null);

  // -------------------------------------
  // FETCH CUSTOMERS
  // -------------------------------------
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get("https://ebook-backend-lxce.onrender.com/api/admin/customers", {
        headers: { Authorization: `Bearer ${token}` },
        params: { search, status, plan, page, limit: 10 },
      });

      // Fixed: Check the actual API response structure
      setCustomers(res.data.data || res.data.customers || []);
      setTotalPages(res.data.totalPages || res.data.pages || 1);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setCustomers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search, status, plan]); // Fixed: Added dependencies to refetch when filters change

  const applyFilters = () => {
    setPage(1);
    fetchCustomers();
  };

  // Handle search input with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search !== "") {
        setPage(1);
        fetchCustomers();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // -------------------------------------
  // ACTION HANDLERS
  // -------------------------------------
  const suspendCustomer = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `https://ebook-backend-lxce.onrender.com/api/admin/customers/${id}/suspend`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCustomers();
    } catch (err) {
      console.error("Error suspending customer:", err);
      alert("Failed to suspend customer");
    }
  };

  const activateCustomer = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `https://ebook-backend-lxce.onrender.com/api/admin/customers/${id}/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCustomers();
    } catch (err) {
      console.error("Error activating customer:", err);
      alert("Failed to activate customer");
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer? This action cannot be undone.")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `https://ebook-backend-lxce.onrender.com/api/admin/customers/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCustomers();
    } catch (err) {
      console.error("Error deleting customer:", err);
      alert("Failed to delete customer");
    }
  };

  const sendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      alert("Please enter both subject and message");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `https://ebook-backend-lxce.onrender.com/api/admin/customers/${selectedCustomer.id}/email`,
        {
          subject: emailSubject,
          text: emailMessage,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Email sent successfully!");
      setShowEmailModal(false);
      setEmailSubject("");
      setEmailMessage("");
      setSelectedCustomer(null);
    } catch (err) {
      console.error("Error sending email:", err);
      alert("Failed to send email");
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setPlan("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#1d4d6a] mb-1">Customer Management</h2>
          <p className="text-sm text-gray-500">
            {loading ? "Loading..." : `${customers.length} customers found`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
          <Button className="bg-[#bf2026] text-white">Export Data</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="border px-3 py-2 rounded-lg"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select
              className="border px-3 py-2 rounded-lg"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
            >
              <option value="">All Plans</option>
              <option value="Monthly">Monthly</option>
              <option value="Annual">Annual</option>
              <option value="Institutional">Institutional</option>
              <option value="Free">Free</option>
            </select>

            <Button 
              variant="outline" 
              className="gap-2" 
              onClick={applyFilters}
              disabled={loading}
            >
              <Filter className="w-4 h-4" />
              Apply
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-center py-6 text-gray-500">Loading customers...</p>
          ) : customers.length === 0 ? (
            <p className="text-center py-6 text-gray-500">
              {search || status || plan ? "No customers match your filters" : "No customers found"}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {customers.map((c) => {
                    const displayName =
                      c.full_name?.trim() ||
                      `${c.first_name || ""} ${c.last_name || ""}`.trim() ||
                      c.email?.split("@")[0] ||
                      "Unnamed";

                    const initial = displayName[0]?.toUpperCase() || "U";

                    return (
                      <TableRow key={c.id}>
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
                          <Badge variant={c.plan ? "default" : "secondary"}>
                            {c.plan || "N/A"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={
                              c.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : c.status === "Suspended"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }
                          >
                            {c.status || "Unknown"}
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
                              title="Send Email"
                            >
                              <Mail className="w-4 h-4" />
                            </Button>

                            {/* Suspend / Activate */}
                            {c.status === "Active" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => suspendCustomer(c.id)}
                                title="Suspend Customer"
                              >
                                <ShieldOff className="w-4 h-4 text-red-500" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => activateCustomer(c.id)}
                                title="Activate Customer"
                              >
                                <ShieldCheck className="w-4 h-4 text-green-500" />
                              </Button>
                            )}

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteCustomer(c.id)}
                              title="Delete Customer"
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-4">
                  <Button
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>

                  <span className="text-gray-600">
                    Page {page} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* EMAIL MODAL */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Send Email to {selectedCustomer?.email}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Email subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />

            <Textarea
              placeholder="Write your message..."
              value={emailMessage}
              onChange={(e) => setEmailMessage(e.target.value)}
              rows={6}
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailSubject("");
                  setEmailMessage("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#bf2026] text-white"
                onClick={sendEmail}
                disabled={!emailSubject.trim() || !emailMessage.trim()}
              >
                Send Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}