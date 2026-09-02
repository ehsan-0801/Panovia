import { createHash } from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';
import { logActivity } from '../lib/activity.js';
import { hashPassword, issueSession, newResetToken, verifyPassword } from '../lib/auth.js';
import { emailLayout, sendEmail } from '../lib/email.js';
import { requireAuth } from '../middleware/auth.js';
import { loadContext } from '../middleware/rbac.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter = Router();

// Throttle sensitive auth endpoints to slow brute-force / abuse (per IP).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1).optional(),
});

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

interface UserRow {
  id: string;
  email: string;
  password_hash: string | null;
  full_name: string | null;
}

/** POST /auth/register — open signup. Creates the account; the user then
 *  onboards their organization via POST /organizations. */
authRouter.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const email = body.email.toLowerCase();

    const existing = (await query<{ id: string }>('select id from public.users where lower(email)=$1', [email])).rows[0];
    if (existing) throw new ApiError(400, 'An account with that email already exists');

    const { rows } = await query<UserRow>(
      `insert into public.users (email, password_hash, full_name) values ($1,$2,$3)
       returning id, email, full_name`,
      [email, await hashPassword(body.password), body.full_name ?? null],
    );
    const user = rows[0];
    await logActivity({ userId: user.id, action: 'registered', entity: 'users', entityId: user.id });

    const session = await issueSession(user);
    res.status(201).json({ user: { id: user.id, email: user.email }, session });
  }),
);

/** POST /auth/login */
authRouter.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);
    const user = (await query<UserRow>(
      'select id, email, password_hash, full_name from public.users where lower(email)=$1',
      [body.email.toLowerCase()],
    )).rows[0];

    // Same error either way, so the endpoint doesn't reveal which emails exist.
    if (!user || !(await verifyPassword(body.password, user.password_hash))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    await query('update public.users set last_login_at = now() where id=$1', [user.id]);
    await logActivity({ userId: user.id, action: 'login', entity: 'users', entityId: user.id });

    const session = await issueSession(user);
    res.json({ user: { id: user.id, email: user.email }, session });
  }),
);

/** POST /auth/forgot-password — emails a single-use reset link. */
authRouter.post(
  '/forgot-password',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const user = (await query<{ id: string; email: string }>(
      'select id, email from public.users where lower(email)=$1', [email.toLowerCase()],
    )).rows[0];

    if (user) {
      const { raw } = newResetToken();
      await query(
        `insert into public.password_reset_tokens (user_id, token_hash, expires_at)
         values ($1,$2, now() + ($3 || ' minutes')::interval)`,
        [user.id, sha256(raw), String(env.auth.resetTtlMinutes)],
      );
      const origin = (req.headers.origin as string | undefined) ?? env.email.appUrl;
      const link = `${origin}/reset-password?token=${raw}`;
      await sendEmail({
        to: user.email,
        subject: 'Reset your password',
        html: emailLayout('Reset your password', `
          <p>We received a request to reset your password. This link is valid for ${env.auth.resetTtlMinutes} minutes and can be used once.</p>
          <p><a href="${link}" style="display:inline-block;margin-top:8px;padding:10px 16px;background:#10b981;color:#fff;border-radius:8px;text-decoration:none">Choose a new password</a></p>
          <p style="color:#64748b;font-size:13px">If you didn't request this, you can safely ignore this email.</p>`),
      });
    }
    // Always the same response — an attacker learns nothing about which emails exist.
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  }),
);

/** POST /auth/reset-password — completes the emailed reset flow (no session needed). */
authRouter.post(
  '/reset-password',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { token, password } = z.object({
      token: z.string().min(10),
      password: z.string().min(6),
    }).parse(req.body);

    const row = (await query<{ id: string; user_id: string }>(
      `select id, user_id from public.password_reset_tokens
       where token_hash=$1 and used_at is null and expires_at > now()`,
      [sha256(token)],
    )).rows[0];
    if (!row) throw new ApiError(400, 'This reset link is invalid or has expired');

    await query('update public.users set password_hash=$2 where id=$1', [row.user_id, await hashPassword(password)]);
    await query('update public.password_reset_tokens set used_at = now() where id=$1', [row.id]);
    await logActivity({ userId: row.user_id, action: 'updated', entity: 'security', description: 'Reset password' });
    res.json({ message: 'Password updated' });
  }),
);

/** POST /auth/logout — the SPA drops its token; nothing is stored server-side. */
authRouter.post('/logout', requireAuth, asyncHandler(async (_req, res) => res.json({ message: 'Logged out' })));

/** GET /auth/me — profile + memberships + active org/role + super-admin flag */
authRouter.get(
  '/me',
  requireAuth,
  loadContext,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'select id, email, full_name, phone, avatar_url, theme, is_super_admin from public.users where id=$1',
      [req.user!.id],
    );
    const ctx = req.ctx!;
    res.json({
      user: rows[0] ?? { id: req.user!.id, email: req.user!.email },
      memberships: ctx.memberships,
      activeOrgId: ctx.orgId,
      role: ctx.role,
      isSuperAdmin: ctx.isSuperAdmin,
      needsOnboarding: !ctx.isSuperAdmin && ctx.memberships.length === 0,
    });
  }),
);
