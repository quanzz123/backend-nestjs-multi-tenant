/**
 * Phân loại đối tượng người dùng trong hệ thống Multi-tenant SaaS
 */
export const AUTH_USER_TYPE = {
  /** Quản trị viên hệ thống nền tảng (Platform Level) */
  PLATFORM: 'PLATFORM',
  /** Người dùng / Quản trị viên thuộc doanh nghiệp (Tenant Level) */
  TENANT: 'TENANT',
} as const;

export type AuthUserType = (typeof AUTH_USER_TYPE)[keyof typeof AUTH_USER_TYPE];
