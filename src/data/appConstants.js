export const STORAGE_KEYS = {
  workspaceView: 'secretarialdesk.workspaceView',
  selectedCompanyId: 'secretarialdesk.selectedCompanyId',
  companyDetailTab: 'secretarialdesk.companyDetailTab'
};

export const VALID_WORKSPACE_VIEWS = ['dashboard', 'companies', 'deadlines', 'trusts', 'documents', 'filingPack', 'followUps', 'settings'];
export const VALID_COMPANY_DETAIL_TABS = ['shareholders', 'ownershipMap', 'boRegister', 'directors', 'contacts', 'tasks', 'activity'];

export const BENEFICIAL_OWNER_SELECT = 'id, shareholder_id, full_name, id_number, ownership_percentage, control_basis, notes, date_of_birth, address, email, nationality_status, country_of_birth, passport_issuing_country, verification_status, verification_document_id, interest_held, last_changed_at, cipc_filing_due_date, cipc_filing_status, created_at';
export const BENEFICIAL_OWNER_SELECT_WITH_COMPANY = `company_id, ${BENEFICIAL_OWNER_SELECT}`;

export const beneficialOwnerControlBasisOptions = [
  'Direct shareholding above 5%',
  'Indirect ownership',
  'Voting rights',
  'Trustee / trust controller',
  'Beneficiary',
  'Founder / settlor',
  'Board appointment rights',
  'Other effective control'
];
