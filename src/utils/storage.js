export function readStoredValue(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStoredValue(key, value) {
  try {
    if (value === null || value === undefined || value === '') {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, String(value));
    }
  } catch {
    // Ignore storage failures so private browsing or locked storage never breaks the app.
  }
}
