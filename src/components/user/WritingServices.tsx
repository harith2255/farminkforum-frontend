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
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
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
  ChevronRight,
  X,
  Download,
  Star,
  Copy,
  Eye,
  Trash2,
  Menu,
  File,
  EyeIcon,
} from "lucide-react";
import { toast } from "sonner";
import * as React from "react";

// --- TYPES ---
interface Order {
  id: string;
  title: string;
  type: string;
  academic_level?: string;
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
  final_text?: string;
  notes_url?: string;
  attachments_url?: string;
  pages?: number;
  subject_area?: string;
  instructions?: string;
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

interface InterviewMaterial {
  id: string;
  title: string;
  category: string;
  file_url: string;
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
  onNavigate?: (page: string, id?: string) => void;
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

// ✅ ADDED: Header functions defined outside component
const getJsonHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

// --- RENDER LOADING SPINNER ---
const renderSpinner = (text: string = "Loading...") => (
  <div className="flex justify-center items-center py-12">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a] mb-3"></div>
      <p className="text-gray-500">{text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
export function WritingServices({ onNavigate }: WritingServicesProps) {
  // State Management
  const [services, setServices] = useState<Service[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState({
    initial: true,
    services: false,
    activeOrders: false,
    completedOrders: false,
    submitting: false,
    editing: false,
    sendingMessage: false,
    uploading: false,
    cancelling: false,
    rating: false,
  });

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

  // Mobile Tabs State
  const [mobileTabOpen, setMobileTabOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("new-order");

  // Interview Preparation State
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingMaterial, setViewingMaterial] = useState<string | null>(null);
const [interviewMaterials, setInterviewMaterials] = useState<InterviewMaterial[]>([]);

  // Form Handlers
  const updateForm = (key: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  // Clear Form Function
  const clearForm = useCallback(() => {
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Form cleared");
  }, []);

  // Validation
  const validateStep = useCallback((stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return !!(formData.type && formData.academic_level && formData.title && formData.subject_area && formData.pages && formData.deadline);
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
      setLoading(prev => ({ ...prev, services: true }));
      const res = await fetch(`${API_BASE_URL}/services`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (err) {
      handleApiError(err, "Failed to load services");
    } finally {
      setLoading(prev => ({ ...prev, services: false }));
    }
  }, [handleApiError]);

  const fetchActiveOrders = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, activeOrders: true }));
      const res = await fetch(`${API_BASE_URL}/orders/active`, {
        method: "GET",
        headers: getJsonHeaders(),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setActiveOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      handleApiError(err, "Failed to load active orders");
    } finally {
      setLoading(prev => ({ ...prev, activeOrders: false }));
    }
  }, [handleApiError]);

  const fetchCompletedOrders = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, completedOrders: true }));
      const res = await fetch(`${API_BASE_URL}/orders/completed`, {
        method: "GET",
        headers: getJsonHeaders(),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCompletedOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      handleApiError(err, "Failed to load completed orders");
    } finally {
      setLoading(prev => ({ ...prev, completedOrders: false }));
    }
  }, [handleApiError]);

  // Interview Preparation Functions
  const handleViewMaterial = useCallback((material: InterviewMaterial) => {
    setViewingMaterial(material.id);
    
    try {
      // Open PDF in new tab
      window.open(material.file_url, '_blank');
      
      toast.success(`Opening: ${material.title}`);
      
    } catch (err) {
      toast.error("Failed to open material");
    } finally {
      setViewingMaterial(null);
    }
  }, []);
