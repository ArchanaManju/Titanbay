import { Request, Response, NextFunction } from "express";
import pool from "../db/pool";
import { createError } from "../middleware/errorHandler";

export async function listFunds(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await pool.query(
      "SELECT * FROM funds ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function getFund(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM funds WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return next(createError(404, `Fund with id '${id}' not found`));
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function createFund(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, vintage_year, target_size_usd, status } = req.body;

    const result = await pool.query(
      `INSERT INTO funds (name, vintage_year, target_size_usd, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, vintage_year, target_size_usd, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function updateFund(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id, name, vintage_year, target_size_usd, status } = req.body;

    const existing = await pool.query(
      "SELECT * FROM funds WHERE id = $1",
      [id]
    );
    if (existing.rows.length === 0) {
      return next(createError(404, `Fund with id '${id}' not found`));
    }

    const result = await pool.query(
      `UPDATE funds
       SET name            = COALESCE($1, name),
           vintage_year    = COALESCE($2, vintage_year),
           target_size_usd = COALESCE($3, target_size_usd),
           status          = COALESCE($4, status)
       WHERE id = $5
       RETURNING *`,
      [name, vintage_year, target_size_usd, status, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function getFundTotalValue(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fund_id } = req.params;
    const includePending = req.query.include_pending === "true";

    const fundCheck = await pool.query(
      "SELECT id FROM funds WHERE id = $1",
      [fund_id]
    );
    if (fundCheck.rows.length === 0) {
      return next(createError(404, `Fund with id '${fund_id}' not found`));
    }

    const result = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) AS total_value,
         COALESCE(SUM(CASE WHEN status = 'pending'   THEN amount ELSE 0 END), 0) AS pending_value,
         COUNT(*) AS transaction_count
       FROM transactions
       WHERE fund_id = $1
       AND status IN ('completed', ${includePending ? "'pending'" : "'completed'"})`,
      [fund_id]
    );

    const row = result.rows[0];
    res.json({
      fund_id,
      total_value: parseFloat(row.total_value),
      pending_value: parseFloat(row.pending_value),
      transaction_count: parseInt(row.transaction_count, 10),
    });
  } catch (err) {
    next(err);
  }
}