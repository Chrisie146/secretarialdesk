import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  BrainCircuit,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Database,
  FileArchive,
  FileText,
  LayoutDashboard,
  Lock,
  LockKeyhole,
  Menu,
  Plus,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  X
} from 'lucide-react';
import './styles.css';
import { hasSupabaseConfig, supabase, supabaseEnvStatus } from './supabaseClient';

const initialCompanies = [
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

const initialCompanyDetails = {
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

const beneficialOwnerControlBasisOptions = [
  'Direct shareholding above 5%',
  'Indirect ownership',
  'Voting rights',
  'Trustee / trust controller',
  'Beneficiary',
  'Founder / settlor',
  'Board appointment rights',
  'Other effective control'
];

function createDatabaseFeatureStatus(overrides = {}) {
  return {
    available: true,
    checked: false,
    setupRequired: false,
    error: '',
    ...overrides
  };
}

function createDefaultDatabaseFeatures() {
  return {
    directorChanges: createDatabaseFeatureStatus(),
    shareTransactions: createDatabaseFeatureStatus()
  };
}

function isMissingRelationError(error) {
  if (!error) return false;
  const message = String(error.message || '').toLowerCase();
  return error.code === '42P01' ||
    message.includes('does not exist') ||
    message.includes('could not find the table') ||
    message.includes('schema cache');
}

function databaseFeatureStatusFromError(error) {
  if (!error) return createDatabaseFeatureStatus({ checked: true });
  return createDatabaseFeatureStatus({
    available: false,
    checked: true,
    setupRequired: isMissingRelationError(error),
    error: error.message || 'Database access is unavailable for this workflow.'
  });
}

function databaseFeatureUnavailableMessage(label, feature) {
  if (feature?.setupRequired) {
    return `${label} requires migration 016_secretarial_filing_workflows.sql to be run in Supabase. Existing company records can still be viewed.`;
  }
  return feature?.error || `${label} is temporarily unavailable.`;
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SecretarialDesk recovered from a render error', error, errorInfo);
    this.setState({ errorInfo });
  }

  reset = () => {
    this.setState({ error: null, errorInfo: null, showDetails: false });
    this.props.onRecover?.();
  };

  reload = () => {
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState((current) => ({ showDetails: !current.showDetails }));
  };

  render() {
    if (!this.state.error) return this.props.children;

    const details = [
      this.state.error?.message,
      this.state.errorInfo?.componentStack
    ].filter(Boolean).join('\n\n');

    return (
      <CrashRecoveryScreen
        details={details}
        showDetails={this.state.showDetails}
        onBack={this.reset}
        onReload={this.reload}
        onToggleDetails={this.toggleDetails}
      />
    );
  }
}

function CrashRecoveryScreen({ details, showDetails, onBack, onReload, onToggleDetails }) {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-5 py-10 text-ink">
      <div className="w-full max-w-2xl rounded-lg border border-ink/10 bg-white p-6 shadow-panel">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-red-50 text-red-700">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              The workspace hit a render error. Your Supabase data has not been deleted; return to the dashboard or reload the app.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onBack} className="rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white">
            Back to dashboard
          </button>
          <button type="button" onClick={onReload} className="rounded-md border border-ink/15 px-5 py-3 text-sm font-semibold text-ink/70 hover:bg-paper">
            Reload app
          </button>
          {details && (
            <button type="button" onClick={onToggleDetails} className="rounded-md border border-gold/60 px-5 py-3 text-sm font-semibold text-gold hover:bg-gold/5">
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
          )}
        </div>

        {showDetails && details && (
          <pre className="mt-5 max-h-72 overflow-auto rounded-md bg-ink px-4 py-3 text-xs leading-5 text-white">
            {details}
          </pre>
        )}
      </div>
    </div>
  );
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const [view, setView] = useState(params.get('view') === 'dashboard' ? 'dashboard' : 'landing');
  const [companies, setCompanies] = useState(initialCompanies);
  const [showCompanyForm, setShowCompanyForm] = useState(params.get('addCompany') === '1');
  const [session, setSession] = useState(null);
  const [practice, setPractice] = useState(null);
  const [isLoading, setIsLoading] = useState(hasSupabaseConfig);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(
    initialCompanies.find((company) => String(company.id) === params.get('companyId')) || null
  );
  const [companyDetails, setCompanyDetails] = useState(initialCompanyDetails);
  const [practiceActivity, setPracticeActivity] = useState(buildRecentActivity(initialCompanies, initialCompanyDetails));
  const [isSavingDetail, setIsSavingDetail] = useState(false);
  const [practiceMembers, setPracticeMembers] = useState([]);
  const [practiceInvitations, setPracticeInvitations] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState(hasSupabaseConfig ? 'read_only' : 'owner');
  const [databaseFeatures, setDatabaseFeatures] = useState(createDefaultDatabaseFeatures());
  const [appError, setAppError] = useState('');
  const [operationNotice, setOperationNotice] = useState(null);
  const [activeOperation, setActiveOperation] = useState('');
  const allTasks = useMemo(() => buildAllTasks(companies, companyDetails), [companies, companyDetails]);
  const entityReviewLookup = useMemo(() => buildEntityReviewLookup(companies, companyDetails), [companies, companyDetails]);
  const permissions = useMemo(() => buildPermissions(currentUserRole), [currentUserRole]);

  useEffect(() => {
    if (!operationNotice) return undefined;
    const timer = window.setTimeout(() => setOperationNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [operationNotice]);

  const showSuccess = (title, detail = '') => {
    setAppError('');
    setOperationNotice({ type: 'success', title, detail });
  };

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setIsLoading(false);
      if (data.session && params.get('view') !== 'landing') {
        setView('dashboard');
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        setView('dashboard');
      } else {
        setPractice(null);
        setCompanies(initialCompanies);
        setCompanyDetails(initialCompanyDetails);
        setPracticeActivity(buildRecentActivity(initialCompanies, initialCompanyDetails));
        setSelectedCompany(null);
        setDatabaseFeatures(createDefaultDatabaseFeatures());
        setOperationNotice(null);
        setActiveOperation('');
        setCurrentUserRole(hasSupabaseConfig ? 'read_only' : 'owner');
        setView('landing');
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig || !session) return;
    bootstrapWorkspace(session.user);
  }, [session]);

  const bootstrapWorkspace = async (user) => {
    const { data: membership, error: membershipError } = await supabase
      .from('practice_memberships')
      .select('practice_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      setAppError(membershipError.message);
      setIsLoading(false);
      return;
    }

    if (!membership) {
      const { data: invitations, error: invitationsError } = await supabase
        .from('practice_invitations')
        .select('id, practice_id, email, role, status, created_at, practices(id, name)')
        .eq('email', user.email?.toLowerCase())
        .eq('status', 'pending');

      if (!invitationsError && invitations?.length) {
        setPendingInvitations(invitations);
        setIsLoading(false);
        setView('acceptInvite');
        return;
      }
    }

    loadPracticeAndCompanies(user, membership);
  };

  const loadPracticeAndCompanies = async (user, knownMembership = null) => {
    setIsLoading(true);
    setAppError('');

    let membership = knownMembership;
    if (!membership) {
      const { data, error: membershipError } = await supabase
        .from('practice_memberships')
        .select('practice_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (membershipError) {
        setAppError(membershipError.message);
        setIsLoading(false);
        return;
      }
      membership = data;
    }

    let practiceRecord = null;

    if (!membership) {
      const practiceName = user.user_metadata?.practice_name || 'My Secretarial Practice';
      const { data: newPractice, error: practiceError } = await supabase
        .from('practices')
        .insert({ name: practiceName, created_by: user.id })
        .select('id, name')
        .single();

      if (practiceError) {
        setAppError(practiceError.message);
        setIsLoading(false);
        return;
      }

      const { error: createMembershipError } = await supabase
        .from('practice_memberships')
        .insert({ practice_id: newPractice.id, user_id: user.id, role: 'owner' });

      if (createMembershipError) {
        setAppError(createMembershipError.message);
        setIsLoading(false);
        return;
      }

      practiceRecord = newPractice;
      membership = { practice_id: newPractice.id, role: 'owner' };
    } else {
      const { data: existingPractice, error: practiceError } = await supabase
        .from('practices')
        .select('id, name, created_by')
        .eq('id', membership.practice_id)
        .single();

      if (practiceError) {
        setAppError(practiceError.message);
        setIsLoading(false);
        return;
      }

      practiceRecord = existingPractice;

      const { data: currentMembership } = await supabase
        .from('practice_memberships')
        .select('id')
        .eq('practice_id', practiceRecord.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!currentMembership && practiceRecord.created_by === user.id) {
        const { error: repairMembershipError } = await supabase
          .from('practice_memberships')
          .insert({ practice_id: practiceRecord.id, user_id: user.id, role: 'owner' });

        if (repairMembershipError) {
          setAppError(repairMembershipError.message);
          setIsLoading(false);
          return;
        }
        membership = { practice_id: practiceRecord.id, role: 'owner' };
      }
    }

    setPractice(practiceRecord);
    setCurrentUserRole(membership?.role || 'read_only');

    const { data: members, error: membersError } = await supabase
      .from('practice_memberships')
      .select('id, user_id, role, created_at')
      .eq('practice_id', practiceRecord.id)
      .order('created_at', { ascending: true });

    if (!membersError) {
      setPracticeMembers(members || []);
    }

    const { data: invitations, error: invitationsError } = await supabase
      .from('practice_invitations')
      .select('id, email, role, status, invited_by, created_at')
      .eq('practice_id', practiceRecord.id)
      .order('created_at', { ascending: false });

    if (!invitationsError) {
      setPracticeInvitations(invitations || []);
    }

    const { data: activityRows, error: activityError } = await supabase
      .from('activity_log')
      .select('id, company_id, action, subject_type, subject_id, details, created_at, company_profiles(name)')
      .eq('practice_id', practiceRecord.id)
      .order('created_at', { ascending: false })
      .limit(25);

    if (!activityError) {
      setPracticeActivity((activityRows || []).map(mapPracticeActivityRow));
    }

    const { data: companyRows, error: companiesError } = await supabase
      .from('company_profiles')
      .select('id, name, registration_number, company_type, compliance_status, next_due_date, incorporation_date, registered_address, shareholders(id)')
      .eq('practice_id', practiceRecord.id)
      .order('created_at', { ascending: false });

    if (companiesError) {
      setAppError(companiesError.message);
      setIsLoading(false);
      return;
    }

    setCompanies(companyRows.map(mapCompanyRow));
    setIsLoading(false);
  };

  const acceptInvitation = async (invitation) => {
    if (!session) return;
    setIsLoading(true);
    setAppError('');

    const { error: membershipError } = await supabase
      .from('practice_memberships')
      .insert({ practice_id: invitation.practice_id, user_id: session.user.id, role: invitation.role || 'member' });

    if (membershipError) {
      setAppError(membershipError.message);
      setIsLoading(false);
      return;
    }

    const { error: inviteError } = await supabase
      .from('practice_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    if (inviteError) {
      setAppError(inviteError.message);
      setIsLoading(false);
      return;
    }

    setPendingInvitations([]);
    await loadPracticeAndCompanies(session.user, { practice_id: invitation.practice_id, role: invitation.role || 'member' });
    setView('dashboard');
  };

  const skipInvitations = async () => {
    if (!session) return;
    setPendingInvitations([]);
    await loadPracticeAndCompanies(session.user);
    setView('dashboard');
  };

  const requirePermission = (allowed, message = 'Your current role does not allow this action.') => {
    if (allowed) return true;
    setAppError(message);
    return false;
  };

  const addCompany = async (company) => {
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot add companies.')) return;
    const annualReturnDueDate = calculateNextAnnualReturnDue(company.incorporationDate);
    if (hasSupabaseConfig && session && practice) {
      setIsSavingCompany(true);
      setAppError('');

      const { data, error } = await supabase
        .from('company_profiles')
        .insert({
          practice_id: practice.id,
          name: company.name,
          registration_number: company.registrationNumber,
          company_type: company.type,
          incorporation_date: company.incorporationDate || null,
          registered_address: company.registeredAddress || null,
          next_due_date: annualReturnDueDate || null,
          compliance_status: 'Action Required',
          created_by: session.user.id
        })
        .select('id, name, registration_number, company_type, compliance_status, next_due_date, incorporation_date, registered_address')
        .single();

      setIsSavingCompany(false);

      if (error) {
        setAppError(error.message);
        return;
      }

      setCompanies((current) => [{ ...mapCompanyRow(data), shareholders: 0 }, ...current]);
      setCompanyDetails((current) => ({ ...current, [data.id]: createEmptyCompanyDetail() }));
      setSelectedCompany(mapCompanyRow(data));
      logActivity({ companyId: data.id, companyName: data.name, action: 'company_created', subjectType: 'company', subjectId: data.id, details: { label: data.name } });
      setShowCompanyForm(false);
      setView('dashboard');
      showSuccess('Company added', `${data.name} is now in your compliance workspace.`);
      return;
    }

    const nextDueDate = calculateNextAnnualReturnDue(company.incorporationDate);
    const nextCompany = {
      id: Date.now(),
      ...company,
      status: 'Action Required',
      nextDueDateRaw: nextDueDate,
      nextDueDate: formatCompanyDueDate(nextDueDate)
    };
    setCompanies((current) => [nextCompany, ...current]);
    setCompanyDetails((current) => ({ ...current, [nextCompany.id]: createEmptyCompanyDetail() }));
    setSelectedCompany(nextCompany);
    logActivity({ companyId: nextCompany.id, companyName: nextCompany.name, action: 'company_created', subjectType: 'company', subjectId: nextCompany.id, details: { label: nextCompany.name } });
    setShowCompanyForm(false);
    setView('dashboard');
    showSuccess('Company added', `${nextCompany.name} is now in your compliance workspace.`);
  };

  const importCompanies = async (rows) => {
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot import companies.')) return;
    const validRows = rows.filter((row) => row.valid && !row.duplicate);
    if (!validRows.length) {
      setAppError('No valid companies are ready to import.');
      return;
    }

    if (hasSupabaseConfig && session && practice) {
      setActiveOperation('Importing companies...');
      setIsSavingCompany(true);
      setAppError('');
      const companyPayload = validRows.map((row) => ({
        practice_id: practice.id,
        name: row.company.name,
        registration_number: row.company.registrationNumber,
        company_type: row.company.type,
        incorporation_date: row.company.incorporationDate || null,
        registered_address: row.company.registeredAddress || null,
        next_due_date: calculateNextAnnualReturnDue(row.company.incorporationDate) || null,
        compliance_status: 'Action Required',
        created_by: session.user.id
      }));

      const { data: insertedRows, error: insertError } = await supabase
        .from('company_profiles')
        .insert(companyPayload)
        .select('id, name, registration_number, company_type, compliance_status, next_due_date, incorporation_date, registered_address');

      if (insertError) {
        setActiveOperation('');
        setIsSavingCompany(false);
        setAppError(insertError.message);
        return;
      }

      const importedCompanies = (insertedRows || []).map((row) => ({ ...mapCompanyRow(row), shareholders: 0 }));
      const tasksPayload = importedCompanies.flatMap((company) => buildInitialImportTasks(company).map((task) => ({
        company_id: company.id,
        contact_id: null,
        title: task.title,
        task_type: task.taskType,
        due_date: task.dueDate,
        status: task.status,
        notes: task.notes
      })));

      const { data: taskRows, error: taskError } = tasksPayload.length
        ? await supabase
            .from('follow_up_tasks')
            .insert(tasksPayload)
            .select('id, company_id, contact_id, title, task_type, due_date, status, notes')
        : { data: [], error: null };

      if (taskError) {
        setActiveOperation('');
        setIsSavingCompany(false);
        setAppError(taskError.message);
        return;
      }

      const tasksByCompany = (taskRows || []).reduce((grouped, row) => {
        grouped[row.company_id] = grouped[row.company_id] || [];
        grouped[row.company_id].push(mapTaskRow(row));
        return grouped;
      }, {});

      setCompanies((current) => [...importedCompanies, ...current]);
      setCompanyDetails((current) => {
        const next = { ...current };
        importedCompanies.forEach((company) => {
          next[company.id] = {
            ...createEmptyCompanyDetail(),
            tasks: tasksByCompany[company.id] || []
          };
        });
        return next;
      });
      importedCompanies.forEach((company) => {
        logActivity({
          companyId: company.id,
          companyName: company.name,
          action: 'company_imported',
          subjectType: 'company',
          subjectId: company.id,
          details: { label: company.name, summary: 'Company imported from bulk onboarding' }
        });
      });
      setIsSavingCompany(false);
      setActiveOperation('');
      showSuccess('Import complete', `${importedCompanies.length} companies imported and onboarding tasks created.`);
      return;
    }

    const importedCompanies = validRows.map((row, index) => {
      const nextDueDate = calculateNextAnnualReturnDue(row.company.incorporationDate);
      return {
        id: Date.now() + index,
        ...row.company,
        status: 'Action Required',
        nextDueDateRaw: nextDueDate,
        nextDueDate: formatCompanyDueDate(nextDueDate),
        shareholders: 0
      };
    });
    setCompanies((current) => [...importedCompanies, ...current]);
    setCompanyDetails((current) => {
      const next = { ...current };
      importedCompanies.forEach((company) => {
        next[company.id] = {
          ...createEmptyCompanyDetail(),
          tasks: buildInitialImportTasks(company)
        };
      });
      return next;
    });
    importedCompanies.forEach((company) => {
      logActivity({
        companyId: company.id,
        companyName: company.name,
        action: 'company_imported',
        subjectType: 'company',
        details: { label: company.name, summary: 'Company imported from bulk onboarding' }
      });
    });
    showSuccess('Import complete', `${importedCompanies.length} companies imported and onboarding tasks created.`);
  };

  const exportPracticeData = async () => {
    setActiveOperation('Preparing CSV export...');
    setAppError('');
    const stamp = new Date().toISOString().slice(0, 10);
    const baseName = fileSafeName(practice?.name || 'secretarialdesk-practice');
    const companyIds = companies.map((company) => company.id);

    downloadTableCsv(`${baseName}-${stamp}-companies.csv`, companies, [
      ['id', 'id'],
      ['name', 'name'],
      ['registration_number', 'registrationNumber'],
      ['company_type', 'type'],
      ['incorporation_date', 'incorporationDate'],
      ['registered_address', 'registeredAddress'],
      ['compliance_status', 'status'],
      ['next_due_date', 'nextDueDateRaw'],
      ['shareholder_count', 'shareholders']
    ]);

    if (hasSupabaseConfig && session && companyIds.length) {
      const tableExports = [
        { table: 'directors', filename: 'directors', columns: 'id, company_id, full_name, id_number, appointment_date' },
        { table: 'shareholders', filename: 'shareholders', columns: 'id, company_id, shareholder_type, name, id_number, ownership_percentage' },
        { table: 'beneficial_owners', filename: 'beneficial-owners', columns: 'id, company_id, shareholder_id, full_name, id_number, ownership_percentage, control_basis, notes, created_at' },
        { table: 'trust_reviews', filename: 'trust-reviews', columns: 'id, company_id, shareholder_id, trustees, beneficiaries, founders, controllers, notes, reviewed_at, created_at' },
        { table: 'entity_ownership_reviews', filename: 'entity-ownership-reviews', columns: 'id, company_id, shareholder_id, owners, notes, reviewed_at, created_at' },
        { table: 'company_contacts', filename: 'contacts', columns: 'id, company_id, full_name, role, email, phone, notes' },
        { table: 'follow_up_tasks', filename: 'tasks', columns: 'id, company_id, contact_id, title, task_type, due_date, status, notes' },
        { table: 'documents', filename: 'documents', columns: 'id, company_id, document_type, original_filename, file_path, status, created_at' },
        { table: 'filing_packs', filename: 'filing-packs', columns: 'id, company_id, bo_register_pdf_path, bo_register_csv_path, mandate_pdf_path, submission_status, submitted_at, cipc_reference, submission_notes, generated_at' },
        { table: 'director_changes', filename: 'director-changes', columns: 'id, company_id, change_type, existing_director_id, full_name, id_number, effective_date, board_resolution_received, signed_cor39_received, submission_status, cipc_reference, notes, accepted_at, created_at', optional: true },
        { table: 'share_transactions', filename: 'share-transactions', columns: 'id, company_id, transaction_type, from_shareholder_id, to_shareholder_id, to_shareholder_type, to_shareholder_name, to_shareholder_id_number, ownership_percentage, share_class, transaction_date, consideration, supporting_docs_received, status, notes, accepted_at, created_at', optional: true },
        { table: 'activity_log', filename: 'activity-log', columns: 'id, company_id, action, subject_type, subject_id, details, created_at' }
      ];

      for (const item of tableExports) {
        const { data, error } = await supabase
          .from(item.table)
          .select(item.columns)
          .in('company_id', companyIds);

        if (error) {
          if (!item.optional || !isMissingRelationError(error)) {
            setAppError(error.message);
          }
          continue;
        }
        const enrichedRows = (data || []).map((row) => {
          const company = companies.find((entry) => String(entry.id) === String(row.company_id));
          return {
            company_name: company?.name || '',
            company_registration_number: company?.registrationNumber || '',
            ...row
          };
        });
        downloadRowsCsv(`${baseName}-${stamp}-${item.filename}.csv`, enrichedRows);
      }
      setActiveOperation('');
      showSuccess('Export complete', 'Practice CSV files have been downloaded.');
      return;
    }

    downloadCachedPracticeData(baseName, stamp, companies, companyDetails);
    setActiveOperation('');
    showSuccess('Export complete', 'Practice CSV files have been downloaded.');
  };

  const restorePracticeData = async (restore) => {
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot restore practice data.')) return;
    const validRows = (restore.rows || []).filter((row) => row.valid);
    if (!validRows.length) {
      setAppError('No valid rows are ready to restore.');
      return;
    }

    if (restore.type === 'companies') {
      setActiveOperation('Restoring companies...');
      await importCompanies(validRows.map((row) => ({
        valid: true,
        duplicate: false,
        company: row.company
      })));
      setActiveOperation('');
      showSuccess('Restore complete', `${validRows.length} companies restored.`);
      return;
    }

    const config = restoreDataTypeConfig(restore.type);
    if (!config) {
      setAppError('Unsupported restore file.');
      return;
    }

    if (hasSupabaseConfig && session) {
      setActiveOperation(`Restoring ${config.label.toLowerCase()}...`);
      setIsSavingDetail(true);
      setAppError('');
      const { data, error } = await supabase
        .from(config.table)
        .insert(validRows.map((row) => ({
          ...row.payload,
          ...(restore.type === 'documents' ? { practice_id: practice?.id, created_by: session.user.id } : {}),
          ...(restore.type === 'filingPacks' ? { generated_by: session.user.id } : {})
        })))
        .select(config.select);
      setIsSavingDetail(false);

      if (error) {
        setActiveOperation('');
        setAppError(error.message);
        return;
      }

      const rowsByCompany = (data || []).reduce((grouped, row) => {
        grouped[row.company_id] = grouped[row.company_id] || [];
        grouped[row.company_id].push(config.mapRow(row));
        return grouped;
      }, {});
      setCompanyDetails((current) => {
        const next = { ...current };
        Object.entries(rowsByCompany).forEach(([companyId, records]) => {
          const existing = next[companyId] || createEmptyCompanyDetail();
          next[companyId] = { ...existing, [config.detailKey]: [...records, ...existing[config.detailKey]] };
        });
        return next;
      });
      (data || []).forEach((row) => {
        const company = companies.find((item) => String(item.id) === String(row.company_id));
        logActivity({
          companyId: row.company_id,
          companyName: company?.name,
          action: `${restore.type}_restored`,
          subjectType: restore.type,
          subjectId: row.id,
          details: { label: config.rowLabel(row), summary: `${config.label} restored from practice CSV backup` }
        });
      });
      setActiveOperation('');
      showSuccess('Restore complete', `${validRows.length} ${config.label.toLowerCase()} restored.`);
      return;
    }

    const restoredRecords = validRows.map((row, index) => ({
      ...config.localMap(row.payload),
      id: row.payload.id || `restored-${restore.type}-${Date.now()}-${index}`
    }));
    setCompanyDetails((current) => {
      const next = { ...current };
      restoredRecords.forEach((record) => {
        const existing = next[record.companyId] || createEmptyCompanyDetail();
        const { companyId, ...detailRecord } = record;
        next[companyId] = { ...existing, [config.detailKey]: [detailRecord, ...existing[config.detailKey]] };
      });
      return next;
    });
    restoredRecords.forEach((record) => {
      const company = companies.find((item) => String(item.id) === String(record.companyId));
      logActivity({
        companyId: record.companyId,
        companyName: company?.name,
        action: `${restore.type}_restored`,
        subjectType: restore.type,
        subjectId: record.id,
        details: { label: record.title || record.name || record.fullName || config.label, summary: `${config.label} restored from practice CSV backup` }
      });
    });
    showSuccess('Restore complete', `${restoredRecords.length} ${config.label.toLowerCase()} restored.`);
  };

  const selectCompany = async (company) => {
    setSelectedCompany(company);
    setAppError('');

    if (!hasSupabaseConfig || !session) return;

    const [
      { data: directors, error: directorsError },
      { data: shareholders, error: shareholdersError },
      { data: beneficialOwners, error: beneficialOwnersError },
      { data: trustReviews, error: trustReviewsError },
      { data: entityOwnershipReviews, error: entityOwnershipReviewsError },
      { data: documents, error: documentsError },
      { data: contacts, error: contactsError },
      { data: tasks, error: tasksError },
      { data: activity, error: activityError },
      { data: filingPacks, error: filingPacksError },
      { data: directorChanges, error: directorChangesError },
      { data: shareTransactions, error: shareTransactionsError }
    ] = await Promise.all([
      supabase.from('directors').select('id, full_name, id_number, appointment_date').eq('company_id', company.id).order('created_at', { ascending: false }),
      supabase.from('shareholders').select('id, shareholder_type, name, id_number, ownership_percentage').eq('company_id', company.id).order('created_at', { ascending: false }),
      supabase.from('beneficial_owners').select('id, shareholder_id, full_name, id_number, ownership_percentage, control_basis, notes, created_at').eq('company_id', company.id).order('created_at', { ascending: false }),
      supabase.from('trust_reviews').select('id, shareholder_id, trustees, beneficiaries, founders, controllers, notes, reviewed_at, created_at').eq('company_id', company.id).order('reviewed_at', { ascending: false }),
      supabase.from('entity_ownership_reviews').select('id, shareholder_id, owners, notes, reviewed_at, created_at').eq('company_id', company.id).order('reviewed_at', { ascending: false }),
      supabase.from('documents').select('id, document_type, original_filename, file_path, status').eq('company_id', company.id).order('created_at', { ascending: false }),
      supabase.from('company_contacts').select('id, full_name, role, email, phone, notes').eq('company_id', company.id).order('created_at', { ascending: false }),
      supabase.from('follow_up_tasks').select('id, contact_id, title, task_type, due_date, status, notes').eq('company_id', company.id).order('due_date', { ascending: true }),
      supabase.from('activity_log').select('id, action, subject_type, subject_id, details, created_at').eq('company_id', company.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('filing_packs').select('id, bo_register_pdf_path, bo_register_csv_path, mandate_pdf_path, submission_status, submitted_at, cipc_reference, submission_notes, generated_at').eq('company_id', company.id).order('generated_at', { ascending: false }),
      supabase.from('director_changes').select('id, change_type, existing_director_id, full_name, id_number, effective_date, board_resolution_received, signed_cor39_received, submission_status, cipc_reference, notes, accepted_at, created_at').eq('company_id', company.id).order('created_at', { ascending: false }),
      supabase.from('share_transactions').select('id, transaction_type, from_shareholder_id, to_shareholder_id, to_shareholder_type, to_shareholder_name, to_shareholder_id_number, ownership_percentage, share_class, transaction_date, consideration, supporting_docs_received, status, notes, accepted_at, created_at').eq('company_id', company.id).order('created_at', { ascending: false })
    ]);

    const directorChangesFeature = databaseFeatureStatusFromError(directorChangesError);
    const shareTransactionsFeature = databaseFeatureStatusFromError(shareTransactionsError);
    setDatabaseFeatures((current) => ({
      ...current,
      directorChanges: directorChangesFeature,
      shareTransactions: shareTransactionsFeature
    }));

    if (directorsError || shareholdersError || beneficialOwnersError || trustReviewsError || entityOwnershipReviewsError || documentsError || contactsError || tasksError || activityError || filingPacksError) {
      setAppError(directorsError?.message || shareholdersError?.message || beneficialOwnersError?.message || trustReviewsError?.message || entityOwnershipReviewsError?.message || documentsError?.message || contactsError?.message || tasksError?.message || activityError?.message || filingPacksError?.message);
      return;
    }

    const mappedDocuments = (documents || []).map(mapDocumentRow);
    setCompanyDetails((current) => ({
      ...current,
      [company.id]: {
        directors: (directors || []).map(mapDirectorRow),
        shareholders: (shareholders || []).map(mapShareholderRow),
        beneficialOwners: (beneficialOwners || []).map(mapBeneficialOwnerRow),
        trustReviews: (trustReviews || []).map(mapTrustReviewRow),
        entityOwnershipReviews: (entityOwnershipReviews || []).map(mapEntityOwnershipReviewRow),
        directorChanges: directorChangesFeature.available ? (directorChanges || []).map(mapDirectorChangeRow) : [],
        shareTransactions: shareTransactionsFeature.available ? (shareTransactions || []).map(mapShareTransactionRow) : [],
        documents: mappedDocuments,
        contacts: (contacts || []).map(mapContactRow),
        tasks: (tasks || []).map(mapTaskRow),
        activity: (activity || []).map(mapActivityRow),
        filingPacks: (filingPacks || []).map(mapFilingPackRow),
        mandatePrepared: mappedDocuments.some((document) => document.documentType === 'mandate_to_file')
      }
    }));
  };

  const addDirector = async (director) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot edit directors.')) return;

    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('directors')
        .insert({
          company_id: selectedCompany.id,
          full_name: director.fullName,
          id_number: director.idNumber || null,
          appointment_date: director.appointmentDate || null
        })
        .select('id, full_name, id_number, appointment_date')
        .single();
      setIsSavingDetail(false);

      if (error) {
        setAppError(error.message);
        return;
      }

      appendCompanyDetail(selectedCompany.id, 'directors', mapDirectorRow(data));
      logActivity({ action: 'director_added', subjectType: 'director', subjectId: data.id, details: { label: director.fullName } });
      return;
    }

    appendCompanyDetail(selectedCompany.id, 'directors', { id: Date.now(), ...director });
    logActivity({ action: 'director_added', subjectType: 'director', details: { label: director.fullName } });
  };

  const deleteDirector = async (directorId) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canDeleteRecords, 'Your role cannot delete directors.')) return;
    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { error } = await supabase.from('directors').delete().eq('id', directorId);
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
    }
    removeCompanyDetail(selectedCompany.id, 'directors', directorId);
    logActivity({ action: 'director_deleted', subjectType: 'director', subjectId: directorId, details: { label: 'Director deleted' } });
  };

  const updateDirector = async (director) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot edit directors.')) return;
    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('directors')
        .update({
          full_name: director.fullName,
          id_number: director.idNumber || null,
          appointment_date: director.appointmentDate || null
        })
        .eq('id', director.id)
        .select('id, full_name, id_number, appointment_date')
        .single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      replaceCompanyDetail(selectedCompany.id, 'directors', director.id, mapDirectorRow(data));
      logActivity({ action: 'director_updated', subjectType: 'director', subjectId: director.id, details: { label: director.fullName } });
      return;
    }
    replaceCompanyDetail(selectedCompany.id, 'directors', director.id, director);
    logActivity({ action: 'director_updated', subjectType: 'director', subjectId: director.id, details: { label: director.fullName } });
  };

  const saveDirectorChange = async (change) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot create director change filings.')) return;
    if (hasSupabaseConfig && session && databaseFeatures.directorChanges?.available === false) {
      setAppError(databaseFeatureUnavailableMessage('Director change filings', databaseFeatures.directorChanges));
      return;
    }
    const payload = {
      id: `director-change-${Date.now()}`,
      changeType: change.changeType,
      existingDirectorId: change.existingDirectorId || '',
      fullName: change.fullName || '',
      idNumber: change.idNumber || '',
      effectiveDate: change.effectiveDate || '',
      boardResolutionReceived: Boolean(change.boardResolutionReceived),
      signedCor39Received: Boolean(change.signedCor39Received),
      submissionStatus: change.submissionStatus || 'draft',
      cipcReference: change.cipcReference || '',
      notes: change.notes || '',
      createdAt: new Date().toISOString()
    };

    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('director_changes')
        .insert({
          company_id: selectedCompany.id,
          change_type: payload.changeType,
          existing_director_id: isUuid(payload.existingDirectorId) ? payload.existingDirectorId : null,
          full_name: payload.fullName || null,
          id_number: payload.idNumber || null,
          effective_date: payload.effectiveDate || null,
          board_resolution_received: payload.boardResolutionReceived,
          signed_cor39_received: payload.signedCor39Received,
          submission_status: payload.submissionStatus,
          cipc_reference: payload.cipcReference || null,
          notes: payload.notes || null
        })
        .select('id, change_type, existing_director_id, full_name, id_number, effective_date, board_resolution_received, signed_cor39_received, submission_status, cipc_reference, notes, accepted_at, created_at')
        .single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      const mapped = mapDirectorChangeRow(data);
      appendCompanyDetail(selectedCompany.id, 'directorChanges', mapped);
      logActivity({ action: 'director_change_created', subjectType: 'director_change', subjectId: mapped.id, details: buildDirectorChangeAuditDetails(mapped) });
      return;
    }

    appendCompanyDetail(selectedCompany.id, 'directorChanges', payload);
    logActivity({ action: 'director_change_created', subjectType: 'director_change', subjectId: payload.id, details: buildDirectorChangeAuditDetails(payload) });
  };

  const updateDirectorChangeStatus = async (changeId, statusPatch) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot update director change filings.')) return;
    if (hasSupabaseConfig && session && databaseFeatures.directorChanges?.available === false) {
      setAppError(databaseFeatureUnavailableMessage('Director change filings', databaseFeatures.directorChanges));
      return;
    }
    const currentDetail = companyDetails[selectedCompany.id] || createEmptyCompanyDetail();
    const existingChange = (currentDetail.directorChanges || []).find((change) => String(change.id) === String(changeId));
    if (!existingChange) return;
    const nextChange = {
      ...existingChange,
      ...statusPatch,
      acceptedAt: statusPatch.submissionStatus === 'accepted' ? new Date().toISOString() : existingChange.acceptedAt || ''
    };

    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('director_changes')
        .update({
          board_resolution_received: nextChange.boardResolutionReceived,
          signed_cor39_received: nextChange.signedCor39Received,
          submission_status: nextChange.submissionStatus,
          cipc_reference: nextChange.cipcReference || null,
          notes: nextChange.notes || null,
          accepted_at: nextChange.acceptedAt || null
        })
        .eq('id', changeId)
        .select('id, change_type, existing_director_id, full_name, id_number, effective_date, board_resolution_received, signed_cor39_received, submission_status, cipc_reference, notes, accepted_at, created_at')
        .single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      const mapped = mapDirectorChangeRow(data);
      replaceCompanyDetail(selectedCompany.id, 'directorChanges', changeId, mapped);
      logActivity({ action: 'director_change_updated', subjectType: 'director_change', subjectId: changeId, details: buildDirectorChangeStatusAuditDetails(existingChange, mapped) });
      if (existingChange.submissionStatus !== 'accepted' && mapped.submissionStatus === 'accepted') {
        await applyAcceptedDirectorChange(mapped, currentDetail.directors || []);
        showSuccess('Director register updated', `${directorChangeTarget(mapped)} has been applied to the director register.`);
      }
      return;
    }

    replaceCompanyDetail(selectedCompany.id, 'directorChanges', changeId, nextChange);
    logActivity({ action: 'director_change_updated', subjectType: 'director_change', subjectId: changeId, details: buildDirectorChangeStatusAuditDetails(existingChange, nextChange) });

    if (existingChange.submissionStatus !== 'accepted' && nextChange.submissionStatus === 'accepted') {
      await applyAcceptedDirectorChange(nextChange, currentDetail.directors || []);
      showSuccess('Director register updated', `${directorChangeTarget(nextChange)} has been applied to the director register.`);
    }
  };

  const applyAcceptedDirectorChange = async (change, directors) => {
    if (change.changeType === 'appointment') {
      await addDirector({ fullName: change.fullName, idNumber: change.idNumber, appointmentDate: change.effectiveDate });
      return;
    }

    const director = directors.find((item) => String(item.id) === String(change.existingDirectorId));
    if (!director) return;

    if (['resignation', 'removal'].includes(change.changeType)) {
      await deleteDirector(director.id);
      return;
    }

    if (change.changeType === 'details_correction') {
      await updateDirector({
        ...director,
        fullName: change.fullName || director.fullName,
        idNumber: change.idNumber || director.idNumber,
        appointmentDate: change.effectiveDate || director.appointmentDate
      });
    }
  };

  const addShareholder = async (shareholder) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot edit shareholders.')) return;
    const normalized = {
      ...shareholder,
      ownershipPercentage: Number(shareholder.ownershipPercentage || 0)
    };

    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('shareholders')
        .insert({
          company_id: selectedCompany.id,
          shareholder_type: normalized.shareholderType,
          name: normalized.name,
          id_number: normalized.idNumber || null,
          ownership_percentage: normalized.ownershipPercentage
        })
        .select('id, shareholder_type, name, id_number, ownership_percentage')
        .single();
      setIsSavingDetail(false);

      if (error) {
        setAppError(error.message);
        return;
      }

      appendCompanyDetail(selectedCompany.id, 'shareholders', mapShareholderRow(data));
      updateShareholderCount(selectedCompany.id);
      logActivity({ action: 'shareholder_added', subjectType: 'shareholder', subjectId: data.id, details: { label: normalized.name, ownershipPercentage: normalized.ownershipPercentage } });
      return;
    }

    appendCompanyDetail(selectedCompany.id, 'shareholders', { id: Date.now(), ...normalized });
    updateShareholderCount(selectedCompany.id);
    logActivity({ action: 'shareholder_added', subjectType: 'shareholder', details: { label: normalized.name, ownershipPercentage: normalized.ownershipPercentage } });
  };

  const deleteShareholder = async (shareholderId) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canDeleteRecords, 'Your role cannot delete shareholders.')) return;
    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { error } = await supabase.from('shareholders').delete().eq('id', shareholderId);
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
    }
    removeCompanyDetail(selectedCompany.id, 'shareholders', shareholderId);
    logActivity({ action: 'shareholder_deleted', subjectType: 'shareholder', subjectId: shareholderId, details: { label: 'Shareholder deleted' } });
    setCompanies((current) =>
      current.map((company) =>
        company.id === selectedCompany.id ? { ...company, shareholders: Math.max((company.shareholders || 1) - 1, 0) } : company
      )
    );
    setSelectedCompany((current) =>
      current ? { ...current, shareholders: Math.max((current.shareholders || 1) - 1, 0) } : current
    );
  };

  const updateShareholder = async (shareholder) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot edit shareholders.')) return;
    const normalized = { ...shareholder, ownershipPercentage: Number(shareholder.ownershipPercentage || 0) };
    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('shareholders')
        .update({
          shareholder_type: normalized.shareholderType,
          name: normalized.name,
          id_number: normalized.idNumber || null,
          ownership_percentage: normalized.ownershipPercentage
        })
        .eq('id', normalized.id)
        .select('id, shareholder_type, name, id_number, ownership_percentage')
        .single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      replaceCompanyDetail(selectedCompany.id, 'shareholders', normalized.id, mapShareholderRow(data));
      logActivity({ action: 'shareholder_updated', subjectType: 'shareholder', subjectId: normalized.id, details: { label: normalized.name, ownershipPercentage: normalized.ownershipPercentage } });
      return;
    }
    replaceCompanyDetail(selectedCompany.id, 'shareholders', normalized.id, normalized);
    logActivity({ action: 'shareholder_updated', subjectType: 'shareholder', subjectId: normalized.id, details: { label: normalized.name, ownershipPercentage: normalized.ownershipPercentage } });
  };

  const saveShareTransaction = async (transaction) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot create share register transactions.')) return;
    if (hasSupabaseConfig && session && databaseFeatures.shareTransactions?.available === false) {
      setAppError(databaseFeatureUnavailableMessage('Share register maintenance', databaseFeatures.shareTransactions));
      return;
    }
    const payload = {
      id: `share-transaction-${Date.now()}`,
      transactionType: transaction.transactionType || 'transfer',
      fromShareholderId: transaction.fromShareholderId || '',
      toShareholderId: transaction.toShareholderId || '',
      toShareholderType: transaction.toShareholderType || 'natural_person',
      toShareholderName: transaction.toShareholderName || '',
      toShareholderIdNumber: transaction.toShareholderIdNumber || '',
      ownershipPercentage: Number(transaction.ownershipPercentage || 0),
      shareClass: transaction.shareClass || 'Ordinary',
      transactionDate: transaction.transactionDate || todayIsoDate(),
      consideration: transaction.consideration || '',
      supportingDocsReceived: Boolean(transaction.supportingDocsReceived),
      status: transaction.status || 'draft',
      notes: transaction.notes || '',
      createdAt: new Date().toISOString()
    };

    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('share_transactions')
        .insert({
          company_id: selectedCompany.id,
          transaction_type: payload.transactionType,
          from_shareholder_id: isUuid(payload.fromShareholderId) ? payload.fromShareholderId : null,
          to_shareholder_id: isUuid(payload.toShareholderId) ? payload.toShareholderId : null,
          to_shareholder_type: payload.toShareholderType || null,
          to_shareholder_name: payload.toShareholderName || null,
          to_shareholder_id_number: payload.toShareholderIdNumber || null,
          ownership_percentage: payload.ownershipPercentage,
          share_class: payload.shareClass,
          transaction_date: payload.transactionDate || null,
          consideration: payload.consideration || null,
          supporting_docs_received: payload.supportingDocsReceived,
          status: payload.status,
          notes: payload.notes || null
        })
        .select('id, transaction_type, from_shareholder_id, to_shareholder_id, to_shareholder_type, to_shareholder_name, to_shareholder_id_number, ownership_percentage, share_class, transaction_date, consideration, supporting_docs_received, status, notes, accepted_at, created_at')
        .single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      const mapped = mapShareTransactionRow(data);
      appendCompanyDetail(selectedCompany.id, 'shareTransactions', mapped);
      logActivity({ action: 'share_transaction_created', subjectType: 'share_transaction', subjectId: mapped.id, details: buildShareTransactionAuditDetails(mapped) });
      return;
    }

    appendCompanyDetail(selectedCompany.id, 'shareTransactions', payload);
    logActivity({ action: 'share_transaction_created', subjectType: 'share_transaction', subjectId: payload.id, details: buildShareTransactionAuditDetails(payload) });
  };

  const updateShareTransactionStatus = async (transactionId, statusPatch) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot update share register transactions.')) return;
    if (hasSupabaseConfig && session && databaseFeatures.shareTransactions?.available === false) {
      setAppError(databaseFeatureUnavailableMessage('Share register maintenance', databaseFeatures.shareTransactions));
      return;
    }
    const currentDetail = companyDetails[selectedCompany.id] || createEmptyCompanyDetail();
    const existingTransaction = (currentDetail.shareTransactions || []).find((transaction) => String(transaction.id) === String(transactionId));
    if (!existingTransaction) return;
    const nextTransaction = {
      ...existingTransaction,
      ...statusPatch,
      acceptedAt: statusPatch.status === 'accepted' ? new Date().toISOString() : existingTransaction.acceptedAt || ''
    };

    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('share_transactions')
        .update({
          supporting_docs_received: nextTransaction.supportingDocsReceived,
          status: nextTransaction.status,
          notes: nextTransaction.notes || null,
          accepted_at: nextTransaction.acceptedAt || null
        })
        .eq('id', transactionId)
        .select('id, transaction_type, from_shareholder_id, to_shareholder_id, to_shareholder_type, to_shareholder_name, to_shareholder_id_number, ownership_percentage, share_class, transaction_date, consideration, supporting_docs_received, status, notes, accepted_at, created_at')
        .single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      const mapped = mapShareTransactionRow(data);
      replaceCompanyDetail(selectedCompany.id, 'shareTransactions', transactionId, mapped);
      logActivity({ action: 'share_transaction_updated', subjectType: 'share_transaction', subjectId: transactionId, details: buildShareTransactionStatusAuditDetails(existingTransaction, mapped, currentDetail) });
      if (existingTransaction.status !== 'accepted' && mapped.status === 'accepted') {
        await applyAcceptedShareTransaction(mapped, currentDetail.shareholders || []);
        showSuccess('Share register updated', `${shareTransactionTypeLabel(mapped.transactionType)} has been applied to the shareholder register.`);
      }
      return;
    }

    replaceCompanyDetail(selectedCompany.id, 'shareTransactions', transactionId, nextTransaction);
    logActivity({ action: 'share_transaction_updated', subjectType: 'share_transaction', subjectId: transactionId, details: buildShareTransactionStatusAuditDetails(existingTransaction, nextTransaction, currentDetail) });

    if (existingTransaction.status !== 'accepted' && nextTransaction.status === 'accepted') {
      await applyAcceptedShareTransaction(nextTransaction, currentDetail.shareholders || []);
      showSuccess('Share register updated', `${shareTransactionTypeLabel(nextTransaction.transactionType)} has been applied to the shareholder register.`);
    }
  };

  const applyAcceptedShareTransaction = async (transaction, shareholders) => {
    const validation = validateShareTransaction(transaction, shareholders);
    if (!validation.canAccept) {
      setAppError(validation.errors.join(' '));
      return;
    }
    const pct = Number(transaction.ownershipPercentage || 0);
    if (pct <= 0) return;
    const fromShareholder = shareholders.find((shareholder) => String(shareholder.id) === String(transaction.fromShareholderId));
    const toShareholder = shareholders.find((shareholder) => String(shareholder.id) === String(transaction.toShareholderId));

    if (['transfer', 'cancellation'].includes(transaction.transactionType) && fromShareholder) {
      const nextFromPct = Number(fromShareholder.ownershipPercentage || 0) - pct;
      if (nextFromPct <= 0.0001) {
        await deleteShareholder(fromShareholder.id);
      } else {
        await updateShareholder({ ...fromShareholder, ownershipPercentage: Number(nextFromPct.toFixed(4)) });
      }
    }

    if (['transfer', 'allotment'].includes(transaction.transactionType)) {
      if (toShareholder) {
        await updateShareholder({
          ...toShareholder,
          ownershipPercentage: Number((Number(toShareholder.ownershipPercentage || 0) + pct).toFixed(4))
        });
      } else {
        await addShareholder({
          shareholderType: transaction.toShareholderType,
          name: transaction.toShareholderName,
          idNumber: transaction.toShareholderIdNumber,
          ownershipPercentage: pct
        });
      }
    }
  };

  const confirmBeneficialOwner = async (owner) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditBoRecords, 'Your role cannot confirm beneficial owners.')) return;
    const payload = {
      shareholderId: owner.shareholderId || null,
      fullName: owner.fullName,
      idNumber: owner.idNumber || '',
      ownershipPercentage: Number(owner.ownershipPercentage || 0),
      controlBasis: owner.controlBasis || 'Direct shareholding above 5%',
      notes: owner.notes || ''
    };
    const auditDetails = {
      label: payload.fullName,
      summary: `${payload.fullName} confirmed as a beneficial owner at ${payload.ownershipPercentage}%`,
      ownershipPercentage: payload.ownershipPercentage,
      controlBasis: payload.controlBasis,
      sourceShareholderId: payload.shareholderId,
      after: auditSnapshot(payload)
    };

    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('beneficial_owners')
        .insert({
          company_id: selectedCompany.id,
          shareholder_id: isUuid(payload.shareholderId) ? payload.shareholderId : null,
          full_name: payload.fullName,
          id_number: payload.idNumber || null,
          ownership_percentage: payload.ownershipPercentage,
          control_basis: payload.controlBasis,
          notes: payload.notes || null
        })
        .select('id, shareholder_id, full_name, id_number, ownership_percentage, control_basis, notes, created_at')
        .single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      appendCompanyDetail(selectedCompany.id, 'beneficialOwners', mapBeneficialOwnerRow(data));
      logActivity({ action: 'beneficial_owner_confirmed', subjectType: 'beneficial_owner', subjectId: data.id, details: auditDetails });
      return;
    }

    appendCompanyDetail(selectedCompany.id, 'beneficialOwners', { id: Date.now(), ...payload });
    logActivity({ action: 'beneficial_owner_confirmed', subjectType: 'beneficial_owner', details: auditDetails });
  };

  const deleteBeneficialOwner = async (ownerId) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canDeleteRecords, 'Your role cannot remove beneficial owners.')) return;
    const currentDetail = companyDetails[selectedCompany.id] || createEmptyCompanyDetail();
    const existingOwner = currentDetail.beneficialOwners.find((owner) => String(owner.id) === String(ownerId));
    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { error } = await supabase.from('beneficial_owners').delete().eq('id', ownerId);
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
    }
    removeCompanyDetail(selectedCompany.id, 'beneficialOwners', ownerId);
    logActivity({
      action: 'beneficial_owner_removed',
      subjectType: 'beneficial_owner',
      subjectId: ownerId,
      details: {
        label: existingOwner?.fullName || 'Beneficial owner removed',
        summary: `${existingOwner?.fullName || 'Beneficial owner'} removed from BO filing records`,
        before: auditSnapshot(existingOwner)
      }
    });
  };

  const saveTrustReview = async (review) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditBoRecords, 'Your role cannot save trust reviews.')) return;
    const currentDetail = companyDetails[selectedCompany.id] || createEmptyCompanyDetail();
    const existingReview = currentDetail.trustReviews.find((item) => String(item.id) === String(review.id) || String(item.shareholderId) === String(review.shareholderId));
    const trustShareholder = currentDetail.shareholders.find((item) => String(item.id) === String(review.shareholderId));
    const payload = {
      shareholderId: review.shareholderId,
      trustees: review.trustees || [],
      beneficiaries: review.beneficiaries || [],
      founders: review.founders || [],
      controllers: review.controllers || [],
      notes: review.notes || ''
    };

    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const query = review.id
        ? supabase
            .from('trust_reviews')
            .update({
              trustees: payload.trustees,
              beneficiaries: payload.beneficiaries,
              founders: payload.founders,
              controllers: payload.controllers,
              notes: payload.notes || null,
              reviewed_at: new Date().toISOString()
            })
            .eq('id', review.id)
        : supabase
            .from('trust_reviews')
            .insert({
              company_id: selectedCompany.id,
              shareholder_id: isUuid(payload.shareholderId) ? payload.shareholderId : null,
              trustees: payload.trustees,
              beneficiaries: payload.beneficiaries,
              founders: payload.founders,
              controllers: payload.controllers,
              notes: payload.notes || null
            });

      const { data, error } = await query
        .select('id, shareholder_id, trustees, beneficiaries, founders, controllers, notes, reviewed_at, created_at')
        .single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      if (review.id) {
        replaceCompanyDetail(selectedCompany.id, 'trustReviews', review.id, mapTrustReviewRow(data));
      } else {
        appendCompanyDetail(selectedCompany.id, 'trustReviews', mapTrustReviewRow(data));
      }
      logActivity({
        action: 'trust_review_saved',
        subjectType: 'trust_review',
        subjectId: data.id,
        details: buildTrustReviewAuditDetails(trustShareholder, existingReview, mapTrustReviewRow(data))
      });
      return;
    }

    const localReview = { id: review.id || Date.now(), ...payload, reviewedAt: new Date().toISOString() };
    if (review.id) {
      replaceCompanyDetail(selectedCompany.id, 'trustReviews', review.id, localReview);
    } else {
      appendCompanyDetail(selectedCompany.id, 'trustReviews', localReview);
    }
    logActivity({ action: 'trust_review_saved', subjectType: 'trust_review', details: buildTrustReviewAuditDetails(trustShareholder, existingReview, localReview) });
  };

  const createBeneficialOwnersFromTrustReview = async (reviewId) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditBoRecords, 'Your role cannot create BO records from trust reviews.')) return;
    const review = (companyDetails[selectedCompany.id] || createEmptyCompanyDetail()).trustReviews.find((item) => item.id === reviewId);
    if (!review) return;
    const people = trustReviewPeopleToOwners(review);
    for (const person of people) {
      await confirmBeneficialOwner(person);
    }
    logActivity({ action: 'trust_bo_records_created', subjectType: 'trust_review', subjectId: reviewId, details: { label: `${people.length} trust BO record${people.length === 1 ? '' : 's'} created` } });
  };

  const saveEntityOwnershipReview = async (review) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditBoRecords, 'Your role cannot save entity look-through reviews.')) return;
    const currentDetail = companyDetails[selectedCompany.id] || createEmptyCompanyDetail();
    const existingReview = currentDetail.entityOwnershipReviews.find((item) => String(item.id) === String(review.id) || String(item.shareholderId) === String(review.shareholderId));
    const entityShareholder = currentDetail.shareholders.find((item) => String(item.id) === String(review.shareholderId));
    const payload = {
      shareholderId: review.shareholderId,
      owners: review.owners || [],
      notes: review.notes || ''
    };

    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const query = review.id
        ? supabase.from('entity_ownership_reviews').update({ owners: payload.owners, notes: payload.notes || null, reviewed_at: new Date().toISOString() }).eq('id', review.id)
        : supabase.from('entity_ownership_reviews').insert({ company_id: selectedCompany.id, shareholder_id: isUuid(payload.shareholderId) ? payload.shareholderId : null, owners: payload.owners, notes: payload.notes || null });
      const { data, error } = await query.select('id, shareholder_id, owners, notes, reviewed_at, created_at').single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      if (review.id) {
        replaceCompanyDetail(selectedCompany.id, 'entityOwnershipReviews', review.id, mapEntityOwnershipReviewRow(data));
      } else {
        appendCompanyDetail(selectedCompany.id, 'entityOwnershipReviews', mapEntityOwnershipReviewRow(data));
      }
      logActivity({
        action: 'entity_ownership_review_saved',
        subjectType: 'entity_ownership_review',
        subjectId: data.id,
        details: buildEntityReviewAuditDetails(entityShareholder, existingReview, mapEntityOwnershipReviewRow(data))
      });
      return;
    }

    const localReview = { id: review.id || Date.now(), ...payload, reviewedAt: new Date().toISOString() };
    if (review.id) {
      replaceCompanyDetail(selectedCompany.id, 'entityOwnershipReviews', review.id, localReview);
    } else {
      appendCompanyDetail(selectedCompany.id, 'entityOwnershipReviews', localReview);
    }
    logActivity({ action: 'entity_ownership_review_saved', subjectType: 'entity_ownership_review', details: buildEntityReviewAuditDetails(entityShareholder, existingReview, localReview) });
  };

  const createBeneficialOwnersFromEntityReview = async (reviewId) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditBoRecords, 'Your role cannot create BO records from entity reviews.')) return;
    const detail = companyDetails[selectedCompany.id] || createEmptyCompanyDetail();
    const review = detail.entityOwnershipReviews.find((item) => item.id === reviewId);
    const shareholder = detail.shareholders.find((item) => String(item.id) === String(review?.shareholderId));
    if (!review || !shareholder) return;
    const people = entityReviewOwnersToBeneficialOwners(review, shareholder);
    for (const person of people) {
      await confirmBeneficialOwner(person);
    }
    logActivity({ action: 'entity_bo_records_created', subjectType: 'entity_ownership_review', subjectId: reviewId, details: { label: `${people.length} entity BO record${people.length === 1 ? '' : 's'} created` } });
  };

  const addContact = async (contact) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot edit contacts.')) return;
    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('company_contacts')
        .insert({
          company_id: selectedCompany.id,
          full_name: contact.fullName,
          role: contact.role || null,
          email: contact.email || null,
          phone: contact.phone || null,
          notes: contact.notes || null
        })
        .select('id, full_name, role, email, phone, notes')
        .single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      appendCompanyDetail(selectedCompany.id, 'contacts', mapContactRow(data));
      logActivity({ action: 'contact_added', subjectType: 'contact', subjectId: data.id, details: { label: contact.fullName } });
      return;
    }
    appendCompanyDetail(selectedCompany.id, 'contacts', { id: Date.now(), ...contact });
    logActivity({ action: 'contact_added', subjectType: 'contact', details: { label: contact.fullName } });
  };

  const updateContact = async (contact) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot edit contacts.')) return;
    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('company_contacts')
        .update({
          full_name: contact.fullName,
          role: contact.role || null,
          email: contact.email || null,
          phone: contact.phone || null,
          notes: contact.notes || null
        })
        .eq('id', contact.id)
        .select('id, full_name, role, email, phone, notes')
        .single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      replaceCompanyDetail(selectedCompany.id, 'contacts', contact.id, mapContactRow(data));
      logActivity({ action: 'contact_updated', subjectType: 'contact', subjectId: contact.id, details: { label: contact.fullName } });
      return;
    }
    replaceCompanyDetail(selectedCompany.id, 'contacts', contact.id, contact);
    logActivity({ action: 'contact_updated', subjectType: 'contact', subjectId: contact.id, details: { label: contact.fullName } });
  };

  const deleteContact = async (contactId) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canDeleteRecords, 'Your role cannot delete contacts.')) return;
    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { error } = await supabase.from('company_contacts').delete().eq('id', contactId);
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
    }
    removeCompanyDetail(selectedCompany.id, 'contacts', contactId);
    logActivity({ action: 'contact_deleted', subjectType: 'contact', subjectId: contactId, details: { label: 'Contact deleted' } });
  };

  const addTask = async (task) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot create follow-up tasks.')) return;
    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('follow_up_tasks')
        .insert({
          company_id: selectedCompany.id,
          contact_id: task.contactId || null,
          title: task.title,
          task_type: task.taskType || null,
          due_date: task.dueDate || null,
          status: task.status || 'open',
          notes: task.notes || null
        })
        .select('id, contact_id, title, task_type, due_date, status, notes')
        .single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      appendCompanyDetail(selectedCompany.id, 'tasks', mapTaskRow(data));
      logActivity({ action: 'task_created', subjectType: 'task', subjectId: data.id, details: { label: task.title, taskType: task.taskType || 'General' } });
      return;
    }
    appendCompanyDetail(selectedCompany.id, 'tasks', { id: Date.now(), ...task, status: task.status || 'open' });
    logActivity({ action: 'task_created', subjectType: 'task', details: { label: task.title, taskType: task.taskType || 'General' } });
  };

  const updateTask = async (task) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot update follow-up tasks.')) return;
    const existingTask = (companyDetails[selectedCompany.id] || createEmptyCompanyDetail()).tasks.find((item) => String(item.id) === String(task.id));
    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('follow_up_tasks')
        .update({
          contact_id: task.contactId || null,
          title: task.title,
          task_type: task.taskType || null,
          due_date: task.dueDate || null,
          status: task.status,
          notes: task.notes || null
        })
        .eq('id', task.id)
        .select('id, contact_id, title, task_type, due_date, status, notes')
        .single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      replaceCompanyDetail(selectedCompany.id, 'tasks', task.id, mapTaskRow(data));
      logActivity({
        action: task.status === 'done' ? 'task_completed' : 'task_updated',
        subjectType: 'task',
        subjectId: task.id,
        details: buildTaskAuditDetails(existingTask, mapTaskRow(data))
      });
      return;
    }
    replaceCompanyDetail(selectedCompany.id, 'tasks', task.id, task);
    logActivity({
      action: task.status === 'done' ? 'task_completed' : 'task_updated',
      subjectType: 'task',
      subjectId: task.id,
      details: buildTaskAuditDetails(existingTask, task)
    });
  };

  const deleteTask = async (taskId) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canDeleteRecords, 'Your role cannot delete follow-up tasks.')) return;
    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { error } = await supabase.from('follow_up_tasks').delete().eq('id', taskId);
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
    }
    removeCompanyDetail(selectedCompany.id, 'tasks', taskId);
    logActivity({ action: 'task_deleted', subjectType: 'task', subjectId: taskId, details: { label: 'Follow-up task deleted' } });
  };

  const appendCompanyDetail = (companyId, key, value) => {
    setCompanyDetails((current) => {
      const existing = current[companyId] || createEmptyCompanyDetail();
      return {
        ...current,
        [companyId]: {
          ...existing,
          [key]: [value, ...existing[key]]
        }
      };
    });
  };

  const logActivity = async ({ companyId = selectedCompany?.id, companyName, action, subjectType, subjectId, details = {} }) => {
    if (!companyId || !action) return;
    const createdAt = new Date().toISOString();
    const normalizedDetails = {
      ...details,
      actorEmail: session?.user?.email || 'Demo user',
      occurredAt: createdAt
    };
    const entry = {
      id: `activity-${Date.now()}`,
      action,
      subjectType,
      subjectId,
      details: normalizedDetails,
      createdAt
    };
    const resolvedCompanyName =
      companyName ||
      companies.find((company) => String(company.id) === String(companyId))?.name ||
      selectedCompany?.name ||
      normalizedDetails.label ||
      'Company';

    setCompanyDetails((current) => {
      const existing = current[companyId] || createEmptyCompanyDetail();
      return {
        ...current,
        [companyId]: {
          ...existing,
          activity: [entry, ...existing.activity].slice(0, 50)
        }
      };
    });
    setPracticeActivity((current) => [{ ...entry, companyId, companyName: resolvedCompanyName }, ...current].slice(0, 25));

    if (hasSupabaseConfig && session && practice) {
      const { error } = await supabase.from('activity_log').insert({
        practice_id: practice.id,
        company_id: companyId,
        actor_id: session.user.id,
        action,
        subject_type: subjectType,
        subject_id: isUuid(subjectId) ? subjectId : null,
        details: normalizedDetails
      });
      if (error) setAppError(error.message);
    }
  };

  const removeCompanyDetail = (companyId, key, id) => {
    setCompanyDetails((current) => {
      const existing = current[companyId] || createEmptyCompanyDetail();
      const nextDetail = {
        ...existing,
        [key]: existing[key].filter((item) => item.id !== id)
      };
      updateCompanyStatusFromDetail(companyId, nextDetail);
      return { ...current, [companyId]: nextDetail };
    });
  };

  const replaceCompanyDetail = (companyId, key, id, value) => {
    setCompanyDetails((current) => {
      const existing = current[companyId] || createEmptyCompanyDetail();
      const nextDetail = {
        ...existing,
        [key]: existing[key].map((item) => (item.id === id ? value : item))
      };
      updateCompanyStatusFromDetail(companyId, nextDetail);
      return { ...current, [companyId]: nextDetail };
    });
  };

  const updateShareholderCount = (companyId) => {
    refreshCompanyStatus(companyId);
    setSelectedCompany((current) =>
      current?.id === companyId ? { ...current, shareholders: (current.shareholders || 0) + 1, status: 'Action Required' } : current
    );
  };

  const addDocument = async (documentInput) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot upload company documents.')) return;
    const selectedFile = documentInput.file;
    const documentRecord = {
      id: `${documentInput.documentType}-${Date.now()}`,
      documentType: documentInput.documentType,
      originalFilename: selectedFile?.name || documentInput.originalFilename || documentLabel(documentInput.documentType),
      status: 'complete',
      filePath: null
    };

    if (hasSupabaseConfig && session && practice) {
      setIsSavingDetail(true);
      setAppError('');

      let filePath = null;
      if (selectedFile) {
        const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        filePath = `${practice.id}/${selectedCompany.id}/${documentInput.documentType}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from('company-documents')
          .upload(filePath, selectedFile, {
            contentType: selectedFile.type || 'application/pdf',
            upsert: false
          });

        if (uploadError) {
          setIsSavingDetail(false);
          setAppError(uploadError.message);
          return;
        }
      }

      const { data, error } = await supabase
        .from('documents')
        .insert({
          practice_id: practice.id,
          company_id: selectedCompany.id,
          document_type: documentInput.documentType,
          original_filename: documentRecord.originalFilename,
          file_path: filePath,
          status: 'complete',
          created_by: session.user.id
        })
        .select('id, document_type, original_filename, file_path, status')
        .single();
      setIsSavingDetail(false);

      if (error) {
        setAppError(error.message);
        return;
      }

      appendDocument(selectedCompany.id, mapDocumentRow(data));
      logActivity({
        action: 'document_added',
        subjectType: 'document',
        subjectId: data.id,
        details: {
          label: documentRecord.originalFilename,
          documentType: documentInput.documentType,
          summary: `${documentLabel(documentInput.documentType)} recorded: ${documentRecord.originalFilename}`,
          after: auditSnapshot(mapDocumentRow(data))
        }
      });
      return;
    }

    appendDocument(selectedCompany.id, documentRecord);
    logActivity({
      action: 'document_added',
      subjectType: 'document',
      subjectId: documentRecord.id,
      details: {
        label: documentRecord.originalFilename,
        documentType: documentInput.documentType,
        summary: `${documentLabel(documentInput.documentType)} recorded: ${documentRecord.originalFilename}`,
        after: auditSnapshot(documentRecord)
      }
    });
  };

  const deleteDocument = async (documentId) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canDeleteRecords, 'Your role cannot delete company documents.')) return;
    const detail = companyDetails[selectedCompany.id] || createEmptyCompanyDetail();
    const document = detail.documents.find((item) => item.id === documentId);

    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      if (document?.filePath) {
        const { error: storageError } = await supabase.storage.from('company-documents').remove([document.filePath]);
        if (storageError) {
          setIsSavingDetail(false);
          setAppError(storageError.message);
          return;
        }
      }
      const { error } = await supabase.from('documents').delete().eq('id', documentId);
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
    }

    setCompanyDetails((current) => {
      const existing = current[selectedCompany.id] || createEmptyCompanyDetail();
      const nextDocuments = existing.documents.filter((item) => item.id !== documentId);
      const nextDetail = {
        ...existing,
        documents: nextDocuments,
        mandatePrepared: document?.documentType === 'mandate_to_file' ? false : existing.mandatePrepared
      };
      updateCompanyStatusFromDetail(selectedCompany.id, nextDetail);
      return { ...current, [selectedCompany.id]: nextDetail };
    });
    logActivity({
      action: 'document_deleted',
      subjectType: 'document',
      subjectId: documentId,
      details: {
        label: document?.originalFilename || 'Document deleted',
        documentType: document?.documentType,
        summary: `${document?.originalFilename || 'Document'} removed from company records`,
        before: auditSnapshot(document)
      }
    });
  };

  const generateFilingPack = async () => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canGenerateFilingPack, 'Your role cannot generate CIPC filing packs.')) return;
    setActiveOperation('Generating filing pack...');
    const { jsPDF } = await import('jspdf');
    const detail = companyDetails[selectedCompany.id] || createEmptyCompanyDetail();
    const baseName = fileSafeName(selectedCompany.name);
    const boRegisterPdf = buildBoRegisterPdf(jsPDF, selectedCompany, detail);
    const mandatePdf = buildMandatePdf(jsPDF, selectedCompany, detail);

    downloadBlob(`${baseName}-beneficial-ownership-register.pdf`, boRegisterPdf);
    downloadBlob(`${baseName}-mandate-to-file.pdf`, mandatePdf);
    downloadTextFile(`${baseName}-bo-register.csv`, buildBoRegisterCsv(selectedCompany, detail), 'text/csv');

    if (hasSupabaseConfig && session && practice) {
      setIsSavingDetail(true);
      setAppError('');
      const timestamp = Date.now();
      const boPath = `${practice.id}/${selectedCompany.id}/filing_pack/${timestamp}-${baseName}-bo-register.pdf`;
      const mandatePath = `${practice.id}/${selectedCompany.id}/filing_pack/${timestamp}-${baseName}-mandate.pdf`;

      const [boUpload, mandateUpload] = await Promise.all([
        supabase.storage.from('company-documents').upload(boPath, boRegisterPdf, { contentType: 'application/pdf', upsert: false }),
        supabase.storage.from('company-documents').upload(mandatePath, mandatePdf, { contentType: 'application/pdf', upsert: false })
      ]);

      if (boUpload.error || mandateUpload.error) {
        setIsSavingDetail(false);
        setActiveOperation('');
        setAppError(boUpload.error?.message || mandateUpload.error?.message);
        return;
      }

      const { error } = await supabase
        .from('filing_packs')
        .insert({
          company_id: selectedCompany.id,
          generated_by: session.user.id,
          bo_register_pdf_path: boPath,
          mandate_pdf_path: mandatePath
        });

      setIsSavingDetail(false);

      if (error) {
        setActiveOperation('');
        setAppError(error.message);
        return;
      }

      appendFilingPack(selectedCompany.id, {
        id: `pack-${timestamp}`,
        boRegisterPdfPath: boPath,
        boRegisterCsvPath: null,
        mandatePdfPath: mandatePath,
        submissionStatus: 'not_submitted',
        submittedAt: '',
        cipcReference: '',
        submissionNotes: '',
        generatedAt: new Date().toISOString()
      });
      logActivity({ action: 'filing_pack_generated', subjectType: 'filing_pack', details: buildFilingPackAuditDetails(selectedCompany, detail) });
      setActiveOperation('');
      showSuccess('Filing pack generated', 'BO register, mandate and CSV files have been downloaded.');
      return;
    }
    logActivity({ action: 'filing_pack_generated', subjectType: 'filing_pack', details: buildFilingPackAuditDetails(selectedCompany, detail) });
    setActiveOperation('');
    showSuccess('Filing pack generated', 'BO register, mandate and CSV files have been downloaded.');
  };

  const updateAnnualReturn = async ({ filedDate, cipcReference, nextDueDate }) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot update annual return records.')) return;
    const previousCompany = selectedCompany;
    const nextCompany = {
      ...selectedCompany,
      nextDueDateRaw: nextDueDate,
      nextDueDate: formatCompanyDueDate(nextDueDate),
      annualReturnLastFiledDate: filedDate,
      annualReturnReference: cipcReference
    };

    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('company_profiles')
        .update({ next_due_date: nextDueDate || null })
        .eq('id', selectedCompany.id)
        .select('id, name, registration_number, company_type, compliance_status, next_due_date, incorporation_date, registered_address')
        .single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      const mapped = {
        ...mapCompanyRow(data),
        incorporationDate: data.incorporation_date || selectedCompany.incorporationDate || '',
        registeredAddress: data.registered_address || selectedCompany.registeredAddress || '',
        annualReturnLastFiledDate: filedDate,
        annualReturnReference: cipcReference,
        shareholders: selectedCompany.shareholders
      };
      setSelectedCompany(mapped);
      setCompanies((current) => current.map((company) => (company.id === mapped.id ? { ...company, ...mapped } : company)));
      logActivity({ action: 'annual_return_updated', subjectType: 'annual_return', details: buildAnnualReturnAuditDetails(previousCompany, mapped) });
      return;
    }

    setSelectedCompany(nextCompany);
    setCompanies((current) => current.map((company) => (company.id === nextCompany.id ? { ...company, ...nextCompany } : company)));
    logActivity({ action: 'annual_return_updated', subjectType: 'annual_return', details: buildAnnualReturnAuditDetails(previousCompany, nextCompany) });
  };

  const appendFilingPack = (companyId, filingPack) => {
    setCompanyDetails((current) => {
      const existing = current[companyId] || createEmptyCompanyDetail();
      return {
        ...current,
        [companyId]: {
          ...existing,
          filingPacks: [filingPack, ...existing.filingPacks]
        }
      };
    });
  };

  const updateFilingPackSubmission = async (packId, submission) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canSubmitFiling, 'Your role cannot update CIPC submission status.')) return;
    const currentPack = (companyDetails[selectedCompany.id] || createEmptyCompanyDetail()).filingPacks.find((pack) => String(pack.id) === String(packId)) || { id: packId };
    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('filing_packs')
        .update({
          submission_status: submission.submissionStatus,
          submitted_at: submission.submittedAt || null,
          cipc_reference: submission.cipcReference || null,
          submission_notes: submission.submissionNotes || null
        })
        .eq('id', packId)
        .select('id, bo_register_pdf_path, bo_register_csv_path, mandate_pdf_path, submission_status, submitted_at, cipc_reference, submission_notes, generated_at')
        .single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      replaceCompanyDetail(selectedCompany.id, 'filingPacks', packId, mapFilingPackRow(data));
      logActivity({ action: 'filing_submission_updated', subjectType: 'filing_pack', subjectId: packId, details: buildSubmissionAuditDetails(currentPack, mapFilingPackRow(data)) });
      return;
    }
    const nextPack = { ...currentPack, ...submission };
    replaceCompanyDetail(selectedCompany.id, 'filingPacks', packId, nextPack);
    logActivity({ action: 'filing_submission_updated', subjectType: 'filing_pack', subjectId: packId, details: buildSubmissionAuditDetails(currentPack, nextPack) });
  };

  const openStoragePath = async (filePath) => {
    if (!filePath || !hasSupabaseConfig || !session) return;
    const { data, error } = await supabase.storage.from('company-documents').createSignedUrl(filePath, 60);
    if (error) {
      setAppError(error.message);
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const updateCompanyProfile = async (profile) => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot edit company profiles.')) return;
    const previousCompany = selectedCompany;
    const nextCompany = {
      ...selectedCompany,
      name: profile.name,
      registrationNumber: profile.registrationNumber,
      type: profile.type,
      incorporationDate: profile.incorporationDate,
      registeredAddress: profile.registeredAddress
    };

    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('company_profiles')
        .update({
          name: profile.name,
          registration_number: profile.registrationNumber,
          company_type: profile.type,
          incorporation_date: profile.incorporationDate || null,
          registered_address: profile.registeredAddress || null
        })
        .eq('id', selectedCompany.id)
        .select('id, name, registration_number, company_type, compliance_status, next_due_date, incorporation_date, registered_address')
        .single();
      setIsSavingDetail(false);

      if (error) {
        setAppError(error.message);
        return;
      }

      const mapped = {
        ...mapCompanyRow(data),
        incorporationDate: data.incorporation_date || '',
        registeredAddress: data.registered_address || '',
        shareholders: selectedCompany.shareholders
      };
      setSelectedCompany(mapped);
      setCompanies((current) => current.map((company) => (company.id === mapped.id ? { ...company, ...mapped } : company)));
      logActivity({ action: 'company_profile_updated', subjectType: 'company', subjectId: mapped.id, details: buildCompanyProfileAuditDetails(previousCompany, mapped) });
      return;
    }

    setSelectedCompany(nextCompany);
    setCompanies((current) => current.map((company) => (company.id === nextCompany.id ? { ...company, ...nextCompany } : company)));
    logActivity({ action: 'company_profile_updated', subjectType: 'company', subjectId: nextCompany.id, details: buildCompanyProfileAuditDetails(previousCompany, nextCompany) });
  };

  const updatePracticeName = async (name) => {
    if (!practice) return;
    if (!requirePermission(permissions.canManagePractice, 'Your role cannot update practice settings.')) return;
    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('practices')
        .update({ name })
        .eq('id', practice.id)
        .select('id, name, created_by')
        .single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      setPractice(data);
      return;
    }
    setPractice({ id: 'demo', name });
  };

  const invitePracticeMember = async ({ email, role }) => {
    if (!practice) return;
    if (!requirePermission(permissions.canManagePractice, 'Your role cannot invite practice members.')) return;
    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('practice_invitations')
        .insert({
          practice_id: practice.id,
          email,
          role,
          status: 'pending',
          invited_by: session.user.id
        })
        .select('id, email, role, status, invited_by, created_at')
        .single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      setPracticeInvitations((current) => [data, ...current]);
      return;
    }
    setPracticeInvitations((current) => [
      { id: Date.now(), email, role, status: 'pending', created_at: new Date().toISOString() },
      ...current
    ]);
  };

  const revokePracticeInvitation = async (invitationId) => {
    if (!requirePermission(permissions.canManagePractice, 'Your role cannot revoke practice invitations.')) return;
    if (hasSupabaseConfig && session) {
      setIsSavingDetail(true);
      const { data, error } = await supabase
        .from('practice_invitations')
        .update({ status: 'revoked' })
        .eq('id', invitationId)
        .select('id, email, role, status, invited_by, created_at')
        .single();
      setIsSavingDetail(false);
      if (error) {
        setAppError(error.message);
        return;
      }
      setPracticeInvitations((current) => current.map((item) => (item.id === invitationId ? data : item)));
      return;
    }
    setPracticeInvitations((current) => current.map((item) => (item.id === invitationId ? { ...item, status: 'revoked' } : item)));
  };

  const appendDocument = (companyId, documentRecord) => {
    setCompanyDetails((current) => {
      const existing = current[companyId] || createEmptyCompanyDetail();
      const nextDocuments = [
        documentRecord,
        ...existing.documents.filter((document) => document.documentType !== documentRecord.documentType)
      ];
      const nextDetail = {
        ...existing,
        documents: nextDocuments,
        mandatePrepared: documentRecord.documentType === 'mandate_to_file' ? true : existing.mandatePrepared
      };
      updateCompanyStatusFromDetail(companyId, nextDetail);
      return { ...current, [companyId]: nextDetail };
    });
  };

  const toggleMandate = () => {
    if (!selectedCompany) return;
    if (!requirePermission(permissions.canEditCompany, 'Your role cannot update mandate status.')) return;
    setCompanyDetails((current) => {
      const existing = current[selectedCompany.id] || createEmptyCompanyDetail();
      const nextMandateState = !existing.mandatePrepared;
      const nextDetail = {
        ...existing,
        mandatePrepared: nextMandateState,
        documents: nextMandateState
          ? existing.documents.some((document) => document.documentType === 'mandate_to_file')
            ? existing.documents
            : [
                {
                  id: `mandate_to_file-${Date.now()}`,
                  documentType: 'mandate_to_file',
                  originalFilename: documentLabel('mandate_to_file'),
                  status: 'complete',
                  filePath: null
                },
                ...existing.documents
              ]
          : existing.documents.filter((document) => document.documentType !== 'mandate_to_file')
      };
      updateCompanyStatusFromDetail(selectedCompany.id, nextDetail);
      return { ...current, [selectedCompany.id]: nextDetail };
    });
    logActivity({ action: 'mandate_status_changed', subjectType: 'document', details: { label: 'Mandate to File status changed' } });
  };

  const updateCompanyStatusFromDetail = (companyId, detail) => {
    const status = calculateComplianceStatus(detail);
    setCompanies((current) => current.map((company) => (company.id === companyId ? { ...company, status } : company)));
    setSelectedCompany((current) => (current?.id === companyId ? { ...current, status } : current));
    if (hasSupabaseConfig && session) {
      supabase.from('company_profiles').update({ compliance_status: status }).eq('id', companyId).then(({ error }) => {
        if (error) setAppError(error.message);
      });
    }
  };

  const refreshCompanyStatus = (companyId) => {
    setCompanyDetails((current) => {
      updateCompanyStatusFromDetail(companyId, current[companyId] || createEmptyCompanyDetail());
      return current;
    });
  };

  const enterApp = () => {
    if (hasSupabaseConfig && !session) {
      setView('auth');
      return;
    }
    setView('dashboard');
  };

  const signOut = async () => {
    if (hasSupabaseConfig) {
      await supabase.auth.signOut();
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-paper text-ink">
      {view === 'auth' ? (
        <AuthScreen onBack={() => setView('landing')} />
      ) : view === 'acceptInvite' ? (
        <AcceptInvitationScreen
          invitations={pendingInvitations}
          onAccept={acceptInvitation}
          onSkip={skipInvitations}
          error={appError}
        />
      ) : view === 'landing' ? (
        <Landing onEnter={enterApp} />
      ) : (
        <AppErrorBoundary onRecover={() => { setSelectedCompany(null); setAppError(null); }}>
          <Dashboard
            companies={companies}
            onAddCompany={() => setShowCompanyForm(true)}
            onBack={() => setView('landing')}
            onSignOut={signOut}
            practiceName={practice?.name || 'Smith & Partners Inc.'}
            userEmail={session?.user?.email}
            isDemo={!hasSupabaseConfig || !session}
            appError={appError}
            operationNotice={operationNotice}
            activeOperation={activeOperation}
            onDismissOperationNotice={() => setOperationNotice(null)}
            allTasks={allTasks}
            entityReviewLookup={entityReviewLookup}
            recentActivity={practiceActivity}
            selectedCompany={selectedCompany}
            companyDetail={selectedCompany ? companyDetails[selectedCompany.id] || createEmptyCompanyDetail() : null}
            onSelectCompany={selectCompany}
            onImportCompanies={importCompanies}
            onClearCompany={() => setSelectedCompany(null)}
            onAddDirector={addDirector}
            onAddShareholder={addShareholder}
            onUpdateDirector={updateDirector}
            onUpdateShareholder={updateShareholder}
            onSaveDirectorChange={saveDirectorChange}
            onUpdateDirectorChangeStatus={updateDirectorChangeStatus}
            onSaveShareTransaction={saveShareTransaction}
            onUpdateShareTransactionStatus={updateShareTransactionStatus}
            onConfirmBeneficialOwner={confirmBeneficialOwner}
            onDeleteBeneficialOwner={deleteBeneficialOwner}
            onSaveTrustReview={saveTrustReview}
            onCreateBeneficialOwnersFromTrustReview={createBeneficialOwnersFromTrustReview}
            onSaveEntityOwnershipReview={saveEntityOwnershipReview}
            onCreateBeneficialOwnersFromEntityReview={createBeneficialOwnersFromEntityReview}
            onAddContact={addContact}
            onUpdateContact={updateContact}
            onDeleteContact={deleteContact}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onAddDocument={addDocument}
            onDeleteDirector={deleteDirector}
            onDeleteShareholder={deleteShareholder}
            onDeleteDocument={deleteDocument}
              onToggleMandate={toggleMandate}
              onGenerateFilingPack={generateFilingPack}
              onUpdateAnnualReturn={updateAnnualReturn}
              onUpdateFilingPackSubmission={updateFilingPackSubmission}
              onOpenStoragePath={openStoragePath}
              onUpdateCompanyProfile={updateCompanyProfile}
            onUpdatePracticeName={updatePracticeName}
            onExportPracticeData={exportPracticeData}
            onRestorePracticeData={restorePracticeData}
            practice={practice}
            practiceMembers={practiceMembers}
            practiceInvitations={practiceInvitations}
            session={session}
            hasSupabaseConfig={hasSupabaseConfig}
            currentUserRole={currentUserRole}
            permissions={permissions}
            databaseFeatures={databaseFeatures}
            onInvitePracticeMember={invitePracticeMember}
            onRevokePracticeInvitation={revokePracticeInvitation}
            isSavingDetail={isSavingDetail}
            isSavingCompany={isSavingCompany}
          />
        </AppErrorBoundary>
      )}
      {showCompanyForm && (
        <CompanyModal
          onClose={() => setShowCompanyForm(false)}
          onSubmit={addCompany}
          isSaving={isSavingCompany}
          error={appError}
        />
      )}
    </div>
  );
}

function mapCompanyRow(row) {
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

function buildPermissions(role) {
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

function roleLabel(role) {
  return {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    read_only: 'Read-only'
  }[role] || 'Read-only';
}

function createEmptyCompanyDetail() {
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

function mapDirectorRow(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    idNumber: row.id_number || '',
    appointmentDate: row.appointment_date || ''
  };
}

function mapShareholderRow(row) {
  return {
    id: row.id,
    shareholderType: normaliseShareholderType(row.shareholder_type) || row.shareholder_type,
    name: row.name,
    idNumber: row.id_number || '',
    ownershipPercentage: Number(row.ownership_percentage || 0)
  };
}

function mapBeneficialOwnerRow(row) {
  return {
    id: row.id,
    shareholderId: row.shareholder_id || '',
    fullName: row.full_name,
    idNumber: row.id_number || '',
    ownershipPercentage: Number(row.ownership_percentage || 0),
    controlBasis: row.control_basis || '',
    notes: row.notes || '',
    createdAt: row.created_at || ''
  };
}

function mapTrustReviewRow(row) {
  return {
    id: row.id,
    shareholderId: row.shareholder_id || '',
    trustees: Array.isArray(row.trustees) ? row.trustees : [],
    beneficiaries: Array.isArray(row.beneficiaries) ? row.beneficiaries : [],
    founders: Array.isArray(row.founders) ? row.founders : [],
    controllers: Array.isArray(row.controllers) ? row.controllers : [],
    notes: row.notes || '',
    reviewedAt: row.reviewed_at || '',
    createdAt: row.created_at || ''
  };
}

function mapEntityOwnershipReviewRow(row) {
  return {
    id: row.id,
    shareholderId: row.shareholder_id || '',
    owners: Array.isArray(row.owners) ? row.owners : [],
    notes: row.notes || '',
    reviewedAt: row.reviewed_at || '',
    createdAt: row.created_at || ''
  };
}

function mapDocumentRow(row) {
  return {
    id: row.id,
    documentType: row.document_type,
    originalFilename: row.original_filename || documentLabel(row.document_type),
    filePath: row.file_path || null,
    status: row.status || 'complete'
  };
}

function mapContactRow(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    role: row.role || '',
    email: row.email || '',
    phone: row.phone || '',
    notes: row.notes || ''
  };
}

function mapTaskRow(row) {
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

function mapActivityRow(row) {
  return {
    id: row.id,
    action: row.action,
    subjectType: row.subject_type || '',
    subjectId: row.subject_id || '',
    details: row.details || {},
    createdAt: row.created_at
  };
}

function mapPracticeActivityRow(row) {
  const companyProfile = Array.isArray(row.company_profiles) ? row.company_profiles[0] : row.company_profiles;
  return {
    ...mapActivityRow(row),
    companyId: row.company_id || '',
    companyName: companyProfile?.name || 'Company'
  };
}

function mapFilingPackRow(row) {
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

function mapDirectorChangeRow(row) {
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

function mapShareTransactionRow(row) {
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

function auditSnapshot(value) {
  if (!value) return null;
  return JSON.parse(JSON.stringify(value));
}

function buildCompanyProfileAuditDetails(before, after) {
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

function buildTrustReviewAuditDetails(shareholder, before, after) {
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

function buildEntityReviewAuditDetails(shareholder, before, after) {
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

function buildFilingPackAuditDetails(company, detail) {
  const validation = getComplianceValidation(company, detail);
  return {
    label: 'CIPC filing pack generated',
    summary: `Generated filing pack with ${detail.beneficialOwners?.length || 0} confirmed BO record${(detail.beneficialOwners?.length || 0) === 1 ? '' : 's'}`,
    beneficialOwnerCount: detail.beneficialOwners?.length || 0,
    shareholderCount: detail.shareholders?.length || 0,
    directorCount: detail.directors?.length || 0,
    validationCriticalCount: validation.criticalCount,
    validationWarningCount: validation.warningCount
  };
}

function buildAnnualReturnAuditDetails(before, after) {
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

function buildDirectorChangeAuditDetails(change) {
  return {
    label: directorChangeTarget(change),
    summary: `${directorChangeTypeLabel(change.changeType)} filing created for ${directorChangeTarget(change)}`,
    changeType: change.changeType,
    status: change.submissionStatus,
    after: auditSnapshot(change)
  };
}

function buildDirectorChangeStatusAuditDetails(before, after) {
  return {
    label: directorChangeTarget(after),
    summary: `${directorChangeTypeLabel(after.changeType)} filing moved from ${directorChangeStatusLabel(before?.submissionStatus)} to ${directorChangeStatusLabel(after?.submissionStatus)}`,
    reference: after?.cipcReference || '',
    before: auditSnapshot(before),
    after: auditSnapshot(after)
  };
}

function buildShareTransactionAuditDetails(transaction) {
  return {
    label: shareTransactionTypeLabel(transaction.transactionType),
    summary: `${shareTransactionTypeLabel(transaction.transactionType)} transaction created for ${transaction.ownershipPercentage}% ${transaction.shareClass || 'Ordinary'} shares`,
    transactionType: transaction.transactionType,
    status: transaction.status,
    after: auditSnapshot(transaction)
  };
}

function buildShareTransactionStatusAuditDetails(before, after, detail) {
  return {
    label: shareTransactionTypeLabel(after.transactionType),
    summary: `${shareTransactionTypeLabel(after.transactionType)} transaction moved from ${shareTransactionStatusLabel(before?.status)} to ${shareTransactionStatusLabel(after?.status)}${after?.status === 'accepted' ? ' and updated the shareholder register' : ''}`,
    from: shareholderNameById(detail.shareholders || [], after.fromShareholderId),
    to: shareholderNameById(detail.shareholders || [], after.toShareholderId) || after.toShareholderName || '',
    before: auditSnapshot(before),
    after: auditSnapshot(after)
  };
}

function buildSubmissionAuditDetails(before, after) {
  return {
    label: filingSubmissionLabel(after?.submissionStatus),
    summary: `CIPC submission changed from ${filingSubmissionLabel(before?.submissionStatus)} to ${filingSubmissionLabel(after?.submissionStatus)}`,
    reference: after?.cipcReference || '',
    before: auditSnapshot({
      submissionStatus: before?.submissionStatus || 'not_submitted',
      submittedAt: before?.submittedAt || '',
      cipcReference: before?.cipcReference || '',
      submissionNotes: before?.submissionNotes || ''
    }),
    after: auditSnapshot({
      submissionStatus: after?.submissionStatus || 'not_submitted',
      submittedAt: after?.submittedAt || '',
      cipcReference: after?.cipcReference || '',
      submissionNotes: after?.submissionNotes || ''
    })
  };
}

function buildTaskAuditDetails(before, after) {
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

function buildProductionReadiness({ hasSupabaseConfig, envStatus, session, practice, practiceMembers, currentUserRole, permissions, companies, databaseFeatures }) {
  const directorFeature = databaseFeatures?.directorChanges || createDatabaseFeatureStatus();
  const shareFeature = databaseFeatures?.shareTransactions || createDatabaseFeatureStatus();
  const workflowTablesReady = !hasSupabaseConfig || (directorFeature.available && shareFeature.available);
  return [
    {
      label: 'VITE_SUPABASE_URL',
      ok: envStatus.hasUrl,
      detail: envStatus.hasUrl ? `Configured for ${envStatus.projectHost}.` : 'Missing. Add VITE_SUPABASE_URL to your deployment environment.'
    },
    {
      label: 'VITE_SUPABASE_ANON_KEY',
      ok: envStatus.hasAnonKey,
      detail: envStatus.hasAnonKey ? 'Configured.' : 'Missing. Add VITE_SUPABASE_ANON_KEY to your deployment environment.'
    },
    {
      label: 'Authentication',
      ok: Boolean(session?.user?.email),
      warning: hasSupabaseConfig && !session?.user?.email,
      detail: session?.user?.email ? `Signed in as ${session.user.email}.` : hasSupabaseConfig ? 'Supabase is configured, but no user session is active.' : 'Demo mode bypasses Supabase authentication.'
    },
    {
      label: 'Practice access',
      ok: Boolean(practice?.id) || !hasSupabaseConfig,
      detail: practice?.id ? `Practice loaded with role ${roleLabel(currentUserRole)}.` : 'No Supabase practice workspace loaded.'
    },
    {
      label: 'Role permissions',
      ok: permissions.canManagePractice || permissions.canEditCompany || permissions.isReadOnly,
      warning: permissions.isReadOnly,
      detail: permissions.isReadOnly ? 'Current user can view records and export reports only.' : `Current user can ${permissions.canManagePractice ? 'manage the practice and ' : ''}edit compliance records.`
    },
    {
      label: 'Storage bucket',
      ok: hasSupabaseConfig,
      warning: !hasSupabaseConfig,
      detail: hasSupabaseConfig
        ? 'Document storage is platform-managed. Users do not need Supabase access.'
        : 'Storage is unavailable in demo mode.'
    },
    {
      label: 'Client data',
      ok: companies.length > 0,
      warning: companies.length === 0,
      detail: `${companies.length} compan${companies.length === 1 ? 'y' : 'ies'} loaded.`
    },
    {
      label: 'Team records',
      ok: practiceMembers.length > 0 || !hasSupabaseConfig,
      warning: hasSupabaseConfig && practiceMembers.length === 0,
      detail: hasSupabaseConfig ? `${practiceMembers.length} membership record${practiceMembers.length === 1 ? '' : 's'} visible.` : 'Skipped in demo mode.'
    },
    {
      label: 'Workflow tables',
      ok: workflowTablesReady,
      warning: hasSupabaseConfig && !workflowTablesReady,
      detail: workflowTablesReady
        ? 'Director change and share register workflow tables are available.'
        : [
            !directorFeature.available ? databaseFeatureUnavailableMessage('Director change filings', directorFeature) : '',
            !shareFeature.available ? databaseFeatureUnavailableMessage('Share register maintenance', shareFeature) : ''
          ].filter(Boolean).join(' ')
    }
  ];
}

const productionQaStorageKey = 'secretarialdesk-production-qa-v1';

function loadProductionQaChecks() {
  try {
    return JSON.parse(window.localStorage.getItem(productionQaStorageKey) || '{}');
  } catch {
    return {};
  }
}

function saveProductionQaChecks(checks) {
  try {
    window.localStorage.setItem(productionQaStorageKey, JSON.stringify(checks));
  } catch {
    // Local storage is optional; the checklist still works for the current session.
  }
}

function buildProductionQaChecklist({ hasSupabaseConfig, session, practice, companies, qaChecks, databaseFeatures }) {
  const workflowTablesReady = !hasSupabaseConfig ||
    (databaseFeatures?.directorChanges?.available !== false && databaseFeatures?.shareTransactions?.available !== false);
  return [
    {
      key: 'supabase-configured',
      label: 'Supabase configured',
      ok: hasSupabaseConfig,
      detail: hasSupabaseConfig ? 'The app is using Supabase instead of demo mode.' : 'Add Supabase env vars before production testing.'
    },
    {
      key: 'signed-in',
      label: 'Authentication tested',
      ok: Boolean(session?.user?.email),
      detail: session?.user?.email ? `Signed in as ${session.user.email}.` : 'Sign up/sign in with a real user.'
    },
    {
      key: 'practice-loaded',
      label: 'Practice workspace loaded',
      ok: Boolean(practice?.id),
      detail: practice?.id ? 'Practice and role context are available.' : 'Create or join a practice.'
    },
    {
      key: 'migration-016',
      label: 'Migration 016 run',
      ok: workflowTablesReady && Boolean(qaChecks['migration-016']),
      manual: true,
      detail: workflowTablesReady
        ? 'Confirm director_changes and share_transactions tables exist with RLS policies.'
        : 'Run migration 016_secretarial_filing_workflows.sql before completing workflow QA.'
    },
    {
      key: 'company-create-refresh',
      label: 'Company creation persists after refresh',
      ok: Boolean(qaChecks['company-create-refresh']),
      manual: true,
      detail: 'Create a company, refresh, and confirm it remains visible.'
    },
    {
      key: 'bo-flow-refresh',
      label: 'BO workflow persists after refresh',
      ok: Boolean(qaChecks['bo-flow-refresh']),
      manual: true,
      detail: 'Capture shareholders, trust/company look-through and BO records, then refresh and confirm they remain.'
    },
    {
      key: 'filing-pack-generate',
      label: 'Filing pack generation tested',
      ok: Boolean(qaChecks['filing-pack-generate']),
      manual: true,
      detail: 'Generate BO Register and Mandate PDFs/CSV, then confirm filing history is created.'
    },
    {
      key: 'director-change-refresh',
      label: 'Director change workflow persists',
      ok: Boolean(qaChecks['director-change-refresh']),
      manual: true,
      detail: 'Create, submit and accept a director change, refresh, and confirm the filing and director register.'
    },
    {
      key: 'share-transaction-refresh',
      label: 'Share transaction workflow persists',
      ok: Boolean(qaChecks['share-transaction-refresh']),
      manual: true,
      detail: 'Create and accept a share transaction, refresh, and confirm the transaction and shareholder register.'
    },
    {
      key: 'activity-log',
      label: 'Activity log records key actions',
      ok: Boolean(qaChecks['activity-log']),
      manual: true,
      detail: 'Confirm company, BO, filing pack, director change and share transaction actions appear in Activity.'
    },
    {
      key: 'companies-loaded',
      label: 'At least one client company loaded',
      ok: companies.length > 0,
      detail: `${companies.length} compan${companies.length === 1 ? 'y' : 'ies'} currently loaded.`
    }
  ];
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-6 text-center text-ink">
      <div>
        <BrandMark />
        <p className="mt-6 text-sm text-ink/60">Loading your compliance workspace...</p>
      </div>
    </div>
  );
}

function AuthScreen({ onBack }) {
  const [mode, setMode] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [practiceName, setPracticeName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setMessage('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    if (mode === 'forgot') {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}?view=dashboard`
      });
      setIsSubmitting(false);
      if (resetError) {
        setError(resetError.message);
      } else {
        setMessage('Password reset email sent. Check your inbox and follow the link to set a new password.');
      }
      return;
    }

    const result =
      mode === 'sign-up'
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { practice_name: practiceName || 'My Secretarial Practice' } }
          })
        : await supabase.auth.signInWithPassword({ email, password });

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (mode === 'sign-up' && !result.data.session) {
      setMessage('Check your email to confirm your account, then sign in.');
    }
  };

  const canSubmit = mode === 'forgot' ? Boolean(email) : Boolean(email && password);

  const heading = { 'sign-in': 'Log in', 'sign-up': 'Create your account', forgot: 'Reset your password' };
  const subtext = {
    'sign-in': 'Access your practice dashboard.',
    'sign-up': 'Create the first user for your accounting practice.',
    forgot: 'Enter your email and we will send a reset link.'
  };
  const submitLabel = { 'sign-in': 'Log in', 'sign-up': 'Sign up', forgot: 'Send reset link' };

  return (
    <main className="grid min-h-screen bg-paper lg:grid-cols-[0.9fr_1fr]">
      <section className="hidden border-r border-ink/10 bg-white px-12 py-10 lg:block">
        <BrandMark />
        <div className="mt-24 max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Secure practice workspace</p>
          <h1 className="mt-6 font-serif text-6xl font-semibold leading-[1.05]">Sign in to manage Beneficial Ownership compliance.</h1>
          <p className="mt-7 text-lg leading-8 text-ink/65">
            Supabase Auth protects access to firm records, company profiles, shareholder data and generated CIPC filing packs.
          </p>
        </div>
      </section>
      <section className="grid place-items-center px-6 py-10">
        <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-ink/10 bg-white p-6 shadow-panel">
          <button type="button" onClick={onBack} className="mb-8 text-sm font-medium text-ink/60">← Back to landing</button>
          <h2 className="text-3xl font-semibold">{heading[mode]}</h2>
          <p className="mt-2 text-sm leading-6 text-ink/60">{subtext[mode]}</p>

          <div className="mt-7 space-y-5">
            {mode === 'sign-up' && (
              <Field label="Practice name" value={practiceName} onChange={setPracticeName} placeholder="e.g. Smith & Partners Inc." />
            )}
            <Field type="email" label="Email address" value={email} onChange={setEmail} placeholder="you@practice.co.za" />
            {mode !== 'forgot' && (
              <Field type="password" label="Password" value={password} onChange={setPassword} placeholder="Minimum 6 characters" />
            )}
          </div>

          {mode === 'sign-in' && (
            <div className="mt-3 text-right">
              <button type="button" onClick={() => switchMode('forgot')} className="text-xs font-medium text-ink/50 hover:text-ink">
                Forgot password?
              </button>
            </div>
          )}

          {error && <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
          {message && <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}

          <button
            disabled={isSubmitting || !canSubmit}
            className="mt-7 w-full rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/30"
          >
            {isSubmitting ? 'Please wait…' : submitLabel[mode]}
          </button>

          {mode === 'forgot' ? (
            <button type="button" onClick={() => switchMode('sign-in')} className="mt-5 w-full text-sm font-medium text-gold">
              Back to sign in
            </button>
          ) : (
            <button type="button" onClick={() => switchMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')} className="mt-5 w-full text-sm font-medium text-gold">
              {mode === 'sign-up' ? 'Already have an account? Log in' : 'Need an account? Sign up'}
            </button>
          )}
        </form>
      </section>
    </main>
  );
}

function AcceptInvitationScreen({ invitations, onAccept, onSkip, error }) {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-6 py-10">
      <section className="w-full max-w-3xl rounded-lg border border-ink/10 bg-white p-6 shadow-panel">
        <BrandMark />
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Practice invitation</p>
          <h1 className="mt-3 text-3xl font-semibold">Join an existing practice workspace</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">
            You have been invited to collaborate on an existing SecretarialDesk practice. Accepting an invitation will add your account to that workspace.
          </p>
        </div>

        {error && <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

        <div className="mt-6 space-y-3">
          {invitations.map((invite) => (
            <div key={invite.id} className="flex flex-col gap-4 rounded-md border border-ink/10 bg-paper p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">{invite.practices?.name || 'Practice workspace'}</p>
                <p className="mt-1 text-sm text-ink/60">Role: {invite.role} | Invited: {invite.created_at ? new Date(invite.created_at).toLocaleDateString('en-ZA') : 'Not set'}</p>
              </div>
              <button onClick={() => onAccept(invite)} className="rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white">
                Accept invitation
              </button>
            </div>
          ))}
        </div>

        <button onClick={onSkip} className="mt-6 text-sm font-semibold text-gold">
          Skip and create my own practice
        </button>
      </section>
    </main>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-md border border-gold/40 bg-white text-gold shadow-sm">
        <ShieldCheck className="h-6 w-6" />
      </div>
      <span className="text-2xl font-semibold tracking-normal text-forest">SecretarialDesk</span>
    </div>
  );
}

function Landing({ onEnter }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const navItems = [
    { href: '#features', label: 'Features' },
    { href: '#workflow', label: 'How it works' },
    { href: '#security', label: 'Security' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#faq', label: 'FAQ' }
  ];

  const faqs = [
    {
      q: 'Who is SecretarialDesk for?',
      a: 'South African Chartered Accountants and accounting firms managing Beneficial Ownership compliance across multiple client companies.'
    },
    {
      q: 'Does this submit filings to CIPC for me?',
      a: 'SecretarialDesk produces the Beneficial Ownership Register and Mandate to File documents, ready for upload via the CIPC e-services portal. Direct submission is on the roadmap.'
    },
    {
      q: 'How is my client data protected?',
      a: 'All data is encrypted in transit and at rest, isolated per practice with row-level security, and backed up daily with point-in-time recovery.'
    },
    {
      q: 'Can I import an existing client list?',
      a: 'You can add companies one at a time today. CSV bulk import is in beta — contact us and we will enable it on your account.'
    },
    {
      q: 'What happens after the free trial?',
      a: 'Choose a plan to keep going, or your data stays read-only for 30 days while you decide. We never delete client records without confirmation.'
    }
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <BrandMark />
          <nav className="hidden items-center gap-9 text-sm font-medium text-ink/70 lg:flex">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="transition hover:text-ink">{item.label}</a>
            ))}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <button onClick={onEnter} className="rounded-md px-4 py-2 text-sm font-medium text-ink/80 hover:text-ink">
              Log in
            </button>
            <button onClick={onEnter} className="rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0b382d]">
              Start free trial
            </button>
          </div>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="rounded-md border border-ink/10 p-2 lg:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-ink/10 bg-white px-6 py-5 lg:hidden">
            <div className="flex flex-col gap-4 text-sm font-medium text-ink/75">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>{item.label}</a>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <button onClick={onEnter} className="rounded-md border border-ink/15 bg-white px-4 py-3 text-sm font-medium">
                Log in
              </button>
              <button onClick={onEnter} className="rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white">
                Start free trial
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 h-[420px] bg-gradient-to-b from-sage/40 via-paper to-paper" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-[0.85fr_1fr] lg:items-center lg:pt-24">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                <Sparkles className="h-3.5 w-3.5" />
                Built for South African Chartered Accountants
              </div>
              <h1 className="font-serif text-4xl font-semibold leading-[1.05] text-ink sm:text-5xl md:text-6xl lg:text-7xl">
                CIPC Beneficial Ownership compliance, <span className="text-forest">finally calm.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-ink/68">
                A purpose-built workspace for accounting practices managing Beneficial Ownership filings across their client base. Replace spreadsheets and email threads with one trusted system.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button onClick={onEnter} className="inline-flex items-center justify-center gap-2 rounded-md bg-forest px-7 py-4 text-sm font-semibold text-white shadow-sm hover:bg-[#0b382d]">
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={onEnter} className="rounded-md border border-ink/15 bg-white px-7 py-4 text-sm font-semibold text-ink hover:border-ink/30">
                  Book a demo
                </button>
              </div>
              <p className="mt-5 text-xs text-ink/55">No credit card required · 14-day trial · POPIA-aligned</p>
              <div className="mt-10 grid gap-4 text-sm text-ink/70 sm:grid-cols-3">
                <ProofPoint icon={<ShieldCheck />} text="Aligned to the Companies Act" />
                <ProofPoint icon={<FileArchive />} text="One-click CIPC filing packs" />
                <ProofPoint icon={<Users />} text="Centralise every client" />
              </div>
            </div>

            <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
              <ProductPreview />
            </div>
          </div>
        </section>

        <section className="border-y border-ink/10 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-ink/45">
              Trusted by accounting practices across South Africa
            </p>
            <div className="mt-7 grid grid-cols-2 gap-x-12 gap-y-6 text-center font-serif text-base text-ink/40 sm:grid-cols-3 lg:grid-cols-6">
              {['Mafadi & Co', 'Cape Audit Group', 'Khaya Advisory', 'Drakensberg CA', 'Highveld Partners', 'Tafelberg Trust'].map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-paper">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-gold">The compliance burden</p>
              <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
                BO compliance shouldn't slow your practice down.
              </h2>
              <p className="mt-5 text-lg leading-8 text-ink/68">
                Filing Beneficial Ownership data with CIPC is now table stakes. Doing it manually across dozens of clients is not.
              </p>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              <PainCard
                icon={<Clock />}
                title="Hours per client"
                body="Cross-checking share registers, trust deeds and MoIs by hand for every entity in your book."
              />
              <PainCard
                icon={<AlertTriangle />}
                title="Audit-trail gaps"
                body="Email chains and shared drives won't hold up when CIPC asks how you reached a conclusion."
              />
              <PainCard
                icon={<CalendarDays />}
                title="Missed deadlines"
                body="Annual filings, changes in control, new directors — easy to lose track of across 50+ clients."
              />
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-ink/10 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-gold">Everything you need</p>
              <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
                A purpose-built compliance workspace.
              </h2>
              <p className="mt-5 text-lg leading-8 text-ink/68">
                From client onboarding through to filing pack generation — designed around the way South African practices already work.
              </p>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Building2 />}
                title="Company profiles"
                body="One source of truth for every client — directors, shareholders, addresses, and current CIPC compliance status."
              />
              <FeatureCard
                icon={<BrainCircuit />}
                title="Document intelligence"
                body="Upload share registers, trust deeds and MoIs. We extract beneficial ownership data and flag review items."
              />
              <FeatureCard
                icon={<FileArchive />}
                title="One-click filing packs"
                body="Generate the Beneficial Ownership Register and Mandate to File, ready to submit to CIPC."
              />
              <FeatureCard
                icon={<CalendarDays />}
                title="Compliance calendar"
                body="Track filing dates, mandate signatures, and changes in control across your full client list."
              />
              <FeatureCard
                icon={<Users />}
                title="Practice teams"
                body="Multi-user workspaces with roles for owners, managers and reviewers — built for partners and clerks alike."
              />
              <FeatureCard
                icon={<ShieldCheck />}
                title="Audit-ready trail"
                body="Every change is timestamped and attributed, so you always know who decided what, and when."
              />
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-paper">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-gold">How it works</p>
              <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
                From client list to CIPC filing in three steps.
              </h2>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              <StepCard
                number="01"
                title="Onboard your clients"
                body="Add company profiles in seconds — registration number, directors, type. Bulk import for established practices."
              />
              <StepCard
                number="02"
                title="Upload supporting docs"
                body="Drop in the share register, MoI and any trust deeds. Documents are parsed and queued for your review."
              />
              <StepCard
                number="03"
                title="Generate the filing pack"
                body="Beneficial Ownership Register and Mandate to File, produced as ready-to-sign PDFs in seconds."
              />
            </div>
          </div>
        </section>

        <section id="security" className="border-y border-ink/10 bg-white">
          <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-gold">Security & data protection</p>
              <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
                Built for the trust your clients place in you.
              </h2>
              <p className="mt-5 text-lg leading-8 text-ink/68">
                Beneficial ownership data is sensitive. SecretarialDesk is engineered to keep it private, attributable, and recoverable.
              </p>
              <ul className="mt-8 space-y-5">
                <SecurityItem icon={<Lock />} title="Encryption at rest and in transit" body="All client data is encrypted using industry-standard ciphers, with TLS 1.2+ end-to-end." />
                <SecurityItem icon={<LockKeyhole />} title="Practice-isolated workspaces" body="Row-level security ensures your firm's data never crosses tenant boundaries." />
                <SecurityItem icon={<BadgeCheck />} title="POPIA-aligned" body="Designed around the Protection of Personal Information Act and CIPC's data-handling expectations." />
                <SecurityItem icon={<Database />} title="Daily backups" body="Point-in-time recovery with regional backup retention." />
              </ul>
            </div>
            <div className="rounded-lg border border-ink/10 bg-paper p-8 shadow-panel">
              <div className="flex items-center gap-3 border-b border-ink/10 pb-5">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-forest text-white">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Practice access · Audit log</p>
                  <p className="text-xs text-ink/55">Last 30 days</p>
                </div>
              </div>
              <ul className="mt-5 space-y-4">
                <AuditRow who="Nomsa D." action="Generated filing pack · Mafadi Consulting" when="2 hours ago" />
                <AuditRow who="Johan B." action="Updated shareholders · Ikhaya Holdings" when="Yesterday" />
                <AuditRow who="Ayesha K." action="Uploaded trust deed · Thanda Operations" when="2 days ago" />
                <AuditRow who="System" action="Daily compliance scan completed" when="3 days ago" />
              </ul>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-paper">
          <div className="mx-auto max-w-7xl px-6 py-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-gold">Pricing</p>
              <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">
                Plans that scale with your practice.
              </h2>
              <p className="mt-5 text-lg leading-8 text-ink/68">
                Per-practice pricing. No per-filing fees. Cancel anytime.
              </p>
            </div>
            <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:gap-8">
              <PricingCard
                name="Starter"
                price="R750"
                period="/ month"
                description="For sole practitioners getting compliant fast."
                features={['Up to 25 client companies', '1 practice user', 'Filing pack generation', 'Email support']}
                onClick={onEnter}
              />
              <PricingCard
                name="Practice"
                price="R1,950"
                period="/ month"
                description="For growing accounting firms."
                features={['Up to 150 client companies', '5 practice users', 'Document intelligence', 'Priority support', 'Audit log export']}
                highlighted
                onClick={onEnter}
              />
              <PricingCard
                name="Firm"
                price="Custom"
                period=""
                description="For multi-partner firms with complex client books."
                features={['Unlimited companies', 'Unlimited users', 'SSO & advanced security', 'Dedicated success manager', 'Custom onboarding']}
                onClick={onEnter}
                ctaLabel="Talk to us"
              />
            </div>
          </div>
        </section>

        <section className="border-y border-ink/10 bg-white">
          <div className="mx-auto max-w-4xl px-6 py-24 text-center">
            <Quote className="mx-auto h-10 w-10 text-gold" />
            <blockquote className="mt-7 font-serif text-2xl leading-relaxed text-ink sm:text-3xl">
              "We had been managing BO filings in a spreadsheet shared between three partners. SecretarialDesk replaced that workflow inside a week — and we haven't missed a deadline since."
            </blockquote>
            <div className="mt-10 flex items-center justify-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-sage font-semibold text-forest">ND</div>
              <div className="text-left">
                <p className="font-semibold text-ink">Nomsa Dlamini, CA(SA)</p>
                <p className="text-sm text-ink/55">Managing Partner · Mafadi Consulting</p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="bg-paper">
          <div className="mx-auto max-w-3xl px-6 py-24">
            <div className="text-center">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-gold">Frequently asked</p>
              <h2 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">Questions, answered.</h2>
            </div>
            <div className="mt-12 divide-y divide-ink/10 overflow-hidden rounded-lg border border-ink/10 bg-white">
              {faqs.map((item, index) => (
                <FaqItem
                  key={item.q}
                  question={item.q}
                  answer={item.a}
                  open={openFaq === index}
                  onToggle={() => setOpenFaq(openFaq === index ? -1 : index)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-forest">
          <div className="mx-auto max-w-7xl px-6 py-20 text-center text-white">
            <h2 className="font-serif text-3xl font-semibold sm:text-5xl">
              Ready to bring calm to your BO compliance?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/80">
              Start a free 14-day trial. No credit card, no commitment. Onboard your first client in minutes.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button onClick={onEnter} className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-7 py-4 text-sm font-semibold text-forest hover:bg-paper">
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </button>
              <button onClick={onEnter} className="rounded-md border border-white/30 px-7 py-4 text-sm font-semibold text-white hover:bg-white/10">
                Book a demo
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink/10 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <BrandMark />
              <p className="mt-4 max-w-xs text-sm leading-6 text-ink/55">
                Beneficial Ownership compliance, built for South African chartered accounting practices.
              </p>
            </div>
            <FooterCol
              title="Product"
              links={[
                { label: 'Features', href: '#features' },
                { label: 'Workflow', href: '#workflow' },
                { label: 'Security', href: '#security' },
                { label: 'Pricing', href: '#pricing' }
              ]}
            />
            <FooterCol
              title="Company"
              links={[
                { label: 'About', href: '#' },
                { label: 'Contact', href: '#' },
                { label: 'Blog', href: '#' },
                { label: 'Careers', href: '#' }
              ]}
            />
            <FooterCol
              title="Legal"
              links={[
                { label: 'Privacy policy', href: '#' },
                { label: 'Terms of use', href: '#' },
                { label: 'POPIA notice', href: '#' }
              ]}
            />
          </div>
          <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-ink/10 pt-7 text-sm text-ink/50 md:flex-row md:items-center">
            <p>© {new Date().getFullYear()} SecretarialDesk. All rights reserved.</p>
            <p className="text-xs">Made in South Africa · Designed for the Companies Act of 2008</p>
          </div>
        </div>
      </footer>
    </>
  );
}

function ProofPoint({ icon, text }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sage text-forest">{React.cloneElement(icon, { className: 'h-5 w-5' })}</span>
      <span>{text}</span>
    </div>
  );
}

function PainCard({ icon, title, body }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-7 shadow-sm">
      <span className="grid h-11 w-11 place-items-center rounded-md bg-red-50 text-red-700">
        {React.cloneElement(icon, { className: 'h-5 w-5' })}
      </span>
      <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-ink/65">{body}</p>
    </div>
  );
}

function FeatureCard({ icon, title, body }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-paper p-7 transition hover:border-ink/20 hover:bg-white hover:shadow-panel">
      <span className="grid h-11 w-11 place-items-center rounded-md bg-sage text-forest">
        {React.cloneElement(icon, { className: 'h-5 w-5' })}
      </span>
      <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-ink/65">{body}</p>
    </div>
  );
}

function StepCard({ number, title, body }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-7 shadow-sm">
      <span className="font-serif text-5xl font-semibold text-gold/70">{number}</span>
      <h3 className="mt-3 text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-ink/65">{body}</p>
    </div>
  );
}

function SecurityItem({ icon, title, body }) {
  return (
    <li className="flex gap-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sage text-forest">
        {React.cloneElement(icon, { className: 'h-4 w-4' })}
      </span>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm leading-6 text-ink/60">{body}</p>
      </div>
    </li>
  );
}

function AuditRow({ who, action, when }) {
  return (
    <li className="flex items-start justify-between gap-4 border-b border-ink/5 pb-4 last:border-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-ink">{who}</p>
        <p className="mt-0.5 text-xs text-ink/55">{action}</p>
      </div>
      <span className="shrink-0 text-xs text-ink/45">{when}</span>
    </li>
  );
}

function PricingCard({ name, price, period, description, features, highlighted, onClick, ctaLabel = 'Start free trial' }) {
  const cardClass = highlighted
    ? 'flex flex-col rounded-lg border border-forest bg-white p-8 shadow-panel ring-1 ring-forest'
    : 'flex flex-col rounded-lg border border-ink/10 bg-white p-8';
  const ctaClass = highlighted
    ? 'mt-8 rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white hover:bg-[#0b382d]'
    : 'mt-8 rounded-md border border-ink/15 bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-ink/30';
  return (
    <div className={cardClass}>
      {highlighted && (
        <span className="mb-5 inline-flex w-fit rounded-full bg-forest px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          Most popular
        </span>
      )}
      <h3 className="text-xl font-semibold text-ink">{name}</h3>
      <p className="mt-2 text-sm leading-6 text-ink/60">{description}</p>
      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-serif text-4xl font-semibold text-ink">{price}</span>
        {period && <span className="text-sm text-ink/55">{period}</span>}
      </div>
      <ul className="mt-7 flex-1 space-y-3 text-sm text-ink/70">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onClick} className={ctaClass}>{ctaLabel}</button>
    </div>
  );
}

function FaqItem({ question, answer, open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start justify-between gap-6 px-6 py-5 text-left hover:bg-paper/60"
      aria-expanded={open}
    >
      <span className="flex-1">
        <span className="block font-semibold text-ink">{question}</span>
        {open && <span className="mt-3 block text-sm leading-7 text-ink/65">{answer}</span>}
      </span>
      <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-ink/45 transition ${open ? 'rotate-180' : ''}`} />
    </button>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/45">{title}</p>
      <ul className="mt-4 space-y-3 text-sm">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href} className="text-ink/70 transition hover:text-ink">{link.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-md border border-ink/10 bg-paper">
      <div className="flex items-center justify-between border-b border-ink/10 bg-white px-5 py-4">
        <BrandMark />
        <button className="rounded-md bg-forest px-4 py-2 text-xs font-semibold text-white">+ Add company</button>
      </div>
      <div className="grid min-h-[430px] min-w-0 md:grid-cols-[190px_1fr]">
        <aside className="border-r border-ink/10 bg-white p-4 text-sm">
          {['Dashboard', 'Companies', 'Documents', 'CIPC Filing Pack', 'Reports'].map((item, index) => (
            <div key={item} className={`mb-2 flex items-center gap-3 rounded-md px-3 py-2 ${index === 0 ? 'bg-sage text-forest' : 'text-ink/60'}`}>
              <LayoutDashboard className="h-4 w-4" />
              {item}
            </div>
          ))}
        </aside>
        <div className="min-w-0 p-6">
          <div className="mb-5 grid grid-cols-3 gap-4">
            <MiniStat label="Compliant" value="82" tone="green" />
            <MiniStat label="Due soon" value="28" tone="amber" />
            <MiniStat label="Action required" value="18" tone="red" />
          </div>
          <CompanyTable companies={initialCompanies} compact />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }) {
  const tones = {
    green: 'text-forest',
    amber: 'text-gold',
    red: 'text-red-700'
  };
  return (
    <div className="rounded-md border border-ink/10 bg-white p-4">
      <p className="text-xs text-ink/55">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function AccessNotice({ title, detail }) {
  return (
    <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 leading-6">{detail}</p>
    </div>
  );
}

function OperationStatus({ label }) {
  return (
    <div className="mb-5 flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-800" />
      <span className="font-semibold">{label}</span>
    </div>
  );
}

function OperationNotice({ notice, onDismiss }) {
  const isSuccess = notice.type === 'success';
  return (
    <div className={`mb-5 flex items-start justify-between gap-4 rounded-md border px-4 py-3 text-sm ${
      isSuccess ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'
    }`}>
      <div>
        <p className="font-semibold">{notice.title}</p>
        {notice.detail && <p className="mt-1 leading-6">{notice.detail}</p>}
      </div>
      <button type="button" onClick={onDismiss} className="rounded-md p-1 opacity-70 hover:bg-white/60 hover:opacity-100" aria-label="Dismiss notification">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function Dashboard({
  companies,
  onAddCompany,
  onBack,
  onSignOut,
  practiceName,
  userEmail,
  isDemo,
  appError,
  operationNotice,
  activeOperation,
  onDismissOperationNotice,
  allTasks,
  recentActivity,
  selectedCompany,
  companyDetail,
  onSelectCompany,
  onImportCompanies,
  onClearCompany,
  onAddDirector,
  onAddShareholder,
  onUpdateDirector,
  onUpdateShareholder,
  onSaveDirectorChange,
  onUpdateDirectorChangeStatus,
  onSaveShareTransaction,
  onUpdateShareTransactionStatus,
  onConfirmBeneficialOwner,
  onDeleteBeneficialOwner,
  onSaveTrustReview,
  onCreateBeneficialOwnersFromTrustReview,
  onSaveEntityOwnershipReview,
  onCreateBeneficialOwnersFromEntityReview,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddDocument,
  onDeleteDirector,
  onDeleteShareholder,
  onDeleteDocument,
  onToggleMandate,
  onGenerateFilingPack,
  onUpdateAnnualReturn,
  onUpdateFilingPackSubmission,
  onOpenStoragePath,
  onUpdateCompanyProfile,
  onUpdatePracticeName,
  onExportPracticeData,
  onRestorePracticeData,
  practice,
  practiceMembers,
  practiceInvitations,
  session,
  hasSupabaseConfig,
  currentUserRole,
  permissions,
  databaseFeatures,
  onInvitePracticeMember,
  onRevokePracticeInvitation,
  isSavingDetail,
  isSavingCompany,
  entityReviewLookup
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [workspaceView, setWorkspaceView] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const notifications = useMemo(() => buildNotifications(companies, allTasks), [companies, allTasks]);
  const unreadNotifications = notifications.filter((item) => item.tone !== 'info').length;
  const stats = useMemo(() => {
    const taskStats = calculateTaskStats(allTasks);
    return {
      total: companies.length,
      compliant: companies.filter((c) => c.status === 'Compliant').length,
      dueSoon: companies.filter((c) => c.status === 'Due Soon').length,
      action: companies.filter((c) => c.status === 'Action Required').length,
      openTasks: taskStats.open,
      overdueTasks: taskStats.overdue,
      dueThisWeek: taskStats.dueThisWeek
    };
  }, [companies, allTasks]);

  return (
    <div className={`min-h-screen overflow-x-hidden lg:grid ${sidebarCollapsed ? 'lg:grid-cols-[88px_minmax(0,1fr)]' : 'lg:grid-cols-[280px_minmax(0,1fr)]'}`}>
      <aside className="hidden min-w-0 border-r border-ink/10 bg-white p-4 lg:block">
        <div className="mb-8 flex items-center justify-between gap-2">
          <button onClick={onBack} className="min-w-0 text-left" aria-label="Back to landing">
            {sidebarCollapsed ? (
              <div className="grid h-10 w-10 place-items-center rounded-md border border-gold/40 bg-white text-gold shadow-sm">
                <ShieldCheck className="h-6 w-6" />
              </div>
            ) : (
              <BrandMark />
            )}
          </button>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((current) => !current)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-ink/10 text-ink/60 hover:bg-paper"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
          </button>
        </div>
        <nav className="space-y-1 text-sm">
          <NavItem compact={sidebarCollapsed} active={workspaceView === 'dashboard' && !selectedCompany} icon={<LayoutDashboard />} label="Dashboard" onClick={() => { setWorkspaceView('dashboard'); onClearCompany(); }} />
          <NavItem compact={sidebarCollapsed} active={workspaceView === 'companies'} icon={<Building2 />} label="Companies" onClick={() => { setWorkspaceView('companies'); onClearCompany(); }} />
          <NavItem compact={sidebarCollapsed} active={workspaceView === 'deadlines'} icon={<CalendarDays />} label="Deadlines" onClick={() => { setWorkspaceView('deadlines'); onClearCompany(); }} />
          <NavItem compact={sidebarCollapsed} active={workspaceView === 'documents'} icon={<Upload />} label="AI Document Analyzer" onClick={() => { setWorkspaceView('documents'); onClearCompany(); }} />
          <NavItem compact={sidebarCollapsed} active={workspaceView === 'filingPack'} icon={<FileArchive />} label="CIPC Filing Pack" onClick={() => { setWorkspaceView('filingPack'); onClearCompany(); }} />
          <NavItem compact={sidebarCollapsed} active={workspaceView === 'followUps'} icon={<Users />} label="Follow-ups" onClick={() => { setWorkspaceView('followUps'); onClearCompany(); }} />
          <NavItem compact={sidebarCollapsed} active={workspaceView === 'settings'} icon={<LockKeyhole />} label="Practice Settings" onClick={() => { setWorkspaceView('settings'); onClearCompany(); }} />
        </nav>
      </aside>

      <main className="min-w-0">
        <header className="flex min-h-20 items-center justify-between gap-4 border-b border-ink/10 bg-white px-5 py-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="rounded-md border border-ink/10 p-2 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-sm text-ink/55">{practiceName}</p>
              <h2 className="truncate text-xl font-semibold text-ink">
                {selectedCompany ? selectedCompany.name : 'Beneficial Ownership Dashboard'}
              </h2>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <button
              onClick={() => setShowSearch(true)}
              className="hidden items-center rounded-md border border-ink/10 bg-white px-3 py-2 text-sm text-ink/70 md:flex"
            >
              <Search className="mr-2 h-4 w-4" /> Search
            </button>
            <button
              onClick={() => setShowSearch(true)}
              className="rounded-md border border-ink/10 bg-white p-2 md:hidden"
              aria-label="Search companies"
            >
              <Search className="h-5 w-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowNotifications((current) => !current)}
                className="relative rounded-md border border-ink/10 bg-white p-2 hover:bg-paper"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-700 px-1 text-[10px] font-semibold text-white">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationsPanel
                  notifications={notifications}
                  onClose={() => setShowNotifications(false)}
                  onOpenCompany={(company) => {
                    setShowNotifications(false);
                    onSelectCompany(company);
                  }}
                />
              )}
            </div>
            <span className="hidden rounded-md border border-ink/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink/50 md:inline-flex">
              {roleLabel(currentUserRole)}
            </span>
            <button
              onClick={onAddCompany}
              disabled={!permissions.canEditCompany}
              className="inline-flex items-center rounded-md bg-forest px-3 py-2 text-sm font-semibold text-white hover:bg-[#0b382d] disabled:cursor-not-allowed disabled:bg-ink/30 md:px-4"
            >
              <Plus className="h-4 w-4 md:mr-2" /> <span className="hidden md:inline">Add company</span>
            </button>
            {userEmail && (
              <button onClick={onSignOut} className="hidden rounded-md border border-ink/10 px-4 py-2 text-sm font-semibold text-ink/65 md:block">
                Sign out
              </button>
            )}
          </div>
        </header>

        <div className="px-5 py-8 md:px-8">
          {isDemo && <SetupNotice />}
          {permissions.isReadOnly && (
            <AccessNotice title="Read-only access" detail="Your current role can view companies and download reports, but cannot edit BO records, documents, filing packs, or practice settings." />
          )}
          {activeOperation && <OperationStatus label={activeOperation} />}
          {operationNotice && <OperationNotice notice={operationNotice} onDismiss={onDismissOperationNotice} />}
          {appError && <p className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{appError}</p>}
          {selectedCompany ? (
            <CompanyDetail
              company={selectedCompany}
              detail={companyDetail}
              onBack={onClearCompany}
              onAddDirector={onAddDirector}
              onAddShareholder={onAddShareholder}
              onUpdateDirector={onUpdateDirector}
              onUpdateShareholder={onUpdateShareholder}
              onSaveDirectorChange={onSaveDirectorChange}
              onUpdateDirectorChangeStatus={onUpdateDirectorChangeStatus}
              onSaveShareTransaction={onSaveShareTransaction}
              onUpdateShareTransactionStatus={onUpdateShareTransactionStatus}
              onConfirmBeneficialOwner={onConfirmBeneficialOwner}
              onDeleteBeneficialOwner={onDeleteBeneficialOwner}
              onSaveTrustReview={onSaveTrustReview}
              onCreateBeneficialOwnersFromTrustReview={onCreateBeneficialOwnersFromTrustReview}
              onSaveEntityOwnershipReview={onSaveEntityOwnershipReview}
              onCreateBeneficialOwnersFromEntityReview={onCreateBeneficialOwnersFromEntityReview}
              onAddContact={onAddContact}
              onUpdateContact={onUpdateContact}
              onDeleteContact={onDeleteContact}
              onAddTask={onAddTask}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onAddDocument={onAddDocument}
              onDeleteDirector={onDeleteDirector}
              onDeleteShareholder={onDeleteShareholder}
              onDeleteDocument={onDeleteDocument}
              onToggleMandate={onToggleMandate}
              onGenerateFilingPack={onGenerateFilingPack}
              onUpdateAnnualReturn={onUpdateAnnualReturn}
              onUpdateFilingPackSubmission={onUpdateFilingPackSubmission}
              onOpenStoragePath={onOpenStoragePath}
              onUpdateCompanyProfile={onUpdateCompanyProfile}
              permissions={permissions}
              isSaving={isSavingDetail}
              entityReviewLookup={entityReviewLookup}
              databaseFeatures={databaseFeatures}
            />
          ) : (
            <>
              {workspaceView === 'deadlines' ? (
                <DeadlineWorkspace companies={companies} onSelectCompany={onSelectCompany} />
              ) : workspaceView === 'companies' ? (
                <CompaniesWorkspace
                  companies={companies}
                  onAddCompany={onAddCompany}
                  onSelectCompany={onSelectCompany}
                  onImportCompanies={onImportCompanies}
                  permissions={permissions}
                  isSaving={isSavingCompany}
                />
              ) : workspaceView === 'filingPack' ? (
                <FilingPackWorkspace companies={companies} onSelectCompany={onSelectCompany} />
              ) : workspaceView === 'documents' ? (
                <PlaceholderWorkspace
                  title="AI Document Analyzer"
                  detail="AI extraction is paused for now. Use company detail pages to upload and record PDFs without AI."
                  action="Open a company to manage documents"
                />
              ) : workspaceView === 'followUps' ? (
                <FollowUpsWorkspace tasks={allTasks} onSelectCompany={onSelectCompany} />
              ) : workspaceView === 'settings' ? (
                <PracticeSettingsWorkspace
                  practice={practice}
                  practiceMembers={practiceMembers}
                  practiceInvitations={practiceInvitations}
                  session={session}
                  companies={companies}
                  hasSupabaseConfig={hasSupabaseConfig}
                  currentUserRole={currentUserRole}
                  permissions={permissions}
                  databaseFeatures={databaseFeatures}
                  onUpdatePracticeName={onUpdatePracticeName}
                  onExportPracticeData={onExportPracticeData}
                  onRestorePracticeData={onRestorePracticeData}
                  onInvitePracticeMember={onInvitePracticeMember}
                  onRevokePracticeInvitation={onRevokePracticeInvitation}
                  isSaving={isSavingDetail}
                />
              ) : (
                <DashboardHome
                  stats={stats}
                  companies={companies}
                  allTasks={allTasks}
                  recentActivity={recentActivity}
                  onAddCompany={onAddCompany}
                  onSelectCompany={onSelectCompany}
                />
              )}
            </>
          )}
        </div>
      </main>

      {mobileNavOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white p-4 shadow-xl lg:hidden">
            <div className="mb-8 flex items-center justify-between">
              <BrandMark />
              <button
                onClick={() => setMobileNavOpen(false)}
                className="rounded-md border border-ink/10 p-2"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1 text-sm">
              <NavItem active={workspaceView === 'dashboard' && !selectedCompany} icon={<LayoutDashboard />} label="Dashboard" onClick={() => { setWorkspaceView('dashboard'); onClearCompany(); setMobileNavOpen(false); }} />
              <NavItem active={workspaceView === 'companies'} icon={<Building2 />} label="Companies" onClick={() => { setWorkspaceView('companies'); onClearCompany(); setMobileNavOpen(false); }} />
              <NavItem active={workspaceView === 'deadlines'} icon={<CalendarDays />} label="Deadlines" onClick={() => { setWorkspaceView('deadlines'); onClearCompany(); setMobileNavOpen(false); }} />
              <NavItem active={workspaceView === 'documents'} icon={<Upload />} label="AI Document Analyzer" onClick={() => { setWorkspaceView('documents'); onClearCompany(); setMobileNavOpen(false); }} />
              <NavItem active={workspaceView === 'filingPack'} icon={<FileArchive />} label="CIPC Filing Pack" onClick={() => { setWorkspaceView('filingPack'); onClearCompany(); setMobileNavOpen(false); }} />
              <NavItem active={workspaceView === 'followUps'} icon={<Users />} label="Follow-ups" onClick={() => { setWorkspaceView('followUps'); onClearCompany(); setMobileNavOpen(false); }} />
              <NavItem active={workspaceView === 'settings'} icon={<LockKeyhole />} label="Practice Settings" onClick={() => { setWorkspaceView('settings'); onClearCompany(); setMobileNavOpen(false); }} />
            </nav>
            <div className="mt-auto border-t border-ink/10 pt-6">
              <p className="truncate text-xs text-ink/50">{userEmail}</p>
              {userEmail && (
                <button onClick={onSignOut} className="mt-3 text-sm font-medium text-ink/65 hover:text-ink">
                  Sign out
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {showSearch && (
        <SearchOverlay
          companies={companies}
          onSelect={(company) => { setShowSearch(false); onSelectCompany(company); }}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}

function SearchOverlay({ companies, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = React.useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return companies.slice(0, 8);
    return companies
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.registrationNumber?.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [query, companies]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 p-4 pt-[10vh]"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-lg border border-ink/10 bg-white shadow-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-ink/10 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-ink/45" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by company name or registration number…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink/40"
          />
          <button onClick={onClose} className="rounded-md p-1 text-ink/45 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto divide-y divide-ink/5">
          {results.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-ink/50">
              No companies match "{query}"
            </li>
          ) : (
            results.map((company) => (
              <li key={company.id}>
                <button
                  onClick={() => onSelect(company)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-paper"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{company.name}</p>
                    <p className="text-xs text-ink/50">{company.registrationNumber}</p>
                  </div>
                  <StatusBadge status={company.status} />
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="border-t border-ink/10 px-4 py-2.5">
          <p className="text-xs text-ink/40">Press Esc to close · Click a company to open</p>
        </div>
      </div>
    </div>
  );
}

function CompanyDetail({
  company,
  detail,
  onBack,
  onAddDirector,
  onAddShareholder,
  onUpdateDirector,
  onUpdateShareholder,
  onSaveDirectorChange,
  onUpdateDirectorChangeStatus,
  onSaveShareTransaction,
  onUpdateShareTransactionStatus,
  onConfirmBeneficialOwner,
  onDeleteBeneficialOwner,
  onSaveTrustReview,
  onCreateBeneficialOwnersFromTrustReview,
  onSaveEntityOwnershipReview,
  onCreateBeneficialOwnersFromEntityReview,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddDocument,
  onDeleteDirector,
  onDeleteShareholder,
  onDeleteDocument,
  onToggleMandate,
  onGenerateFilingPack,
  onUpdateAnnualReturn,
  onUpdateFilingPackSubmission,
  onOpenStoragePath,
  onUpdateCompanyProfile,
  permissions,
  isSaving,
  entityReviewLookup,
  databaseFeatures
}) {
  const [activeTab, setActiveTab] = useState('shareholders');
  const boAssessment = assessBeneficialOwnership(detail.shareholders, detail.beneficialOwners || [], detail.trustReviews || [], detail.entityOwnershipReviews || []);
  const readiness = getReadinessChecklist(detail);
  const validation = getComplianceValidation(company, detail);
  const canGeneratePack = permissions.canGenerateFilingPack && readiness.status !== 'Action Required' && validation.criticalCount === 0;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-forest">
        <ArrowLeft className="h-4 w-4" /> Back to companies
      </button>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Registration number" value={company.registrationNumber} helper={company.type || 'Pty Ltd'} />
        <StatCard label="Compliance Status" value={company.status} helper="Calculated from BO readiness" alert={company.status === 'Action Required'} />
        <StatCard label="Directors" value={detail.directors.length} helper="Recorded officers" />
        <StatCard label="Shareholders" value={detail.shareholders.length} helper="Ownership entries" />
      </section>

      {!permissions.canEditCompany && (
        <AccessNotice title="Editing disabled" detail="Your role allows viewing and report export only for this company." />
      )}

      <CompanyProfilePanel company={company} onUpdateCompanyProfile={onUpdateCompanyProfile} isSaving={isSaving || !permissions.canEditCompany} />

      <AnnualReturnPanel company={company} detail={detail} onUpdateAnnualReturn={onUpdateAnnualReturn} onAddTask={onAddTask} isSaving={isSaving || !permissions.canEditCompany} />

      <section className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 rounded-lg border border-ink/10 bg-white shadow-sm">
          <div className="flex max-w-full gap-2 overflow-x-auto border-b border-ink/10 px-5 pt-4">
            <TabButton active={activeTab === 'shareholders'} onClick={() => setActiveTab('shareholders')} label="Shareholders" />
            <TabButton active={activeTab === 'ownershipMap'} onClick={() => setActiveTab('ownershipMap')} label="Ownership Map" />
            <TabButton active={activeTab === 'boRegister'} onClick={() => setActiveTab('boRegister')} label="BO Register" />
            <TabButton active={activeTab === 'directors'} onClick={() => setActiveTab('directors')} label="Directors" />
            <TabButton active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} label="Contacts" />
            <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} label="Tasks" />
            <TabButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} label="Activity" />
          </div>
          <div className="p-5">
            {activeTab === 'shareholders' ? (
              <ShareholdersPanel shareholders={detail.shareholders} shareTransactions={detail.shareTransactions || []} contacts={detail.contacts || []} onAddShareholder={onAddShareholder} onUpdateShareholder={onUpdateShareholder} onDeleteShareholder={onDeleteShareholder} onSaveShareTransaction={onSaveShareTransaction} onUpdateShareTransactionStatus={onUpdateShareTransactionStatus} onAddTask={onAddTask} isSaving={isSaving || !permissions.canEditCompany} shareTransactionFeature={databaseFeatures?.shareTransactions} />
            ) : activeTab === 'ownershipMap' ? (
              <OwnershipMapPanel company={company} detail={detail} />
            ) : activeTab === 'boRegister' ? (
              <BoRegisterPanel
                company={company}
                shareholders={detail.shareholders}
                beneficialOwners={detail.beneficialOwners || []}
                trustReviews={detail.trustReviews || []}
                entityOwnershipReviews={detail.entityOwnershipReviews || []}
                onConfirmBeneficialOwner={onConfirmBeneficialOwner}
                onDeleteBeneficialOwner={onDeleteBeneficialOwner}
                onSaveTrustReview={onSaveTrustReview}
                onCreateBeneficialOwnersFromTrustReview={onCreateBeneficialOwnersFromTrustReview}
                onSaveEntityOwnershipReview={onSaveEntityOwnershipReview}
                onCreateBeneficialOwnersFromEntityReview={onCreateBeneficialOwnersFromEntityReview}
                isSaving={isSaving || !permissions.canEditBoRecords}
                entityReviewLookup={entityReviewLookup}
                currentCompanyId={company.id}
              />
            ) : activeTab === 'directors' ? (
              <DirectorsPanel directors={detail.directors} directorChanges={detail.directorChanges || []} contacts={detail.contacts || []} onAddDirector={onAddDirector} onUpdateDirector={onUpdateDirector} onDeleteDirector={onDeleteDirector} onSaveDirectorChange={onSaveDirectorChange} onUpdateDirectorChangeStatus={onUpdateDirectorChangeStatus} onAddTask={onAddTask} isSaving={isSaving || !permissions.canEditCompany} directorChangeFeature={databaseFeatures?.directorChanges} />
            ) : activeTab === 'contacts' ? (
              <ContactsPanel contacts={detail.contacts} onAddContact={onAddContact} onUpdateContact={onUpdateContact} onDeleteContact={onDeleteContact} isSaving={isSaving || !permissions.canEditCompany} />
            ) : activeTab === 'tasks' ? (
              <TasksPanel tasks={detail.tasks} contacts={detail.contacts} onAddTask={onAddTask} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} isSaving={isSaving || !permissions.canEditCompany} />
            ) : (
              <ActivityPanel company={company} detail={detail} activity={detail.activity || []} />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Panel title="Filing readiness">
            <div className="space-y-3">
              {readiness.items.map((item) => (
                <ReadinessItem key={item.key} item={item} />
              ))}
            </div>
            <div className="mt-5 rounded-md bg-paper p-4">
              <p className="text-sm font-semibold">Calculated status: <span className="text-forest">{readiness.status}</span></p>
              <p className="mt-1 text-sm leading-6 text-ink/60">{readiness.summary}</p>
            </div>
          </Panel>
          <ValidationPanel validation={validation} />
          <Panel title="CIPC Filing Pack">
            <p className="text-sm leading-6 text-ink/60">
              Generate a draft BO Register and Mandate to File from the reviewed company records.
            </p>
            <button
              onClick={onGenerateFilingPack}
              disabled={!canGeneratePack}
              className="mt-4 w-full rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/30"
            >
              {!permissions.canGenerateFilingPack ? 'Admin required' : 'Download filing pack'}
            </button>
            {!canGeneratePack && (
              <p className="mt-3 text-xs leading-5 text-amber-800">
                {permissions.canGenerateFilingPack ? 'Resolve critical readiness and validation items before generating the pack.' : 'Only owners and admins can generate CIPC filing packs.'}
              </p>
            )}
            <FilingPackHistory filingPacks={detail.filingPacks} onOpenStoragePath={onOpenStoragePath} onUpdateSubmission={onUpdateFilingPackSubmission} isSaving={isSaving || !permissions.canSubmitFiling} />
          </Panel>
          <Panel title="Documents">
            <DocumentUploadPanel detail={detail} onAddDocument={onAddDocument} onDeleteDocument={onDeleteDocument} onOpenStoragePath={onOpenStoragePath} onToggleMandate={onToggleMandate} onAddTask={onAddTask} isSaving={isSaving || !permissions.canEditCompany} />
          </Panel>
          <Panel title="BO assessment">
            <div className="space-y-3">
              {boAssessment.items.length === 0 ? (
                <p className="text-sm leading-6 text-ink/60">Add shareholders to calculate natural persons who own or control more than 5%.</p>
              ) : (
                boAssessment.items.map((item) => (
                  <div key={item.id} className={`rounded-md border p-4 ${item.tone}`}>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm leading-6">{item.detail}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function ReadinessItem({ item }) {
  return (
    <div className="flex gap-3">
      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${item.complete ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
        {item.complete ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
      </span>
      <div>
        <p className="text-sm font-semibold">{item.label}</p>
        <p className="text-sm leading-6 text-ink/58">{item.detail}</p>
      </div>
    </div>
  );
}

function ValidationPanel({ validation }) {
  const groups = [
    { key: 'critical', title: 'Critical', items: validation.critical, tone: 'text-red-800 border-red-200 bg-red-50' },
    { key: 'warning', title: 'Warnings', items: validation.warning, tone: 'text-amber-800 border-amber-200 bg-amber-50' },
    { key: 'info', title: 'Info', items: validation.info, tone: 'text-ink/65 border-ink/10 bg-paper' }
  ];

  return (
    <Panel title="Validation">
      <div className="grid grid-cols-3 gap-2">
        <ValidationCount label="Critical" value={validation.criticalCount} tone="text-red-700" />
        <ValidationCount label="Warnings" value={validation.warningCount} tone="text-amber-700" />
        <ValidationCount label="Info" value={validation.infoCount} tone="text-ink/55" />
      </div>
      <div className="mt-4 space-y-3">
        {groups.map((group) => (
          group.items.length > 0 && (
            <div key={group.key} className="space-y-2">
              {group.items.map((item) => (
                <div key={item.key} className={`rounded-md border p-3 ${group.tone}`}>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm leading-5">{item.detail}</p>
                </div>
              ))}
            </div>
          )
        ))}
        {validation.criticalCount + validation.warningCount + validation.infoCount === 0 && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
            <p className="text-sm font-semibold">No validation issues found</p>
            <p className="mt-1 text-sm leading-5">Core data checks are currently clear.</p>
          </div>
        )}
      </div>
    </Panel>
  );
}

function ValidationCount({ label, value, tone }) {
  return (
    <div className="rounded-md border border-ink/10 bg-white p-3">
      <p className="text-xs uppercase tracking-[0.1em] text-ink/45">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function DocumentUploadPanel({ detail, onAddDocument, onDeleteDocument, onOpenStoragePath, onToggleMandate, onAddTask, isSaving }) {
  const [documentType, setDocumentType] = useState('share_register');
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState(null);
  const trustDetected = hasTrustShareholder(detail);
  const documentTypes = ['share_register', 'moi', 'trust_deed', 'mandate_to_file'];
  const availableTypes = [
    { value: 'share_register', label: 'Share Register' },
    { value: 'moi', label: 'MoI' },
    { value: 'trust_deed', label: 'Trust Deed', disabled: !trustDetected },
    { value: 'mandate_to_file', label: 'Mandate to File' }
  ];

  const submit = (event) => {
    event.preventDefault();
    onAddDocument({ documentType, originalFilename: fileName || documentLabel(documentType), file });
    setFileName('');
    setFile(null);
    event.currentTarget.reset();
  };

  const createDocumentTask = (type) => {
    onAddTask(buildDocumentRequestTask(type, detail));
  };

  return (
    <div>
      <div className="space-y-3">
        {documentTypes.map((type) => (
          <DocumentStatusRow
            key={type}
            label={documentLabel(type)}
            complete={type === 'mandate_to_file' ? detail.mandatePrepared : hasDocument(detail, type)}
            disabled={type === 'trust_deed' && !trustDetected}
            document={detail.documents.find((item) => item.documentType === type)}
            hasOpenTask={hasOpenDocumentTask(detail, type)}
            onCreateTask={() => createDocumentTask(type)}
            onDeleteDocument={onDeleteDocument}
            onOpenStoragePath={onOpenStoragePath}
            isSaving={isSaving}
          />
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 rounded-md border border-ink/10 bg-paper p-4">
        <h4 className="text-sm font-semibold">Record document</h4>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium">Document type</span>
          <select value={documentType} onChange={(event) => setDocumentType(event.target.value)} className="h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
            {availableTypes.map((type) => (
              <option key={type.value} value={type.value} disabled={type.disabled}>{type.label}</option>
            ))}
          </select>
        </label>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium">File name</span>
          <input
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
            placeholder="e.g. signed-share-register.pdf"
            className="h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm outline-none focus:border-forest focus:ring-4 focus:ring-sage"
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium">PDF file</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] || null;
              setFile(nextFile);
              if (nextFile && !fileName) {
                setFileName(nextFile.name);
              }
            }}
            className="block w-full rounded-md border border-dashed border-ink/20 bg-white px-3 py-3 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-sage file:px-3 file:py-2 file:text-sm file:font-semibold file:text-forest"
          />
        </label>
        <p className="mt-3 text-xs leading-5 text-ink/55">
          PDFs are stored in the private `company-documents` bucket when Supabase is configured.
        </p>
        <button disabled={isSaving || (documentType === 'trust_deed' && !trustDetected)} className="mt-4 w-full rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white disabled:bg-ink/30">
          {isSaving ? 'Uploading...' : 'Upload / mark received'}
        </button>
      </form>

      <label className="mt-4 flex items-center justify-between gap-4 rounded-md border border-ink/10 bg-white px-3 py-3 text-sm">
        <span>Mandate to File prepared</span>
        <input type="checkbox" checked={detail.mandatePrepared} onChange={onToggleMandate} className="h-4 w-4 accent-forest" />
      </label>
    </div>
  );
}

function DocumentStatusRow({ label, complete, disabled, document, hasOpenTask, onCreateTask, onDeleteDocument, onOpenStoragePath, isSaving }) {
  return (
    <div className={`rounded-md border border-ink/10 px-3 py-3 text-sm ${disabled ? 'bg-paper text-ink/40' : 'bg-white'}`}>
      <div className="flex items-center justify-between gap-4">
        <span>{label}</span>
        <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${complete ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
          {complete ? 'Received' : disabled ? 'Not required yet' : 'Missing'}
        </span>
      </div>
      {document && (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-xs text-ink/55" title={document.originalFilename}>
            {document.originalFilename}{document.filePath ? ' - stored securely' : ''}
          </p>
          <div className="flex shrink-0 gap-2">
            {document.filePath && (
              <button onClick={() => onOpenStoragePath(document.filePath)} className="rounded-md border border-ink/15 px-2 py-1 text-xs font-semibold text-ink/65 hover:bg-paper">
                Open
              </button>
            )}
            <button onClick={() => onDeleteDocument(document.id)} disabled={isSaving} className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
              Delete
            </button>
          </div>
        </div>
      )}
      {!complete && !disabled && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-paper px-3 py-2">
          <p className="text-xs text-ink/55">{hasOpenTask ? 'Open follow-up task exists for this document.' : 'No follow-up task has been created yet.'}</p>
          <button
            type="button"
            onClick={onCreateTask}
            disabled={isSaving || hasOpenTask}
            className="shrink-0 rounded-md border border-gold/60 px-2 py-1 text-xs font-semibold text-gold hover:bg-gold/5 disabled:opacity-50"
          >
            {hasOpenTask ? 'Task open' : 'Create task'}
          </button>
        </div>
      )}
    </div>
  );
}

function FilingPackHistory({ filingPacks, onOpenStoragePath, onUpdateSubmission, isSaving }) {
  if (!filingPacks.length) {
    return <p className="mt-4 text-xs leading-5 text-ink/50">No stored filing pack history yet.</p>;
  }

  return (
    <div className="mt-5 space-y-3">
      <p className="text-sm font-semibold">Generated history</p>
      {filingPacks.map((pack) => (
        <FilingPackHistoryItem key={pack.id} pack={pack} onOpenStoragePath={onOpenStoragePath} onUpdateSubmission={onUpdateSubmission} isSaving={isSaving} />
      ))}
    </div>
  );
}

function FilingPackHistoryItem({ pack, onOpenStoragePath, onUpdateSubmission, isSaving }) {
  const [form, setForm] = useState({
    submissionStatus: pack.submissionStatus || 'not_submitted',
    submittedAt: pack.submittedAt || '',
    cipcReference: pack.cipcReference || '',
    submissionNotes: pack.submissionNotes || ''
  });

  useEffect(() => {
    setForm({
      submissionStatus: pack.submissionStatus || 'not_submitted',
      submittedAt: pack.submittedAt || '',
      cipcReference: pack.cipcReference || '',
      submissionNotes: pack.submissionNotes || ''
    });
  }, [pack.id, pack.submissionStatus, pack.submittedAt, pack.cipcReference, pack.submissionNotes]);

  const submit = (event) => {
    event.preventDefault();
    onUpdateSubmission(pack.id, form);
  };

  return (
    <div className="rounded-md border border-ink/10 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink/55">{pack.generatedAt ? new Date(pack.generatedAt).toLocaleString('en-ZA') : 'Generated pack'}</p>
          <p className="mt-2"><FilingSubmissionBadge status={pack.submissionStatus} /></p>
        </div>
        {pack.cipcReference && <p className="rounded-md bg-paper px-2 py-1 text-xs font-semibold text-ink/60">Ref: {pack.cipcReference}</p>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {pack.boRegisterPdfPath && (
          <button onClick={() => onOpenStoragePath(pack.boRegisterPdfPath)} className="rounded-md border border-gold/60 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/5">
            BO Register PDF
          </button>
        )}
        {pack.mandatePdfPath && (
          <button onClick={() => onOpenStoragePath(pack.mandatePdfPath)} className="rounded-md border border-gold/60 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/5">
            Mandate PDF
          </button>
        )}
      </div>
      <form onSubmit={submit} className="mt-4 grid gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink/60">Submission status</span>
          <select value={form.submissionStatus} onChange={(event) => setForm({ ...form, submissionStatus: event.target.value })} className="h-10 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
            <option value="not_submitted">Not submitted</option>
            <option value="submitted">Submitted to CIPC</option>
            <option value="accepted">Accepted / completed</option>
            <option value="rejected">Rejected / needs correction</option>
          </select>
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <Field type="date" label="Submitted date" value={form.submittedAt} onChange={(submittedAt) => setForm({ ...form, submittedAt })} />
          <Field label="CIPC reference" value={form.cipcReference} onChange={(cipcReference) => setForm({ ...form, cipcReference })} placeholder="Reference number" />
        </div>
        <Field label="Submission notes" value={form.submissionNotes} onChange={(submissionNotes) => setForm({ ...form, submissionNotes })} placeholder="Outcome, rejection reason, or next step" />
        <button disabled={isSaving} className="rounded-md bg-forest px-3 py-2 text-xs font-semibold text-white disabled:bg-ink/30">
          {isSaving ? 'Saving...' : 'Save submission'}
        </button>
      </form>
    </div>
  );
}

function FilingSubmissionBadge({ status }) {
  const styles = {
    not_submitted: 'border-ink/10 bg-paper text-ink/55',
    submitted: 'border-blue-200 bg-blue-50 text-blue-800',
    accepted: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    rejected: 'border-red-200 bg-red-50 text-red-800'
  };
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles[status] || styles.not_submitted}`}>{filingSubmissionLabel(status)}</span>;
}

function TabButton({ active, onClick, label }) {
  return (
    <button onClick={onClick} className={`border-b-2 px-4 py-3 text-sm font-semibold ${active ? 'border-forest text-forest' : 'border-transparent text-ink/55'}`}>
      {label}
    </button>
  );
}

function CompanyProfilePanel({ company, onUpdateCompanyProfile, isSaving }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: company.name,
    registrationNumber: company.registrationNumber,
    type: company.type || 'Pty Ltd',
    incorporationDate: company.incorporationDate || '',
    registeredAddress: company.registeredAddress || ''
  });

  useEffect(() => {
    setForm({
      name: company.name,
      registrationNumber: company.registrationNumber,
      type: company.type || 'Pty Ltd',
      incorporationDate: company.incorporationDate || '',
      registeredAddress: company.registeredAddress || ''
    });
  }, [company]);

  const submit = (event) => {
    event.preventDefault();
    onUpdateCompanyProfile(form);
    setIsEditing(false);
  };

  return (
    <section className="rounded-lg border border-ink/10 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-ink/10 px-5 py-4">
        <div>
          <h3 className="text-lg font-semibold">Company profile</h3>
          <p className="text-sm text-ink/55">Core CIPC details used in filing packs.</p>
        </div>
        <button onClick={() => setIsEditing((current) => !current)} className="rounded-md border border-gold/60 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/5">
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>
      {isEditing ? (
        <form onSubmit={submit} className="grid gap-4 p-5 lg:grid-cols-2">
          <Field label="Company name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
          <Field label="Registration number" value={form.registrationNumber} onChange={(registrationNumber) => setForm({ ...form, registrationNumber })} />
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Company type</span>
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="h-12 w-full rounded-md border border-ink/15 bg-white px-3 text-sm outline-none focus:border-forest focus:ring-4 focus:ring-sage">
              <option>Pty Ltd</option>
              <option>Public Company</option>
              <option>Non-Profit Company</option>
              <option>Personal Liability Company</option>
            </select>
          </label>
          <Field type="date" label="Incorporation date" value={form.incorporationDate} onChange={(incorporationDate) => setForm({ ...form, incorporationDate })} />
          <div className="lg:col-span-2">
            <Field label="Registered office address" value={form.registeredAddress} onChange={(registeredAddress) => setForm({ ...form, registeredAddress })} />
          </div>
          <div className="flex gap-3 lg:col-span-2">
            <button disabled={isSaving || !form.name || !form.registrationNumber} className="rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white disabled:bg-ink/30">
              {isSaving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>
      ) : (
        <dl className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-4">
          <ProfileItem label="Name" value={company.name} />
          <ProfileItem label="Registration number" value={company.registrationNumber} />
          <ProfileItem label="Type" value={company.type || 'Pty Ltd'} />
          <ProfileItem label="Registered office" value={company.registeredAddress || 'Not captured'} />
        </dl>
      )}
    </section>
  );
}

function AnnualReturnPanel({ company, detail, onUpdateAnnualReturn, onAddTask, isSaving }) {
  const calculatedDueDate = calculateNextAnnualReturnDue(company.incorporationDate);
  const dueDate = company.nextDueDateRaw || calculatedDueDate;
  const status = annualReturnStatus(dueDate);
  const [filedDate, setFiledDate] = useState(todayIsoDate());
  const [cipcReference, setCipcReference] = useState(company.annualReturnReference || '');
  const hasOpenTask = (detail.tasks || []).some((task) => task.status !== 'done' && task.taskType === 'Annual Return');

  useEffect(() => {
    setCipcReference(company.annualReturnReference || '');
  }, [company.annualReturnReference]);

  const markFiled = (event) => {
    event.preventDefault();
    onUpdateAnnualReturn({
      filedDate,
      cipcReference: cipcReference.trim(),
      nextDueDate: calculateNextAnnualReturnDue(company.incorporationDate, filedDate)
    });
  };

  const createTask = () => {
    onAddTask(buildAnnualReturnTask(company, dueDate, detail));
  };

  return (
    <section className="rounded-lg border border-ink/10 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-ink/10 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Annual return</h3>
          <p className="mt-1 text-sm leading-6 text-ink/55">Track the next CIPC annual return deadline and filing reference for this company.</p>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
      </div>
      <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4 sm:grid-cols-3">
          <ProfileItem label="Incorporation date" value={company.incorporationDate ? formatCompanyDueDate(company.incorporationDate) : 'Not captured'} />
          <ProfileItem label="Next annual return due" value={dueDate ? formatCompanyDueDate(dueDate) : 'Set incorporation date'} />
          <ProfileItem label="Last filing reference" value={company.annualReturnReference || 'Not captured'} />
        </div>

        <div className="space-y-3">
          <form onSubmit={markFiled} className="grid gap-3 rounded-md border border-ink/10 bg-paper p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field type="date" label="Filed date" value={filedDate} onChange={setFiledDate} />
              <Field label="CIPC reference" value={cipcReference} onChange={setCipcReference} placeholder="Reference number" />
            </div>
            <button disabled={isSaving || !company.incorporationDate || !filedDate} className="rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white disabled:bg-ink/30">
              {isSaving ? 'Saving...' : 'Mark annual return filed'}
            </button>
          </form>
          <button
            type="button"
            onClick={createTask}
            disabled={isSaving || hasOpenTask}
            className="w-full rounded-md border border-gold/60 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/5 disabled:opacity-50"
          >
            {hasOpenTask ? 'Annual return task open' : 'Create annual return task'}
          </button>
        </div>
      </div>
    </section>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.1em] text-ink/45">{label}</dt>
      <dd className="mt-2 text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

function ShareholdersPanel({ shareholders, shareTransactions, contacts, onAddShareholder, onUpdateShareholder, onDeleteShareholder, onSaveShareTransaction, onUpdateShareTransactionStatus, onAddTask, isSaving, shareTransactionFeature }) {
  const [form, setForm] = useState({ shareholderType: 'natural_person', name: '', idNumber: '', ownershipPercentage: '' });
  const [editingId, setEditingId] = useState(null);
  const [bulkText, setBulkText] = useState('');
  const canSubmit = form.name.trim() && Number(form.ownershipPercentage) >= 0;
  const bulkRows = useMemo(() => parseShareholderBulkRows(bulkText), [bulkText]);
  const validBulkRows = bulkRows.filter((row) => row.valid);

  const submit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    if (editingId) {
      onUpdateShareholder({ id: editingId, ...form });
    } else {
      onAddShareholder(form);
    }
    setForm({ shareholderType: 'natural_person', name: '', idNumber: '', ownershipPercentage: '' });
    setEditingId(null);
  };

  const editShareholder = (shareholder) => {
    setEditingId(shareholder.id);
    setForm({
      shareholderType: shareholder.shareholderType,
      name: shareholder.name,
      idNumber: shareholder.idNumber || '',
      ownershipPercentage: String(shareholder.ownershipPercentage ?? '')
    });
  };

  const importRows = () => {
    validBulkRows.forEach((row) => onAddShareholder(row.shareholder));
    setBulkText('');
  };

  return (
    <div className="space-y-6">
      <div className="max-w-full overflow-x-auto rounded-md border border-ink/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-[0.08em] text-ink/50">
            <tr>
              <th className="px-4 py-3">Shareholder</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">ID / registration</th>
              <th className="px-4 py-3">Ownership</th>
              <th className="px-4 py-3">BO action</th>
              <th className="px-4 py-3">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {shareholders.map((shareholder) => (
              <tr key={shareholder.id}>
                <td className="px-4 py-4 font-medium">{shareholder.name}</td>
                <td className="px-4 py-4 text-ink/65">{shareholderTypeLabel(shareholder.shareholderType)}</td>
                <td className="px-4 py-4 text-ink/65">{shareholder.idNumber || 'Not captured'}</td>
                <td className="px-4 py-4 text-ink/65">{shareholder.ownershipPercentage}%</td>
                <td className="px-4 py-4"><ShareholderAction shareholder={shareholder} /></td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => editShareholder(shareholder)} disabled={isSaving} className="rounded-md border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/65 hover:bg-paper disabled:opacity-50">Edit</button>
                    <button onClick={() => onDeleteShareholder(shareholder.id)} disabled={isSaving} className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {shareholders.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-ink/55" colSpan="6">No shareholders captured yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={submit} className="rounded-md border border-ink/10 bg-paper p-4">
        <h3 className="font-semibold">{editingId ? 'Edit shareholder' : 'Add shareholder'}</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Shareholder type</span>
            <select value={form.shareholderType} onChange={(event) => setForm({ ...form, shareholderType: event.target.value })} className="h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
              <option value="natural_person">Natural person</option>
              <option value="company">Company</option>
              <option value="trust">Trust</option>
            </select>
          </label>
          <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="Full name or entity name" />
          <Field label="ID / registration number" value={form.idNumber} onChange={(idNumber) => setForm({ ...form, idNumber })} placeholder="SA ID, passport or reg. number" />
          <Field type="number" label="Ownership %" value={form.ownershipPercentage} onChange={(ownershipPercentage) => setForm({ ...form, ownershipPercentage })} placeholder="e.g. 25" />
          <div className="flex flex-col gap-3 lg:col-span-2 sm:flex-row">
            <button disabled={!canSubmit || isSaving} className="rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white disabled:bg-ink/30">
              {isSaving ? 'Saving...' : editingId ? 'Save shareholder' : 'Add shareholder'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ shareholderType: 'natural_person', name: '', idNumber: '', ownershipPercentage: '' }); }} className="rounded-md border border-ink/15 px-4 py-3 text-sm font-semibold">
                Cancel edit
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="rounded-md border border-ink/10 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="font-semibold">Bulk paste shareholders</h3>
            <p className="mt-1 text-sm leading-6 text-ink/55">
              Paste rows from Excel or CSV using: type, name, ID/registration number, ownership %. Header row is optional.
            </p>
          </div>
          <button
            type="button"
            onClick={importRows}
            disabled={isSaving || validBulkRows.length === 0}
            className="rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white disabled:bg-ink/30"
          >
            Import {validBulkRows.length || ''} rows
          </button>
        </div>
        <textarea
          value={bulkText}
          onChange={(event) => setBulkText(event.target.value)}
          rows={5}
          placeholder={'natural_person, Nomsa Dlamini, 8001015009087, 62\ntrust, Ikhaya Family Trust, IT1234/2020, 38'}
          className="mt-4 w-full rounded-md border border-ink/15 bg-white p-3 text-sm outline-none focus:border-forest focus:ring-4 focus:ring-sage"
        />
        {bulkText.trim() && (
          <div className="mt-4 max-w-full overflow-x-auto rounded-md border border-ink/10">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="bg-paper uppercase tracking-[0.08em] text-ink/50">
                <tr>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">ID / reg</th>
                  <th className="px-3 py-2">Ownership</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {bulkRows.map((row) => (
                  <tr key={row.lineNumber}>
                    <td className={`px-3 py-2 font-semibold ${row.valid ? 'text-forest' : 'text-red-700'}`}>{row.valid ? 'Ready' : row.error}</td>
                    <td className="px-3 py-2">{shareholderTypeLabel(row.shareholder.shareholderType)}</td>
                    <td className="px-3 py-2">{row.shareholder.name || '-'}</td>
                    <td className="px-3 py-2">{row.shareholder.idNumber || '-'}</td>
                    <td className="px-3 py-2">{row.shareholder.ownershipPercentage || '-'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ShareRegisterMaintenancePanel
        shareholders={shareholders}
        shareTransactions={shareTransactions}
        contacts={contacts}
        onSaveShareTransaction={onSaveShareTransaction}
        onUpdateShareTransactionStatus={onUpdateShareTransactionStatus}
        onAddTask={onAddTask}
        isSaving={isSaving}
        feature={shareTransactionFeature}
      />
    </div>
  );
}

function ShareRegisterMaintenancePanel({ shareholders, shareTransactions, contacts, onSaveShareTransaction, onUpdateShareTransactionStatus, onAddTask, isSaving, feature }) {
  const emptyForm = {
    transactionType: 'transfer',
    fromShareholderId: shareholders[0]?.id || '',
    toShareholderId: '',
    toShareholderType: 'natural_person',
    toShareholderName: '',
    toShareholderIdNumber: '',
    ownershipPercentage: '',
    shareClass: 'Ordinary',
    transactionDate: todayIsoDate(),
    consideration: '',
    supportingDocsReceived: false,
    notes: ''
  };
  const [form, setForm] = useState(emptyForm);
  const needsFrom = ['transfer', 'cancellation'].includes(form.transactionType);
  const needsTo = ['transfer', 'allotment'].includes(form.transactionType);
  const addingNewHolder = needsTo && !form.toShareholderId;
  const featureAvailable = feature?.available !== false;
  const canSubmit = featureAvailable && Number(form.ownershipPercentage || 0) > 0 && (!needsFrom || form.fromShareholderId) && (!addingNewHolder || form.toShareholderName.trim());

  useEffect(() => {
    if (needsFrom && !form.fromShareholderId && shareholders[0]?.id) {
      setForm((current) => ({ ...current, fromShareholderId: shareholders[0].id }));
    }
  }, [form.fromShareholderId, needsFrom, shareholders]);

  const submit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSaveShareTransaction(form);
    setForm({ ...emptyForm, fromShareholderId: shareholders[0]?.id || '', transactionDate: todayIsoDate() });
  };

  const createDocsTask = (transaction) => {
    onAddTask({
      title: `Request share ${shareTransactionTypeLabel(transaction.transactionType).toLowerCase()} documents`,
      taskType: 'Share Register',
      contactId: contacts[0]?.id || '',
      dueDate: addDays(new Date(), 7).toISOString().slice(0, 10),
      status: 'open',
      notes: 'Request signed share transfer/allotment documentation, securities register updates, resolutions and supporting proof before accepting the transaction.'
    });
  };

  return (
    <section className="rounded-md border border-ink/10 bg-white">
      <div className="border-b border-ink/10 px-4 py-3">
        <h3 className="font-semibold">Share register maintenance</h3>
        <p className="mt-1 text-sm leading-6 text-ink/55">Record share movements before updating the shareholder register and BO calculations.</p>
      </div>
      <div className="border-b border-ink/10 bg-sage/70 px-4 py-3 text-sm leading-6 text-forest">
        Share transactions do not update the shareholder register immediately. Capture the transaction, confirm signed documents, approve it, then update the register. This keeps the audit trail clear.
      </div>
      {!featureAvailable && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Setup required</p>
          <p className="mt-1">{databaseFeatureUnavailableMessage('Share register maintenance', feature)}</p>
        </div>
      )}

      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-[0.08em] text-ink/50">
            <tr>
              <th className="px-4 py-3">Transaction</th>
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">To</th>
              <th className="px-4 py-3">Ownership</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {shareTransactions.map((transaction) => {
              const validation = validateShareTransaction(transaction, shareholders);
              const nextAction = shareTransactionNextAction(transaction, validation);
              return (
                <tr key={transaction.id}>
                  <td className="px-4 py-4">
                    <p className="font-medium">{shareTransactionTypeLabel(transaction.transactionType)} - {transaction.transactionDate || 'Date not set'}</p>
                    <p className="mt-1 text-xs text-ink/50">{transaction.shareClass || 'Ordinary'}{transaction.consideration ? ` - ${transaction.consideration}` : ''}</p>
                    <ShareTransactionSteps transaction={transaction} validation={validation} />
                    <p className={`mt-2 text-xs font-semibold ${nextAction.tone}`}>{nextAction.label}</p>
                    {validation.preview.length > 0 && <p className="mt-1 text-xs text-ink/50">{validation.preview.join(' | ')}</p>}
                  </td>
                  <td className="px-4 py-4 text-ink/65">{shareholderNameById(shareholders, transaction.fromShareholderId) || 'Company / new issue'}</td>
                  <td className="px-4 py-4 text-ink/65">{shareholderNameById(shareholders, transaction.toShareholderId) || transaction.toShareholderName || 'Cancellation'}</td>
                  <td className="px-4 py-4 text-ink/65">{transaction.ownershipPercentage}%</td>
                  <td className="px-4 py-4"><ShareTransactionStatusBadge status={transaction.status} /></td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {!transaction.supportingDocsReceived && <button onClick={() => createDocsTask(transaction)} disabled={isSaving || !featureAvailable} className="rounded-md border border-gold/60 px-2 py-1 text-xs font-semibold text-gold hover:bg-gold/5 disabled:opacity-50">Request missing documents</button>}
                      {!transaction.supportingDocsReceived && <button onClick={() => onUpdateShareTransactionStatus(transaction.id, { supportingDocsReceived: true })} disabled={isSaving || !featureAvailable} className="rounded-md border border-ink/15 px-2 py-1 text-xs font-semibold text-ink/65 hover:bg-paper disabled:opacity-50">Mark signed documents received</button>}
                      {transaction.status === 'draft' && <button onClick={() => onUpdateShareTransactionStatus(transaction.id, { status: 'approved' })} disabled={isSaving || !featureAvailable || !transaction.supportingDocsReceived} className="rounded-md border border-ink/15 px-2 py-1 text-xs font-semibold text-ink/65 hover:bg-paper disabled:opacity-50">Approve transaction</button>}
                      {transaction.status !== 'accepted' && <button title={nextAction.label} onClick={() => onUpdateShareTransactionStatus(transaction.id, { status: 'accepted' })} disabled={isSaving || !featureAvailable || transaction.status !== 'approved' || !transaction.supportingDocsReceived || !validation.canAccept} className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">Update shareholder register</button>}
                      {transaction.status !== 'rejected' && transaction.status !== 'accepted' && <button onClick={() => onUpdateShareTransactionStatus(transaction.id, { status: 'rejected' })} disabled={isSaving || !featureAvailable} className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Reject</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {shareTransactions.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-ink/55" colSpan="6">No share register transactions captured yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={submit} className="border-t border-ink/10 bg-paper p-4">
        <h4 className="text-sm font-semibold">Create share transaction</h4>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Transaction type</span>
            <select value={form.transactionType} onChange={(event) => setForm({ ...form, transactionType: event.target.value })} className="h-12 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
              <option value="transfer">Transfer</option>
              <option value="allotment">Allotment / issue</option>
              <option value="cancellation">Cancellation / buyback</option>
            </select>
          </label>
          {needsFrom && (
            <label className="block">
              <span className="mb-2 block text-sm font-medium">From shareholder</span>
              <select value={form.fromShareholderId} onChange={(event) => setForm({ ...form, fromShareholderId: event.target.value })} className="h-12 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
                <option value="">Select shareholder</option>
                {shareholders.map((shareholder) => <option key={shareholder.id} value={shareholder.id}>{shareholder.name} ({shareholder.ownershipPercentage}%)</option>)}
              </select>
            </label>
          )}
          {needsTo && (
            <label className="block">
              <span className="mb-2 block text-sm font-medium">To shareholder</span>
              <select value={form.toShareholderId} onChange={(event) => setForm({ ...form, toShareholderId: event.target.value })} className="h-12 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
                <option value="">New shareholder</option>
                {shareholders.map((shareholder) => <option key={shareholder.id} value={shareholder.id}>{shareholder.name}</option>)}
              </select>
            </label>
          )}
          {addingNewHolder && (
            <>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">New holder type</span>
                <select value={form.toShareholderType} onChange={(event) => setForm({ ...form, toShareholderType: event.target.value })} className="h-12 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
                  <option value="natural_person">Natural person</option>
                  <option value="company">Company</option>
                  <option value="trust">Trust</option>
                </select>
              </label>
              <Field label="New holder name" value={form.toShareholderName} onChange={(toShareholderName) => setForm({ ...form, toShareholderName })} placeholder="Name or entity" />
              <Field label="ID / registration" value={form.toShareholderIdNumber} onChange={(toShareholderIdNumber) => setForm({ ...form, toShareholderIdNumber })} placeholder="Identifier" />
            </>
          )}
          <Field type="number" label="Ownership % moved" value={form.ownershipPercentage} onChange={(ownershipPercentage) => setForm({ ...form, ownershipPercentage })} placeholder="e.g. 10" />
          <Field label="Share class" value={form.shareClass} onChange={(shareClass) => setForm({ ...form, shareClass })} placeholder="Ordinary" />
          <Field type="date" label="Transaction date" value={form.transactionDate} onChange={(transactionDate) => setForm({ ...form, transactionDate })} />
          <Field label="Consideration" value={form.consideration} onChange={(consideration) => setForm({ ...form, consideration })} placeholder="e.g. R100 or nil" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.supportingDocsReceived} onChange={(event) => setForm({ ...form, supportingDocsReceived: event.target.checked })} className="h-4 w-4 accent-forest" />
            Signed transfer/resolution docs received
          </label>
          <div className="lg:col-span-3">
            <Field label="Notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} placeholder="Resolution, certificate, consideration, or source notes" />
          </div>
          <button disabled={!canSubmit || isSaving} className="rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white disabled:bg-ink/30">
            {isSaving ? 'Saving...' : 'Create share transaction'}
          </button>
        </div>
      </form>
    </section>
  );
}

function DirectorsPanel({ directors, directorChanges, contacts, onAddDirector, onUpdateDirector, onDeleteDirector, onSaveDirectorChange, onUpdateDirectorChangeStatus, onAddTask, isSaving, directorChangeFeature }) {
  const [form, setForm] = useState({ fullName: '', idNumber: '', appointmentDate: '' });
  const [editingId, setEditingId] = useState(null);
  const canSubmit = form.fullName.trim();

  const submit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    if (editingId) {
      onUpdateDirector({ id: editingId, ...form });
    } else {
      onAddDirector(form);
    }
    setForm({ fullName: '', idNumber: '', appointmentDate: '' });
    setEditingId(null);
  };

  const editDirector = (director) => {
    setEditingId(director.id);
    setForm({
      fullName: director.fullName,
      idNumber: director.idNumber || '',
      appointmentDate: director.appointmentDate || ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="max-w-full overflow-x-auto rounded-md border border-ink/10">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-[0.08em] text-ink/50">
            <tr>
              <th className="px-4 py-3">Director</th>
              <th className="px-4 py-3">ID number</th>
              <th className="px-4 py-3">Appointment date</th>
              <th className="px-4 py-3">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {directors.map((director) => (
              <tr key={director.id}>
                <td className="px-4 py-4 font-medium">{director.fullName}</td>
                <td className="px-4 py-4 text-ink/65">{director.idNumber || 'Not captured'}</td>
                <td className="px-4 py-4 text-ink/65">{director.appointmentDate || 'Not set'}</td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => editDirector(director)} disabled={isSaving} className="rounded-md border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/65 hover:bg-paper disabled:opacity-50">Edit</button>
                    <button onClick={() => onDeleteDirector(director.id)} disabled={isSaving} className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {directors.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-ink/55" colSpan="4">No directors captured yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={submit} className="rounded-md border border-ink/10 bg-paper p-4">
        <h3 className="font-semibold">{editingId ? 'Edit director' : 'Add director'}</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Field label="Full name" value={form.fullName} onChange={(fullName) => setForm({ ...form, fullName })} placeholder="e.g. Thabo Mokoena" />
          <Field label="ID number" value={form.idNumber} onChange={(idNumber) => setForm({ ...form, idNumber })} placeholder="SA ID or passport" />
          <Field type="date" label="Appointment date" value={form.appointmentDate} onChange={(appointmentDate) => setForm({ ...form, appointmentDate })} />
          <div className="flex flex-col gap-3 lg:col-span-3 sm:flex-row">
            <button disabled={!canSubmit || isSaving} className="rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white disabled:bg-ink/30">
              {isSaving ? 'Saving...' : editingId ? 'Save director' : 'Add director'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ fullName: '', idNumber: '', appointmentDate: '' }); }} className="rounded-md border border-ink/15 px-4 py-3 text-sm font-semibold">
                Cancel edit
              </button>
            )}
          </div>
        </div>
      </form>

      <DirectorChangeFilingPanel
        directors={directors}
        directorChanges={directorChanges}
        contacts={contacts}
        onSaveDirectorChange={onSaveDirectorChange}
        onUpdateDirectorChangeStatus={onUpdateDirectorChangeStatus}
        onAddTask={onAddTask}
        isSaving={isSaving}
        feature={directorChangeFeature}
      />
    </div>
  );
}

function DirectorChangeFilingPanel({ directors, directorChanges, contacts, onSaveDirectorChange, onUpdateDirectorChangeStatus, onAddTask, isSaving, feature }) {
  const emptyForm = {
    changeType: 'appointment',
    existingDirectorId: directors[0]?.id || '',
    fullName: '',
    idNumber: '',
    effectiveDate: '',
    boardResolutionReceived: false,
    signedCor39Received: false,
    submissionStatus: 'draft',
    cipcReference: '',
    notes: ''
  };
  const [form, setForm] = useState(emptyForm);
  const selectedDirector = directors.find((director) => String(director.id) === String(form.existingDirectorId));
  const requiresExistingDirector = ['resignation', 'removal', 'details_correction'].includes(form.changeType);
  const featureAvailable = feature?.available !== false;
  const canSubmit = featureAvailable && (form.changeType === 'appointment'
    ? form.fullName.trim() && form.effectiveDate
    : form.existingDirectorId && form.effectiveDate);

  useEffect(() => {
    if (!requiresExistingDirector) return;
    if (!form.existingDirectorId && directors[0]?.id) {
      setForm((current) => ({ ...current, existingDirectorId: directors[0].id }));
    }
  }, [directors, form.existingDirectorId, requiresExistingDirector]);

  const submit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSaveDirectorChange({
      ...form,
      fullName: form.changeType === 'appointment' ? form.fullName : form.fullName || selectedDirector?.fullName || '',
      idNumber: form.changeType === 'appointment' ? form.idNumber : form.idNumber || selectedDirector?.idNumber || ''
    });
    setForm({ ...emptyForm, existingDirectorId: directors[0]?.id || '' });
  };

  const createEvidenceTask = (change, evidenceType) => {
    const contactId = contacts[0]?.id || '';
    onAddTask({
      title: evidenceType === 'resolution' ? `Request board resolution for ${directorChangeTarget(change)}` : `Request signed CoR39 for ${directorChangeTarget(change)}`,
      taskType: 'Director Change',
      contactId,
      dueDate: addDays(new Date(), 7).toISOString().slice(0, 10),
      status: 'open',
      notes: evidenceType === 'resolution'
        ? 'Obtain the signed board/shareholder resolution supporting the director change before CIPC submission.'
        : 'Obtain signed director change filing documents before submitting the change to CIPC.'
    });
  };

  return (
    <section className="rounded-md border border-ink/10 bg-white">
      <div className="border-b border-ink/10 px-4 py-3">
        <h3 className="font-semibold">Director change filings</h3>
        <p className="mt-1 text-sm leading-6 text-ink/55">Track CIPC director changes before updating the official director register.</p>
      </div>
      <div className="border-b border-ink/10 bg-sage/70 px-4 py-3 text-sm leading-6 text-forest">
        Director changes do not update the director register immediately. Capture the filing, collect the resolution and signed CoR39, mark it submitted, then update the register when accepted.
      </div>
      {!featureAvailable && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          <p className="font-semibold">Setup required</p>
          <p className="mt-1">{databaseFeatureUnavailableMessage('Director change filings', feature)}</p>
        </div>
      )}

      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-[0.08em] text-ink/50">
            <tr>
              <th className="px-4 py-3">Change</th>
              <th className="px-4 py-3">Effective date</th>
              <th className="px-4 py-3">Evidence</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">CIPC ref</th>
              <th className="px-4 py-3">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {directorChanges.map((change) => {
              const nextAction = directorChangeNextAction(change);
              return (
                <tr key={change.id}>
                  <td className="px-4 py-4">
                    <p className="font-medium">{directorChangeTypeLabel(change.changeType)}: {directorChangeTarget(change)}</p>
                    {change.notes && <p className="mt-1 max-w-xs truncate text-xs text-ink/50">{change.notes}</p>}
                    <DirectorChangeSteps change={change} />
                    <p className={`mt-2 text-xs font-semibold ${nextAction.tone}`}>{nextAction.label}</p>
                  </td>
                  <td className="px-4 py-4 text-ink/65">{change.effectiveDate || 'Not set'}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className={change.boardResolutionReceived ? 'text-emerald-700' : 'text-amber-700'}>Resolution {change.boardResolutionReceived ? 'received' : 'missing'}</span>
                      <span className={change.signedCor39Received ? 'text-emerald-700' : 'text-amber-700'}>CoR39 {change.signedCor39Received ? 'received' : 'missing'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4"><DirectorChangeStatusBadge status={change.submissionStatus} /></td>
                  <td className="px-4 py-4 text-ink/65">{change.cipcReference || 'Not captured'}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {!change.boardResolutionReceived && <button onClick={() => createEvidenceTask(change, 'resolution')} disabled={isSaving || !featureAvailable} className="rounded-md border border-gold/60 px-2 py-1 text-xs font-semibold text-gold hover:bg-gold/5 disabled:opacity-50">Request board resolution</button>}
                      {!change.signedCor39Received && <button onClick={() => createEvidenceTask(change, 'cor39')} disabled={isSaving || !featureAvailable} className="rounded-md border border-gold/60 px-2 py-1 text-xs font-semibold text-gold hover:bg-gold/5 disabled:opacity-50">Request signed CoR39</button>}
                      {change.submissionStatus === 'draft' && <button onClick={() => onUpdateDirectorChangeStatus(change.id, { submissionStatus: 'submitted' })} disabled={isSaving || !featureAvailable || !change.boardResolutionReceived || !change.signedCor39Received} className="rounded-md border border-ink/15 px-2 py-1 text-xs font-semibold text-ink/65 hover:bg-paper disabled:opacity-50">Mark submitted to CIPC</button>}
                      {change.submissionStatus !== 'accepted' && <button title={nextAction.label} onClick={() => onUpdateDirectorChangeStatus(change.id, { submissionStatus: 'accepted' })} disabled={isSaving || !featureAvailable || change.submissionStatus !== 'submitted' || !change.boardResolutionReceived || !change.signedCor39Received} className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">Update director register</button>}
                      {change.submissionStatus !== 'rejected' && change.submissionStatus !== 'accepted' && <button onClick={() => onUpdateDirectorChangeStatus(change.id, { submissionStatus: 'rejected' })} disabled={isSaving || !featureAvailable} className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Reject</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {directorChanges.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-ink/55" colSpan="6">No director change filings captured yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={submit} className="border-t border-ink/10 bg-paper p-4">
        <h4 className="text-sm font-semibold">Create director change filing</h4>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Change type</span>
            <select value={form.changeType} onChange={(event) => setForm({ ...form, changeType: event.target.value })} className="h-12 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
              <option value="appointment">Appointment</option>
              <option value="resignation">Resignation</option>
              <option value="removal">Removal</option>
              <option value="details_correction">Details correction</option>
            </select>
          </label>
          {requiresExistingDirector ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Existing director</span>
              <select value={form.existingDirectorId} onChange={(event) => setForm({ ...form, existingDirectorId: event.target.value })} className="h-12 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
                <option value="">Select director</option>
                {directors.map((director) => <option key={director.id} value={director.id}>{director.fullName}</option>)}
              </select>
            </label>
          ) : (
            <Field label="New director name" value={form.fullName} onChange={(fullName) => setForm({ ...form, fullName })} placeholder="Full legal name" />
          )}
          <Field type="date" label="Effective date" value={form.effectiveDate} onChange={(effectiveDate) => setForm({ ...form, effectiveDate })} />
          <Field label={requiresExistingDirector ? 'Updated ID/passport' : 'ID/passport'} value={form.idNumber} onChange={(idNumber) => setForm({ ...form, idNumber })} placeholder={selectedDirector?.idNumber || 'SA ID or passport'} />
          <Field label="CIPC reference" value={form.cipcReference} onChange={(cipcReference) => setForm({ ...form, cipcReference })} placeholder="Optional before submission" />
          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.boardResolutionReceived} onChange={(event) => setForm({ ...form, boardResolutionReceived: event.target.checked })} className="h-4 w-4 accent-forest" />
              Board resolution received
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.signedCor39Received} onChange={(event) => setForm({ ...form, signedCor39Received: event.target.checked })} className="h-4 w-4 accent-forest" />
              Signed CoR39 received
            </label>
          </div>
          <div className="lg:col-span-3">
            <Field label="Notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} placeholder="Resolution date, signer, supporting documents, or rejection reason" />
          </div>
          <button disabled={!canSubmit || isSaving} className="rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white disabled:bg-ink/30">
            {isSaving ? 'Saving...' : 'Create director change filing'}
          </button>
        </div>
      </form>
    </section>
  );
}

function DirectorChangeStatusBadge({ status }) {
  const styles = {
    draft: 'border-ink/10 bg-paper text-ink/55',
    submitted: 'border-blue-200 bg-blue-50 text-blue-800',
    accepted: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    rejected: 'border-red-200 bg-red-50 text-red-800'
  };
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles[status] || styles.draft}`}>{directorChangeStatusLabel(status)}</span>;
}

function DirectorChangeSteps({ change }) {
  const steps = [
    { label: 'Captured', complete: true },
    { label: 'Resolution received', complete: Boolean(change.boardResolutionReceived) },
    { label: 'CoR39 received', complete: Boolean(change.signedCor39Received) },
    { label: 'Submitted', complete: ['submitted', 'accepted'].includes(change.submissionStatus) },
    { label: 'Register updated', complete: change.submissionStatus === 'accepted' }
  ];

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {steps.map((step, index) => (
        <span
          key={step.label}
          className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${
            step.complete ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {index + 1}. {step.label}
        </span>
      ))}
    </div>
  );
}

function directorChangeNextAction(change) {
  if (change.submissionStatus === 'accepted') {
    return { label: 'Complete: director register has been updated.', tone: 'text-forest' };
  }
  if (!change.boardResolutionReceived) {
    return { label: 'Next step: request or mark the board resolution received.', tone: 'text-amber-700' };
  }
  if (!change.signedCor39Received) {
    return { label: 'Next step: request or mark signed CoR39 received.', tone: 'text-amber-700' };
  }
  if (change.submissionStatus !== 'submitted') {
    return { label: 'Next step: mark submitted to CIPC.', tone: 'text-amber-700' };
  }
  return { label: 'Ready: update director register.', tone: 'text-forest' };
}

function OwnershipMapPanel({ company, detail }) {
  const [copied, setCopied] = useState(false);
  const shareholders = detail.shareholders || [];
  const mapNodes = buildOwnershipMapNodes(detail);
  const ownershipTotal = shareholders.reduce((sum, shareholder) => sum + Number(shareholder.ownershipPercentage || 0), 0);
  const beneficialOwners = mapNodes.filter((node) => node.status === 'confirmed');
  const reviewItems = mapNodes.filter((node) => node.status === 'review');
  const mermaid = buildOwnershipMermaid(company, mapNodes);

  const copyMermaid = async () => {
    try {
      await navigator.clipboard.writeText(mermaid);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Ownership Map</h3>
          <p className="mt-1 text-sm leading-6 text-ink/55">
            Visual view of shareholders and BO findings using the South African threshold of more than 5%.
          </p>
        </div>
        <button onClick={copyMermaid} className="rounded-md border border-gold/60 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/5">
          {copied ? 'Copied' : 'Copy Mermaid'}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-ink/10 bg-paper p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-ink/45">Beneficial owners</p>
          <p className="mt-2 text-2xl font-semibold text-forest">{beneficialOwners.length}</p>
          <p className="mt-1 text-sm text-ink/55">Resolved BO paths</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-ink/45">Review items</p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">{reviewItems.length}</p>
          <p className="mt-1 text-sm text-ink/55">Trust/entity paths still open</p>
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-ink/45">Ownership total</p>
          <p className={`mt-2 text-2xl font-semibold ${Math.abs(ownershipTotal - 100) < 0.01 ? 'text-forest' : 'text-red-700'}`}>{ownershipTotal}%</p>
          <p className="mt-1 text-sm text-ink/55">{Math.abs(ownershipTotal - 100) < 0.01 ? 'Balanced to 100%' : 'Needs reconciliation'}</p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto rounded-md border border-ink/10 bg-white p-4">
        {shareholders.length ? (
          <OwnershipMapSvg company={company} nodes={mapNodes} />
        ) : (
          <div className="grid min-h-[260px] place-items-center text-center text-sm text-ink/55">
            Add shareholders to generate the ownership map.
          </div>
        )}
      </div>
    </div>
  );
}

function OwnershipMapSvg({ company, nodes }) {
  const width = 1040;
  const rowHeight = 118;
  const height = Math.max(300, nodes.length * rowHeight + 70);
  const companyX = 80;
  const companyY = height / 2;
  const shareholderX = 560;
  const boX = 900;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto min-w-[760px] max-w-full" role="img" aria-label="Ownership map">
      <defs>
        <marker id="ownership-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#6f7777" />
        </marker>
      </defs>
      <rect x="24" y={companyY - 54} width="290" height="108" rx="8" fill="#f6f4ef" stroke="#d9d4ca" />
      <text x={companyX} y={companyY - 12} className="fill-ink text-[20px] font-semibold">{truncateSvgText(company.name, 24)}</text>
      <text x={companyX} y={companyY + 18} className="fill-ink/60 text-[14px]">{company.registrationNumber}</text>
      <text x={companyX} y={companyY + 42} className="fill-ink/45 text-[12px]">Client company</text>

      {nodes.map((node, index) => {
        const y = 58 + index * rowHeight;
        const style = ownershipNodeStyle(node);
        return (
          <g key={node.id}>
            <path d={`M314 ${companyY} C410 ${companyY}, 430 ${y + 46}, ${shareholderX - 12} ${y + 46}`} fill="none" stroke="#9aa1a1" strokeWidth="2" markerEnd="url(#ownership-arrow)" />
            <text x="392" y={Math.min(companyY, y + 46) + Math.abs(companyY - (y + 46)) / 2 - 8} className="fill-ink/55 text-[13px]">{Number(node.ownershipPercentage || 0)}%</text>
            <rect x={shareholderX} y={y} width="300" height="96" rx="8" fill={style.fill} stroke={style.stroke} />
            <text x={shareholderX + 20} y={y + 26} className="fill-ink text-[16px] font-semibold">{truncateSvgText(node.name, 26)}</text>
            <text x={shareholderX + 20} y={y + 51} className="fill-ink/60 text-[13px]">{shareholderTypeLabel(node.shareholderType)} - {node.idNumber || 'ID/reg not captured'}</text>
            <text x={shareholderX + 20} y={y + 74} className="text-[13px] font-semibold" fill={style.text}>{style.label}</text>
            {node.beneficialOwners.slice(0, 2).map((owner, ownerIndex) => (
              <g key={`${node.id}-${owner.id || owner.fullName}-${ownerIndex}`}>
                <path d={`M860 ${y + 48} C880 ${y + 48}, 882 ${y + 24 + ownerIndex * 40}, ${boX - 12} ${y + 24 + ownerIndex * 40}`} fill="none" stroke="#9aa1a1" strokeWidth="1.5" markerEnd="url(#ownership-arrow)" />
                <rect x={boX} y={y + 4 + ownerIndex * 40} width="120" height="32" rx="6" fill="#ecfdf5" stroke="#a7f3d0" />
                <text x={boX + 9} y={y + 17 + ownerIndex * 40} className="fill-ink text-[11px] font-semibold">{truncateSvgText(owner.fullName, 17)}</text>
                <text x={boX + 9} y={y + 30 + ownerIndex * 40} className="fill-emerald-700 text-[10px]">{Number(owner.ownershipPercentage || owner.effectiveOwnership || 0)}% effective</text>
              </g>
            ))}
            {node.beneficialOwners.length > 2 && (
              <text x={boX + 9} y={y + 93} className="fill-emerald-700 text-[10px] font-semibold">+{node.beneficialOwners.length - 2} more BO</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function BoRegisterPanel({
  company,
  shareholders,
  beneficialOwners,
  trustReviews,
  entityOwnershipReviews,
  onConfirmBeneficialOwner,
  onDeleteBeneficialOwner,
  onSaveTrustReview,
  onCreateBeneficialOwnersFromTrustReview,
  onSaveEntityOwnershipReview,
  onCreateBeneficialOwnersFromEntityReview,
  isSaving,
  entityReviewLookup,
  currentCompanyId
}) {
  const emptyManualBo = { fullName: '', idNumber: '', ownershipPercentage: '', controlBasis: 'Indirect ownership', notes: '' };
  const [manualBo, setManualBo] = useState(emptyManualBo);
  const rows = buildBoRegisterRows(shareholders, beneficialOwners, trustReviews, entityOwnershipReviews);
  const confirmedRows = rows.filter((row) => row.status === 'confirmed');
  const reviewRows = rows.filter((row) => row.status === 'review');
  const belowRows = rows.filter((row) => row.status === 'below');
  const trustPeopleCount = trustReviews.reduce(
    (count, review) => count + review.trustees.length + review.beneficiaries.length + review.founders.length + review.controllers.length,
    0
  );
  const isConfirmed = (row) =>
    beneficialOwners.some((owner) =>
      (row.shareholderId && String(owner.shareholderId) === String(row.shareholderId)) ||
      owner.fullName.trim().toLowerCase() === row.name.trim().toLowerCase()
    );

  const exportCsv = () => {
    const csvRows = [
      ['Company name', company.name],
      ['Registration number', company.registrationNumber],
      ['Generated date', new Date().toLocaleDateString('en-ZA')],
      [],
      ['Name', 'Type', 'ID / registration number', 'Ownership %', 'BO status', 'Action required'],
      ...rows.map((row) => [row.name, row.typeLabel, row.idNumber, row.ownershipPercentage, row.statusLabel, row.action])
    ];
    downloadTextFile(`${fileSafeName(company.name)}-bo-working-register.csv`, csvRows.map((row) => row.map(csvValue).join(',')).join('\n'), 'text/csv');
  };

  const submitManualBo = (event) => {
    event.preventDefault();
    if (!manualBo.fullName.trim()) return;
    onConfirmBeneficialOwner({
      shareholderId: null,
      fullName: manualBo.fullName.trim(),
      idNumber: manualBo.idNumber.trim(),
      ownershipPercentage: Number(manualBo.ownershipPercentage || 0),
      controlBasis: manualBo.controlBasis,
      notes: manualBo.notes.trim()
    });
    setManualBo(emptyManualBo);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Beneficial Ownership Register</h3>
          <p className="mt-1 text-sm leading-6 text-ink/55">
            Working register derived from shareholders. Natural persons over 5% are flagged as confirmed BOs; trusts and entities over 5% remain review items.
          </p>
        </div>
        <button onClick={exportCsv} disabled={rows.length === 0} className="rounded-md border border-gold/60 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/5 disabled:opacity-50">
          Export CSV
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <p className="text-xs uppercase tracking-[0.12em]">Stored BO records</p>
          <p className="mt-2 text-2xl font-semibold">{beneficialOwners.length}</p>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <p className="text-xs uppercase tracking-[0.12em]">Review items</p>
          <p className="mt-2 text-2xl font-semibold">{reviewRows.length}</p>
          {trustPeopleCount > 0 && <p className="mt-1 text-xs">{trustPeopleCount} trust person records captured</p>}
        </div>
        <div className="rounded-md border border-ink/10 bg-paper p-4 text-ink/70">
          <p className="text-xs uppercase tracking-[0.12em]">Below threshold</p>
          <p className="mt-2 text-2xl font-semibold">{belowRows.length}</p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto rounded-md border border-ink/10">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-[0.08em] text-ink/50">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">ID / registration</th>
              <th className="px-4 py-3">Ownership</th>
              <th className="px-4 py-3">BO status</th>
              <th className="px-4 py-3">Action required</th>
              <th className="px-4 py-3">Filing record</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-4 font-medium">{row.name}</td>
                <td className="px-4 py-4 text-ink/65">{row.typeLabel}</td>
                <td className="px-4 py-4 text-ink/65">{row.idNumber || 'Not captured'}</td>
                <td className="px-4 py-4 text-ink/65">{row.ownershipPercentage}%</td>
                <td className="px-4 py-4"><BoStatusBadge status={row.status} label={row.statusLabel} /></td>
                <td className="px-4 py-4 text-ink/65">{row.action}</td>
                <td className="px-4 py-4">
                  {isConfirmed(row) ? (
                    <span className="text-xs font-semibold text-forest">Confirmed</span>
                  ) : row.status === 'confirmed' ? (
                    <button
                      onClick={() => onConfirmBeneficialOwner({
                        shareholderId: row.shareholderId,
                        fullName: row.name,
                        idNumber: row.idNumber,
                        ownershipPercentage: row.ownershipPercentage,
                        controlBasis: 'Direct shareholding above 5%'
                      })}
                      disabled={isSaving}
                      className="rounded-md border border-forest/40 px-3 py-2 text-xs font-semibold text-forest hover:bg-sage disabled:opacity-50"
                    >
                      Confirm BO
                    </button>
                  ) : (
                    <span className="text-xs text-ink/45">Review first</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-ink/55" colSpan="7">No shareholders captured yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-md border border-ink/10 bg-white">
        <div className="border-b border-ink/10 px-4 py-3">
          <h4 className="font-semibold">Confirmed filing records</h4>
          <p className="mt-1 text-sm text-ink/55">These records are stored separately from shareholders and should represent the filing position.</p>
        </div>
        <div className="divide-y divide-ink/10">
          {beneficialOwners.map((owner) => (
            <div key={owner.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{owner.fullName}</p>
                <p className="mt-1 text-sm text-ink/55">{owner.idNumber || 'ID not captured'} - {owner.ownershipPercentage}% - {owner.controlBasis}</p>
                {owner.notes && <p className="mt-1 text-xs leading-5 text-ink/45">{owner.notes}</p>}
              </div>
              <button onClick={() => onDeleteBeneficialOwner(owner.id)} disabled={isSaving} className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                Remove
              </button>
            </div>
          ))}
          {beneficialOwners.length === 0 && (
            <p className="p-4 text-sm text-ink/55">No confirmed BO filing records yet.</p>
          )}
        </div>
      </div>

      <form onSubmit={submitManualBo} className="rounded-md border border-ink/10 bg-paper p-4">
        <h4 className="font-semibold">Add manual BO / control override</h4>
        <p className="mt-1 text-sm leading-6 text-ink/55">
          Use this when a natural person is a beneficial owner through indirect ownership or control, not only direct shareholding.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Field label="Full name" value={manualBo.fullName} onChange={(fullName) => setManualBo({ ...manualBo, fullName })} placeholder="Natural person name" />
          <Field label="ID / passport number" value={manualBo.idNumber} onChange={(idNumber) => setManualBo({ ...manualBo, idNumber })} placeholder="SA ID or passport" />
          <Field type="number" label="Ownership %" value={manualBo.ownershipPercentage} onChange={(ownershipPercentage) => setManualBo({ ...manualBo, ownershipPercentage })} placeholder="0 if control only" />
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Control basis</span>
            <select value={manualBo.controlBasis} onChange={(event) => setManualBo({ ...manualBo, controlBasis: event.target.value })} className="h-12 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
              {beneficialOwnerControlBasisOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <div className="lg:col-span-2">
            <Field label="Notes / reason" value={manualBo.notes} onChange={(notes) => setManualBo({ ...manualBo, notes })} placeholder="Explain the filing judgement or source document" />
          </div>
          <div className="lg:col-span-2">
            <button disabled={isSaving || !manualBo.fullName.trim()} className="rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white disabled:bg-ink/30">
              {isSaving ? 'Saving...' : 'Add manual BO'}
            </button>
          </div>
        </div>
      </form>

      <TrustReviewPanel
        trustShareholders={shareholders.filter((shareholder) => shareholder.shareholderType === 'trust')}
        trustReviews={trustReviews}
        onSaveTrustReview={onSaveTrustReview}
        onCreateBeneficialOwnersFromTrustReview={onCreateBeneficialOwnersFromTrustReview}
        isSaving={isSaving}
      />
      <EntityOwnershipReviewPanel
        entityShareholders={shareholders.filter((shareholder) => shareholder.shareholderType === 'company')}
        entityOwnershipReviews={entityOwnershipReviews}
        onSaveEntityOwnershipReview={onSaveEntityOwnershipReview}
        onCreateBeneficialOwnersFromEntityReview={onCreateBeneficialOwnersFromEntityReview}
        isSaving={isSaving}
        entityReviewLookup={entityReviewLookup}
        currentCompanyId={currentCompanyId}
      />
    </div>
  );
}

function TrustReviewPanel({ trustShareholders, trustReviews, onSaveTrustReview, onCreateBeneficialOwnersFromTrustReview, isSaving }) {
  if (trustShareholders.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50/60">
      <div className="border-b border-amber-200 px-4 py-3">
        <h4 className="font-semibold text-amber-950">Trust review workflow</h4>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          Capture natural persons from the Trust Deed, then create confirmed BO records from the reviewed people.
        </p>
      </div>
      <div className="space-y-4 p-4">
        {trustShareholders.map((trust) => (
          <TrustReviewCard
            key={trust.id}
            trust={trust}
            review={trustReviews.find((item) => String(item.shareholderId) === String(trust.id))}
            onSaveTrustReview={onSaveTrustReview}
            onCreateBeneficialOwnersFromTrustReview={onCreateBeneficialOwnersFromTrustReview}
            isSaving={isSaving}
          />
        ))}
      </div>
    </div>
  );
}

function TrustReviewCard({ trust, review, onSaveTrustReview, onCreateBeneficialOwnersFromTrustReview, isSaving }) {
  const [form, setForm] = useState({ notes: review?.notes || '' });
  const [peopleRows, setPeopleRows] = useState(() => trustReviewRows(review));
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');

  useEffect(() => {
    setForm({ notes: review?.notes || '' });
    setPeopleRows(trustReviewRows(review));
  }, [review?.id, review?.reviewedAt]);

  const people = peopleRows.map(cleanTrustPersonRow).filter((person) => person.fullName.trim());
  const groupedPeople = groupTrustPeople(people);
  const peopleCount = people.length;

  const updatePersonRow = (index, updates) => {
    setPeopleRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...updates } : row)));
  };

  const addPersonRow = (role = 'trustee') => {
    setPeopleRows((current) => [...current, { ...emptyTrustPersonRow(), role }]);
  };

  const removePersonRow = (index) => {
    setPeopleRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const importPasteRows = () => {
    const imported = parseTrustPeopleWithRole(pasteText);
    if (imported.length === 0) return;
    setPeopleRows((current) => {
      const existing = current.filter((row) => row.fullName.trim());
      return [...existing, ...imported.map((person) => ({ ...emptyTrustPersonRow(), ...person }))];
    });
    setPasteText('');
    setShowPaste(false);
  };

  const submit = (event) => {
    event.preventDefault();
    onSaveTrustReview({
      id: review?.id,
      shareholderId: trust.id,
      trustees: groupedPeople.trustees,
      beneficiaries: groupedPeople.beneficiaries,
      founders: groupedPeople.founders,
      controllers: groupedPeople.controllers,
      notes: form.notes
    });
  };

  return (
    <form onSubmit={submit} className="rounded-md border border-ink/10 bg-white p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-semibold">{trust.name}</p>
          <p className="mt-1 text-sm text-ink/55">{trust.ownershipPercentage}% shareholder - Trust Deed review required</p>
        </div>
        {review?.reviewedAt && <p className="rounded-md bg-paper px-2 py-1 text-xs text-ink/55">Reviewed {new Date(review.reviewedAt).toLocaleDateString('en-ZA')}</p>}
      </div>

      <div className="mt-4 rounded-md border border-ink/10">
        <div className="flex flex-col gap-3 border-b border-ink/10 bg-paper px-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">Trust Deed people</p>
            <p className="mt-1 text-xs text-ink/55">Capture each natural person and their role in the trust. Use 0% where the person controls but does not own a fixed percentage.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => addPersonRow('trustee')} className="rounded-md border border-forest/40 px-3 py-2 text-xs font-semibold text-forest hover:bg-sage">Add trustee</button>
            <button type="button" onClick={() => addPersonRow('beneficiary')} className="rounded-md border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/65 hover:bg-white">Add beneficiary</button>
            <button type="button" onClick={() => addPersonRow('founder')} className="rounded-md border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/65 hover:bg-white">Add founder</button>
            <button type="button" onClick={() => addPersonRow('controller')} className="rounded-md border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/65 hover:bg-white">Add controller</button>
          </div>
        </div>

        <div className="space-y-3 p-3">
          {peopleRows.map((person, index) => (
            <div key={person.id || index} className="grid gap-3 rounded-md border border-ink/10 bg-white p-3 lg:grid-cols-[170px_minmax(0,1fr)_180px_120px_minmax(0,1fr)_auto] lg:items-end">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-ink/60">Role</span>
                <select value={person.role} onChange={(event) => updatePersonRow(index, { role: event.target.value })} className="h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
                  <option value="trustee">Trustee</option>
                  <option value="beneficiary">Beneficiary</option>
                  <option value="founder">Founder / settlor</option>
                  <option value="controller">Protector / controller</option>
                </select>
              </label>
              <Field label="Name" value={person.fullName} onChange={(fullName) => updatePersonRow(index, { fullName })} placeholder="Natural person name" />
              <Field label="ID / passport" value={person.idNumber} onChange={(idNumber) => updatePersonRow(index, { idNumber })} placeholder="Identifier" />
              <Field type="number" label="Ownership %" value={person.ownershipPercentage} onChange={(ownershipPercentage) => updatePersonRow(index, { ownershipPercentage })} placeholder="0" />
              <Field label="Notes" value={person.notes} onChange={(notes) => updatePersonRow(index, { notes })} placeholder="Clause, class, vesting or control note" />
              <button type="button" onClick={() => removePersonRow(index)} disabled={peopleRows.length === 1} className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40">
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-ink/10 px-3 py-3">
          <button type="button" onClick={() => setShowPaste((current) => !current)} className="text-xs font-semibold text-gold">
            {showPaste ? 'Hide paste import' : 'Paste people from notes'}
          </button>
          {showPaste && (
            <div className="mt-3">
              <textarea
                value={pasteText}
                onChange={(event) => setPasteText(event.target.value)}
                rows={4}
                placeholder={'trustee, Name, ID/passport, ownership %, notes\nbeneficiary, Name, ID/passport, ownership %, notes\nfounder, Name, ID/passport, 0, settlor\ncontroller, Name, ID/passport, 0, protector'}
                className="w-full rounded-md border border-ink/15 bg-white p-3 text-sm outline-none focus:border-forest focus:ring-4 focus:ring-sage"
              />
              <button type="button" onClick={importPasteRows} disabled={!pasteText.trim()} className="mt-2 rounded-md border border-gold/60 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/5 disabled:opacity-50">
                Import pasted people
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Field label="Trust Deed notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} placeholder="Clause references, uncertainty, or source notes" />
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button disabled={isSaving} className="rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white disabled:bg-ink/30">
          {isSaving ? 'Saving...' : 'Save trust review'}
        </button>
        <button
          type="button"
          onClick={() => review?.id && onCreateBeneficialOwnersFromTrustReview(review.id)}
          disabled={isSaving || !review?.id || peopleCount === 0}
          className="rounded-md border border-gold/60 px-4 py-3 text-sm font-semibold text-gold hover:bg-gold/5 disabled:opacity-50"
        >
          Create BO records from trust
        </button>
      </div>
    </form>
  );
}

function EntityOwnershipReviewPanel({ entityShareholders, entityOwnershipReviews, onSaveEntityOwnershipReview, onCreateBeneficialOwnersFromEntityReview, isSaving, entityReviewLookup, currentCompanyId }) {
  if (entityShareholders.length === 0) return null;

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50/60">
      <div className="border-b border-amber-200 px-4 py-3">
        <h4 className="font-semibold text-amber-950">Company shareholder look-through</h4>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          Capture owners of company shareholders and calculate indirect ownership into this company.
        </p>
      </div>
      <div className="space-y-4 p-4">
        {entityShareholders.map((entity) => {
          const review = entityOwnershipReviews.find((item) => String(item.shareholderId) === String(entity.id));
          const lookupKey = entity.idNumber?.trim().toLowerCase();
          const match = lookupKey ? entityReviewLookup?.[lookupKey] : null;
          const suggestion = !review && match && match.sourceCompanyId !== currentCompanyId ? match : null;
          return (
            <EntityOwnershipReviewCard
              key={entity.id}
              entity={entity}
              review={review}
              suggestion={suggestion}
              onSaveEntityOwnershipReview={onSaveEntityOwnershipReview}
              onCreateBeneficialOwnersFromEntityReview={onCreateBeneficialOwnersFromEntityReview}
              isSaving={isSaving}
            />
          );
        })}
      </div>
    </div>
  );
}

function EntityOwnershipReviewCard({ entity, review, suggestion, onSaveEntityOwnershipReview, onCreateBeneficialOwnersFromEntityReview, isSaving }) {
  const [form, setForm] = useState(entityOwnershipReviewToForm(review));
  const [ownerRows, setOwnerRows] = useState(() => entityOwnershipReviewRows(review));
  const [pasteText, setPasteText] = useState('');
  const [showPaste, setShowPaste] = useState(false);

  useEffect(() => {
    setForm(entityOwnershipReviewToForm(review));
    setOwnerRows(entityOwnershipReviewRows(review));
  }, [review?.id, review?.reviewedAt]);

  const owners = ownerRows
    .map(cleanEntityOwnerRow)
    .filter((owner) => owner.fullName.trim());
  const effectiveOwners = owners.map((owner) => ({
    ...owner,
    effectiveOwnership: calculateEffectiveOwnership(entity.ownershipPercentage, owner.ownershipPercentage)
  }));
  const updateOwnerRow = (index, updates) => {
    setOwnerRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...updates } : row)));
  };
  const addOwnerRow = (ownerType = 'natural_person') => {
    setOwnerRows((current) => [...current, { ...emptyEntityOwnerRow(), ownerType }]);
  };
  const removeOwnerRow = (index) => {
    setOwnerRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };
  const importSuggestion = () => {
    setOwnerRows(entityOwnershipReviewRows(suggestion.review));
    setForm({ notes: `Imported from ${suggestion.sourceCompanyName}${suggestion.review.notes ? ` — ${suggestion.review.notes}` : ''}` });
  };
  const importPasteRows = () => {
    const imported = parseEntityOwners(pasteText);
    if (imported.length === 0) return;
    setOwnerRows((current) => {
      const existing = current.filter((row) => row.fullName.trim());
      return [...existing, ...imported.map((owner) => ({ ...emptyEntityOwnerRow(), ...owner }))];
    });
    setPasteText('');
    setShowPaste(false);
  };

  const submit = (event) => {
    event.preventDefault();
    onSaveEntityOwnershipReview({
      id: review?.id,
      shareholderId: entity.id,
      owners,
      notes: form.notes
    });
  };

  return (
    <form onSubmit={submit} className="rounded-md border border-ink/10 bg-white p-4">
      {suggestion && (
        <div className="mb-4 flex flex-col gap-2 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-sky-900">
            <span className="font-semibold">{suggestion.entityName}</span> was reviewed
            {suggestion.review.reviewedAt ? ` on ${new Date(suggestion.review.reviewedAt).toLocaleDateString('en-ZA')}` : ''} for{' '}
            <span className="font-semibold">{suggestion.sourceCompanyName}</span> — import that look-through?
          </p>
          <button
            type="button"
            onClick={importSuggestion}
            className="shrink-0 rounded-md border border-sky-400 px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100"
          >
            Import look-through
          </button>
        </div>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-semibold">{entity.name}</p>
          <p className="mt-1 text-sm text-ink/55">{entity.ownershipPercentage}% shareholder - trace through to natural persons</p>
        </div>
        {review?.reviewedAt && <p className="rounded-md bg-paper px-2 py-1 text-xs text-ink/55">Reviewed {new Date(review.reviewedAt).toLocaleDateString('en-ZA')}</p>}
      </div>
      <div className="mt-4 rounded-md border border-ink/10">
        <div className="flex flex-col gap-3 border-b border-ink/10 bg-paper px-3 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">Underlying owners</p>
            <p className="mt-1 text-xs text-ink/55">Add each owner of {entity.name}. Effective ownership is calculated automatically.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => addOwnerRow('natural_person')} className="rounded-md border border-forest/40 px-3 py-2 text-xs font-semibold text-forest hover:bg-sage">
              Add person
            </button>
            <button type="button" onClick={() => addOwnerRow('company')} className="rounded-md border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/65 hover:bg-white">
              Add company
            </button>
            <button type="button" onClick={() => addOwnerRow('trust')} className="rounded-md border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/65 hover:bg-white">
              Add trust
            </button>
          </div>
        </div>
        <div className="space-y-3 p-3">
          {ownerRows.map((owner, index) => {
            const effective = calculateEffectiveOwnership(entity.ownershipPercentage, owner.ownershipPercentage);
            return (
              <div key={owner.id || index} className="grid gap-3 rounded-md border border-ink/10 bg-white p-3 lg:grid-cols-[150px_minmax(0,1fr)_180px_120px_minmax(0,1fr)_auto] lg:items-end">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-ink/60">Type</span>
                  <select value={owner.ownerType} onChange={(event) => updateOwnerRow(index, { ownerType: event.target.value })} className="h-11 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
                    <option value="natural_person">Natural person</option>
                    <option value="company">Company</option>
                    <option value="trust">Trust</option>
                  </select>
                </label>
                <Field label="Name" value={owner.fullName} onChange={(fullName) => updateOwnerRow(index, { fullName })} placeholder="Owner name" />
                <Field label="ID / reg / IT number" value={owner.idNumber} onChange={(idNumber) => updateOwnerRow(index, { idNumber })} placeholder="Identifier" />
                <Field type="number" label="Ownership %" value={owner.ownershipPercentage} onChange={(ownershipPercentage) => updateOwnerRow(index, { ownershipPercentage })} placeholder="%" />
                <Field label="Notes" value={owner.notes} onChange={(notes) => updateOwnerRow(index, { notes })} placeholder="Source or next step" />
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-paper px-2 py-2 text-xs font-semibold text-ink/60" title="Effective ownership in the client company">
                    {effective}%
                  </span>
                  <button type="button" onClick={() => removeOwnerRow(index)} disabled={ownerRows.length === 1} className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40">
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-ink/10 px-3 py-3">
          <button type="button" onClick={() => setShowPaste((current) => !current)} className="text-xs font-semibold text-gold">
            {showPaste ? 'Hide paste import' : 'Paste multiple owners'}
          </button>
          {showPaste && (
            <div className="mt-3">
              <textarea
                value={pasteText}
                onChange={(event) => setPasteText(event.target.value)}
                rows={4}
                placeholder={'natural_person, Name, ID/passport, ownership %, notes\ncompany, Holding Co, reg number, ownership %, continue tracing\ntrust, Family Trust, IT number, ownership %, Trust Deed required'}
                className="w-full rounded-md border border-ink/15 bg-white p-3 text-sm outline-none focus:border-forest focus:ring-4 focus:ring-sage"
              />
              <button type="button" onClick={importPasteRows} disabled={!pasteText.trim()} className="mt-2 rounded-md border border-gold/60 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/5 disabled:opacity-50">
                Import pasted rows
              </button>
            </div>
          )}
        </div>
      </div>
      {effectiveOwners.length > 0 && (
        <div className="mt-4 max-w-full overflow-x-auto rounded-md border border-ink/10">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-paper uppercase tracking-[0.08em] text-ink/50">
              <tr>
                <th className="px-3 py-2">Owner</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Direct in entity</th>
                <th className="px-3 py-2">Effective in client</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {effectiveOwners.map((owner, index) => (
                <tr key={`${owner.fullName}-${index}`}>
                  <td className="px-3 py-2 font-medium">{owner.fullName}</td>
                  <td className="px-3 py-2">{shareholderTypeLabel(owner.ownerType)}</td>
                  <td className="px-3 py-2">{owner.ownershipPercentage}%</td>
                  <td className="px-3 py-2">{owner.effectiveOwnership}%</td>
                  <td className="px-3 py-2">{entityOwnerAction(owner)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4">
        <Field label="Look-through notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} placeholder="Source documents, unresolved layers, or assumptions" />
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button disabled={isSaving} className="rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white disabled:bg-ink/30">
          {isSaving ? 'Saving...' : 'Save look-through'}
        </button>
        <button
          type="button"
          onClick={() => review?.id && onCreateBeneficialOwnersFromEntityReview(review.id)}
          disabled={isSaving || !review?.id || effectiveOwners.filter((owner) => owner.ownerType === 'natural_person' && owner.effectiveOwnership > 5).length === 0}
          className="rounded-md border border-gold/60 px-4 py-3 text-sm font-semibold text-gold hover:bg-gold/5 disabled:opacity-50"
        >
          Create BO records from entity
        </button>
      </div>
    </form>
  );
}

function BoStatusBadge({ status, label }) {
  const styles = {
    confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    resolved: 'border-forest/25 bg-sage text-forest',
    review: 'border-amber-200 bg-amber-50 text-amber-800',
    below: 'border-ink/10 bg-white text-ink/55'
  };
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}>{label}</span>;
}

function ContactsPanel({ contacts, onAddContact, onUpdateContact, onDeleteContact, isSaving }) {
  const emptyForm = { fullName: '', role: '', email: '', phone: '', notes: '' };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const canSubmit = form.fullName.trim();

  const submit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    if (editingId) {
      onUpdateContact({ id: editingId, ...form });
    } else {
      onAddContact(form);
    }
    setForm(emptyForm);
    setEditingId(null);
  };

  const editContact = (contact) => {
    setEditingId(contact.id);
    setForm({
      fullName: contact.fullName,
      role: contact.role || '',
      email: contact.email || '',
      phone: contact.phone || '',
      notes: contact.notes || ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="max-w-full overflow-x-auto rounded-md border border-ink/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-[0.08em] text-ink/50">
            <tr>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-4 py-3">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td className="px-4 py-4 font-medium">{contact.fullName}</td>
                <td className="px-4 py-4 text-ink/65">{contact.role || 'Not set'}</td>
                <td className="px-4 py-4 text-ink/65">{contact.email || 'Not captured'}</td>
                <td className="px-4 py-4 text-ink/65">{contact.phone || 'Not captured'}</td>
                <td className="max-w-[220px] truncate px-4 py-4 text-ink/65">{contact.notes || 'None'}</td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => editContact(contact)} disabled={isSaving} className="rounded-md border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/65 hover:bg-paper disabled:opacity-50">Edit</button>
                    <button onClick={() => onDeleteContact(contact.id)} disabled={isSaving} className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-ink/55" colSpan="6">No client contacts captured yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={submit} className="rounded-md border border-ink/10 bg-paper p-4">
        <h3 className="font-semibold">{editingId ? 'Edit contact' : 'Add contact'}</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Field label="Full name" value={form.fullName} onChange={(fullName) => setForm({ ...form, fullName })} placeholder="e.g. Nomsa Dlamini" />
          <Field label="Role" value={form.role} onChange={(role) => setForm({ ...form, role })} placeholder="Director / Company secretary / Accountant" />
          <Field type="email" label="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} placeholder="name@example.co.za" />
          <Field label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} placeholder="+27..." />
          <div className="lg:col-span-2">
            <Field label="Notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} placeholder="Mandate signer, Trust Deed follow-up, preferred contact times" />
          </div>
          <div className="flex flex-col gap-3 lg:col-span-2 sm:flex-row">
            <button disabled={!canSubmit || isSaving} className="rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white disabled:bg-ink/30">
              {isSaving ? 'Saving...' : editingId ? 'Save contact' : 'Add contact'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-md border border-ink/15 px-4 py-3 text-sm font-semibold">
                Cancel edit
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function TasksPanel({ tasks, contacts, onAddTask, onUpdateTask, onDeleteTask, isSaving }) {
  const emptyForm = { title: '', taskType: 'Mandate', contactId: '', dueDate: '', status: 'open', notes: '' };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const canSubmit = form.title.trim();

  const submit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    if (editingId) {
      onUpdateTask({ id: editingId, ...form });
    } else {
      onAddTask(form);
    }
    setForm(emptyForm);
    setEditingId(null);
  };

  const editTask = (task) => {
    setEditingId(task.id);
    setForm({
      title: task.title,
      taskType: task.taskType || 'Mandate',
      contactId: task.contactId || '',
      dueDate: task.dueDate || '',
      status: task.status || 'open',
      notes: task.notes || ''
    });
  };

  const contactName = (contactId) => contacts.find((contact) => String(contact.id) === String(contactId))?.fullName || 'Unassigned';

  return (
    <div className="space-y-6">
      <div className="max-w-full overflow-x-auto rounded-md border border-ink/10">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-[0.08em] text-ink/50">
            <tr>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Due date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="px-4 py-4">
                  <p className="font-medium">{task.title}</p>
                  {task.notes && <p className="mt-1 max-w-xs truncate text-xs text-ink/50">{task.notes}</p>}
                </td>
                <td className="px-4 py-4 text-ink/65">{task.taskType || 'General'}</td>
                <td className="px-4 py-4 text-ink/65">{contactName(task.contactId)}</td>
                <td className="px-4 py-4 text-ink/65">{task.dueDate || 'Not set'}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${task.status === 'done' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                    {task.status === 'done' ? 'Done' : 'Open'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => onUpdateTask({ ...task, status: task.status === 'done' ? 'open' : 'done' })} disabled={isSaving} className="rounded-md border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/65 hover:bg-paper disabled:opacity-50">
                      {task.status === 'done' ? 'Reopen' : 'Complete'}
                    </button>
                    <button onClick={() => editTask(task)} disabled={isSaving} className="rounded-md border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/65 hover:bg-paper disabled:opacity-50">Edit</button>
                    <button onClick={() => onDeleteTask(task.id)} disabled={isSaving} className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-ink/55" colSpan="6">No follow-up tasks captured yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={submit} className="rounded-md border border-ink/10 bg-paper p-4">
        <h3 className="font-semibold">{editingId ? 'Edit task' : 'Add follow-up task'}</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Field label="Task title" value={form.title} onChange={(title) => setForm({ ...form, title })} placeholder="e.g. Request signed mandate" />
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Task type</span>
            <select value={form.taskType} onChange={(event) => setForm({ ...form, taskType: event.target.value })} className="h-12 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
              <option>Mandate</option>
              <option>Trust Deed</option>
              <option>Share Register</option>
              <option>MoI</option>
              <option>Annual Return</option>
              <option>Director Change</option>
              <option>ID confirmation</option>
              <option>Client approval</option>
              <option>General</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Assigned contact</span>
            <select value={form.contactId} onChange={(event) => setForm({ ...form, contactId: event.target.value })} className="h-12 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
              <option value="">Unassigned</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>{contact.fullName}</option>
              ))}
            </select>
          </label>
          <Field type="date" label="Due date" value={form.dueDate} onChange={(dueDate) => setForm({ ...form, dueDate })} />
          <div className="lg:col-span-2">
            <Field label="Notes" value={form.notes} onChange={(notes) => setForm({ ...form, notes })} placeholder="What needs to be requested or confirmed?" />
          </div>
          <div className="flex flex-col gap-3 lg:col-span-2 sm:flex-row">
            <button disabled={!canSubmit || isSaving} className="rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white disabled:bg-ink/30">
              {isSaving ? 'Saving...' : editingId ? 'Save task' : 'Add task'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-md border border-ink/15 px-4 py-3 text-sm font-semibold">
                Cancel edit
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function ActivityPanel({ company, detail, activity }) {
  const sortedActivity = [...activity].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const exportAuditCsv = () => {
    downloadTextFile(`${fileSafeName(company.name)}-audit-report.csv`, buildAuditReportCsv(company, detail), 'text/csv');
  };
  const exportAuditPdf = async () => {
    const { jsPDF } = await import('jspdf');
    downloadBlob(`${fileSafeName(company.name)}-audit-report.pdf`, buildAuditReportPdf(jsPDF, company, detail));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Company activity</h3>
          <p className="mt-1 text-sm text-ink/55">Audit trail for BO records, documents, filing packs, contacts, and follow-up tasks.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportAuditPdf} className="inline-flex items-center gap-2 rounded-md border border-gold/60 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/5">
            <FileText className="h-4 w-4" /> Audit PDF
          </button>
          <button type="button" onClick={exportAuditCsv} className="rounded-md border border-gold/60 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/5">
            Audit CSV
          </button>
        </div>
      </div>
      <div className="rounded-md border border-ink/10">
        {sortedActivity.map((entry) => (
          <div key={entry.id} className="flex gap-3 border-b border-ink/10 p-4 last:border-b-0">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sage text-forest">
              <Clock className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-semibold">{activityActionLabel(entry.action)}</p>
              <p className="mt-1 break-words text-sm text-ink/60">{activityDetailLabel(entry)}</p>
              <p className="mt-2 text-xs text-ink/45">{entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-ZA') : 'Date not recorded'}</p>
            </div>
          </div>
        ))}
        {sortedActivity.length === 0 && (
          <div className="p-8 text-sm text-ink/55">
            No activity recorded yet. Updates will appear here as you maintain this company.
          </div>
        )}
      </div>
    </div>
  );
}

function activityActionLabel(action) {
  const labels = {
    company_created: 'Company created',
    company_profile_updated: 'Company profile updated',
    director_added: 'Director added',
    director_updated: 'Director updated',
    director_deleted: 'Director deleted',
    shareholder_added: 'Shareholder added',
    shareholder_updated: 'Shareholder updated',
    shareholder_deleted: 'Shareholder deleted',
    contact_added: 'Contact added',
    contact_updated: 'Contact updated',
    contact_deleted: 'Contact deleted',
    task_created: 'Follow-up task created',
    task_updated: 'Follow-up task updated',
    task_completed: 'Follow-up task completed',
    task_deleted: 'Follow-up task deleted',
    document_added: 'Document added',
    document_deleted: 'Document deleted',
    mandate_status_changed: 'Mandate status changed',
    filing_pack_generated: 'CIPC filing pack generated',
    filing_submission_updated: 'CIPC submission updated',
    annual_return_updated: 'Annual return updated',
    director_change_created: 'Director change filing created',
    director_change_updated: 'Director change filing updated',
    share_transaction_created: 'Share transaction created',
    share_transaction_updated: 'Share transaction updated',
    beneficial_owner_confirmed: 'Beneficial owner confirmed',
    beneficial_owner_removed: 'Beneficial owner removed',
    trust_review_saved: 'Trust review saved',
    trust_bo_records_created: 'Trust BO records created',
    entity_ownership_review_saved: 'Entity ownership review saved',
    entity_bo_records_created: 'Entity BO records created'
  };
  return labels[action] || action?.replaceAll('_', ' ') || 'Activity recorded';
}

function activityDetailLabel(entry) {
  const details = entry.details || {};
  if (details.summary) return details.summary;
  const parts = [details.label, details.documentType ? documentLabel(details.documentType) : '', details.taskType, details.reference ? `Ref ${details.reference}` : ''].filter(Boolean);
  return parts.length ? parts.join(' - ') : entry.subjectType || 'Record updated';
}

function ShareholderAction({ shareholder }) {
  if (shareholder.shareholderType === 'trust') {
    return <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Upload Trust Deed</span>;
  }

  if (shareholder.shareholderType === 'natural_person' && Number(shareholder.ownershipPercentage) > 5) {
    return <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Beneficial owner</span>;
  }

  if (shareholder.shareholderType === 'company' && Number(shareholder.ownershipPercentage) > 5) {
    return <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Trace ownership</span>;
  }

  return <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-ink/55">Below threshold</span>;
}

function buildOwnershipMapNodes(detail) {
  const shareholders = detail.shareholders || [];
  const beneficialOwners = detail.beneficialOwners || [];
  const trustReviews = detail.trustReviews || [];
  const entityOwnershipReviews = detail.entityOwnershipReviews || [];
  return shareholders.map((shareholder) => {
    const linkedOwners = beneficialOwners.filter((owner) => String(owner.shareholderId || '') === String(shareholder.id));
    const trustReview = trustReviews.find((review) => String(review.shareholderId || '') === String(shareholder.id));
    const entityReview = entityOwnershipReviews.find((review) => String(review.shareholderId || '') === String(shareholder.id));
    const pct = Number(shareholder.ownershipPercentage || 0);
    const naturalDirectBo = shareholder.shareholderType === 'natural_person' && pct > 5
      ? [{
          id: shareholder.id,
          fullName: shareholder.name,
          idNumber: shareholder.idNumber,
          ownershipPercentage: pct,
          controlBasis: 'Direct shareholding above 5%'
        }]
      : [];
    const reviewOwners = entityReview
      ? entityReviewOwnersToBeneficialOwners(entityReview, shareholder)
      : [];
    const trustOwners = trustReview
      ? trustReviewPeopleToOwners(trustReview).filter((owner) => Number(owner.ownershipPercentage || 0) > 5 || linkedOwners.some((linked) => linked.fullName === owner.fullName))
      : [];
    const resolvedOwners = linkedOwners.length ? linkedOwners : [...naturalDirectBo, ...reviewOwners, ...trustOwners];
    const status = resolvedOwners.length
      ? 'confirmed'
      : shareholder.shareholderType !== 'natural_person' && pct > 5 && (trustReview || entityReview)
        ? 'pendingRecords'
        : shareholder.shareholderType !== 'natural_person' && pct > 5
          ? 'review'
          : naturalDirectBo.length
            ? 'confirmed'
            : 'below';

    return {
      ...shareholder,
      beneficialOwners: resolvedOwners,
      hasTrustReview: Boolean(trustReview),
      hasEntityReview: Boolean(entityReview),
      status
    };
  });
}

function ownershipNodeStyle(node) {
  const pct = Number(node.ownershipPercentage || 0);
  if (node.status === 'confirmed') {
    return {
      fill: '#ecfdf5',
      stroke: '#a7f3d0',
      text: '#047857',
      label: node.shareholderType === 'natural_person' ? 'Beneficial owner' : 'Look-through complete'
    };
  }
  if (node.status === 'pendingRecords') {
    return {
      fill: '#eff6ff',
      stroke: '#bfdbfe',
      text: '#1d4ed8',
      label: 'Create BO filing records'
    };
  }
  if (node.shareholderType === 'trust') {
    return {
      fill: '#fffbeb',
      stroke: '#fde68a',
      text: '#b45309',
      label: pct > 5 ? 'Trust Deed required' : 'Trust review'
    };
  }
  if (node.shareholderType === 'company' && pct > 5) {
    return {
      fill: '#fffbeb',
      stroke: '#fde68a',
      text: '#b45309',
      label: 'Trace underlying owners'
    };
  }
  return {
    fill: '#ffffff',
    stroke: '#e7e2d8',
    text: '#6f7777',
    label: 'Below direct threshold'
  };
}

function buildOwnershipMermaid(company, nodes) {
  const lines = ['flowchart LR', `  C["${escapeMermaidLabel(company.name)}<br/>${escapeMermaidLabel(company.registrationNumber)}"]`];
  nodes.forEach((node, index) => {
    const nodeId = `S${index + 1}`;
    const style = ownershipNodeStyle(node);
    lines.push(`  ${nodeId}["${escapeMermaidLabel(node.name)}<br/>${Number(node.ownershipPercentage || 0)}%<br/>${escapeMermaidLabel(style.label)}"]`);
    lines.push(`  C -->|${Number(node.ownershipPercentage || 0)}%| ${nodeId}`);
    node.beneficialOwners.forEach((owner, ownerIndex) => {
      const ownerNodeId = `${nodeId}BO${ownerIndex + 1}`;
      lines.push(`  ${ownerNodeId}["${escapeMermaidLabel(owner.fullName)}<br/>${Number(owner.ownershipPercentage || owner.effectiveOwnership || 0)}% effective<br/>Confirmed BO"]`);
      lines.push(`  ${nodeId} --> ${ownerNodeId}`);
    });
  });
  return lines.join('\n');
}

function escapeMermaidLabel(value) {
  return String(value || '').replaceAll('"', "'");
}

function truncateSvgText(value, maxLength) {
  const text = String(value || '');
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text;
}

function parseShareholderBulkRows(text) {
  return text
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter((item) => item.line)
    .filter((item, index) => !(index === 0 && looksLikeShareholderHeader(item.line)))
    .map(({ line, lineNumber }) => {
      const columns = splitShareholderImportLine(line);
      const [typeRaw = '', name = '', idNumber = '', ownershipRaw = ''] = columns.map((column) => column.trim());
      const shareholderType = normaliseShareholderType(typeRaw);
      const ownershipPercentage = Number(String(ownershipRaw).replace('%', '').replace(',', '.'));
      const shareholder = {
        shareholderType,
        name,
        idNumber,
        ownershipPercentage: Number.isFinite(ownershipPercentage) ? ownershipPercentage : ''
      };

      if (!shareholderType) return { lineNumber, shareholder: { ...shareholder, shareholderType: 'natural_person' }, valid: false, error: 'Bad type' };
      if (!name) return { lineNumber, shareholder, valid: false, error: 'Missing name' };
      if (!Number.isFinite(ownershipPercentage) || ownershipPercentage < 0) return { lineNumber, shareholder, valid: false, error: 'Bad %' };
      return { lineNumber, shareholder, valid: true, error: '' };
    });
}

function trustReviewToForm(review) {
  return {
    trustees: trustPeopleToText(review?.trustees || []),
    beneficiaries: trustPeopleToText(review?.beneficiaries || []),
    founders: trustPeopleToText(review?.founders || []),
    controllers: trustPeopleToText(review?.controllers || []),
    notes: review?.notes || ''
  };
}

function trustReviewRows(review) {
  const rows = [
    ...(review?.trustees || []).map((person) => trustPersonToRow(person, 'trustee')),
    ...(review?.beneficiaries || []).map((person) => trustPersonToRow(person, 'beneficiary')),
    ...(review?.founders || []).map((person) => trustPersonToRow(person, 'founder')),
    ...(review?.controllers || []).map((person) => trustPersonToRow(person, 'controller'))
  ];
  return rows.length ? rows : [emptyTrustPersonRow()];
}

function trustPersonToRow(person, role) {
  return {
    ...emptyTrustPersonRow(),
    ...person,
    role,
    ownershipPercentage: person.ownershipPercentage ?? ''
  };
}

function emptyTrustPersonRow() {
  return {
    id: `trust-person-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: 'trustee',
    fullName: '',
    idNumber: '',
    ownershipPercentage: '',
    notes: ''
  };
}

function cleanTrustPersonRow(person) {
  return {
    role: person.role || 'trustee',
    fullName: String(person.fullName || '').trim(),
    idNumber: String(person.idNumber || '').trim(),
    ownershipPercentage: Number(person.ownershipPercentage || 0),
    notes: String(person.notes || '').trim()
  };
}

function groupTrustPeople(people) {
  return {
    trustees: people.filter((person) => person.role === 'trustee').map(stripTrustRole),
    beneficiaries: people.filter((person) => person.role === 'beneficiary').map(stripTrustRole),
    founders: people.filter((person) => person.role === 'founder').map(stripTrustRole),
    controllers: people.filter((person) => person.role === 'controller').map(stripTrustRole)
  };
}

function stripTrustRole(person) {
  const { role, ...rest } = person;
  return rest;
}

function trustPeopleToText(people) {
  return people.map((person) => [person.fullName, person.idNumber, person.ownershipPercentage, person.notes].filter((value) => value !== undefined && value !== null && value !== '').join(', ')).join('\n');
}

function parseTrustPeopleWithRole(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [roleRaw = '', fullName = '', idNumber = '', ownershipRaw = '', ...notes] = splitShareholderImportLine(line);
      const ownershipPercentage = Number(String(ownershipRaw).replace('%', '').replace(',', '.'));
      return {
        role: normaliseTrustRole(roleRaw),
        fullName: fullName.trim(),
        idNumber: idNumber.trim(),
        ownershipPercentage: Number.isFinite(ownershipPercentage) ? ownershipPercentage : 0,
        notes: notes.join(',').trim()
      };
    })
    .filter((person) => person.fullName);
}

function normaliseTrustRole(value) {
  const role = String(value || '').trim().toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
  if (['trustee', 'trustees'].includes(role)) return 'trustee';
  if (['beneficiary', 'beneficiaries'].includes(role)) return 'beneficiary';
  if (['founder', 'settlor', 'founder_settlor'].includes(role)) return 'founder';
  if (['controller', 'protector', 'protectors', 'protector_controller'].includes(role)) return 'controller';
  return 'trustee';
}

function parseTrustPeople(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [fullName = '', idNumber = '', ownershipRaw = '', ...notes] = splitShareholderImportLine(line);
      const ownershipPercentage = Number(String(ownershipRaw).replace('%', '').replace(',', '.'));
      return {
        fullName: fullName.trim(),
        idNumber: idNumber.trim(),
        ownershipPercentage: Number.isFinite(ownershipPercentage) ? ownershipPercentage : 0,
        notes: notes.join(',').trim()
      };
    })
    .filter((person) => person.fullName);
}

function trustReviewPeopleToOwners(review) {
  return [
    ...review.trustees.map((person) => trustPersonToOwner(person, review.shareholderId, 'Trustee / trust controller')),
    ...review.beneficiaries.map((person) => trustPersonToOwner(person, review.shareholderId, 'Beneficiary')),
    ...review.founders.map((person) => trustPersonToOwner(person, review.shareholderId, 'Founder / settlor')),
    ...review.controllers.map((person) => trustPersonToOwner(person, review.shareholderId, 'Trustee / trust controller'))
  ];
}

function trustPersonToOwner(person, shareholderId, controlBasis) {
  return {
    shareholderId,
    fullName: person.fullName,
    idNumber: person.idNumber || '',
    ownershipPercentage: Number(person.ownershipPercentage || 0),
    controlBasis,
    notes: person.notes || 'Created from Trust Deed review'
  };
}

function entityOwnershipReviewToForm(review) {
  return {
    notes: review?.notes || ''
  };
}

function entityOwnershipReviewRows(review) {
  const owners = review?.owners?.length ? review.owners : [emptyEntityOwnerRow()];
  return owners.map((owner, index) => ({
    ...emptyEntityOwnerRow(),
    id: owner.id || `entity-owner-${index}-${Date.now()}`,
    ...owner,
    ownershipPercentage: owner.ownershipPercentage ?? ''
  }));
}

function emptyEntityOwnerRow() {
  return {
    id: `entity-owner-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ownerType: 'natural_person',
    fullName: '',
    idNumber: '',
    ownershipPercentage: '',
    notes: ''
  };
}

function cleanEntityOwnerRow(owner) {
  return {
    ownerType: owner.ownerType || 'natural_person',
    fullName: String(owner.fullName || '').trim(),
    idNumber: String(owner.idNumber || '').trim(),
    ownershipPercentage: Number(owner.ownershipPercentage || 0),
    notes: String(owner.notes || '').trim()
  };
}

function entityOwnersToText(owners) {
  return owners.map((owner) => [owner.ownerType || 'natural_person', owner.fullName, owner.idNumber, owner.ownershipPercentage, owner.notes].filter((value) => value !== undefined && value !== null && value !== '').join(', ')).join('\n');
}

function parseEntityOwners(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [typeRaw = '', fullName = '', idNumber = '', ownershipRaw = '', ...notes] = splitShareholderImportLine(line);
      const ownerType = normaliseShareholderType(typeRaw) || 'natural_person';
      const ownershipPercentage = Number(String(ownershipRaw).replace('%', '').replace(',', '.'));
      return {
        ownerType,
        fullName: fullName.trim(),
        idNumber: idNumber.trim(),
        ownershipPercentage: Number.isFinite(ownershipPercentage) ? ownershipPercentage : 0,
        notes: notes.join(',').trim()
      };
    })
    .filter((owner) => owner.fullName);
}

function calculateEffectiveOwnership(parentPercentage, childPercentage) {
  return Number(((Number(parentPercentage || 0) * Number(childPercentage || 0)) / 100).toFixed(4));
}

function entityOwnerAction(owner) {
  if (owner.ownerType === 'natural_person' && owner.effectiveOwnership > 5) return 'Confirm BO';
  if (owner.ownerType === 'company' && owner.effectiveOwnership > 5) return 'Continue tracing';
  if (owner.ownerType === 'trust' && owner.effectiveOwnership > 5) return 'Trust Deed review';
  return 'Below threshold';
}

function entityReviewOwnersToBeneficialOwners(review, shareholder) {
  return review.owners
    .map((owner) => ({
      ...owner,
      effectiveOwnership: calculateEffectiveOwnership(shareholder.ownershipPercentage, owner.ownershipPercentage)
    }))
    .filter((owner) => owner.ownerType === 'natural_person' && owner.effectiveOwnership > 5)
    .map((owner) => ({
      shareholderId: shareholder.id,
      fullName: owner.fullName,
      idNumber: owner.idNumber || '',
      ownershipPercentage: owner.effectiveOwnership,
      controlBasis: 'Indirect ownership',
      notes: owner.notes || `Indirect via ${shareholder.name}: ${shareholder.ownershipPercentage}% x ${owner.ownershipPercentage}%`
    }));
}

function buildBoRegisterRows(shareholders, beneficialOwners = [], trustReviews = [], entityOwnershipReviews = []) {
  return shareholders.map((shareholder) => {
    const pct = Number(shareholder.ownershipPercentage || 0);
    const linkedBeneficialOwners = beneficialOwners.filter((owner) => String(owner.shareholderId || '') === String(shareholder.id));
    const linkedBoCount = linkedBeneficialOwners.length;
    const trustReview = trustReviews.find((review) => String(review.shareholderId || '') === String(shareholder.id));
    const entityReview = entityOwnershipReviews.find((review) => String(review.shareholderId || '') === String(shareholder.id));
    const base = {
      id: shareholder.id,
      shareholderId: shareholder.id,
      name: shareholder.name,
      typeLabel: shareholderTypeLabel(shareholder.shareholderType),
      idNumber: shareholder.idNumber || '',
      ownershipPercentage: pct
    };

    if (shareholder.shareholderType === 'natural_person' && pct > 5) {
      return {
        ...base,
        status: 'confirmed',
        statusLabel: 'Confirmed BO',
        action: shareholder.idNumber ? 'Ready for BO register' : 'Capture ID number before filing'
      };
    }

    if (shareholder.shareholderType === 'trust' && pct > 5) {
      if (linkedBoCount > 0) {
        return {
          ...base,
          status: 'resolved',
          statusLabel: 'Trust review complete',
          action: `${linkedBoCount} BO filing record${linkedBoCount === 1 ? '' : 's'} created from Trust Deed review`
        };
      }

      if (trustReview) {
        return {
          ...base,
          status: 'review',
          statusLabel: 'Trust review captured',
          action: 'Create BO filing records from the captured trust persons'
        };
      }

      return {
        ...base,
        status: 'review',
        statusLabel: 'Trust review',
        action: 'Upload/review Trust Deed to identify trustees, beneficiaries and controllers'
      };
    }

    if (shareholder.shareholderType === 'company' && pct > 5) {
      if (linkedBoCount > 0) {
        return {
          ...base,
          status: 'resolved',
          statusLabel: 'Look-through complete',
          action: `${linkedBoCount} BO filing record${linkedBoCount === 1 ? '' : 's'} created from entity look-through`
        };
      }

      if (entityReview) {
        return {
          ...base,
          status: 'review',
          statusLabel: 'Look-through captured',
          action: 'Create BO filing records from the captured entity owners'
        };
      }

      return {
        ...base,
        status: 'review',
        statusLabel: 'Trace ownership',
        action: 'Trace through entity shareholders to natural persons'
      };
    }

    return {
      ...base,
      status: 'below',
      statusLabel: 'Below threshold',
      action: 'No direct BO finding from this holding'
    };
  });
}

function csvValue(value) {
  const text = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadRowsCsv(filename, rows) {
  const headers = Array.from(rows.reduce((set, row) => {
    Object.keys(row || {}).forEach((key) => set.add(key));
    return set;
  }, new Set()));
  const csv = [
    headers,
    ...rows.map((row) => headers.map((header) => row?.[header]))
  ].map((row) => row.map(csvValue).join(',')).join('\n');
  downloadTextFile(filename, csv, 'text/csv');
}

function downloadTableCsv(filename, rows, columns) {
  const headers = columns.map(([header]) => header);
  const csv = [
    headers,
    ...rows.map((row) => columns.map(([, key]) => row?.[key]))
  ].map((row) => row.map(csvValue).join(',')).join('\n');
  downloadTextFile(filename, csv, 'text/csv');
}

function downloadCachedPracticeData(baseName, stamp, companies, companyDetails) {
  const detailRows = (key, mapper) => companies.flatMap((company) => {
    const detail = companyDetails[company.id] || createEmptyCompanyDetail();
    return (detail[key] || []).map((item) => mapper(company, item));
  });

  downloadRowsCsv(`${baseName}-${stamp}-directors.csv`, detailRows('directors', (company, director) => ({ company_id: company.id, company_name: company.name, ...director })));
  downloadRowsCsv(`${baseName}-${stamp}-shareholders.csv`, detailRows('shareholders', (company, shareholder) => ({ company_id: company.id, company_name: company.name, ...shareholder })));
  downloadRowsCsv(`${baseName}-${stamp}-beneficial-owners.csv`, detailRows('beneficialOwners', (company, owner) => ({ company_id: company.id, company_name: company.name, ...owner })));
  downloadRowsCsv(`${baseName}-${stamp}-trust-reviews.csv`, detailRows('trustReviews', (company, review) => ({ company_id: company.id, company_name: company.name, ...review })));
  downloadRowsCsv(`${baseName}-${stamp}-entity-ownership-reviews.csv`, detailRows('entityOwnershipReviews', (company, review) => ({ company_id: company.id, company_name: company.name, ...review })));
  downloadRowsCsv(`${baseName}-${stamp}-contacts.csv`, detailRows('contacts', (company, contact) => ({ company_id: company.id, company_name: company.name, ...contact })));
  downloadRowsCsv(`${baseName}-${stamp}-tasks.csv`, detailRows('tasks', (company, task) => ({ company_id: company.id, company_name: company.name, ...task })));
  downloadRowsCsv(`${baseName}-${stamp}-documents.csv`, detailRows('documents', (company, document) => ({ company_id: company.id, company_name: company.name, ...document })));
  downloadRowsCsv(`${baseName}-${stamp}-filing-packs.csv`, detailRows('filingPacks', (company, pack) => ({ company_id: company.id, company_name: company.name, ...pack })));
  downloadRowsCsv(`${baseName}-${stamp}-director-changes.csv`, detailRows('directorChanges', (company, change) => ({ company_id: company.id, company_name: company.name, ...change })));
  downloadRowsCsv(`${baseName}-${stamp}-share-transactions.csv`, detailRows('shareTransactions', (company, transaction) => ({ company_id: company.id, company_name: company.name, ...transaction })));
  downloadRowsCsv(`${baseName}-${stamp}-activity-log.csv`, detailRows('activity', (company, entry) => ({ company_id: company.id, company_name: company.name, ...entry })));
}

function splitShareholderImportLine(line) {
  if (line.includes('\t')) return line.split('\t');
  return line.split(',').map((part) => part.replace(/^"|"$/g, ''));
}

function looksLikeShareholderHeader(line) {
  const lower = line.toLowerCase();
  return lower.includes('name') && (lower.includes('ownership') || lower.includes('%'));
}

function normaliseShareholderType(value) {
  const type = String(value || '').trim().toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
  if (['natural_person', 'person', 'individual', 'natural'].includes(type)) return 'natural_person';
  if (['company', 'entity', 'pty_ltd', 'pty', 'private_company'].includes(type)) return 'company';
  if (['trust', 'family_trust'].includes(type)) return 'trust';
  return '';
}


function assessBeneficialOwnership(shareholders, beneficialOwners = [], trustReviews = [], entityOwnershipReviews = []) {
  const items = shareholders.map((shareholder) => {
    const pct = Number(shareholder.ownershipPercentage || 0);
    const linkedBoCount = beneficialOwners.filter((owner) => String(owner.shareholderId || '') === String(shareholder.id)).length;
    const hasTrustReview = trustReviews.some((review) => String(review.shareholderId || '') === String(shareholder.id));
    const hasEntityReview = entityOwnershipReviews.some((review) => String(review.shareholderId || '') === String(shareholder.id));
    if (shareholder.shareholderType === 'trust') {
      if (linkedBoCount > 0) {
        return {
          id: shareholder.id,
          title: `${shareholder.name}: Trust review complete`,
          detail: `${linkedBoCount} filing record${linkedBoCount === 1 ? '' : 's'} created from the Trust Deed review.`,
          tone: 'border-emerald-200 bg-emerald-50 text-emerald-900'
        };
      }
      return {
        id: shareholder.id,
        title: `${shareholder.name}: ${hasTrustReview ? 'Trust review captured' : 'Trust review required'}`,
        detail: hasTrustReview ? 'Create BO filing records from the captured trust persons.' : 'A trust shareholder requires a Trust Deed upload to identify trustees, beneficiaries, and any natural persons with control.',
        tone: 'border-amber-200 bg-amber-50 text-amber-900'
      };
    }
    if (shareholder.shareholderType === 'natural_person' && pct > 5) {
      return {
        id: shareholder.id,
        title: `${shareholder.name}: Beneficial owner`,
        detail: `Natural person owns ${pct}%, which exceeds the South African BO threshold of more than 5%.`,
        tone: 'border-emerald-200 bg-emerald-50 text-emerald-900'
      };
    }
    if (shareholder.shareholderType === 'company' && pct > 5) {
      if (linkedBoCount > 0) {
        return {
          id: shareholder.id,
          title: `${shareholder.name}: Look-through complete`,
          detail: `${linkedBoCount} filing record${linkedBoCount === 1 ? '' : 's'} created from entity look-through.`,
          tone: 'border-emerald-200 bg-emerald-50 text-emerald-900'
        };
      }
      return {
        id: shareholder.id,
        title: `${shareholder.name}: ${hasEntityReview ? 'Look-through captured' : 'Underlying ownership needed'}`,
        detail: hasEntityReview ? 'Create BO filing records from the captured entity owners.' : `Company shareholder owns ${pct}%. Trace through to natural persons before CIPC filing.`,
        tone: 'border-amber-200 bg-amber-50 text-amber-900'
      };
    }
    return {
      id: shareholder.id,
      title: `${shareholder.name}: Below direct threshold`,
      detail: `${pct}% direct ownership does not exceed the >5% BO threshold on its own.`,
      tone: 'border-ink/10 bg-white text-ink/65'
    };
  });
  return { items };
}

function getReadinessChecklist(detail) {
  const hasDirectors = detail.directors.length > 0;
  const hasShareholders = detail.shareholders.length > 0;
  const confirmedBeneficialOwners = getFilingBeneficialOwners(detail);
  const hasBeneficialOwner = confirmedBeneficialOwners.length > 0;
  const trustDetected = hasTrustShareholder(detail);
  const trustDeedReady = !trustDetected || hasDocument(detail, 'trust_deed');
  const shareRegisterReady = hasDocument(detail, 'share_register');
  const mandateReady = detail.mandatePrepared;
  const ownershipTotal = detail.shareholders.reduce((sum, shareholder) => sum + Number(shareholder.ownershipPercentage || 0), 0);
  const ownershipBalanced = hasShareholders && Math.abs(ownershipTotal - 100) < 0.01;

  const items = [
    {
      key: 'directors',
      label: 'Directors captured',
      detail: hasDirectors ? `${detail.directors.length} director record${detail.directors.length === 1 ? '' : 's'} captured.` : 'Add at least one director.',
      complete: hasDirectors
    },
    {
      key: 'shareholders',
      label: 'Shareholders captured',
      detail: hasShareholders ? `${detail.shareholders.length} shareholder record${detail.shareholders.length === 1 ? '' : 's'} captured.` : 'Add shareholders from the share register.',
      complete: hasShareholders
    },
    {
      key: 'ownership-total',
      label: 'Ownership percentages total 100%',
      detail: hasShareholders ? `Current total is ${ownershipTotal}%.` : 'Ownership cannot be checked until shareholders are captured.',
      complete: ownershipBalanced
    },
    {
      key: 'beneficial-owners',
      label: 'Beneficial owners identified',
      detail: hasBeneficialOwner ? `${confirmedBeneficialOwners.length} confirmed BO filing record${confirmedBeneficialOwners.length === 1 ? '' : 's'} captured.` : 'No confirmed natural-person BO filing record has been captured yet.',
      complete: hasBeneficialOwner
    },
    {
      key: 'trust-deed',
      label: 'Trust Deed resolved',
      detail: trustDetected ? 'A trust shareholder exists, so the Trust Deed must be uploaded or reviewed.' : 'No trust shareholder detected.',
      complete: trustDeedReady
    },
    {
      key: 'share-register',
      label: 'Share Register uploaded',
      detail: shareRegisterReady ? 'Share Register is marked as available.' : 'Upload or mark the Share Register as received.',
      complete: shareRegisterReady
    },
    {
      key: 'mandate',
      label: 'Mandate to File prepared',
      detail: mandateReady ? 'Mandate to File is ready for signature/filing.' : 'Prepare the mandate before CIPC filing.',
      complete: mandateReady
    }
  ];

  const completeCount = items.filter((item) => item.complete).length;
  const status = completeCount === items.length ? 'Compliant' : completeCount >= items.length - 2 ? 'Due Soon' : 'Action Required';
  const summary =
    status === 'Compliant'
      ? 'All required filing readiness checks are complete.'
      : status === 'Due Soon'
        ? 'Most readiness checks are complete. Resolve the remaining items before filing.'
        : 'Core information is still missing before a CIPC Filing Pack can be prepared.';

  return { items, status, summary };
}

function getComplianceValidation(company, detail) {
  const critical = [];
  const warning = [];
  const info = [];
  const ownershipTotal = detail.shareholders.reduce((sum, shareholder) => sum + Number(shareholder.ownershipPercentage || 0), 0);

  if (!isValidCompanyRegistrationNumber(company.registrationNumber)) {
    critical.push({
      key: 'company-registration-format',
      title: 'Company registration number format',
      detail: 'Expected South African format like 2020/123456/07.'
    });
  }

  if (detail.shareholders.length > 0 && Math.abs(ownershipTotal - 100) >= 0.01) {
    critical.push({
      key: 'ownership-total',
      title: 'Ownership does not total 100%',
      detail: `Current shareholder total is ${ownershipTotal}%. Reconcile before filing.`
    });
  }

  (detail.shareTransactions || [])
    .filter((transaction) => transaction.status !== 'accepted' && transaction.status !== 'rejected')
    .forEach((transaction) => {
      const transactionValidation = validateShareTransaction(transaction, detail.shareholders || []);
      if (!transactionValidation.canAccept) {
        warning.push({
          key: `share-transaction-${transaction.id}`,
          title: 'Share transaction cannot be accepted',
          detail: `${shareTransactionTypeLabel(transaction.transactionType)} dated ${transaction.transactionDate || 'date not set'}: ${transactionValidation.errors.join(' ')}`
        });
      }
      if (!transaction.supportingDocsReceived) {
        warning.push({
          key: `share-transaction-docs-${transaction.id}`,
          title: 'Share transaction documents missing',
          detail: `${shareTransactionTypeLabel(transaction.transactionType)} requires signed supporting documents before the register is updated.`
        });
      }
    });

  findDuplicateRecords(detail.shareholders, 'shareholder').forEach((item) => warning.push(item));
  findDuplicateRecords(detail.beneficialOwners || [], 'beneficial owner', 'fullName').forEach((item) => warning.push(item));

  detail.directors.forEach((director) => {
    if (director.idNumber && looksLikeSaId(director.idNumber) && !isValidSaIdNumber(director.idNumber)) {
      warning.push({
        key: `director-id-${director.id}`,
        title: 'Director SA ID may be invalid',
        detail: `${director.fullName} has an ID number that does not pass the checksum.`
      });
    }
  });

  detail.shareholders.forEach((shareholder) => {
    const pct = Number(shareholder.ownershipPercentage || 0);
    if (shareholder.shareholderType === 'natural_person' && pct > 5 && !shareholder.idNumber) {
      critical.push({
        key: `shareholder-id-missing-${shareholder.id}`,
        title: 'Beneficial owner ID missing',
        detail: `${shareholder.name} is above 5% but has no ID/passport number captured.`
      });
    }
    if (shareholder.shareholderType === 'natural_person' && shareholder.idNumber && looksLikeSaId(shareholder.idNumber) && !isValidSaIdNumber(shareholder.idNumber)) {
      warning.push({
        key: `shareholder-id-invalid-${shareholder.id}`,
        title: 'Shareholder SA ID may be invalid',
        detail: `${shareholder.name} has an ID number that does not pass the checksum.`
      });
    }
    if (shareholder.shareholderType === 'trust' && pct > 5) {
      const hasTrustReview = (detail.trustReviews || []).some((review) => String(review.shareholderId) === String(shareholder.id));
      if (!hasTrustReview) {
        critical.push({
          key: `trust-review-${shareholder.id}`,
          title: 'Trust review missing',
          detail: `${shareholder.name} is above 5%. Capture trustees, beneficiaries, founders and controllers from the Trust Deed.`
        });
      }
    }
    if (shareholder.shareholderType === 'company' && pct > 5) {
      const hasEntityReview = (detail.entityOwnershipReviews || []).some((review) => String(review.shareholderId) === String(shareholder.id));
      if (!hasEntityReview) {
        critical.push({
          key: `entity-lookthrough-${shareholder.id}`,
          title: 'Entity look-through missing',
          detail: `${shareholder.name} is above 5%. Trace ownership through to natural persons before filing.`
        });
      }
    }
  });

  (detail.beneficialOwners || []).forEach((owner) => {
    if (!owner.idNumber) {
      critical.push({
        key: `bo-id-${owner.id}`,
        title: 'Confirmed BO ID missing',
        detail: `${owner.fullName} is in the filing register without an ID/passport number.`
      });
    }
    if (owner.idNumber && looksLikeSaId(owner.idNumber) && !isValidSaIdNumber(owner.idNumber)) {
      warning.push({
        key: `bo-id-invalid-${owner.id}`,
        title: 'Confirmed BO SA ID may be invalid',
        detail: `${owner.fullName} has an ID number that does not pass the checksum.`
      });
    }
    if (!owner.controlBasis) {
      critical.push({
        key: `bo-control-${owner.id}`,
        title: 'Control basis missing',
        detail: `${owner.fullName} needs a control basis before filing.`
      });
    }
    if (!owner.shareholderId && !owner.notes) {
      warning.push({
        key: `manual-bo-notes-${owner.id}`,
        title: 'Manual BO needs notes',
        detail: `${owner.fullName} was added manually. Add notes explaining the filing judgement.`
      });
    }
  });

  (detail.filingPacks || []).forEach((pack) => {
    if (['submitted', 'accepted'].includes(pack.submissionStatus) && critical.length > 0) {
      warning.push({
        key: `submitted-with-issues-${pack.id}`,
        title: 'Submitted pack has current validation issues',
        detail: 'This company has a pack marked submitted/accepted while current validation still has critical issues.'
      });
    }
    if (['submitted', 'accepted'].includes(pack.submissionStatus) && !pack.cipcReference) {
      info.push({
        key: `submission-ref-${pack.id}`,
        title: 'CIPC reference not captured',
        detail: 'Add the CIPC reference number to complete the submission trail.'
      });
    }
  });

  return {
    critical,
    warning,
    info,
    criticalCount: critical.length,
    warningCount: warning.length,
    infoCount: info.length
  };
}

function isValidCompanyRegistrationNumber(value) {
  return /^\d{4}\/\d{6}\/\d{2}$/.test(String(value || '').trim());
}

function normalizeCompanyRegistrationNumber(value) {
  const trimmed = String(value || '').trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 12) {
    return `${digits.slice(0, 4)}/${digits.slice(4, 10)}/${digits.slice(10, 12)}`;
  }
  return trimmed.replace(/\\/g, '/');
}

function buildInitialImportTasks(company) {
  return [
    {
      id: `task-share-register-${company.id}`,
      title: 'Upload share register',
      taskType: 'Share Register',
      dueDate: addDays(new Date(), 7).toISOString().slice(0, 10),
      status: 'open',
      notes: 'Upload or record the latest securities register before BO assessment.'
    },
    {
      id: `task-directors-${company.id}`,
      title: 'Confirm directors',
      taskType: 'Directors',
      dueDate: addDays(new Date(), 10).toISOString().slice(0, 10),
      status: 'open',
      notes: 'Confirm current directors against CIPC records and mandate signatories.'
    },
    {
      id: `task-bo-register-${company.id}`,
      title: 'Prepare BO register',
      taskType: 'BO Register',
      dueDate: addDays(new Date(), 14).toISOString().slice(0, 10),
      status: 'open',
      notes: 'Capture shareholders and identify natural persons with ownership or control above 5%.'
    },
    {
      id: `task-mandate-${company.id}`,
      title: 'Prepare Mandate to File',
      taskType: 'Mandate',
      dueDate: addDays(new Date(), 21).toISOString().slice(0, 10),
      status: 'open',
      notes: 'Prepare mandate before CIPC filing pack submission.'
    },
    {
      id: `task-annual-return-${company.id}`,
      title: 'Confirm annual return date',
      taskType: 'Annual Return',
      dueDate: company.nextDueDateRaw || calculateNextAnnualReturnDue(company.incorporationDate) || addDays(new Date(), 30).toISOString().slice(0, 10),
      status: 'open',
      notes: 'Confirm annual return anniversary date and upcoming compliance deadline.'
    }
  ];
}

function parseBulkCompanyRows(text, existingCompanies) {
  const rawRows = parseDelimitedText(text);
  if (!rawRows.length) return [];
  const firstRow = rawRows[0].map((cell) => normalizeHeader(cell));
  const hasHeader = firstRow.some((header) => ['company_name', 'name', 'registration_number', 'reg_number', 'incorporation_date'].includes(header));
  const headers = hasHeader ? firstRow : ['company_name', 'registration_number', 'company_type', 'incorporation_date', 'registered_address'];
  const dataRows = hasHeader ? rawRows.slice(1) : rawRows;
  const existingRegistrations = new Set(existingCompanies.map((company) => normalizeCompanyRegistrationNumber(company.registrationNumber).toLowerCase()).filter(Boolean));
  const seenRegistrations = new Set();

  return dataRows
    .filter((row) => row.some((cell) => String(cell || '').trim()))
    .map((row, index) => {
      const rowObject = headers.reduce((result, header, columnIndex) => {
        result[header] = String(row[columnIndex] || '').trim();
        return result;
      }, {});
      const company = {
        name: valueByHeader(rowObject, ['company_name', 'company', 'name', 'client_name']),
        registrationNumber: normalizeCompanyRegistrationNumber(valueByHeader(rowObject, ['registration_number', 'reg_number', 'company_registration_number', 'registration'])),
        type: valueByHeader(rowObject, ['company_type', 'type', 'entity_type']) || 'Pty Ltd',
        incorporationDate: normalizeImportDate(valueByHeader(rowObject, ['incorporation_date', 'registration_date', 'incorporated', 'date'])),
        registeredAddress: valueByHeader(rowObject, ['registered_address', 'address', 'registered_office', 'office_address'])
      };
      const errors = [];
      const warnings = [];
      const normalizedRegistration = company.registrationNumber.toLowerCase();

      if (!company.name.trim()) errors.push('Company name missing');
      if (!company.registrationNumber.trim()) {
        errors.push('Registration number missing');
      } else if (!isValidCompanyRegistrationNumber(company.registrationNumber)) {
        errors.push('Expected SA format 2020/123456/07');
      }
      if (normalizedRegistration && existingRegistrations.has(normalizedRegistration)) errors.push('Already exists in workspace');
      if (normalizedRegistration && seenRegistrations.has(normalizedRegistration)) errors.push('Duplicate in import file');
      if (!company.incorporationDate) warnings.push('Incorporation date missing');
      if (!company.registeredAddress) warnings.push('Registered office missing');
      if (normalizedRegistration) seenRegistrations.add(normalizedRegistration);

      return {
        lineNumber: index + (hasHeader ? 2 : 1),
        company,
        errors,
        warnings,
        duplicate: errors.some((error) => error.toLowerCase().includes('duplicate') || error.toLowerCase().includes('already exists')),
        valid: errors.length === 0
      };
    });
}

function parseDelimitedText(text) {
  const source = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!source) return [];
  const delimiter = source.includes('\t') ? '\t' : source.includes(';') && !source.includes(',') ? ';' : ',';
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '"' && next === '"' && inQuotes) {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if (char === '\n' && !inQuotes) {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  rows.push(row);
  return rows;
}

function normalizeHeader(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function valueByHeader(rowObject, aliases) {
  for (const alias of aliases) {
    const normalized = normalizeHeader(alias);
    if (rowObject[normalized]) return rowObject[normalized];
  }
  return '';
}

function normalizeImportDate(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const slashMatch = trimmed.match(/^(\d{4})[\/](\d{1,2})[\/](\d{1,2})$/);
  if (slashMatch) {
    return `${slashMatch[1]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[3].padStart(2, '0')}`;
  }
  const southAfricanMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (southAfricanMatch) {
    return `${southAfricanMatch[3]}-${southAfricanMatch[2].padStart(2, '0')}-${southAfricanMatch[1].padStart(2, '0')}`;
  }
  return '';
}

function parsePracticeRestoreRows(text, companies) {
  const rawRows = parseDelimitedText(text);
  if (rawRows.length < 2) return { type: '', rows: [] };
  const headers = rawRows[0].map((cell) => normalizeHeader(cell));
  const dataRows = rawRows.slice(1).filter((row) => row.some((cell) => String(cell || '').trim()));
  const type = detectRestoreType(headers);
  const existingRegistrations = new Set(companies.map((company) => normalizeCompanyRegistrationNumber(company.registrationNumber).toLowerCase()).filter(Boolean));

  if (!type) {
    return {
      type: '',
      rows: dataRows.map((row, index) => ({
        lineNumber: index + 2,
        label: row[0] || `Row ${index + 2}`,
        companyLabel: '',
        errors: ['Unsupported CSV. Upload a SecretarialDesk export file.'],
        valid: false
      }))
    };
  }

  return {
    type,
    rows: dataRows.map((row, index) => {
      const rowObject = headers.reduce((result, header, columnIndex) => {
        result[header] = String(row[columnIndex] || '').trim();
        return result;
      }, {});

      if (type === 'companies') {
        const company = {
          name: valueByHeader(rowObject, ['name', 'company_name']),
          registrationNumber: normalizeCompanyRegistrationNumber(valueByHeader(rowObject, ['registration_number', 'registrationNumber'])),
          type: valueByHeader(rowObject, ['company_type', 'type']) || 'Pty Ltd',
          incorporationDate: normalizeImportDate(valueByHeader(rowObject, ['incorporation_date'])),
          registeredAddress: valueByHeader(rowObject, ['registered_address'])
        };
        const errors = [];
        const normalizedRegistration = company.registrationNumber.toLowerCase();
        if (!company.name) errors.push('Company name missing');
        if (!company.registrationNumber) errors.push('Registration number missing');
        if (company.registrationNumber && !isValidCompanyRegistrationNumber(company.registrationNumber)) errors.push('Invalid SA registration number');
        if (normalizedRegistration && existingRegistrations.has(normalizedRegistration)) errors.push('Company already exists in this practice');
        return {
          lineNumber: index + 2,
          company,
          label: company.name || `Company row ${index + 2}`,
          companyLabel: company.registrationNumber,
          errors,
          valid: errors.length === 0
        };
      }

      const config = restoreDataTypeConfig(type);
      const company = findRestoreCompany(rowObject, companies);
      const payload = config.payload(rowObject, company);
      const errors = [];
      if (!company) errors.push('Linked company not found in current practice');
      config.validate(payload, errors);
      return {
        lineNumber: index + 2,
        payload,
        label: config.previewLabel(payload) || `${config.label} row ${index + 2}`,
        companyLabel: company?.name || restoreCompanyLabel(rowObject),
        errors,
        valid: errors.length === 0
      };
    })
  };
}

function detectRestoreType(headers) {
  if (headers.includes('registration_number') && (headers.includes('name') || headers.includes('company_name'))) return 'companies';
  if (headers.includes('title') && (headers.includes('task_type') || headers.includes('due_date'))) return 'tasks';
  if (headers.includes('shareholder_type') && headers.includes('ownership_percentage')) return 'shareholders';
  if (headers.includes('appointment_date') && headers.includes('full_name')) return 'directors';
  if (headers.includes('control_basis') && headers.includes('full_name')) return 'beneficialOwners';
  if (headers.includes('trustees') || headers.includes('beneficiaries') || headers.includes('founders')) return 'trustReviews';
  if (headers.includes('owners') && headers.includes('reviewed_at')) return 'entityOwnershipReviews';
  if (headers.includes('email') && headers.includes('full_name')) return 'contacts';
  if (headers.includes('document_type') && headers.includes('original_filename')) return 'documents';
  if (headers.includes('submission_status') && headers.includes('bo_register_pdf_path')) return 'filingPacks';
  if (headers.includes('change_type') && headers.includes('signed_cor39_received')) return 'directorChanges';
  if (headers.includes('transaction_type') && headers.includes('ownership_percentage') && headers.includes('share_class')) return 'shareTransactions';
  return '';
}

function restoreDataTypeConfig(type) {
  const base = {
    directors: {
      label: 'Directors',
      table: 'directors',
      detailKey: 'directors',
      select: 'id, company_id, full_name, id_number, appointment_date',
      payload: (row, company) => cleanPayload({ id: uuidOrUndefined(row.id), company_id: company?.id, full_name: valueByHeader(row, ['full_name']), id_number: valueByHeader(row, ['id_number']), appointment_date: normalizeImportDate(valueByHeader(row, ['appointment_date'])) || null }),
      validate: (payload, errors) => { if (!payload.full_name) errors.push('Director name missing'); },
      mapRow: mapDirectorRow,
      localMap: (row) => ({ companyId: row.company_id, ...mapDirectorRow(row) }),
      previewLabel: (row) => row.full_name,
      rowLabel: (row) => row.full_name
    },
    shareholders: {
      label: 'Shareholders',
      table: 'shareholders',
      detailKey: 'shareholders',
      select: 'id, company_id, shareholder_type, name, id_number, ownership_percentage',
      payload: (row, company) => cleanPayload({ id: uuidOrUndefined(row.id), company_id: company?.id, shareholder_type: normaliseShareholderType(valueByHeader(row, ['shareholder_type'])) || 'natural_person', name: valueByHeader(row, ['name']), id_number: valueByHeader(row, ['id_number']) || null, ownership_percentage: Number(valueByHeader(row, ['ownership_percentage']) || 0) }),
      validate: (payload, errors) => { if (!payload.name) errors.push('Shareholder name missing'); if (Number.isNaN(payload.ownership_percentage)) errors.push('Ownership percentage invalid'); },
      mapRow: mapShareholderRow,
      localMap: (row) => ({ companyId: row.company_id, ...mapShareholderRow(row) }),
      previewLabel: (row) => row.name,
      rowLabel: (row) => row.name
    },
    beneficialOwners: {
      label: 'Beneficial owners',
      table: 'beneficial_owners',
      detailKey: 'beneficialOwners',
      select: 'id, company_id, shareholder_id, full_name, id_number, ownership_percentage, control_basis, notes, created_at',
      payload: (row, company) => cleanPayload({ id: uuidOrUndefined(row.id), company_id: company?.id, shareholder_id: uuidOrNull(valueByHeader(row, ['shareholder_id'])), full_name: valueByHeader(row, ['full_name']), id_number: valueByHeader(row, ['id_number']) || null, ownership_percentage: Number(valueByHeader(row, ['ownership_percentage']) || 0), control_basis: valueByHeader(row, ['control_basis']) || null, notes: valueByHeader(row, ['notes']) || null }),
      validate: (payload, errors) => { if (!payload.full_name) errors.push('BO name missing'); },
      mapRow: mapBeneficialOwnerRow,
      localMap: (row) => ({ companyId: row.company_id, ...mapBeneficialOwnerRow(row) }),
      previewLabel: (row) => row.full_name,
      rowLabel: (row) => row.full_name
    },
    trustReviews: {
      label: 'Trust reviews',
      table: 'trust_reviews',
      detailKey: 'trustReviews',
      select: 'id, company_id, shareholder_id, trustees, beneficiaries, founders, controllers, notes, reviewed_at, created_at',
      payload: (row, company) => cleanPayload({ id: uuidOrUndefined(row.id), company_id: company?.id, shareholder_id: uuidOrNull(valueByHeader(row, ['shareholder_id'])), trustees: parseJsonCell(valueByHeader(row, ['trustees']), []), beneficiaries: parseJsonCell(valueByHeader(row, ['beneficiaries']), []), founders: parseJsonCell(valueByHeader(row, ['founders']), []), controllers: parseJsonCell(valueByHeader(row, ['controllers']), []), notes: valueByHeader(row, ['notes']) || null }),
      validate: () => {},
      mapRow: mapTrustReviewRow,
      localMap: (row) => ({ companyId: row.company_id, ...mapTrustReviewRow(row) }),
      previewLabel: () => 'Trust review',
      rowLabel: () => 'Trust review'
    },
    entityOwnershipReviews: {
      label: 'Entity ownership reviews',
      table: 'entity_ownership_reviews',
      detailKey: 'entityOwnershipReviews',
      select: 'id, company_id, shareholder_id, owners, notes, reviewed_at, created_at',
      payload: (row, company) => cleanPayload({ id: uuidOrUndefined(row.id), company_id: company?.id, shareholder_id: uuidOrNull(valueByHeader(row, ['shareholder_id'])), owners: parseJsonCell(valueByHeader(row, ['owners']), []), notes: valueByHeader(row, ['notes']) || null }),
      validate: () => {},
      mapRow: mapEntityOwnershipReviewRow,
      localMap: (row) => ({ companyId: row.company_id, ...mapEntityOwnershipReviewRow(row) }),
      previewLabel: () => 'Entity look-through review',
      rowLabel: () => 'Entity look-through review'
    },
    contacts: {
      label: 'Contacts',
      table: 'company_contacts',
      detailKey: 'contacts',
      select: 'id, company_id, full_name, role, email, phone, notes',
      payload: (row, company) => cleanPayload({ id: uuidOrUndefined(row.id), company_id: company?.id, full_name: valueByHeader(row, ['full_name']), role: valueByHeader(row, ['role']) || null, email: valueByHeader(row, ['email']) || null, phone: valueByHeader(row, ['phone']) || null, notes: valueByHeader(row, ['notes']) || null }),
      validate: (payload, errors) => { if (!payload.full_name) errors.push('Contact name missing'); },
      mapRow: mapContactRow,
      localMap: (row) => ({ companyId: row.company_id, ...mapContactRow(row) }),
      previewLabel: (row) => row.full_name,
      rowLabel: (row) => row.full_name
    },
    tasks: {
      label: 'Follow-up tasks',
      table: 'follow_up_tasks',
      detailKey: 'tasks',
      select: 'id, company_id, contact_id, title, task_type, due_date, status, notes',
      payload: (row, company) => cleanPayload({ id: uuidOrUndefined(row.id), company_id: company?.id, contact_id: uuidOrNull(valueByHeader(row, ['contact_id'])), title: valueByHeader(row, ['title']), task_type: valueByHeader(row, ['task_type']) || null, due_date: normalizeImportDate(valueByHeader(row, ['due_date'])) || null, status: valueByHeader(row, ['status']) || 'open', notes: valueByHeader(row, ['notes']) || null }),
      validate: (payload, errors) => { if (!payload.title) errors.push('Task title missing'); if (!['open', 'done'].includes(payload.status)) errors.push('Unsupported task status'); },
      mapRow: mapTaskRow,
      localMap: (row) => ({ companyId: row.company_id, ...mapTaskRow(row) }),
      previewLabel: (row) => row.title,
      rowLabel: (row) => row.title
    },
    documents: {
      label: 'Documents',
      table: 'documents',
      detailKey: 'documents',
      select: 'id, company_id, document_type, original_filename, file_path, status',
      payload: (row, company) => cleanPayload({ id: uuidOrUndefined(row.id), company_id: company?.id, document_type: valueByHeader(row, ['document_type']), original_filename: valueByHeader(row, ['original_filename']) || null, file_path: valueByHeader(row, ['file_path']) || null, status: valueByHeader(row, ['status']) || 'complete' }),
      validate: (payload, errors) => { if (!payload.document_type) errors.push('Document type missing'); },
      mapRow: mapDocumentRow,
      localMap: (row) => ({ companyId: row.company_id, ...mapDocumentRow(row) }),
      previewLabel: (row) => row.original_filename || row.document_type,
      rowLabel: (row) => row.original_filename || row.document_type
    },
    filingPacks: {
      label: 'Filing packs',
      table: 'filing_packs',
      detailKey: 'filingPacks',
      select: 'id, company_id, bo_register_pdf_path, bo_register_csv_path, mandate_pdf_path, submission_status, submitted_at, cipc_reference, submission_notes, generated_at',
      payload: (row, company) => cleanPayload({ id: uuidOrUndefined(row.id), company_id: company?.id, bo_register_pdf_path: valueByHeader(row, ['bo_register_pdf_path']) || null, bo_register_csv_path: valueByHeader(row, ['bo_register_csv_path']) || null, mandate_pdf_path: valueByHeader(row, ['mandate_pdf_path']) || null, submission_status: valueByHeader(row, ['submission_status']) || 'not_submitted', submitted_at: normalizeImportDate(valueByHeader(row, ['submitted_at'])) || null, cipc_reference: valueByHeader(row, ['cipc_reference']) || null, submission_notes: valueByHeader(row, ['submission_notes']) || null }),
      validate: () => {},
      mapRow: mapFilingPackRow,
      localMap: (row) => ({ companyId: row.company_id, ...mapFilingPackRow(row) }),
      previewLabel: (row) => row.cipc_reference || row.submission_status || 'Filing pack',
      rowLabel: (row) => row.cipc_reference || row.submission_status || 'Filing pack'
    },
    directorChanges: {
      label: 'Director changes',
      table: 'director_changes',
      detailKey: 'directorChanges',
      select: 'id, company_id, change_type, existing_director_id, full_name, id_number, effective_date, board_resolution_received, signed_cor39_received, submission_status, cipc_reference, notes, accepted_at, created_at',
      payload: (row, company) => cleanPayload({ id: uuidOrUndefined(row.id), company_id: company?.id, change_type: valueByHeader(row, ['change_type']) || 'appointment', existing_director_id: uuidOrNull(valueByHeader(row, ['existing_director_id'])), full_name: valueByHeader(row, ['full_name']) || null, id_number: valueByHeader(row, ['id_number']) || null, effective_date: normalizeImportDate(valueByHeader(row, ['effective_date'])) || null, board_resolution_received: parseBool(valueByHeader(row, ['board_resolution_received'])), signed_cor39_received: parseBool(valueByHeader(row, ['signed_cor39_received'])), submission_status: valueByHeader(row, ['submission_status']) || 'draft', cipc_reference: valueByHeader(row, ['cipc_reference']) || null, notes: valueByHeader(row, ['notes']) || null, accepted_at: normalizeImportDate(valueByHeader(row, ['accepted_at'])) || null }),
      validate: () => {},
      mapRow: mapDirectorChangeRow,
      localMap: (row) => ({ companyId: row.company_id, ...mapDirectorChangeRow(row) }),
      previewLabel: (row) => row.full_name || row.change_type,
      rowLabel: (row) => row.full_name || row.change_type
    },
    shareTransactions: {
      label: 'Share transactions',
      table: 'share_transactions',
      detailKey: 'shareTransactions',
      select: 'id, company_id, transaction_type, from_shareholder_id, to_shareholder_id, to_shareholder_type, to_shareholder_name, to_shareholder_id_number, ownership_percentage, share_class, transaction_date, consideration, supporting_docs_received, status, notes, accepted_at, created_at',
      payload: (row, company) => cleanPayload({ id: uuidOrUndefined(row.id), company_id: company?.id, transaction_type: valueByHeader(row, ['transaction_type']) || 'transfer', from_shareholder_id: uuidOrNull(valueByHeader(row, ['from_shareholder_id'])), to_shareholder_id: uuidOrNull(valueByHeader(row, ['to_shareholder_id'])), to_shareholder_type: valueByHeader(row, ['to_shareholder_type']) || 'natural_person', to_shareholder_name: valueByHeader(row, ['to_shareholder_name']) || null, to_shareholder_id_number: valueByHeader(row, ['to_shareholder_id_number']) || null, ownership_percentage: Number(valueByHeader(row, ['ownership_percentage']) || 0), share_class: valueByHeader(row, ['share_class']) || 'Ordinary', transaction_date: normalizeImportDate(valueByHeader(row, ['transaction_date'])) || null, consideration: valueByHeader(row, ['consideration']) || null, supporting_docs_received: parseBool(valueByHeader(row, ['supporting_docs_received'])), status: valueByHeader(row, ['status']) || 'draft', notes: valueByHeader(row, ['notes']) || null, accepted_at: normalizeImportDate(valueByHeader(row, ['accepted_at'])) || null }),
      validate: (payload, errors) => { if (Number.isNaN(payload.ownership_percentage)) errors.push('Ownership percentage invalid'); },
      mapRow: mapShareTransactionRow,
      localMap: (row) => ({ companyId: row.company_id, ...mapShareTransactionRow(row) }),
      previewLabel: (row) => row.transaction_type,
      rowLabel: (row) => row.transaction_type
    }
  };
  return base[type];
}

function findRestoreCompany(rowObject, companies) {
  const companyId = valueByHeader(rowObject, ['company_id']);
  const companyName = valueByHeader(rowObject, ['company_name']);
  const companyRegistration = normalizeCompanyRegistrationNumber(valueByHeader(rowObject, ['company_registration_number', 'registration_number']));
  return companies.find((item) =>
    String(item.id) === String(companyId) ||
    item.name.trim().toLowerCase() === companyName.trim().toLowerCase() ||
    (companyRegistration && normalizeCompanyRegistrationNumber(item.registrationNumber).toLowerCase() === companyRegistration.toLowerCase())
  );
}

function restoreCompanyLabel(rowObject) {
  return valueByHeader(rowObject, ['company_name']) ||
    normalizeCompanyRegistrationNumber(valueByHeader(rowObject, ['company_registration_number', 'registration_number'])) ||
    valueByHeader(rowObject, ['company_id']);
}

function parseJsonCell(value, fallback) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function parseBool(value) {
  return ['true', '1', 'yes', 'y', 'received', 'accepted'].includes(String(value || '').trim().toLowerCase());
}

function uuidOrUndefined(value) {
  return isUuid(value) ? value : undefined;
}

function uuidOrNull(value) {
  return isUuid(value) ? value : null;
}

function cleanPayload(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function looksLikeSaId(value) {
  return /^\d{13}$/.test(String(value || '').trim());
}

function isValidSaIdNumber(value) {
  const id = String(value || '').trim();
  if (!/^\d{13}$/.test(id)) return false;
  const digits = id.split('').map(Number);
  const check = digits[12];
  const oddSum = digits.filter((_, index) => index % 2 === 0 && index < 12).reduce((sum, digit) => sum + digit, 0);
  const evenNumber = digits.filter((_, index) => index % 2 === 1 && index < 12).join('');
  const evenSum = String(Number(evenNumber) * 2).split('').reduce((sum, digit) => sum + Number(digit), 0);
  const calculated = (10 - ((oddSum + evenSum) % 10)) % 10;
  return calculated === check;
}

function findDuplicateRecords(records, label, nameKey = 'name') {
  const issues = [];
  const byId = new Map();
  const byName = new Map();
  records.forEach((record) => {
    const idNumber = String(record.idNumber || '').trim().toLowerCase();
    const name = String(record[nameKey] || '').trim().toLowerCase();
    if (idNumber) {
      byId.set(idNumber, [...(byId.get(idNumber) || []), record]);
    }
    if (name) {
      byName.set(name, [...(byName.get(name) || []), record]);
    }
  });
  byId.forEach((items, idNumber) => {
    if (items.length > 1) {
      issues.push({
        key: `${label}-duplicate-id-${idNumber}`,
        title: `Duplicate ${label} ID`,
        detail: `${items.length} ${label} records share ID/passport ${idNumber}.`
      });
    }
  });
  byName.forEach((items, name) => {
    if (items.length > 1) {
      issues.push({
        key: `${label}-duplicate-name-${name}`,
        title: `Duplicate ${label} name`,
        detail: `${items.length} ${label} records use the name "${items[0][nameKey]}".`
      });
    }
  });
  return issues;
}

function calculateComplianceStatus(detail) {
  return getReadinessChecklist(detail).status;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatCompanyDueDate(value) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not set';
}

function calculateNextAnnualReturnDue(incorporationDate, afterDate = todayIsoDate()) {
  if (!incorporationDate) return null;
  const incorporation = new Date(`${incorporationDate}T00:00:00`);
  const after = new Date(`${afterDate}T00:00:00`);
  if (Number.isNaN(incorporation.getTime()) || Number.isNaN(after.getTime())) return null;

  let year = after.getFullYear();
  let anniversary = new Date(year, incorporation.getMonth(), incorporation.getDate());
  let due = addDays(anniversary, 30);
  while (due <= after) {
    year += 1;
    anniversary = new Date(year, incorporation.getMonth(), incorporation.getDate());
    due = addDays(anniversary, 30);
  }
  return due.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function annualReturnStatus(dueDate) {
  if (!dueDate) {
    return { label: 'Date needed', className: 'border-amber-200 bg-amber-50 text-amber-800' };
  }
  const today = new Date(`${todayIsoDate()}T00:00:00`);
  const due = new Date(`${dueDate}T00:00:00`);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return { label: 'Overdue', className: 'border-red-200 bg-red-50 text-red-800' };
  if (diffDays <= 30) return { label: 'Due soon', className: 'border-amber-200 bg-amber-50 text-amber-800' };
  return { label: 'Scheduled', className: 'border-emerald-200 bg-emerald-50 text-emerald-800' };
}

function buildAnnualReturnTask(company, dueDate, detail) {
  const contactId = (detail.contacts || [])[0]?.id || '';
  const taskDueDate = dueDate || calculateNextAnnualReturnDue(company.incorporationDate) || todayIsoDate();
  return {
    title: `Prepare annual return for ${company.name}`,
    taskType: 'Annual Return',
    contactId,
    dueDate: taskDueDate,
    status: 'open',
    notes: 'Confirm turnover category, prepare CIPC annual return filing, and capture the CIPC reference once filed.'
  };
}

function directorChangeTypeLabel(type) {
  return {
    appointment: 'Appointment',
    resignation: 'Resignation',
    removal: 'Removal',
    details_correction: 'Details correction'
  }[type] || 'Director change';
}

function directorChangeStatusLabel(status) {
  return {
    draft: 'Draft',
    submitted: 'Submitted',
    accepted: 'Accepted',
    rejected: 'Rejected'
  }[status] || 'Draft';
}

function directorChangeTarget(change) {
  return change?.fullName || 'Director';
}

function shareTransactionTypeLabel(type) {
  return {
    transfer: 'Share transfer',
    allotment: 'Share allotment',
    cancellation: 'Share cancellation'
  }[type] || 'Share transaction';
}

function shareTransactionStatusLabel(status) {
  return {
    draft: 'Draft',
    approved: 'Approved',
    accepted: 'Accepted',
    rejected: 'Rejected'
  }[status] || 'Draft';
}

function validateShareTransaction(transaction, shareholders) {
  const errors = [];
  const preview = [];
  const pct = Number(transaction.ownershipPercentage || 0);
  const fromShareholder = (shareholders || []).find((shareholder) => String(shareholder.id) === String(transaction.fromShareholderId));
  const toShareholder = (shareholders || []).find((shareholder) => String(shareholder.id) === String(transaction.toShareholderId));
  const currentTotal = (shareholders || []).reduce((sum, shareholder) => sum + Number(shareholder.ownershipPercentage || 0), 0);
  let nextTotal = currentTotal;

  if (!Number.isFinite(pct) || pct <= 0) {
    errors.push('Ownership moved must be more than 0%.');
  }

  if (['transfer', 'cancellation'].includes(transaction.transactionType)) {
    if (!fromShareholder) {
      errors.push('Select a valid from shareholder.');
    } else {
      const fromCurrent = Number(fromShareholder.ownershipPercentage || 0);
      const fromNext = Number((fromCurrent - pct).toFixed(4));
      preview.push(`${fromShareholder.name}: ${fromCurrent}% -> ${Math.max(fromNext, 0)}%`);
      if (fromNext < -0.0001) {
        errors.push(`${fromShareholder.name} only holds ${fromCurrent}%, so ${pct}% cannot be moved.`);
      }
    }
  }

  if (transaction.transactionType === 'allotment') {
    nextTotal = currentTotal + pct;
  }

  if (transaction.transactionType === 'cancellation') {
    nextTotal = currentTotal - pct;
  }

  if (transaction.transactionType === 'transfer') {
    if (toShareholder) {
      const toCurrent = Number(toShareholder.ownershipPercentage || 0);
      preview.push(`${toShareholder.name}: ${toCurrent}% -> ${Number((toCurrent + pct).toFixed(4))}%`);
    } else if (transaction.toShareholderName) {
      preview.push(`${transaction.toShareholderName}: 0% -> ${pct}%`);
    } else {
      errors.push('Capture the receiving shareholder.');
    }
  }

  if (transaction.transactionType === 'allotment') {
    if (toShareholder) {
      const toCurrent = Number(toShareholder.ownershipPercentage || 0);
      preview.push(`${toShareholder.name}: ${toCurrent}% -> ${Number((toCurrent + pct).toFixed(4))}%`);
    } else if (transaction.toShareholderName) {
      preview.push(`${transaction.toShareholderName}: 0% -> ${pct}%`);
    } else {
      errors.push('Capture the receiving shareholder.');
    }
  }

  if (nextTotal > 100.0001) {
    errors.push(`Accepted ownership total would be ${Number(nextTotal.toFixed(4))}%, above 100%.`);
  }
  if (nextTotal < -0.0001) {
    errors.push(`Accepted ownership total would be ${Number(nextTotal.toFixed(4))}%, below 0%.`);
  }

  preview.push(`Total: ${Number(currentTotal.toFixed(4))}% -> ${Number(nextTotal.toFixed(4))}%`);
  return {
    canAccept: errors.length === 0,
    errors,
    preview,
    summary: errors.length ? errors[0] : 'Transaction can be accepted.'
  };
}

function shareholderNameById(shareholders, shareholderId) {
  return (shareholders || []).find((shareholder) => String(shareholder.id) === String(shareholderId))?.name || '';
}

function ShareTransactionStatusBadge({ status }) {
  const styles = {
    draft: 'border-ink/10 bg-paper text-ink/55',
    approved: 'border-blue-200 bg-blue-50 text-blue-800',
    accepted: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    rejected: 'border-red-200 bg-red-50 text-red-800'
  };
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles[status] || styles.draft}`}>{shareTransactionStatusLabel(status)}</span>;
}

function ShareTransactionSteps({ transaction, validation }) {
  const steps = [
    { label: 'Captured', complete: true },
    { label: 'Documents received', complete: Boolean(transaction.supportingDocsReceived) },
    { label: 'Approved', complete: ['approved', 'accepted'].includes(transaction.status) },
    { label: 'Register updated', complete: transaction.status === 'accepted', blocked: !validation.canAccept }
  ];

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {steps.map((step, index) => (
        <span
          key={step.label}
          className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${
            step.complete
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : step.blocked
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {index + 1}. {step.label}
        </span>
      ))}
    </div>
  );
}

function shareTransactionNextAction(transaction, validation) {
  if (transaction.status === 'accepted') {
    return { label: 'Complete: shareholder register has been updated.', tone: 'text-forest' };
  }
  if (!validation.canAccept) {
    return { label: validation.summary, tone: 'text-red-700' };
  }
  if (!transaction.supportingDocsReceived) {
    return { label: 'Next step: mark signed documents received before approval.', tone: 'text-amber-700' };
  }
  if (transaction.status !== 'approved') {
    return { label: 'Next step: approve the transaction.', tone: 'text-amber-700' };
  }
  return { label: 'Ready: update shareholder register.', tone: 'text-forest' };
}

function hasDocument(detail, documentType) {
  return detail.documents.some((document) => document.documentType === documentType);
}

function hasOpenDocumentTask(detail, documentType) {
  const taskType = documentTaskType(documentType);
  return (detail.tasks || []).some((task) => task.status !== 'done' && task.taskType === taskType);
}

function buildDocumentRequestTask(documentType, detail) {
  const label = documentLabel(documentType);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);
  const contactId = (detail.contacts || [])[0]?.id || '';
  return {
    title: documentType === 'mandate_to_file' ? 'Request signed Mandate to File' : `Request ${label}`,
    taskType: documentTaskType(documentType),
    contactId,
    dueDate: dueDate.toISOString().slice(0, 10),
    status: 'open',
    notes: documentTaskNotes(documentType)
  };
}

function documentTaskType(documentType) {
  return {
    share_register: 'Share Register',
    trust_deed: 'Trust Deed',
    mandate_to_file: 'Mandate',
    moi: 'MoI'
  }[documentType] || 'General';
}

function documentTaskNotes(documentType) {
  return {
    share_register: 'Request the latest signed share register to support BO calculations and CIPC filing evidence.',
    trust_deed: 'Request the Trust Deed and amendments to identify trustees, beneficiaries, founders and controllers.',
    mandate_to_file: 'Request a signed mandate authorising the practice to prepare and file BO information with CIPC.',
    moi: 'Request the latest Memorandum of Incorporation to confirm company rules and control rights.'
  }[documentType] || 'Request supporting document for BO compliance review.';
}

function hasTrustShareholder(detail) {
  return detail.shareholders.some((shareholder) => shareholder.shareholderType === 'trust');
}

function documentLabel(documentType) {
  return {
    share_register: 'Share Register',
    moi: 'MoI',
    trust_deed: 'Trust Deed',
    mandate_to_file: 'Mandate to File'
  }[documentType] || documentType;
}

function filingSubmissionLabel(status) {
  return {
    not_submitted: 'Not submitted',
    submitted: 'Submitted to CIPC',
    accepted: 'Accepted / completed',
    rejected: 'Rejected / needs correction'
  }[status] || 'Not submitted';
}

function buildEntityReviewLookup(companies, companyDetails) {
  const lookup = {};
  companies.forEach((company) => {
    const detail = companyDetails[company.id];
    if (!detail) return;
    (detail.entityOwnershipReviews || []).forEach((review) => {
      const shareholder = (detail.shareholders || []).find((s) => String(s.id) === String(review.shareholderId));
      if (!shareholder?.idNumber) return;
      const key = shareholder.idNumber.trim().toLowerCase();
      if (!lookup[key] || (review.reviewedAt || '') > (lookup[key].review.reviewedAt || '')) {
        lookup[key] = { review, sourceCompanyName: company.name, sourceCompanyId: company.id, entityName: shareholder.name };
      }
    });
  });
  return lookup;
}

function buildAllTasks(companies, companyDetails) {
  return companies.flatMap((company) => {
    const detail = companyDetails[company.id] || createEmptyCompanyDetail();
    return detail.tasks.map((task) => ({
      ...task,
      company,
      companyName: company.name,
      contactName: detail.contacts.find((contact) => String(contact.id) === String(task.contactId))?.fullName || ''
    }));
  });
}

function buildRecentActivity(companies, companyDetails) {
  return companies
    .flatMap((company) => {
      const detail = companyDetails[company.id] || createEmptyCompanyDetail();
      return (detail.activity || []).map((entry) => ({
        ...entry,
        companyId: company.id,
        companyName: company.name
      }));
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 25);
}

function buildNotifications(companies, tasks) {
  const taskNotifications = tasks
    .filter((task) => task.status !== 'done')
    .map((task) => {
      const due = getDueStatus(task.dueDate);
      if (!['overdue', 'soon'].includes(due.tone)) return null;
      return {
        id: `task-${task.id}`,
        tone: due.tone === 'overdue' ? 'critical' : 'warning',
        label: due.tone === 'overdue' ? 'Overdue' : 'Due soon',
        title: task.title,
        detail: `${task.companyName} - ${due.label}${task.contactName ? ` - ${task.contactName}` : ''}`,
        company: task.company,
        dueDate: task.dueDate || ''
      };
    })
    .filter(Boolean);

  const companyNotifications = companies
    .filter((company) => company.status === 'Action Required' || company.status === 'Due Soon')
    .map((company) => ({
      id: `company-${company.id}`,
      tone: company.status === 'Action Required' ? 'critical' : 'warning',
      label: company.status === 'Action Required' ? 'Action' : 'Due soon',
      title: company.name,
      detail: company.status === 'Action Required'
        ? 'BO records need review before CIPC filing.'
        : `Next filing date: ${company.nextDueDate || 'Not set'}`,
      company,
      dueDate: company.nextDueDate || ''
    }));

  return [...taskNotifications, ...companyNotifications]
    .sort((a, b) => notificationPriority(a) - notificationPriority(b))
    .slice(0, 12);
}

function notificationPriority(item) {
  const toneWeight = item.tone === 'critical' ? 0 : item.tone === 'warning' ? 1 : 2;
  const dueWeight = item.dueDate ? new Date(`${item.dueDate}T00:00:00`).getTime() || 0 : Number.MAX_SAFE_INTEGER;
  return toneWeight * 100000000000000 + dueWeight;
}

function calculateTaskStats(tasks) {
  const openTasks = tasks.filter((task) => task.status !== 'done');
  return {
    open: openTasks.length,
    overdue: openTasks.filter((task) => getDueStatus(task.dueDate).tone === 'overdue').length,
    dueThisWeek: openTasks.filter((task) => getDueStatus(task.dueDate).tone === 'soon').length
  };
}

function getDueStatus(dueDate) {
  if (!dueDate) return { label: 'No due date', tone: 'none' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return { label: `Overdue by ${Math.abs(diffDays)}d`, tone: 'overdue' };
  if (diffDays <= 7) return { label: diffDays === 0 ? 'Due today' : `Due in ${diffDays}d`, tone: 'soon' };
  return { label: due.toLocaleDateString('en-ZA'), tone: 'later' };
}

function taskSortDate(task) {
  return task.dueDate ? new Date(`${task.dueDate}T00:00:00`) : new Date('2999-12-31T00:00:00');
}

function buildAuditReportCsv(company, detail) {
  const validation = getComplianceValidation(company, detail);
  const readiness = getReadinessChecklist(detail);
  const rows = [
    ['SecretarialDesk Audit Report'],
    ['Company name', company.name],
    ['Registration number', company.registrationNumber],
    ['Company type', company.type || 'Pty Ltd'],
    ['Compliance status', company.status],
    ['Generated date', new Date().toLocaleString('en-ZA')],
    [],
    ['Readiness'],
    ['Item', 'Status', 'Detail'],
    ...readiness.items.map((item) => [item.label, item.complete ? 'Complete' : 'Outstanding', item.detail]),
    [],
    ['Validation Issues'],
    ['Level', 'Title', 'Detail'],
    ...validation.critical.map((item) => ['Critical', item.title, item.detail]),
    ...validation.warning.map((item) => ['Warning', item.title, item.detail]),
    ...validation.info.map((item) => ['Info', item.title, item.detail]),
    [],
    ['Shareholders'],
    ['Name', 'Type', 'ID / registration number', 'Ownership %', 'BO action'],
    ...(detail.shareholders || []).map((shareholder) => [
      shareholder.name,
      shareholderTypeLabel(shareholder.shareholderType),
      shareholder.idNumber || '',
      shareholder.ownershipPercentage,
      shareholder.shareholderType === 'trust'
        ? 'Trust deed review required'
        : shareholder.shareholderType === 'company' && Number(shareholder.ownershipPercentage) > 5
          ? 'Look-through review required'
          : shareholder.shareholderType === 'natural_person' && Number(shareholder.ownershipPercentage) > 5
            ? 'Direct beneficial owner'
            : 'Below direct threshold'
    ]),
    [],
    ['Confirmed Beneficial Owners'],
    ['Name', 'ID number', 'Ownership %', 'Control basis', 'Evidence'],
    ...(detail.beneficialOwners || []).map((owner) => [
      owner.fullName,
      owner.idNumber || '',
      owner.ownershipPercentage,
      owner.controlBasis,
      buildBoEvidenceLine(owner, detail)
    ]),
    [],
    ['Trust Reviews'],
    ['Trust shareholder', 'Trustees', 'Beneficiaries', 'Founders', 'Controllers', 'Notes'],
    ...(detail.trustReviews || []).map((review) => {
      const shareholder = (detail.shareholders || []).find((item) => String(item.id) === String(review.shareholderId));
      return [
        shareholder?.name || 'Trust shareholder',
        (review.trustees || []).length,
        (review.beneficiaries || []).length,
        (review.founders || []).length,
        (review.controllers || []).length,
        review.notes || ''
      ];
    }),
    [],
    ['Entity Look-through Reviews'],
    ['Company shareholder', 'Underlying owner', 'Owner type', 'Ownership in entity %', 'Effective %', 'Notes'],
    ...(detail.entityOwnershipReviews || []).flatMap((review) => {
      const shareholder = (detail.shareholders || []).find((item) => String(item.id) === String(review.shareholderId));
      return (review.owners || []).map((owner) => [
        shareholder?.name || 'Company shareholder',
        owner.fullName,
        shareholderTypeLabel(owner.ownerType),
        owner.ownershipPercentage,
        calculateEffectiveOwnership(shareholder?.ownershipPercentage, owner.ownershipPercentage),
        review.notes || owner.notes || ''
      ]);
    }),
    [],
    ['Documents'],
    ['Document type', 'File name', 'Status', 'Storage path'],
    ...(detail.documents || []).map((document) => [
      documentLabel(document.documentType),
      document.originalFilename || '',
      document.status || '',
      document.filePath || ''
    ]),
    [],
    ['Filing Packs'],
    ['Generated at', 'Submission status', 'Submitted at', 'CIPC reference', 'Submission notes'],
    ...(detail.filingPacks || []).map((pack) => [
      formatAuditDate(pack.generatedAt),
      filingSubmissionLabel(pack.submissionStatus),
      formatAuditDate(pack.submittedAt),
      pack.cipcReference || '',
      pack.submissionNotes || ''
    ]),
    [],
    ['Activity Timeline'],
    ['Date', 'Action', 'Subject', 'Detail'],
    ...(detail.activity || []).map((entry) => [
      formatAuditDate(entry.createdAt),
      activityActionLabel(entry.action),
      entry.subjectType || '',
      activityDetailLabel(entry)
    ])
  ];

  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function buildAuditReportPdf(jsPDF, company, detail) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  let y = 54;
  const validation = getComplianceValidation(company, detail);
  const readiness = getReadinessChecklist(detail);

  addPdfHeader(doc, 'BO Compliance Audit Report');
  y = addPdfCompanyBlock(doc, company, y + 38);
  y = addPdfKeyValue(doc, 'Generated', new Date().toLocaleString('en-ZA'), margin, y + 8);
  y = addPdfKeyValue(doc, 'Compliance status', company.status || 'Not set', margin, y);

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Readiness and Validation', margin, y);
  y += 22;
  readiness.items.forEach((item) => {
    y = addPdfParagraph(doc, `${item.complete ? '[Complete]' : '[Outstanding]'} ${item.label}: ${item.detail}`, margin, y);
    y = ensurePdfSpace(doc, y, 50);
  });

  const issues = [
    ...validation.critical.map((item) => ({ ...item, level: 'Critical' })),
    ...validation.warning.map((item) => ({ ...item, level: 'Warning' })),
    ...validation.info.map((item) => ({ ...item, level: 'Info' }))
  ];
  y += 10;
  if (issues.length === 0) {
    y = addPdfParagraph(doc, 'No validation issues found at the time of export.', margin, y);
  } else {
    issues.forEach((issue) => {
      y = addPdfParagraph(doc, `[${issue.level}] ${issue.title}: ${issue.detail}`, margin, y);
      y = ensurePdfSpace(doc, y, 50);
    });
  }

  y = addAuditPdfSection(doc, y + 18, 'Confirmed Beneficial Owners', (detail.beneficialOwners || []).map((owner) => (
    `${owner.fullName} - ${buildBoEvidenceLine(owner, detail)}`
  )), 'No confirmed BO records captured.');

  y = addAuditPdfSection(doc, y + 18, 'Trust Reviews', (detail.trustReviews || []).map((review) => {
    const shareholder = (detail.shareholders || []).find((item) => String(item.id) === String(review.shareholderId));
    return `${shareholder?.name || 'Trust shareholder'} - trustees ${(review.trustees || []).length}, beneficiaries ${(review.beneficiaries || []).length}, founders ${(review.founders || []).length}, controllers ${(review.controllers || []).length}${review.notes ? `; notes: ${review.notes}` : ''}`;
  }), 'No trust reviews captured.');

  y = addAuditPdfSection(doc, y + 18, 'Entity Look-through Reviews', (detail.entityOwnershipReviews || []).flatMap((review) => {
    const shareholder = (detail.shareholders || []).find((item) => String(item.id) === String(review.shareholderId));
    return (review.owners || []).map((owner) => `${shareholder?.name || 'Company shareholder'} - ${owner.fullName}: ${owner.ownershipPercentage}% in entity, effective ${calculateEffectiveOwnership(shareholder?.ownershipPercentage, owner.ownershipPercentage)}%`);
  }), 'No entity look-through reviews captured.');

  y = addAuditPdfSection(doc, y + 18, 'Filing Pack History', (detail.filingPacks || []).map((pack) => (
    `${formatAuditDate(pack.generatedAt)} - ${filingSubmissionLabel(pack.submissionStatus)}${pack.cipcReference ? ` - CIPC ref ${pack.cipcReference}` : ''}${pack.submissionNotes ? ` - ${pack.submissionNotes}` : ''}`
  )), 'No filing packs generated.');

  addAuditPdfSection(doc, y + 18, 'Activity Timeline', [...(detail.activity || [])]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map((entry) => `${formatAuditDate(entry.createdAt)} - ${activityActionLabel(entry.action)} - ${activityDetailLabel(entry)}`), 'No activity recorded.');

  addPdfFooter(doc);
  return doc.output('blob');
}

function addAuditPdfSection(doc, y, title, lines, emptyText) {
  const margin = 48;
  y = ensurePdfSpace(doc, y, 90);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title, margin, y);
  y += 22;

  if (lines.length === 0) {
    return addPdfParagraph(doc, emptyText, margin, y);
  }

  lines.forEach((line) => {
    y = ensurePdfSpace(doc, y, 48);
    y = addPdfParagraph(doc, line, margin, y);
  });
  return y;
}

function formatAuditDate(value) {
  return value ? new Date(value).toLocaleString('en-ZA') : '';
}

function buildBoRegisterCsv(company, detail) {
  const rows = [
    ['Company name', company.name],
    ['Registration number', company.registrationNumber],
    ['Company type', company.type || 'Pty Ltd'],
    ['Generated date', new Date().toLocaleDateString('en-ZA')],
    [],
    ['Beneficial Ownership Register'],
    ['Name', 'Type', 'ID / registration number', 'Ownership %', 'BO finding', 'Action required']
  ];

  const filingOwners = getFilingBeneficialOwners(detail);
  if (filingOwners.length) {
    rows.push(['Confirmed filing records']);
    filingOwners.forEach((owner) => {
      rows.push([
        owner.fullName,
        'Natural person',
        owner.idNumber || '',
        owner.ownershipPercentage,
        owner.controlBasis,
        owner.notes || ''
      ]);
    });
    rows.push([]);
    rows.push(['Underlying shareholder review']);
  }

  detail.shareholders.forEach((shareholder) => {
    const pct = Number(shareholder.ownershipPercentage || 0);
    const isBo = shareholder.shareholderType === 'natural_person' && pct > 5;
    const isTrust = shareholder.shareholderType === 'trust';
    const isCompany = shareholder.shareholderType === 'company';
    rows.push([
      shareholder.name,
      shareholderTypeLabel(shareholder.shareholderType),
      shareholder.idNumber || '',
      pct,
      isBo ? 'Beneficial owner: natural person exceeds >5%' : isTrust ? 'Trust shareholder' : isCompany ? 'Entity shareholder' : 'Below direct threshold',
      isTrust ? 'Upload/review Trust Deed' : isCompany && pct > 5 ? 'Trace underlying natural persons' : ''
    ]);
  });

  rows.push([]);
  rows.push(['Directors']);
  rows.push(['Full name', 'ID number', 'Appointment date']);
  detail.directors.forEach((director) => {
    rows.push([director.fullName, director.idNumber || '', director.appointmentDate || '']);
  });

  rows.push([]);
  rows.push(['Evidence Summary']);
  rows.push(['Section', 'Subject', 'Detail']);
  (detail.beneficialOwners || []).forEach((owner) => {
    rows.push(['Confirmed BO', owner.fullName, buildBoEvidenceLine(owner, detail)]);
  });
  (detail.trustReviews || []).forEach((review) => {
    const shareholder = (detail.shareholders || []).find((item) => String(item.id) === String(review.shareholderId));
    rows.push([
      'Trust review',
      shareholder?.name || 'Trust shareholder',
      `Trustees: ${(review.trustees || []).length}; beneficiaries: ${(review.beneficiaries || []).length}; founders: ${(review.founders || []).length}; controllers: ${(review.controllers || []).length}; notes: ${review.notes || ''}`
    ]);
  });
  (detail.entityOwnershipReviews || []).forEach((review) => {
    const shareholder = (detail.shareholders || []).find((item) => String(item.id) === String(review.shareholderId));
    (review.owners || []).forEach((owner) => {
      rows.push([
        'Entity look-through',
        shareholder?.name || 'Company shareholder',
        `${owner.fullName}: ${owner.ownershipPercentage}% in entity; effective ${calculateEffectiveOwnership(shareholder?.ownershipPercentage, owner.ownershipPercentage)}%; type ${shareholderTypeLabel(owner.ownerType)}`
      ]);
    });
  });
  const validation = getComplianceValidation(company, detail);
  [...validation.critical, ...validation.warning, ...validation.info].forEach((issue) => {
    rows.push(['Validation', issue.title, issue.detail]);
  });

  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

function buildMandateText(company, detail) {
  const beneficialOwners = getFilingBeneficialOwners(detail);

  return [
    'MANDATE TO FILE BENEFICIAL OWNERSHIP INFORMATION',
    '',
    `Company: ${company.name}`,
    `Registration number: ${company.registrationNumber}`,
    `Company type: ${company.type || 'Pty Ltd'}`,
    `Prepared date: ${new Date().toLocaleDateString('en-ZA')}`,
    '',
    'Authorisation',
    'The company authorises the appointed accounting practice to prepare and submit Beneficial Ownership information and supporting records to CIPC based on the reviewed company records.',
    '',
    'Beneficial owners identified',
    ...(beneficialOwners.length
      ? beneficialOwners.map((owner) => `- ${owner.fullName} (${owner.idNumber || 'ID not captured'}): ${owner.ownershipPercentage}% - ${owner.controlBasis}`)
      : ['- No natural person beneficial owner over >5% captured. Manual review required.']),
    '',
    'Outstanding review notes',
    ...getReadinessChecklist(detail).items.filter((item) => !item.complete).map((item) => `- ${item.label}: ${item.detail}`),
    '',
    'Signed for and on behalf of the company:',
    '',
    'Name: ______________________________',
    'Capacity: ___________________________',
    'Signature: __________________________',
    'Date: _______________________________'
  ].join('\n');
}

function getFilingBeneficialOwners(detail) {
  if ((detail.beneficialOwners || []).length > 0) return detail.beneficialOwners || [];

  return (detail.shareholders || [])
    .filter((shareholder) => shareholder.shareholderType === 'natural_person' && Number(shareholder.ownershipPercentage) > 5)
    .map((shareholder) => ({
      id: shareholder.id,
      shareholderId: shareholder.id,
      fullName: shareholder.name,
      idNumber: shareholder.idNumber,
      ownershipPercentage: shareholder.ownershipPercentage,
      controlBasis: 'Direct shareholding above 5%',
      notes: ''
    }));
}

function buildBoRegisterPdf(jsPDF, company, detail) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  let y = 54;

  addPdfHeader(doc, 'Beneficial Ownership Register');
  y = addPdfCompanyBlock(doc, company, y + 38);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Confirmed BO Filing Records', margin, y);
  y += 22;

  const confirmedFilingOwners = getFilingBeneficialOwners(detail);
  if (confirmedFilingOwners.length === 0) {
    y = addPdfParagraph(doc, 'No confirmed BO filing records stored yet. Shareholder-derived findings are listed below for review.', margin, y);
  } else {
    confirmedFilingOwners.forEach((owner) => {
      y = addPdfKeyValue(
        doc,
        owner.fullName,
        `${owner.idNumber || 'ID not captured'} | ${owner.ownershipPercentage}% | ${owner.controlBasis}${owner.notes ? ` | Notes: ${owner.notes}` : ''}`,
        margin,
        y
      );
      y = ensurePdfSpace(doc, y, 70);
    });
  }

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Shareholders and BO Findings', margin, y);
  y += 22;

  if (detail.shareholders.length === 0) {
    y = addPdfParagraph(doc, 'No shareholders captured.', margin, y);
  } else {
    detail.shareholders.forEach((shareholder) => {
      const pct = Number(shareholder.ownershipPercentage || 0);
      const finding =
        shareholder.shareholderType === 'natural_person' && pct > 5
          ? 'Beneficial owner: natural person exceeds >5%'
          : shareholder.shareholderType === 'trust'
            ? 'Trust shareholder: Trust Deed review required'
            : shareholder.shareholderType === 'company' && pct > 5
              ? 'Entity shareholder: trace underlying natural persons'
              : 'Below direct threshold';
      y = addPdfKeyValue(doc, shareholder.name, `${shareholderTypeLabel(shareholder.shareholderType)} | ${shareholder.idNumber || 'ID/reg not captured'} | ${pct}% | ${finding}`, margin, y);
      y = ensurePdfSpace(doc, y, 70);
    });
  }

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Directors', margin, y);
  y += 22;

  if (detail.directors.length === 0) {
    y = addPdfParagraph(doc, 'No directors captured.', margin, y);
  } else {
    detail.directors.forEach((director) => {
      y = addPdfKeyValue(doc, director.fullName, `${director.idNumber || 'ID not captured'} | Appointed: ${director.appointmentDate || 'Not set'}`, margin, y);
      y = ensurePdfSpace(doc, y, 60);
    });
  }

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text('Readiness Checklist', margin, y);
  y += 22;
  getReadinessChecklist(detail).items.forEach((item) => {
    y = addPdfParagraph(doc, `${item.complete ? '[Complete]' : '[Outstanding]'} ${item.label}: ${item.detail}`, margin, y);
    y = ensurePdfSpace(doc, y, 50);
  });

  addPdfEvidenceSummaryPage(doc, company, detail);
  addPdfOwnershipMapPage(doc, company, detail);

  addPdfFooter(doc);
  return doc.output('blob');
}

function buildMandatePdf(jsPDF, company, detail) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  let y = 54;

  addPdfHeader(doc, 'Mandate to File');
  y = addPdfCompanyBlock(doc, company, y + 38);

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Authorisation', margin, y);
  y += 22;
  y = addPdfParagraph(
    doc,
    'The company authorises the appointed accounting practice to prepare and submit Beneficial Ownership information and supporting records to CIPC based on the reviewed company records.',
    margin,
    y
  );

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text('Beneficial Owners Identified', margin, y);
  y += 22;

  const beneficialOwners = getFilingBeneficialOwners(detail);
  if (beneficialOwners.length === 0) {
    y = addPdfParagraph(doc, 'No confirmed natural-person BO filing record captured. Manual review required.', margin, y);
  } else {
    beneficialOwners.forEach((owner) => {
      y = addPdfParagraph(doc, `${owner.fullName} (${owner.idNumber || 'ID not captured'}): ${owner.ownershipPercentage}% - ${owner.controlBasis}${owner.notes ? ` - ${owner.notes}` : ''}`, margin, y);
    });
  }

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.text('Outstanding Review Notes', margin, y);
  y += 22;
  const outstanding = getReadinessChecklist(detail).items.filter((item) => !item.complete);
  if (outstanding.length === 0) {
    y = addPdfParagraph(doc, 'No outstanding readiness items recorded.', margin, y);
  } else {
    outstanding.forEach((item) => {
      y = addPdfParagraph(doc, `${item.label}: ${item.detail}`, margin, y);
    });
  }

  y = ensurePdfSpace(doc, y + 24, 150);
  doc.setFont('helvetica', 'bold');
  doc.text('Signed for and on behalf of the company', margin, y);
  y += 36;
  ['Name', 'Capacity', 'Signature', 'Date'].forEach((label) => {
    doc.setFont('helvetica', 'normal');
    doc.text(`${label}:`, margin, y);
    doc.line(margin + 80, y, 360, y);
    y += 34;
  });

  addPdfFooter(doc);
  return doc.output('blob');
}

function addPdfEvidenceSummaryPage(doc, company, detail) {
  doc.addPage();
  addPdfHeader(doc, 'BO Evidence Summary');
  const margin = 48;
  let y = addPdfCompanyBlock(doc, company, 112);
  const validation = getComplianceValidation(company, detail);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Confirmed BO Filing Evidence', margin, y);
  y += 22;

  const confirmedOwners = getFilingBeneficialOwners(detail);
  if (confirmedOwners.length === 0) {
    y = addPdfParagraph(doc, 'No confirmed BO filing records stored yet.', margin, y);
  } else {
    confirmedOwners.forEach((owner) => {
      y = addPdfKeyValue(doc, owner.fullName, buildBoEvidenceLine(owner, detail), margin, y);
      y = ensurePdfSpace(doc, y, 70);
    });
  }

  y += 14;
  y = ensurePdfSpace(doc, y, 120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Trust Review Evidence', margin, y);
  y += 22;

  if ((detail.trustReviews || []).length === 0) {
    y = addPdfParagraph(doc, 'No trust review records captured.', margin, y);
  } else {
    (detail.trustReviews || []).forEach((review) => {
      const shareholder = (detail.shareholders || []).find((item) => String(item.id) === String(review.shareholderId));
      const trustees = (review.trustees || []).length;
      const beneficiaries = (review.beneficiaries || []).length;
      const founders = (review.founders || []).length;
      const controllers = (review.controllers || []).length;
      const count = trustees + beneficiaries + founders + controllers;
      y = addPdfKeyValue(
        doc,
        shareholder?.name || 'Trust shareholder',
        `${count} trust person record${count === 1 ? '' : 's'} captured. Trustees: ${trustees}; beneficiaries: ${beneficiaries}; founders: ${founders}; controllers: ${controllers}.${review.notes ? ` Notes: ${review.notes}` : ''}`,
        margin,
        y
      );
      y = ensurePdfSpace(doc, y, 80);
    });
  }

  y += 14;
  y = ensurePdfSpace(doc, y, 120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Entity Look-through Evidence', margin, y);
  y += 22;

  if ((detail.entityOwnershipReviews || []).length === 0) {
    y = addPdfParagraph(doc, 'No company shareholder look-through records captured.', margin, y);
  } else {
    (detail.entityOwnershipReviews || []).forEach((review) => {
      const shareholder = (detail.shareholders || []).find((item) => String(item.id) === String(review.shareholderId));
      const owners = (review.owners || []).map((owner) => `${owner.fullName}: ${owner.ownershipPercentage}% in entity, effective ${calculateEffectiveOwnership(shareholder?.ownershipPercentage, owner.ownershipPercentage)}%`);
      y = addPdfKeyValue(
        doc,
        shareholder?.name || 'Company shareholder',
        `${owners.join('; ')}${review.notes ? ` Notes: ${review.notes}` : ''}`,
        margin,
        y
      );
      y = ensurePdfSpace(doc, y, 90);
    });
  }

  y += 14;
  y = ensurePdfSpace(doc, y, 120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Current Validation Issues', margin, y);
  y += 22;

  const issues = [
    ...validation.critical.map((item) => ({ ...item, level: 'Critical' })),
    ...validation.warning.map((item) => ({ ...item, level: 'Warning' })),
    ...validation.info.map((item) => ({ ...item, level: 'Info' }))
  ];
  if (issues.length === 0) {
    y = addPdfParagraph(doc, 'No validation issues found at the time of pack generation.', margin, y);
  } else {
    issues.forEach((issue) => {
      y = addPdfParagraph(doc, `[${issue.level}] ${issue.title}: ${issue.detail}`, margin, y);
      y = ensurePdfSpace(doc, y, 50);
    });
  }
}

function buildBoEvidenceLine(owner, detail) {
  const shareholder = (detail.shareholders || []).find((item) => String(item.id) === String(owner.shareholderId));
  if (shareholder?.shareholderType === 'natural_person') {
    return `${owner.idNumber || 'ID not captured'} | ${owner.ownershipPercentage}% | Direct shareholder: ${shareholder.name} | ${owner.controlBasis}${owner.notes ? ` | Notes: ${owner.notes}` : ''}`;
  }
  if (shareholder?.shareholderType === 'trust') {
    const review = (detail.trustReviews || []).find((item) => String(item.shareholderId) === String(shareholder.id));
    return `${owner.idNumber || 'ID not captured'} | ${owner.ownershipPercentage}% | Trust review: ${shareholder.name}${review?.reviewedAt ? ` reviewed ${new Date(review.reviewedAt).toLocaleDateString('en-ZA')}` : ''} | ${owner.controlBasis}${owner.notes ? ` | Notes: ${owner.notes}` : ''}`;
  }
  if (shareholder?.shareholderType === 'company') {
    const review = (detail.entityOwnershipReviews || []).find((item) => String(item.shareholderId) === String(shareholder.id));
    return `${owner.idNumber || 'ID not captured'} | Effective ${owner.ownershipPercentage}% | Entity look-through: ${shareholder.name}${review?.reviewedAt ? ` reviewed ${new Date(review.reviewedAt).toLocaleDateString('en-ZA')}` : ''} | ${owner.controlBasis}${owner.notes ? ` | Notes: ${owner.notes}` : ''}`;
  }
  return `${owner.idNumber || 'ID not captured'} | ${owner.ownershipPercentage}% | Manual/other filing record | ${owner.controlBasis}${owner.notes ? ` | Notes: ${owner.notes}` : ''}`;
}

function addPdfOwnershipMapPage(doc, company, detail) {
  doc.addPage();
  addPdfHeader(doc, 'Ownership Map');
  const margin = 48;
  let y = addPdfCompanyBlock(doc, company, 112);
  const ownershipTotal = detail.shareholders.reduce((sum, shareholder) => sum + Number(shareholder.ownershipPercentage || 0), 0);
  const beneficialOwners = getFilingBeneficialOwners(detail);
  const reviewItems = buildBoRegisterRows(detail.shareholders || [], detail.beneficialOwners || [], detail.trustReviews || [], detail.entityOwnershipReviews || []).filter((row) => row.status === 'review');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('BO Ownership Summary', margin, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Beneficial owners identified: ${beneficialOwners.length}`, margin, y);
  doc.text(`Trust/entity review items: ${reviewItems.length}`, 235, y);
  doc.text(`Ownership total: ${ownershipTotal}%`, 420, y);
  y += 34;

  if (detail.shareholders.length === 0) {
    addPdfParagraph(doc, 'No shareholders captured. Add shareholders before generating a final BO ownership map.', margin, y);
    return;
  }

  const companyBox = { x: margin, y, w: 190, h: 82 };
  doc.setDrawColor(217, 212, 202);
  doc.setFillColor(246, 244, 239);
  doc.roundedRect(companyBox.x, companyBox.y, companyBox.w, companyBox.h, 5, 5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(doc.splitTextToSize(company.name, companyBox.w - 22), companyBox.x + 12, companyBox.y + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(company.registrationNumber || 'Registration not captured', companyBox.x + 12, companyBox.y + 62);

  detail.shareholders.slice(0, 7).forEach((shareholder, index) => {
    const nodeY = y + index * 74;
    const nodeX = 318;
    const style = ownershipPdfStyle(shareholder);
    doc.setDrawColor(150, 158, 158);
    doc.line(companyBox.x + companyBox.w, companyBox.y + companyBox.h / 2, nodeX - 18, nodeY + 34);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(80, 88, 88);
    doc.text(`${Number(shareholder.ownershipPercentage || 0)}%`, 260, nodeY + 30);

    doc.setDrawColor(...style.stroke);
    doc.setFillColor(...style.fill);
    doc.roundedRect(nodeX, nodeY, 220, 58, 5, 5, 'FD');
    doc.setTextColor(32, 36, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(doc.splitTextToSize(shareholder.name, 190), nodeX + 12, nodeY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${shareholderTypeLabel(shareholder.shareholderType)} | ${shareholder.idNumber || 'ID/reg not captured'}`, nodeX + 12, nodeY + 35);
    doc.setTextColor(...style.text);
    doc.setFont('helvetica', 'bold');
    doc.text(style.label, nodeX + 12, nodeY + 50);
    doc.setTextColor(32, 36, 42);
  });

  if (detail.shareholders.length > 7) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Additional shareholders not shown on map: ${detail.shareholders.length - 7}`, margin, 760);
    doc.setTextColor(32, 36, 42);
  }
}

function ownershipPdfStyle(shareholder) {
  const style = ownershipNodeStyle(shareholder);
  if (style.label === 'Beneficial owner') {
    return { fill: [236, 253, 245], stroke: [167, 243, 208], text: [4, 120, 87], label: style.label };
  }
  if (style.label.includes('Trust') || style.label.includes('Trace')) {
    return { fill: [255, 251, 235], stroke: [253, 230, 138], text: [180, 83, 9], label: style.label };
  }
  return { fill: [255, 255, 255], stroke: [231, 226, 216], text: [111, 119, 119], label: style.label };
}

function addPdfHeader(doc, title) {
  doc.setFillColor(15, 71, 57);
  doc.rect(0, 0, 595, 84, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SecretarialDesk', 48, 34);
  doc.setFontSize(12);
  doc.text(title, 48, 58);
  doc.setTextColor(32, 36, 42);
}

function addPdfCompanyBlock(doc, company, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(company.name, 48, y);
  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Registration number: ${company.registrationNumber}`, 48, y);
  y += 16;
  doc.text(`Company type: ${company.type || 'Pty Ltd'}`, 48, y);
  y += 16;
  doc.text(`Prepared date: ${new Date().toLocaleDateString('en-ZA')}`, 48, y);
  return y + 30;
}

function addPdfKeyValue(doc, label, value, x, y) {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(label, x, y);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(value, 470);
  doc.text(lines, x, y + 14);
  return y + 22 + lines.length * 12;
}

function addPdfParagraph(doc, text, x, y) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(text, 490);
  doc.text(lines, x, y);
  return y + lines.length * 14 + 8;
}

function ensurePdfSpace(doc, y, needed) {
  if (y + needed < 790) return y;
  doc.addPage();
  return 54;
}

function addPdfFooter(doc) {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated by SecretarialDesk | Page ${page} of ${pageCount}`, 48, 820);
    doc.setTextColor(32, 36, 42);
  }
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadTextFile(filename, contents, type) {
  const blob = new Blob([contents], { type });
  downloadBlob(filename, blob);
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function fileSafeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'company';
}

function shareholderTypeLabel(type) {
  return {
    natural_person: 'Natural person',
    company: 'Company',
    trust: 'Trust'
  }[type] || type;
}

function SetupNotice() {
  return (
    <div className="mb-5 rounded-lg border border-gold/30 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gold">Supabase not configured yet</p>
      <p className="mt-2 text-sm leading-6 text-ink/65">
        The dashboard is running with local demo data. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to a local `.env` file, then run the migration in `supabase/migrations/001_initial_schema.sql`.
      </p>
    </div>
  );
}

function CompaniesWorkspace({ companies, onAddCompany, onSelectCompany, onImportCompanies, permissions, isSaving }) {
  const [importText, setImportText] = useState('');
  const [imported, setImported] = useState(false);
  const rows = useMemo(() => parseBulkCompanyRows(importText, companies), [importText, companies]);
  const validRows = rows.filter((row) => row.valid && !row.duplicate);
  const blockedRows = rows.filter((row) => !row.valid || row.duplicate);
  const warningRows = rows.filter((row) => row.valid && row.warnings.length > 0);
  const canImport = permissions.canEditCompany && validRows.length > 0 && !isSaving;

  const loadSample = () => {
    setImported(false);
    setImportText([
      'company_name,registration_number,company_type,incorporation_date,registered_address',
      'Wonke Connect Pty Ltd,2020/150488/07,Pty Ltd,2020-03-18,"12 Main Road, Cape Town"',
      'Mabula Trading Pty Ltd,2021/654321/07,Pty Ltd,2021-11-02,"88 Oxford Road, Johannesburg"'
    ].join('\n'));
  };

  const downloadTemplate = () => {
    const rows = [
      ['company_name', 'registration_number', 'company_type', 'incorporation_date', 'registered_address'],
      ['Example Holdings Pty Ltd', '2022/123456/07', 'Pty Ltd', '2022-06-15', 'Registered office address']
    ];
    downloadTextFile('secretarialdesk-company-import-template.csv', rows.map((row) => row.map(csvValue).join(',')).join('\n'), 'text/csv');
  };

  const readFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImported(false);
      setImportText(String(reader.result || ''));
    };
    reader.readAsText(file);
  };

  const submitImport = async () => {
    if (!canImport) return;
    await onImportCompanies(rows);
    setImported(true);
    setImportText('');
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-ink/10 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-ink/10 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold">Companies</h3>
            <p className="mt-1 text-sm leading-6 text-ink/60">Add client companies one-by-one or import a CSV exported from Excel.</p>
          </div>
          <button
            onClick={onAddCompany}
            disabled={!permissions.canEditCompany}
            className="rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white disabled:bg-ink/30"
          >
            Add company
          </button>
        </div>
        <div className="p-5">
          <CompanyTable companies={companies} onSelectCompany={onSelectCompany} />
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/10 px-5 py-5">
          <h3 className="text-xl font-semibold">Bulk client import</h3>
          <p className="mt-1 text-sm leading-6 text-ink/60">
            Import columns for company name, registration number, company type, incorporation date and registered office. Valid imports automatically create onboarding tasks.
          </p>
        </div>
        {!permissions.canEditCompany && (
          <div className="px-5 pt-5">
            <AccessNotice title="Import disabled" detail="Your role can view companies but cannot create new client records." />
          </div>
        )}
        <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="font-semibold">Paste CSV or upload file</h4>
                <p className="mt-1 text-sm text-ink/55">Excel exports, comma-separated CSV, semicolon CSV and tab-pasted rows are supported.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={downloadTemplate} className="rounded-md border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/65 hover:bg-paper">
                  Download template
                </button>
                <button type="button" onClick={loadSample} className="rounded-md border border-gold/60 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/5">
                  Load sample
                </button>
                <label className="cursor-pointer rounded-md border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/65 hover:bg-paper">
                  Upload CSV
                  <input type="file" accept=".csv,.txt" onChange={readFile} className="hidden" />
                </label>
              </div>
            </div>
            <textarea
              value={importText}
              onChange={(event) => { setImported(false); setImportText(event.target.value); }}
              rows={8}
              placeholder={'company_name,registration_number,company_type,incorporation_date,registered_address\nExample Holdings Pty Ltd,2022/123456/07,Pty Ltd,2022-06-15,"Registered office address"'}
              className="mt-4 w-full rounded-md border border-ink/15 bg-white p-3 text-sm outline-none focus:border-forest focus:ring-4 focus:ring-sage"
            />

            {rows.length > 0 && (
              <div className="mt-5 max-w-full overflow-x-auto rounded-md border border-ink/10">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-[0.08em] text-ink/50">
                    <tr>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Registration</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Incorporation</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    {rows.map((row) => (
                      <tr key={row.lineNumber}>
                        <td className="px-4 py-4">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            row.valid ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
                          }`}>
                            {row.valid ? 'Ready' : 'Blocked'}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-medium">{row.company.name || '-'}</td>
                        <td className="px-4 py-4 text-ink/65">{row.company.registrationNumber || '-'}</td>
                        <td className="px-4 py-4 text-ink/65">{row.company.type || '-'}</td>
                        <td className="px-4 py-4 text-ink/65">{row.company.incorporationDate || 'Not captured'}</td>
                        <td className="px-4 py-4 text-ink/65">
                          {[...row.errors, ...row.warnings].length ? [...row.errors, ...row.warnings].join(' | ') : 'Creates 5 onboarding tasks'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-md border border-ink/10 bg-paper p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-ink/45">Import preview</p>
              <p className="mt-3 text-3xl font-semibold text-forest">{validRows.length}</p>
              <p className="mt-1 text-sm text-ink/55">companies ready to import</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md border border-ink/10 bg-white p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-ink/45">Blocked</p>
                  <p className="mt-1 text-xl font-semibold text-red-700">{blockedRows.length}</p>
                </div>
                <div className="rounded-md border border-ink/10 bg-white p-3">
                  <p className="text-xs uppercase tracking-[0.08em] text-ink/45">Warnings</p>
                  <p className="mt-1 text-xl font-semibold text-amber-700">{warningRows.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-md border border-ink/10 bg-white p-4">
              <h4 className="font-semibold">Tasks created per company</h4>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/60">
                <li>Upload share register</li>
                <li>Confirm directors</li>
                <li>Prepare BO register</li>
                <li>Prepare Mandate to File</li>
                <li>Confirm annual return date</li>
              </ul>
            </div>
            {imported && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                Import completed. New client companies and onboarding tasks are now in the workspace.
              </div>
            )}
            <button
              type="button"
              onClick={submitImport}
              disabled={!canImport}
              className="w-full rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/30"
            >
              {isSaving ? 'Importing...' : `Import ${validRows.length || ''} companies`}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardHome({ stats, companies, allTasks, recentActivity, onAddCompany, onSelectCompany }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const filteredCompanies = companies.filter((company) => {
    const matchesStatus = statusFilter === 'All' || company.status === statusFilter;
    const searchText = `${company.name} ${company.registrationNumber}`.toLowerCase();
    return matchesStatus && searchText.includes(query.toLowerCase());
  });

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total companies" value={stats.total} helper="Client entities monitored" />
        <StatCard label="Compliant" value={stats.compliant} helper="BO register current" />
        <StatCard label="Due soon" value={stats.dueSoon} helper="Filing date approaching" />
        <StatCard label="Action required" value={stats.action} helper="Needs review or upload" alert />
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        <StatCard label="Open follow-ups" value={stats.openTasks} helper="Client tasks not completed" />
        <StatCard label="Overdue" value={stats.overdueTasks} helper="Past due date" alert={stats.overdueTasks > 0} />
        <StatCard label="Due this week" value={stats.dueThisWeek} helper="Next 7 days" />
      </section>

      <section className="mt-8 grid min-w-0 gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 rounded-lg border border-ink/10 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-ink/10 px-5 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Client companies</h3>
                <p className="text-sm text-ink/55">Track CIPC Beneficial Ownership status and next filing actions.</p>
              </div>
              <button onClick={onAddCompany} className="rounded-md border border-gold/60 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/5">
                Add first company
              </button>
            </div>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-ink/40" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by company or registration number"
                  className="h-11 w-full rounded-md border border-ink/15 bg-white pl-10 pr-3 text-sm outline-none focus:border-forest focus:ring-4 focus:ring-sage"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {['All', 'Compliant', 'Due Soon', 'Action Required'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-md border px-3 py-2 text-sm font-semibold ${statusFilter === status ? 'border-forest bg-sage text-forest' : 'border-ink/10 text-ink/60 hover:bg-paper'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-ink/45">
                Showing {filteredCompanies.length} of {companies.length} companies
              </p>
            </div>
          </div>
          <CompanyTable companies={filteredCompanies} onSelectCompany={onSelectCompany} />
        </div>

        <div className="space-y-6">
          <Panel title="Next best action">
            <div className="flex gap-3 rounded-md bg-sage p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-forest" />
              <p className="text-sm leading-6 text-ink/72">
                {allTasks.some((task) => task.status === 'open')
                  ? 'Review open follow-ups and resolve overdue client requests before generating filing packs.'
                  : 'Upload share registers for companies marked Action Required. Trust shareholders should trigger a Trust Deed request before BO finalisation.'}
              </p>
            </div>
          </Panel>
          <Panel title="Document queue">
            <QueueItem icon={<FileText />} title="Share Register" detail="Extract names, ID numbers and ownership percentages" />
            <QueueItem icon={<FileText />} title="Trust Deed" detail="Identify trustees, beneficiaries and natural persons" />
            <QueueItem icon={<FileText />} title="MoI" detail="Check control rights and special voting arrangements" />
          </Panel>
          <RecentActivityPanel activity={recentActivity} onSelectCompany={onSelectCompany} companies={companies} />
        </div>
      </section>
    </>
  );
}

function RecentActivityPanel({ activity, companies, onSelectCompany }) {
  const recent = (activity || []).slice(0, 6);
  const openCompany = (companyId) => {
    const company = companies.find((item) => String(item.id) === String(companyId));
    if (company) onSelectCompany(company);
  };

  return (
    <Panel title="Recent activity">
      <div className="space-y-3">
        {recent.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => openCompany(entry.companyId)}
            className="flex w-full gap-3 rounded-md border border-ink/10 bg-white p-3 text-left hover:bg-paper"
          >
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-sage text-forest">
              <Clock className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{activityActionLabel(entry.action)}</span>
              <span className="mt-0.5 block truncate text-xs text-ink/55">{entry.companyName} - {activityDetailLabel(entry)}</span>
              <span className="mt-1 block text-xs text-ink/40">{entry.createdAt ? new Date(entry.createdAt).toLocaleString('en-ZA') : 'Date not recorded'}</span>
            </span>
          </button>
        ))}
        {recent.length === 0 && (
          <p className="rounded-md border border-ink/10 bg-white p-4 text-sm leading-6 text-ink/55">
            No activity yet. Add or update a company record to start the practice audit trail.
          </p>
        )}
      </div>
    </Panel>
  );
}

function DeadlineWorkspace({ companies, onSelectCompany }) {
  const [filter, setFilter] = useState('all');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const withDays = companies
    .map((company) => {
      if (!company.nextDueDateRaw) return { ...company, daysUntilDue: null };
      const due = new Date(`${company.nextDueDateRaw}T00:00:00`);
      return { ...company, daysUntilDue: Math.round((due - today) / 86400000) };
    })
    .sort((a, b) => {
      if (a.daysUntilDue === null && b.daysUntilDue === null) return 0;
      if (a.daysUntilDue === null) return 1;
      if (b.daysUntilDue === null) return -1;
      return a.daysUntilDue - b.daysUntilDue;
    });

  const counts = {
    overdue: withDays.filter((c) => c.daysUntilDue !== null && c.daysUntilDue < 0).length,
    d30: withDays.filter((c) => c.daysUntilDue !== null && c.daysUntilDue >= 0 && c.daysUntilDue <= 30).length,
    d60: withDays.filter((c) => c.daysUntilDue !== null && c.daysUntilDue > 30 && c.daysUntilDue <= 60).length,
    d90: withDays.filter((c) => c.daysUntilDue !== null && c.daysUntilDue > 60 && c.daysUntilDue <= 90).length
  };

  const filtered = withDays.filter((c) => {
    if (filter === 'overdue') return c.daysUntilDue !== null && c.daysUntilDue < 0;
    if (filter === '30') return c.daysUntilDue !== null && c.daysUntilDue >= 0 && c.daysUntilDue <= 30;
    if (filter === '60') return c.daysUntilDue !== null && c.daysUntilDue >= 0 && c.daysUntilDue <= 60;
    if (filter === '90') return c.daysUntilDue !== null && c.daysUntilDue >= 0 && c.daysUntilDue <= 90;
    return true;
  });

  const filters = [
    { key: 'overdue', label: 'Overdue', count: counts.overdue, tone: 'red' },
    { key: '30', label: 'Next 30 days', count: counts.d30, tone: 'amber' },
    { key: '60', label: 'Next 60 days', count: counts.d30 + counts.d60, tone: 'amber' },
    { key: '90', label: 'Next 90 days', count: counts.d30 + counts.d60 + counts.d90, tone: 'default' },
    { key: 'all', label: 'All companies', count: withDays.length, tone: 'default' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-ink">Compliance deadlines</h3>
        <p className="mt-1 text-sm text-ink/60">CIPC filing due dates across your entire client book, sorted earliest first.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DeadlineStat label="Overdue" value={counts.overdue} tone="red" />
        <DeadlineStat label="Due within 30 days" value={counts.d30} tone="amber" />
        <DeadlineStat label="Due in 31–60 days" value={counts.d60} tone="default" />
        <DeadlineStat label="Due in 61–90 days" value={counts.d90} tone="default" />
      </div>

      <section className="rounded-lg border border-ink/10 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-ink/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-ink/60">
            Showing <span className="font-semibold text-ink">{filtered.length}</span> {filtered.length === 1 ? 'company' : 'companies'}
          </p>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                  filter === f.key
                    ? 'border-forest bg-sage text-forest'
                    : 'border-ink/10 text-ink/60 hover:bg-paper'
                }`}
              >
                {f.label}
                {f.count > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${filter === f.key ? 'bg-forest/10 text-forest' : 'bg-ink/8 text-ink/50'}`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-[0.08em] text-ink/50">
              <tr>
                <th className="px-5 py-4 font-semibold">Company</th>
                <th className="px-5 py-4 font-semibold">Registration</th>
                <th className="px-5 py-4 font-semibold">Compliance</th>
                <th className="px-5 py-4 font-semibold">Due date</th>
                <th className="px-5 py-4 font-semibold">Days</th>
                <th className="px-5 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {filtered.map((company) => (
                <tr key={company.id} className="hover:bg-paper/70">
                  <td className="px-5 py-4 font-medium text-ink">{company.name}</td>
                  <td className="px-5 py-4 text-ink/60">{company.registrationNumber}</td>
                  <td className="px-5 py-4"><StatusBadge status={company.status} /></td>
                  <td className="px-5 py-4 text-ink/60">{company.nextDueDate}</td>
                  <td className="px-5 py-4"><DaysChip days={company.daysUntilDue} /></td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => onSelectCompany(company)}
                      className="rounded-md border border-gold/60 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-gold/5"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-5 py-10 text-center text-sm text-ink/50" colSpan="6">
                    No companies match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DeadlineStat({ label, value, tone }) {
  const tones = {
    red: { num: 'text-red-700', bg: 'bg-red-50 border-red-100' },
    amber: { num: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
    default: { num: 'text-forest', bg: 'bg-white border-ink/10' }
  };
  const t = tones[tone] || tones.default;
  return (
    <div className={`rounded-lg border p-4 ${t.bg}`}>
      <p className="text-xs text-ink/55">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${t.num}`}>{value}</p>
    </div>
  );
}

function DaysChip({ days }) {
  if (days === null) return <span className="text-xs text-ink/40">No date set</span>;
  if (days < 0) {
    return (
      <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        {Math.abs(days)}d overdue
      </span>
    );
  }
  if (days === 0) {
    return <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Due today</span>;
  }
  if (days <= 30) {
    return <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{days}d remaining</span>;
  }
  return <span className="rounded-full border border-ink/10 bg-paper px-2.5 py-1 text-xs font-semibold text-ink/60">{days}d remaining</span>;
}

function FilingPackWorkspace({ companies, onSelectCompany }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white shadow-sm">
      <div className="border-b border-ink/10 px-5 py-5">
        <h3 className="text-xl font-semibold">CIPC Filing Pack</h3>
        <p className="mt-1 text-sm text-ink/60">Open a company to review readiness and download its BO Register and Mandate to File.</p>
      </div>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-[0.08em] text-ink/50">
            <tr>
              <th className="px-5 py-4">Company</th>
              <th className="px-5 py-4">Registration number</th>
              <th className="px-5 py-4">Readiness</th>
              <th className="px-5 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-paper/80">
                <td className="px-5 py-4 font-medium">{company.name}</td>
                <td className="px-5 py-4 text-ink/65">{company.registrationNumber}</td>
                <td className="px-5 py-4"><StatusBadge status={company.status} /></td>
                <td className="px-5 py-4">
                  <button onClick={() => onSelectCompany(company)} className="rounded-md border border-gold/60 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/5">
                    Open filing pack
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FollowUpsWorkspace({ tasks, onSelectCompany }) {
  const [typeFilter, setTypeFilter] = useState('All');
  const openTasks = tasks
    .filter((task) => task.status !== 'done')
    .filter((task) => typeFilter === 'All' || task.taskType === typeFilter)
    .sort((a, b) => taskSortDate(a).getTime() - taskSortDate(b).getTime());
  const taskTypes = ['All', ...Array.from(new Set(tasks.map((task) => task.taskType).filter(Boolean)))];

  return (
    <section className="rounded-lg border border-ink/10 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-ink/10 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Client follow-ups</h3>
          <p className="mt-1 text-sm text-ink/60">Open mandate, Trust Deed, approval and document requests across all companies.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {taskTypes.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`rounded-md border px-3 py-2 text-sm font-semibold ${typeFilter === type ? 'border-forest bg-sage text-forest' : 'border-ink/10 text-ink/60 hover:bg-paper'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-[0.08em] text-ink/50">
            <tr>
              <th className="px-5 py-4">Task</th>
              <th className="px-5 py-4">Company</th>
              <th className="px-5 py-4">Type</th>
              <th className="px-5 py-4">Contact</th>
              <th className="px-5 py-4">Due</th>
              <th className="px-5 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {openTasks.map((task) => (
              <tr key={task.id} className="hover:bg-paper/80">
                <td className="px-5 py-4">
                  <p className="font-medium">{task.title}</p>
                  {task.notes && <p className="mt-1 max-w-xs truncate text-xs text-ink/50">{task.notes}</p>}
                </td>
                <td className="px-5 py-4 text-ink/65">{task.companyName}</td>
                <td className="px-5 py-4 text-ink/65">{task.taskType || 'General'}</td>
                <td className="px-5 py-4 text-ink/65">{task.contactName || 'Unassigned'}</td>
                <td className="px-5 py-4"><DueBadge dueDate={task.dueDate} /></td>
                <td className="px-5 py-4">
                  <button onClick={() => onSelectCompany(task.company)} className="rounded-md border border-gold/60 px-4 py-2 text-sm font-semibold text-gold hover:bg-gold/5">
                    Open company
                  </button>
                </td>
              </tr>
            ))}
            {openTasks.length === 0 && (
              <tr>
                <td className="px-5 py-10 text-center text-ink/55" colSpan="6">No open follow-ups match the current filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DueBadge({ dueDate }) {
  const status = getDueStatus(dueDate);
  const styles = {
    overdue: 'border-red-200 bg-red-50 text-red-800',
    soon: 'border-amber-200 bg-amber-50 text-amber-800',
    later: 'border-ink/10 bg-white text-ink/60',
    none: 'border-ink/10 bg-white text-ink/45'
  };
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles[status.tone]}`}>{status.label}</span>;
}

function PlaceholderWorkspace({ title, detail, action }) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-8 shadow-sm">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">{detail}</p>
      <p className="mt-5 text-sm font-semibold text-gold">{action}</p>
    </section>
  );
}

function PracticeSettingsWorkspace({
  practice,
  practiceMembers,
  practiceInvitations,
  session,
  companies,
  hasSupabaseConfig,
  currentUserRole,
  permissions,
  databaseFeatures,
  onUpdatePracticeName,
  onExportPracticeData,
  onRestorePracticeData,
  onInvitePracticeMember,
  onRevokePracticeInvitation,
  isSaving
}) {
  const [practiceName, setPracticeName] = useState(practice?.name || 'Smith & Partners Inc.');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [qaChecks, setQaChecks] = useState(() => loadProductionQaChecks());
  const [restoreText, setRestoreText] = useState('');
  const restorePreview = useMemo(() => parsePracticeRestoreRows(restoreText, companies), [restoreText, companies]);
  const restoreValidRows = restorePreview.rows.filter((row) => row.valid);
  const restoreBlockedRows = restorePreview.rows.filter((row) => !row.valid);

  useEffect(() => {
    setPracticeName(practice?.name || 'Smith & Partners Inc.');
  }, [practice]);

  const submit = (event) => {
    event.preventDefault();
    onUpdatePracticeName(practiceName);
  };

  const submitInvite = (event) => {
    event.preventDefault();
    if (!inviteEmail.trim()) return;
    onInvitePracticeMember({ email: inviteEmail.trim().toLowerCase(), role: inviteRole });
    setInviteEmail('');
    setInviteRole('member');
  };

  const readRestoreFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRestoreText(String(reader.result || ''));
    reader.readAsText(file);
  };

  const submitRestore = async () => {
    if (!restorePreview.type || !restoreValidRows.length) return;
    await onRestorePracticeData(restorePreview);
    setRestoreText('');
  };

  const health = [
    { label: 'Supabase configuration', ok: hasSupabaseConfig, detail: hasSupabaseConfig ? 'Environment variables are present.' : 'Using local demo mode.' },
    { label: 'Authenticated user', ok: Boolean(session?.user?.email), detail: session?.user?.email || 'No active Supabase session.' },
    { label: 'Practice workspace', ok: Boolean(practice?.id), detail: practice?.id || 'No practice loaded.' },
    { label: 'Company table access', ok: Array.isArray(companies), detail: `${companies.length} companies loaded.` },
    { label: 'Membership records', ok: practiceMembers.length > 0 || !hasSupabaseConfig, detail: hasSupabaseConfig ? `${practiceMembers.length} member records visible.` : 'Skipped in demo mode.' },
    { label: 'Director workflow table', ok: !hasSupabaseConfig || databaseFeatures?.directorChanges?.available !== false, detail: databaseFeatures?.directorChanges?.available === false ? databaseFeatureUnavailableMessage('Director change filings', databaseFeatures.directorChanges) : 'Available or not checked yet.' },
    { label: 'Share workflow table', ok: !hasSupabaseConfig || databaseFeatures?.shareTransactions?.available !== false, detail: databaseFeatures?.shareTransactions?.available === false ? databaseFeatureUnavailableMessage('Share register maintenance', databaseFeatures.shareTransactions) : 'Available or not checked yet.' }
  ];
  const readiness = buildProductionReadiness({
    hasSupabaseConfig,
    envStatus: supabaseEnvStatus,
    session,
    practice,
    practiceMembers,
    currentUserRole,
    permissions,
    companies,
    databaseFeatures
  });
  const qaItems = buildProductionQaChecklist({ hasSupabaseConfig, session, practice, companies, qaChecks, databaseFeatures });
  const completedQa = qaItems.filter((item) => item.ok).length;
  const toggleQaCheck = (key) => {
    setQaChecks((current) => {
      const next = { ...current, [key]: !current[key] };
      saveProductionQaChecks(next);
      return next;
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-lg border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/10 px-5 py-5">
          <h3 className="text-xl font-semibold">Practice Settings</h3>
          <p className="mt-1 text-sm text-ink/60">Manage your practice workspace and confirm the database connection is healthy.</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink/45">Current role: {roleLabel(currentUserRole)}</p>
        </div>
        {!permissions.canManagePractice && (
          <div className="border-b border-ink/10 px-5 py-4">
            <AccessNotice title="Practice settings are restricted" detail="Only owners can rename the practice, invite members, or revoke invitations." />
          </div>
        )}
        <form onSubmit={submit} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <Field label="Practice name" value={practiceName} onChange={setPracticeName} placeholder="Practice name" />
          <button disabled={isSaving || !permissions.canManagePractice || !practiceName.trim()} className="rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white disabled:bg-ink/30">
            {isSaving ? 'Saving...' : 'Save practice'}
          </button>
        </form>
        <div className="border-t border-ink/10 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h4 className="font-semibold">Practice data export</h4>
              <p className="mt-1 text-sm leading-6 text-ink/60">
                Download CSV files for companies, registers, BO records, tasks, documents, filing packs and workflow history.
              </p>
              <p className="mt-1 text-xs leading-5 text-ink/45">
                Supabase mode fetches fresh company records for this practice. Demo mode exports the local workspace data.
              </p>
            </div>
            <button
              type="button"
              onClick={onExportPracticeData}
              disabled={isSaving || companies.length === 0}
              className="rounded-md border border-gold/60 px-5 py-3 text-sm font-semibold text-gold hover:bg-gold/5 disabled:cursor-not-allowed disabled:border-ink/15 disabled:text-ink/30"
            >
              Export CSV files
            </button>
          </div>
        </div>
        <div className="border-t border-ink/10 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h4 className="font-semibold">Practice data restore</h4>
              <p className="mt-1 text-sm leading-6 text-ink/60">
                Restore exported companies, registers, BO records, documents, filing packs and workflow history from CSV. Rows are previewed and linked to the current company records before import.
              </p>
              <p className="mt-1 text-xs leading-5 text-ink/45">
                Restore companies first, then restore related CSV files so shareholder and BO references can be preserved where possible.
              </p>
            </div>
            <label className="cursor-pointer rounded-md border border-ink/15 px-5 py-3 text-sm font-semibold text-ink/65 hover:bg-paper">
              Upload restore CSV
              <input type="file" accept=".csv,.txt" onChange={readRestoreFile} className="hidden" />
            </label>
          </div>
          <textarea
            value={restoreText}
            onChange={(event) => setRestoreText(event.target.value)}
            rows={5}
            placeholder="Paste a SecretarialDesk companies or tasks CSV export here"
            className="mt-4 w-full rounded-md border border-ink/15 bg-white p-3 text-sm outline-none focus:border-forest focus:ring-4 focus:ring-sage"
          />
          {restoreText.trim() && (
            <div className="mt-4 rounded-md border border-ink/10 bg-paper p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    Detected file: {restorePreview.type ? restoreDataTypeConfig(restorePreview.type)?.label || 'Companies' : 'Unsupported CSV'}
                  </p>
                  <p className="mt-1 text-sm text-ink/60">
                    {restoreValidRows.length} ready, {restoreBlockedRows.length} blocked.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={submitRestore}
                  disabled={isSaving || !permissions.canEditCompany || !restorePreview.type || restoreValidRows.length === 0}
                  className="rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/30"
                >
                  Restore {restoreValidRows.length || ''} rows
                </button>
              </div>
              {restorePreview.rows.length > 0 && (
                <div className="mt-4 max-w-full overflow-x-auto rounded-md border border-ink/10 bg-white">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-[0.08em] text-ink/50">
                      <tr>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Record</th>
                        <th className="px-4 py-3">Linked company</th>
                        <th className="px-4 py-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/10">
                      {restorePreview.rows.slice(0, 12).map((row) => (
                        <tr key={row.lineNumber}>
                          <td className="px-4 py-4">
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${row.valid ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
                              {row.valid ? 'Ready' : 'Blocked'}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-medium">{row.label}</td>
                          <td className="px-4 py-4 text-ink/65">{row.companyLabel || '-'}</td>
                          <td className="px-4 py-4 text-ink/65">{row.errors.length ? row.errors.join(' | ') : 'Ready to restore'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="border-t border-ink/10 p-5">
          <h4 className="font-semibold">Members</h4>
          <div className="mt-4 max-w-full overflow-x-auto rounded-md border border-ink/10">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-[0.08em] text-ink/50">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {practiceMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-4 text-ink/65">{member.user_id === session?.user?.id ? session.user.email : member.user_id}</td>
                    <td className="px-4 py-4 font-medium">{member.role}</td>
                    <td className="px-4 py-4 text-ink/65">{member.created_at ? new Date(member.created_at).toLocaleDateString('en-ZA') : 'Not set'}</td>
                  </tr>
                ))}
                {practiceMembers.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-ink/55" colSpan="3">No membership records visible.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="border-t border-ink/10 p-5">
          <h4 className="font-semibold">Invite team member</h4>
          <form onSubmit={submitInvite} className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_auto]">
            <Field type="email" label="Email" value={inviteEmail} onChange={setInviteEmail} placeholder="accountant@example.co.za" />
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Role</span>
              <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)} className="h-12 w-full rounded-md border border-ink/15 bg-white px-3 text-sm">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="read_only">Read-only</option>
              </select>
            </label>
            <button disabled={isSaving || !permissions.canManagePractice || !inviteEmail.trim()} className="self-end rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white disabled:bg-ink/30">
              Invite
            </button>
          </form>
          <div className="mt-5 max-w-full overflow-x-auto rounded-md border border-ink/10">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-[0.08em] text-ink/50">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Invited</th>
                  <th className="px-4 py-3">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {practiceInvitations.map((invite) => (
                  <tr key={invite.id}>
                    <td className="px-4 py-4 font-medium">{invite.email}</td>
                    <td className="px-4 py-4 text-ink/65">{invite.role}</td>
                    <td className="px-4 py-4"><InvitationStatus status={invite.status} /></td>
                    <td className="px-4 py-4 text-ink/65">{invite.created_at ? new Date(invite.created_at).toLocaleDateString('en-ZA') : 'Not set'}</td>
                    <td className="px-4 py-4">
                      {invite.status === 'pending' ? (
                        <button onClick={() => onRevokePracticeInvitation(invite.id)} disabled={isSaving || !permissions.canManagePractice} className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                          Revoke
                        </button>
                      ) : (
                        <span className="text-xs text-ink/45">No action</span>
                      )}
                    </td>
                  </tr>
                ))}
                {practiceInvitations.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-ink/55" colSpan="5">No invitations created yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-5 text-ink/50">
            This creates an invitation record. Email delivery and invite acceptance can be connected later with a Supabase Edge Function.
          </p>
        </div>
      </section>

      <Panel title="Health check">
        <div className="space-y-3">
          {health.map((item) => (
            <div key={item.label} className="flex gap-3 rounded-md border border-ink/10 bg-white p-3">
              <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border ${item.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                {item.ok ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              </span>
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-sm leading-6 text-ink/58">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Document storage">
        <StorageStatusPanel hasSupabaseConfig={hasSupabaseConfig} />
      </Panel>
      <Panel title="Production readiness">
        <div className="space-y-3">
          {readiness.map((item) => (
            <ReadinessCheck key={item.label} item={item} />
          ))}
        </div>
        <div className="mt-5 rounded-md bg-paper p-4">
          <p className="text-sm font-semibold">Deployment notes</p>
          <p className="mt-1 text-sm leading-6 text-ink/60">
            Set the two Vite Supabase environment variables in your host, confirm the private `company-documents` bucket policies, and use a production Supabase project before accepting live client records.
          </p>
        </div>
      </Panel>
      <Panel title="Production QA checklist">
        <div className="rounded-md bg-paper p-4">
          <p className="text-sm font-semibold">{completedQa} of {qaItems.length} checks complete</p>
          <p className="mt-1 text-sm leading-6 text-ink/60">Use this after running migrations and testing live Supabase persistence. Manual checks are stored in this browser.</p>
        </div>
        <div className="mt-4 space-y-3">
          {qaItems.map((item) => (
            <ProductionQaItem key={item.key} item={item} onToggle={() => item.manual && toggleQaCheck(item.key)} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ProductionQaItem({ item, onToggle }) {
  const tone = item.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : item.manual ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-red-200 bg-red-50 text-red-900';
  return (
    <div className={`rounded-md border p-3 ${tone}`}>
      <div className="flex items-start gap-3">
        {item.manual ? (
          <input type="checkbox" checked={item.ok} onChange={onToggle} className="mt-1 h-4 w-4 accent-forest" />
        ) : (
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-current/25 bg-white/55">
            {item.ok ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          </span>
        )}
        <div>
          <p className="text-sm font-semibold">{item.label}</p>
          <p className="mt-1 text-sm leading-6">{item.detail}</p>
        </div>
      </div>
    </div>
  );
}

function ReadinessCheck({ item }) {
  const tone = item.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : item.warning ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-red-200 bg-red-50 text-red-800';
  return (
    <div className={`rounded-md border p-3 ${tone}`}>
      <div className="flex gap-3">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-current/25 bg-white/55">
          {item.ok ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        </span>
        <div>
          <p className="text-sm font-semibold">{item.label}</p>
          <p className="mt-1 text-sm leading-6">{item.detail}</p>
        </div>
      </div>
    </div>
  );
}

function StorageStatusPanel({ hasSupabaseConfig }) {
  return (
    <div className="space-y-4">
      <div className={`rounded-md border p-4 ${hasSupabaseConfig ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
        <div className="flex gap-3">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-current/25 bg-white/55">
            {hasSupabaseConfig ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          </span>
          <div>
            <p className="text-sm font-semibold">{hasSupabaseConfig ? 'Secure storage enabled' : 'Demo storage mode'}</p>
            <p className="mt-1 text-sm leading-6">
              {hasSupabaseConfig
                ? 'Document and filing pack storage is managed by SecretarialDesk. Users do not need Supabase access.'
                : 'Uploads are shown in demo mode only. Connect Supabase before using live client documents.'}
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-md border border-ink/10 bg-paper p-4 text-sm leading-6 text-ink/65">
        <p className="font-semibold text-ink">Access model</p>
        <p className="mt-1">Practice users can only access files through the app, subject to their role and workspace membership.</p>
        <p className="mt-1">Platform storage policies are maintained by the SecretarialDesk deployment owner, not by accountant users.</p>
      </div>
    </div>
  );
}

function InvitationStatus({ status }) {
  const styles = {
    pending: 'border-amber-200 bg-amber-50 text-amber-800',
    accepted: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    revoked: 'border-ink/10 bg-paper text-ink/55'
  };
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles[status] || styles.pending}`}>{status}</span>;
}

function NavItem({ icon, label, active, compact, onClick }) {
  return (
    <button
      onClick={onClick}
      title={compact ? label : undefined}
      className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left ${compact ? 'justify-center' : ''} ${active ? 'bg-sage text-forest' : 'text-ink/65 hover:bg-ink/5'}`}
    >
      {React.cloneElement(icon, { className: 'h-5 w-5' })}
      {!compact && <span>{label}</span>}
    </button>
  );
}

function NotificationsPanel({ notifications, onClose, onOpenCompany }) {
  const styles = {
    critical: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    info: 'border-ink/10 bg-paper text-ink/60'
  };

  return (
    <div className="absolute right-0 top-12 z-40 w-[min(92vw,380px)] overflow-hidden rounded-lg border border-ink/10 bg-white shadow-panel">
      <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
        <div>
          <p className="font-semibold">Notifications</p>
          <p className="text-xs text-ink/50">Compliance items needing attention</p>
        </div>
        <button onClick={onClose} className="rounded-md border border-ink/10 p-1.5 text-ink/55 hover:bg-paper" aria-label="Close notifications">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="max-h-[420px] overflow-y-auto p-3">
        <div className="space-y-2">
          {notifications.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => item.company && onOpenCompany(item.company)}
              className="flex w-full gap-3 rounded-md border border-ink/10 p-3 text-left hover:bg-paper"
            >
              <span className={`mt-0.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${styles[item.tone] || styles.info}`}>
                {item.label}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{item.title}</span>
                <span className="mt-1 block text-xs leading-5 text-ink/55">{item.detail}</span>
              </span>
            </button>
          ))}
          {notifications.length === 0 && (
            <div className="rounded-md border border-ink/10 bg-paper p-4 text-sm leading-6 text-ink/55">
              No urgent notifications. Open follow-ups and compliance status are up to date.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, helper, alert }) {
  return (
    <div className="min-w-0 rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <p className="text-sm text-ink/55">{label}</p>
      <p className={`mt-3 break-words text-3xl font-semibold md:text-4xl ${alert ? 'text-red-700' : 'text-forest'}`}>{value}</p>
      <p className="mt-2 text-sm text-ink/55">{helper}</p>
    </div>
  );
}

function CompanyTable({ companies, compact = false, onSelectCompany }) {
  return (
    <div className="max-w-full overflow-x-auto">
      <table className={`w-full text-left text-sm ${compact ? 'min-w-[560px]' : 'min-w-[680px]'}`}>
        <thead className="border-b border-ink/10 bg-paper text-xs uppercase tracking-[0.08em] text-ink/50">
          <tr>
            <th className="px-5 py-4 font-semibold">Company</th>
            <th className="px-5 py-4 font-semibold">Registration number</th>
            <th className="px-5 py-4 font-semibold">Compliance Status</th>
            <th className="px-5 py-4 font-semibold">Next due date</th>
            {!compact && <th className="px-5 py-4 font-semibold">Shareholders</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/10">
          {companies.map((company) => (
            <tr
              key={company.id}
              onClick={() => onSelectCompany?.(company)}
              className={`${onSelectCompany ? 'cursor-pointer' : ''} hover:bg-paper/80`}
            >
              <td className="px-5 py-4 font-medium">{company.name}</td>
              <td className="px-5 py-4 text-ink/65">{company.registrationNumber}</td>
              <td className="px-5 py-4"><StatusBadge status={company.status} /></td>
              <td className="px-5 py-4 text-ink/65">{company.nextDueDate}</td>
              {!compact && <td className="px-5 py-4 text-ink/65">{company.shareholders}</td>}
            </tr>
          ))}
          {companies.length === 0 && (
            <tr>
              <td className="px-5 py-10 text-center text-ink/55" colSpan={compact ? 4 : 5}>
                No companies match the current search or filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Compliant: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Due Soon': 'bg-amber-50 text-amber-800 border-amber-200',
    'Action Required': 'bg-red-50 text-red-800 border-red-200'
  };
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}>{status}</span>;
}

function Panel({ title, children }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function QueueItem({ icon, title, detail }) {
  return (
    <div className="mb-4 flex gap-3 last:mb-0">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-paper text-forest">{React.cloneElement(icon, { className: 'h-5 w-5' })}</span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm leading-6 text-ink/58">{detail}</p>
      </div>
    </div>
  );
}

function CompanyModal({ onClose, onSubmit, isSaving, error }) {
  const [form, setForm] = useState({
    name: '',
    registrationNumber: '',
    type: 'Pty Ltd',
    incorporationDate: '',
    registeredAddress: ''
  });

  const canSubmit = form.name.trim() && form.registrationNumber.trim();

  const submit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      ...form,
      status: 'Action Required',
      nextDueDate: 'Not set',
      shareholders: 0
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4">
      <form onSubmit={submit} className="w-full max-w-4xl rounded-lg bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <div>
            <h2 className="text-2xl font-semibold">Add company</h2>
            <p className="text-sm text-ink/55">Enter the basic information as it appears on CIPC records.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-ink/10 p-2" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Company name" value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="e.g. Sunrise Solutions Pty Ltd" />
              <Field label="Registration number" value={form.registrationNumber} onChange={(registrationNumber) => setForm({ ...form, registrationNumber })} placeholder="e.g. 2022/123456/07" />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Company type</span>
                <div className="relative">
                  <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="h-12 w-full appearance-none rounded-md border border-ink/15 bg-white px-3 text-sm outline-none focus:border-forest focus:ring-4 focus:ring-sage">
                    <option>Pty Ltd</option>
                    <option>Public Company</option>
                    <option>Non-Profit Company</option>
                    <option>Personal Liability Company</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-5 w-5 text-ink/40" />
                </div>
              </label>
              <Field type="date" label="Incorporation date" value={form.incorporationDate} onChange={(incorporationDate) => setForm({ ...form, incorporationDate })} />
            </div>
            <Field label="Registered office address" value={form.registeredAddress} onChange={(registeredAddress) => setForm({ ...form, registeredAddress })} placeholder="Start typing address" />
          </div>
          <aside className="rounded-md border border-ink/10 bg-paper p-5">
            <h3 className="font-semibold">Why add your company?</h3>
            {['Track Compliance Status', 'Prepare BO register', 'Generate CIPC Filing Pack', 'Request Trust Deeds when a shareholder is a trust'].map((item) => (
              <p key={item} className="mt-4 flex gap-2 text-sm text-ink/70"><Check className="h-4 w-4 text-forest" /> {item}</p>
            ))}
          </aside>
        </div>
        <div className="flex justify-end gap-3 border-t border-ink/10 px-6 py-5">
          <button type="button" onClick={onClose} className="rounded-md border border-ink/15 px-5 py-3 text-sm font-semibold">Cancel</button>
          {error && <p className="mr-auto max-w-md text-sm text-red-700">{error}</p>}
          <button disabled={!canSubmit || isSaving} className="rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/30">
            {isSaving ? 'Saving...' : 'Save and continue'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-md border border-ink/15 bg-white px-3 text-sm outline-none focus:border-forest focus:ring-4 focus:ring-sage"
      />
    </label>
  );
}

createRoot(document.getElementById('root')).render(<App />);
