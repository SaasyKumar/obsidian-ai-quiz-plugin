# GenQuiZ — Obsidian Plugin

An Obsidian plugin that brings **GenQuiZ** directly into your vault.  
Generate AI-powered MCQ quizzes from your notes, or load existing questions in Aiken format — all without leaving Obsidian.

---

## Features

- **Generate Quiz** — paste study material, choose difficulty and question count, and let AWS Bedrock (Amazon Nova Pro) produce MCQs for you.
- **Load Quiz** — paste or upload Aiken-format questions (`.txt` / `.md`) and jump straight into quiz mode.
- **Interactive quiz** — one question at a time, progress bar, stopwatch, and a retry-wrong-answers flow.
- **Results & export** — review answers, select questions via checkboxes, copy to clipboard or download as `.txt`.

---

## Tech stack

| Layer       | Technology                                    |
| ----------- | --------------------------------------------- |
| Plugin host | Obsidian API (`ItemView`)                     |
| UI          | React 18 (mounted into the view)              |
| Bundler     | **Webpack 5** → single `main.js`              |
| Language    | TypeScript 5                                  |
| Styling     | Plain CSS (`style-loader` injects at runtime) |

---

## Project structure

```
obsidian-ai-quiz-plugin/
├── manifest.json              # Obsidian plugin manifest
├── webpack.config.js          # Webpack config → outputs main.js
├── tsconfig.json
├── package.json
└── src/
    ├── main.ts                # Plugin entry: registers ItemView, mounts React
    ├── styles/
    │   └── plugin.css         # All component styles (no CSS modules)
    ├── utils/
    │   └── extractQn.ts       # Aiken-format parser
    └── components/
        ├── QuizApp.tsx        # Root React component (view router)
        ├── AppContext.tsx     # React context + provider
        ├── MainMenu.tsx       # Landing screen (Generate / Load cards)
        ├── Button.tsx
        ├── Inputs.tsx
        ├── generate/
        │   └── GenerateQuiz.tsx
        ├── load/
        │   └── LoadQuiz.tsx
        └── quiz/
            ├── MCQ.tsx
            ├── MCQMain.tsx
            ├── Result.tsx
            └── Stopwatch.tsx
```

---

## Development

### Prerequisites

- Node.js ≥ 18
- An Obsidian vault for testing

### Install dependencies

```bash
npm install
```

### Build (production)

```bash
npm run build
```

This produces a single `main.js` in the project root.

### Watch mode (development)

```bash
npm run dev
```

### Install into Obsidian

1. Run `npm run build`.
2. Copy `main.js` and `manifest.json` into your vault's plugin folder:
   ```
   <your-vault>/.obsidian/plugins/obsidian-ai-quiz-plugin/
   ```
3. In Obsidian → **Settings → Community Plugins**, enable **GenQuiZ**.
4. Click the 🧠 ribbon icon or run the **Open GenQuiZ** command.

> **Tip for rapid iteration:** symlink the project folder directly into `.obsidian/plugins/` so every `npm run build` is immediately picked up.

---

## Notes

- The Generate Quiz feature calls a **public AWS API Gateway** endpoint backed by an AWS Lambda + Amazon Bedrock (Nova Pro). No API key is needed.
- No user data is stored server-side; everything lives in the Obsidian view's React state.
- The plugin is desktop and mobile compatible (Obsidian mobile supports community plugins).
