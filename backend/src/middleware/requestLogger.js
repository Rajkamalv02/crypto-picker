const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;
    
    logger.info(`${method} ${originalUrl} ${statusCode} - ${duration}ms`, {
      route: originalUrl,
      method,
      statusCode,
      duration
    });
  });
  
  next();
};

module.exports = requestLogger;
