import { documentLabel } from '../features/documents/documentUtils';
import { normaliseShareholderType } from '../features/shareholders/shareholderUtils';
import { inferBoInterestHeld } from '../features/beneficial-ownership/boUtils';
import { formatCompanyDueDate } from '../utils/dates';

export function mapCompanyRow(row) {
  return {
    id: row.id,
    name: row.name,
    registrationNumber: row.registration_number,
    type: row.company_type,
    status: row.compliance_status,
    incorporationDate: row.incorporation_date || '',
    registeredAddress: row.registered_address || '',
    nextDueDate: formatCompanyDueDate(row.next_due_date),
    nextDueDateRaw: row.next_due_date || null,
    shareholders: Array.isArray(row.shareholders) ? row.shareholders.length : 0
  };
}

export function createEmptyCompanyDetail() {
  return {
    directors: [],
    shareholders: [],
    beneficialOwners: [],
    trustReviews: [],
    entityOwnershipReviews: [],
    directorChanges: [],
    shareTransactions: [],
    documents: [],
    contacts: [],
    tasks: [],
    activity: [],
    filingPacks: [],
    mandatePrepared: false
  };
}

export function mapDirectorRow(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    idNumber: row.id_number || '',
    appointmentDate: row.appointment_date || ''
  };
}

export function mapShareholderRow(row) {
  return {
    id: row.id,
    shareholderType: normaliseShareholderType(row.shareholder_type) || row.shareholder_type,
    name: row.name,
    idNumber: row.id_number || '',
    ownershipPercentage: Number(row.ownership_percentage || 0),
    trustProfileId: row.trust_profile_id || ''
  };
}

export function mapBeneficialOwnerRow(row) {
  return {
    id: row.id,
    shareholderId: row.shareholder_id || '',
    fullName: row.full_name,
    idNumber: row.id_number || '',
    ownershipPercentage: Number(row.ownership_percentage || 0),
    controlBasis: row.control_basis || '',
    notes: row.notes || '',
    dateOfBirth: row.date_of_birth || '',
    address: row.address || '',
    email: row.email || '',
    nationalityStatus: row.nationality_status || 'unknown',
    countryOfBirth: row.country_of_birth || '',
    passportIssuingCountry: row.passport_issuing_country || '',
    verificationStatus: row.verification_status || 'not_required',
    verificationDocumentId: row.verification_document_id || '',
    interestHeld: row.interest_held || inferBoInterestHeld(row.control_basis),
    lastChangedAt: row.last_changed_at || '',
    cipcFilingDueDate: row.cipc_filing_due_date || '',
    cipcFilingStatus: row.cipc_filing_status || 'not_started',
    createdAt: row.created_at || ''
  };
}

export function mapTrustReviewRow(row) {
  return {
    id: row.id,
    shareholderId: row.shareholder_id || '',
    trustProfileId: row.trust_profile_id || '',
    trustees: Array.isArray(row.trustees) ? row.trustees : [],
    beneficiaries: Array.isArray(row.beneficiaries) ? row.beneficiaries : [],
    founders: Array.isArray(row.founders) ? row.founders : [],
    controllers: Array.isArray(row.controllers) ? row.controllers : [],
    notes: row.notes || '',
    reviewedAt: row.reviewed_at || '',
    createdAt: row.created_at || ''
  };
}

export function mapTrustProfileRow(row) {
  return {
    id: row.id,
    practiceId: row.practice_id,
    name: row.name,
    registrationNumber: row.registration_number || '',
    masterReference: row.master_reference || '',
    notes: row.notes || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || ''
  };
}

export function mapEntityOwnershipReviewRow(row) {
  return {
    id: row.id,
    shareholderId: row.shareholder_id || '',
    owners: Array.isArray(row.owners) ? row.owners : [],
    notes: row.notes || '',
    reviewedAt: row.reviewed_at || '',
    createdAt: row.created_at || ''
  };
}

