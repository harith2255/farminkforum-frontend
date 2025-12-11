import { useState,useEffect } from "react";
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
import { BookOpen } from "lucide-react";
import { Navbar } from "./home/NavBar";
import { Footer } from "./home/Footer";
import ExplorePage from "./explore/ExplorePage";
import PricingPage from "./pricing/PricingPage";
import AboutPage from "./about/AboutPage";
import ContactPage from "./contact/ContactPage";
import PurchasePage from "./PurchasePage";
import ReadNotePage from "./NotesReader";
import * as React from "react";
import {toast} from "sonner"

interface PublicPagesProps {
  page:
    | "explore"
    | "pricing"
    | "about"
    | "contact"
    | "login"
    | "register"
    | "purchase"
    | "read_note";

  onNavigate: (page: string) => void;
  onLogin?: (role: "user" | "admin") => void;
}

export function PublicPages({ page, onNavigate, onLogin }: PublicPagesProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navbar onNavigate={onNavigate} />

      {/* Page Content */}
      <div className="pt-16">
        {page === "explore" && <ExplorePage onNavigate={onNavigate} />}
        {page === "pricing" && <PricingPage onNavigate={onNavigate} />}
        {page === "about" && <AboutPage />}
        {page === "contact" && <ContactPage />}
        {page === "login" && (
          <LoginPage onNavigate={onNavigate} onLogin={onLogin} />
        )}
        {page === "register" && <RegisterPage onNavigate={onNavigate} />}
        {page === "read_note" && <ReadNotePage onNavigate={onNavigate} />}
      </div>

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

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  if (params.get("reason") === "suspended") {
    toast.error("Your account has been suspended.");
  }

  if (params.get("reason") === "expired") {
    toast.error("Session expired. Login again.");
  }
}, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        "https://ebook-backend-lxce.onrender.com/api/auth/login",
        {
          email: formData.email,
          password: formData.password,
        }
      );

      const { user, access_token, token } = res.data;

      // PICK ONE TOKEN
      const finalToken = token || access_token;

      // STORE ONLY ONE KEY
      localStorage.setItem("token", finalToken);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("role", user.role);

      window.dispatchEvent(new Event("authChanged"));

      // Notify parent
      onLogin?.(user.role === "super_admin" ? "admin" : "user");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6 px-4 sm:px-6 bg-[#f5f6f8]">
      <Card className="mt-8 sm:mt-20 w-full max-w-sm sm:max-w-md border-none shadow-lg sm:shadow-xl">
        <CardHeader className="text-center p-4 sm:p-6">
          <CardTitle className="text-[#1d4d6a] text-lg sm:text-xl">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Sign in to access your academic resources
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Email Address</Label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="text-sm sm:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Password</Label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="text-sm sm:text-base"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs sm:text-sm">{error}</p>
          )}

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white text-sm sm:text-base py-2 sm:py-2.5"
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setError("");
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);
      const res = await axios.post(
        "https://ebook-backend-lxce.onrender.com/api/auth/register",
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
        }
      );

      alert("✅ Account created successfully!");
      onNavigate("login");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-[#f5f6f8]">
      <Card className="mt-8 sm:mt-20 w-full max-w-sm sm:max-w-md border-none shadow-lg sm:shadow-xl">
        <CardHeader className="text-center p-4 sm:p-6">
          <CardTitle className="text-[#1d4d6a] text-lg sm:text-xl">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Join thousands of learners worldwide
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">First Name</Label>
              <Input
                name="firstName"
                type="text"
                placeholder="John"
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
              value={formData.email}
              onChange={handleChange}
              className="text-sm sm:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Password</Label>
            <Input
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="text-sm sm:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm sm:text-base">Confirm Password</Label>
            <Input
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="text-sm sm:text-base"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs sm:text-sm">{error}</p>
          )}

          <Button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-[#bf2026] text-white text-sm sm:text-base py-2 sm:py-2.5"
          >
            {loading ? "Creating..." : "Create Account"}
          </Button>

          <p className="text-center text-xs sm:text-sm text-gray-600">
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