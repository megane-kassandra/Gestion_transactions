import type {
  Account,
  AccountPayload,
  Bank,
  BankPayload,
  DepositPayload,
  Transaction,
  User,
  UserPayload,
  WithdrawPayload,
} from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://gestion-transactions.onrender.com'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers: initialHeaders, ...requestOptions } = options
  const headers = new Headers(initialHeaders)

  const init: RequestInit = {
    ...requestOptions,
    headers,
  }

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
    init.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, init)
  const text = await response.text()

  if (!response.ok) {
    throw new Error(text || `Erreur API ${response.status}`)
  }

  if (!text) {
    return undefined as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return text as T
  }
}

function query(params: Record<string, string | number>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, String(value))
  })
  return searchParams.toString()
}

export const api = {
  getUsers: () => request<User[]>('/api/users'),
  createUser: (payload: UserPayload) =>
    request<User>('/api/users', {
      method: 'POST',
      body: payload,
    }),

  getActiveBanks: () => request<Bank[]>('/api/banks'),
  getAllBanks: () => request<Bank[]>('/api/admin/banks'),
  createBank: (payload: BankPayload) =>
    request<Bank>('/api/admin/banks', {
      method: 'POST',
      body: payload,
    }),
  updateBank: (id: number, payload: BankPayload) =>
    request<Bank>(`/api/admin/banks/${id}`, {
      method: 'PUT',
      body: payload,
    }),
  deactivateBank: (id: number) =>
    request<string>(`/api/admin/banks/${id}`, {
      method: 'DELETE',
    }),
  addBankToUser: (userId: number, bankId: number) =>
    request<User>(`/api/users/${userId}/banks/${bankId}`, {
      method: 'POST',
    }),
  removeBankFromUser: (userId: number, bankId: number) =>
    request<User>(`/api/users/${userId}/banks/${bankId}`, {
      method: 'DELETE',
    }),

  getAccounts: () => request<Account[]>('/api/admin/accounts'),
  getAccountsByUser: (userId: number) => request<Account[]>(`/api/accounts/user/${userId}`),
  createAccount: ({ userId, bankId, initialBalance }: AccountPayload) =>
    request<Account>(
      `/api/accounts/user/${userId}?${query({ bankId, initialBalance })}`,
      { method: 'POST' },
    ),

  getTransactions: () => request<Transaction[]>('/api/admin/logs'),
  getTransactionsByUser: (userId: number) => request<Transaction[]>(`/api/transactions/user/${userId}`),
  deposit: (payload: DepositPayload) =>
    request<Transaction>(
      `/api/transactions/deposit?${query({
        id: payload.id,
        amount: payload.amount,
        depositorName: payload.depositorName,
        depositorPhone: payload.depositorPhone,
      })}`,
      {
        method: 'POST',
      },
    ),
  withdraw: (payload: WithdrawPayload) =>
    request<Transaction>(
      `/api/transactions/withdraw?${query({
        id: payload.id,
        amount: payload.amount,
        userName: payload.userName,
        userPhone: payload.userPhone,
      })}`,
      {
        method: 'POST',
      },
    ),
}
