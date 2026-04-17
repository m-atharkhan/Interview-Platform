import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaVideo, FaSignOutAlt, FaPlus, FaBook } from "react-icons/fa";
import { FiArrowRight, FiGrid } from "react-icons/fi";
import useAuth from "../hooks/useAuth";
import api from "../api/axios";
import ThemeToggle from "../components/ThemeToggle";

function ActionCard({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="
      group bg-light-card dark:bg-dark-card
      border border-light-border dark:border-dark-border
      rounded-xl p-5 flex flex-col gap-4
      hover:border-amu-accent/60 hover:shadow-md
      transition-all duration-200
    ">
      <div className="w-10 h-10 rounded-lg bg-amu-primary/8 dark:bg-amu-primary/15 flex items-center justify-center group-hover:bg-amu-primary/15 dark:group-hover:bg-amu-primary/25 transition-colors">
        <Icon size={15} className="text-amu-primary" />
      </div>
      <div>
        <h3 className="text-[14px] font-semibold mb-1 text-light-text dark:text-dark-text">{title}</h3>
        <p className="text-[12px] text-light-muted dark:text-dark-muted leading-relaxed">{description}</p>
      </div>
      <button
        onClick={onAction}
        className="mt-auto flex items-center gap-1.5 self-start text-[12px] font-medium text-amu-primary hover:text-amu-secondary dark:text-amu-accent dark:hover:text-amu-accent/80 transition-colors"
      >
        {actionLabel} <FiArrowRight size={11} />
      </button>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [roomId, setRoomId] = useState("");

  if (loading) return null;

  const createInterview = async () => {
    try {
      const { data } = await api.post("/interviews/create");
      toast.success("Interview created");
      navigate(`/interview/${data.roomId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create interview");
    }
  };

  const joinInterview = () => {
    if (!roomId.trim()) { toast.error("Enter a valid room ID"); return; }
    navigate(`/interview/${roomId}`);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
      toast.success("Logged out");
      navigate("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const stats = [
    { label: "Interviews", value: "—" },
    { label: "Questions",  value: "—" },
    { label: "Candidates", value: "—" },
  ];

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">

      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-light-card/90 dark:bg-dark-card/90 backdrop-blur-md border-b border-light-border dark:border-dark-border">
        <div className="max-w-5xl mx-auto px-6 h-[58px] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amu-primary flex items-center justify-center shadow-sm shadow-amu-primary/30">
              <FiGrid size={13} className="text-white" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">AMU Interview</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-[12px] font-medium text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text px-3 py-2 rounded-lg hover:bg-light-border/50 dark:hover:bg-dark-border/50 transition-all"
            >
              <FaSignOutAlt size={11} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* HERO */}
        <div className="relative overflow-hidden bg-amu-primary rounded-2xl px-7 py-6 mb-8">
          {/* Decorative blobs */}
          <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute right-16 bottom-0 w-40 h-40 rounded-full bg-white/[0.04] translate-y-1/2 pointer-events-none" />

          <div className="relative flex items-center justify-between gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-1">Welcome back</p>
              <h2 className="text-[21px] font-semibold text-white leading-tight">
                {user?.name}
                <span className="text-[13px] font-normal text-white/50 ml-2">· {user?.role}</span>
              </h2>
              <p className="text-[11px] text-white/40 mt-0.5">{user?.email}</p>

              {/* <div className="flex items-center gap-5 mt-5">
                {stats.map((s, i) => (
                  <div key={i} className="flex items-center gap-5">
                    {i > 0 && <div className="w-px h-5 bg-white/10" />}
                    <div>
                      <p className="text-[16px] font-semibold text-white">{s.value}</p>
                      <p className="text-[10px] text-white/40">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div> */}
            </div>

            <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-white text-[16px] font-semibold flex-shrink-0 ring-2 ring-white/10">
              {initials}
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        {user?.role === "interviewer" && (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-light-muted dark:text-dark-muted mb-3">
              Quick actions
            </p>
            <div className="grid md:grid-cols-3 gap-3 mb-8">
              <ActionCard
                icon={FaVideo}
                title="Create interview"
                description="Start a new session and invite candidates to a live coding room."
                actionLabel="Create"
                onAction={createInterview}
              />
              <ActionCard
                icon={FaPlus}
                title="Add question"
                description="Create new coding problems for your question bank."
                actionLabel="Add"
                onAction={() => navigate("/questions/create")}
              />
              <ActionCard
                icon={FaBook}
                title="Question bank"
                description="Browse, edit, and manage all your interview problems."
                actionLabel="Open"
                onAction={() => navigate("/questions")}
              />
            </div>
          </>
        )}

        {/* JOIN INTERVIEW */}
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-light-muted dark:text-dark-muted mb-3">
          Join a session
        </p>
        <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-5">
          <h3 className="text-[14px] font-semibold mb-0.5 text-light-text dark:text-dark-text">Join interview</h3>
          <p className="text-[12px] text-light-muted dark:text-dark-muted mb-4">
            Enter the room ID shared by the interviewer.
          </p>
          <div className="flex gap-2">
            <input
              placeholder="Room ID — e.g. AMU-8821"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && joinInterview()}
              className="
                flex-1 px-4 py-2.5 rounded-lg text-[13px]
                bg-light-bg dark:bg-dark-bg
                border border-light-border dark:border-dark-border
                text-light-text dark:text-dark-text
                placeholder:text-light-muted/50 dark:placeholder:text-dark-muted/50
                focus:outline-none focus:ring-2 focus:ring-amu-primary/30 focus:border-amu-primary
                transition-all duration-200
              "
            />
            <button
              onClick={joinInterview}
              className="flex items-center gap-1.5 bg-amu-primary hover:bg-amu-secondary text-white px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors shadow-sm shadow-amu-primary/20"
            >
              Join <FiArrowRight size={12} />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}