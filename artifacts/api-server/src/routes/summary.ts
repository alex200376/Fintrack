import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { transactionsTable, categoriesTable } from "@workspace/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const { month, year } = req.query as Record<string, string>;
    
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();
    const monthStr = String(targetMonth).padStart(2, "0");
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const startDate = `${targetYear}-${monthStr}-01`;
    const endDate = `${targetYear}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

    const transactions = await db
      .select({
        id: transactionsTable.id,
        amount: transactionsTable.amount,
        type: transactionsTable.type,
        categoryId: transactionsTable.categoryId,
        categoryName: categoriesTable.name,
        categoryColor: categoriesTable.color,
        categoryIcon: categoriesTable.icon,
        note: transactionsTable.note,
        date: transactionsTable.date,
        createdAt: transactionsTable.createdAt,
        updatedAt: transactionsTable.updatedAt,
      })
      .from(transactionsTable)
      .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
      .where(and(gte(transactionsTable.date, startDate), lte(transactionsTable.date, endDate)))
      .orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt));

    const totalIncome = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpense = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const categoryMap = new Map<string, { name: string; color: string; icon: string; amount: number }>();
    for (const t of transactions.filter(t => t.type === "expense")) {
      const existing = categoryMap.get(t.categoryId);
      if (existing) {
        existing.amount += parseFloat(t.amount);
      } else {
        categoryMap.set(t.categoryId, {
          name: t.categoryName ?? "Unknown",
          color: t.categoryColor ?? "#888",
          icon: t.categoryIcon ?? "ellipsis-horizontal",
          amount: parseFloat(t.amount),
        });
      }
    }

    const expenseByCategory = Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      categoryColor: data.color,
      categoryIcon: data.icon,
      amount: data.amount,
      percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);

    const recentTransactions = transactions.slice(0, 10).map(t => ({
      id: t.id,
      amount: parseFloat(t.amount),
      type: t.type,
      categoryId: t.categoryId,
      categoryName: t.categoryName ?? "Unknown",
      categoryColor: t.categoryColor ?? "#888",
      categoryIcon: t.categoryIcon ?? "ellipsis-horizontal",
      note: t.note ?? undefined,
      date: t.date,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      expenseByCategory,
      recentTransactions,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

export default router;
