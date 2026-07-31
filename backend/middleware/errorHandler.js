import logger from "../utils/logger.js";

/**
 * Global Error Handling Middleware.
 */
export function errorHandler(err, req, res, next) {
  // Log request context and error details
  logger.error("Error occurred during request processing: %s %s - Error: %O", 
    req.method, 
    req.originalUrl, 
    err
  );

  // Default error properties
  let statusCode = 500;
  let message = "An error occurred";

  // Mongoose validation or duplicate key errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message || "Validation Error";
  } else if (err.code === 11000) {
    statusCode = 400;
    message = "Duplicate field value entered";
  }

  // Handle specific manual errors if they set custom statusCode or message
  if (err.statusCode) {
    statusCode = err.statusCode;
  }
  if (err.message && statusCode !== 500) {
    message = err.message;
  }

  // Response mapping
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack, details: err.message } : {})
  });
}

export default errorHandler;
