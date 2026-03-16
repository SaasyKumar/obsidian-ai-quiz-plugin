import React, { useRef, useState } from "react";
import DOMPurify from "dompurify";
import { extractFromAikenFormat } from "../../utils/extractQn";
import { useAppContext } from "../AppContext";
import Button from "../Button";
import Inputs from "../Inputs";

export default function GenerateQuiz() {
  const maximumQuestions = 10;
  const [text, updateText] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("Medium");
  const [questionCount, setQuestionCount] = useState("5");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ctx = useAppContext();

  function handleFileChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    if (!file) return;
    setError(null);
    setWarning(null);
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = DOMPurify.sanitize((e.target?.result as string) ?? "");
      updateText(content);
    };
    reader.onerror = () => {
      setError(
        "Could not read the uploaded file. Please try a different file.",
      );
      clearFile();
    };
    reader.readAsText(file);
  }

  function clearFile() {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submitToBedrock() {
    if (loading) return;
    if (!text.trim() && !uploadedFile) {
      setError(
        "Please paste some study material or upload a file before generating.",
      );
      return;
    }
    setError(null);
    setWarning(null);
    setLoading(true);

    try {
      let response: Response;
      if (uploadedFile) {
        const formData = new FormData();
        formData.append("content", uploadedFile, uploadedFile.name);
        formData.append("level", difficultyLevel);
        formData.append("no_of_questions", questionCount);
        response = await fetch(
          "https://166qmtqw7g.execute-api.us-east-1.amazonaws.com/production/genquiz",
          { method: "POST", body: formData },
        );
      } else {
        response = await fetch(
          "https://166qmtqw7g.execute-api.us-east-1.amazonaws.com/production/genquiz",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: text,
              level: difficultyLevel,
              no_of_questions: questionCount,
            }),
          },
        );
      }

      if (!response.ok) {
        const status = response.status;
        if (status >= 500)
          throw new Error("The server encountered an error. Please try again.");
        if (status === 429)
          throw new Error(
            "Too many requests. Please wait a moment and try again.",
          );
        throw new Error(`Request failed (HTTP ${status}). Please try again.`);
      }

      const data = await response.json();

      if (data.errorCode === "INPUT_TOO_LONG" || data.statusCode === 413) {
        throw new Error(
          "Your content is too long. Please shorten it and try again.",
        );
      }
      if (data.errorCode === "BEDROCK_ERROR" || data.statusCode === 500) {
        throw new Error(
          data.message || "The server encountered an error. Please try again.",
        );
      }

      const responseText: string = data.body ?? "";
      if (!responseText.trim())
        throw new Error("The AI returned an empty response. Please try again.");

      const extract = extractFromAikenFormat(responseText);
      const questions = extract[0];
      if (!questions || questions.length === 0) {
        throw new Error(
          "No questions could be parsed. Try adding more detailed content.",
        );
      }
      if (data.truncated) {
        setWarning(
          "Your content was truncated before generation. Questions are based on the first portion of your material.",
        );
      }

      ctx.updateRawText(extract[1]);
      ctx.setQuestionsList(questions);
      ctx.clearQuizHistory();
      ctx.setSelectedOption({});
      ctx.setView("quiz");
    } catch (err: unknown) {
      if (err instanceof TypeError) {
        setError("Could not reach the server. Please check your connection.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleBlur() {
    let num = Number(questionCount);
    if (isNaN(num)) num = 5;
    const clamped = Math.max(5, Math.min(maximumQuestions, num));
    setQuestionCount(String(clamped));
  }

  return (
    <div className="gq-body">
      <div className="gq-container">
        {loading && (
          <div className="gq-loading-overlay">
            <div className="gq-spinner" />
            <p className="gq-loading-text">Generating your quiz…</p>
            <p className="gq-loading-sub">
              Talking to Bedrock, this may take a few seconds
            </p>
          </div>
        )}

        {/* Back button */}
        <button className="gq-back-link" onClick={() => ctx.setView("menu")}>
          ← Back
        </button>

        <h1>Generate a New Quiz</h1>

        {error && (
          <div className="gq-banner gq-banner-error">
            <span className="gq-banner-msg">{error}</span>
            <button
              className="gq-banner-dismiss"
              onClick={() => setError(null)}
            >
              ✕
            </button>
          </div>
        )}
        {warning && (
          <div className="gq-banner gq-banner-warning">
            <span className="gq-banner-msg">{warning}</span>
            <button
              className="gq-banner-dismiss"
              onClick={() => setWarning(null)}
            >
              ✕
            </button>
          </div>
        )}

        <div className="gq-options-row">
          <Inputs
            name="level"
            labelContent="Difficulty Level"
            InputOptions={{
              inputType: "select",
              option: ["Easy", "Medium", "Hard"],
            }}
            defaultValue={difficultyLevel}
            onChange={(ev) =>
              setDifficultyLevel(
                (ev as React.ChangeEvent<HTMLSelectElement>).target.value,
              )
            }
          />
          <Inputs
            name="questions"
            labelContent="Number of Questions"
            InputOptions={{
              inputType: "number",
              min: 1,
              max: 10,
              onBlur: handleBlur,
            }}
            defaultValue={questionCount}
            onChange={(ev) =>
              setQuestionCount(
                (ev as React.ChangeEvent<HTMLInputElement>).target.value,
              )
            }
          />
        </div>

        <div className="gq-label-row">
          <h4>Paste your study material below:</h4>
          <div className="gq-file-area">
            {uploadedFile ? (
              <div className="gq-file-chip">
                <span className="gq-file-chip-name">{uploadedFile.name}</span>
                <button
                  className="gq-file-chip-clear"
                  onClick={clearFile}
                  title="Remove file"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="gq-file-label-btn">
                Upload File
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
        </div>

        <Inputs
          name="text-input"
          InputOptions={{
            inputType: "text",
            styleClass: "gq-textarea-main",
            placeholderContent:
              "Paste your notes, textbook excerpts, or articles here — GenQuiZ will do the rest...",
          }}
          onChange={(ev) => {
            updateText(
              DOMPurify.sanitize(
                (ev as React.ChangeEvent<HTMLTextAreaElement>).target.value,
              ),
            );
            if (uploadedFile) clearFile();
            if (error) setError(null);
          }}
        />

        <Button
          buttonStyle="gq-submit-btn"
          variant="primary"
          onClick={submitToBedrock}
          disabled={loading}
          content={loading ? "Generating…" : "Generate Quiz"}
        />
      </div>
    </div>
  );
}
