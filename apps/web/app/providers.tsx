"use client";

import { AuthProvider } from "@propelauth/react";
import React, { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL;
  const [isMounted, setIsMounted] = useState(false);

  // Clear invalid tokens on mount
  useEffect(() => {
    setIsMounted(true);

    // Listen for auth errors and clear tokens if they're invalid
    const handleAuthError = () => {
      // Clear PropelAuth tokens from localStorage
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('__pa_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (e) {
        // localStorage might not be available
      }
    };

    // Check if there's a 401 error (invalid token)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401 && args[0]?.toString().includes('refresh_token')) {
        handleAuthError();
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // If no auth URL or it's the example URL, don't use auth provider
  if (!authUrl || authUrl.includes('example.com')) {
    return <>{children}</>;
  }

  // Wait for mount to avoid hydration issues
  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <AuthProvider
      authUrl={authUrl}
    >
      {children}
    </AuthProvider>
  );
}
