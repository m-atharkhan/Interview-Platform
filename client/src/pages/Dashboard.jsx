import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaVideo,
  FaSignOutAlt,
  FaUserCircle,
  FaPlus,
  FaBook
} from "react-icons/fa";

import useAuth from "../hooks/useAuth";
import api from "../api/axios";
import ThemeToggle from "../components/ThemeToggle";

export default function Dashboard() {

  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [roomId, setRoomId] = useState("");

  if (loading) return null;

  /* CREATE INTERVIEW */

  const createInterview = async () => {

    try {

      const { data } = await api.post("/interviews/create");

      toast.success("Interview created");

      navigate(`/interview/${data.roomId}`);

    } catch (err) {

      toast.error(
        err.response?.data?.message || "Failed to create interview"
      );

    }

  };

  /* JOIN INTERVIEW */

  const joinInterview = () => {

    if (!roomId.trim()) {

      toast.error("Enter a valid room ID");
      return;

    }

    navigate(`/interview/${roomId}`);

  };

  /* GO TO ADD QUESTION */

  const goToAddQuestion = () => {

    navigate("/questions/create");

  };

  /* LOGOUT */

  const logout = async () => {

    try {

      await api.post("/auth/logout");

      toast.success("Logged out");

      navigate("/login");

    } catch {

      toast.error("Logout failed");

    }

  };

  return (

    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">

      {/* HEADER */}

      <header className="border-b border-light-border dark:border-dark-border">

        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

          <h1 className="text-xl font-semibold">
            AMU Interview Platform
          </h1>

          <div className="flex items-center gap-4">

            <ThemeToggle />

            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm bg-amu-primary hover:bg-amu-secondary text-white px-4 py-2 rounded-lg"
            >
              <FaSignOutAlt />
              Logout
            </button>

          </div>

        </div>

      </header>

      {/* MAIN */}

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* USER INFO CARD */}

        <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 mb-8 shadow-sm">

          <div className="flex items-center gap-4">

            <FaUserCircle size={40} />

            <div>

              <h2 className="text-lg font-semibold">
                {user?.name}
              </h2>

              <p className="text-sm opacity-70">
                {user?.email}
              </p>

              <p className="text-sm opacity-70">
                Role: {user?.role}
              </p>

            </div>

          </div>

        </div>

        {/* ACTION CARDS */}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* CREATE INTERVIEW (INTERVIEWER ONLY) */}

          {user?.role === "interviewer" && (

            <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 shadow-sm">

              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">

                <FaVideo />

                Create Interview

              </h3>

              <p className="text-sm opacity-70 mb-6">
                Start a new interview session and invite candidates.
              </p>

              <button
                onClick={createInterview}
                className="bg-amu-primary hover:bg-amu-secondary text-white px-4 py-2 rounded-lg"
              >
                Create Interview
              </button>

            </div>

          )}

          {/* ADD QUESTION (INTERVIEWER ONLY) */}

          {user?.role === "interviewer" && (

            <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 shadow-sm">

              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">

                <FaPlus />

                Add Question

              </h3>

              <p className="text-sm opacity-70 mb-6">
                Create new coding interview questions for your question bank.
              </p>

              <button
                onClick={goToAddQuestion}
                className="bg-amu-primary hover:bg-amu-secondary text-white px-4 py-2 rounded-lg"
              >
                Add Question
              </button>

            </div>

          )}

          {/* QUESTION BANK */}

          {user?.role === "interviewer" && ( 
            <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 shadow-sm"> 
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"> <FaBook /> Question Bank </h3> 
            <p className="text-sm opacity-70 mb-6"> Manage interview questions, edit or create new problems. </p> 
            <button onClick={() => navigate("/questions")} className="bg-amu-primary hover:bg-amu-secondary text-white px-4 py-2 rounded-lg" > 
              Open Question Bank 
              </button> 
              </div> 
            )}

          {/* JOIN INTERVIEW */}

          <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 shadow-sm">

            <h3 className="text-lg font-semibold mb-4">
              Join Interview
            </h3>

            <p className="text-sm opacity-70 mb-4">
              Enter the room ID shared with you.
            </p>

            <div className="flex gap-3">

              <input
                placeholder="Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="
                flex-1
                px-3 py-2
                rounded-lg
                border
                border-light-border dark:border-dark-border
                bg-white dark:bg-dark-card
                outline-none
                focus:ring-2 focus:ring-amu-primary
                "
              />

              <button
                onClick={joinInterview}
                className="
                bg-amu-primary
                hover:bg-amu-secondary
                text-white
                px-4 py-2
                rounded-lg
                "
              >
                Join
              </button>

            </div>

          </div>

        </div>

      </main>

    </div>

  );

}