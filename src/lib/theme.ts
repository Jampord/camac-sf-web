// Light/dark mode without a library: a saved choice in localStorage, else the phone's setting.

export const THEME_STORAGE_KEY = "theme";

/**
 * Inlined in <head> so it runs before the first paint (no flash of the wrong theme).
 * Wrapped in try/catch: localStorage can throw in private browsing.
 */
export const themeInitScript = `(function () {
  try {
    var saved = localStorage.getItem("${THEME_STORAGE_KEY}");
    var dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();`;
