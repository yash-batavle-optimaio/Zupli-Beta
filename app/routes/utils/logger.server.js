import path from "path";
import fs from "fs";
import winston from "winston";
import { getContext } from "./requestContext.server";

/* ---------------- Ensure logs directory exists ---------------- */
const LOG_DIR = path.resolve(process.cwd(), "logs");

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/* ---------------- Base Winston logger (singleton) ---------------- */
const baseLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(LOG_DIR, "app.log"),
      level: "info",
    }),
    new winston.transports.File({
      filename: path.join(LOG_DIR, "error.log"),
      level: "error",
    }),
  ],
  exitOnError: false,
});

/* ---------------- Context-aware logger wrapper ---------------- */
export function logger(level, message, meta = {}) {
  const context = getContext();

  baseLogger.log(level, message, {
    requestId: context.requestId,
    shop: context.shop,
    ...meta,
  });
}

/* Convenience helpers */
export const log = {
  info: (msg, meta) => logger("info", msg, meta),
  warn: (msg, meta) => logger("warn", msg, meta),
  error: (msg, meta) => logger("error", msg, meta),
};
