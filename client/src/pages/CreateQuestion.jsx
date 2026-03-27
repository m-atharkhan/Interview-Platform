import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import ThemeToggle from "../components/ThemeToggle";
import {
  FaPlus,
  FaTrash,
  FaCode,
  FaFlask,
  FaAlignLeft,
  FaListUl,
  FaCheckCircle,
  FaExclamationCircle
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";

const LANGUAGES = ["javascript", "python", "java", "cpp"];

const LANG_LABELS = {
  javascript: "JavaScript",
  python:     "Python",
  java:       "Java",
  cpp:        "C++"
};

const DIFFICULTY_CONFIG = {
  easy:   { label: "Easy",   color: "text-green-500",  bg: "bg-green-500/10  border-green-500/30"  },
  medium: { label: "Medium", color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/30" },
  hard:   { label: "Hard",   color: "text-red-500",    bg: "bg-red-500/10    border-red-500/30"    }
};

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="text-amu-accent text-sm" />
      <h2 className="font-semibold text-sm uppercase tracking-widest text-light-text/60 dark:text-dark-text/60">
        {title}
      </h2>
    </div>
  );
}

function Field({ children }) {
  return (
    <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-4 mb-4">
      {children}
    </div>
  );
}

const inputCls = `
  w-full bg-transparent
  border border-light-border dark:border-dark-border
  rounded-lg px-3 py-2 text-sm
  text-light-text dark:text-dark-text
  placeholder:text-light-text/40 dark:placeholder:text-dark-text/40
  focus:outline-none focus:border-amu-accent
  transition-colors
`;

const textareaCls = `${inputCls} resize-none`;

function isValidJsonArray(str) {
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed);
  } catch {
    return false;
  }
}

