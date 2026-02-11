const winston = require('winston');
const path = require('path');
require('winston-daily-rotate-file');

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, service, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]${service ? ` [${service}]` : ''}: ${message}`;
    if (meta.route) log += ` | Route: ${meta.route}`;
    if (stack) log += `\nStack: ${stack}`;
    
    // Clean up meta to remove internal winston keys and handle non-objects
    const metaEntries = Object.entries(meta).filter(([key]) => !['timestamp', 'level', 'message', 'service', 'stack'].includes(key));
    if (metaEntries.length > (meta.route ? 1 : 0)) {
        log += ` | Meta: ${JSON.stringify(Object.fromEntries(metaEntries))}`;
    }
    return log;
  })
);

const dailyRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(__dirname, '../../logs/application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat
});

const logger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'crypto-picker-backend' },
  transports: [
    dailyRotateTransport,
    new winston.transports.File({ 
        filename: path.join(__dirname, '../../logs/error.log'), 
        level: 'error',
        format: logFormat
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

module.exports = logger;
