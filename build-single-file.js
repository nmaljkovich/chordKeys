const fs = require("node:fs");
const path = require("node:path");

const projectDir = __dirname;
const outputPath = path.resolve(process.argv[2] || path.join(projectDir, "chordKeys.html"));
let html = fs.readFileSync(path.join(projectDir, "index.html"), "utf8");
const css = fs.readFileSync(path.join(projectDir, "styles.css"), "utf8");
const chords = fs.readFileSync(path.join(projectDir, "chords.js"), "utf8");
const app = fs.readFileSync(path.join(projectDir, "app.js"), "utf8");

html = html.replace('    <link rel="stylesheet" href="styles.css">', () => `    <style>\n${css}\n    </style>`);
html = html.replace('    <script src="chords.js" defer></script>\n    <script src="app.js" defer></script>\n', "");
html = html.replace("</body>", () => `  <script>\n${chords}\n  </script>\n  <script>\n${app}\n  </script>\n</body>`);

if (html.includes('href="styles.css"') || html.includes('src="app.js"') || html.includes('src="chords.js"')) {
  throw new Error("Could not inline all local assets. Check the asset tags in index.html.");
}

fs.writeFileSync(outputPath, html);
console.log(`Created standalone app: ${outputPath}`);
