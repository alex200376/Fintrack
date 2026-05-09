/**
 * AccountContext.tsx
 * Manages financial accounts (cash, savings, credit card, piggy bank, etc.)
 * Stored locally via AsyncStorage — no server required.
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AccountType =
  | "cash"
  | "savings"
  | "checking"
  | "credit"
  | "investment"
  | "piggy"
  | "ewallet"
  | "other";

export interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  icon: string;
  note?: string;
  includeInTotal: boolean;
  createdAt: string;
  updatedAt: string;
}

export const ACCOUNT_TYPE_META: Record<
  AccountType,
  { label: string; icon: string; color: string }
> = {
  cash:       { label: "Cash",        icon: "cash-outline",           color: "#34C759" },
  savings:    { label: "Savings",     icon: "wallet-outline",         color: "#007AFF" },
  checking:   { label: "Checking",    icon: "card-outline",           color: "#5856D6" },
  credit:     { label: "Credit Card", icon: "card",                   color: "#FF3B30" },
  investment: { label: "Investment",  icon: "trending-up-outline",    color: "#FF9500" },
  piggy:      { label: "Piggy Bank",  icon: "bag-handle-outline",     color: "#FF2D55" },
  ewallet:    { label: "E-Wallet",    icon: "phone-portrait-outline", color: "#30B0C7" },
  other:      { label: "Other",       icon: "ellipsis-horizontal",    color: "#8E8E93" },
};

const STORAGE_KEY = "@fintrack_accounts_v1";

const DEFAULT_ACCOUNTS: FinancialAccount[] = [
  {
    id: "default-cash",
    name: "Cash",
    type: "cash",
    balance: 0,
    color: ACCOUNT_TYPE_META.cash.color,
    icon: ACCOUNT_TYPE_META.cash.icon,
    includeInTotal: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface AccountContextType {
  accounts: FinancialAccount[];
  loading: boolean;
  totalBalance: number;
  createAccount: (data: Omit<FinancialAccount, "id" | "createdAt" | "updatedAt">) => Promise<FinancialAccount>;
  updateAccount: (id: string, data: Partial<Omit<FinancialAccount, "id" | "createdAt" | "updatedAt">>) => Promise<FinancialAccount>;
  deleteAccount: (id: string) => Promise<void>;
  adjustBalance: (id: string, amount: number) => Promise<void>;
  reload: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | null>(null);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setAccounts(JSON.parse(raw));
      } else {
        setAccounts(DEFAULT_ACCOUNTS);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      }
    } catch {
      setAccounts(DEFAULT_ACCOUNTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const save = async (updated: FinancialAccount[]) => {
    setAccounts(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const createAccount = useCallback(async (
    data: Omit<FinancialAccount, "id" | "createdAt" | "updatedAt">
  ): Promise<FinancialAccount> => {
    const now = new Date().toISOString();
    const newAcc: FinancialAccount = {
      ...data,
      id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...accounts, newAcc];
    await save(updated);
    return newAcc;
  }, [accounts]);

  const updateAccount = useCallback(async (
    id: string,
    data: Partial<Omit<FinancialAccount, "id" | "createdAt" | "updatedAt">>
  ): Promise<FinancialAccount> => {
    const updated = accounts.map(a =>
      a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
    );
    await save(updated);
    return updated.find(a => a.id === id)!;
  }, [accounts]);

  const deleteAccount = useCallback(async (id: string) => {
    const updated = accounts.filter(a => a.id !== id);
    await save(updated);
  }, [accounts]);

  const adjustBalance = useCallback(async (id: string, amount: number) => {
    const updated = accounts.map(a =>
      a.id === id
        ? { ...a, balance: a.balance + amount, updatedAt: new Date().toISOString() }
        : a
    );
    await save(updated);
  }, [accounts]);

  const totalBalance = accounts
    .filter(a => a.includeInTotal)
    .reduce((sum, a) => sum + a.balance, 0);

  return (
    <AccountContext.Provider
      value={{
        accounts,
        loading,
        totalBalance,
        createAccount,
        updateAccount,
        deleteAccount,
        adjustBalance,
        reload: load,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccounts() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccounts must be used within AccountProvider");
  return ctx;
}
