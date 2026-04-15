export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    SELECT_TENANT: '/api/v1/auth/select-tenant',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh'
  }
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  USER_DATA: 'user_data'
} as const;
