import { Request, Response, NextFunction } from "express";
import pool from "../db/pool";
import { createError } from "../middleware/errorHandler";

export async function listInvestments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fund_id } = req.params;

    const fundCheck = await pool.query(
      "SELECT id FROM funds WHERE id = $1",
      [fund_id]
    );
    if (fundCheck.rows.length === 0) {
      return next(createError(404, `Fund with id '${fund_id}' not found`));
    }

    const result = await pool.query(
      `SELECT id, investor_id, fund_id, amount_usd, investment_date
       FROM investments
       WHERE fund_id = $1
       ORDER BY investment_date DESC`,
      [fund_id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function createInvestment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fund_id } = req.params;
    const { investor_id, amount_usd, investment_date } = req.body;

    const fundCheck = await pool.query(
      "SELECT id FROM funds WHERE id = $1",
      [fund_id]
    );
    if (fundCheck.rows.length === 0) {
      return next(createError(404, `Fund with id '${fund_id}' not found`));
    }

    const investorCheck = await pool.query(
      "SELECT id FROM investors WHERE id = $1",
      [investor_id]
    );
    if (investorCheck.rows.length === 0) {
      return next(createError(404, `Investor with id '${investor_id}' not found`));
    }

    const result = await pool.query(
      `INSERT INTO investments (fund_id, investor_id, amount_usd, investment_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, investor_id, fund_id, amount_usd, investment_date`,
      [fund_id, investor_id, amount_usd, investment_date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}