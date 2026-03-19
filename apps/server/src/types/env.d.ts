declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly PORT?: string;
    readonly DATABASE_URL: string;
    readonly JWT_SECRET?: string;
    readonly JWT_EXPIRES_IN?: string;
    readonly CORS_ORIGINS?: string;
  }
}
