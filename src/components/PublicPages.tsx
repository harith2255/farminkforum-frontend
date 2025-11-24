import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import axios from "axios"
import { BookOpen,} from 'lucide-react';
import { Navbar } from './home/NavBar';
import { Footer } from './home/Footer';
import ExplorePage from './explore/ExplorePage';
import PricingPage from './pricing/PricingPage';
import AboutPage from './about/AboutPage';
import ContactPage from './contact/ContactPage';
import PurchasePage from "./PurchasePage";
import ReadNotePage from './ReadNotePage';
import * as React from 'react';

interface PublicPagesProps {
  page: 'explore' | 'pricing' | 'about' | 'contact' | 'login' | 'register' | 'purchase' | 'read_note';

  onNavigate: (page: string) => void;
  onLogin?: (role: 'user' | 'admin') => void;
}

export function PublicPages({ page, onNavigate, onLogin }: PublicPagesProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navbar onNavigate={onNavigate} />

      {/* Page Content */}
      {page === 'explore' && <ExplorePage onNavigate={onNavigate} />}
      {page === 'pricing' && <PricingPage onNavigate={onNavigate} />}
      {page === 'about' && <AboutPage />}
      {page === 'contact' && <ContactPage />}
      {page === 'login' && <LoginPage onNavigate={onNavigate} onLogin={onLogin} />}
      {page === 'register' && <RegisterPage onNavigate={onNavigate} />}
      {page === "purchase" && (<PurchasePage onNavigate={onNavigate} />)}
      {page === 'read_note' && <ReadNotePage onNavigate={onNavigate} />}



      {/* Footer */}
      <Footer onNavigate={onNavigate} />


    </div>
  );
}

export  function LoginPage({
  onNavigate,
  onLogin,
}: {
  onNavigate: (page: string) => void;
  onLogin?: (role: "user" | "admin") => void;
}) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 const handleLogin = async () => {
  setError("");
  setLoading(true);

  try {
    const res = await axios.post("https://ebook-backend-lxce.onrender.com/api/auth/login", {
      email: formData.email,
      password: formData.password,
    });

   const { user, access_token } = res.data;

localStorage.setItem("token", access_token); // FIXED
localStorage.setItem("isLoggedIn", "true");
localStorage.setItem("role", user.role);


    // ✅ Only one admin — the super admin
    if (user.role === "super_admin") {
      onLogin?.("admin"); // goes to admin dashboard
    } else {
      onLogin?.("user"); // normal user
    }
  } catch (err: any) {
    console.error(err);
    setError(err.response?.data?.error || "Invalid email or password");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-[80vh] flex items-center justify-center py-6 px-6 bg-[#f5f6f8]">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-[#bf2026]" />
          </div>
          <CardTitle className="text-[#1d4d6a]">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your academic resources</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label>Email Address</Label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <Label>Password</Label>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#bf2026] hover:bg-[#a01c22] text-white"
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Don’t have an account?{" "}
              <button
                onClick={() => onNavigate("register")}
                className="text-[#bf2026] hover:underline"
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
export default function RegisterPage({ onNavigate }: { onNavigate: (page: string) => void }) {
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
    const res = await axios.post("https://ebook-backend-lxce.onrender.com/api/auth/register", {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      password: formData.password,
    });

    const userId = res.data?.user?.id;



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
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12 bg-[#f5f6f8]">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-[#bf2026]" />
          </div>
          <CardTitle className="text-[#1d4d6a]">Create Your Account</CardTitle>
          <CardDescription>Join thousands of learners worldwide</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
  <Label>First Name</Label>
  <Input
    name="firstName"
    type="text"
    placeholder="firstName"
    value={formData.firstName}
    onChange={handleChange}
  />
</div>

<div>
  <Label>Last Name</Label>
  <Input
    name="lastName"
    type="text"
    placeholder="lastName"
    value={formData.lastName}
    onChange={handleChange}
  />
</div>

          <div>
            <Label>Email</Label>
            <Input name="email" type="email" placeholder="your@email.com" value={formData.email} onChange={handleChange} />
          </div>
          <div>
            <Label>Password</Label>
            <Input name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} />
          </div>
          <div>
            <Label>Confirm Password</Label>
            <Input name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button onClick={handleRegister} disabled={loading} className="w-full bg-[#bf2026] text-white">
            {loading ? "Creating..." : "Create Account"}
          </Button>
          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <button onClick={() => onNavigate("login")} className="text-[#bf2026] hover:underline ">
              Sign in
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}