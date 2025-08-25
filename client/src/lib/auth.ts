import { apiRequest } from "@/lib/queryClient";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  address?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

let currentUser: User | null = null;
let authToken: string | null = null;

// Get token from localStorage on app start
if (typeof window !== 'undefined') {
  authToken = localStorage.getItem('auth_token');
}

export function setAuth(token: string, user: User) {
  authToken = token;
  currentUser = user;
  localStorage.setItem('auth_token', token);
  localStorage.setItem('current_user', JSON.stringify(user));
}

export function clearAuth() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('current_user');
}

export function getAuthToken(): string | null {
  return authToken;
}

export function getCurrentUser(): User | null {
  if (currentUser) return currentUser;
  
  // Try to get from localStorage
  const stored = localStorage.getItem('current_user');
  if (stored) {
    currentUser = JSON.parse(stored);
    return currentUser;
  }
  
  return null;
}

export function isAuthenticated(): boolean {
  return !!authToken && !!getCurrentUser();
}

export function hasRole(role: string): boolean {
  const user = getCurrentUser();
  return user?.role === role;
}

export function hasAnyRole(roles: string[]): boolean {
  const user = getCurrentUser();
  return user ? roles.includes(user.role) : false;
}

// Add auth token to requests
export async function authenticatedApiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token available');
  }

  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      "Authorization": `Bearer ${token}`,
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (res.status === 401) {
    // Token expired or invalid
    clearAuth();
    window.location.href = '/login';
    throw new Error('Authentication expired');
  }

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }

  return res;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiRequest('POST', '/api/auth/login', { email, password });
  const data = await res.json();
  setAuth(data.token, data.user);
  return data;
}

export async function signup(userData: {
  name: string;
  email: string;
  password: string;
  address: string;
  role: string;
  storeName?: string;
}): Promise<AuthResponse> {
  const res = await apiRequest('POST', '/api/auth/signup', userData);
  const data = await res.json();
  setAuth(data.token, data.user);
  return data;
}

export async function updatePassword(currentPassword: string, newPassword: string): Promise<void> {
  await authenticatedApiRequest('PUT', '/api/auth/update-password', {
    currentPassword,
    newPassword,
  });
}

export function logout() {
  clearAuth();
  window.location.href = '/login';
}
