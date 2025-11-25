import { useAuthInfo } from "@propelauth/react";

/**
 * Safe wrapper around useAuthInfo that handles cases where AuthProvider is not configured
 */
export function useAuthSafe() {
  try {
    return useAuthInfo();
  } catch (error) {
    // AuthProvider not configured, return empty auth state
    return {
      isLoggedIn: false,
      loading: false,
      user: null,
      orgHelper: null,
      accessHelper: null,
    };
  }
}
