import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUniversity } from "react-icons/fa";
import toast from "react-hot-toast";

import api from "../api/axios";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ThemeToggle from "../components/ThemeToggle";

export default function Register() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidate"
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    await toast.promise(
      api.post("/auth/register", form),
      {
        loading: "Creating account...",
        success: () => {
          navigate("/login");
          return "Account created successfully";
        },
        error: (err) =>
          err.response?.data?.message || "Registration failed"
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-light-bg dark:bg-dark-bg">

      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <Card>

        <div className="text-center mb-6">

          <FaUniversity className="text-amu-primary text-3xl mx-auto mb-2" />

          <h2 className="text-xl font-semibold">
            Create Account
          </h2>

        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <Input
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            required
          />

          <Input
            name="email"
            placeholder="Email"
            type="email"
            onChange={handleChange}
            required
          />

          <Input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />

          <select
            name="role"
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border
            border-light-border dark:border-dark-border
            bg-white dark:bg-dark-card
            text-light-text dark:text-dark-text"
          >
            <option value="candidate">Candidate</option>
            <option value="interviewer">Interviewer</option>
          </select>

          <Button>
            Register
          </Button>

        </form>

        <p className="text-sm text-center mt-6 opacity-70">
          Already have an account?{" "}
          <Link to="/login" className="text-amu-primary font-medium">
            Login
          </Link>
        </p>

      </Card>

    </div>
  );
}