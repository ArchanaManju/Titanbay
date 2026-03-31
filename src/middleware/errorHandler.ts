import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
}

export function createError(statusCode: number, message: string): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  return err;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;

  console.error(`[ERROR] ${err.message}`);

  res.status(statusCode).json({
    error: {
      message: err.message || "Internal Server Error",
      statusCode,
    },
  });
}