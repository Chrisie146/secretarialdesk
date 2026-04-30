export function csvValue(value) {
  const text = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function csvCell(value) {
  return csvValue(value);
}

export function downloadRowsCsv(filename, rows) {
  const headers = Array.from(rows.reduce((set, row) => {
    Object.keys(row || {}).forEach((key) => set.add(key));
    return set;
  }, new Set()));
  const csv = [
    headers,
    ...rows.map((row) => headers.map((header) => row?.[header]))
  ].map((row) => row.map(csvValue).join(',')).join('\n');
  downloadTextFile(filename, csv, 'text/csv');
}

export function downloadTableCsv(filename, rows, columns) {
  const headers = columns.map(([header]) => header);
  const csv = [
    headers,
    ...rows.map((row) => columns.map(([, key]) => row?.[key]))
  ].map((row) => row.map(csvValue).join(',')).join('\n');
  downloadTextFile(filename, csv, 'text/csv');
}

export function downloadTextFile(filename, contents, type) {
  const blob = new Blob([contents], { type });
  downloadBlob(filename, blob);
}

export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function fileSafeName(name) {
  return String(name || 'company').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'company';
}
