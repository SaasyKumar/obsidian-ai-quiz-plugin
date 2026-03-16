import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { question } from "../utils/extractQn";

export type QuizAttempt = {
  label: string;
  questions: question[];
  selections: Record<string, string>;
};

export type AppView =
  | "menu"
  | "generate"
  | "load"
  | "vault-files"
  | "quiz"
  | "result";

export type VaultFile = {
  path: string; // full vault path, e.g. "GenQuiZ/quiz-2025-06-15-143022.md"
  name: string; // display name, e.g. "quiz-2025-06-15-143022.md"
  mtime: number; // last modified timestamp (ms)
};

export type AppContextType = {
  view: AppView;
  setView: (v: AppView) => void;
  rawText: Record<string, string[]>;
  updateRawText: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  questionList: question[];
  setQuestionsList: React.Dispatch<React.SetStateAction<question[]>>;
  optionsSelected: Record<string, string>;
  setSelectedOption: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  quizHistory: QuizAttempt[];
  addQuizAttempt: (attempt: QuizAttempt) => void;
  clearQuizHistory: () => void;
  /** Save selected questions as .md in GenQuiZ/; returns the file path */
  saveToVault: (content: string) => Promise<string>;
  /** List all .md files in the GenQuiZ vault folder */
  listVaultFiles: () => Promise<VaultFile[]>;
  /** Read a vault file, extract Aiken content, return raw text */
  loadFromVault: (path: string) => Promise<string>;
};

export const appContext = createContext<AppContextType | null>(null);

export function useAppContext(): AppContextType {
  const ctx = useContext(appContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
}

// ── Imperative bridge ─────────────────────────────────────────────────────────
export type ImperativeBridge = {
  loadQuestionsAndStart: (
    questions: question[],
    blocks: Record<string, string[]>,
  ) => void;
};

export function AppProvider({
  children,
  onBridgeReady,
  saveToVault,
  listVaultFiles,
  loadFromVault,
}: {
  children: ReactNode;
  onBridgeReady?: (bridge: ImperativeBridge) => void;
  saveToVault: (content: string) => Promise<string>;
  listVaultFiles: () => Promise<VaultFile[]>;
  loadFromVault: (path: string) => Promise<string>;
}) {
  const [view, setViewState] = useState<AppView>("menu");
  const [rawText, updateRawText] = useState<Record<string, string[]>>({});
  const [questionList, setQuestionsList] = useState<question[]>([]);
  const [optionsSelected, setSelectedOption] = useState<Record<string, string>>(
    {},
  );
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);

  const setView = useCallback((v: AppView) => setViewState(v), []);
  const addQuizAttempt = useCallback((attempt: QuizAttempt) => {
    setQuizHistory((prev) => [...prev, attempt]);
  }, []);
  const clearQuizHistory = useCallback(() => setQuizHistory([]), []);

  useEffect(() => {
    if (!onBridgeReady) return;
    const bridge: ImperativeBridge = {
      loadQuestionsAndStart(questions, blocks) {
        updateRawText(blocks);
        setQuestionsList(questions);
        setSelectedOption({});
        setQuizHistory([]);
        setViewState("quiz");
      },
    };
    onBridgeReady(bridge);
     
  }, [onBridgeReady]);

  return (
    <appContext.Provider
      value={{
        view,
        setView,
        rawText,
        updateRawText,
        questionList,
        setQuestionsList,
        optionsSelected,
        setSelectedOption,
        quizHistory,
        addQuizAttempt,
        clearQuizHistory,
        saveToVault,
        listVaultFiles,
        loadFromVault,
      }}
    >
      {children}
    </appContext.Provider>
  );
}
