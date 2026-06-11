import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { api } from './api'
import type { Account, Bank, BankPayload, Transaction, User } from './types'
import './App.css'

type PublicPage = 'home' | 'login' | 'register'
type AdminView = 'dashboard' | 'users' | 'banks' | 'accounts' | 'operations' | 'history'
type ClientView = 'dashboard' | 'accounts' | 'operations' | 'history'
type Operation = 'deposit' | 'withdraw'
type NoticeTone = 'success' | 'error'
type LoginRole = 'client' | 'admin'

type Session =
  | {
      role: 'admin'
      label: string
    }
  | {
      role: 'client'
      userId: number
    }

type BankForm = {
  name: string
  code: string
  depositFee: string
  withdrawalFee: string
  minimumDepositAmount: string
  dailyWithdrawalLimit: string
}

type UserForm = {
  name: string
  email: string
  phone: string
}

const SESSION_KEY = 'gestion-transactions-session'
const ADMIN_ACCESS_CODE = 'admin'

const adminViews: Array<{ id: AdminView; label: string }> = [
  { id: 'dashboard', label: 'Admin' },
  { id: 'users', label: 'Utilisateurs' },
  { id: 'banks', label: 'Banques' },
  { id: 'accounts', label: 'Comptes' },
  { id: 'operations', label: 'Caisse' },
  { id: 'history', label: 'Historique' },
]

const clientViews: Array<{ id: ClientView; label: string }> = [
  { id: 'dashboard', label: 'Mon espace' },
  { id: 'accounts', label: 'Mes comptes' },
  { id: 'operations', label: 'Opérations' },
  { id: 'history', label: 'Historique' },
]

const emptyUserForm: UserForm = {
  name: '',
  email: '',
  phone: '',
}

const emptyBankForm: BankForm = {
  name: '',
  code: '',
  depositFee: '0',
  withdrawalFee: '0',
  minimumDepositAmount: '0',
  dailyWithdrawalLimit: '10000',
}

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XAF',
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function readStoredSession(): Session | null {
  const rawSession = localStorage.getItem(SESSION_KEY)
  if (!rawSession) {
    return null
  }

  try {
    const session = JSON.parse(rawSession) as Session
    if (session.role === 'admin' && typeof session.label === 'string') {
      return session
    }
    if (session.role === 'client' && typeof session.userId === 'number') {
      return session
    }
  } catch {
    localStorage.removeItem(SESSION_KEY)
  }

  return null
}

function formatCurrency(value: number | null | undefined): string {
  const numericValue = Number(value ?? 0)
  return currencyFormatter.format(Number.isFinite(numericValue) ? numericValue : 0)
}

