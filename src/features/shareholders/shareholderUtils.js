export function normaliseShareholderType(value) {
  const type = String(value || '').trim().toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
  if (['natural_person', 'person', 'individual', 'natural'].includes(type)) return 'natural_person';
  if (['company', 'entity', 'pty_ltd', 'pty', 'private_company'].includes(type)) return 'company';
  if (['trust', 'family_trust'].includes(type)) return 'trust';
  return '';
}
