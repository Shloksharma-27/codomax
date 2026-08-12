/**
 * Operational error with an HTTP status code attached, so the central
 * error handler can distinguish expected errors (bad input, 404, auth)
 * from unexpected bugs.
 */
export default class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
