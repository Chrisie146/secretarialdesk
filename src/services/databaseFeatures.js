export function createDatabaseFeatureStatus(overrides = {}) {
  return {
    available: true,
    checked: false,
    setupRequired: false,
    error: '',
    ...overrides
  };
}

export function createDefaultDatabaseFeatures() {
  return {
    directorChanges: createDatabaseFeatureStatus(),
    shareTransactions: createDatabaseFeatureStatus()
  };
}

export function isMissingRelationError(error) {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  return error.code === '42P01' ||
    message.includes('does not exist') ||
    message.includes('could not find the table') ||
    message.includes('schema cache');
}

export function databaseFeatureStatusFromError(error) {
  if (!error) return createDatabaseFeatureStatus({ checked: true });
  return createDatabaseFeatureStatus({
    available: false,
    checked: true,
    setupRequired: isMissingRelationError(error),
    error: error.message || 'Database access is unavailable for this workflow.'
  });
}

export function databaseFeatureUnavailableMessage(label, feature) {
  if (feature?.setupRequired) {
    return `${label} requires migration 016_secretarial_filing_workflows.sql to be run in Supabase. Existing company records can still be viewed.`;
  }
  return feature?.error || `${label} is temporarily unavailable.`;
}
