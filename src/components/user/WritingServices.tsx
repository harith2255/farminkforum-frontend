// --- IMPORTS ---
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  FileText,
  Upload,
  Calendar,
  Edit,
  MessageSquare,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import * as React from "react";

// --- TYPES ---
interface Order {
  id: string;
  title: string;
  type: string;
  academic_level?: string;  // <-- Add this
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  progress?: number;
  deadline?: string;
  writer_name?: string;
  author_name?: string;
  completed_date?: string;
  grade?: string;
  rating?: number;
  additional_notes?: string;
  total_price?: number;
  created_at?: string;
}


interface Service {
  id: string;
  name: string;
  description: string;
  price?: number;
  turnaround?: string;
  base_price?: number;
  price_per_page?: number;
}

interface FormData {
  type: string;
  academic_level: string;
  title: string;
  subject_area: string;
  pages: string;
  deadline: string;
  instructions: string;
}

interface WritingServicesProps {
  onNavigate?: (page: string) => void;
}

// --- CONSTANTS ---
const API_BASE_URL = "https://ebook-backend-lxce.onrender.com/api/writing";

const ACADEMIC_LEVELS = [
  { value: "high-school", label: "High School" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "masters", label: "Masters" },
  { value: "post-doc", label: "Post Doc" },
  { value: "diploma", label: "Diploma" },
  { value: "pg-diploma", label: "PG Diploma" },
  { value: "others", label: "Others" },
];

const SERVICE_TYPES = [
  { value: "research", label: "Research Paper" },
  { value: "essay", label: "Essay" },
  { value: "dissertation", label: "Dissertation" },
  { value: "thesis", label: "Thesis" },
  { value: "review", label: "Literature Review" },
  { value: "notes", label: "Notes" },
  { value: "references", label: "References" },
  { value: "PPTs", label: "PPTs" },
  { value: "others", label: "Others" },
];

const SUBJECT_AREAS = [
  { value: "agriculture", label: "Agriculture Extension Education" },
  { value: "adult", label: "Adult and Continuing Education and Extension" },
  { value: "education", label: "Education" },
  { value: "sociology", label: "Sociology" },
  { value: "rural-development", label: "Rural Development" },
  { value: "mass-communication-journalism", label: "Mass Communication and Journalism" },
  { value: "agriculture-statistics", label: "Agriculture Statistics" },
  { value: "agricultural-economics", label: "Agricultural Economics" },
  { value: "community-science", label: "Community Science" },
  { value: "agribusiness-management", label: "Agribusiness Management" },
  { value: "agriculture-marketing", label: "Agriculture Marketing" },
  { value: "other-agricultural-sciences", label: "Other Agricultural Sciences" },
  { value: "others", label: "Others" },
];

