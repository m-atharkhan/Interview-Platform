import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaClock, FaSignOutAlt } from "react-icons/fa";
import { FiGrid } from "react-icons/fi";
import CodeEditor, { getColorForId } from "../components/CodeEditor";
import api from "../api/axios";
import socket from "../socket/socket";
import ThemeToggle from "../components/ThemeToggle";
import useAuth from "../hooks/useAuth";
import NotesPanel from "../components/NotesPanel";
import QuestionPanel from "../components/QuestionPanel";
import VideoPanel from "../components/VideoPanel";

export default function InterviewRoom() {
  const { roomId } = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [interview,        setInterview]        = useState(null);
  const [participants,     setParticipants]     = useState([]);
  const [requests,         setRequests]         = useState([]);
  const [seconds,          setSeconds]          = useState(0);
  const [questions,        setQuestions]        = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isApproved,       setIsApproved]       = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "If you refresh, you must request to join the interview again.";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const { data } = await api.get("/questions");
        setQuestions(data);
        if (data.length > 0) setSelectedQuestion(data[0]);
      } catch {
        console.error("Failed to load questions");
      }
    };
    loadQuestions();
  }, []);

  useEffect(() => {
    const onQuestionUpdate = (question) => setSelectedQuestion(question);
    socket.on("question-update", onQuestionUpdate);
    return () => socket.off("question-update", onQuestionUpdate);
  }, []);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const { data } = await api.get(`/interviews/${roomId}`);
        setInterview(data);
      } catch {
        toast.error("Interview not found");
        navigate("/dashboard");
      }
    };
    fetchInterview();
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.role === "interviewer") {
      socket.emit("join-as-host", { roomId, user });
      setIsApproved(true);
    } else {
      socket.emit("request-join", { roomId, user });
      toast("Waiting for interviewer approval…");
    }
  }, [user]);

  useEffect(() => {
    const onParticipants   = (list) => setParticipants(list);
    const onJoinRequest    = (req) => {
      setRequests((prev) => prev.some((r) => r.socketId === req.socketId) ? prev : [...prev, req]);
    };
    const onJoinApproved   = () => { toast.success("Approved to join interview"); setIsApproved(true); };
    const onJoinRejected   = () => { toast.error("Join rejected"); navigate("/dashboard"); };
    const onInterviewEnded = () => { toast("Interview ended by the interviewer."); navigate("/dashboard"); };

    socket.on("participants",    onParticipants);
    socket.on("join-request",    onJoinRequest);
    socket.on("join-approved",   onJoinApproved);
    socket.on("join-rejected",   onJoinRejected);
    socket.on("interview-ended", onInterviewEnded);

    return () => {
      socket.off("participants",    onParticipants);
      socket.off("join-request",    onJoinRequest);
      socket.off("join-approved",   onJoinApproved);
      socket.off("join-rejected",   onJoinRejected);
      socket.off("interview-ended", onInterviewEnded);
    };
  }, []);

  useEffect(() => {
    if (!interview?.startedAt) return;
    const update = () => setSeconds(Math.floor((Date.now() - new Date(interview.startedAt).getTime()) / 1000));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [interview]);

  const formatTime = () => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const approveUser = (req) => {
    socket.emit("approve-join", { socketId: req.socketId, roomId, user: req.user });
    setRequests((prev) => prev.filter((r) => r.socketId !== req.socketId));
  };

  const rejectUser = (req) => {
    socket.emit("reject-join", { socketId: req.socketId });
    setRequests((prev) => prev.filter((r) => r.socketId !== req.socketId));
  };

  const leaveInterview = () => { socket.emit("leave-room", { roomId }); navigate("/dashboard"); };

  const endInterview = async () => {
    try {
      await api.patch(`/interviews/${roomId}/end`);
      socket.emit("end-interview", { roomId });
      toast.success("Interview ended");
      navigate("/dashboard");
    } catch {
      toast.error("Failed to end interview");
    }
  };

  const handleQuestionChange = (id) => {
    const question = questions.find((q) => q._id === id);
    if (!question) return;
    setSelectedQuestion(question);
    socket.emit("select-question", { roomId, question });
  };

  if (!interview) return null;

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col text-light-text dark:text-dark-text">

      <VideoPanel roomId={roomId} user={user} isApproved={isApproved} />

      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-light-card/90 dark:bg-dark-card/90 backdrop-blur-md border-b border-light-border dark:border-dark-border flex-shrink-0">
        <div className="max-w-full px-5 h-[54px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-amu-primary flex items-center justify-center">
              <FiGrid size={11} className="text-white" />
            </div>
            <span className="text-[13px] font-semibold text-light-text dark:text-dark-text">
              Room <span className="text-light-muted dark:text-dark-muted font-normal">· {roomId}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-light-border/40 dark:bg-dark-border/40 text-[12px] text-light-muted dark:text-dark-muted">
              <FaClock size={10} />
              <span className="font-mono">{formatTime()}</span>
            </div>
            <ThemeToggle />
            <button
              onClick={leaveInterview}
              className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-2 rounded-lg border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:border-amu-accent/50 transition-all"
            >
              <FaSignOutAlt size={10} /> Leave
            </button>
            {user?.role === "interviewer" && (
              <button
                onClick={endInterview}
                className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                End Interview
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="flex flex-1 overflow-hidden">

        {/* LEFT: Editor area */}
        <div className="flex-1 flex flex-col overflow-auto p-5 gap-4">
          {user?.role === "interviewer" && (
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-1.5">
                Select Question
              </label>
              <select
                value={selectedQuestion?._id ?? ""}
                onChange={(e) => handleQuestionChange(e.target.value)}
                className="
                  px-3 py-2 rounded-lg text-[12px]
                  border border-light-border dark:border-dark-border
                  bg-light-card dark:bg-dark-card
                  text-light-text dark:text-dark-text
                  focus:outline-none focus:ring-2 focus:ring-amu-primary/30
                  transition-all
                "
              >
                {questions.map((q) => (
                  <option key={q._id} value={q._id}>{q.title}</option>
                ))}
              </select>
            </div>
          )}

          <QuestionPanel question={selectedQuestion} />

          <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl overflow-hidden">
            <CodeEditor question={selectedQuestion} />
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="w-[300px] border-l border-light-border dark:border-dark-border flex flex-col overflow-auto">

          {/* Participants */}
          <div className="p-5 border-b border-light-border dark:border-dark-border">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-3">
              Participants
            </p>
            <div className="space-y-2">
              {participants.map((p) => {
                const color = getColorForId(p.userId);
                const isYou = user && p.userId === user._id;
                return (
                  <div key={p.socketId} className="flex items-center gap-2.5 text-[12px]">
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
                    <span className="font-medium text-light-text dark:text-dark-text">{p.name}</span>
                    <span className="text-light-muted dark:text-dark-muted capitalize">{p.role}{isYou ? " · you" : ""}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Join Requests */}
          {user?.role === "interviewer" && requests.length > 0 && (
            <div className="p-5 border-b border-light-border dark:border-dark-border">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-3">
                Join Requests
              </p>
              <div className="space-y-2.5">
                {requests.map((req) => (
                  <div key={req.socketId} className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg p-3">
                    <p className="text-[12px] font-medium text-light-text dark:text-dark-text mb-2">{req.user.name}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveUser(req)}
                        className="flex-1 py-1.5 rounded-md text-[11px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectUser(req)}
                        className="flex-1 py-1.5 rounded-md text-[11px] font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="flex-1 p-5">
            <NotesPanel />
          </div>

        </div>
      </main>
    </div>
  );
}