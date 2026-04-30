export const initialCompanies = [
  {
    id: 1,
    name: 'Mafadi Consulting Pty Ltd',
    registrationNumber: '2021/123456/07',
    type: 'Pty Ltd',
    incorporationDate: '2021-02-12',
    status: 'Compliant',
    nextDueDate: '12 Feb 2026',
    nextDueDateRaw: '2026-02-12',
    shareholders: 4
  },
  {
    id: 2,
    name: 'Ikhaya Holdings Pty Ltd',
    registrationNumber: '2020/987654/07',
    type: 'Pty Ltd',
    incorporationDate: '2020-06-03',
    status: 'Due Soon',
    nextDueDate: '03 Jun 2026',
    nextDueDateRaw: '2026-06-03',
    shareholders: 7
  },
  {
    id: 3,
    name: 'Thanda Operations Pty Ltd',
    registrationNumber: '2019/456789/07',
    type: 'Pty Ltd',
    incorporationDate: '2019-05-15',
    status: 'Action Required',
    nextDueDate: '15 May 2026',
    nextDueDateRaw: '2026-05-15',
    shareholders: 3
  }
];

export const initialCompanyDetails = {
  1: {
    directors: [
      { id: 'd-1', fullName: 'Nomsa Dlamini', idNumber: '8001015009087', appointmentDate: '2021-02-12' }
    ],
    shareholders: [
      { id: 's-1', shareholderType: 'natural_person', name: 'Nomsa Dlamini', idNumber: '8001015009087', ownershipPercentage: 62 },
      { id: 's-2', shareholderType: 'natural_person', name: 'Johan Botha', idNumber: '7905055009081', ownershipPercentage: 38 }
    ],
    beneficialOwners: [
      { id: 'bo-1', shareholderId: 's-1', fullName: 'Nomsa Dlamini', idNumber: '8001015009087', ownershipPercentage: 62, controlBasis: 'Direct shareholding above 5%' }
    ],
    trustReviews: [],
    entityOwnershipReviews: [],
    directorChanges: [],
    shareTransactions: [],
    documents: [
      { id: 'doc-1', documentType: 'share_register', originalFilename: 'Mafadi share register.pdf' },
      { id: 'doc-2', documentType: 'mandate_to_file', originalFilename: 'Mandate to file.pdf' }
    ],
    contacts: [
      { id: 'c-1', fullName: 'Nomsa Dlamini', role: 'Director', email: 'nomsa@example.co.za', phone: '+27 82 000 0000', notes: 'Primary mandate signatory.' }
    ],
    tasks: [
      { id: 't-1', title: 'Confirm signed mandate', taskType: 'Mandate', dueDate: '2026-05-05', status: 'open', contactId: 'c-1', notes: 'Send final mandate after BO register review.' }
    ],
    activity: [
      { id: 'a-1', action: 'shareholder_added', subjectType: 'shareholder', details: { label: 'Nomsa Dlamini added as beneficial owner' }, createdAt: '2026-04-25T08:00:00Z' }
    ],
    filingPacks: [],
    mandatePrepared: true
  },
  2: {
    directors: [
      { id: 'd-2', fullName: 'Ayesha Khan', idNumber: '8508120087082', appointmentDate: '2020-08-01' }
    ],
    shareholders: [
      { id: 's-3', shareholderType: 'trust', name: 'Ikhaya Family Trust', idNumber: '', ownershipPercentage: 55 },
      { id: 's-4', shareholderType: 'company', name: 'Cape Growth Holdings Pty Ltd', idNumber: '', ownershipPercentage: 45 }
    ],
    beneficialOwners: [],
    trustReviews: [],
    entityOwnershipReviews: [],
    directorChanges: [],
    shareTransactions: [],
    documents: [
      { id: 'doc-3', documentType: 'share_register', originalFilename: 'Ikhaya share register.pdf' }
    ],
    contacts: [
      { id: 'c-2', fullName: 'Ayesha Khan', role: 'Director', email: 'ayesha@example.co.za', phone: '+27 83 000 0000', notes: 'Request Trust Deed before filing.' }
    ],
    tasks: [
      { id: 't-2', title: 'Request Ikhaya Family Trust Deed', taskType: 'Trust Deed', dueDate: '2026-05-03', status: 'open', contactId: 'c-2', notes: 'Needed before BO finalisation.' }
    ],
    activity: [
      { id: 'a-2', action: 'task_created', subjectType: 'task', details: { label: 'Trust Deed request created' }, createdAt: '2026-04-25T10:30:00Z' }
    ],
    filingPacks: [],
    mandatePrepared: false
  },
  3: {
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
  }
};
