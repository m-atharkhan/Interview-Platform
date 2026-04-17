import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ThemeToggle from "../components/ThemeToggle";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "candidate" });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await toast.promise(api.post("/auth/register", form), {
      loading: "Creating account…",
      success: () => { navigate("/login"); return "Account created!"; },
      error: (err) => err.response?.data?.message || "Registration failed",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-light-bg dark:bg-dark-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amu-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amu-accent/5 blur-3xl" />
      </div>

      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <Card>
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-amu-primary flex items-center justify-center mb-4 shadow-lg shadow-amu-primary/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1 className="text-[20px] font-semibold text-light-text dark:text-dark-text tracking-tight">Create Account</h1>
          <p className="text-[12px] text-light-muted dark:text-dark-muted mt-1">Join the platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input name="name" placeholder="Full name" label="Name" onChange={handleChange} required />
          <Input name="email" type="email" placeholder="you@example.com" label="Email" onChange={handleChange} required />
          <Input name="password" type="password" placeholder="••••••••" label="Password" onChange={handleChange} required />

          <div>
            <label className="block text-[12px] font-medium text-light-muted dark:text-dark-muted mb-1.5">Role</label>
            <select
              name="role"
              onChange={handleChange}
              defaultValue="candidate"
              className="
                w-full px-4 py-2.5 rounded-lg text-[13px]
                border border-light-border dark:border-dark-border
                bg-light-bg dark:bg-dark-bg
                text-light-text dark:text-dark-text
                focus:outline-none focus:ring-2 focus:ring-amu-primary/30 focus:border-amu-primary
                transition-all duration-200
              "
            >
              <option value="candidate">Candidate</option>
              <option value="interviewer">Interviewer</option>
            </select>
          </div>

          <div className="pt-1">
            <Button type="submit">Create account</Button>
          </div>
        </form>

        <p className="text-[12px] text-center mt-6 text-light-muted dark:text-dark-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-amu-primary dark:text-amu-accent font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}