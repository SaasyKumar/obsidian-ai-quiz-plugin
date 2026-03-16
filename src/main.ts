import {
  Plugin,
  ItemView,
  WorkspaceLeaf,
  Notice,
  TFile,
  TFolder,
} from "obsidian";
import { createRoot, type Root } from "react-dom/client";
import { createElement, StrictMode } from "react";
import { QuizApp, type QuizAppHandle } from "./components/QuizApp";
import type { VaultFile } from "./components/AppContext";
import type { question } from "./utils/extractQn";
import { extractFromAikenFormat, formatToAikenFormat } from "./utils/extractQn";
import "./styles/plugin.css";
import "./styles/additions.css";

const VIEW_TYPE_GENQUIZ = "genquiz-view";
const VAULT_FOLDER = "GenQuiZ";

// Matches [[GenQuiZ/anything.md]] wikilinks written by this plugin
const GENQUIZ_LINK_RE = /\[\[GenQuiZ\/([^\]]+\.md)\]\]/g;

// ── The Obsidian view that hosts the React tree ───────────────────────────────
class GenQuizView extends ItemView {
  private root: Root | null = null;
  private handle: QuizAppHandle | null = null;
  private saveToVault: (content: string) => Promise<string>;
  private listVaultFiles: () => Promise<VaultFile[]>;
  private loadFromVault: (path: string) => Promise<string>;

  constructor(
    leaf: WorkspaceLeaf,
    saveToVault: (content: string) => Promise<string>,
    listVaultFiles: () => Promise<VaultFile[]>,
    loadFromVault: (path: string) => Promise<string>,
  ) {
    super(leaf);
    this.saveToVault = saveToVault;
    this.listVaultFiles = listVaultFiles;
    this.loadFromVault = loadFromVault;
  }

  getViewType(): string {
    return VIEW_TYPE_GENQUIZ;
  }
  getDisplayText(): string {
    return "GenQuiZ";
  }
  getIcon(): string {
    return "brain-circuit";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    const mountEl = container.createDiv({ cls: "genquiz-root" });
    this.root = createRoot(mountEl);
    this.root.render(
      createElement(
        StrictMode,
        null,
        createElement(QuizApp, {
          onReady: (h: QuizAppHandle) => {
            this.handle = h;
          },
          saveToVault: this.saveToVault,
          listVaultFiles: this.listVaultFiles,
          loadFromVault: this.loadFromVault,
        }),
      ),
    );
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
    this.root = null;
    this.handle = null;
  }

  loadQuestionsAndStart(
    questions: question[],
    blocks: Record<string, string[]>,
  ): void {
    const attempt = (tries: number) => {
      if (this.handle) {
        this.handle.loadQuestionsAndStart(questions, blocks);
      } else if (tries > 0) {
        setTimeout(() => attempt(tries - 1), 50);
      }
    };
    attempt(20);
  }
}

// ── Plugin ────────────────────────────────────────────────────────────────────
export default class GenQuizPlugin extends Plugin {
  async onload(): Promise<void> {
    const saveToVault = this.saveToVault.bind(this);
    const listVaultFiles = this.listVaultFiles.bind(this);
    const loadFromVault = this.loadFromVault.bind(this);

    this.registerView(
      VIEW_TYPE_GENQUIZ,
      (leaf) =>
        new GenQuizView(leaf, saveToVault, listVaultFiles, loadFromVault),
    );

    this.addRibbonIcon("brain-circuit", "GenQuiZ", () => this.activateView());

    // ── Command 1: open the GenQuiZ panel ──────────────────────────────────
    this.addCommand({
      id: "open-genquiz",
      name: "Open GenQuiZ",
      callback: () => this.activateView(),
    });

    // ── Command 2: generate quiz from the active note via AI ───────────────
    this.addCommand({
      id: "generate-quiz-from-note",
      name: "Generate quiz from current note",
      editorCallback: async (_editor, ctx) => {
        const file = ctx.file;
        if (!file) {
          new Notice("GenQuiZ: No active note found.");
          return;
        }
        await this.generateFromNote(file);
      },
    });

    // ── Command 3: follow [[GenQuiZ/...]] link and load the quiz ───────────
    this.addCommand({
      id: "load-quiz-from-note",
      name: "Load quiz from current note",
      editorCallback: async (_editor, ctx) => {
        const file = ctx.file;
        if (!file) {
          new Notice("GenQuiZ: No active note found.");
          return;
        }
        await this.loadQuizFromNote(file);
      },
    });
  }

