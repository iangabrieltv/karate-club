import { Request, Response, NextFunction } from 'express';
import { AppError } from '../domain/errors';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
    });
    return;
  }

  // Erros inesperados: log técnico seguro sem expor stack trace ao cliente
  console.error('[Internal Server Error]:', err.message);

  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.',
  });
}
