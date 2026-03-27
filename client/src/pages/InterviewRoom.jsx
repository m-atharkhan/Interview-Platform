import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaClock, FaSignOutAlt } from "react-icons/fa";
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

  /* ── socket join ─────────────────────────────────────────────────
     Interviewer: joins immediately → set approved right away
     Candidate:   sends request → waits for join-approved event
  ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!user) return;

    if (user.role === "interviewer") {
      socket.emit("join-as-host", { roomId, user });
      setIsApproved(true);
    } else {
      socket.emit("request-join", { roomId, user });
      toast("Waiting for interviewer approval...");
    }
  }, [user]);

  useEffect(() => {
    const onParticipants  = (list) => setParticipants(list);

    const onJoinRequest   = (req) => {
      setRequests((prev) => {
        const exists = prev.some((r) => r.socketId === req.socketId);
        return exists ? prev : [...prev, req];
      });
    };

    // FIX: setIsApproved(true) was missing here — candidate never triggered video join
    const onJoinApproved  = () => {
      toast.success("Approved to join interview");
      setIsApproved(true);
    };

    const onJoinRejected  = () => {
      toast.error("Join rejected");
      navigate("/dashboard");
    };

    const onInterviewEnded = () => {
      toast("This interview has been ended by the interviewer.");
      navigate("/dashboard");
    };

    socket.on("participants",   onParticipants);
    socket.on("join-request",   onJoinRequest);
    socket.on("join-approved",  onJoinApproved);
    socket.on("join-rejected",  onJoinRejected);
    socket.on("interview-ended", onInterviewEnded);

    return () => {
      socket.off("participants",  onParticipants);
      socket.off("join-request",  onJoinRequest);
      socket.off("join-approved", onJoinApproved);
      socket.off("join-rejected", onJoinRejected);
      socket.off("interview-ended", onInterviewEnded);
    };
  }, []);

  useEffect(() => {
    if (!interview?.startedAt) return;
    const update = () => {
      const diff = Math.floor(
        (Date.now() - new Date(interview.startedAt).getTime()) / 1000
      );
      setSeconds(diff);
    };
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

  const leaveInterview = () => {
    socket.emit("leave-room", { roomId });
    navigate("/dashboard");
  };

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
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex flex-col">

      <VideoPanel roomId={roomId} user={user} isApproved={isApproved} />

      <header className="border-b border-light-border dark:border-dark-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-lg font-semibold">Interview Room — {roomId}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FaClock />
              {formatTime()}
            </div>
            <ThemeToggle />
            <button
              onClick={leaveInterview}
              className="flex items-center gap-2 bg-amu-primary text-white px-3 py-2 rounded-lg"
            >
              <FaSignOutAlt />
              Leave
            </button>
            {user?.role === "interviewer" && (
              <button
                onClick={endInterview}
                className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg"
              >
                End Interview
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1">
        <div className="flex-1 p-6">

          {user?.role === "interviewer" && (
            <div className="mt-4 mb-2">
              <select
                value={selectedQuestion?._id ?? ""}
                onChange={(e) => handleQuestionChange(e.target.value)}
                className="px-3 py-2 border border-light-border dark:border-dark-border rounded-md text-sm bg-white dark:bg-dark-card text-light-text dark:text-dark-text"
              >
                {questions.map((q) => (
                  <option key={q._id} value={q._id}>{q.title}</option>
                ))}
              </select>
            </div>
          )}

          <QuestionPanel question={selectedQuestion} />

          <div className="mt-6 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-4 rounded-xl">
            <div className="mt-6">
              <CodeEditor question={selectedQuestion} />
            </div>
          </div>

        </div>

        <div className="w-[340px] border-l border-light-border dark:border-dark-border p-6">

          <div className="mb-6">
            <h3 className="font-semibold mb-3">Participants</h3>
            {participants.map((p) => {
              const color = getColorForId(p.userId);
              const isYou = user && p.userId === user._id;
              return (
                <div key={p.socketId} className="flex items-center gap-2 text-sm mb-2">
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span>{p.name}</span>
                  <span className="text-xs opacity-60">({p.role}{isYou ? ", you" : ""})</span>
                </div>
              );
            })}
          </div>

          {user?.role === "interviewer" && requests.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Join Requests</h3>
              {requests.map((req) => (
                <div key={req.socketId} className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border p-3 rounded-lg mb-3">
                  <p className="text-sm mb-2">{req.user.name}</p>
                  <div className="flex gap-2">
                    <button onClick={() => approveUser(req)} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
                    <button onClick={() => rejectUser(req)} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <NotesPanel />

        </div>
      </main>
    </div>
  );
}