// --- UTILITY FUNCTIONS ---
const formatDate = (dateString: string): string => {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getDaysUntilDeadline = (deadline: string): number => {
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'bg-green-100 text-green-700';
    case 'In Progress':
      return 'bg-blue-100 text-blue-700';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'Cancelled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// --- MAIN COMPONENT ---
export function WritingServices({ onNavigate }: WritingServicesProps) {
  // State Management
  const [services, setServices] = useState<Service[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    type: "",
    academic_level: "",
    title: "",
    subject_area: "",
    pages: "",
    deadline: "",
    instructions: "",
  });

  // File Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dialog States
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [feedback, setFeedback] = useState("");
  const [updatedDeadline, setUpdatedDeadline] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // API Headers
  const getJsonHeaders = useCallback((): HeadersInit => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const getAuthHeaders = useCallback((): HeadersInit => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
    };
  }, []);

  // Form Handlers
  const updateForm = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Validation
  const validateStep = useCallback((stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return !!(formData.type && formData.academic_level && formData.title && formData.pages);
      case 2:
        return !!(formData.instructions.trim());
      case 3:
        return true;
      default:
        return false;
    }
  }, [formData]);

  const calculatePrice = useCallback((): number => {
    const pages = parseInt(formData.pages) || 0;
    const selectedService = services.find(s => s.name === formData.type);
    
    if (selectedService) {
      const basePrice = selectedService.base_price || 20;
      const pricePerPage = selectedService.price_per_page || 10;
      return basePrice + (pages * pricePerPage);
    }
    
    return pages * 10 + 20; // Default pricing
  }, [formData.pages, formData.type, services]);

  // File Handling
  const handleUploadBoxClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!validTypes.includes(file.type)) {
      return "Please upload PDF, DOC, or DOCX files only";
    }
    
    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }
    
    return null;
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    
    setSelectedFile(file);
    setUploadProgress(0);
  }, [validateFile]);

  // API Functions
  const handleApiError = useCallback((error: any, defaultMessage: string) => {
    console.error(error);
    if (error?.message?.includes('NetworkError') || error?.message?.includes('Failed to fetch')) {
      toast.error("Network error. Please check your connection.");
    } else {
      toast.error(defaultMessage);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/services`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      handleApiError(err, "Failed to load services");
    }
  }, [handleApiError]);

  const fetchActiveOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/active`, {
        method: "GET",
        headers: getJsonHeaders(),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setActiveOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      handleApiError(err, "Failed to load active orders");
    }
  }, [getJsonHeaders, handleApiError]);

  const fetchCompletedOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/completed`, {
        method: "GET",
        headers: getJsonHeaders(),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCompletedOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      handleApiError(err, "Failed to load completed orders");
    }
  }, [getJsonHeaders, handleApiError]);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            resolve(response.url || response.data?.url || null);
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('POST', `${API_BASE_URL}/upload`);
        const token = localStorage.getItem("token");
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formData);
      });
    } catch (err) {
      handleApiError(err, "File upload failed");
      return null;
    }
  }, [handleApiError]);

  const handleSubmitOrder = useCallback(async () => {
    if (!validateStep(1)) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    
    try {
      // Upload file if selected
      let attachments_url = null;
      if (selectedFile) {
        attachments_url = await uploadFile(selectedFile);
        if (!attachments_url) {
          setSubmitting(false);
          return;
        }
      }

      // Prepare order payload
      const payload = {
        ...formData,
        pages: parseInt(formData.pages),
        deadline: formData.deadline || null,
        total_price: calculatePrice(),
        attachments_url,
      };

      const res = await fetch(`${API_BASE_URL}/order`, {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to place order");
        return;
      }

      toast.success("Order placed successfully!");

      // Reset form
      setFormData({
        type: "",
        academic_level: "",
        title: "",
        subject_area: "",
        pages: "",
        deadline: "",
        instructions: "",
      });
      setSelectedFile(null);
      setUploadProgress(0);
      setStep(1);

      // Refresh orders
      await fetchActiveOrders();

      // Redirect to purchase page
      if (data.order && data.order.id) {
        window.history.pushState({}, "", `/purchase/${data.order.id}`);
        if (typeof onNavigate === "function") onNavigate("purchase");
      }
    } catch (err) {
      handleApiError(err, "Failed to place the order");
    } finally {
      setSubmitting(false);
    }
  }, [
    formData, 
    selectedFile, 
    calculatePrice, 
    getJsonHeaders, 
    fetchActiveOrders, 
    onNavigate, 
    handleApiError, 
    uploadFile, 
    validateStep
  ]);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedOrder) return;

    try {
      const res = await fetch(`${API_BASE_URL}/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: getJsonHeaders(),
        body: JSON.stringify({
          deadline: updatedDeadline,
          additional_notes: additionalNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to update order");
        return;
      }

      toast.success("Order updated & writer notified!");
      setIsEditDialogOpen(false);
      fetchActiveOrders();
    } catch (err) {
      handleApiError(err, "Failed to save changes");
    }
  }, [selectedOrder, updatedDeadline, additionalNotes, getJsonHeaders, fetchActiveOrders, handleApiError]);

  const handleSubmitFeedback = useCallback(async () => {
    if (!selectedOrder || !feedback.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify({
          order_id: selectedOrder.id,
          writer_name: selectedOrder.writer_name || selectedOrder.author_name || "Writer",
          message: feedback,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to send message");
        return;
      }

      toast.success("Message sent!");
      setIsFeedbackDialogOpen(false);
      setFeedback("");
    } catch (err) {
      handleApiError(err, "Failed to send message");
    }
  }, [selectedOrder, feedback, getJsonHeaders, handleApiError]);

  // Dialog Handlers
  const handleEditOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setUpdatedDeadline(order.deadline || "");
    setAdditionalNotes(order.additional_notes || "");
    setIsEditDialogOpen(true);
  }, []);

  const handleProvideFeedback = useCallback((order: Order) => {
    setSelectedOrder(order);
    setFeedback("");
    setIsFeedbackDialogOpen(true);
  }, []);

  // Effects
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchServices(),
          fetchActiveOrders(),
          fetchCompletedOrders(),
        ]);
      } catch (err) {
        handleApiError(err, "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchServices, fetchActiveOrders, fetchCompletedOrders, handleApiError]);

  // Memoized Values
  const calculatedPrice = useMemo(() => calculatePrice(), [calculatePrice]);
  const isStepValid = useMemo(() => validateStep(step), [step, validateStep]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#bf2026]" />
          <p className="mt-2 text-gray-600">Loading writing services...</p>
        </div>
      </div>
    );
  }
// UI STARTS (UNCHANGED layout-wise)
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1">Writing Services</h2>
        <p className="text-sm text-gray-500">
          Professional academic writing assistance from expert writers
        </p>
      </div>

      <Tabs defaultValue="new-order" className="w-full">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="new-order">New Order</TabsTrigger>
          <TabsTrigger value="active">
            Active Orders ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        {/* ----------------------- NEW ORDER ----------------------- */}
        <TabsContent value="new-order" className="mt-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Place a New Order</CardTitle>
              <CardDescription>
                Tell us about your writing needs and we'll match you with an
                expert
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-6">
                {/* STEP PROGRESS */}
                <div className="flex items-center justify-between mb-8">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center 
                        ${step >= s ? "bg-[#bf2026] text-white" : "bg-gray-200 text-gray-500"}`}
                      >
                        {s}
                      </div>
                      {s < 3 && (
                        <div
                          className={`flex-1 h-1 mx-2 
                          ${step > s ? "bg-[#bf2026]" : "bg-gray-200"}`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* ----------------------- STEP 1 ----------------------- */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Service Type */}
                      <div>
                        <Label>Service Type</Label>
                        <Select onValueChange={(v) => updateForm("type", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((srv) => (
                              <SelectItem key={srv.id} value={srv.name}>
  {srv.name}
</SelectItem>

                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Academic Level */}
                      <div>
                        <Label>Academic Level</Label>
                        <Select
                          onValueChange={(v) => updateForm("academic_level", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high-school">High School</SelectItem>
                            <SelectItem value="undergraduate">
                              Undergraduate
                            </SelectItem>
                            <SelectItem value="masters">Master's</SelectItem>
                            <SelectItem value="phd">PhD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <Label>Topic/Title</Label>
                      <Input
                        placeholder="Enter your topic or title"
                        value={formData.title}
                        onChange={(e) => updateForm("title", e.target.value)}
                      />
                    </div>

                    {/* Subject Area */}
                    <div>
                      <Label>Subject Area</Label>
                      <Select
                        onValueChange={(v) => updateForm("subject_area", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="science">Natural Sciences</SelectItem>
                          <SelectItem value="social">Social Sciences</SelectItem>
                          <SelectItem value="humanities">Humanities</SelectItem>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Pages */}
                      <div>
                        <Label>Number of Pages</Label>
                        <Input
                          type="number"
                          value={formData.pages}
                          onChange={(e) => updateForm("pages", e.target.value)}
                        />
                      </div>

                      {/* Deadline */}
                      <div>
                        <Label>Deadline</Label>
                        <Input
                          type="date"
                          value={formData.deadline}
                          onChange={(e) => updateForm("deadline", e.target.value)}
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white"
                      onClick={() => setStep(2)}
                    >
                      Continue to Details
                    </Button>
                  </div>
                )}

                {/* ----------------------- STEP 2 ----------------------- */}
                {step === 2 && (
                  <div className="space-y-4">
                    {/* Instructions */}
                    <div>
                      <Label>Detailed Instructions</Label>
                      <Textarea
                        className="min-h-[150px]"
                        value={formData.instructions}
                        onChange={(e) => updateForm("instructions", e.target.value)}
                      />
                    </div>

  

                    {/* Optional Upload */}
                    <div>
                      <Label>Additional Materials (Optional)</Label>

                      {/* dashed box (clickable) - triggers hidden input */}
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#bf2026] transition-colors cursor-pointer"
                        onClick={handleUploadBoxClick}
                      >
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PDF, DOC, DOCX up to 10MB
                        </p>

                        {/* show filename small, no layout change */}
                        {selectedFile && (
                          <p className="text-xs text-gray-600 mt-2">
                            Selected: {selectedFile.name}
                          </p>
                        )}
                      </div>

                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button
                        className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white"
                        onClick={() => setStep(3)}
                      >
                        Continue to Review
                      </Button>
                    </div>
                  </div>
                )}

                {/* ----------------------- STEP 3 ----------------------- */}
                {step === 3 && (
                  <div className="space-y-4">
                    {/* SUMMARY BOX */}
                    <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                      <h4 className="text-[#1d4d6a]">Order Summary</h4>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Service Type</p>
                          <p className="text-gray-900">{formData.type}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Academic Level</p>
                          <p className="text-gray-900">{formData.academic_level}</p>
                        </div>

                        <div>
                          <p className="text-gray-500">Pages</p>
                          <p className="text-gray-900">{formData.pages} pages</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Deadline</p>
                          <p className="text-gray-900">{formData.deadline}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#bf2026] bg-opacity-10 border border-[#bf2026] rounded-lg p-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Subtotal</span>
                        <span className="text-gray-900">₹{formData.pages * 10}</span>
                      </div>

                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Service Fee</span>
                        <span className="text-gray-900">₹20</span>
                      </div>

                      <div className="border-t border-[#bf2026] my-3 pt-3 flex justify-between items-center">
                        <span className="text-[#1d4d6a]">Total</span>
                        <span className="text-[#1d4d6a]">₹{formData.pages * 10 + 20}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                        Back
                      </Button>

                      <Button
                        className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white"
                        onClick={handleSubmitOrder}
                      >
                        Submit Order & Pay
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----------------------- ACTIVE ORDERS ----------------------- */}
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

                    <Badge
                      className={
                        order.status === "In Progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {/* PROGRESS BAR */}
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Progress</span>
                      <span>{order.progress || 0}%</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#bf2026] h-2 rounded-full transition-all"
                        style={{ width: `${order.progress || 0}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {order.writer_name || "Assigned Writer"}
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

                        {/* only allow editing when Pending (keeps parity with backend) */}
                        {order.status === "Pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* show uploaded attachment if any */}
                    {order.attachments_url && (
                      <div className="text-sm mt-2">
                        <a
                          href={order.attachments_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline"
                        >
                          View your uploaded attachment
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ----------------------- COMPLETED ORDERS ----------------------- */}
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
                          <p className="text-sm text-gray-500">
                            {order.type} • Completed{" "}
                            {new Date(order.completed_at).toLocaleDateString()}
                          </p>
                        </div>

                        <Badge className="bg-green-100 text-green-700">Completed</Badge>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="bg-gray-50 rounded-lg px-4 py-2">
                          <p className="text-xs text-gray-500 mb-1">Grade Received</p>
                          <p className="text-[#1d4d6a]">{order.grade || "N/A"}</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg px-4 py-2">
                          <p className="text-xs text-gray-500 mb-1">Your Rating</p>
                          <p className="text-yellow-500">
                            {"⭐".repeat(order.rating || 0)}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Show final written text */}
                          {order.final_text && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const blob = new Blob([order.final_text], {
                                  type: "text/plain",
                                });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `${order.title}-final.txt`;
                                a.click();
                              }}
                            >
                              View Text
                            </Button>
                          )}

                          {/* Show file download button */}
                          {order.notes_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(order.notes_url, "_blank")}
                            >
                              Download File
                            </Button>
                          )}

                          {/* If both missing */}
                          {!order.final_text && !order.notes_url && (
                            <p className="text-xs text-gray-500">No delivered content yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ----------------------- SERVICES ----------------------- */}
        <TabsContent value="services" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <Card
                key={service.id}
                className="border-none shadow-md hover:shadow-lg transition-all"
              >
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

                    <div className="text-[#bf2026]">
                      {service.price ? `₹${service.price}` : "Starting ₹49"}
                    </div>
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

      {/* ----------------------- EDIT DIALOG ----------------------- */}
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
                    type="date"
                    value={updatedDeadline}
                    onChange={(e) => setUpdatedDeadline(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Additional Instructions</Label>
                  <Textarea
                    placeholder="Add any additional instructions or changes..."
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
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
              className="bg-[#bf2026] hover:bg-[#a01c22] text-white"
              onClick={handleSaveEdit}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----------------------- FEEDBACK DIALOG ----------------------- */}
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
                  <p className="text-[#1d4d6a]">
                    {selectedOrder.writer_name || "Assigned Writer"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Working on: {selectedOrder.title}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Your Message</Label>
                  <Textarea
                    rows={6}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Type your message..."
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
              className="bg-[#bf2026] hover:bg-[#a01c22] text-white"
              onClick={handleSubmitFeedback}
            >
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}