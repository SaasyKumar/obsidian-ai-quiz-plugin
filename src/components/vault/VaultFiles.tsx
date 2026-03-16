import React, { useEffect, useState } from "react";
import { useAppContext, type VaultFile } from "../AppContext";
import { extractFromAikenFormat } from "../../utils/extractQn";

export default function VaultFiles() {
  const ctx = useAppContext();

  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);

  // Load file list on mount
  useEffect(() => {
    let cancelled = false;
    ctx
      .listVaultFiles()
      .then((f) => {
        if (!cancelled) {
          setFiles(f);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to list files");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLoad(file: VaultFile) {
    if (loadingFile) return;
    setLoadingFile(file.path);
    setError(null);
    try {
      const raw = await ctx.loadFromVault(file.path);
      const [questions, blocks] = extractFromAikenFormat(raw);
      if (!questions.length)
        throw new Error("No questions found in this file.");
      ctx.updateRawText(blocks);
      ctx.setQuestionsList(questions);
      ctx.setSelectedOption({});
      ctx.clearQuizHistory();
      ctx.setView("quiz");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file");
    } finally {
      setLoadingFile(null);
    }
  }

  function formatDate(mtime: number) {
    return new Date(mtime).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="gq-body">
      <div className="gq-container gq-vault-container">
        <button className="gq-back-link" onClick={() => ctx.setView("menu")}>
          ← Back
        </button>

        <h1>Load from Vault</h1>
        <p className="gq-vault-sub">
          Saved quizzes in your <code>GenQuiZ/</code> folder. Click any file to
          start the quiz.
        </p>

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

        {loading && (
          <div className="gq-vault-loading">
            <div className="gq-spinner" />
            <span>Reading GenQuiZ folder…</span>
          </div>
        )}

        {!loading && files.length === 0 && !error && (
          <div className="gq-vault-empty">
            <div className="gq-vault-empty-icon">📂</div>
            <p>No saved quizzes yet.</p>
            <p className="gq-vault-empty-hint">
              Generate a quiz and click <strong>Save to Vault (.md)</strong> on
              the results page — files will appear here.
            </p>
          </div>
        )}

        {!loading && files.length > 0 && (
          <ul className="gq-vault-list">
            {files.map((file) => (
              <li
                key={file.path}
                className={`gq-vault-item${loadingFile === file.path ? " gq-vault-item-loading" : ""}`}
                onClick={() => handleLoad(file)}
              >
                <div className="gq-vault-item-left">
                  <span className="gq-vault-item-icon">📄</span>
                  <div className="gq-vault-item-info">
                    <span className="gq-vault-item-name">{file.name}</span>
                    <span className="gq-vault-item-date">
                      {formatDate(file.mtime)}
                    </span>
                  </div>
                </div>
                <div className="gq-vault-item-right">
                  {loadingFile === file.path ? (
                    <span className="gq-vault-item-spinner" />
                  ) : (
                    <span className="gq-vault-item-arrow">▶</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
