"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuthInfo, useRedirectFunctions } from "@propelauth/react";
import { User } from "lucide-react";

export default function Navbar() {
  let isLoggedIn = false;
  let user: any = null;
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
    <nav className="border-b border-gray-800 bg-black sticky top-0 z-50">
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

          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/how-it-works"
              className="hidden sm:block text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              How It Works
            </Link>

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
                className="px-3 sm:px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors text-white text-sm font-semibold"
              >
                <span className="sm:hidden">Sign Up</span>
                <span className="hidden sm:inline">Log In / Sign Up</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
