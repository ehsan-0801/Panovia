import 'dotenv/config';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  // Neon: the pooled URL for the app, the direct one for migrations/seeds.
  databaseUrl: required('DATABASE_URL'),
  directDatabaseUrl: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '',
  auth: {
    // Signs the access tokens this API issues. Rotating it invalidates every session.
    jwtSecret: required('JWT_SECRET'),
    // 7 days — long enough that the SPA never needs a refresh-token dance.
    tokenTtlSeconds: Number(process.env.JWT_TTL_SECONDS ?? 60 * 60 * 24 * 7),
    resetTtlMinutes: Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? 60),
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
    folder: process.env.CLOUDINARY_FOLDER ?? 'panovia',
  },
  email: {
    apiKey: process.env.RESEND_API_KEY ?? '',
    from: process.env.EMAIL_FROM ?? 'Panovia <onboarding@resend.dev>',
    // public app URL used in email links (falls back to the first CORS origin)
    appUrl: process.env.APP_URL ?? (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',')[0].trim(),
  },
};
