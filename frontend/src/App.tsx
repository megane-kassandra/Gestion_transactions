import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { api } from './api'
import type { Account, Bank, BankPayload, Transaction, User } from './types'
import './App.css'

type View = 'dashboard' | 'users' | 'banks' | 'accounts' | 'operations' | 'history'
type Operation = 'deposit' | 'withdraw'
type NoticeTone = 'success' | 'error'

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

const views: Array<{ id: View; label: string }> = [
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'users', label: 'Utilisateurs' },
  { id: 'banks', label: 'Banques' },
  { id: 'accounts', label: 'Comptes' },
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
  return account?.user?.name || 'Utilisateur non exposé'
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
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [users, setUsers] = useState<User[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [activeBanks, setActiveBanks] = useState<Bank[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm)
  const [bankForm, setBankForm] = useState<BankForm>(emptyBankForm)
  const [editingBankId, setEditingBankId] = useState<number | null>(null)
  const [editingBankForm, setEditingBankForm] = useState<BankForm>(emptyBankForm)
  const [accountForm, setAccountForm] = useState({
    userId: '',
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

  useEffect(() => {
    void loadData()
  }, [loadData])

  const orderedTransactions = useMemo(
    () =>
      [...transactions].sort(
        (first, second) => new Date(second.date).getTime() - new Date(first.date).getTime(),
      ),
    [transactions],
  )

  const filteredTransactions = useMemo(
    () =>
      historyType === 'ALL'
        ? orderedTransactions
        : orderedTransactions.filter((transaction) => transaction.type === historyType),
    [historyType, orderedTransactions],
  )

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

  async function runAction(action: () => Promise<void>, message: string) {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await action()
      setSuccess(message)
      await loadData()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Action impossible.')
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
    const account = accounts.find((item) => String(item.id) === accountId)
    setTransactionForm({
      accountId,
      amount: '',
      name: account?.user?.name ?? '',
      phone: account?.user?.phone ?? '',
    })
  }

  function startBankEdition(bank: Bank) {
    setEditingBankId(bank.id)
    setEditingBankForm(bankToForm(bank))
  }

  function renderDashboard() {
    const recentTransactions = orderedTransactions.slice(0, 6)

    return (
      <main className="view-space">
        <SectionHeader eyebrow="Vue globale" title="Activité des transactions" />

        <section className="stat-grid" aria-label="Indicateurs">
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
            <SectionHeader eyebrow="Flux" title="Dernières opérations" />
            {recentTransactions.length === 0 ? (
              <EmptyState label="Aucune transaction enregistrée." />
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Compte</th>
                      <th>Banque</th>
                      <th>Montant</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>
                          <span className={`status ${transaction.type.toLowerCase()}`}>
                            {getTransactionTypeLabel(transaction.type)}
                          </span>
                        </td>
                        <td>{transaction.account?.accountNumber ?? '-'}</td>
                        <td>{getBankName(transaction.bank)}</td>
                        <td>{formatCurrency(transaction.amount)}</td>
                        <td>{formatDate(transaction.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="panel">
            <SectionHeader eyebrow="Balances" title="Volumes nets" />
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
                  <button
                    className="secondary-button"
                    onClick={() => setEditingBankId(null)}
                    type="button"
                  >
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
            <SectionHeader eyebrow="Synthèse" title="Portefeuille" />
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
      </main>
    )
  }

  function renderOperations() {
    const selectedAccount = accounts.find((account) => String(account.id) === transactionForm.accountId)
    const selectedBank = selectedAccount?.bank

    return (
      <main className="view-space">
        <SectionHeader eyebrow="Caisse" title="Dépôts et retraits" />

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
                {accounts.map((account) => (
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
            <button className="primary-button" disabled={saving} type="submit">
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

  function renderHistory() {
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
          title="Historique des transactions"
        />

        <section className="panel">
          {filteredTransactions.length === 0 ? (
            <EmptyState label="Aucune transaction." />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Compte</th>
                    <th>Banque</th>
                    <th>Montant</th>
                    <th>Frais</th>
                    <th>Net</th>
                    <th>Déposant</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.date)}</td>
                      <td>
                        <span className={`status ${transaction.type.toLowerCase()}`}>
                          {getTransactionTypeLabel(transaction.type)}
                        </span>
                      </td>
                      <td>{transaction.account?.accountNumber ?? '-'}</td>
                      <td>{getBankName(transaction.bank)}</td>
                      <td>{formatCurrency(transaction.amount)}</td>
                      <td>{formatCurrency(transaction.fee)}</td>
                      <td>{formatCurrency(transaction.netAmount)}</td>
                      <td>{transaction.depositorName ?? '-'}</td>
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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">GT</span>
          <div>
            <h1>Gestion Transactions</h1>
            <p>Banques, comptes et caisse</p>
          </div>
        </div>

        <nav className="nav-list" aria-label="Navigation principale">
          {views.map((view) => (
            <button
              className={activeView === view.id ? 'active' : ''}
              key={view.id}
              onClick={() => setActiveView(view.id)}
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
            <span className="eyebrow">Backend Spring Boot</span>
            <strong>{loading ? 'Chargement...' : 'API connectée'}</strong>
          </div>
          <button
            className="secondary-button"
            disabled={loading || saving}
            onClick={() => void loadData()}
            type="button"
          >
            Actualiser
          </button>
        </header>

        <div className="notice-stack">
          {error ? <Notice message={error} tone="error" /> : null}
          {success ? <Notice message={success} tone="success" /> : null}
        </div>

        {activeView === 'dashboard' ? renderDashboard() : null}
        {activeView === 'users' ? renderUsers() : null}
        {activeView === 'banks' ? renderBanks() : null}
        {activeView === 'accounts' ? renderAccounts() : null}
        {activeView === 'operations' ? renderOperations() : null}
        {activeView === 'history' ? renderHistory() : null}
      </div>
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
        <input required value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} />
      </label>
      <label>
        Code
        <input required value={form.code} onChange={(event) => onChange({ ...form, code: event.target.value })} />
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
