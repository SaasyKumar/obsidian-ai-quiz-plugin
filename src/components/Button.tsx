import React from "react";

export default function Button({
  onClick,
  variant,
  titleContent,
  content,
  disabled,
  isSelected,
  isCorrectAnswer,
  isWrongAnswer,
  buttonStyle,
}: {
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  variant?: string;
  titleContent?: string;
  content: string;
  disabled?: boolean;
  isSelected?: boolean;
  isCorrectAnswer?: boolean;
  isWrongAnswer?: boolean;
  buttonStyle?: string;
}) {
  const classes = [
    "gq-button",
    variant === "primary" ? "gq-button-primary" : "",
    buttonStyle ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const dataAttrs: Record<string, string> = {};
  if (disabled) dataAttrs["data-disabled"] = "true";
  if (isSelected) dataAttrs["data-selected"] = "true";
  if (isCorrectAnswer) dataAttrs["data-correct"] = "true";
  else if (isWrongAnswer) dataAttrs["data-wrong"] = "true";

  return (
    <div
      className={classes}
      title={titleContent}
      onClick={(ev) => {
        if (!disabled) onClick?.(ev);
      }}
      {...dataAttrs}
    >
      {content}
    </div>
  );
}
