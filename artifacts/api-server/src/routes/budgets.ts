import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { budgetsTable, categoriesTable, transactionsTable } from "@workspace/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const start = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  const end = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

router.get("/", async (_req, res) => {
  try {
    const budgets = await db
      .select({
        id: budgetsTable.id,
        categoryId: budgetsTable.categoryId,
        categoryName: categoriesTable.name,
        categoryColor: categoriesTable.color,
        categoryIcon: categoriesTable.icon,
        amount: budgetsTable.amount,
        period: budgetsTable.period,
        createdAt: budgetsTable.createdAt,
        updatedAt: budgetsTable.updatedAt,
      })
      .from(budgetsTable)
      .leftJoin(categoriesTable, eq(budgetsTable.categoryId, categoriesTable.id));

    const { start, end } = getCurrentMonthRange();

    const result = await Promise.all(
      budgets.map(async (b) => {
        const expenses = await db
          .select({ amount: transactionsTable.amount })
          .from(transactionsTable)
          .where(
            and(
              eq(transactionsTable.categoryId, b.categoryId),
              eq(transactionsTable.type, "expense"),
              gte(transactionsTable.date, start),
              lte(transactionsTable.date, end)
            )
          );
        const spent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        return {
          id: b.id,
          categoryId: b.categoryId,
          categoryName: b.categoryName ?? "Unknown",
          categoryColor: b.categoryColor ?? "#888",
          categoryIcon: b.categoryIcon ?? "ellipsis-horizontal",
          amount: parseFloat(b.amount),
          spent,
          period: b.period,
          createdAt: b.createdAt.toISOString(),
          updatedAt: b.updatedAt.toISOString(),
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { categoryId, amount, period } = req.body;
    if (!categoryId || !amount || !period) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const id = `bud_${randomUUID()}`;
    const now = new Date();
    await db.insert(budgetsTable).values({
      id,
      categoryId,
      amount: String(amount),
      period,
      createdAt: now,
      updatedAt: now,
    });

    const { start, end } = getCurrentMonthRange();
    const [b] = await db
      .select({
        id: budgetsTable.id,
        categoryId: budgetsTable.categoryId,
        categoryName: categoriesTable.name,
        categoryColor: categoriesTable.color,
        categoryIcon: categoriesTable.icon,
        amount: budgetsTable.amount,
        period: budgetsTable.period,
        createdAt: budgetsTable.createdAt,
        updatedAt: budgetsTable.updatedAt,
      })
      .from(budgetsTable)
      .leftJoin(categoriesTable, eq(budgetsTable.categoryId, categoriesTable.id))
      .where(eq(budgetsTable.id, id));

    const expenses = await db
      .select({ amount: transactionsTable.amount })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.categoryId, categoryId),
          eq(transactionsTable.type, "expense"),
          gte(transactionsTable.date, start),
          lte(transactionsTable.date, end)
        )
      );
    const spent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return res.status(201).json({
      id: b.id,
      categoryId: b.categoryId,
      categoryName: b.categoryName ?? "Unknown",
      categoryColor: b.categoryColor ?? "#888",
      categoryIcon: b.categoryIcon ?? "ellipsis-horizontal",
      amount: parseFloat(b.amount),
      spent,
      period: b.period,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create budget" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, amount, period } = req.body;
    const [existing] = await db.select().from(budgetsTable).where(eq(budgetsTable.id, id));
    if (!existing) {
      return res.status(404).json({ error: "Budget not found" });
    }
    const now = new Date();
    await db.update(budgetsTable).set({
      categoryId,
      amount: String(amount),
      period,
      updatedAt: now,
    }).where(eq(budgetsTable.id, id));

    const { start, end } = getCurrentMonthRange();
    const [b] = await db
      .select({
        id: budgetsTable.id,
        categoryId: budgetsTable.categoryId,
        categoryName: categoriesTable.name,
        categoryColor: categoriesTable.color,
        categoryIcon: categoriesTable.icon,
        amount: budgetsTable.amount,
        period: budgetsTable.period,
        createdAt: budgetsTable.createdAt,
        updatedAt: budgetsTable.updatedAt,
      })
      .from(budgetsTable)
      .leftJoin(categoriesTable, eq(budgetsTable.categoryId, categoriesTable.id))
      .where(eq(budgetsTable.id, id));

    const expenses = await db
      .select({ amount: transactionsTable.amount })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.categoryId, b.categoryId),
          eq(transactionsTable.type, "expense"),
          gte(transactionsTable.date, start),
          lte(transactionsTable.date, end)
        )
      );
    const spent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return res.json({
      id: b.id,
      categoryId: b.categoryId,
      categoryName: b.categoryName ?? "Unknown",
      categoryColor: b.categoryColor ?? "#888",
      categoryIcon: b.categoryIcon ?? "ellipsis-horizontal",
      amount: parseFloat(b.amount),
      spent,
      period: b.period,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update budget" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(budgetsTable).where(eq(budgetsTable.id, id));
    if (!existing) {
      return res.status(404).json({ error: "Budget not found" });
    }
    await db.delete(budgetsTable).where(eq(budgetsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete budget" });
  }
});

export default router;
