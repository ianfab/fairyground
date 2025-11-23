"use client";

import { AuthProvider } from "@propelauth/react";
import React, { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL;

  // Clear invalid tokens on mount
  useEffect(() => {
    // Listen for auth errors and clear tokens if they're invalid
    const handleAuthError = () => {
      // Clear PropelAuth tokens from localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('__pa_')) {
          localStorage.removeItem(key);
        }
      });
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
    console.log("PropelAuth not configured - running without authentication");
    return <>{children}</>;
  }

  return (
    <AuthProvider
      authUrl={authUrl}
      displayIfLoggedOut={true}
    >
      {children}
    </AuthProvider>
  );
}
