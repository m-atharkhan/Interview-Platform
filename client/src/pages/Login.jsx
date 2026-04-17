import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await toast.promise(api.post("/auth/login", form), {
      loading: "Signing in…",
      success: () => { navigate("/dashboard"); return "Welcome back!"; },
      error: (err) => err.response?.data?.message || "Login failed",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-light-bg dark:bg-dark-bg">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amu-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amu-accent/5 blur-3xl" />
      </div>

      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <Card>
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-amu-primary flex items-center justify-center mb-4 shadow-lg shadow-amu-primary/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <h1 className="text-[20px] font-semibold text-light-text dark:text-dark-text tracking-tight">
            AMU Interview Platform
          </h1>
          <p className="text-[12px] text-light-muted dark:text-dark-muted mt-1">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="email" type="email" placeholder="you@example.com" label="Email" onChange={handleChange} required />
          <Input name="password" type="password" placeholder="••••••••" label="Password" onChange={handleChange} required />
          <div className="pt-1">
            <Button type="submit">Sign in</Button>
          </div>
        </form>

        <p className="text-[12px] text-center mt-6 text-light-muted dark:text-dark-muted">
          Don't have an account?{" "}
          <Link to="/register" className="text-amu-primary dark:text-amu-accent font-medium hover:underline">
            Register
          </Link>
        </p>
      </Card>
    </div>
  );
}