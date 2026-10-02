import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'super_secret_jwt_key_multitenant_saas_platform_2026',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
}));
