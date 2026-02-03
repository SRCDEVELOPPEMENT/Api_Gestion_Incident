import rateLimit from 'express-rate-limit';
import { Logger } from '../../../infrastructure/logging/Logger';

// Augmentation significative pour éviter les faux positifs sur une SPA
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Augmenté de 100 à 5000 pour éviter le blocage des requêtes légitimes
  // max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Too many requests, please try again later.'
  },
  handler: (req, res, next, options) => {
    Logger.warn(`Rate limit exceeded for IP ${(req as any).ip}`);
    (res as any).status(options.statusCode).send(options.message);
    // Logger.warn(`Rate limit exceeded for IP ${req.ip}`);
    // res.status(options.statusCode).send(options.message);
  }
});

// Limiteur strict pour le login (Brute-force protection)
// Réduction de la fenêtre de blocage pour éviter les expériences utilisateur frustrantes
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // Fenêtre réduite à 1 minute (au lieu de 15)
  max: 10, // Augmenté à 10 tentatives par minute
  // windowMs: 15 * 60 * 1000, // 15 minutes
  // max: 5, // 5 tentatives max
  message: {
    status: 429,
    message: 'Too many login attempts, please try again after 1 minute.'
    // message: 'Too many login attempts, please try again after 15 minutes.'
  },
  handler: (req, res, next, options) => {
    const correlationId = (req as any).headers['x-correlation-id'];
    Logger.log({
      level: 'security',
      message: `Brute-force attempt blocked for IP ${(req as any).ip}`,
      // message: `Brute-force attempt blocked for IP ${req.ip}`,
      correlationId
    });
    (res as any).status(options.statusCode).send(options.message);
    // res.status(options.statusCode).send(options.message);
  }
});
