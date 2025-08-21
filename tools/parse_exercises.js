// Node script to parse img/EjerciciosNuevos.txt into src/exercises.json
// Usage: node tools/parse_exercises.js

const fs = require('fs');
const path = require('path');

const ROOT = __dirname ? path.join(__dirname, '..') : process.cwd();
const INPUT_PATH = path.join(ROOT, 'img', 'EjerciciosNuevos.txt');
const OUTPUT_PATH = path.join(ROOT, 'src', 'exercises.json');

function normalizeCategory(raw) {
  if (!raw) return 'Otros';
  const s = String(raw).trim().toLowerCase();
  // Map known headings to Spanish categories used in UI
  if (/^abs\b/.test(s)) return 'Abdomen';
  if (/^calf\b/.test(s)) return 'Pantorrilla';
  if (/^chest\b/.test(s)) return 'Pecho';
  if (/^gluts?\b/.test(s)) return 'Glúteos';
  if (/^hamstring\b/.test(s)) return 'Femoral';
  if (/^quadriceps\b/.test(s)) return 'Cuádriceps';
  if (/^shoulder\b/.test(s)) return 'Hombro';
  if (/^biceps\b/.test(s)) return 'Bíceps';
  if (/^lats\b/.test(s)) return 'Espalda';
  return raw.trim();
}

function isSeparator(line) {
  return /^=+\s*$/.test(line);
}

function isUrl(line) {
  return /https?:\/\//i.test(line);
}

function parse() {
  const text = fs.readFileSync(INPUT_PATH, 'utf8');
  const lines = text.split(/\r?\n/);

  const data = {};
  let currentCategory = null;
  let pendingName = null;

  const pushExercise = (category, name, link) => {
    if (!name || !link) return;
    const cleanName = String(name).trim().replace(/\s+/g, ' ');
    const cleanLink = String(link).trim();
    if (!cleanName || !cleanLink) return;
    if (!data[category]) data[category] = [];
    // Deduplicate by name (case-insensitive)
    const exists = data[category].some(e => String(e.name || '').toLowerCase() === cleanName.toLowerCase());
    if (!exists) data[category].push({ name: cleanName, link: cleanLink });
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = (raw || '').trim();
    if (!line) continue;

    if (isSeparator(line)) {
      // Ignore separator lines
      continue;
    }

    // Detect category headers by standalone words commonly used
    if (/^(abs|calf|chest|gluts?|hamstring|quadriceps|shoulder|biceps|lats)\s*$/i.test(line)) {
      currentCategory = normalizeCategory(line);
      pendingName = null;
      if (!data[currentCategory]) data[currentCategory] = [];
      continue;
    }

    // If we don't have a category yet, skip until first header
    if (!currentCategory) continue;

    // Expect name followed by link (possibly with blank lines between)
    if (!isUrl(line)) {
      // It's a name; store until we get the URL
      pendingName = line;
      continue;
    } else {
      // It's a URL; pair with last pending name
      if (pendingName) {
        pushExercise(currentCategory, pendingName, line);
        pendingName = null;
        continue;
      }
      // If URL appears without a pending name, try to look back one line
      const prev = (lines[i - 1] || '').trim();
      if (prev && !isUrl(prev) && !isSeparator(prev)) {
        pushExercise(currentCategory, prev, line);
        pendingName = null;
      }
    }
  }

  // Sort categories and exercises alphabetically for consistency
  const sorted = {};
  Object.keys(data).sort((a, b) => a.localeCompare(b, 'es')).forEach(cat => {
    sorted[cat] = (data[cat] || []).sort((x, y) => String(x.name).localeCompare(String(y.name), 'es'));
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sorted, null, 2), 'utf8');
  console.log(`Wrote ${OUTPUT_PATH} with ${Object.values(sorted).reduce((n, arr) => n + arr.length, 0)} exercises across ${Object.keys(sorted).length} categories.`);
}

if (require.main === module) {
  parse();
}

module.exports = { parse };


