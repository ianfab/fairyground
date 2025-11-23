"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthInfo, useRedirectFunctions } from "@propelauth/react";
import { User } from "lucide-react";

export default function Navbar() {
  let isLoggedIn = false;
  let user = null;
  let redirectToLoginPage = () => {};

  try {
    const authInfo = useAuthInfo();
    const redirectFunctions = useRedirectFunctions();

    isLoggedIn = authInfo.isLoggedIn || false;
    user = authInfo.user;
    redirectToLoginPage = redirectFunctions.redirectToLoginPage;
  } catch (e) {
    // Auth not configured, use defaults
  }

  return (
    <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image
              src="/splorkguy.png"
              alt="Splork Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-2xl font-bold text-white">splork.io</span>
          </Link>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-white"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Profile</span>
              </Link>
            ) : (
              <button
                onClick={() => redirectToLoginPage()}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors text-white text-sm font-semibold"
              >
                Log In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
