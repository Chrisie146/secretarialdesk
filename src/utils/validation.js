export function isValidCompanyRegistrationNumber(value) {
  return /^\d{4}\/\d{6}\/\d{2}$/.test(String(value || '').trim());
}

export function normalizeCompanyRegistrationNumber(value) {
  const trimmed = String(value || '').trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 12) {
    return `${digits.slice(0, 4)}/${digits.slice(4, 10)}/${digits.slice(10, 12)}`;
  }
  return trimmed.replace(/\\/g, '/');
}

export function looksLikeSaId(value) {
  return /^\d{13}$/.test(String(value || '').trim());
}

export function isValidSaIdNumber(value) {
  const id = String(value || '').trim();
  if (!/^\d{13}$/.test(id)) return false;
  const digits = id.split('').map(Number);
  const check = digits[12];
  const oddSum = digits.filter((_, index) => index % 2 === 0 && index < 12).reduce((sum, digit) => sum + digit, 0);
  const evenNumber = digits.filter((_, index) => index % 2 === 1 && index < 12).join('');
  const evenSum = String(Number(evenNumber) * 2).split('').reduce((sum, digit) => sum + Number(digit), 0);
  const calculated = (10 - ((oddSum + evenSum) % 10)) % 10;
  return calculated === check;
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export function isValidOwnershipPercentage(value) {
  const num = Number(value);
  return !Number.isNaN(num) && num >= 0 && num <= 100;
}

export function findDuplicateRecords(records, label, nameKey = 'name') {
  const issues = [];
  const byId = new Map();
  const byName = new Map();
  records.forEach((record) => {
    const idNumber = String(record.idNumber || '').trim().toLowerCase();
    const name = String(record[nameKey] || '').trim().toLowerCase();
    if (idNumber) {
      byId.set(idNumber, [...(byId.get(idNumber) || []), record]);
    }
    if (name) {
      byName.set(name, [...(byName.get(name) || []), record]);
    }
  });
  byId.forEach((items, idNumber) => {
    if (items.length > 1) {
      issues.push({
        key: `${label}-duplicate-id-${idNumber}`,
        title: `Duplicate ${label} ID`,
        detail: `${items.length} ${label} records share ID/passport ${idNumber}.`
      });
    }
  });
  byName.forEach((items, name) => {
    if (items.length > 1) {
      issues.push({
        key: `${label}-duplicate-name-${name}`,
        title: `Duplicate ${label} name`,
        detail: `${items.length} ${label} records use the name "${items[0][nameKey]}".`
      });
    }
  });
  return issues;
}
