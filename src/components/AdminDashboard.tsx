import React,{lazy, useEffect, useRef, useState, Suspense } from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Shield,
  CreditCard,
  FileText,
  Grid,
  Bell,
  Settings,
  LogOut,
  Clock,
  Calendar,
  Menu,
  Crown,
  Briefcase,
  X,
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar } from './ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const AdminDashboardHome = lazy(() => import("./admin/AdminDashboardHome"));
const CustomerManagement = lazy(() => import("./admin/CustomerManagement"));
const ContentManagementGrid = lazy(() => import("./admin/ContentManagement"));
const DRMControls = lazy(() => import("./admin/DRMControls"));
const ExamFolderSystem = lazy(() => import("./admin/Exams"));
const WritingService = lazy(() => import("./admin/WritingService"));
const PaymentsAdmin = lazy(() => import("./admin/PaymentsAdmin"));
const PYQSection = lazy(() => import("./admin/pyqs"));
const AdminCurrentAffairs = lazy(() => import("./admin/AdminCurrentAffairs"));
const ReportsAnalytics = lazy(() => import("./admin/ReportsAnalytics"));
const AIAutomation = lazy(() => import("./admin/AIAutomation"));
const NotificationsAdmin = lazy(() => import("./admin/NotificationsAdmin"));
const JobPortalAdmin = lazy(() => import("./admin/JobPortalAdmin"));
const SystemSettings = lazy(() => import("./admin/SystemSettings"));

interface AdminDashboardProps {
  activeSection?: string | null;
  onNavigate: (page: string, param?: any) => void;
  onLogout: () => void;
}

type AdminSection =
  | 'dashboard'
  | 'customers'
  | 'content'
  | 'exams'
  | 'pyqs'
  | 'currentaffairs'
  | 'drm'
  | 'writing'
  | 'payments'
  | 'reports'
  | 'ai'
  | 'notifications'
  | 'notificationview'
  | 'jobs'
  | 'settings';

