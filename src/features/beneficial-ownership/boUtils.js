export function inferBoInterestHeld(controlBasis) {
  const basis = String(controlBasis || '').toLowerCase();
  if (basis.includes('indirect')) return 'indirect';
  if (basis.includes('control')) return 'control';
  return 'direct';
}
