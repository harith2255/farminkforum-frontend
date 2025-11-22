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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[#1d4d6a] mb-1 text-2xl font-bold">Writing Services</h2>
        <p className="text-sm text-gray-600">Professional academic writing assistance from expert writers</p>
      </div>

      <Tabs defaultValue="new-order" className="w-full">
        <TabsList className="bg-white border border-gray-200 grid grid-cols-4">
          <TabsTrigger value="new-order" className="data-[state=active]:bg-[#1d4d6a] data-[state=active]:text-white">
            New Order
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-[#1d4d6a] data-[state=active]:text-white">
            Active Orders ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-[#1d4d6a] data-[state=active]:text-white">
            Completed ({completedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="services" className="data-[state=active]:bg-[#1d4d6a] data-[state=active]:text-white">
            Services ({services.length})
          </TabsTrigger>
        </TabsList>

        {/* New Order Tab */}
        <TabsContent value="new-order" className="mt-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#1d4d6a] to-[#2c6c8f] text-white rounded-t-lg">
              <CardTitle className="text-white">Place a New Order</CardTitle>
              <CardDescription className="text-blue-100">
                Tell us about your writing needs and we'll match you with an expert
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        step >= s 
                          ? 'bg-[#bf2026] border-[#bf2026] text-white' 
                          : 'bg-white border-gray-300 text-gray-500'
                      }`}>
                        {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                      </div>
                      {s < 3 && (
                        <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-[#bf2026]' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step 1: Basic Info */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="service-type" className="text-sm font-medium">
                          Service Type <span className="text-[#bf2026]">*</span>
                        </Label>
                        <Select 
                          value={formData.type} 
                          onValueChange={(value) => updateForm("type", value)}
                        >
                          <SelectTrigger id="service-type">
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            {SERVICE_TYPES.map((service) => (
                              <SelectItem key={service.value} value={service.value}>
                                {service.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="academic-level" className="text-sm font-medium">
                          Academic Level <span className="text-[#bf2026]">*</span>
                        </Label>
                        <Select 
                          value={formData.academic_level} 
                          onValueChange={(value) => updateForm("academic_level", value)}
                        >
                          <SelectTrigger id="academic-level">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            {ACADEMIC_LEVELS.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium">
                        Topic/Title <span className="text-[#bf2026]">*</span>
                      </Label>
                      <Input 
                        id="title"
                        placeholder="Enter your topic or title" 
                        value={formData.title}
                        onChange={(e) => updateForm("title", e.target.value)}
                        className="focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject-area" className="text-sm font-medium">
                        Subject Area
                      </Label>
                      <Select 
                        value={formData.subject_area}
                        onValueChange={(value) => updateForm("subject_area", value)}
                      >
                        <SelectTrigger id="subject-area">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECT_AREAS.map((subject) => (
                            <SelectItem key={subject.value} value={subject.value}>
                              {subject.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="pages" className="text-sm font-medium">
                          Number of Pages <span className="text-[#bf2026]">*</span>
                        </Label>
                        <Input 
                          id="pages"
                          type="number" 
                          placeholder="10" 
                          value={formData.pages}
                          onChange={(e) => updateForm("pages", e.target.value)}
                          min="1"
                          className="focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="deadline" className="text-sm font-medium">
                          Deadline
                        </Label>
                        <Input 
                          id="deadline"
                          type="date" 
                          value={formData.deadline}
                          onChange={(e) => updateForm("deadline", e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent"
                        />
                        {formData.deadline && (
                          <p className="text-xs text-gray-500">
                            {getDaysUntilDeadline(formData.deadline)} days remaining
                          </p>
                        )}
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white py-3 text-lg font-semibold transition-all duration-200 transform hover:scale-[1.02]"
                      onClick={() => setStep(2)}
                      disabled={!isStepValid}
                    >
                      Continue to Details
                    </Button>
                  </div>
                )}

                {/* Step 2: Requirements */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="instructions" className="text-sm font-medium">
                        Detailed Instructions <span className="text-[#bf2026]">*</span>
                      </Label>
                      <Textarea
                        id="instructions"
                        placeholder="Provide detailed instructions for your assignment..."
                        className="min-h-[200px] focus:ring-2 focus:ring-[#1d4d6a] focus:border-transparent"
                        value={formData.instructions}
                        onChange={(e) => updateForm("instructions", e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Be specific about requirements, formatting, citations, and any special instructions.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Additional Materials (Optional)
                      </Label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                      />
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#bf2026] transition-all duration-200 cursor-pointer bg-gray-50 hover:bg-gray-100"
                        onClick={handleUploadBoxClick}
                      >
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg text-gray-600 mb-2">
                          {selectedFile ? (
                            <span className="text-[#1d4d6a] font-semibold">{selectedFile.name}</span>
                          ) : (
                            "Click to upload or drag and drop"
                          )}
                        </p>
                        <p className="text-sm text-gray-400">
                          PDF, DOC, DOCX up to 10MB
                        </p>
                        
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-[#bf2026] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Uploading... {Math.round(uploadProgress)}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button 
                        variant="outline" 
                        className="flex-1 py-3 border-2"
                        onClick={() => setStep(1)}
                      >
                        Back
                      </Button>
                      <Button 
                        className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white py-3 text-lg font-semibold transition-all duration-200 transform hover:scale-[1.02]"
                        onClick={() => setStep(3)}
                        disabled={!isStepValid}
                      >
                        Continue to Review
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Submit */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 space-y-4 border border-gray-200">
                      <h4 className="text-[#1d4d6a] font-bold text-lg border-b pb-2">Order Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-3">
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide">Service Type</p>
                            <p className="text-gray-900 font-semibold">{formData.type || "Not specified"}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide">Academic Level</p>
                            <p className="text-gray-900 font-semibold">{formData.academic_level || "Not specified"}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide">Pages</p>
                            <p className="text-gray-900 font-semibold">{formData.pages || "0"} pages</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide">Deadline</p>
                            <p className="text-gray-900 font-semibold">{formatDate(formData.deadline)}</p>
                          </div>
                          {formData.subject_area && (
                            <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wide">Subject Area</p>
                              <p className="text-gray-900 font-semibold">{formData.subject_area}</p>
                            </div>
                          )}
                          {selectedFile && (
                            <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wide">Attached File</p>
                              <p className="text-gray-900 font-semibold truncate">{selectedFile.name}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {formData.instructions && (
                        <div className="pt-4 border-t">
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Instructions Preview</p>
                          <p className="text-gray-700 text-sm line-clamp-3">{formData.instructions}</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-gradient-to-r from-[#bf2026] to-[#d92b2f] rounded-xl p-6 text-white">
                      <h5 className="font-bold text-lg mb-4">Payment Summary</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Subtotal ({formData.pages || 0} pages)</span>
                          <span>₹{((parseInt(formData.pages) || 0) * 10).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Service Fee</span>
                          <span>₹20.00</span>
                        </div>
                        <div className="border-t border-white/30 my-3 pt-3 flex justify-between items-center text-lg font-bold">
                          <span>Total Amount</span>
                          <span>₹{calculatedPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button 
                        variant="outline" 
                        className="flex-1 py-3 border-2"
                        onClick={() => setStep(2)}
                      >
                        Back to Details
                      </Button>
                      <Button 
                        className="flex-1 bg-[#1d4d6a] hover:bg-[#15354d] text-white py-3 text-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                        onClick={handleSubmitOrder}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Submit Order & Pay"
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Orders Tab */}
        <TabsContent value="active" className="mt-6">
          <div className="space-y-4">
            {activeOrders.length === 0 ? (
              <Card className="border-none shadow-lg text-center py-12">
                <CardContent>
                  <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Active Orders</h3>
                  <p className="text-gray-500 mb-4">You don't have any active orders at the moment.</p>
                </CardContent>
              </Card>
            ) : (
              activeOrders.map((order) => (
                <Card key={order.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <FileText className="w-5 h-5 text-[#1d4d6a] mt-1 flex-shrink-0" />
                          <div>
                            <h3 className="text-[#1d4d6a] font-semibold text-lg mb-1">{order.title}</h3>
                            <p className="text-gray-500 text-sm">{order.type} • {order.academic_level}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Badge className={`${getStatusBadgeVariant(order.status)} text-xs font-medium px-3 py-1`}>
                          {order.status}
                        </Badge>
                        {order.total_price && (
                          <Badge variant="outline" className="text-xs font-medium">
                            ₹{order.total_price}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                          <span>Progress</span>
                          <span>{order.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-[#bf2026] to-[#d92b2f] h-3 rounded-full transition-all duration-500"
                            style={{ width: `${order.progress || 0}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            {order.writer_name || order.author_name || "Writer not assigned"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            Due: {formatDate(order.deadline || "")}
                          </span>
                          {order.deadline && (
                            <span className={`flex items-center gap-1.5 ${
                              getDaysUntilDeadline(order.deadline) < 3 ? 'text-[#bf2026] font-semibold' : ''
                            }`}>
                              <Clock className="w-4 h-4" />
                              {getDaysUntilDeadline(order.deadline)} days left
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleProvideFeedback(order)}
                            className="flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Message
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                            className="flex items-center gap-1.5"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Completed Orders Tab */}
        <TabsContent value="completed" className="mt-6">
          <div className="space-y-4">
            {completedOrders.length === 0 ? (
              <Card className="border-none shadow-lg text-center py-12">
                <CardContent>
                  <CheckCircle2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Completed Orders</h3>
                  <p className="text-gray-500">Your completed orders will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              completedOrders.map((order) => (
                <Card key={order.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                            <div>
                              <h3 className="text-[#1d4d6a] font-semibold text-lg mb-1">{order.title}</h3>
                              <p className="text-gray-500 text-sm">
                                {order.type} • Completed {formatDate(order.completed_date || "")}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Completed</Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 mt-4">
                          {order.grade && (
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg px-4 py-3 border border-green-200">
                              <p className="text-xs text-green-600 font-medium mb-1">Grade Received</p>
                              <p className="text-green-800 font-bold text-lg">{order.grade}</p>
                            </div>
                          )}
                          {order.rating && (
                            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg px-4 py-3 border border-yellow-200">
                              <p className="text-xs text-yellow-600 font-medium mb-1">Your Rating</p>
                              <p className="text-yellow-600 font-semibold">
                                {'★'.repeat(order.rating)}{'☆'.repeat(5 - order.rating)}
                              </p>
                            </div>
                          )}
                          {order.total_price && (
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg px-4 py-3 border border-blue-200">
                              <p className="text-xs text-blue-600 font-medium mb-1">Amount Paid</p>
                              <p className="text-blue-800 font-bold">₹{order.total_price}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 lg:flex-col">
                        <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.length === 0 ? (
              <Card className="border-none shadow-lg col-span-3 text-center py-12">
                <CardContent>
                  <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Services Available</h3>
                  <p className="text-gray-500">Services will be available soon.</p>
                </CardContent>
              </Card>
            ) : (
              services.map((service) => (
                <Card 
                  key={service.id} 
                  className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-1"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-[#1d4d6a] text-lg">{service.name}</CardTitle>
                      {service.price && (
                        <Badge className="bg-[#bf2026] text-white">
                          ₹{service.price}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-gray-600 leading-relaxed">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{service.turnaround || "Flexible deadline"}</span>
                      </div>
                      <div className="text-[#1d4d6a] font-semibold">
                        {service.price ? `₹${service.price}` : "Starting ₹49"}
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white font-semibold transition-all duration-200 transform hover:scale-[1.02]"
                      onClick={() => {
                        updateForm("type", service.name);
                        setStep(1);
                        const newOrderTab = document.querySelector('[value="new-order"]') as HTMLButtonElement;
                        if (newOrderTab) newOrderTab.click();
                      }}
                    >
                      Order Now
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1d4d6a] flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Order
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedOrder && (
              <>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-600 mb-1">Order Title</p>
                  <p className="text-[#1d4d6a] font-semibold">{selectedOrder.title}</p>
                  <p className="text-xs text-gray-500 mt-1">Current Status: {selectedOrder.status}</p>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="edit-deadline" className="text-sm font-medium">
                    Update Deadline
                  </Label>
                  <Input
                    id="edit-deadline"
                    type="date"
                    value={updatedDeadline}
                    onChange={(e) => setUpdatedDeadline(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="focus:ring-2 focus:ring-[#1d4d6a]"
                  />
                  <p className="text-xs text-gray-500">
                    Additional fees may apply for deadline changes
                  </p>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="additional-notes" className="text-sm font-medium">
                    Additional Instructions
                  </Label>
                  <Textarea
                    id="additional-notes"
                    placeholder="Add any additional instructions or changes for the writer..."
                    rows={4}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="focus:ring-2 focus:ring-[#1d4d6a] resize-none"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="border-2"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              className="bg-[#bf2026] hover:bg-[#a01c22] text-white font-semibold"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1d4d6a] flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Message Writer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedOrder && (
              <>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 font-medium mb-1">Writer Information</p>
                  <p className="text-[#1d4d6a] font-semibold">
                    {selectedOrder.writer_name || selectedOrder.author_name || "Assigned Writer"}
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    Working on: {selectedOrder.title}
                  </p>
                  <p className="text-xs text-blue-500">
                    Current Progress: {selectedOrder.progress || 0}%
                  </p>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="feedback-message" className="text-sm font-medium">
                    Your Message <span className="text-[#bf2026]">*</span>
                  </Label>
                  <Textarea
                    id="feedback-message"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Type your message to the writer... Be clear about any questions, concerns, or additional requirements."
                    rows={6}
                    className="focus:ring-2 focus:ring-[#1d4d6a] resize-none"
                  />
                  <p className="text-xs text-gray-500">
                    Your message will be sent directly to the writer working on your order.
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsFeedbackDialogOpen(false)}
              className="border-2"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitFeedback}
              className="bg-[#1d4d6a] hover:bg-[#15354d] text-white font-semibold"
              disabled={!feedback.trim()}
            >
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}