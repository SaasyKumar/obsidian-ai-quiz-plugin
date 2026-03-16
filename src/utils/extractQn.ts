export type question = {
  id: string;
  question: string;
  options: Record<string, string>;
  answer: string;
  explanation: string;
};

function isQuestionStart(line: string): boolean {
  if (/^Question:/i.test(line)) return true;
  if (/^\d+[.)\s]/.test(line)) return true;
  return false;
}

export function extractFromAikenFormat(
  data: string,
): [question[], Record<string, string[]>] {
  const allLines = data.trim().replace(/\r\n/g, "\n").split("\n");
  const blocks: Record<string, string[]> = {};
  let current: string[] | null = null;

  for (const line of allLines) {
    if (isQuestionStart(line)) {
      current = [line];
      blocks[crypto.randomUUID()] = current;
    } else if (current !== null) {
      current.push(line);
    }
  }

  const optionPattern = /^([a-zA-Z])[).] (.+)/;

  const result: question[] = Object.keys(blocks).map((key) => {
    const lines = blocks[key];
    const question = lines[0].replace(/^Question:\s*/i, "").trim();

    const options: Record<string, string> = {};
    let answer = "";
    let explanation = "";
    let inExplanation = false;

    for (const line of lines.slice(1)) {
      if (/^ANSWER:/i.test(line)) {
        inExplanation = false;
        const answerMatch = line.match(/ANSWER:\s*([a-zA-Z])/i);
        if (answerMatch) answer = answerMatch[1].toLowerCase();
        continue;
      }
      if (/^EXPLANATION:/i.test(line)) {
        inExplanation = true;
        const explanationMatch = line.match(/EXPLANATION:\s*(.*)/i);
        if (explanationMatch) explanation = explanationMatch[1];
        continue;
      }
      if (inExplanation) {
        explanation += (explanation ? " " : "") + line;
        continue;
      }
      const optionMatch = line.match(optionPattern);
      if (optionMatch) {
        options[optionMatch[1].toLowerCase()] = optionMatch[2].trim();
      }
    }

    return {
      id: key,
      question,
      options,
      answer,
      explanation: explanation.trim(),
    };
  });

  return [result, blocks];
}

export function formatToAikenFormat(
  selectedIDs: Record<string, boolean>,
  blockSet: Record<string, string[]>,
) {
  let text = "";
  Object.keys(selectedIDs).forEach((key) => {
    if (selectedIDs[key]) {
      text += blockSet[key].join("\n");
      text += "\n\n";
    }
  });
  return text;
}
