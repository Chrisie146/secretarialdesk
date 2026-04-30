export function auditSnapshot(value) {
  if (!value) return null;
  return JSON.parse(JSON.stringify(value));
}

export function buildCompanyProfileAuditDetails(before, after) {
  const fields = ['name', 'registrationNumber', 'type', 'incorporationDate', 'registeredAddress'];
  const changes = fields
    .filter((field) => String(before?.[field] || '') !== String(after?.[field] || ''))
    .map((field) => ({
      field,
      before: before?.[field] || '',
      after: after?.[field] || ''
    }));

  return {
    label: after?.name || before?.name || 'Company profile',
    summary: changes.length ? `${changes.length} company profile field${changes.length === 1 ? '' : 's'} changed` : 'Company profile saved with no tracked field changes',
    changes,
    before: auditSnapshot(before),
    after: auditSnapshot(after)
  };
}

export function buildTrustReviewAuditDetails(shareholder, before, after) {
  const counts = {
    trustees: (after?.trustees || []).length,
    beneficiaries: (after?.beneficiaries || []).length,
    founders: (after?.founders || []).length,
    controllers: (after?.controllers || []).length
  };
  const total = counts.trustees + counts.beneficiaries + counts.founders + counts.controllers;

  return {
    label: shareholder?.name || 'Trust review saved',
    summary: `${shareholder?.name || 'Trust'} review saved with ${total} trust person record${total === 1 ? '' : 's'}`,
    ...counts,
    before: auditSnapshot(before),
    after: auditSnapshot(after)
  };
}

export function buildEntityReviewAuditDetails(shareholder, before, after) {
  const owners = after?.owners || [];
  const naturalPersonCount = owners.filter((owner) => owner.ownerType === 'natural_person').length;
  const qualifyingCount = owners.filter((owner) => owner.ownerType === 'natural_person' && Number(owner.ownershipPercentage || 0) > 5).length;

  return {
    label: shareholder?.name || 'Entity ownership review saved',
    summary: `${shareholder?.name || 'Company shareholder'} look-through saved with ${owners.length} underlying owner${owners.length === 1 ? '' : 's'}`,
    underlyingOwnerCount: owners.length,
    naturalPersonCount,
    qualifyingOwnerCount: qualifyingCount,
    before: auditSnapshot(before),
    after: auditSnapshot(after)
  };
}

export function buildAnnualReturnAuditDetails(before, after) {
  return {
    label: 'Annual return updated',
    summary: `Annual return filed${after?.annualReturnReference ? ` with CIPC reference ${after.annualReturnReference}` : ''}. Next due date set to ${after?.nextDueDate || 'Not set'}.`,
    reference: after?.annualReturnReference || '',
    before: auditSnapshot({
      nextDueDate: before?.nextDueDateRaw || '',
      annualReturnReference: before?.annualReturnReference || ''
    }),
    after: auditSnapshot({
      filedDate: after?.annualReturnLastFiledDate || '',
      nextDueDate: after?.nextDueDateRaw || '',
      annualReturnReference: after?.annualReturnReference || ''
    })
  };
}

export function buildTaskAuditDetails(before, after) {
  return {
    label: after?.title || before?.title || 'Follow-up task',
    taskType: after?.taskType || before?.taskType || 'General',
    summary: before?.status && before.status !== after?.status
      ? `${after?.title || before?.title || 'Follow-up task'} changed from ${before.status} to ${after?.status || 'open'}`
      : `${after?.title || before?.title || 'Follow-up task'} updated`,
    before: auditSnapshot(before),
    after: auditSnapshot(after)
  };
}
