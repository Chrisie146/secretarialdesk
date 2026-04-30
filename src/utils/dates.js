export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function formatCompanyDueDate(value) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not set';
}

export function calculateNextAnnualReturnDue(incorporationDate, afterDate = todayIsoDate()) {
  if (!incorporationDate) return null;
  const incorporation = new Date(`${incorporationDate}T00:00:00`);
  const after = new Date(`${afterDate}T00:00:00`);
  if (Number.isNaN(incorporation.getTime()) || Number.isNaN(after.getTime())) return null;

  let year = after.getFullYear();
  let anniversary = new Date(year, incorporation.getMonth(), incorporation.getDate());
  let due = addBusinessDays(anniversary, 30);
  while (due <= after) {
    year += 1;
    anniversary = new Date(year, incorporation.getMonth(), incorporation.getDate());
    due = addBusinessDays(anniversary, 30);
  }
  return due.toISOString().slice(0, 10);
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addBusinessDays(date, days) {
  const next = new Date(date);
  if (Number.isNaN(next.getTime())) return addDays(new Date(), days);
  let added = 0;
  while (added < days) {
    next.setDate(next.getDate() + 1);
    const day = next.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return next;
}
