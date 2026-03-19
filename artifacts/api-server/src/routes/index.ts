import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import transactionsRouter from "./transactions";
import budgetsRouter from "./budgets";
import summaryRouter from "./summary";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/categories", categoriesRouter);
router.use("/transactions", transactionsRouter);
router.use("/budgets", budgetsRouter);
router.use("/summary", summaryRouter);

export default router;
