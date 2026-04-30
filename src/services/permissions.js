export function buildPermissions(role) {
  const normalizedRole = role || 'read_only';
  const canManagePractice = normalizedRole === 'owner';
  const canEditCompany = ['owner', 'admin', 'member'].includes(normalizedRole);
  const canEditBoRecords = ['owner', 'admin', 'member'].includes(normalizedRole);
  const canGenerateFilingPack = ['owner', 'admin'].includes(normalizedRole);
  const canSubmitFiling = ['owner', 'admin'].includes(normalizedRole);
  const canDeleteRecords = ['owner', 'admin'].includes(normalizedRole);

  return {
    role: normalizedRole,
    canManagePractice,
    canEditCompany,
    canEditBoRecords,
    canGenerateFilingPack,
    canSubmitFiling,
    canDeleteRecords,
    isReadOnly: !canEditCompany
  };
}

export function roleLabel(role) {
  return {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    read_only: 'Read-only'
  }[role] || 'Read-only';
}
