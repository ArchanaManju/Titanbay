import { Request, Response, NextFunction } from "express";
import pool from "../db/pool";
import { createError } from "../middleware/errorHandler";

export async function listTransactions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await pool.query(
      "SELECT * FROM transactions ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function processTransaction(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fund_id, amount, fee_percentage, auto_calculate_fees } = req.body;

    const fundCheck = await pool.query(
      "SELECT id FROM funds WHERE id = $1",
      [fund_id]
    );
    if (fundCheck.rows.length === 0) {
      return next(createError(404, `Fund with id '${fund_id}' not found`));
    }

    const calculatedFees = auto_calculate_fees
      ? parseFloat(((amount * fee_percentage) / 100).toFixed(2))
      : 0;

    const result = await pool.query(
      `INSERT INTO transactions (fund_id, amount, fee_percentage, calculated_fees, status)
       VALUES ($1, $2, $3, $4, 'completed')
       RETURNING *`,
      [fund_id, amount, fee_percentage, calculatedFees]
    );

    const tx = result.rows[0];
    res.status(201).json({
      transaction_id: tx.transaction_id,
      fund_id: tx.fund_id,
      amount: tx.amount,
      fee_percentage: parseFloat(tx.fee_percentage),
      calculated_fees: parseFloat(tx.calculated_fees),
      status: tx.status,
      created_at: tx.created_at,
    });
  } catch (err) {
    next(err);
  }
}

export async function reverseTransaction(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { transaction_id } = req.params;
    const { reason } = req.body;

    const txResult = await pool.query(
      "SELECT * FROM transactions WHERE transaction_id = $1",
      [transaction_id]
    );
    if (txResult.rows.length === 0) {
      return next(createError(404, `Transaction '${transaction_id}' not found`));
    }

    const tx = txResult.rows[0];

    if (tx.status !== "completed") {
      return next(
        createError(409, `Cannot reverse a transaction with status '${tx.status}'`)
      );
    }

    const result = await pool.query(
      `UPDATE transactions
       SET status = 'reversed',
           reversed_at = NOW(),
           reversal_reason = $1
       WHERE transaction_id = $2
       RETURNING transaction_id, status, reversed_at`,
      [reason, transaction_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function recalculateFees(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { fund_id, new_fee_percentage, apply_retroactively } = req.body;

    const fundCheck = await pool.query(
      "SELECT id FROM funds WHERE id = $1",
      [fund_id]
    );
    if (fundCheck.rows.length === 0) {
      return next(createError(404, `Fund with id '${fund_id}' not found`));
    }

    if (!apply_retroactively) {
      return res.json({ updated_transactions: 0, total_additional_fees: 0 }) as any;
    }

    const result = await pool.query(
      `WITH updated AS (
         UPDATE transactions
         SET calculated_fees = ROUND(amount * $1 / 100, 2),
             fee_percentage  = $1
         WHERE fund_id = $2
           AND status = 'completed'
         RETURNING ROUND(amount * $1 / 100, 2) AS new_fee
       )
       SELECT
         COUNT(*)                  AS updated_transactions,
         COALESCE(SUM(new_fee), 0) AS total_additional_fees
       FROM updated`,
      [new_fee_percentage, fund_id]
    );

    const row = result.rows[0];
    res.json({
      updated_transactions: parseInt(row.updated_transactions, 10),
      total_additional_fees: parseFloat(row.total_additional_fees),
    });
  } catch (err) {
    next(err);
  }
}