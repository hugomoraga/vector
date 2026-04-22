import { Request, Response } from 'express';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export function sendSuccess<T>(res: Response, data: T, status = 200) {
  res.status(status).json({ data });
}

export function sendError(res: Response, message: string, status = 400) {
  res.status(status).json({ error: message });
}

export function sendCreated<T>(res: Response, data: T) {
  res.status(201).json({ data });
}