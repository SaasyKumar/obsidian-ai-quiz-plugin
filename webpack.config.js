const path = require("path");
const builtins = require("builtin-modules");

module.exports = (env, argv) => {
  const prod = argv.mode === "production";

  return {
    entry: "./src/main.ts",
    output: {
      path: path.resolve(__dirname),
      filename: "main.js",
      libraryTarget: "commonjs2",
      clean: false,
    },
    target: "node",
    mode: prod ? "production" : "development",
    devtool: prod ? false : "inline-source-map",
    externals: [
      "obsidian",
      "electron",
      "@codemirror/autocomplete",
      "@codemirror/collab",
      "@codemirror/commands",
      "@codemirror/language",
      "@codemirror/lint",
      "@codemirror/search",
      "@codemirror/state",
      "@codemirror/view",
      "@lezer/common",
      "@lezer/highlight",
      "@lezer/lr",
      ...builtins,
    ],
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx"],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: "ts-loader",
            options: {
              transpileOnly: false,
              configFile: path.resolve(__dirname, "tsconfig.json"),
            },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
  };
};
