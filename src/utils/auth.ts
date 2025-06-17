import Cookies from 'js-cookie';
import { encryptData, decryptData } from './encryption';

export const AUTH_TOKEN_KEY = 'auth_token';
export const USER_ID_KEY = 'user_id';
export const TOKEN_EXPIRY_DAYS = 7;

export interface AuthTokenResponse {
  success: boolean;
  token: string;
}

// Safe check for browser environment
const isBrowser = () => typeof window !== 'undefined';

export const saveAuthToken = (token: string) => {
  if (!isBrowser()) return;
  
  Cookies.set(AUTH_TOKEN_KEY, token, { 
    expires: TOKEN_EXPIRY_DAYS, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
};

export const getAuthToken = () => {
  if (!isBrowser()) return null;
  
  return Cookies.get(AUTH_TOKEN_KEY);
};

export const removeAuthToken = () => {
  if (!isBrowser()) return;
  
  Cookies.remove(AUTH_TOKEN_KEY);
  Cookies.remove(USER_ROLE_KEY);
  localStorage.removeItem(USER_ID_KEY);
};

export const isAuthenticated = () => {
  if (!isBrowser()) return false;
  
  const token = getAuthToken();
  console.log('Auth token:', token ? 'exists' : 'not found');
  return !!token;
};

export const saveUserId = async (userId: string) => {
  if (!isBrowser()) return;
  
  // Use localStorage instead of encrypted cookies for reliability
  localStorage.setItem(USER_ID_KEY, userId);
};

export const getUserId = async (): Promise<string | null> => {
  if (!isBrowser()) return null;
  
  // Get directly from localStorage
  return localStorage.getItem(USER_ID_KEY);
};

// Store user role in cookies
export const USER_ROLE_KEY = 'user_role';

export const saveUserRole = (role: string) => {
  if (!isBrowser()) return;
  
  Cookies.set(USER_ROLE_KEY, role, { 
    expires: TOKEN_EXPIRY_DAYS, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
};

export const getUserRole = (): string | null => {
  if (!isBrowser()) return null;
  
  const role = Cookies.get(USER_ROLE_KEY);
  return role || null;
};

export const hasRole = (role: string | string[]): boolean => {
  const userRole = getUserRole();
  if (!userRole) return false;
  
  if (Array.isArray(role)) {
    return role.includes(userRole);
  }
  
  return userRole === role;
};
