import React from "react";

export type InputChangeEvent =
  | React.ChangeEvent<HTMLInputElement>
  | React.ChangeEvent<HTMLSelectElement>
  | React.ChangeEvent<HTMLTextAreaElement>;

type SelectOptions = { inputType: "select"; option: string[] };
type NumberOptions = {
  inputType: "number";
  min: number;
  max: number;
  onBlur?: () => void;
};
type FileOptions = { inputType: "file"; acceptTypes: string };
type TextOptions = {
  inputType: "text";
  styleClass: string;
  placeholderContent?: string;
  blurTextBox?: boolean;
};
type CheckBox = { inputType: "checkbox"; isChecked: boolean };

export default function Inputs({
  name,
  styleClass = "",
  labelContent = "",
  InputOptions,
  defaultValue,
  onChange,
}: {
  name: string;
  labelContent?: string;
  styleClass?: string;
  InputOptions:
    | SelectOptions
    | NumberOptions
    | FileOptions
    | TextOptions
    | CheckBox;
  onChange: ((ev: InputChangeEvent) => void) | (() => void);
  defaultValue?: string;
}) {
  if (InputOptions.inputType === "number") {
    return (
      <div className={`gq-input-container ${styleClass}`}>
        <label htmlFor={name}>{labelContent}</label>
        <input
          id={name}
          name={name}
          className="gq-input"
          type="number"
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          value={defaultValue}
          onBlur={InputOptions.onBlur}
        />
      </div>
    );
  }

  if (InputOptions.inputType === "select") {
    return (
      <div className={`gq-input-container ${styleClass}`}>
        <label htmlFor={name}>{labelContent}</label>
        <div className="gq-select-wrapper">
          <select
            id={name}
            className="gq-select"
            onChange={onChange as React.ChangeEventHandler<HTMLSelectElement>}
            defaultValue={defaultValue}
          >
            {InputOptions.option.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <span className="gq-dropdown-arrow">▾</span>
        </div>
      </div>
    );
  }

  if (InputOptions.inputType === "file") {
    return (
      <label className={`gq-file-label ${styleClass}`}>
        {labelContent}
        <input
          id={name}
          name={name}
          type="file"
          accept={InputOptions.acceptTypes}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
        />
      </label>
    );
  }

  if (InputOptions.inputType === "text") {
    return (
      <textarea
        className={`gq-textarea ${InputOptions.styleClass ?? ""}`}
        placeholder={InputOptions.placeholderContent}
        id={name}
        onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
        data-blur={InputOptions.blurTextBox ? "true" : undefined}
      />
    );
  }

  if (InputOptions.inputType === "checkbox") {
    return (
      <label
        className={`gq-checkbox-label ${styleClass}`}
        data-checked={InputOptions.isChecked ? "true" : "false"}
      >
        <input
          id={name}
          name={name}
          type="checkbox"
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
        />
      </label>
    );
  }

  return null;
}
