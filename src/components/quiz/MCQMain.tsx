import React, { useState } from "react";
import { useAppContext } from "../AppContext";
import MCQ from "./MCQ";
import Stopwatch from "./Stopwatch";
import Button from "../Button";

const MAX_RETRIES = 2;

export default function MCQMain() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showRetryModal, setShowRetryModal] = useState(false);
  const ctx = useAppContext();

  function onOptionClick(value: string, questionId: string) {
    ctx.setSelectedOption((prev) => ({ ...prev, [questionId]: value }));
  }

  function next() {
    setCurrentQuestionIndex((i) => i + 1);
    setShowAnswer(false);
  }

  function previous() {
    setCurrentQuestionIndex((i) => i - 1);
    setShowAnswer(false);
  }

  function snapshotAttempt() {
    const attemptNumber = ctx.quizHistory.length + 1;
    const label =
      attemptNumber === 1 ? `Attempt ${1}` : `Retry ${attemptNumber - 1}`;
    ctx.addQuizAttempt({
      label,
      questions: [...ctx.questionList],
      selections: { ...ctx.optionsSelected },
    });
  }

  function submit() {
    const total = ctx.questionList.length;
    const wrong = ctx.questionList.filter(
      (q) => ctx.optionsSelected[q.id] !== q.answer,
    ).length;
    const wrongPct = total > 0 ? wrong / total : 0;
    const retriesDone = ctx.quizHistory.length;

    if (wrongPct > 0.3 && retriesDone < MAX_RETRIES) {
      setShowRetryModal(true);
    } else {
      snapshotAttempt();
      ctx.setView("result");
    }
  }

  function goToResult() {
    snapshotAttempt();
    setShowRetryModal(false);
    ctx.setView("result");
  }

  function startRetryTest() {
    snapshotAttempt();
    const wrongQuestions = ctx.questionList.filter(
      (q) => ctx.optionsSelected[q.id] !== q.answer,
    );
    ctx.setQuestionsList(wrongQuestions);
    ctx.setSelectedOption({});
    setShowRetryModal(false);
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
  }

  if (ctx.questionList.length === 0) {
    return (
      <div className="gq-body">
        <div className="gq-container">
          <button className="gq-back-link" onClick={() => ctx.setView("menu")}>
            ← Back
          </button>
          <p>No questions found. Please generate or load a quiz first.</p>
        </div>
      </div>
    );
  }

  const total = ctx.questionList.length;
  const progressPct = ((currentQuestionIndex + 1) / total) * 100;
  const isLast = currentQuestionIndex === total - 1;
  const wrongCount = ctx.questionList.filter(
    (q) => ctx.optionsSelected[q.id] !== q.answer,
  ).length;
  const wrongPct = total > 0 ? Math.round((wrongCount / total) * 100) : 0;
  const retriesRemaining = MAX_RETRIES - ctx.quizHistory.length;

  return (
    <div className="gq-body">
      <div className="gq-container gq-quiz-container">
        {/* Top bar */}
        <div className="gq-top-bar">
          <Button
            variant="primary"
            buttonStyle="gq-back-btn"
            onClick={() => ctx.setView("menu")}
            content="Back"
          />
          <span className="gq-counter">
            {currentQuestionIndex + 1} / {total}
          </span>
          <Stopwatch />
        </div>

        {/* Progress */}
        <div className="gq-progress-track">
          <div
            className="gq-progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <MCQ
          question={ctx.questionList[currentQuestionIndex]}
          onOptionClick={onOptionClick}
          optionsSelected={
            ctx.optionsSelected[ctx.questionList[currentQuestionIndex].id] ??
            null
          }
          showAnswer={showAnswer}
        />

        <div className="gq-actions">
          <Button
            variant="primary"
            buttonStyle="gq-prev-btn"
            disabled={currentQuestionIndex === 0}
            onClick={previous}
            content="Previous"
          />
          {isLast ? (
            <Button
              buttonStyle="gq-submit-btn gq-submit-green"
              variant="primary"
              onClick={submit}
              content="Submit Quiz"
            />
          ) : (
            <Button
              buttonStyle="gq-next-btn"
              variant="primary"
              onClick={next}
              content="Next"
            />
          )}
        </div>
      </div>

      {/* Retry Modal */}
      {showRetryModal && (
        <div className="gq-modal-overlay">
          <div className="gq-modal">
            <div className="gq-modal-icon">⚠️</div>
            <h2 className="gq-modal-title">You missed a few!</h2>
            <p className="gq-modal-body">
              You got {wrongCount} out of {total} questions wrong ({wrongPct}%).
              Want to retry just those questions before seeing your results?
            </p>
            <p className="gq-modal-hint">
              Retry mode will start a new quiz with only your incorrect answers
              — {retriesRemaining}{" "}
              {retriesRemaining === 1 ? "retry" : "retries"} remaining.
            </p>
            <div className="gq-modal-actions">
              <button className="gq-modal-btn-secondary" onClick={goToResult}>
                View Results
              </button>
              <button className="gq-modal-btn-primary" onClick={startRetryTest}>
                Retry Wrong Answers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
