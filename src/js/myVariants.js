// Variants saved in the variant editor ("My variants"). They are kept in the
// browser's local storage and loaded on every page load.

const LIBRARY_STORAGE_KEY = "MyVariants";

// Returns the saved variants as [{ name, text }].
export function loadLibrary() {
  try {
    const entries = JSON.parse(localStorage.getItem(LIBRARY_STORAGE_KEY));
    if (Array.isArray(entries)) {
      return entries.filter(
        (e) => e && typeof e.name == "string" && typeof e.text == "string",
      );
    }
  } catch (e) {
    console.warn("Cannot read the saved variants:", e);
  }
  return [];
}

export function saveLibrary(entries) {
  try {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch (e) {
    console.warn("Cannot save the variants:", e);
    return false;
  }
}

// The template ([name:template]) a saved variant is based on, or null.
export function templateOf(entry) {
  const match = entry.text.match(/^\s*\[[^\]:]*:([^\]]*)\]\s*$/m);
  return match ? match[1].trim() : null;
}

// The variants.ini of the saved variants. Variants are defined after the
// saved variants they are based on, so that their templates exist.
export function libraryText(entries) {
  const byname = new Map(entries.map((e) => [e.name, e]));
  const ordered = [];
  const visit = (entry, path) => {
    if (ordered.includes(entry) || path.includes(entry)) {
      return;
    }
    const template = byname.get(templateOf(entry));
    if (template) {
      visit(template, path.concat([entry]));
    }
    ordered.push(entry);
  };
  entries.forEach((entry) => visit(entry, []));
  return ordered.map((e) => e.text).join("\n\n") + "\n";
}
