// import { apiRequest } from "@/lib/queryClient";
// import { useState, useEffect } from 'react';

// export interface User {
//   id: string;
//   name: string;
//   email: string;
//   role: string;
//   address?: string;
// }

// export interface AuthResponse {
//   token: string;
//   user: User;
// }

// // Constants for localStorage keys and events
// const TOKEN_KEY = 'auth_token';
// const USER_KEY = 'current_user';
// const AUTH_CHANGE_EVENT = 'authchange';

// let currentUser: User | null = null;
// let authToken: string | null = null;

// // Initialize from localStorage on app start
// if (typeof window !== 'undefined') {
//   authToken = localStorage.getItem(TOKEN_KEY);
//   const storedUser = localStorage.getItem(USER_KEY);
//   if (storedUser) {
//     try {
//       currentUser = JSON.parse(storedUser);
//     } catch (error) {
//       console.error("Failed to parse stored user data:", error);
//       localStorage.removeItem(USER_KEY);
//     }
//   }
// }

// // Dispatch auth change event
// function dispatchAuthChange() {
//   console.log("Dispatching auth change event");
//   if (typeof window !== 'undefined') {
//     window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
//     // Also dispatch storage event for backward compatibility
//     window.dispatchEvent(new Event('storage'));
//   }
// }

// export function setAuth(token: string, user: User) {
//   console.log("Setting auth data for user:", user.email);
//   authToken = token;
//   currentUser = user;
  
//   if (typeof window !== 'undefined') {
//     localStorage.setItem(TOKEN_KEY, token);
//     localStorage.setItem(USER_KEY, JSON.stringify(user));
//     dispatchAuthChange();
//   }
// }

// export function clearAuth() {
//   console.log("Clearing auth data");
//   authToken = null;
//   currentUser = null;
  
//   if (typeof window !== 'undefined') {
//     localStorage.removeItem(TOKEN_KEY);
//     localStorage.removeItem(USER_KEY);
//     dispatchAuthChange();
//   }
// }

// export function getAuthToken(): string | null {
//   return authToken;
// }

// export function getCurrentUser(): User | null {
//   if (currentUser) return currentUser;
  
//   // Try to get from localStorage
//   if (typeof window !== 'undefined') {
//     const stored = localStorage.getItem(USER_KEY);
//     if (stored) {
//       try {
//         currentUser = JSON.parse(stored);
//         return currentUser;
//       } catch (error) {
//         console.error("Failed to parse stored user data:", error);
//         localStorage.removeItem(USER_KEY);
//       }
//     }
//   }
  
//   return null;
// }

// export function isAuthenticated(): boolean {
//   const token = getAuthToken();
//   const user = getCurrentUser();
//   const authenticated = !!(token && user);
//   console.log("Authentication check:", { token: !!token, user: !!user, authenticated });
//   return authenticated;
// }

// export function hasRole(role: string): boolean {
//   const user = getCurrentUser();
//   const hasUserRole = user && user.role === role;
//   console.log("Role check:", { userRole: user?.role, requiredRole: role, hasRole: hasUserRole });
//   return hasUserRole;
// }

// export function hasAnyRole(roles: string[]): boolean {
//   const user = getCurrentUser();
//   const hasAnyUserRole = user ? roles.includes(user.role) : false;
//   console.log("Any role check:", { userRole: user?.role, requiredRoles: roles, hasAnyRole: hasAnyUserRole });
//   return hasAnyUserRole;
// }

// // Enhanced authenticated API request with better error handling
// export async function authenticatedApiRequest(
//   method: string,
//   url: string,
//   data?: unknown,
// ): Promise<Response> {
//   const token = getAuthToken();
//   if (!token) {
//     throw new Error('No authentication token available');
//   }

//   const headers: Record<string, string> = {
//     'Authorization': `Bearer ${token}`,
//     'Content-Type': 'application/json',
//   };

//   const config: RequestInit = {
//     method,
//     headers,
//     credentials: "include",
//   };

//   if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
//     config.body = JSON.stringify(data);
//   }

//   try {
//     const response = await fetch(url, config);

//     // If unauthorized, clean up auth state and redirect
//     if (response.status === 401) {
//       console.log("Unauthorized response, cleaning up auth state");
//       clearAuth();
//       if (typeof window !== 'undefined') {
//         window.location.href = '/login';
//       }
//       throw new Error('Session expired. Please log in again.');
//     }

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       throw new Error(errorData.message || `Request failed with status: ${response.status}`);
//     }

