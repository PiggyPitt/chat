import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = ['PORT', 'MONGO_URI', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX', 'SERVER_URL'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGO_URI as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN as string,
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 10),
  serverUrl: process.env.SERVER_URL as string,
  socketPath: process.env.SOCKET_PATH ?? '/socket.io',
  uploadDir: process.env.UPLOAD_DIR ?? './uploads'
};