export default function AdminDashboard({ activeSection: activeSectionProp, onNavigate, onLogout }: AdminDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [writingNotification, setWritingNotification] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Retrieve actual user info from localStorage
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const fullName = user?.full_name || "Admin";
  const userEmail = user?.email || "admin@farminkforum.com";
  const initials = fullName.substring(0, 2).toUpperCase();

  const menuItems = [
    { id: 'dashboard' as AdminSection, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'customers' as AdminSection, icon: Users, label: 'Customers' },
    { id: 'content' as AdminSection, icon: BookOpen, label: 'Study Materials' },
    { id: 'exams' as AdminSection, icon: Crown, label: 'Exams' },
    { id: 'pyqs' as AdminSection, icon: Clock, label: 'PYQs' },
    { id: 'currentaffairs' as AdminSection, icon: Calendar, label: 'Current Affairs' },
    { id: 'drm' as AdminSection, icon: Shield, label: 'DRM Controls' },
    { id: 'writing' as AdminSection, icon: Grid, label: 'Services' },
    { id: 'payments' as AdminSection, icon: CreditCard, label: 'Payments' },
    { id: 'reports' as AdminSection, icon: FileText, label: 'Reports' },
    // { id: 'ai' as AdminSection, icon: Cpu, label: 'AI Automation' },
    { id: 'notifications' as AdminSection, icon: Bell, label: 'Notifications' },
    { id: 'jobs' as AdminSection, icon: Briefcase, label: 'Job Portal' },
    { id: 'settings' as AdminSection, icon: Settings, label: 'Settings' },
  ];

  const getInitialSection = (): AdminSection => {
    const path = window.location.pathname;
    const section = path.split("/").pop();
    
    const validSections: AdminSection[] = [
      "dashboard",
      "customers",
      "content",
      "exams",
      "pyqs",
      "currentaffairs",
      "drm",
      "writing",
      "payments",
      "reports",
      "ai",
      "notifications",
      "jobs",
      "settings",
    ];
    
    return validSections.includes(section as AdminSection) 
      ? section as AdminSection 
      : "dashboard";
  };

  const [activeSection, setActiveSection] = useState<AdminSection>(getInitialSection);

  // Sync activeSection with prop from App.tsx (for back/forward buttons)
  useEffect(() => {
    if (activeSectionProp) {
      setActiveSection(activeSectionProp as AdminSection);
    }
  }, [activeSectionProp]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close dropdown if clicked outside
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      
      // Close avatar menu if clicked outside
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setAvatarOpen(false);
      }
      
      // Close sidebar on mobile if clicked outside
      const isMobile = window.innerWidth < 1024;
      if (isMobile && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node) &&
          !(event.target as HTMLElement).closest('[data-menu-toggle]')) {
        setSidebarOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false); // Always close mobile sidebar on desktop
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleMenuToggle = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section);
    onNavigate("admin-dashboard", section);
    
    if (section === "writing") {
      setWritingNotification(false);
    }
    
    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f8] flex">
      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        id="sidebar"
        className={`
          fixed z-50 top-0 left-0 h-full bg-[#1d4d6a] text-white flex flex-col 
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 lg:static lg:w-auto
        `}
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden absolute top-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 border-b border-[#2a5f7f] flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md flex items-center justify-center shadow-lg">
            <img 
              src="/logooutline.png" 
              alt="Logo" 
              className="w-10 h-10 object-contain drop-shadow-xl" 
            />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col items-center leading-tight text-center mt-2">
              <span className="text-white font-semibold text-lg tracking-wide">Admin Panel</span>
              <p className="text-xs text-gray-300">FarmInk Forum</p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scroll-smooth 
          [&::-webkit-scrollbar]:w-2 
          [&::-webkit-scrollbar-track]:bg-transparent 
          [&::-webkit-scrollbar-thumb]:bg-white/20
          hover:[&::-webkit-scrollbar-thumb]:bg-white/30">
          <nav className="p-4">
            <TooltipProvider>
              {menuItems.map((item) => (
                <Tooltip key={item.id} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleSectionChange(item.id)}
                      className={`
                        w-full flex items-center 
                        ${sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'} 
                        rounded-lg mb-1 transition-all group 
                        ${activeSection === item.id
                          ? 'bg-[#bf2026] text-white shadow-lg shadow-[#bf2026]/20'
                          : 'text-gray-300 hover:bg-[#2a5f7f] hover:text-white'
                        }
                      `}
                    >
                      <div className="relative">
                        <item.icon
                          className={`
                            transition-all duration-200 
                            ${sidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5'} 
                            ${activeSection === item.id ? 'text-white' : 'group-hover:text-[#bf2026]'}
                          `}
                        />
                        {item.id === "writing" && writingNotification && (
                          <>
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full animate-ping" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full" />
                          </>
                        )}
                      </div>
                      {!sidebarCollapsed && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                    </button>
                  </TooltipTrigger>
                  {sidebarCollapsed && (
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </TooltipProvider>
          </nav>
        </div>

        <div className="p-4 border-t border-[#2a5f7f] sticky bottom-0 bg-[#1d4d6a]">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#2a5f7f] hover:text-white transition-all"
            title={sidebarCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && (
              <span className="text-sm font-medium">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`
        flex-1 transition-all duration-300 
        ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
      `}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
              <Button 
                data-menu-toggle
                onClick={handleMenuToggle} 
                variant="ghost" 
                size="sm" 
                className="inline-flex shrink-0"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-semibold text-[#1d4d6a] mb-0.5 truncate max-w-[140px] sm:max-w-none">
                  {menuItems.find((item) => item.id === activeSection)?.label}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500">Manage your platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              {/* <div className="relative hidden sm:block w-40 md:w-64 lg:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-none focus:ring-2 focus:ring-[#bf2026] focus:outline-none"
                />
              </div> */}
              
              <div className="relative" ref={avatarRef}>
                <button
                  className="relative p-1 rounded-full transition-all duration-300 hover:bg-gray-100/60 hover:shadow-md"
                  onClick={() => setAvatarOpen(!avatarOpen)}
                >
                  <Avatar className="w-9 h-9 bg-gradient-to-br from-[#1d4d6a] to-[#16384e] text-white flex items-center justify-center font-semibold tracking-wide rounded-xl shadow-sm">
                    {initials}
                  </Avatar>
                </button>

                {avatarOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-xl border border-gray-100 z-50">
                    <div className="p-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-800">{fullName}</p>
                      <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                    </div>
                    <div className="py-1">
                      <button
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          handleSectionChange('settings');
                          setAvatarOpen(false);
                        }}
                      >
                        <Settings className="w-4 h-4" /> Settings
                      </button>
                      <button
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          onLogout();
                          setAvatarOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Suspense fallback={null}>
          {activeSection === 'dashboard' && <AdminDashboardHome />}
          {activeSection === 'customers' && <CustomerManagement />}
          {activeSection === 'content' && <ContentManagementGrid />}
          {activeSection === 'exams' && <ExamFolderSystem />}
          {activeSection === 'pyqs' && <PYQSection />}
          {activeSection === 'currentaffairs' && <AdminCurrentAffairs />}
          {activeSection === 'drm' && <DRMControls />}
          {activeSection === 'writing' && <WritingService />}
          {activeSection === 'payments' && <PaymentsAdmin />}
          {activeSection === 'reports' && <ReportsAnalytics />}
          {/* {activeSection === 'ai' && <AIAutomation />} */}
          {activeSection === 'notifications' && <NotificationsAdmin />}
          {activeSection === 'jobs' && <JobPortalAdmin />}
          {activeSection === 'settings' && <SystemSettings />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}