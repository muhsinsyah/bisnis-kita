import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.ts';
import { User, UserRole } from '../types/index.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'bisnis-kita-secure-super-key-2026-prod';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      businessId: user.businessId,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Simple in-memory rate limiter for login brute force prevention
const loginAttempts: Map<string, { count: number; lockedUntil: number }> = new Map();

export function checkLoginRateLimit(ipOrUsername: string): { allowed: boolean; remainingSeconds: number } {
  const record = loginAttempts.get(ipOrUsername);
  const now = Date.now();
  if (record && record.lockedUntil > now) {
    return { allowed: false, remainingSeconds: Math.ceil((record.lockedUntil - now) / 1000) };
  }
  return { allowed: true, remainingSeconds: 0 };
}

export function recordFailedLogin(ipOrUsername: string) {
  const now = Date.now();
  const record = loginAttempts.get(ipOrUsername) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = now + 60 * 1000; // 1 minute lockout
    record.count = 0;
  }
  loginAttempts.set(ipOrUsername, record);
}

export function resetLoginAttempts(ipOrUsername: string) {
  loginAttempts.delete(ipOrUsername);
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sesi tidak valid atau belum login.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; businessId: string };
    const user = db.getUsers().find((u) => u.id === decoded.userId && u.businessId === decoded.businessId);

    if (!user) {
      return res.status(401).json({ error: 'Pengguna tidak ditemukan.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Akun Anda dinonaktifkan oleh pemilik usaha.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesi telah kedaluwarsa. Silakan login kembali.' });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentikasi diperlukan.' });
    }
    if (req.user.role === 'owner') {
      // Owner always has all permissions
      return next();
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Akses ditolak. Fitur ini hanya dapat diakses oleh role: ${allowedRoles.join(', ')}.`,
      });
    }
    next();
  };
}
