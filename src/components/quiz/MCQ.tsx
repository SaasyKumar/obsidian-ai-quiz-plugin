import React from "react";
import type { question } from "../../utils/extractQn";
import Button from "../Button";
import Inputs, { type InputChangeEvent } from "../Inputs";

export default function MCQ({
  question,
  onOptionClick,
  optionsSelected,
  showAnswer = false,
  isResult = false,
  isChecked = false,
  onCheck = () => {},
}: {
  question: question;
  onOptionClick?: (key: string, id: string) => void;
  optionsSelected: string | null;
  showAnswer?: boolean;
  isResult?: boolean;
  isChecked?: boolean;
  onCheck?: ((ev: InputChangeEvent) => void) | (() => void);
}) {
  if (isResult) showAnswer = true;

  const selectabilityClass = showAnswer
    ? "gq-option-static"
    : "gq-option-selectable";

  const options = Object.keys(question.options).map((key) => {
    const selected = !!optionsSelected && optionsSelected === key;
    const answerAttributes = showAnswer
      ? {
          isCorrectAnswer: key === question.answer,
          isWrongAnswer: selected && key !== question.answer,
        }
      : {};

    return (
      <Button
        key={key}
        isSelected={selected}
        buttonStyle={`gq-option ${selectabilityClass}`}
        {...answerAttributes}
        onClick={() => onOptionClick?.(key, question.id)}
        content={question.options[key]}
      />
    );
  });

  const questionDiv = isResult ? (
    <div className="gq-result-qn">
      <h3>{question.question}</h3>
      <Inputs
        InputOptions={{ inputType: "checkbox", isChecked }}
        name={question.id}
        styleClass="gq-checkbox"
        onChange={onCheck}
      />
    </div>
  ) : (
    <h3 className="gq-question-text">{question.question}</h3>
  );

  return (
    <div key={question.id}>
      {questionDiv}
      {options}
      {showAnswer && question.explanation && (
        <p className="gq-explanation">{question.explanation}</p>
      )}
    </div>
  );
}
