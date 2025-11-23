"use client";

import { AuthProvider } from "@propelauth/react";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL;
  
  // If no auth URL or it's the example URL, don't use auth provider
  if (!authUrl || authUrl.includes('example.com')) {
    console.log("PropelAuth not configured - running without authentication");
    return <>{children}</>;
  }

  return (
    <AuthProvider authUrl={authUrl}>
      {children}
    </AuthProvider>
  );
}
