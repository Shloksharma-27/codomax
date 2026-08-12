import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return null;
}

/**
 * Requires a valid JWT. Attaches the authenticated user to req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw new AppError('Not authorized. Please log in.', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError('Not authorized. Please log in again.', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('The user for this token no longer exists.', 401);
  }

  req.user = user;
  next();
});

/**
 * Attaches req.user if a valid token is present, but does not fail
 * the request if one is missing or invalid. Used for public endpoints
 * that behave differently for authenticated callers.
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user) req.user = user;
  } catch (err) {
    // Invalid/expired token on an optional route - just proceed unauthenticated.
  }

  next();
});
