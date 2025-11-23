"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthInfo, useRedirectFunctions } from "@propelauth/react";
import { AuthModal } from "./AuthModal";

export function CreateGameButton() {
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Try to use auth, but gracefully handle if it's not configured
  let isLoggedIn = false;
  let redirectToSignupPage = () => {
    alert("PropelAuth not configured. Please set NEXT_PUBLIC_AUTH_URL in your .env file.\n\nSee apps/web/PROPELAUTH_SETUP.md for instructions.");
  };

  try {
    const authInfo = useAuthInfo();
    const redirectFunctions = useRedirectFunctions();
    
    isLoggedIn = authInfo.isLoggedIn || false;
    redirectToSignupPage = redirectFunctions.redirectToSignupPage;
  } catch (e) {
    // Auth not configured, use defaults
  }

  const handleClick = () => {
    if (isLoggedIn) {
      // If logged in, go directly to create page
      router.push("/create");
    } else {
      // If not logged in, show auth modal
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-colors"
      >
        Create a Game
      </button>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        isLoggedIn={false}
        onSignup={() => redirectToSignupPage()}
      />
    </>
  );
}

