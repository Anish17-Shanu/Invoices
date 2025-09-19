import { createLogger, format, transports } from 'winston';

const logFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.json(),
);

export const winstonConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'flocci-invoices-srv' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple(),
      ),
    }),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new transports.File({
      filename: 'logs/combined.log',
    }),
  ],
};
