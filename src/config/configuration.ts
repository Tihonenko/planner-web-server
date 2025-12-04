import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: process.env.PORT ? process.env.PORT : 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    origins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
      : process.env.NODE_ENV === 'production'
        ? []
        : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY,
  },
}));