const fetchInterviewMaterials = useCallback(async () => {
  try {
    setLoading(prev => ({ ...prev, services: true }));

    const params = new URLSearchParams();

    if (selectedCategory && selectedCategory !== "All") {
      params.append("category", selectedCategory);
    }

    if (searchQuery) {
      params.append("search", searchQuery);
    }

    const res = await fetch(
      `${API_BASE_URL}?${params.toString()}`,
      {
        headers: getAuthHeaders(), // ✅ FIX
      }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    setInterviewMaterials(Array.isArray(data) ? data : []);

  } catch (err) {
    handleApiError(err, "Failed to load interview materials");
  } finally {
    setLoading(prev => ({ ...prev, services: false }));
  }
}, [selectedCategory, searchQuery, handleApiError]);

useEffect(() => {
  if (activeTab === "services") {
    fetchInterviewMaterials();
  }
}, [activeTab, selectedCategory, searchQuery, fetchInterviewMaterials]);


  const filteredMaterials = interviewMaterials;

const categories = useMemo(() => {
  return ["All", ...new Set(interviewMaterials.map(m => m.category))];
}, [interviewMaterials]);


  const handleSubmitOrder = useCallback(async () => {
    if (!validateStep(1)) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(prev => ({ ...prev, submitting: true }));

    try {
      let attachments_url = null;

      // Upload file if exists
      if (selectedFile) {
        const fm = new FormData();
        fm.append("file", selectedFile);

        const uploadRes = await fetch(`${API_BASE_URL}/upload`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: fm,
        });

        const uploadData = await uploadRes.json();
        attachments_url = uploadData.url || null;
      }

      // Prepare order payload
      const orderPayload = {
        ...formData,
        pages: parseInt(formData.pages),
        deadline: formData.deadline || null,
        total_price: calculatePrice(),
        attachments_url,
      };

      // Save temporary order in localStorage
      const tempId = "temp_" + Date.now();
      localStorage.setItem("pendingWritingOrder", JSON.stringify(orderPayload));
      localStorage.setItem("purchaseType", "writing");
      localStorage.setItem("purchaseId", tempId);

      // Clear form
      clearForm();

      // Navigate to payment page
      if (typeof onNavigate === "function") {
        onNavigate("purchase", tempId);
      }

      toast.success("Order prepared for payment!");

    } catch (err) {
      handleApiError(err, "Failed to prepare order for payment");
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  }, [
    formData,
    selectedFile,
    calculatePrice,
    onNavigate,
    handleApiError,
    validateStep,
    clearForm,
  ]);

  const handleCancelOrder = useCallback(async (order: Order) => {
    if (!confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      setLoading(prev => ({ ...prev, cancelling: true }));
      const res = await fetch(`${API_BASE_URL}/orders/${order.id}/cancel`, {
        method: "PUT",
        headers: getJsonHeaders(),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to cancel order");
        return;
      }

      toast.success("Order cancelled successfully");
      fetchActiveOrders();
    } catch (err) {
      handleApiError(err, "Failed to cancel order");
    } finally {
      setLoading(prev => ({ ...prev, cancelling: false }));
    }
  }, [fetchActiveOrders, handleApiError]);

  const handleDownloadDeliverable = useCallback(async (order: Order) => {
    try {
      if (order.final_text) {
        const blob = new Blob([order.final_text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${order.title.replace(/[^a-z0-9]/gi, "_")}_final.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Document downloaded");
        return;
      }

      if (order.notes_url) {
        window.open(order.notes_url, "_blank");
        return;
      }

      toast.error("No deliverable available for this order");
    } catch (err) {
      handleApiError(err, "Failed to download deliverable");
    }
  }, [handleApiError]);

  const handleRateOrder = useCallback(async (order: Order, rating: number) => {
    try {
      setLoading(prev => ({ ...prev, rating: true }));
      const res = await fetch(`${API_BASE_URL}/orders/${order.id}/rate`, {
        method: "PUT",
        headers: getJsonHeaders(),
        body: JSON.stringify({ rating }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to submit rating");
        return;
      }

      toast.success("Rating submitted successfully");
      fetchCompletedOrders();
    } catch (err) {
      handleApiError(err, "Failed to submit rating");
    } finally {
      setLoading(prev => ({ ...prev, rating: false }));
    }
  }, [fetchCompletedOrders, handleApiError]);

  // ... (rest of the existing API functions remain the same)
  const handleUploadAdditionalFiles = useCallback(async (order: Order, files: FileList) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append("files", file);
      });

      const res = await fetch(`${API_BASE_URL}/orders/${order.id}/upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to upload files");
        return;
      }

      toast.success("Files uploaded successfully");
      fetchActiveOrders();
    } catch (err) {
      handleApiError(err, "Failed to upload additional files");
    }
  }, [fetchActiveOrders, handleApiError]);

  const handleRequestRevision = useCallback(async (order: Order, revisionNotes: string) => {
    if (!revisionNotes.trim()) {
      toast.error("Please provide revision notes");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/orders/${order.id}/request-revision`, {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify({
          revision_notes: revisionNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to request revision");
        return;
      }

      toast.success("Revision requested successfully");
      fetchActiveOrders();
    } catch (err) {
      handleApiError(err, "Failed to request revision");
    }
  }, [fetchActiveOrders, handleApiError]);

  const handleExtendDeadline = useCallback(async (order: Order, newDeadline: string, reason: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${order.id}/extend-deadline`, {
        method: "PUT",
        headers: getJsonHeaders(),
        body: JSON.stringify({
          new_deadline: newDeadline,
          reason: reason,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to extend deadline");
        return;
      }

      toast.success("Deadline extension requested");
      fetchActiveOrders();
    } catch (err) {
      handleApiError(err, "Failed to extend deadline");
    }
  }, [fetchActiveOrders, handleApiError]);

  const handleViewOrderDetails = useCallback((order: Order) => {
    toast.info(
      `Order Details:
      Title: ${order.title}
      Type: ${order.type}
      Status: ${order.status}
      Deadline: ${formatDate(order.deadline || "")}
      Writer: ${order.writer_name || "Not assigned yet"}
      Progress: ${order.progress || 0}%`,
      {
        duration: 5000,
      }
    );
  }, []);

  const handleDuplicateOrder = useCallback(async (order: Order) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${order.id}/duplicate`, {
        method: "POST",
        headers: getJsonHeaders(),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to duplicate order");
        return;
      }

      toast.success("Order duplicated successfully");
      
      if (data.new_order_id) {
        fetchActiveOrders();
      }
    } catch (err) {
      handleApiError(err, "Failed to duplicate order");
    }
  }, [fetchActiveOrders, handleApiError]);

  const validateStep1 = useCallback((data: FormData): string | null => {
    if (!data.type) return "Service type is required";
    if (!data.academic_level) return "Academic level is required";
    if (!data.title.trim()) return "Title is required";
    if (!data.subject_area) return "Subject area is required";
    if (!data.pages || parseInt(data.pages) < 1) return "Valid page count is required";
    if (!data.deadline) return "Deadline is required";
    
    const today = new Date();
    const deadline = new Date(data.deadline);
    today.setHours(0, 0, 0, 0);
    if (deadline < today) return "Deadline must be today or in the future";
    
    return null;
  }, []);

  const validateFormData = useCallback((data: FormData): string | null => {
    const step1Error = validateStep1(data);
    if (step1Error) return step1Error;
    
    if (!data.instructions.trim()) return "Instructions are required";
    
    return null;
  }, [validateStep1]);

  const exportOrderData = useCallback((order: Order) => {
    const exportData = {
      title: order.title,
      type: order.type,
      academic_level: order.academic_level,
      subject_area: order.subject_area,
      pages: order.pages,
      deadline: order.deadline,
      status: order.status,
      writer: order.writer_name,
      progress: order.progress,
      created_at: order.created_at,
      completed_at: order.completed_date,
      grade: order.grade,
      rating: order.rating,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order_${order.id}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Order data exported");
  }, []);

  const calculateEstimatedCompletion = useCallback((order: Order): string => {
    if (!order.deadline) return "Not available";
    
    const deadline = new Date(order.deadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    return `Due in ${diffDays} days`;
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedOrder) return;

    try {
      setLoading(prev => ({ ...prev, editing: true }));
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
    } finally {
      setLoading(prev => ({ ...prev, editing: false }));
    }
  }, [selectedOrder, updatedDeadline, additionalNotes, fetchActiveOrders, handleApiError]);

  const handleSubmitFeedback = useCallback(async () => {
    if (!selectedOrder || !feedback.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      setLoading(prev => ({ ...prev, sendingMessage: true }));
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
    } finally {
      setLoading(prev => ({ ...prev, sendingMessage: false }));
    }
  }, [selectedOrder, feedback, handleApiError]);

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

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("File removed");
  }, []);

  // Tab handling
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setMobileTabOpen(false);
  }, []);

  // Get current tab label
  const getCurrentTabLabel = useCallback(() => {
    switch (activeTab) {
      case "new-order":
        return "New Order";
      case "active":
        return `Active Orders (${activeOrders.length})`;
      case "completed":
        return "Completed Orders";
      case "services":
        return "Interview Preparation";
      default:
        return "New Order";
    }
  }, [activeTab, activeOrders.length]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchServices(),
          fetchActiveOrders(),
          fetchCompletedOrders(),
        ]);
      } catch (err) {
        handleApiError(err, "Failed to load data");
      } finally {
        setLoading(prev => ({ ...prev, initial: false }));
      }
    };

    loadData();
  }, [fetchServices, fetchActiveOrders, fetchCompletedOrders, handleApiError]);

  const calculatedPrice = useMemo(() => calculatePrice(), [calculatePrice]);
  const isStepValid = useMemo(() => validateStep(step), [step, validateStep]);

  if (loading.initial) {
    return renderSpinner("Loading writing services...");
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="text-[#1d4d6a] text-xl sm:text-2xl font-bold mb-1">Writing Services</h2>
        <p className="text-sm text-gray-500">
          Professional academic writing assistance from expert writers
        </p>
      </div>

      {/* Mobile Hamburger Tabs */}
      <div className="lg:hidden">
        <div className="relative">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setMobileTabOpen(!mobileTabOpen)}
          >
            <span>{getCurrentTabLabel()}</span>
            <Menu className={`h-4 w-4 transition-transform ${mobileTabOpen ? "rotate-90" : ""}`} />
          </Button>
          
          {mobileTabOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="py-1">
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${activeTab === "new-order" ? "bg-gray-50 text-[#bf2026]" : ""}`}
                  onClick={() => handleTabChange("new-order")}
                >
                  New Order
                </button>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between ${activeTab === "active" ? "bg-gray-50 text-[#bf2026]" : ""}`}
                  onClick={() => handleTabChange("active")}
                >
                  <span>Active Orders ({activeOrders.length})</span>
                  {loading.activeOrders && <Loader2 className="w-3 h-3 animate-spin" />}
                </button>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between ${activeTab === "completed" ? "bg-gray-50 text-[#bf2026]" : ""}`}
                  onClick={() => handleTabChange("completed")}
                >
                  <span>Completed Orders</span>
                  {loading.completedOrders && <Loader2 className="w-3 h-3 animate-spin" />}
                </button>
                <button
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between ${activeTab === "services" ? "bg-gray-50 text-[#bf2026]" : ""}`}
                  onClick={() => handleTabChange("services")}
                >
                  <span>Interview Preparation</span>
                  {loading.services && <Loader2 className="w-3 h-3 animate-spin" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden lg:block">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="new-order">New Order</TabsTrigger>
            <TabsTrigger value="active">
              Active Orders ({activeOrders.length})
              {loading.activeOrders && <Loader2 className="w-3 h-3 ml-2 inline-block animate-spin" />}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed
              {loading.completedOrders && <Loader2 className="w-3 h-3 ml-2 inline-block animate-spin" />}
            </TabsTrigger>
            <TabsTrigger value="services">
              Interview Preparation
              {loading.services && <Loader2 className="w-3 h-3 ml-2 inline-block animate-spin" />}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content based on active tab */}
      <div className="mt-6">
        {activeTab === "new-order" && (
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-[#1d4d6a]">Place a New Order</CardTitle>
              <CardDescription>
                Tell us about your writing needs and we'll match you with an expert
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Type of Service<span className="text-red-500">*</span></Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => updateForm("type", value)}
                          required
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select Service Type" />
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

                      <div>
                        <Label>Academic Level<span className="text-red-500">*</span></Label>
                        <Select
                          value={formData.academic_level}
                          onValueChange={(value) => updateForm("academic_level", value)}
                          required
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select Academic Level" />
                          </SelectTrigger>
                          <SelectContent>
                            {ACADEMIC_LEVELS.map((lvl) => (
                              <SelectItem key={lvl.value} value={lvl.value}>
                                {lvl.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Title<span className="text-red-500">*</span></Label>
                      <Input
                        className="mt-1"
                        placeholder="Enter Title"
                        value={formData.title}
                        onChange={(e) => updateForm("title", e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Subject Area<span className="text-red-500">*</span></Label>
                        <Select
                          value={formData.subject_area}
                          onValueChange={(value) => updateForm("subject_area", value)}
                          required
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select Subject Area" />
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

                      <div>
                        <Label>Pages Required<span className="text-red-500">*</span></Label>
                        <Input
                          type="number"
                          min="1"
                          className="mt-1"
                          placeholder="e.g., 4"
                          value={formData.pages}
                          onChange={(e) => updateForm("pages", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Deadline<span className="text-red-500">*</span></Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          className="mt-1"
                          value={formData.deadline}
                          onChange={(e) => updateForm("deadline", e.target.value)}
                          required
                        />
                        <Calendar className="text-gray-500" size={18} />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={clearForm}
                      >
                        Clear Form
                      </Button>
                      <Button
                        className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white flex items-center justify-center gap-2"
                        onClick={() => {
                          const validationError = validateStep1(formData);
                          if (validationError) {
                            toast.error(validationError);
                            return;
                          }
                          setStep(2);
                        }}
                      >
                        Continue to Details
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ----------------------- STEP 2 ----------------------- */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Label>Detailed Instructions<span className="text-red-500">*</span></Label>
                      <Textarea
                        className="min-h-[150px]"
                        value={formData.instructions}
                        onChange={(e) => updateForm("instructions", e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label>Additional Materials (Optional)</Label>

                      <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${loading.uploading
                            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                            : 'border-gray-300 hover:border-[#bf2026]'
                          }`}
                        onClick={!loading.uploading ? handleUploadBoxClick : undefined}
                      >
                        {loading.uploading ? (
                          <div className="flex flex-col items-center justify-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1d4d6a] mb-2"></div>
                            <p className="text-sm text-gray-600">
                              Uploading... {uploadProgress.toFixed(0)}%
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                              <div
                                className="bg-[#bf2026] h-1.5 rounded-full transition-all"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              PDF, DOC, DOCX up to 10MB
                            </p>

                            {selectedFile && (
                              <div className="mt-4 flex items-center justify-center gap-2">
                                <FileText className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">{selectedFile.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveFile();
                                  }}
                                  className="h-6 w-6 p-0 hover:bg-red-50"
                                >
                                  <X className="w-3 h-3 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={loading.uploading}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setStep(1)}
                        disabled={loading.uploading}
                      >
                        Back
                      </Button>
                      <Button
                        className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white flex items-center justify-center gap-2"
                        onClick={() => {
                          if (!formData.instructions.trim()) {
                            toast.error("Instructions are required");
                            return;
                          }
                          setStep(3);
                        }}
                        disabled={!isStepValid || loading.uploading}
                      >
                        Continue to Review
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ----------------------- STEP 3 ----------------------- */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                      <h4 className="text-[#1d4d6a]">Order Summary</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                          <p className="text-gray-900">{formatDate(formData.deadline)}</p>
                          <p className="text-xs text-gray-500">
                            {calculateEstimatedCompletion({
                              deadline: formData.deadline,
                              id: '',
                              title: '',
                              type: '',
                              status: 'Pending'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#bf2026] bg-opacity-10 border border-[#bf2026] rounded-lg p-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Subtotal</span>
                        <span className="text-gray-900">₹{calculatedPrice - 20}</span>
                      </div>

                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Service Fee</span>
                        <span className="text-gray-900">₹20</span>
                      </div>

                      <div className="border-t border-[#bf2026] my-3 pt-3 flex justify-between items-center">
                        <span className="text-[#1d4d6a] font-semibold">Total</span>
                        <span className="text-[#1d4d6a] font-bold text-lg">₹{calculatedPrice}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setStep(2)}
                        disabled={loading.submitting}
                      >
                        Back
                      </Button>

                      <Button
                        className="flex-1 bg-[#bf2026] hover:bg-[#a01c22] text-white flex items-center justify-center gap-2"
                        onClick={handleSubmitOrder}
                        disabled={loading.submitting}
                      >
                        {loading.submitting ? (
                          <>
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Submitting...
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
        )}

        {activeTab === "active" && (
          <>
            {loading.activeOrders ? (
              renderSpinner("Loading active orders...")
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No active orders. Start a new writing project!
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <Card key={order.id} className="border-none shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[#1d4d6a] text-base sm:text-lg font-semibold">{order.title}</h3>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewOrderDetails(order)}
                                className="h-8 w-8 p-0"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDuplicateOrder(order)}
                                className="h-8 w-8 p-0"
                                title="Duplicate Order"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={getStatusBadgeVariant(order.status)}>
                              {order.status}
                            </Badge>
                            <span className="text-sm text-gray-500">{order.type}</span>
                            {order.academic_level && (
                              <span className="text-sm text-gray-500">• {order.academic_level}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
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
                              <span>Due: {formatDate(order.deadline || "")}</span>
                              <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                                {calculateEstimatedCompletion(order)}
                              </span>
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleProvideFeedback(order)}
                              disabled={loading.sendingMessage}
                              className="flex items-center gap-1"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Message
                            </Button>

                            {order.status === "Pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditOrder(order)}
                                  disabled={loading.editing}
                                  className="flex items-center gap-1"
                                >
                                  <Edit className="w-4 h-4" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelOrder(order)}
                                  disabled={loading.cancelling}
                                  className="text-red-500 hover:text-red-700 border-red-200 hover:bg-red-50 flex items-center gap-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {order.attachments_url && (
                          <div className="text-sm mt-2 flex items-center gap-2">
                            <span className="text-gray-600">Attachments:</span>
                            <a
                              href={order.attachments_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 underline hover:text-blue-700"
                            >
                              View uploaded files
                            </a>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "completed" && (
          <>
            {loading.completedOrders ? (
              renderSpinner("Loading completed orders...")
            ) : completedOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No completed orders yet.
              </div>
            ) : (
              <div className="space-y-4">
                {completedOrders.map((order) => (
                  <Card key={order.id} className="border-none shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-[#1d4d6a] text-base sm:text-lg font-semibold mb-1">{order.title}</h3>
                              <p className="text-sm text-gray-500">
                                {order.type} • Completed {formatDate(order.completed_date || "")}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => exportOrderData(order)}
                                className="h-8 w-8 p-0"
                                title="Export Data"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Badge className="bg-green-100 text-green-700">Completed</Badge>
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 text-sm">
                            <div className="bg-gray-50 rounded-lg px-4 py-2">
                              <p className="text-xs text-gray-500 mb-1">Grade Received</p>
                              <p className="text-[#1d4d6a]">{order.grade || "N/A"}</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg px-4 py-2">
                              <p className="text-xs text-gray-500 mb-1">Your Rating</p>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Button
                                    key={star}
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0"
                                    onClick={() => handleRateOrder(order, star)}
                                    disabled={loading.rating}
                                  >
                                    <Star
                                      className={`w-3 h-3 ${star <= (order.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                    />
                                  </Button>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {(order.final_text || order.notes_url) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadDeliverable(order)}
                                  className="flex items-center gap-1"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </Button>
                              )}

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
            )}
          </>
        )}

        {activeTab === "services" && (
          <div className="space-y-6">
            {/* Simple Materials Display */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-[#1d4d6a]">Interview Preparation Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <div className="relative">
                        <Input
                          placeholder="Search materials..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                        <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Materials Grid - Simple */}
            {filteredMaterials.length === 0 ? (
              <Card className="border-none shadow-md">
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No materials found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your search or filter criteria
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMaterials.map((material) => (
                  <Card key={material.id} className="border-none shadow-md hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <CardTitle className="text-[#1d4d6a] text-base">
                          {material.title}
                        </CardTitle>
                        <Badge variant="outline">{material.category}</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-500">
                          <File className="w-4 h-4 inline mr-1" />
                          PDF Document
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewMaterial(material)}
                          disabled={viewingMaterial === material.id}
                        >
                          {viewingMaterial === material.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Opening...
                            </>
                          ) : (
                            <>
                              <EyeIcon className="w-4 h-4 mr-2" />
                              View
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
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
              className="bg-[#bf2026] hover:bg-[#a01c22] text-white flex items-center justify-center gap-2"
              onClick={handleSaveEdit}
              disabled={loading.editing}
            >
              {loading.editing ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
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
              className="bg-[#bf2026] hover:bg-[#a01c22] text-white flex items-center justify-center gap-2"
              onClick={handleSubmitFeedback}
              disabled={loading.sendingMessage}
            >
              {loading.sendingMessage ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}