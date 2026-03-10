import { useState,useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import axios from "axios";
import { Navbar } from "./home/NavBar";
import { Footer } from "./home/Footer";
import ExplorePage from "./explore/ExplorePage";
import PricingPage from "./pricing/PricingPage";
import AboutPage from "./about/AboutPage";
import ContactPage from "./contact/ContactPage";
// import PurchasePage from "./PurchasePage";
import ReadNotePage from "./NotesReader";
import * as React from "react";
import { toast } from "sonner";
import { PrivacyPolicy } from "./legal/PrivacyPolicy";
import { TermsOfService } from "./legal/TermsOfService";
import { DRMPolicy } from "./legal/DRMPolicy";

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface PublicPagesProps {
  page:
    | "explore"
    | "pricing"
    | "about"
    | "contact"
    | "login"
    | "register"
    | "purchase"
    | "read_note"
    | "privacy"
    | "terms"
    | "forgot-password"
    | "forgot-password"
    | "drm";

  onNavigate: (page: string) => void;
  onLogin?: (role: "user" | "admin") => void;
}

export function PublicPages({ page, onNavigate, onLogin }: PublicPagesProps) {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navbar onNavigate={onNavigate} />

      {/* Page Content */}
      {page === "explore" && <ExplorePage onNavigate={onNavigate} />}
      {page === "pricing" && <PricingPage onNavigate={onNavigate} isLoggedIn={isLoggedIn} />}
      {page === "about" && <AboutPage />}
      {page === "contact" && <ContactPage />}
      {page === "login" && (
        <LoginPage onNavigate={onNavigate} onLogin={onLogin} />
      )}
      {page === "register" && <RegisterPage onNavigate={onNavigate} />}
      {page === "read_note" && <ReadNotePage onNavigate={onNavigate} />}
      {page === "privacy" && <PrivacyPolicy />}
      {page === "terms" && <TermsOfService />}
      {page === "forgot-password" && <ForgotPasswordPage onNavigate={onNavigate} />}
      {page === "forgot-password" && <ForgotPasswordPage onNavigate={onNavigate} />}
      {page === "drm" && <DRMPolicy />}

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}



export function LoginPage({
  onNavigate,
  onLogin,
}: {
  onNavigate: (page: string) => void;
  onLogin?: (role: "user" | "admin") => void;
}) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  if (params.get("reason") === "suspended") {
    toast.error("Your account has been suspended.");
  }

  if (params.get("reason") === "expired") {
    toast.error("Session expired. Login again.");
  }

  if (params.get("verified") === "true") {
    toast.success("Email verified! You can now log in.");
  }
}, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: formData.email.trim(),
        password: formData.password.trim(),
      });

      const { user, access_token, session_id } = res.data;

      // ✅ Save token
      localStorage.setItem("token", access_token);

      // ✅ Save session id (only if exists)
      if (session_id) {
        localStorage.setItem("current_session_id", session_id);
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: user.id,
          email: user.email,
          role: user.role,
          read_only: user.read_only === true,
        })
      );

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("role", user.role);

      window.dispatchEvent(new Event("authChanged"));

      const isAdmin = user.role === "admin" || user.role === "super_admin";

      onLogin?.(isAdmin ? "admin" : "user");
      onNavigate(isAdmin ? "admin-dashboard" : "user-dashboard");
    } catch (err: any) {
      console.error(err);

      if (err.response?.status === 403 && err.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        toast.error("Email not verified. Please check your inbox.");
        setError("Please verify your email to log in.");
        return;
      }

      if (err.response?.data?.mode === "read_only") {
        toast.error("Your account is suspended. Read-only access enabled.");
        return;
      }

      if (!err.response) {
        setError("Network Error: Backend server is unreachable. Please check your internet or VPN.");
        toast.error("Cannot connect to server. Check your connection.");
        return;
      }

      setError(err.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

    // Handle Enter key press on inputs
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
<div className="min-h-[80vh] flex items-center justify-center py-6 px-4 sm:px-6 bg-[#f5f6f8]">
  <Card className="mt-8 sm:mt-20 w-full max-w-sm sm:max-w-md border-none shadow-lg sm:shadow-xl">
    <CardHeader className="text-center pb-2 px-4 sm:px-6 pt-4 sm:pt-6"> {/* Reduced bottom padding */}
      <CardTitle className="text-[#1d4d6a] text-lg sm:text-xl">
        Welcome Back
      </CardTitle>
      <CardDescription className="text-xs sm:text-sm mt-1"> {/* Added small margin-top */}
        Sign in to access your academic resources
      </CardDescription>
    </CardHeader>

    <CardContent className="px-4 sm:px-6 pt-2 pb-4 sm:pb-6">
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm sm:text-base">Email Address</Label>
          <Input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            className="text-sm sm:text-base"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm sm:text-base">Password</Label>
            <button
              type="button"
              onClick={() => onNavigate("forgot-password")}
              className="text-xs sm:text-sm text-[#bf2026] hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="text-sm sm:text-base pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-xs sm:text-sm font-medium">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white text-sm sm:text-base py-2 sm:py-2.5 font-semibold"
        >
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      <div className="text-center mt-4">
        <p className="text-xs sm:text-sm text-gray-600">
          Don't have an account?{" "}
          <button
            onClick={() => onNavigate("register")}
            className="text-[#bf2026] hover:underline font-medium"
          >
            Sign up free
          </button>
        </p>
      </div>
    </CardContent>
  </Card>
</div>
  );
}

