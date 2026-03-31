import { Router } from "express";
import {
  validate,
  createFundSchema,
  updateFundSchema,
  createInvestorSchema,
  createInvestmentSchema,
  processTransactionSchema,
  reverseTransactionSchema,
  recalcFeesSchema,
} from "../middleware/validate";
import {
  listFunds,
  getFund,
  createFund,
  updateFund,
  getFundTotalValue,
} from "../controllers/funds.controller";
import {
  listInvestors,
  createInvestor,
} from "../controllers/investors.controller";
import {
  listInvestments,
  createInvestment,
} from "../controllers/investments.controller";
import {
  listTransactions,
  processTransaction,
  reverseTransaction,
  recalculateFees,
} from "../controllers/transactions.controller";

const router = Router();

// ── Funds ──────────────────────────────────────────────────────
router.get("/funds", listFunds);
router.post("/funds", validate(createFundSchema), createFund);
router.put("/funds", validate(updateFundSchema), updateFund);
router.get("/funds/:id", getFund);
router.get("/funds/:fund_id/total-value", getFundTotalValue);

// ── Investors ──────────────────────────────────────────────────
router.get("/investors", listInvestors);
router.post("/investors", validate(createInvestorSchema), createInvestor);

// ── Investments ────────────────────────────────────────────────
router.get("/funds/:fund_id/investments", listInvestments);
router.post("/funds/:fund_id/investments", validate(createInvestmentSchema), createInvestment);

// ── Transactions ───────────────────────────────────────────────
router.get("/transactions", listTransactions);
router.post("/transactions/process", validate(processTransactionSchema), processTransaction);
router.put("/transactions/:transaction_id/reverse", validate(reverseTransactionSchema), reverseTransaction);

// ── Admin ──────────────────────────────────────────────────────
router.post("/admin/recalculate-fees", validate(recalcFeesSchema), recalculateFees);

export default router;