import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "both";
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  amount: number;
  spent: number;
  period: "monthly" | "weekly" | "yearly";
  createdAt: string;
  updatedAt: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expenseByCategory: Array<{
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    categoryIcon: string;
    amount: number;
    percentage: number;
  }>;
  recentTransactions: Transaction[];
}

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

async function apiFetch(path: string, options?: RequestInit) {
  const response = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "API error");
  return data;
}

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  summary: FinancialSummary | null;
  loading: boolean;
  refreshAll: () => Promise<void>;
  fetchTransactions: (filters?: Record<string, string>) => Promise<Transaction[]>;
  createTransaction: (data: Omit<Transaction, "id" | "categoryName" | "categoryColor" | "categoryIcon" | "createdAt" | "updatedAt">) => Promise<Transaction>;
  updateTransaction: (id: string, data: Omit<Transaction, "id" | "categoryName" | "categoryColor" | "categoryIcon" | "createdAt" | "updatedAt">) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  fetchCategories: () => Promise<Category[]>;
  createCategory: (data: Omit<Category, "id" | "createdAt">) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  fetchBudgets: () => Promise<Budget[]>;
  createBudget: (data: Pick<Budget, "categoryId" | "amount" | "period">) => Promise<Budget>;
  updateBudget: (id: string, data: Pick<Budget, "categoryId" | "amount" | "period">) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;
  fetchSummary: (month?: number, year?: number) => Promise<FinancialSummary>;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async (filters?: Record<string, string>) => {
    const params = filters ? "?" + new URLSearchParams(filters).toString() : "";
    const data = await apiFetch(`/transactions${params}`);
    setTransactions(data);
    return data;
  }, []);

  const createTransaction = useCallback(async (data: any) => {
    const result = await apiFetch("/transactions", { method: "POST", body: JSON.stringify(data) });
    await fetchTransactions();
    return result;
  }, [fetchTransactions]);

  const updateTransaction = useCallback(async (id: string, data: any) => {
    const result = await apiFetch(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) });
    await fetchTransactions();
    return result;
  }, [fetchTransactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    await apiFetch(`/transactions/${id}`, { method: "DELETE" });
    await fetchTransactions();
  }, [fetchTransactions]);

  const fetchCategories = useCallback(async () => {
    const data = await apiFetch("/categories");
    setCategories(data);
    return data;
  }, []);

  const createCategory = useCallback(async (data: any) => {
    const result = await apiFetch("/categories", { method: "POST", body: JSON.stringify(data) });
    await fetchCategories();
    return result;
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (id: string) => {
    await apiFetch(`/categories/${id}`, { method: "DELETE" });
    await fetchCategories();
  }, [fetchCategories]);

  const fetchBudgets = useCallback(async () => {
    const data = await apiFetch("/budgets");
    setBudgets(data);
    return data;
  }, []);

  const createBudget = useCallback(async (data: any) => {
    const result = await apiFetch("/budgets", { method: "POST", body: JSON.stringify(data) });
    await fetchBudgets();
    return result;
  }, [fetchBudgets]);

  const updateBudget = useCallback(async (id: string, data: any) => {
    const result = await apiFetch(`/budgets/${id}`, { method: "PUT", body: JSON.stringify(data) });
    await fetchBudgets();
    return result;
  }, [fetchBudgets]);

  const deleteBudget = useCallback(async (id: string) => {
    await apiFetch(`/budgets/${id}`, { method: "DELETE" });
    await fetchBudgets();
  }, [fetchBudgets]);

  const fetchSummary = useCallback(async (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set("month", String(month));
    if (year) params.set("year", String(year));
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await apiFetch(`/summary${query}`);
    setSummary(data);
    return data;
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCategories(),
        fetchTransactions(),
        fetchBudgets(),
        fetchSummary(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchCategories, fetchTransactions, fetchBudgets, fetchSummary]);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        categories,
        budgets,
        summary,
        loading,
        refreshAll,
        fetchTransactions,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        fetchCategories,
        createCategory,
        deleteCategory,
        fetchBudgets,
        createBudget,
        updateBudget,
        deleteBudget,
        fetchSummary,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
