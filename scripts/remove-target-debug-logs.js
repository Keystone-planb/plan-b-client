const fs = require("fs");

const files = [
  "src/screens/LoginScreen.native.tsx",
  "src/screens/UpcomingScheduleScreen.tsx",
  "src/screens/PlanAScreen.tsx",
  "src/screens/OngoingScheduleScreen.tsx",
  "src/screens/AddScheduleLocationScreen.native.tsx",
  "src/hooks/usePlanAPlaces.ts",
  "api/auth/social.ts",
];

const targets = [
  "[LOGIN_DEBUG]",
  "[OAuth]",
  "[QA transport]",
  "[QA_DUPLICATE]",
  "[SocialAuth]",
];

function removeConsoleBlock(code, startIndex) {
  const openIndex = code.indexOf("(", startIndex);
  if (openIndex === -1) return { code, changed: false };

  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let i = openIndex; i < code.length; i += 1) {
    const ch = code[i];

    if (quote) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }

    if (ch === "(") depth += 1;

    if (ch === ")") {
      depth -= 1;

      if (depth === 0) {
        let end = i + 1;
        while (end < code.length && /[ \t]/.test(code[end])) end += 1;
        if (code[end] === ";") end += 1;
        if (code[end] === "\n") end += 1;

        let lineStart = startIndex;
        while (lineStart > 0 && code[lineStart - 1] !== "\n") lineStart -= 1;

        return {
          code: code.slice(0, lineStart) + code.slice(end),
          changed: true,
        };
      }
    }
  }

  return { code, changed: false };
}

for (const file of files) {
  if (!fs.existsSync(file)) continue;

  let code = fs.readFileSync(file, "utf8");
  let changed = false;

  let keepGoing = true;
  while (keepGoing) {
    keepGoing = false;

    for (const target of targets) {
      const targetIndex = code.indexOf(target);
      if (targetIndex === -1) continue;

      const consoleIndex = code.lastIndexOf("console.log", targetIndex);
      if (consoleIndex === -1) continue;

      const result = removeConsoleBlock(code, consoleIndex);
      if (result.changed) {
        code = result.code;
        changed = true;
        keepGoing = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(file, code);
    console.log(`updated: ${file}`);
  }
}
