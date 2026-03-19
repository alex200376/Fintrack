import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { transactionsTable, categoriesTable } from "@workspace/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const { categoryId, type, startDate, endDate } = req.query as Record<string, string>;
    
    const conditions = [];
    if (categoryId) conditions.push(eq(transactionsTable.categoryId, categoryId));
    if (type) conditions.push(eq(transactionsTable.type, type as "income" | "expense"));
    if (startDate) conditions.push(gte(transactionsTable.date, startDate));
    if (endDate) conditions.push(lte(transactionsTable.date, endDate));

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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt));

    res.json(transactions.map(t => ({
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
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { amount, type, categoryId, note, date } = req.body;
    if (!amount || !type || !categoryId || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const id = `txn_${randomUUID()}`;
    const now = new Date();
    await db.insert(transactionsTable).values({
      id,
      amount: String(amount),
      type,
      categoryId,
      note: note || null,
      date,
      createdAt: now,
      updatedAt: now,
    });

    const [t] = await db
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
      .where(eq(transactionsTable.id, id));

    return res.status(201).json({
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
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create transaction" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [t] = await db
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
      .where(eq(transactionsTable.id, id));

    if (!t) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    return res.json({
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
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, type, categoryId, note, date } = req.body;
    const [existing] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
    if (!existing) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    const now = new Date();
    await db.update(transactionsTable).set({
      amount: String(amount),
      type,
      categoryId,
      note: note || null,
      date,
      updatedAt: now,
    }).where(eq(transactionsTable.id, id));

    const [t] = await db
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
      .where(eq(transactionsTable.id, id));

    return res.json({
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
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update transaction" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
    if (!existing) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    await db.delete(transactionsTable).where(eq(transactionsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete transaction" });
  }
});

export default router;
