"use client";

import { AuthProvider } from "@propelauth/react";
import React, { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Intercept fetch to detect and handle PropelAuth 401 errors
    const originalFetch = window.fetch;
    let errorCount = 0;
    const MAX_ERRORS = 3;

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);
      const url = args[0]?.toString() || '';

      // Detect PropelAuth refresh token 401 errors
      if (
        response.status === 401 &&
        (url.includes('propelauthtest.com') || url.includes('propelauth.com')) &&
        (url.includes('refresh') || url.includes('token'))
      ) {
        errorCount++;
        
        // If we get multiple 401s, clear the invalid tokens
        if (errorCount >= MAX_ERRORS) {
          console.warn('[Auth] Detected invalid PropelAuth tokens, clearing...');
          errorCount = 0; // Reset to prevent repeated clears
          
          try {
            Object.keys(localStorage).forEach((key) => {
              if (key.startsWith('__pa_')) {
                localStorage.removeItem(key);
              }
            });
            // Mark that we've cleared tokens so AuthProvider can reinitialize
            sessionStorage.setItem('__pa_tokens_cleared', Date.now().toString());
          } catch (e) {
            // localStorage might not be available
          }
        }
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