export default function CreateQuestion() {

  const [title,        setTitle]        = useState("");
  const [difficulty,   setDifficulty]   = useState("easy");
  const [description,  setDescription]  = useState("");
  const [constraints,  setConstraints]  = useState("");
  const [functionName, setFunctionName] = useState("");  // ← NEW

  const navigate = useNavigate();
  const { id }   = useParams();

  const [examples, setExamples] = useState([
    { input: "", output: "", explanation: "" }
  ]);

  // ← CHANGED: input → args
  const [testCases, setTestCases] = useState([
    { args: "", expected: "" }
  ]);

  const [starterCode, setStarterCode] = useState({
    javascript: "",
    python:     "",
    java:       "",
    cpp:        ""
  });

  const [activeTab, setActiveTab] = useState("javascript");

  /* ── helpers ──────────────────────────────────────────────────── */

  const addExample = () =>
    setExamples([...examples, { input: "", output: "", explanation: "" }]);

  const removeExample = (i) =>
    setExamples(examples.filter((_, idx) => idx !== i));

  const addTestCase = () =>
    setTestCases([...testCases, { args: "", expected: "" }]);  // ← CHANGED

  const removeTestCase = (i) =>
    setTestCases(testCases.filter((_, idx) => idx !== i));

  const updateExample = (i, field, value) => {
    const copy = [...examples];
    copy[i][field] = value;
    setExamples(copy);
  };

  const updateTestCase = (i, field, value) => {
    const copy = [...testCases];
    copy[i][field] = value;
    setTestCases(copy);
  };

  /* ── load existing question when editing ──────────────────────── */

  useEffect(() => {
    if (!id) return;

    const loadQuestion = async () => {
      try {
        const { data } = await api.get(`/questions/${id}`);
        setTitle(data.title);
        setDifficulty(data.difficulty);
        setDescription(data.description);
        setConstraints(data.constraints);
        setFunctionName(data.functionName ?? "");  // ← NEW
        setExamples(data.examples);
        setStarterCode(data.starterCode);

        // ← CHANGED: normalise testCases — handle both old (input) and new (args) format
        setTestCases(
          (data.testCases ?? []).map((tc) => ({
            args:     tc.args ?? tc.input ?? "",
            expected: tc.expected ?? ""
          }))
        );
      } catch {
        toast.error("Failed to load question");
      }
    };

    loadQuestion();
  }, [id]);

  /* ── submit ───────────────────────────────────────────────────── */

  const submit = async () => {

    // Validate args fields
    const invalidIdx = testCases.findIndex((tc) => !isValidJsonArray(tc.args));
    if (invalidIdx !== -1) {
      toast.error(`Test case ${invalidIdx + 1}: Args must be a valid JSON array, e.g. [[2,7,11,15], 9]`);
      return;
    }

    if (!functionName.trim()) {
      toast.error("Function name is required");
      return;
    }

    try {
      const payload = {
        title,
        difficulty,
        description,
        constraints,
        functionName,             // ← NEW
        examples,
        starterCode,
        // ← CHANGED: attach functionName to every test case for the executor
        testCases: testCases.map((tc) => ({
          ...tc,
          functionName
        }))
      };

      if (id) {
        await api.put(`/questions/${id}`, payload);
        toast.success("Question updated");
      } else {
        await api.post("/questions", payload);
        toast.success("Question created");
      }

      navigate("/questions");

    } catch {
      toast.error("Failed to save question");
    }
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg">

      {/* HEADER */}
      <header className="border-b border-light-border dark:border-dark-border sticky top-0 z-10 bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-lg font-semibold text-light-text dark:text-dark-text">
            {id ? "Edit Question" : "Create Interview Question"}
          </h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── TITLE + DIFFICULTY ─────────────────────────────────── */}
        <Field>
          <SectionHeader icon={FaAlignLeft} title="Question Details" />

          <input
            placeholder="Question title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${inputCls} mb-3 text-base font-medium`}
          />

          <div className="flex gap-2">
            {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setDifficulty(key)}
                className={`
                  px-4 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${difficulty === key
                    ? `${cfg.color} ${cfg.bg}`
                    : "border-light-border dark:border-dark-border text-light-text/50 dark:text-dark-text/50 hover:border-amu-accent"
                  }
                `}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </Field>

        {/* ── FUNCTION NAME ──────────────────────────────────────── */}
        {/* NEW FIELD — required by executor to call user's function */}
        <Field>
          <SectionHeader icon={FaCode} title="Function Name" />
          <input
            placeholder="e.g. twoSum"
            value={functionName}
            onChange={(e) => setFunctionName(e.target.value)}
            className={`${inputCls} font-mono`}
          />
          <p className="text-xs text-light-text/40 dark:text-dark-text/40 mt-2">
            The exact name of the function candidates must implement.
          </p>
        </Field>

        {/* ── DESCRIPTION ────────────────────────────────────────── */}
        <Field>
          <SectionHeader icon={FaAlignLeft} title="Problem Description" />
          <textarea
            placeholder="Describe the problem clearly..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className={textareaCls}
          />
        </Field>

        {/* ── CONSTRAINTS ────────────────────────────────────────── */}
        <Field>
          <SectionHeader icon={FaListUl} title="Constraints" />
          <textarea
            placeholder="e.g. 1 ≤ n ≤ 10⁵, time limit 1s..."
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            rows={3}
            className={textareaCls}
          />
        </Field>

        {/* ── EXAMPLES ───────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaListUl className="text-amu-accent text-sm" />
              <h2 className="font-semibold text-sm uppercase tracking-widest text-light-text/60 dark:text-dark-text/60">
                Examples
              </h2>
            </div>
            <button
              onClick={addExample}
              className="flex items-center gap-1.5 text-xs border border-light-border dark:border-dark-border hover:border-amu-accent text-light-text/70 dark:text-dark-text/70 px-3 py-1.5 rounded-lg transition-colors"
            >
              <FaPlus className="text-amu-accent" /> Add Example
            </button>
          </div>

          <div className="space-y-3">
            {examples.map((ex, i) => (
              <div key={i} className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-amu-accent uppercase tracking-wider">Example {i + 1}</span>
                  {examples.length > 1 && (
                    <button onClick={() => removeExample(i)} className="text-light-text/30 dark:text-dark-text/30 hover:text-red-500 transition-colors">
                      <FaTrash className="text-xs" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-light-text/50 dark:text-dark-text/50 mb-1 block">Input</label>
                    <input placeholder="Input" value={ex.input} onChange={(e) => updateExample(i, "input", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-light-text/50 dark:text-dark-text/50 mb-1 block">Output</label>
                    <input placeholder="Output" value={ex.output} onChange={(e) => updateExample(i, "output", e.target.value)} className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-light-text/50 dark:text-dark-text/50 mb-1 block">Explanation (optional)</label>
                  <textarea placeholder="Explain why..." value={ex.explanation} onChange={(e) => updateExample(i, "explanation", e.target.value)} rows={2} className={textareaCls} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── STARTER CODE ───────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FaCode className="text-amu-accent text-sm" />
            <h2 className="font-semibold text-sm uppercase tracking-widest text-light-text/60 dark:text-dark-text/60">
              Starter Code
            </h2>
          </div>

          <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl overflow-hidden">
            <div className="flex border-b border-light-border dark:border-dark-border">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveTab(lang)}
                  className={`
                    px-4 py-2.5 text-xs font-semibold transition-colors
                    ${activeTab === lang
                      ? "text-amu-primary dark:text-amu-accent border-b-2 border-amu-primary dark:border-amu-accent bg-amu-primary/5"
                      : "text-light-text/50 dark:text-dark-text/50 hover:text-light-text dark:hover:text-dark-text"
                    }
                  `}
                >
                  {LANG_LABELS[lang]}
                </button>
              ))}
            </div>
            <div className="p-4">
              <textarea
                key={activeTab}
                placeholder={`Write ${LANG_LABELS[activeTab]} starter code...`}
                value={starterCode[activeTab]}
                onChange={(e) => setStarterCode({ ...starterCode, [activeTab]: e.target.value })}
                rows={8}
                spellCheck={false}
                className={`${textareaCls} font-mono text-xs`}
              />
            </div>
          </div>
        </div>

        {/* ── TEST CASES ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaFlask className="text-amu-accent text-sm" />
              <h2 className="font-semibold text-sm uppercase tracking-widest text-light-text/60 dark:text-dark-text/60">
                Test Cases
              </h2>
            </div>
            <button
              onClick={addTestCase}
              className="flex items-center gap-1.5 text-xs border border-light-border dark:border-dark-border hover:border-amu-accent text-light-text/70 dark:text-dark-text/70 px-3 py-1.5 rounded-lg transition-colors"
            >
              <FaPlus className="text-amu-accent" /> Add Test Case
            </button>
          </div>

          {/* Format hint */}
          <div className="flex items-start gap-2 bg-amu-primary/5 border border-amu-primary/20 rounded-lg p-3 mb-4">
            <FaExclamationCircle className="text-amu-accent mt-0.5 shrink-0" />
            <div className="text-xs text-light-text/70 dark:text-dark-text/70">
              <span className="font-semibold">Args</span> — JSON array of function arguments.{" "}
              e.g. for <code className="font-mono bg-black/5 px-1 rounded">twoSum(nums, target)</code> →{" "}
              <code className="font-mono bg-black/5 px-1 rounded">[[2,7,11,15], 9]</code>
              <br />
              <span className="font-semibold">Expected</span> — JSON return value →{" "}
              <code className="font-mono bg-black/5 px-1 rounded">[0,1]</code>
            </div>
          </div>

          <div className="space-y-3">
            {testCases.map((t, i) => {
              const argsValid = t.args === "" || isValidJsonArray(t.args);
              return (
                <div key={i} className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-semibold text-amu-accent uppercase tracking-wider">Test {i + 1}</span>
                    {testCases.length > 1 && (
                      <button onClick={() => removeTestCase(i)} className="text-light-text/30 dark:text-dark-text/30 hover:text-red-500 transition-colors">
                        <FaTrash className="text-xs" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* ← CHANGED: input → args */}
                    <div>
                      <label className="text-xs text-light-text/50 dark:text-dark-text/50 mb-1 block">
                        Args (JSON array)
                      </label>
                      <input
                        placeholder='e.g. [[2,7,11,15], 9]'
                        value={t.args}
                        onChange={(e) => updateTestCase(i, "args", e.target.value)}
                        className={`
                          ${inputCls} font-mono text-xs
                          ${!argsValid ? "border-red-400 focus:border-red-400" : ""}
                        `}
                      />
                      {!argsValid && (
                        <p className="text-xs text-red-500 mt-1">Must be a valid JSON array</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-light-text/50 dark:text-dark-text/50 mb-1 block">
                        Expected (JSON)
                      </label>
                      <input
                        placeholder='e.g. [0,1]'
                        value={t.expected}
                        onChange={(e) => updateTestCase(i, "expected", e.target.value)}
                        className={`${inputCls} font-mono text-xs`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SUBMIT ─────────────────────────────────────────────── */}
        <div className="flex justify-end pt-2 pb-10">
          <button
            onClick={submit}
            className="flex items-center gap-2 bg-amu-primary hover:bg-amu-secondary text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <FaCheckCircle />
            {id ? "Update Question" : "Create Question"}
          </button>
        </div>

      </main>
    </div>
  );
}