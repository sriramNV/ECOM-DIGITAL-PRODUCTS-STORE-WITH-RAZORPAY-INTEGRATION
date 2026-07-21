import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport:
    process.env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "body.password",
      "body.token",
      "body.access_token",
      "body.refresh_token",
      "body.secret",
      "body.card",
      "body.cardNumber",
      "body.cvv",
      "body.cvv2",
      "body.pin",
      "*.password",
      "*.token",
      "*.secret",
      "*.key",
    ],
    censor: "[REDACTED]",
  },
});