function formatPercent(value: number | null | undefined): string {
  const numericValue = Number(value ?? 0)
  return `${percentFormatter.format(Number.isFinite(numericValue) ? numericValue : 0)} %`
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

function toNumber(value: string, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

function normalizeBankForm(form: BankForm): BankPayload {
  return {
    name: form.name.trim(),
    code: form.code.trim().toUpperCase(),
    depositFee: toNumber(form.depositFee),
    withdrawalFee: toNumber(form.withdrawalFee),
    minimumDepositAmount: toNumber(form.minimumDepositAmount),
    dailyWithdrawalLimit: toNumber(form.dailyWithdrawalLimit, 10000),
  }
}

function bankToForm(bank: Bank): BankForm {
  return {
    name: bank.name ?? '',
    code: bank.code ?? '',
    depositFee: String(bank.depositFee ?? 0),
    withdrawalFee: String(bank.withdrawalFee ?? 0),
    minimumDepositAmount: String(bank.minimumDepositAmount ?? 0),
    dailyWithdrawalLimit: String(bank.dailyWithdrawalLimit ?? 10000),
  }
}

function getTransactionTypeLabel(type: string): string {
  return type === 'DEPOT' ? 'Dépôt' : type === 'RETRAIT' ? 'Retrait' : type
}

function getUserName(account?: Account): string {
  return account?.user?.name || account?.userName || 'Utilisateur inconnu'
}

function getBankName(bank?: Bank): string {
  return bank?.name || 'Banque inconnue'
}

function Notice({ tone, message }: { tone: NoticeTone; message: string }) {
  return (
    <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {message}
    </div>
  )
}

function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string
  title: string
  action?: ReactNode
}) {
  return (
    <div className="section-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return <div className="empty-state">{label}</div>
}

function App() {
  const [publicPage, setPublicPage] = useState<PublicPage>('home')
  const [session, setSession] = useState<Session | null>(() => readStoredSession())
  const [adminView, setAdminView] = useState<AdminView>('dashboard')
  const [clientView, setClientView] = useState<ClientView>('dashboard')
  const [users, setUsers] = useState<User[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [activeBanks, setActiveBanks] = useState<Bank[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [clientScopedAccounts, setClientScopedAccounts] = useState<Account[]>([])
  const [clientScopedTransactions, setClientScopedTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [loginRole, setLoginRole] = useState<LoginRole>('client')
  const [loginForm, setLoginForm] = useState({
    email: '',
    phone: '',
    adminCode: '',
  })
  const [registerForm, setRegisterForm] = useState<UserForm>(emptyUserForm)
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm)
  const [bankForm, setBankForm] = useState<BankForm>(emptyBankForm)
  const [editingBankId, setEditingBankId] = useState<number | null>(null)
  const [editingBankForm, setEditingBankForm] = useState<BankForm>(emptyBankForm)
  const [accountForm, setAccountForm] = useState({
    userId: '',
    bankId: '',
    initialBalance: '0',
  })
  const [clientAccountForm, setClientAccountForm] = useState({
    bankId: '',
    initialBalance: '0',
  })
  const [membershipForm, setMembershipForm] = useState({
    userId: '',
    bankId: '',
  })
  const [operation, setOperation] = useState<Operation>('deposit')
  const [transactionForm, setTransactionForm] = useState({
    accountId: '',
    amount: '',
    name: '',
    phone: '',
  })
  const [historyType, setHistoryType] = useState<'ALL' | 'DEPOT' | 'RETRAIT'>('ALL')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [usersResult, activeBanksResult, banksResult, accountsResult, transactionsResult] =
        await Promise.all([
          api.getUsers(),
          api.getActiveBanks(),
          api.getAllBanks(),
          api.getAccounts(),
          api.getTransactions(),
        ])

      setUsers(usersResult)
      setActiveBanks(activeBanksResult)
      setBanks(banksResult)
      setAccounts(accountsResult)
      setTransactions(transactionsResult)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadClientData = useCallback(async (userId: number) => {
    try {
      const [accountsResult, transactionsResult] = await Promise.all([
        api.getAccountsByUser(userId),
        api.getTransactionsByUser(userId),
      ])

      setClientScopedAccounts(accountsResult)
      setClientScopedTransactions(
        [...transactionsResult].sort(
          (first, second) => new Date(second.date).getTime() - new Date(first.date).getTime(),
        ),
      )
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Impossible de charger les informations bancaires du client.',
      )
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (session?.role === 'client') {
      void loadClientData(session.userId)
      return
    }

    setClientScopedAccounts([])
    setClientScopedTransactions([])
  }, [loadClientData, session])

  useEffect(() => {
    if (!success) {
      return
    }

    const timeoutId = window.setTimeout(() => setSuccess(''), 4000)
    return () => window.clearTimeout(timeoutId)
  }, [success])

  useEffect(() => {
    if (!error) {
      return
    }

    const timeoutId = window.setTimeout(() => setError(''), 6500)
    return () => window.clearTimeout(timeoutId)
  }, [error])

  const orderedTransactions = useMemo(
    () =>
      [...transactions].sort(
        (first, second) => new Date(second.date).getTime() - new Date(first.date).getTime(),
      ),
    [transactions],
  )

  const currentUser = useMemo(() => {
    if (session?.role !== 'client') {
      return undefined
    }
    return users.find((user) => user.id === session.userId)
  }, [session, users])

  const clientAccounts = useMemo(() => {
    if (session?.role !== 'client') {
      return []
    }
    return clientScopedAccounts.length > 0
      ? clientScopedAccounts
      : accounts.filter((account) => (account.user?.id ?? account.userId) === session.userId)
  }, [accounts, clientScopedAccounts, session])

  const clientTransactions = useMemo(() => {
    if (session?.role !== 'client') {
      return []
    }
    return clientScopedTransactions.length > 0
      ? clientScopedTransactions
      : orderedTransactions.filter(
          (transaction) => (transaction.account?.user?.id ?? transaction.account?.userId) === session.userId,
        )
  }, [clientScopedTransactions, orderedTransactions, session])

  const metrics = useMemo(() => {
    const totalBalance = accounts.reduce((sum, account) => sum + (account.balance ?? 0), 0)
    const totalFees = transactions.reduce((sum, transaction) => sum + (transaction.fee ?? 0), 0)
    const totalDeposits = transactions
      .filter((transaction) => transaction.type === 'DEPOT')
      .reduce((sum, transaction) => sum + (transaction.netAmount ?? 0), 0)
    const totalWithdrawals = transactions
      .filter((transaction) => transaction.type === 'RETRAIT')
      .reduce((sum, transaction) => sum + (transaction.netAmount ?? 0), 0)

    return {
      totalBalance,
      totalFees,
      totalDeposits,
      totalWithdrawals,
    }
  }, [accounts, transactions])

  const clientMetrics = useMemo(() => {
    const totalBalance = clientAccounts.reduce((sum, account) => sum + (account.balance ?? 0), 0)
    const totalFees = clientTransactions.reduce((sum, transaction) => sum + (transaction.fee ?? 0), 0)
    const totalDeposits = clientTransactions
      .filter((transaction) => transaction.type === 'DEPOT')
      .reduce((sum, transaction) => sum + (transaction.netAmount ?? 0), 0)
    const totalWithdrawals = clientTransactions
      .filter((transaction) => transaction.type === 'RETRAIT')
      .reduce((sum, transaction) => sum + (transaction.netAmount ?? 0), 0)

    return {
      totalBalance,
      totalFees,
      totalDeposits,
      totalWithdrawals,
    }
  }, [clientAccounts, clientTransactions])

  function persistSession(nextSession: Session | null) {
    setSession(nextSession)
    if (nextSession) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    } else {
      localStorage.removeItem(SESSION_KEY)
      setPublicPage('home')
    }
  }

  async function runAction(action: () => Promise<void>, message: string) {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await action()
      setSuccess(message)
      await loadData()
      if (session?.role === 'client') {
        await loadClientData(session.userId)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Action impossible.')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (loginRole === 'admin') {
        if (loginForm.adminCode.trim() !== ADMIN_ACCESS_CODE) {
          throw new Error('Code administrateur incorrect.')
        }
        persistSession({ role: 'admin', label: loginForm.email.trim() || 'Administrateur' })
        setAdminView('dashboard')
        setSuccess('Connexion administrateur réussie.')
        return
      }

      const latestUsers = await api.getUsers()
      setUsers(latestUsers)
      const user = latestUsers.find(
        (item) =>
          item.email.toLowerCase() === loginForm.email.trim().toLowerCase() &&
          normalizePhone(item.phone) === normalizePhone(loginForm.phone),
      )

      if (!user) {
        throw new Error('Aucun client ne correspond aux informations saisies.')
      }

      persistSession({ role: 'client', userId: user.id })
      setClientView('dashboard')
      setSuccess('Connexion client réussie.')
      await loadData()
      await loadClientData(user.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Connexion impossible.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const createdUser = await api.createUser({
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        phone: registerForm.phone.trim(),
      })
      setRegisterForm(emptyUserForm)
      persistSession({ role: 'client', userId: createdUser.id })
      setClientView('dashboard')
      setSuccess('Compte client créé avec succès.')
      await loadData()
      await loadClientData(createdUser.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Inscription impossible.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runAction(async () => {
      await api.createUser({
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim(),
      })
      setUserForm(emptyUserForm)
    }, 'Utilisateur créé avec succès.')
  }

  async function handleCreateBank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runAction(async () => {
      await api.createBank(normalizeBankForm(bankForm))
      setBankForm(emptyBankForm)
    }, 'Banque créée avec succès.')
  }

  async function handleUpdateBank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingBankId) {
      return
    }

    await runAction(async () => {
      await api.updateBank(editingBankId, normalizeBankForm(editingBankForm))
      setEditingBankId(null)
      setEditingBankForm(emptyBankForm)
    }, 'Banque mise à jour avec succès.')
  }

  async function handleDeactivateBank(id: number) {
    const shouldDeactivate = window.confirm('Désactiver cette banque ?')
    if (!shouldDeactivate) {
      return
    }

    await runAction(async () => {
      await api.deactivateBank(id)
    }, 'Banque désactivée.')
  }

  async function handleCreateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runAction(async () => {
      await api.createAccount({
        userId: toNumber(accountForm.userId),
        bankId: toNumber(accountForm.bankId),
        initialBalance: toNumber(accountForm.initialBalance),
      })
      setAccountForm({ userId: '', bankId: '', initialBalance: '0' })
    }, 'Compte créé avec succès.')
  }

  async function handleCreateClientAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (session?.role !== 'client') {
      setError('Session client introuvable.')
      return
    }

    const clientUserId = session.userId
    await runAction(async () => {
      await api.createAccount({
        userId: clientUserId,
        bankId: toNumber(clientAccountForm.bankId),
        initialBalance: toNumber(clientAccountForm.initialBalance),
      })
      setClientAccountForm({ bankId: '', initialBalance: '0' })
    }, 'Compte ouvert avec succès.')
  }

  async function handleAddBankToUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runAction(async () => {
      await api.addBankToUser(toNumber(membershipForm.userId), toNumber(membershipForm.bankId))
    }, 'Banque associée à l’utilisateur.')
  }

  async function handleRemoveBankFromUser() {
    await runAction(async () => {
      await api.removeBankFromUser(toNumber(membershipForm.userId), toNumber(membershipForm.bankId))
    }, 'Banque retirée de l’utilisateur.')
  }

  async function handleTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await runAction(async () => {
      const accountId = toNumber(transactionForm.accountId)
      const amount = toNumber(transactionForm.amount)
      const name = transactionForm.name.trim()
      const phone = transactionForm.phone.trim()

      if (operation === 'deposit') {
        await api.deposit({
          id: accountId,
          amount,
          depositorName: name,
          depositorPhone: phone,
        })
      } else {
        await api.withdraw({
          id: accountId,
          amount,
          userName: name,
          userPhone: phone,
        })
      }

      setTransactionForm((current) => ({ ...current, amount: '' }))
    }, operation === 'deposit' ? 'Dépôt enregistré.' : 'Retrait enregistré.')
  }

  function handleTransactionAccountChange(accountId: string) {
    const account = [...accounts, ...clientScopedAccounts].find((item) => String(item.id) === accountId)
    setTransactionForm({
      accountId,
      amount: '',
      name: account?.user?.name ?? account?.userName ?? '',
      phone: account?.user?.phone ?? account?.userPhone ?? '',
    })
  }

  function startBankEdition(bank: Bank) {
    setEditingBankId(bank.id)
    setEditingBankForm(bankToForm(bank))
  }

  function renderPublicShell(content: ReactNode) {
    return (
      <div className="public-shell">
        <header className="public-nav">
          <button className="brand-button" onClick={() => setPublicPage('home')} type="button">
            <span className="brand-mark">GT</span>
            <span>Gestion Transactions</span>
          </button>
          <nav>
            <button className={publicPage === 'home' ? 'active' : ''} onClick={() => setPublicPage('home')} type="button">
              Accueil
            </button>
            <button className={publicPage === 'login' ? 'active' : ''} onClick={() => setPublicPage('login')} type="button">
              Connexion
            </button>
            <button
              className={publicPage === 'register' ? 'active' : ''}
              onClick={() => setPublicPage('register')}
              type="button"
            >
              Inscription
            </button>
          </nav>
        </header>
        <div className="notice-stack public-notices">
          {error ? <Notice message={error} tone="error" /> : null}
          {success ? <Notice message={success} tone="success" /> : null}
        </div>
        {content}
      </div>
    )
  }

  function renderHomePage() {
    return renderPublicShell(
      <main className="landing-page">
        <section className="landing-hero">
          <div>
            <span className="eyebrow">Plateforme bancaire</span>
            <h1>Gestion Transactions</h1>
            <p>
              Une interface pour piloter les banques, les comptes et les opérations avec un espace
              client séparé de l’administration.
            </p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => setPublicPage('register')} type="button">
                Créer un compte
              </button>
              <button className="secondary-button" onClick={() => setPublicPage('login')} type="button">
                Se connecter
              </button>
            </div>
          </div>
          <div className="product-preview" aria-hidden="true">
            <div className="preview-topline">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="preview-grid">
              <div>
                <small>Solde</small>
                <strong>{formatCurrency(metrics.totalBalance)}</strong>
              </div>
              <div>
                <small>Banques</small>
                <strong>{activeBanks.length}</strong>
              </div>
              <div>
                <small>Transactions</small>
                <strong>{transactions.length}</strong>
              </div>
            </div>
            <div className="preview-list">
              {orderedTransactions.slice(0, 3).map((transaction) => (
                <span key={transaction.id}>
                  <b>{getTransactionTypeLabel(transaction.type)}</b>
                  {formatCurrency(transaction.amount)}
                </span>
              ))}
              {orderedTransactions.length === 0 ? (
                <>
                  <span>
                    <b>Dépôt</b>
                    {formatCurrency(25000)}
                  </span>
                  <span>
                    <b>Retrait</b>
                    {formatCurrency(8000)}
                  </span>
                  <span>
                    <b>Dépôt</b>
                    {formatCurrency(12000)}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </section>

        <section className="landing-band">
          <article>
            <span>Admin</span>
            <strong>Gestion complète</strong>
          </article>
          <article>
            <span>Client</span>
            <strong>Comptes personnels</strong>
          </article>
          <article>
            <span>API</span>
            <strong>Spring Boot</strong>
          </article>
        </section>
      </main>,
    )
  }

  function renderLoginPage() {
    return renderPublicShell(
      <main className="auth-page">
        <form className="auth-card" onSubmit={handleLogin}>
          <span className="eyebrow">Connexion</span>
          <h1>Accéder à votre espace</h1>
          <div className="segmented-control" role="tablist" aria-label="Type de compte">
            <button
              aria-selected={loginRole === 'client'}
              className={loginRole === 'client' ? 'active' : ''}
              onClick={() => setLoginRole('client')}
              type="button"
            >
              Client
            </button>
            <button
              aria-selected={loginRole === 'admin'}
              className={loginRole === 'admin' ? 'active' : ''}
              onClick={() => setLoginRole('admin')}
              type="button"
            >
              Admin
            </button>
          </div>
          <label>
            Email
            <input
              required
              type="email"
              value={loginForm.email}
              onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
            />
          </label>
          {loginRole === 'client' ? (
            <label>
              Téléphone
              <input
                required
                value={loginForm.phone}
                onChange={(event) => setLoginForm({ ...loginForm, phone: event.target.value })}
              />
            </label>
          ) : (
            <label>
              Code administrateur
              <input
                required
                type="password"
                value={loginForm.adminCode}
                onChange={(event) => setLoginForm({ ...loginForm, adminCode: event.target.value })}
              />
            </label>
          )}
          <button className="primary-button" disabled={saving} type="submit">
            Se connecter
          </button>
          <button className="text-button" onClick={() => setPublicPage('register')} type="button">
            Créer un compte client
          </button>
        </form>
      </main>,
    )
  }

  function renderRegisterPage() {
    return renderPublicShell(
      <main className="auth-page">
        <form className="auth-card" onSubmit={handleRegister}>
          <span className="eyebrow">Inscription</span>
          <h1>Créer un compte client</h1>
          <label>
            Nom complet
            <input
              required
              value={registerForm.name}
              onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })}
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={registerForm.email}
              onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })}
            />
          </label>
          <label>
            Téléphone
            <input
              required
              value={registerForm.phone}
              onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })}
            />
          </label>
          <button className="primary-button" disabled={saving} type="submit">
            S’inscrire
          </button>
          <button className="text-button" onClick={() => setPublicPage('login')} type="button">
            J’ai déjà un compte
          </button>
        </form>
      </main>,
    )
  }

  function renderAdminDashboard() {
    const recentTransactions = orderedTransactions.slice(0, 6)

    return (
      <main className="view-space">
        <SectionHeader eyebrow="Administration" title="Tableau de bord admin" />

        <section className="stat-grid" aria-label="Indicateurs administrateur">
          <article className="stat-card">
            <span>Solde total</span>
            <strong>{formatCurrency(metrics.totalBalance)}</strong>
          </article>
          <article className="stat-card">
            <span>Utilisateurs</span>
            <strong>{users.length}</strong>
          </article>
          <article className="stat-card">
            <span>Banques actives</span>
            <strong>{activeBanks.length}</strong>
          </article>
          <article className="stat-card">
            <span>Frais cumulés</span>
            <strong>{formatCurrency(metrics.totalFees)}</strong>
          </article>
        </section>

        <section className="split-layout">
          <div className="panel">
            <SectionHeader eyebrow="Flux global" title="Dernières opérations" />
            {recentTransactions.length === 0 ? (
              <EmptyState label="Aucune transaction enregistrée." />
            ) : (
              <TransactionTable transactions={recentTransactions} compact />
            )}
          </div>

          <div className="panel">
            <SectionHeader eyebrow="Volumes" title="Mouvements nets" />
            <div className="amount-stack">
              <div>
                <span>Dépôts nets</span>
                <strong>{formatCurrency(metrics.totalDeposits)}</strong>
              </div>
              <div>
                <span>Retraits servis</span>
                <strong>{formatCurrency(metrics.totalWithdrawals)}</strong>
              </div>
              <div>
                <span>Comptes ouverts</span>
                <strong>{accounts.length}</strong>
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  function renderClientDashboard() {
    const recentTransactions = clientTransactions.slice(0, 6)

    return (
      <main className="view-space">
        <SectionHeader eyebrow="Espace client" title={`Bonjour ${currentUser?.name ?? ''}`} />

        <section className="stat-grid" aria-label="Indicateurs client">
          <article className="stat-card">
            <span>Solde total</span>
            <strong>{formatCurrency(clientMetrics.totalBalance)}</strong>
          </article>
          <article className="stat-card">
            <span>Mes comptes</span>
            <strong>{clientAccounts.length}</strong>
          </article>
          <article className="stat-card">
            <span>Dépôts nets</span>
            <strong>{formatCurrency(clientMetrics.totalDeposits)}</strong>
          </article>
          <article className="stat-card">
            <span>Frais payés</span>
            <strong>{formatCurrency(clientMetrics.totalFees)}</strong>
          </article>
        </section>

        <section className="split-layout">
          <div className="panel">
            <SectionHeader eyebrow="Activité" title="Mes dernières opérations" />
            {recentTransactions.length === 0 ? (
              <EmptyState label="Aucune transaction sur vos comptes." />
            ) : (
              <TransactionTable transactions={recentTransactions} compact />
            )}
          </div>

          <div className="panel">
            <SectionHeader eyebrow="Profil" title="Informations client" />
            <div className="detail-list">
              <div>
                <span>Nom</span>
                <strong>{currentUser?.name ?? '-'}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{currentUser?.email ?? '-'}</strong>
              </div>
              <div>
                <span>Téléphone</span>
                <strong>{currentUser?.phone ?? '-'}</strong>
              </div>
              <div>
                <span>Retraits servis</span>
                <strong>{formatCurrency(clientMetrics.totalWithdrawals)}</strong>
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }

  function renderUsers() {
    return (
      <main className="view-space">
        <SectionHeader eyebrow="Clients" title="Utilisateurs et banques liées" />

        <section className="split-layout">
          <form className="panel form-grid" onSubmit={handleCreateUser}>
            <h3>Nouvel utilisateur</h3>
            <label>
              Nom complet
              <input
                required
                value={userForm.name}
                onChange={(event) => setUserForm({ ...userForm, name: event.target.value })}
              />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                value={userForm.email}
                onChange={(event) => setUserForm({ ...userForm, email: event.target.value })}
              />
            </label>
            <label>
              Téléphone
              <input
                required
                value={userForm.phone}
                onChange={(event) => setUserForm({ ...userForm, phone: event.target.value })}
              />
            </label>
            <button className="primary-button" disabled={saving} type="submit">
              Créer l’utilisateur
            </button>
          </form>

          <form className="panel form-grid" onSubmit={handleAddBankToUser}>
            <h3>Association banque</h3>
            <label>
              Utilisateur
              <select
                required
                value={membershipForm.userId}
                onChange={(event) =>
                  setMembershipForm({ ...membershipForm, userId: event.target.value })
                }
              >
                <option value="">Choisir</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Banque active
              <select
                required
                value={membershipForm.bankId}
                onChange={(event) =>
                  setMembershipForm({ ...membershipForm, bankId: event.target.value })
                }
              >
                <option value="">Choisir</option>
                {activeBanks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name} ({bank.code})
                  </option>
                ))}
              </select>
            </label>
            <div className="button-row">
              <button className="primary-button" disabled={saving} type="submit">
                Associer
              </button>
              <button
                className="secondary-button"
                disabled={saving || !membershipForm.userId || !membershipForm.bankId}
                onClick={() => void handleRemoveBankFromUser()}
                type="button"
              >
                Retirer
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <SectionHeader eyebrow="Registre" title="Liste des utilisateurs" />
          {users.length === 0 ? (
            <EmptyState label="Aucun utilisateur." />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Banques</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>
                        <div className="tag-list">
                          {(user.banks ?? []).length === 0 ? (
                            <span className="muted">Aucune</span>
                          ) : (
                            user.banks?.map((bank) => (
                              <span className="tag" key={bank.id}>
                                {bank.code}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    )
  }

  function renderBanks() {
    return (
      <main className="view-space">
        <SectionHeader eyebrow="Paramètres" title="Banques, frais et limites" />

        <section className="split-layout">
          <form className="panel form-grid" onSubmit={handleCreateBank}>
            <h3>Nouvelle banque</h3>
            <BankFields form={bankForm} onChange={setBankForm} />
            <button className="primary-button" disabled={saving} type="submit">
              Créer la banque
            </button>
          </form>

          <form className="panel form-grid" onSubmit={handleUpdateBank}>
            <h3>Modifier une banque</h3>
            {editingBankId ? (
              <>
                <BankFields form={editingBankForm} onChange={setEditingBankForm} />
                <div className="button-row">
                  <button className="primary-button" disabled={saving} type="submit">
                    Enregistrer
                  </button>
                  <button className="secondary-button" onClick={() => setEditingBankId(null)} type="button">
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <EmptyState label="Aucune banque sélectionnée." />
            )}
          </form>
        </section>

        <section className="panel">
          <SectionHeader eyebrow="Catalogue" title="Toutes les banques" />
          {banks.length === 0 ? (
            <EmptyState label="Aucune banque." />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Code</th>
                    <th>Dépôt</th>
                    <th>Retrait</th>
                    <th>Min. dépôt</th>
                    <th>Limite jour</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {banks.map((bank) => (
                    <tr key={bank.id}>
                      <td>{bank.name}</td>
                      <td>{bank.code}</td>
                      <td>{formatPercent(bank.depositFee)}</td>
                      <td>{formatPercent(bank.withdrawalFee)}</td>
                      <td>{formatCurrency(bank.minimumDepositAmount)}</td>
                      <td>{formatCurrency(bank.dailyWithdrawalLimit)}</td>
                      <td>
                        <span className={`status ${bank.active ? 'active' : 'inactive'}`}>
                          {bank.active ? 'Active' : 'Désactivée'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="small-button" onClick={() => startBankEdition(bank)} type="button">
                            Modifier
                          </button>
                          <button
                            className="small-button danger"
                            disabled={saving || !bank.active}
                            onClick={() => void handleDeactivateBank(bank.id)}
                            type="button"
                          >
                            Désactiver
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    )
  }

  function renderAccounts() {
    return (
      <main className="view-space">
        <SectionHeader eyebrow="Comptes" title="Ouverture et soldes" />

        <section className="split-layout">
          <form className="panel form-grid" onSubmit={handleCreateAccount}>
            <h3>Nouveau compte</h3>
            <label>
              Utilisateur
              <select
                required
                value={accountForm.userId}
                onChange={(event) => setAccountForm({ ...accountForm, userId: event.target.value })}
              >
                <option value="">Choisir</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Banque active
              <select
                required
                value={accountForm.bankId}
                onChange={(event) => setAccountForm({ ...accountForm, bankId: event.target.value })}
              >
                <option value="">Choisir</option>
                {activeBanks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name} ({bank.code})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Solde initial
              <input
                min="0"
                step="1"
                type="number"
                value={accountForm.initialBalance}
                onChange={(event) =>
                  setAccountForm({ ...accountForm, initialBalance: event.target.value })
                }
              />
            </label>
            <button className="primary-button" disabled={saving} type="submit">
              Ouvrir le compte
            </button>
          </form>

          <div className="panel">
            <SectionHeader eyebrow="Synthèse" title="Portefeuille global" />
            <div className="amount-stack">
              <div>
                <span>Solde total</span>
                <strong>{formatCurrency(metrics.totalBalance)}</strong>
              </div>
              <div>
                <span>Compte moyen</span>
                <strong>
                  {formatCurrency(accounts.length > 0 ? metrics.totalBalance / accounts.length : 0)}
                </strong>
              </div>
              <div>
                <span>Banques utilisables</span>
                <strong>{activeBanks.length}</strong>
              </div>
            </div>
          </div>
        </section>

        <AccountTable accounts={accounts} />
      </main>
    )
  }

  function renderClientAccounts() {
    return (
      <main className="view-space">
        <SectionHeader eyebrow="Client" title="Mes comptes bancaires" />

        <section className="split-layout">
          <form className="panel form-grid" onSubmit={handleCreateClientAccount}>
            <h3>Ouvrir un compte</h3>
            <label>
              Banque
              <select
                required
                value={clientAccountForm.bankId}
                onChange={(event) =>
                  setClientAccountForm({ ...clientAccountForm, bankId: event.target.value })
                }
              >
                <option value="">Choisir</option>
                {activeBanks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name} ({bank.code})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Solde initial
              <input
                min="0"
                step="1"
                type="number"
                value={clientAccountForm.initialBalance}
                onChange={(event) =>
                  setClientAccountForm({ ...clientAccountForm, initialBalance: event.target.value })
                }
              />
            </label>
            <button
              className="primary-button"
              disabled={saving || session?.role !== 'client'}
              type="submit"
            >
              Ouvrir le compte
            </button>
          </form>

          <div className="panel">
            <SectionHeader eyebrow="Synthèse" title="Mon portefeuille" />
            <div className="amount-stack">
              <div>
                <span>Solde total</span>
                <strong>{formatCurrency(clientMetrics.totalBalance)}</strong>
              </div>
              <div>
                <span>Nombre de comptes</span>
                <strong>{clientAccounts.length}</strong>
              </div>
              <div>
                <span>Frais payés</span>
                <strong>{formatCurrency(clientMetrics.totalFees)}</strong>
              </div>
            </div>
          </div>
        </section>

        <AccountTable accounts={clientAccounts} />
      </main>
    )
  }

  function renderOperations(availableAccounts: Account[], title = 'Dépôts et retraits') {
    const selectedAccount = availableAccounts.find(
      (account) => String(account.id) === transactionForm.accountId,
    )
    const selectedBank = selectedAccount?.bank

    return (
      <main className="view-space">
        <SectionHeader eyebrow="Caisse" title={title} />

        <section className="split-layout">
          <form className="panel form-grid" onSubmit={handleTransaction}>
            <h3>{operation === 'deposit' ? 'Nouveau dépôt' : 'Nouveau retrait'}</h3>
            <div className="segmented-control" role="tablist" aria-label="Type d'opération">
              <button
                aria-selected={operation === 'deposit'}
                className={operation === 'deposit' ? 'active' : ''}
                onClick={() => setOperation('deposit')}
                type="button"
              >
                Dépôt
              </button>
              <button
                aria-selected={operation === 'withdraw'}
                className={operation === 'withdraw' ? 'active' : ''}
                onClick={() => setOperation('withdraw')}
                type="button"
              >
                Retrait
              </button>
            </div>
            <label>
              Compte
              <select
                required
                value={transactionForm.accountId}
                onChange={(event) => handleTransactionAccountChange(event.target.value)}
              >
                <option value="">Choisir</option>
                {availableAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.accountNumber} - {getUserName(account)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Montant
              <input
                min="1"
                required
                step="1"
                type="number"
                value={transactionForm.amount}
                onChange={(event) =>
                  setTransactionForm({ ...transactionForm, amount: event.target.value })
                }
              />
            </label>
            <label>
              Nom
              <input
                required
                value={transactionForm.name}
                onChange={(event) =>
                  setTransactionForm({ ...transactionForm, name: event.target.value })
                }
              />
            </label>
            <label>
              Téléphone
              <input
                required
                value={transactionForm.phone}
                onChange={(event) =>
                  setTransactionForm({ ...transactionForm, phone: event.target.value })
                }
              />
            </label>
            <button className="primary-button" disabled={saving || availableAccounts.length === 0} type="submit">
              {operation === 'deposit' ? 'Enregistrer le dépôt' : 'Enregistrer le retrait'}
            </button>
          </form>

          <div className="panel">
            <SectionHeader eyebrow="Compte choisi" title="Détails bancaires" />
            {selectedAccount ? (
              <div className="detail-list">
                <div>
                  <span>N° compte</span>
                  <strong>{selectedAccount.accountNumber}</strong>
                </div>
                <div>
                  <span>Utilisateur</span>
                  <strong>{getUserName(selectedAccount)}</strong>
                </div>
                <div>
                  <span>Solde</span>
                  <strong>{formatCurrency(selectedAccount.balance)}</strong>
                </div>
                <div>
                  <span>Banque</span>
                  <strong>{getBankName(selectedBank)}</strong>
                </div>
                <div>
                  <span>Frais dépôt</span>
                  <strong>{formatPercent(selectedBank?.depositFee)}</strong>
                </div>
                <div>
                  <span>Frais retrait</span>
                  <strong>{formatPercent(selectedBank?.withdrawalFee)}</strong>
                </div>
                <div>
                  <span>Min. dépôt</span>
                  <strong>{formatCurrency(selectedBank?.minimumDepositAmount)}</strong>
                </div>
                <div>
                  <span>Limite retrait</span>
                  <strong>{formatCurrency(selectedBank?.dailyWithdrawalLimit)}</strong>
                </div>
              </div>
            ) : (
              <EmptyState label="Aucun compte sélectionné." />
            )}
          </div>
        </section>
      </main>
    )
  }

  function renderHistory(transactionsToDisplay: Transaction[], title = 'Historique des transactions') {
    const visibleTransactions =
      historyType === 'ALL'
        ? transactionsToDisplay
        : transactionsToDisplay.filter((transaction) => transaction.type === historyType)

    return (
      <main className="view-space">
        <SectionHeader
          action={
            <select
              className="compact-select"
              value={historyType}
              onChange={(event) =>
                setHistoryType(event.target.value as 'ALL' | 'DEPOT' | 'RETRAIT')
              }
            >
              <option value="ALL">Toutes</option>
              <option value="DEPOT">Dépôts</option>
              <option value="RETRAIT">Retraits</option>
            </select>
          }
          eyebrow="Journal"
          title={title}
        />

        <section className="panel">
          {visibleTransactions.length === 0 ? (
            <EmptyState label="Aucune transaction." />
          ) : (
            <TransactionTable transactions={visibleTransactions} />
          )}
        </section>
      </main>
    )
  }

  function renderAdminShell() {
    return (
      <DashboardShell
        label={session?.role === 'admin' ? session.label : 'Administrateur'}
        navItems={adminViews}
        activeView={adminView}
        brand="GT Admin"
        onChangeView={(view) => setAdminView(view)}
        onLogout={() => persistSession(null)}
        onRefresh={() => void loadData()}
        loading={loading}
        saving={saving}
      >
        {adminView === 'dashboard' ? renderAdminDashboard() : null}
        {adminView === 'users' ? renderUsers() : null}
        {adminView === 'banks' ? renderBanks() : null}
        {adminView === 'accounts' ? renderAccounts() : null}
        {adminView === 'operations' ? renderOperations(accounts) : null}
        {adminView === 'history' ? renderHistory(orderedTransactions) : null}
      </DashboardShell>
    )
  }

  function renderClientShell() {
    return (
      <DashboardShell
        label={currentUser?.name ?? 'Client'}
        navItems={clientViews}
        activeView={clientView}
        brand="GT Client"
        onChangeView={(view) => setClientView(view)}
        onLogout={() => persistSession(null)}
        onRefresh={() => void loadData()}
        loading={loading}
        saving={saving}
      >
        {clientView === 'dashboard' ? renderClientDashboard() : null}
        {clientView === 'accounts' ? renderClientAccounts() : null}
        {clientView === 'operations' ? renderOperations(clientAccounts, 'Mes opérations') : null}
        {clientView === 'history' ? renderHistory(clientTransactions, 'Mon historique') : null}
      </DashboardShell>
    )
  }

  if (!session) {
    if (publicPage === 'login') {
      return renderLoginPage()
    }
    if (publicPage === 'register') {
      return renderRegisterPage()
    }
    return renderHomePage()
  }

  return (
    <>
      <div className="notice-stack floating-notices">
        {error ? <Notice message={error} tone="error" /> : null}
        {success ? <Notice message={success} tone="success" /> : null}
      </div>
      {session.role === 'admin' ? renderAdminShell() : renderClientShell()}
    </>
  )
}

function DashboardShell<ViewId extends string>({
  label,
  navItems,
  activeView,
  brand,
  onChangeView,
  onLogout,
  onRefresh,
  loading,
  saving,
  children,
}: {
  label: string
  navItems: Array<{ id: ViewId; label: string }>
  activeView: ViewId
  brand: string
  onChangeView: (view: ViewId) => void
  onLogout: () => void
  onRefresh: () => void
  loading: boolean
  saving: boolean
  children: ReactNode
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">GT</span>
          <div>
            <h1>{brand}</h1>
            <p>{label}</p>
          </div>
        </div>

        <nav className="nav-list" aria-label="Navigation principale">
          {navItems.map((view) => (
            <button
              className={activeView === view.id ? 'active' : ''}
              key={view.id}
              onClick={() => onChangeView(view.id)}
              type="button"
            >
              {view.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <div>
            <span className="eyebrow">Session active</span>
            <strong>{loading ? 'Chargement...' : label}</strong>
          </div>
          <div className="topbar-actions">
            <button className="secondary-button" disabled={loading || saving} onClick={onRefresh} type="button">
              Actualiser
            </button>
            <button className="secondary-button danger-text" onClick={onLogout} type="button">
              Déconnexion
            </button>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}

function AccountTable({ accounts }: { accounts: Account[] }) {
  return (
    <section className="panel">
      <SectionHeader eyebrow="Registre" title="Comptes ouverts" />
      {accounts.length === 0 ? (
        <EmptyState label="Aucun compte." />
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>N° compte</th>
                <th>Utilisateur</th>
                <th>Banque</th>
                <th>Solde</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.accountNumber}</td>
                  <td>{getUserName(account)}</td>
                  <td>{getBankName(account.bank)}</td>
                  <td>{formatCurrency(account.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function TransactionTable({
  transactions,
  compact = false,
}: {
  transactions: Transaction[]
  compact?: boolean
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {compact ? null : <th>Date</th>}
            <th>Type</th>
            <th>Compte</th>
            <th>Banque</th>
            <th>Montant</th>
            {compact ? <th>Date</th> : <th>Frais</th>}
            {compact ? null : <th>Net</th>}
            {compact ? null : <th>Déposant</th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              {compact ? null : <td>{formatDate(transaction.date)}</td>}
              <td>
                <span className={`status ${transaction.type.toLowerCase()}`}>
                  {getTransactionTypeLabel(transaction.type)}
                </span>
              </td>
              <td>{transaction.account?.accountNumber ?? '-'}</td>
              <td>{getBankName(transaction.bank)}</td>
              <td>{formatCurrency(transaction.amount)}</td>
              {compact ? <td>{formatDate(transaction.date)}</td> : <td>{formatCurrency(transaction.fee)}</td>}
              {compact ? null : <td>{formatCurrency(transaction.netAmount)}</td>}
              {compact ? null : <td>{transaction.depositorName ?? '-'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BankFields({
  form,
  onChange,
}: {
  form: BankForm
  onChange: (form: BankForm) => void
}) {
  return (
    <>
      <label>
        Nom
        <input
          required
          value={form.name}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
        />
      </label>
      <label>
        Code
        <input
          required
          value={form.code}
          onChange={(event) => onChange({ ...form, code: event.target.value })}
        />
      </label>
      <div className="form-pair">
        <label>
          Frais dépôt (%)
          <input
            min="0"
            step="0.01"
            type="number"
            value={form.depositFee}
            onChange={(event) => onChange({ ...form, depositFee: event.target.value })}
          />
        </label>
        <label>
          Frais retrait (%)
          <input
            min="0"
            step="0.01"
            type="number"
            value={form.withdrawalFee}
            onChange={(event) => onChange({ ...form, withdrawalFee: event.target.value })}
          />
        </label>
      </div>
      <div className="form-pair">
        <label>
          Min. dépôt
          <input
            min="0"
            step="1"
            type="number"
            value={form.minimumDepositAmount}
            onChange={(event) => onChange({ ...form, minimumDepositAmount: event.target.value })}
          />
        </label>
        <label>
          Limite retrait jour
          <input
            min="0"
            step="1"
            type="number"
            value={form.dailyWithdrawalLimit}
            onChange={(event) => onChange({ ...form, dailyWithdrawalLimit: event.target.value })}
          />
        </label>
      </div>
    </>
  )
}

export default App