export function mapDocumentRow(row) {
  return {
    id: row.id,
    documentType: row.document_type,
    originalFilename: row.original_filename || documentLabel(row.document_type),
    filePath: row.file_path || null,
    status: row.status || 'complete',
    extractedData: row.extracted_data || {}
  };
}

export function mapAnalysisJobRow(row) {
  const document = Array.isArray(row.documents) ? row.documents[0] : row.documents;
  return {
    id: row.id,
    practiceId: row.practice_id,
    companyId: row.company_id || null,
    documentId: row.document_id,
    analysisType: row.analysis_type || 'company_onboarding',
    status: row.status || 'queued',
    extractedData: row.extracted_data || {},
    reviewedData: row.reviewed_data || {},
    confidenceSummary: row.confidence_summary || {},
    errorMessage: row.error_message || '',
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
    document: document ? mapDocumentRow(document) : null
  };
}

export function mapContactRow(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    role: row.role || '',
    email: row.email || '',
    phone: row.phone || '',
    notes: row.notes || ''
  };
}

export function mapTaskRow(row) {
  return {
    id: row.id,
    contactId: row.contact_id || '',
    title: row.title,
    taskType: row.task_type || '',
    dueDate: row.due_date || '',
    status: row.status || 'open',
    notes: row.notes || ''
  };
}

export function mapActivityRow(row) {
  return {
    id: row.id,
    action: row.action,
    subjectType: row.subject_type || '',
    subjectId: row.subject_id || '',
    details: row.details || {},
    createdAt: row.created_at
  };
}

export function mapPracticeActivityRow(row) {
  const companyProfile = Array.isArray(row.company_profiles) ? row.company_profiles[0] : row.company_profiles;
  return {
    ...mapActivityRow(row),
    companyId: row.company_id || '',
    companyName: companyProfile?.name || 'Company'
  };
}

export function mapFilingPackRow(row) {
  return {
    id: row.id,
    boRegisterPdfPath: row.bo_register_pdf_path,
    boRegisterCsvPath: row.bo_register_csv_path,
    mandatePdfPath: row.mandate_pdf_path,
    submissionStatus: row.submission_status || 'not_submitted',
    submittedAt: row.submitted_at || '',
    cipcReference: row.cipc_reference || '',
    submissionNotes: row.submission_notes || '',
    generatedAt: row.generated_at
  };
}

export function mapDirectorChangeRow(row) {
  return {
    id: row.id,
    changeType: row.change_type,
    existingDirectorId: row.existing_director_id || '',
    fullName: row.full_name || '',
    idNumber: row.id_number || '',
    effectiveDate: row.effective_date || '',
    boardResolutionReceived: Boolean(row.board_resolution_received),
    signedCor39Received: Boolean(row.signed_cor39_received),
    submissionStatus: row.submission_status || 'draft',
    cipcReference: row.cipc_reference || '',
    notes: row.notes || '',
    acceptedAt: row.accepted_at || '',
    createdAt: row.created_at || ''
  };
}

export function mapShareTransactionRow(row) {
  return {
    id: row.id,
    transactionType: row.transaction_type,
    fromShareholderId: row.from_shareholder_id || '',
    toShareholderId: row.to_shareholder_id || '',
    toShareholderType: row.to_shareholder_type || 'natural_person',
    toShareholderName: row.to_shareholder_name || '',
    toShareholderIdNumber: row.to_shareholder_id_number || '',
    ownershipPercentage: Number(row.ownership_percentage || 0),
    shareClass: row.share_class || 'Ordinary',
    transactionDate: row.transaction_date || '',
    consideration: row.consideration || '',
    supportingDocsReceived: Boolean(row.supporting_docs_received),
    status: row.status || 'draft',
    notes: row.notes || '',
    acceptedAt: row.accepted_at || '',
    createdAt: row.created_at || ''
  };
}
