import React from "react";
import { useAppContext } from "./AppContext";

export default function MainMenu() {
  const { setView } = useAppContext();

  return (
    <div className="gq-menu-body">
      <div className="gq-menu-container">
        <h1 className="gq-menu-title">GenQuiZ</h1>
        <p className="gq-menu-sub">
          Generate AI-powered quizzes from your notes, or load existing
          Aiken-format questions — all without leaving Obsidian.
        </p>

        {/* ── From-note tip ── */}
        <div className="gq-tip-banner">
          <span className="gq-tip-icon">⌨</span>
          <div>
            <strong>Quick generate from a note</strong>
            <p>
              Open any note and run{" "}
              <kbd>GenQuiZ: Generate quiz from current note</kbd> from the
              command palette. The AI will read your note, write the questions
              back into it, and open the quiz here automatically.
            </p>
          </div>
        </div>

        <div className="gq-menu-cards">
          {/* Generate */}
          <div className="gq-menu-card" onClick={() => setView("generate")}>
            <div className="gq-menu-card-icon">✦</div>
            <h2>Generate Quiz</h2>
            <p>
              Paste any study material, choose difficulty and question count,
              and let AI craft questions for you.
            </p>
            <button className="gq-btn gq-btn-primary">Generate Quiz →</button>
          </div>

          {/* Load from vault */}
          <div className="gq-menu-card" onClick={() => setView("vault-files")}>
            <div className="gq-menu-card-icon">📂</div>
            <h2>Load from Vault</h2>
            <p>
              Pick a previously saved quiz from your <code>GenQuiZ/</code>{" "}
              folder and jump straight back into it.
            </p>
            <button className="gq-btn gq-btn-primary">Browse Saved →</button>
          </div>

          {/* Load from text */}
          <div className="gq-menu-card" onClick={() => setView("load")}>
            <div className="gq-menu-card-icon">⊞</div>
            <h2>Load from Text</h2>
            <p>
              Paste or upload raw Aiken-format questions and jump straight into
              quiz mode.
            </p>
            <button className="gq-btn gq-btn-secondary">Paste Text →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
