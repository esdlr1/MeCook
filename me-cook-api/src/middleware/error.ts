import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: "Not found" });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const message =
    process.env.NODE_ENV === "production" ? "Internal server error" : error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({ message });
}
