import {
  FaAlignLeft,
  FaListUl,
  FaCode,
  FaFlask,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

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

export default function QuestionPanel({ question }) {
  if (!question) return null;

  const difficulty = question.difficulty ?? "easy";
  const diffCfg    = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG.easy;

  return (
    <div className="space-y-0 mb-6">

      {/* ── Title + Difficulty ─────────────────────────────────── */}
      <Field>
        <SectionHeader icon={FaAlignLeft} title="Question Details" />

        <div className="flex items-start justify-between gap-4">
          <h1 className="text-base font-semibold text-light-text dark:text-dark-text leading-snug">
            {question.title}
          </h1>
          <span
            className={`
              shrink-0 px-3 py-1 rounded-full text-xs font-semibold border
              ${diffCfg.color} ${diffCfg.bg}
            `}
          >
            {diffCfg.label}
          </span>
        </div>

        {/* Function name badge */}
        {question.functionName && (
          <div className="mt-3 flex items-center gap-2">
            <FaCode className="text-amu-accent text-xs shrink-0" />
            <code className="text-xs font-mono bg-amu-primary/5 dark:bg-amu-primary/10 text-amu-primary dark:text-amu-accent px-2 py-0.5 rounded">
              {question.functionName}()
            </code>
          </div>
        )}
      </Field>

      {/* ── Description ────────────────────────────────────────── */}
      <Field>
        <SectionHeader icon={FaAlignLeft} title="Problem Description" />
        <p className="text-sm text-light-text dark:text-dark-text leading-relaxed whitespace-pre-line">
          {question.description}
        </p>
      </Field>

      {/* ── Constraints ────────────────────────────────────────── */}
      {question.constraints && (
        <Field>
          <SectionHeader icon={FaListUl} title="Constraints" />
          <p className="text-sm text-light-text/80 dark:text-dark-text/80 leading-relaxed whitespace-pre-line font-mono">
            {question.constraints}
          </p>
        </Field>
      )}

      {/* ── Examples ───────────────────────────────────────────── */}
      {question.examples?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FaListUl className="text-amu-accent text-sm" />
            <h2 className="font-semibold text-sm uppercase tracking-widest text-light-text/60 dark:text-dark-text/60">
              Examples
            </h2>
          </div>

          <div className="space-y-3">
            {question.examples.map((ex, i) => (
              <div
                key={i}
                className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-4"
              >
                <span className="text-xs font-semibold text-amu-accent uppercase tracking-wider">
                  Example {i + 1}
                </span>

                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-[64px_1fr] gap-2 items-start">
                    <span className="text-xs text-light-text/50 dark:text-dark-text/50 font-medium pt-0.5">
                      Input
                    </span>
                    <code className="text-xs font-mono bg-light-border/30 dark:bg-dark-border/30 px-2 py-1 rounded break-all">
                      {ex.input}
                    </code>
                  </div>

                  <div className="grid grid-cols-[64px_1fr] gap-2 items-start">
                    <span className="text-xs text-light-text/50 dark:text-dark-text/50 font-medium pt-0.5">
                      Output
                    </span>
                    <code className="text-xs font-mono bg-light-border/30 dark:bg-dark-border/30 px-2 py-1 rounded break-all">
                      {ex.output}
                    </code>
                  </div>

                  {ex.explanation && (
                    <div className="grid grid-cols-[64px_1fr] gap-2 items-start">
                      <span className="text-xs text-light-text/50 dark:text-dark-text/50 font-medium pt-0.5">
                        Why
                      </span>
                      <p className="text-xs text-light-text/70 dark:text-dark-text/70 leading-relaxed">
                        {ex.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}