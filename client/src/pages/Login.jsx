import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUniversity } from "react-icons/fa";
import toast from "react-hot-toast";

import api from "../api/axios";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    await toast.promise(
      api.post("/auth/login", form),
      {
        loading: "Signing in...",
        success: () => {
          navigate("/dashboard");
          return "Login successful";
        },
        error: (err) =>
          err.response?.data?.message || "Login failed"
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
            AMU Interview Platform
          </h2>

        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <Input
            name="email"
            type="email"
            placeholder="Email"
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

          <Button>
            Login
          </Button>

        </form>

        <p className="text-sm text-center mt-6 opacity-70">
          Don't have an account?{" "}
          <Link to="/register" className="text-amu-primary font-medium">
            Register
          </Link>
        </p>

      </Card>

    </div>
  );
}