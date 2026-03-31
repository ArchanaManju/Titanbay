import { Request, Response, NextFunction } from "express";
import pool from "../db/pool";
import { createError } from "../middleware/errorHandler";

export async function listInvestors(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await pool.query(
      "SELECT * FROM investors ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

export async function createInvestor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, investor_type, email } = req.body;

    const result = await pool.query(
      `INSERT INTO investors (name, investor_type, email)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, investor_type, email]
    );

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === "23505") {
      return next(createError(409, "An investor with this email already exists"));
    }
    next(err);
  }
}