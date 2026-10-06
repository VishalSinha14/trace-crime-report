import rateLimit from 'express-rate-limit';

/**
 * Strict limiter for auth endpoints (login, register).
 * 15 attempts per 15-minute window per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  skipSuccessfulRequests: true, // Only count failed attempts
});

/**
 * Moderate limiter for incident submission.
 * 30 reports per 10-minute window per IP (prevents spam flooding).
 */
export const incidentSubmitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many reports submitted. Please wait a few minutes before submitting again.',
  },
});

/**
 * Light general limiter for all API routes (anti-scraping).
 * 500 requests per minute per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Request rate limit exceeded. Please slow down.',
  },
});
