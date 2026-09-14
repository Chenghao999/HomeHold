// Shared web-ext settings, picked up automatically by `web-ext build` and
// `web-ext lint`. Keeping the ignore list in one place means the linter and the
// packager can never disagree about what the extension actually contains.
export default {
  sourceDir: ".",
  artifactsDir: "dist",
  ignoreFiles: [
    // Development-only files: none of these belong in the shipped package.
    "tools",
    "scripts",
    ".github",
    ".web-ext-config.mjs",
    "README*.md",
    "intro.md",
    ".gitignore",
    "package.json",
    "package-lock.json",
    "node_modules",
    "dist",
  ],
  build: {
    overwriteDest: true,
  },
};