//     return response;
//   } catch (error) {
//     console.error("Authenticated API request error:", error);
//     throw error;
//   }
// }

// export async function login(email: string, password: string): Promise<AuthResponse> {
//   try {
//     console.log("Starting login process for:", email);
    
//     const res = await apiRequest('POST', '/api/auth/login', { email, password });
//     const data = await res.json();
    
//     console.log("Login API response received");

//     if (!data.token || !data.user) {
//       throw new Error('Invalid response format from login API');
//     }

//     setAuth(data.token, data.user);
//     console.log("Login successful, user stored:", data.user.email);
    
//     return data;
//   } catch (error) {
//     console.error("Login error:", error);
//     // Clean up any partial auth state
//     clearAuth();
//     throw error;
//   }
// }

// export async function signup(userData: {
//   name: string;
//   email: string;
//   password: string;
//   address: string;
//   role: string;
//   storeName?: string;
// }): Promise<AuthResponse> {
//   try {
//     console.log("Starting signup process for:", userData.email);
    
//     const res = await apiRequest('POST', '/api/auth/signup', userData);
//     const data = await res.json();
    
//     console.log("Signup API response received");

//     if (!data.token || !data.user) {
//       throw new Error('Invalid response format from signup API');
//     }

//     setAuth(data.token, data.user);
//     console.log("Signup successful, user stored:", data.user.email);
    
//     return data;
//   } catch (error) {
//     console.error("Signup error:", error);
//     // Clean up any partial auth state
//     clearAuth();
//     throw error;
//   }
// }

// export async function updatePassword(currentPassword: string, newPassword: string): Promise<void> {
//   const response = await authenticatedApiRequest('PUT', '/api/auth/update-password', {
//     currentPassword,
//     newPassword,
//   });

//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({}));
//     throw new Error(errorData.message || 'Failed to update password');
//   }
// }

// export async function logout(): Promise<void> {
//   try {
//     console.log("Starting logout process");
    
//     // Call logout API if authenticated
//     if (isAuthenticated()) {
//       await authenticatedApiRequest('POST', '/api/auth/logout', {});
//     }
//   } catch (error) {
//     console.error("Logout API error:", error);
//     // Continue with local cleanup even if API fails
//   } finally {
//     // Always clean up local storage and redirect
//     clearAuth();
//     if (typeof window !== 'undefined') {
//       console.log("Logout completed, redirecting to login");
//       window.location.href = '/login';
//     }
//   }
// }

// // Hook for authentication state in React components
// export function useAuthState() {
//   const [authState, setAuthState] = useState(() => ({
//     isAuthenticated: isAuthenticated(),
//     currentUser: getCurrentUser(),
//     token: getAuthToken(),
//   }));

//   useEffect(() => {
//     const handleAuthChange = () => {
//       const newAuthState = {
//         isAuthenticated: isAuthenticated(),
//         currentUser: getCurrentUser(),
//         token: getAuthToken(),
//       };
//       console.log("Auth state changed in hook:", newAuthState);
//       setAuthState(newAuthState);
//     };

//     // Listen for both custom auth events and storage changes
//     if (typeof window !== 'undefined') {
//       window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
//       window.addEventListener('storage', handleAuthChange);

//       // Initial check
//       handleAuthChange();
//     }
    
//     return () => {
//       if (typeof window !== 'undefined') {
//         window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
//         window.removeEventListener('storage', handleAuthChange);
//       }
//     };
//   }, []);

//   return authState;
// }

// // Utility function to check if user is in a specific role or higher
// export function hasMinimumRole(role: 'customer' | 'vendor' | 'admin'): boolean {
//   const user = getCurrentUser();
//   if (!user) return false;

//   const roleHierarchy = ['customer', 'vendor', 'admin'];
//   const userRoleIndex = roleHierarchy.indexOf(user.role);
//   const requiredRoleIndex = roleHierarchy.indexOf(role);
  
//   return userRoleIndex >= requiredRoleIndex;
// }

// // Initialize auth state from localStorage on module load
// export function initializeAuth(): void {
//   if (typeof window !== 'undefined') {
//     const token = localStorage.getItem(TOKEN_KEY);
//     const userStr = localStorage.getItem(USER_KEY);
    
//     if (token && userStr) {
//       try {
//         const user = JSON.parse(userStr);
//         authToken = token;
//         currentUser = user;
//         console.log("Auth state initialized from localStorage:", user.email);
//       } catch (error) {
//         console.error("Failed to initialize auth state:", error);
//         clearAuth();
//       }
//     }
//   }
// }




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
