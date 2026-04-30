import { addBusinessDays, todayIsoDate } from '../../utils/dates';

export function inferBoInterestHeld(controlBasis) {
  const basis = String(controlBasis || '').toLowerCase();
  if (basis.includes('indirect')) return 'indirect';
  if (basis.includes('control')) return 'control';
  return 'direct';
}

export function normalizeBeneficialOwnerFilingPayload(owner, company, existingOwner = null) {
  const now = new Date().toISOString();
  const idNumber = String(owner.idNumber ?? existingOwner?.idNumber ?? '').trim();
  const nationalityStatus = owner.nationalityStatus || existingOwner?.nationalityStatus || inferNationalityStatus(idNumber);
  const interestHeld = owner.interestHeld || existingOwner?.interestHeld || inferBoInterestHeld(owner.controlBasis || existingOwner?.controlBasis);
  const lastChangedAt = owner.lastChangedAt || existingOwner?.lastChangedAt || now;
  const cipcFilingDueDate = owner.cipcFilingDueDate || existingOwner?.cipcFilingDueDate || calculateBoFilingDueDate(company, lastChangedAt);
  const verificationStatus = owner.verificationStatus || existingOwner?.verificationStatus || (nationalityStatus === 'foreign_national' ? 'required' : 'not_required');
  const payload = {
    shareholderId: owner.shareholderId || existingOwner?.shareholderId || null,
    fullName: String(owner.fullName ?? existingOwner?.fullName ?? '').trim(),
    idNumber,
    ownershipPercentage: Number(owner.ownershipPercentage ?? existingOwner?.ownershipPercentage ?? 0),
    controlBasis: owner.controlBasis || existingOwner?.controlBasis || 'Direct shareholding above 5%',
    notes: owner.notes ?? existingOwner?.notes ?? '',
    dateOfBirth: owner.dateOfBirth || existingOwner?.dateOfBirth || deriveDateOfBirthFromSaId(idNumber) || '',
    address: owner.address ?? existingOwner?.address ?? '',
    email: owner.email ?? existingOwner?.email ?? '',
    nationalityStatus,
    countryOfBirth: owner.countryOfBirth ?? existingOwner?.countryOfBirth ?? '',
    passportIssuingCountry: owner.passportIssuingCountry ?? existingOwner?.passportIssuingCountry ?? '',
    verificationStatus,
    verificationDocumentId: owner.verificationDocumentId || existingOwner?.verificationDocumentId || '',
    interestHeld,
    lastChangedAt,
    cipcFilingDueDate,
    cipcFilingStatus: owner.cipcFilingStatus || existingOwner?.cipcFilingStatus || beneficialOwnerFilingStatus({ cipcFilingDueDate, nationalityStatus, verificationStatus })
  };
  payload.cipcFilingStatus = beneficialOwnerFilingStatus(payload);
  return payload;
}

export function inferNationalityStatus(idNumber) {
  if (!idNumber) return 'unknown';
  return looksLikeSaId(idNumber) ? 'south_african' : 'foreign_national';
}

export function deriveDateOfBirthFromSaId(idNumber) {
  const digits = String(idNumber || '').replace(/\D/g, '');
  if (!looksLikeSaId(digits)) return '';
  const yearPrefix = Number(digits.slice(0, 2)) <= Number(todayIsoDate().slice(2, 4)) ? '20' : '19';
  const date = `${yearPrefix}${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`;
  return Number.isNaN(new Date(`${date}T00:00:00`).getTime()) ? '' : date;
}

export function calculateBoFilingDueDate(company, lastChangedAt = null) {
  const incorporationDate = company?.incorporationDate || company?.incorporation_date || '';
  if (lastChangedAt) return addBusinessDays(new Date(lastChangedAt), 10).toISOString().slice(0, 10);
  if (incorporationDate) return addBusinessDays(new Date(`${incorporationDate}T00:00:00`), 10).toISOString().slice(0, 10);
  return addBusinessDays(new Date(), 10).toISOString().slice(0, 10);
}

export function beneficialOwnerFilingStatus(owner) {
  if (owner.cipcFilingStatus === 'filed') return 'filed';
  if (owner.cipcFilingDueDate && owner.cipcFilingDueDate < todayIsoDate()) return 'overdue';
  return beneficialOwnerMissingFields(owner).length === 0 ? 'ready' : 'not_started';
}

export function beneficialOwnerMissingFields(owner) {
  const missing = [];
  if (!owner.fullName) missing.push('Full name');
  if (!owner.idNumber) missing.push('ID/passport number');
  if (!owner.dateOfBirth) missing.push('Date of birth');
  if (!owner.address) missing.push('Address');
  if (!owner.email) missing.push('Email address');
  if (!owner.controlBasis) missing.push('Control basis');
  if (!owner.interestHeld) missing.push('Direct/indirect interest');
  if (owner.nationalityStatus === 'foreign_national') {
    if (!owner.countryOfBirth) missing.push('Country of birth');
    if (!owner.passportIssuingCountry) missing.push('Passport issuing country');
    if (!['submitted', 'verified'].includes(owner.verificationStatus)) missing.push('Foreign ID/passport verification');
  }
  return missing;
}

export function nationalityStatusLabel(status) {
  const labels = {
    south_african: 'South African',
    foreign_national: 'Foreign national',
    unknown: 'Unknown'
  };
  return labels[status] || labels.unknown;
}

export function verificationStatusLabel(status) {
  const labels = {
    not_required: 'Not required',
    required: 'Required',
    submitted: 'Submitted',
    verified: 'Verified'
  };
  return labels[status] || labels.not_required;
}

export function interestHeldLabel(status) {
  const labels = {
    direct: 'Direct',
    indirect: 'Indirect',
    direct_and_indirect: 'Direct and indirect',
    control: 'Control'
  };
  return labels[status] || labels.direct;
}

function looksLikeSaId(value) {
  return /^\d{13}$/.test(String(value || '').trim());
}
