const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const { createLogger, format, transports } = require('winston');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(logsDir, 'combined.log') })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple())
    })
  );
}

// HTTP request logging middleware powered by morgan
const httpLogger = morgan(':remote-addr :method :url :status :res[content-length] - :response-time ms', {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    }
  }
});

module.exports = {
  logger,
  httpLogger
};