  async onunload(): Promise<void> {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_GENQUIZ);
  }

  // ── Always open GenQuiZ in a new tab ─────────────────────────────────────
  async activateView(): Promise<GenQuizView> {
    const { workspace } = this.app;

    // If already open in any tab, just focus it
    const existing = workspace.getLeavesOfType(VIEW_TYPE_GENQUIZ);
    if (existing.length > 0) {
      workspace.revealLeaf(existing[0]);
      return existing[0].view as GenQuizView;
    }

    // Open in a new tab
    const leaf = workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW_TYPE_GENQUIZ, active: true });
    workspace.revealLeaf(leaf);
    return leaf.view as GenQuizView;
  }

  // ── Generate quiz via AI: questions live in memory only until user saves ──
  async generateFromNote(file: TFile): Promise<void> {
    const notice = new Notice("GenQuiZ: Reading note…", 0);
    try {
      const noteContent = await this.app.vault.read(file);

      if (!noteContent.trim()) {
        notice.hide();
        new Notice("GenQuiZ: The note appears to be empty.");
        return;
      }

      notice.setMessage("GenQuiZ: Calling AI — this may take a few seconds…");

      const response = await fetch(
        "https://166qmtqw7g.execute-api.us-east-1.amazonaws.com/production/genquiz",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: noteContent,
            level: "Medium",
            no_of_questions: "5",
          }),
        },
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data.errorCode === "INPUT_TOO_LONG" || data.statusCode === 413) {
        throw new Error(
          "Note is too long for AI to process. Try a shorter selection.",
        );
      }
      if (data.errorCode === "BEDROCK_ERROR" || data.statusCode === 500) {
        throw new Error(data.message || "Bedrock error. Please try again.");
      }

      const aiText: string = data.body ?? "";
      if (!aiText.trim()) throw new Error("AI returned an empty response.");

      const [questions, blocks] = extractFromAikenFormat(aiText);
      if (!questions.length)
        throw new Error("No questions could be parsed from the AI response.");

      notice.hide();
      new Notice(
        `GenQuiZ: ${questions.length} questions ready — take the quiz, then save if you want to keep them.`,
      );

      // Questions live in React state only — nothing written to disk yet
      const view = await this.activateView();
      setTimeout(() => view.loadQuestionsAndStart(questions, blocks), 100);
    } catch (err: unknown) {
      notice.hide();
      const msg = err instanceof Error ? err.message : "Unknown error";
      new Notice(`GenQuiZ error: ${msg}`);
    }
  }

  // ── Load quiz: follow [[GenQuiZ/...]] link OR load file directly ──────────
  async loadQuizFromNote(file: TFile): Promise<void> {
    const notice = new Notice("GenQuiZ: Reading note…", 0);
    try {
      const content = await this.app.vault.read(file);

      // Case A: source note — find [[GenQuiZ/...]] link and follow it
      const linkMatch = GENQUIZ_LINK_RE.exec(content);
      GENQUIZ_LINK_RE.lastIndex = 0;

      if (linkMatch) {
        const linkedPath = `${VAULT_FOLDER}/${linkMatch[1]}`;
        const linkedFile = this.app.vault.getAbstractFileByPath(linkedPath);
        if (!linkedFile || !(linkedFile instanceof TFile)) {
          notice.hide();
          new Notice(`GenQuiZ: Linked file not found: ${linkedPath}`);
          return;
        }
        notice.setMessage("GenQuiZ: Loading from linked file…");
        const raw = await this.loadFromVault(linkedPath);
        await this.startQuizFromRaw(raw, linkedFile.name, notice);
        return;
      }

      // Case B: already inside a GenQuiZ file — load it directly
      const raw = await this.loadFromVault(file.path);
      await this.startQuizFromRaw(raw, file.name, notice);
    } catch (err: unknown) {
      notice.hide();
      const msg = err instanceof Error ? err.message : "Unknown error";
      new Notice(`GenQuiZ error: ${msg}`);
    }
  }

  // ── Shared: parse Aiken text and launch the quiz ──────────────────────────
  private async startQuizFromRaw(
    raw: string,
    fileName: string,
    notice: Notice,
  ): Promise<void> {
    if (!raw.trim()) {
      notice.hide();
      new Notice("GenQuiZ: No Aiken questions found in this note.");
      return;
    }
    const [questions, blocks] = extractFromAikenFormat(raw);
    if (!questions.length) {
      notice.hide();
      new Notice(
        "GenQuiZ: Could not parse any questions. Make sure the file contains Aiken-format questions.",
      );
      return;
    }
    notice.hide();
    new Notice(
      `GenQuiZ: Loaded ${questions.length} questions from "${fileName}" ✓`,
    );
    const view = await this.activateView();
    setTimeout(() => view.loadQuestionsAndStart(questions, blocks), 100);
  }

  // ── Save quiz to GenQuiZ/ and append only the wikilink to source note ─────
  async saveToVault(content: string): Promise<string> {
    const { vault, workspace } = this.app;

    // 1. Ensure GenQuiZ/ folder exists
    if (!vault.getAbstractFileByPath(VAULT_FOLDER)) {
      await vault.createFolder(VAULT_FOLDER);
    }

    // 2. Build timestamped filename
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const timestamp =
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
      `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filePath = `${VAULT_FOLDER}/quiz-${timestamp}.md`;

    // 3. Write MCQ file into GenQuiZ/
    const mdContent =
      `# GenQuiZ — Exported Questions\n` +
      `> Exported on ${now.toLocaleString()}\n\n` +
      `<!-- genquiz-aiken-start -->\n` +
      content.trimEnd() +
      `\n<!-- genquiz-aiken-end -->\n`;

    await vault.create(filePath, mdContent);

    // 4. Append ONLY the wikilink to whichever note is currently active
    const activeFile = workspace.getActiveFile();
    if (activeFile && activeFile.extension === "md") {
      await this.appendLinkToSource(activeFile, filePath);
    }

    new Notice(`GenQuiZ: Saved to ${filePath}`);
    return filePath;
  }

  // ── Append (or replace) [[GenQuiZ/...]] link at end of source note ────────
  private async appendLinkToSource(
    sourceFile: TFile,
    quizFilePath: string,
  ): Promise<void> {
    const { vault } = this.app;
    const sourceContent = await vault.read(sourceFile);

    // Remove any existing GenQuiZ link so it never stacks up
    const cleaned = sourceContent.replace(GENQUIZ_LINK_RE, "").trimEnd();
    GENQUIZ_LINK_RE.lastIndex = 0;

    await vault.modify(sourceFile, `${cleaned}\n\n[[${quizFilePath}]]\n`);
  }

  // ── List all .md files inside GenQuiZ/ sorted newest first ───────────────
  async listVaultFiles(): Promise<VaultFile[]> {
    const { vault } = this.app;
    const folder = vault.getAbstractFileByPath(VAULT_FOLDER);
    if (!folder || !(folder instanceof TFolder)) return [];

    const files: VaultFile[] = [];
    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === "md") {
        files.push({
          path: child.path,
          name: child.name,
          mtime: child.stat.mtime,
        });
      }
    }
    files.sort((a, b) => b.mtime - a.mtime);
    return files;
  }

  // ── Extract Aiken text from any .md file ──────────────────────────────────
  async loadFromVault(filePath: string): Promise<string> {
    const { vault } = this.app;
    const file = vault.getAbstractFileByPath(filePath);
    if (!file || !(file instanceof TFile))
      throw new Error(`File not found: ${filePath}`);

    const content = await vault.read(file);

    // 1. genquiz-aiken markers (primary format)
    const m = content.match(
      /<!-- genquiz-aiken-start -->\n([\s\S]*?)\n<!-- genquiz-aiken-end -->/,
    );
    if (m) return m[1].trim();

    // 2. Fenced code block (legacy)
    const c = content.match(/```[^\n]*\n([\s\S]*?)\n```/);
    if (c) return c[1].trim();

    // 3. Raw content — let the Aiken parser try
    return content.trim();
  }
}
