type EnvRecord = Record<string, string | undefined>;

const requiredInAllModes = ['JWT_SECRET'];
const requiredInProduction = [
  'DATABASE_HOST',
  'DATABASE_PORT',
  'DATABASE_USERNAME',
  'DATABASE_PASSWORD',
  'DATABASE_NAME',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'PASSWORD_RESET_SECRET',
];

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid port value: ${value}`);
  }
  return parsed;
}

export function validateEnv(config: EnvRecord): EnvRecord {
  const nodeEnv = config.NODE_ENV ?? 'development';
  const requiredKeys = nodeEnv === 'production' ? requiredInProduction : requiredInAllModes;
  const missing = requiredKeys.filter((key) => !config[key]);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  parsePort(config.PORT, 3000);
  parsePort(config.DATABASE_PORT, 5432);

  if (config.AUTH_RATE_LIMIT_MAX && !Number.isInteger(Number(config.AUTH_RATE_LIMIT_MAX))) {
    throw new Error('AUTH_RATE_LIMIT_MAX must be an integer');
  }

  if (config.AUTH_RATE_LIMIT_WINDOW_MS && !Number.isInteger(Number(config.AUTH_RATE_LIMIT_WINDOW_MS))) {
    throw new Error('AUTH_RATE_LIMIT_WINDOW_MS must be an integer');
  }

  if (config.DATABASE_SSL && !['true', 'false'].includes(config.DATABASE_SSL)) {
    throw new Error('DATABASE_SSL must be either "true" or "false"');
  }

  return config;
}
