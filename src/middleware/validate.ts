import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(
        (e) => `${e.path.join(".")}: ${e.message}`
      );
      res.status(400).json({ error: { message: "Validation failed", errors } });
      return;
    }
    req.body = result.data;
    next();
  };
}

// ── Funds ─────────────────────────────────────────────────────

export const createFundSchema = z.object({
  name: z.string().min(1, "Name is required"),
  vintage_year: z.number().int().min(1900).max(2100),
  target_size_usd: z.number().positive("Must be greater than 0"),
  status: z.enum(["Fundraising", "Investing", "Closed"]),
});

export const updateFundSchema = z.object({
  id: z.string().uuid("Must be a valid UUID"),
  name: z.string().min(1).optional(),
  vintage_year: z.number().int().min(1900).max(2100).optional(),
  target_size_usd: z.number().positive().optional(),
  status: z.enum(["Fundraising", "Investing", "Closed"]).optional(),
});

// ── Investors ─────────────────────────────────────────────────

export const createInvestorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  investor_type: z.enum(["Individual", "Institution", "Family Office"]),
  email: z.string().email("Must be a valid email address"),
});

// ── Investments ───────────────────────────────────────────────

export const createInvestmentSchema = z.object({
  investor_id: z.string().uuid("Must be a valid UUID"),
  amount_usd: z.number().positive("Must be greater than 0"),
  investment_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format"),
});

// ── Transactions ──────────────────────────────────────────────

export const processTransactionSchema = z.object({
  fund_id: z.string().uuid("Must be a valid UUID"),
  amount: z.number().positive("Must be greater than 0"),
  fee_percentage: z.number().min(0).max(100),
  auto_calculate_fees: z.boolean().optional().default(true),
  bypass_validation: z.boolean().optional().default(false),
});

export const reverseTransactionSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  refund_fees: z.boolean().optional().default(false),
});

export const recalcFeesSchema = z.object({
  fund_id: z.string().uuid("Must be a valid UUID"),
  new_fee_percentage: z.number().min(0).max(100),
  apply_retroactively: z.boolean().optional().default(false),
});