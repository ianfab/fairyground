"use client";

import { useAuthInfo, useRedirectFunctions } from "@propelauth/react";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { Game } from "@/lib/types";
import { User } from "lucide-react";

export default function ProfilePage() {
  const [userGames, setUserGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // Try to use auth, but gracefully handle if it's not configured
  let isLoggedIn = false;
  let user = null;
  let authLoading = false;
  let redirectToSignupPage = () => {
    alert("PropelAuth not configured. Please set NEXT_PUBLIC_PROPELAUTH_AUTH_URL in your .env file.\n\nSee apps/web/PROPELAUTH_SETUP.md for instructions.");
  };
  let redirectToAccountPage = () => {};
  let redirectToLoginPage = () => {};

  try {
    const authInfo = useAuthInfo();
    const redirectFunctions = useRedirectFunctions();

    isLoggedIn = authInfo.isLoggedIn || false;
    user = authInfo.user;
    authLoading = authInfo.loading || false;
    redirectToSignupPage = redirectFunctions.redirectToSignupPage;
    redirectToAccountPage = redirectFunctions.redirectToAccountPage;
    redirectToLoginPage = redirectFunctions.redirectToLoginPage;
  } catch (e) {
    // Auth not configured, use defaults
    console.log("Auth not configured, using guest mode");
  }

  useEffect(() => {
    async function fetchUserGames() {
      if (!user?.userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/games");
        if (!response.ok) throw new Error("Failed to fetch games");

        const allGames: Game[] = await response.json();
        // Filter games created by this user
        const myGames = allGames.filter(game => game.creator_id === user.userId);
        setUserGames(myGames);
      } catch (error) {
        console.error("Error fetching user games:", error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchUserGames();
    }
  }, [user?.userId, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-xl text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-gray-500" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Profile</h1>
            <p className="text-gray-400 mb-8">
              You need to be logged in to view your profile.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => redirectToLoginPage()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => redirectToSignupPage()}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* User Info Section */}
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-gray-800 rounded-xl p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {user?.username || user?.email}
                </h1>
                {user?.username && (
                  <p className="text-gray-400 text-sm mb-1">{user?.email}</p>
                )}
                <p className="text-gray-400 text-sm">
                  Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => redirectToAccountPage()}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Manage Account
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-black/20 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Games Created</p>
              <p className="text-3xl font-bold">{userGames.length}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Account Type</p>
              <p className="text-3xl font-bold">
                {(user as any)?.metadata?.plan === 'paid' ? '⭐ Paid' : 'Free'}
              </p>
            </div>
          </div>
        </div>

        {/* User's Games Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Your Games</h2>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading games...</div>
          ) : userGames.length === 0 ? (
            <div className="text-center py-12 border border-gray-800 rounded-xl bg-gray-900/30">
              <p className="text-gray-400 mb-4">You haven't created any games yet.</p>
              <a
                href="/create"
                className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Create Your First Game
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userGames.map((game) => (
                <div
                  key={game.id}
                  className="p-6 rounded-xl border border-gray-800 bg-gray-900/30 hover:border-purple-500/50 transition-all"
                >
                  <h3 className="text-xl font-bold mb-2">{game.name}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                    {game.description || "No description"}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Created {new Date(game.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-3">
                    <a
                      href={`http://localhost:3001/game/${game.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-500 hover:text-purple-400"
                    >
                      Play →
                    </a>
                    <a
                      href={`/sandbox/${game.name}`}
                      className="text-sm text-blue-500 hover:text-blue-400"
                    >
                      Edit
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
