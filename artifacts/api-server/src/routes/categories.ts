import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const DEFAULT_CATEGORIES = [
  { id: "cat_food", name: "Food & Dining", icon: "restaurant", color: "#FF6B6B", type: "expense" as const },
  { id: "cat_transport", name: "Transport", icon: "car", color: "#4ECDC4", type: "expense" as const },
  { id: "cat_shopping", name: "Shopping", icon: "cart", color: "#45B7D1", type: "expense" as const },
  { id: "cat_health", name: "Health", icon: "medical", color: "#96CEB4", type: "expense" as const },
  { id: "cat_entertainment", name: "Entertainment", icon: "tv", color: "#FFEAA7", type: "expense" as const },
  { id: "cat_bills", name: "Bills", icon: "receipt", color: "#DDA0DD", type: "expense" as const },
  { id: "cat_education", name: "Education", icon: "school", color: "#98D8C8", type: "expense" as const },
  { id: "cat_travel", name: "Travel", icon: "airplane", color: "#F7DC6F", type: "expense" as const },
  { id: "cat_salary", name: "Salary", icon: "cash", color: "#58D68D", type: "income" as const },
  { id: "cat_freelance", name: "Freelance", icon: "laptop", color: "#82E0AA", type: "income" as const },
  { id: "cat_investment", name: "Investment", icon: "trending-up", color: "#A9DFBF", type: "income" as const },
  { id: "cat_gift", name: "Gift", icon: "gift", color: "#AED6F1", type: "income" as const },
  { id: "cat_other", name: "Other", icon: "ellipsis-horizontal", color: "#BDC3C7", type: "both" as const },
];

async function ensureDefaultCategories() {
  const existing = await db.select().from(categoriesTable);
  if (existing.length === 0) {
    await db.insert(categoriesTable).values(
      DEFAULT_CATEGORIES.map(c => ({
        ...c,
        createdAt: new Date(),
      }))
    );
  }
}

router.get("/", async (_req, res) => {
  try {
    await ensureDefaultCategories();
    const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
    res.json(categories.map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      type: c.type,
      createdAt: c.createdAt.toISOString(),
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, icon, color, type } = req.body;
    if (!name || !icon || !color || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const id = `cat_${randomUUID()}`;
    const now = new Date();
    await db.insert(categoriesTable).values({ id, name, icon, color, type, createdAt: now });
    const [created] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
    return res.status(201).json({
      id: created.id,
      name: created.name,
      icon: created.icon,
      color: created.color,
      type: created.type,
      createdAt: created.createdAt.toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create category" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, color, type } = req.body;
    const [existing] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
    }
    await db.update(categoriesTable).set({ name, icon, color, type }).where(eq(categoriesTable.id, id));
    const [updated] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
    return res.json({
      id: updated.id,
      name: updated.name,
      icon: updated.icon,
      color: updated.color,
      type: updated.type,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
    if (!existing) {
      return res.status(404).json({ error: "Category not found" });
    }
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
