import React, { useCallback, useRef } from "react";
import {
  AppProvider,
  type ImperativeBridge,
  type VaultFile,
} from "./AppContext";
import { useAppContext } from "./AppContext";
import MainMenu from "./MainMenu";
import GenerateQuiz from "./generate/GenerateQuiz";
import LoadQuiz from "./load/LoadQuiz";
import VaultFiles from "./vault/VaultFiles";
import MCQMain from "./quiz/MCQMain";
import Result from "./quiz/Result";
import type { question } from "../utils/extractQn";

export type QuizAppHandle = {
  loadQuestionsAndStart: (
    questions: question[],
    blocks: Record<string, string[]>,
  ) => void;
};

function AppInner() {
  const { view } = useAppContext();
  switch (view) {
    case "generate":
      return <GenerateQuiz />;
    case "load":
      return <LoadQuiz />;
    case "vault-files":
      return <VaultFiles />;
    case "quiz":
      return <MCQMain />;
    case "result":
      return <Result />;
    default:
      return <MainMenu />;
  }
}

export function QuizApp({
  onReady,
  saveToVault,
  listVaultFiles,
  loadFromVault,
}: {
  onReady?: (handle: QuizAppHandle) => void;
  saveToVault: (content: string) => Promise<string>;
  listVaultFiles: () => Promise<VaultFile[]>;
  loadFromVault: (path: string) => Promise<string>;
}) {
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const handleBridgeReady = useCallback((bridge: ImperativeBridge) => {
    onReadyRef.current?.({
      loadQuestionsAndStart: bridge.loadQuestionsAndStart,
    });
  }, []);

  return (
    <AppProvider
      onBridgeReady={handleBridgeReady}
      saveToVault={saveToVault}
      listVaultFiles={listVaultFiles}
      loadFromVault={loadFromVault}
    >
      <div className="gq-app">
        <AppInner />
      </div>
    </AppProvider>
  );
}
