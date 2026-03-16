import React, { useState } from "react";
import { useAppContext, type QuizAttempt } from "../AppContext";
import MCQ from "./MCQ";
import { formatToAikenFormat } from "../../utils/extractQn";
import type { InputChangeEvent } from "../Inputs";
import Inputs from "../Inputs";
import type { question } from "../../utils/extractQn";

function scoreOf(attempt: QuizAttempt) {
  const correct = attempt.questions.filter(
    (q) => attempt.selections[q.id] === q.answer,
  ).length;
  return { correct, total: attempt.questions.length };
}

function AnswerPill({
  chosen,
  answer,
  options,
}: {
  chosen: string | undefined;
  answer: string;
  options: Record<string, string>;
}) {
  if (!chosen) return <span className="gq-pill gq-pill-skipped">—</span>;
  const isCorrect = chosen === answer;
  return (
    <span
      className={`gq-pill ${isCorrect ? "gq-pill-correct" : "gq-pill-wrong"}`}
    >
      <span className="gq-pill-key">{chosen.toUpperCase()}.</span>&nbsp;
      {options[chosen] ?? ""}
    </span>
  );
}

function CompareRow({
  question,
  attempts,
  isChecked,
  onCheck,
}: {
  question: question;
  attempts: QuizAttempt[];
  isChecked: boolean;
  onCheck: (ev: InputChangeEvent) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="gq-cmp-row">
      <div className="gq-cmp-question-row">
        <div
          className="gq-cmp-question"
          onClick={() => setExpanded((v) => !v)}
          role="button"
          aria-expanded={expanded}
        >
          <span className="gq-cmp-chevron">{expanded ? "▾" : "▸"}</span>
          <span>{question.question}</span>
        </div>
        <Inputs
          InputOptions={{ inputType: "checkbox", isChecked }}
          name={question.id}
          styleClass="gq-cmp-checkbox"
          onChange={onCheck}
        />
      </div>

      <div className="gq-cmp-attempts">
        {attempts.map((attempt) => (
          <div key={attempt.label} className="gq-cmp-cell">
            <span className="gq-cmp-cell-label">{attempt.label}</span>
            <AnswerPill
              chosen={attempt.selections[question.id]}
              answer={question.answer}
              options={question.options}
            />
          </div>
        ))}
      </div>

      {expanded && (
        <div className="gq-cmp-expanded">
          <div className="gq-cmp-options">
            {Object.entries(question.options).map(([key, val]) => {
              const isAnswer = key === question.answer;
              return (
                <div
                  key={key}
                  className={`gq-cmp-option${isAnswer ? " gq-cmp-option-correct" : ""}`}
                >
                  <span className="gq-cmp-option-key">
                    {key.toUpperCase()}.
                  </span>{" "}
                  {val}
                  {isAnswer && <span className="gq-cmp-option-tick">✓</span>}
                </div>
              );
            })}
          </div>
          {question.explanation && (
            <p className="gq-cmp-explanation">{question.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Result() {
  const ctx = useAppContext();

  const questionIds: Record<string, boolean> = {};
  Object.keys(ctx.rawText).forEach((key) => {
    questionIds[key] = true;
  });

  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState<string | null>(null); // saved file path
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [selectedQnID, updateSelectedQnID] =
    useState<Record<string, boolean>>(questionIds);

  const onCheck = (ev: InputChangeEvent) => {
    updateSelectedQnID((prev) => ({
      ...prev,
      [ev.target.id]: !prev[ev.target.id],
    }));
  };

  const copyToClipboard = async () => {
    if (!ctx.rawText) return;
    try {
      await navigator.clipboard.writeText(
        formatToAikenFormat(selectedQnID, ctx.rawText),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const saveToVault = async () => {
    if (!ctx.rawText || saving) return;
    setSaving(true);
    setSaveError(null);
    setSaved(null);
    try {
      const content = formatToAikenFormat(selectedQnID, ctx.rawText);
      const filePath = await ctx.saveToVault(content);
      setSaved(filePath);
      setTimeout(() => setSaved(null), 3500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
      setTimeout(() => setSaveError(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  const history = ctx.quizHistory;
  const hasMultipleAttempts = history.length > 1;
  const total = ctx.questionList.length;
  const correct = ctx.questionList.filter(
    (q) => ctx.optionsSelected[q.id] === q.answer,
  ).length;

  const allQuestionsMap = new Map<string, question>();
  history.forEach((attempt) => {
    attempt.questions.forEach((q) => {
      if (!allQuestionsMap.has(q.id)) allQuestionsMap.set(q.id, q);
    });
  });
  const allQuestions = Array.from(allQuestionsMap.values());
  const attemptScores = history.map(scoreOf);

  return (
    <div className="gq-result-page">
      <div className="gq-result-container">
        {/* Score card */}
        <div className="gq-score-card">
          <div className="gq-score-left">
            <h1>Your Results</h1>
            <p className="gq-score-sub">
              Review your answers below. Correct answers are highlighted.
            </p>
          </div>
          {hasMultipleAttempts ? (
            <div className="gq-score-multi">
              {attemptScores.map((s, i) => (
                <div key={history[i].label} className="gq-score-chip">
                  <span className="gq-score-chip-label">
                    {history[i].label}
                  </span>
                  <span
                    className={`gq-score-badge${i === attemptScores.length - 1 ? " gq-score-badge-latest" : ""}`}
                  >
                    {s.correct}/{s.total}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="gq-score-right">
              <span className="gq-score-badge">
                {correct}/{total}
              </span>
              <span className="gq-score-denom">correct</span>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="gq-toolbar">
          <span className="gq-toolbar-label">Export selected</span>

          {/* Copy */}
          <div className="gp-tool-save">
            <div
              className={`gq-copy-btn${copied ? " gq-copied" : ""}`}
              onClick={copyToClipboard}
              title="Copy selected questions to clipboard"
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </div>

            {/* Save to vault */}
            <div
              className={`gq-download-btn${saved ? " gq-saved" : ""}${saveError ? " gq-save-error" : ""}`}
              onClick={saveToVault}
              title="Save selected questions as a .md file in GenQuiZ folder"
            >
              {saving
                ? "Saving…"
                : saved
                  ? `Saved ✓`
                  : saveError
                    ? "Error — retry"
                    : "Save to Vault (.md)"}
            </div>
          </div>
        </div>

        {/* Saved path feedback */}
        {saved && (
          <div className="gq-save-notice">
            ✓ Saved to <code>{saved}</code>
          </div>
        )}
        {saveError && (
          <div className="gq-save-notice gq-save-notice-error">
            ✕ {saveError}
          </div>
        )}

        {/* Questions */}
        {hasMultipleAttempts ? (
          <div className="gq-cmp-container">
            {allQuestions.map((q) => (
              <CompareRow
                key={q.id}
                question={q}
                attempts={history}
                isChecked={selectedQnID[q.id] ?? true}
                onCheck={onCheck}
              />
            ))}
          </div>
        ) : (
          ctx.questionList.map((item) => (
            <div key={item.id} className="gq-question-card">
              <MCQ
                question={item}
                onOptionClick={() => {}}
                optionsSelected={ctx.optionsSelected[item.id] ?? null}
                isResult={true}
                isChecked={selectedQnID[item.id]}
                onCheck={onCheck}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
