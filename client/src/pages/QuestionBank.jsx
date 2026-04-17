import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import ThemeToggle from "../components/ThemeToggle";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { FiArrowLeft, FiGrid } from "react-icons/fi";

const DIFFICULTY_STYLES = {
  easy:   "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  medium: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  hard:   "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
};

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const navigate = useNavigate();

  const loadQuestions = async () => {
    try {
      const { data } = await api.get("/questions");
      setQuestions(data);
    } catch {
      toast.error("Failed to load questions");
    }
  };

  useEffect(() => { loadQuestions(); }, []);

  const deleteQuestion = async (id) => {
    try {
      await api.delete(`/questions/${id}`);
      toast.success("Question deleted");
      setQuestions((prev) => prev.filter((q) => q._id !== id));
    } catch {
      toast.error("Delete failed");
    }
  };

  const diffKey = (d) => (d || "").toLowerCase();

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">

      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-light-card/90 dark:bg-dark-card/90 backdrop-blur-md border-b border-light-border dark:border-dark-border">
        <div className="max-w-5xl mx-auto px-6 h-[58px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-light-border/60 dark:hover:bg-dark-border/60 transition-colors text-light-muted dark:text-dark-muted"
            >
              <FiArrowLeft size={15} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amu-primary flex items-center justify-center shadow-sm shadow-amu-primary/30">
                <FiGrid size={13} className="text-white" />
              </div>
              <span className="text-[15px] font-semibold">Question Bank</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => navigate("/questions/create")}
              className="flex items-center gap-1.5 bg-amu-primary hover:bg-amu-secondary text-white px-3.5 py-2 rounded-lg text-[12px] font-medium transition-colors shadow-sm shadow-amu-primary/20"
            >
              <FaPlus size={10} />
              Add Question
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-xl bg-amu-primary/8 dark:bg-amu-primary/15 flex items-center justify-center mb-4">
              <FaEdit size={18} className="text-amu-primary/50" />
            </div>
            <p className="text-[15px] font-medium text-light-text dark:text-dark-text mb-1">No questions yet</p>
            <p className="text-[12px] text-light-muted dark:text-dark-muted mb-5">Add your first question to get started.</p>
            <button
              onClick={() => navigate("/questions/create")}
              className="flex items-center gap-1.5 bg-amu-primary hover:bg-amu-secondary text-white px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors"
            >
              <FaPlus size={11} /> Add Question
            </button>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {questions.map((q) => (
              <div
                key={q._id}
                className="
                  group bg-light-card dark:bg-dark-card
                  border border-light-border dark:border-dark-border
                  rounded-xl px-5 py-4
                  flex items-center justify-between gap-4
                  hover:border-amu-accent/50 hover:shadow-sm
                  transition-all duration-200
                "
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div>
                    <h3 className="text-[14px] font-semibold text-light-text dark:text-dark-text truncate">{q.title}</h3>
                    {q.difficulty && (
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-md border capitalize ${DIFFICULTY_STYLES[diffKey(q.difficulty)] || ""}`}>
                        {q.difficulty}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/questions/edit/${q._id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:border-amu-primary/40 hover:text-amu-primary dark:hover:text-amu-accent transition-all"
                  >
                    <FaEdit size={10} /> Edit
                  </button>
                  <button
                    onClick={() => deleteQuestion(q._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg border border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted hover:border-red-400/40 hover:text-red-500 transition-all"
                  >
                    <FaTrash size={10} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}