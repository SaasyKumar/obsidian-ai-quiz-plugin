import React, { useState } from "react";
import DOMPurify from "dompurify";
import { extractFromAikenFormat } from "../../utils/extractQn";
import { useAppContext } from "../AppContext";
import Button from "../Button";
import Inputs from "../Inputs";

export default function LoadQuiz() {
  const [text, updateText] = useState("");
  const [textBlured, blurText] = useState(false);
  const ctx = useAppContext();

  function loadQuiz() {
    if (!text.trim()) return;
    const extract = extractFromAikenFormat(text);
    ctx.setQuestionsList(extract[0]);
    ctx.updateRawText(extract[1]);
    ctx.clearQuizHistory();
    ctx.setSelectedOption({});
    ctx.setView("quiz");
  }

  const loadFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileText = await file.text();
    const extract = extractFromAikenFormat(fileText);
    ctx.setQuestionsList(extract[0]);
    ctx.updateRawText(extract[1]);
    ctx.clearQuizHistory();
    ctx.setSelectedOption({});
    ctx.setView("quiz");
  };

  return (
    <div className="gq-body">
      <div className="gq-container">
        {/* Back button */}
        <button className="gq-back-link" onClick={() => ctx.setView("menu")}>
          ← Back
        </button>

        <h1>Parse Quiz from Text</h1>

        <div className="gq-label-row">
          <h4>Paste your questions in Aiken format:</h4>
          <Inputs
            name="file-load"
            styleClass="gq-file-label-btn"
            labelContent="Upload File"
            InputOptions={{ inputType: "file", acceptTypes: ".txt,.md" }}
            onChange={
              loadFromFile as (
                ev:
                  | React.ChangeEvent<HTMLInputElement>
                  | React.ChangeEvent<HTMLSelectElement>
                  | React.ChangeEvent<HTMLTextAreaElement>,
              ) => void
            }
          />
        </div>

        <Inputs
          name="text-input"
          InputOptions={{
            inputType: "text",
            styleClass: "gq-textarea-main",
            placeholderContent:
              "Paste your Aiken-formatted questions here and we'll parse them instantly...",
            blurTextBox: textBlured,
          }}
          onChange={(ev) => {
            const value = DOMPurify.sanitize(
              (ev as React.ChangeEvent<HTMLTextAreaElement>).target.value,
            );
            updateText(value);
            if (value === "" && textBlured) blurText(false);
            else if (value !== "" && !textBlured) blurText(true);
          }}
        />

        <Button
          buttonStyle="gq-submit-btn"
          onClick={loadQuiz}
          variant="primary"
          content="Parse Quiz"
        />
      </div>
    </div>
  );
}