export default function RegisterPage({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    // Frontend Validation
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      setError("All fields are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      await axios.post(
        `${API_BASE_URL}/api/auth/register`,
        payload
      );

      setError("");
      setIsEmailSent(true);
      toast.success("Verification code sent!");
    } catch (err: any) {
      if (!err.response) {
        const netError = "Network Error: Registration server unreachable.";
        setError(netError);
        toast.error(netError);
        return;
      }
      const serverError = err?.response?.data?.error || "Registration failed";
      setError(serverError);
      toast.error(serverError);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    try {
      setVerifying(true);
      setError("");
      await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, {
        email: formData.email.trim().toLowerCase(),
        otp,
      });
      toast.success("Email verified successfully!");
      onNavigate("login");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Invalid OTP");
    } finally {
      setVerifying(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-[#f5f6f8]">
        <Card className="w-full max-w-md border-none shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-[#1d4d6a]">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a 6-digit code to <strong>{formData.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label>Verification Code</Label>
                <div className="flex justify-center">
                  <Input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="text-center text-2xl tracking-[1em] h-14"
                  />
                </div>
              </div>
              
              {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

              <Button
                type="submit"
                disabled={verifying}
                className="w-full bg-[#bf2026] hover:bg-[#a01c22]"
              >
                {verifying ? "Verifying..." : "Verify Code"}
              </Button>
            </form>

            <div className="text-center">
              <button
                onClick={() => setIsEmailSent(false)}
                className="text-sm text-gray-500 hover:underline"
              >
                Oops, I used the wrong email
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-[#f5f6f8]">
  <Card className="mt-8 sm:mt-20 w-full max-w-sm sm:max-w-md border-none shadow-lg sm:shadow-xl">
    <CardHeader className="text-center pb-2 px-4 sm:px-6 pt-4 sm:pt-6"> {/* Reduced bottom padding */}
      <CardTitle className="text-[#1d4d6a] text-lg sm:text-xl">
        Create Your Account
      </CardTitle>
      <CardDescription className="text-xs sm:text-sm mt-1"> {/* Added small margin-top */}
        Join thousands of learners worldwide
      </CardDescription>
    </CardHeader>
    
    <CardContent className="px-4 sm:px-6 pt-2 pb-4 sm:pb-6">
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">First Name</Label>
            <Input
              name="firstName"
              type="text"
              placeholder="John"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="text-sm sm:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Last Name</Label>
            <Input
              name="lastName"
              type="text"
              placeholder="Doe"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm sm:text-base">Email</Label>
          <Input
            name="email"
            type="email"
            placeholder="your@email.com"
            required
            value={formData.email}
            onChange={handleChange}
            className="text-sm sm:text-base"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm sm:text-base">Password</Label>
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={handleChange}
              className="text-sm sm:text-base pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm sm:text-base">Confirm Password</Label>
          <Input
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            className="text-sm sm:text-base"
          />
        </div>

        {error && (
          <p className="text-red-500 text-xs sm:text-sm font-medium">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#bf2026] text-white text-sm sm:text-base py-2 sm:py-2.5 font-semibold transition-all hover:bg-[#a01c22]"
        >
          {loading ? "Creating..." : "Create Account"}
        </Button>
      </form>

      <p className="text-center mt-4 text-xs sm:text-sm text-gray-600">
        Already have an account?{" "}
        <button
          onClick={() => onNavigate("login")}
          className="text-[#bf2026] hover:underline font-medium"
        >
          Sign in
        </button>
      </p>
    </CardContent>
  </Card>
</div>
  );
}

export function ForgotPasswordPage({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      await axios.post(
        `${API_BASE_URL}/api/auth/forgot-password`,
        { email: email.trim() }
      );
      setSuccess(true);
      toast.success("Reset code sent!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setIsResetting(true);
      setError("");
      await axios.post(`${API_BASE_URL}/api/auth/reset-password-otp`, {
        email: email.trim().toLowerCase(),
        otp,
        new_password: newPassword,
      });
      toast.success("Password reset successfully!");
      onNavigate("login");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Invalid code or reset failed");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6 px-4 bg-[#f5f6f8]">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-[#1d4d6a]">
            {success ? "Enter Reset Code" : "Forgot Password?"}
          </CardTitle>
          <CardDescription>
            {success 
              ? `Enter the 6-digit code sent to ${email}`
              : "Enter your email and we'll send you a recovery code."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label>Verification Code</Label>
                <Input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="text-center text-xl tracking-[0.5em]"
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

              <Button
                type="submit"
                disabled={isResetting}
                className="w-full bg-[#bf2026] hover:bg-[#a01c22]"
              >
                {isResetting ? "Resetting..." : "Reset Password"}
              </Button>
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="w-full text-sm text-gray-500 hover:underline"
              >
                Back to email entry
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#bf2026] hover:bg-[#a01c22]"
              >
                {loading ? "Sending Code..." : "Send Recovery Code"}
              </Button>
              <button
                type="button"
                onClick={() => onNavigate("login")}
                className="w-full text-sm text-gray-500 hover:underline"
              >
                Back to Login
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

