export type Bank = {
  id: number
  name: string
  code: string
  depositFee: number
  withdrawalFee: number
  minimumDepositAmount: number
  dailyWithdrawalLimit: number
  active: boolean
}

export type User = {
  id: number
  name: string
  email: string
  phone: string
  banks?: Bank[]
}

export type Account = {
  id: number
  accountNumber: string
  balance: number
  userId?: number
  userName?: string
  userEmail?: string
  userPhone?: string
  user?: User
  bank?: Bank
}

export type Transaction = {
  id: number
  type: 'DEPOT' | 'RETRAIT' | string
  amount: number
  fee: number
  netAmount: number
  depositorName?: string
  depositorPhone?: string
  date: string
  account?: Account
  bank?: Bank
}

export type BankPayload = {
  name: string
  code: string
  depositFee: number
  withdrawalFee: number
  minimumDepositAmount: number
  dailyWithdrawalLimit: number
}

export type UserPayload = {
  name: string
  email: string
  phone: string
}

export type AccountPayload = {
  userId: number
  bankId: number
  initialBalance: number
}

export type DepositPayload = {
  id: number
  amount: number
  depositorName: string
  depositorPhone: string
}

export type WithdrawPayload = {
  id: number
  amount: number
  userName: string
  userPhone: string
}
