export function parseDelimitedText(text) {
  const source = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!source) return [];
  const delimiter = source.includes('\t') ? '\t' : source.includes(';') && !source.includes(',') ? ';' : ',';
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '"' && next === '"' && inQuotes) {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if (char === '\n' && !inQuotes) {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  rows.push(row);
  return rows;
}

export function normalizeHeader(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export function valueByHeader(rowObject, aliases) {
  for (const alias of aliases) {
    const normalized = normalizeHeader(alias);
    if (rowObject[normalized]) return rowObject[normalized];
  }
  return '';
}

export function normalizeImportDate(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const slashMatch = trimmed.match(/^(\d{4})[\/](\d{1,2})[\/](\d{1,2})$/);
  if (slashMatch) {
    return `${slashMatch[1]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[3].padStart(2, '0')}`;
  }
  const southAfricanMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (southAfricanMatch) {
    return `${southAfricanMatch[3]}-${southAfricanMatch[2].padStart(2, '0')}-${southAfricanMatch[1].padStart(2, '0')}`;
  }
  return '';
}

export function parseJsonCell(value, fallback) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function parseBool(value) {
  return ['true', '1', 'yes', 'y', 'received', 'accepted'].includes(String(value || '').trim().toLowerCase());
}

export function uuidOrUndefined(value, isUuid) {
  return isUuid(value) ? value : undefined;
}

export function uuidOrNull(value, isUuid) {
  return isUuid(value) ? value : null;
}

export function cleanPayload(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}
